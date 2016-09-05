define('io.ox.saml/register',
[
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'io.ox/core/http',
    'io.ox/core/capabilities',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core',
    'io.ox/core/relogin',
    'io.ox.saml/handlers',
],
function (ext, settings, http, caps, dialogs, gt, relogin) {

    var queue = [], pending = false;

    function getReason(error) {
        return error && error.code === 'SES-0205' ?
            gt('Your IP address has changed') :
            gt('Your session is expired');
    }

    function getLogoutLocation() {
        var location = caps.has('guest') ?
            settings.get('customLocations/guestLogout') || ox.serverConfig.guestLogoutLocation :
            settings.get('customLocations/logout') || ox.serverConfig.logoutLocation;
        return _.url.vars(location || ox.logoutLocation || '');
    }

    function gotoLogoutLocation() {
        _.url.redirect(getLogoutLocation());
    }

    if (ox.serverConfig.samlLogin) {
        ox.off('relogin:required', relogin);
        
        ox.on('relogin:required', function (request, deferred, error) {

            if (!ox.online) return;
            /*
            return $.get(ox.apiRoot + '/saml/init?flow=relogin').done(function (data) {
                var baton = new ext.Baton({data: data});
                 ext.point('io.ox.saml/relogin').invoke('handle', baton, baton);
            });
            */
            if (!pending) {
                // enqueue last request
                queue = (request && deferred) ? [{ request: request, deferred: deferred }] : [];

                // set flag
                pending = true;
                
                var callbackName = 'saml_response';
                $.get(ox.apiRoot + '/saml/init?flow=relogin&respondWith=callback&callback=' + callbackName).done(function (data) {
                    var dialog = new dialogs.ModalDialog({ easyOut: false, async: true, width: 600});
                    window['callback_' + callbackName] = function (response) {
                        delete window['callback_' + callbackName];
                        dialog.close();
                        // TODO: error handling
                        require('io.ox/core/session').set(response);

                        // process queue
                        var i = 0, item;
                        for (; (item = queue[i]); i++) {
                            if (!item.request.noRetry) {
                                http.retry(item.request)
                                    .done(item.deferred.resolve)
                                    .fail(item.deferred.fail);
                            }
                        }
                        // set flag
                        pending = false;
                        ox.trigger('relogin:success');
                    };

                    var frameOptions = {
                        name: 'Login Required',
                        id: 'samlLoginFrame',
                        style: 'border-style: none; width: 100%; height: 800px;',
                        src: data.redirect_uri
                    };

                    dialog.build(function () {
                        this.getPopup().addClass('relogin');
                        this.getHeader().append(
                            $('<h4>').text(getReason(error)),
                            $('<div>').text(gt('Please sign in again to continue'))
                        );
                        this.getContentNode().append(
                            $('<iframe>', frameOptions)
                        );
                    })
                    .addPrimaryButton('cancel', gt('Cancel'))
                    .on('cancel', function () {
                        ox.trigger('relogin:cancel');
                        gotoLogoutLocation();
                    })
                    .show();
                });                
            } else if (request && deferred) {
                // enqueue last request
                queue.push({ request: request, deferred: deferred });
            }
            
        });
    }

    if (caps.has('saml-single-logout')) {
        ext.point('io.ox/core/logout').extend({
            id: 'saml_logout',
            index: 'last',
            logout: function () {
                var def = $.Deferred();
                $.get(ox.apiRoot + '/saml/init?flow=logout&session=' + ox.session).done(function (data) {
                    var baton = new ext.Baton({data: data});
                    ext.point('io.ox.saml/logout').invoke('handle', baton, baton);
                }).fail(def.reject);
                return def; // Hack to stop all further processing. This is never resolved.
            }
        });
    }
});
