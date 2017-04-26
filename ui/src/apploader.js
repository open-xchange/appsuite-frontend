$(window).load(function () {

    'use strict';

    console.log('loading done');

    // ugly device hack
    // if device small wait 10ms check again
    // maybe the check was made too early could be wrong
    // desktop was recognized as mobile in some cases because of this
    if (_.device('smartphone')) {
        setTimeout(function () { _.recheckDevice(); }, 10);
    }

    //
    // Turn global "ox" into an event hub
    //

    _.extend(ox, Backbone.Events);

    //
    // teach require.js to use deferred objects
    //

    (function (require) {

        function fallback(error) {
            console.error('require: Error in ' + error.requireModules, error.stack);
        }

        window.require = function (deps, success, fail) {

            if (_.isArray(deps)) {
                // use deferred object
                _(deps).each(function (name) {
                    $(window).trigger('require:require', name);
                });
                var def = $.Deferred().done(success).fail(fail || fallback);
                require(deps, def.resolve, def.reject);
                return def.promise();
            }
            // bypass
            return require.apply(this, arguments);
        };

        _.extend(window.require, require);
    }(window.require));

    var message, focus;
    $('body').append(window.name, message = $('<div class="message">'), focus = $('<div class="focus">'));
    require(['io.ox/core/windowManager.js'], function () {
        require(['io.ox/core/windowManager'], function () {
            ox.on('windowOpened', function (win) {
                console.log('window opened', win.name);
                message.append($('<button class="btn btn-primary">').attr('data-window-id', win.name).text('message to ' + win.name).on('click', function () {
                    ox.windowManager.broadcastTo('Hello ' + win.name, win.name);
                }));
                focus.append($('<button class="btn btn-primary">').attr('data-window-id', win.name).text('focus ' + win.name).on('click', function () {
                    ox.windowManager.get(win.name).focus();
                }));
            });
            ox.on('windowClosed', function (win) {
                console.log('window closed', win.name);
                $('body').find('[data-window-id="' + win.name + '"]').remove();
            });
            $('body').append($('<button class="btn btn-primary">').text('message to all').on('click', function () {
                ox.windowManager.broadcastTo('Hello to all');
            }));
            $('body').append($('<button class="btn btn-primary">').text('open new window').on('click', function () {
                ox.windowManager.openAppInWindow({
                    name: 'test-app'
                });
            }));

            _(ox.windowManager.windows).each(function (win) {
                if (win.name !== window.name) {
                    message.append($('<button class="btn btn-primary">').attr('data-window-id', win.name).text('message to ' + win.name).on('click', function () {
                        ox.windowManager.broadcastTo('Hello ' + win.name, win.name);
                    }));
                    focus.append($('<button class="btn btn-primary">').attr('data-window-id', win.name).text('focus ' + win.name).on('click', function () {
                        // bug in chrome, focus doesn't shift https://bugs.chromium.org/p/chromium/issues/detail?id=1383
                        // window open with windowname would work but documents is using window.name for their restore functionality
                        ox.windowManager.get(win.name).focus();
                    }));
                }
            });
        });
    });
});
