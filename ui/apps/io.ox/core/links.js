/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/links', [
    'io.ox/core/yell',
    'io.ox/core/capabilities'
], function (yell, capabilities) {

    'use strict';

    // open app with given folder
    function openFolder(app, id) {
        // open files app
        require(['io.ox/core/folder/api'], function (api) {
            api.get(id).then(
                function () {
                    ox.launch(app, { folder: id }).done(function () {
                        // set proper folder
                        if (app === 'io.ox/calendar/main') this.folders.setOnly(id);
                        else if (this.folder.get() !== id) this.folder.set(id);
                    });
                },
                yell
            );
        });
    }

    //
    // Generic app
    //
    var appHandler = function (e) {
        e.preventDefault();
        var data = $(this).data(),
            params = _.deserialize(data.all.match(/#.*/)[0]),
            isOffice = /^io.ox\/office\//.test(data.app),
            // special handling for text and spreadsheet
            options = isOffice ?
                { action: 'load', file: { folder_id: data.folder, id: data.id }, params: params } :
                _(data).pick('folder', 'folder_id', 'id', 'cid');

        if (isOffice && ox.tabHandlingEnabled) {
            return require(['io.ox/core/api/tab'], function (tabApi) {
                tabApi.openChildTab(data.all);
            });
        }

        ox.launch(data.app + '/main', options).done(function () {
            // special handling for settings (bad, but apparently solved differently)
            if (_.isFunction(this.setSettingsPane)) this.setSettingsPane(options);
            // set proper folder
            else if (data.folder && this.folder.get() !== data.folder) this.folder.set(data.folder);
        });
    };

    $(document).on('click', '.deep-link-app', appHandler);

    //
    // Files
    //
    var filesHandler = function (e) {
        e.preventDefault();
        var data = $(this).data();
        if (data.id) {
            // open file in viewer
            require(['io.ox/core/viewer/main', 'io.ox/files/api'], function (Viewer, api) {
                api.get(_(data).pick('folder', 'id')).then(
                    function sucess(data) {
                        var viewer = new Viewer();
                        viewer.launch({ files: [data] });
                    },
                    // fail
                    yell
                );
            });
        } else {
            openFolder('io.ox/files/main', data.folder);
        }
    };
    $(document).on('click', '.deep-link-files', filesHandler);

    //
    // Address book
    //
    var contactsHandler = function (e) {
        e.preventDefault();
        var data = $(this).data();
        ox.launch('io.ox/contacts/main', { folder: data.folder }).done(function () {
            var app = this, folder = data.folder, id = String(data.id || '').replace(/\//, '.');
            if (app.folder.get() === folder) {
                app.getGrid().selection.set(id);
            } else {
                app.folder.set(folder).done(function () {
                    app.getGrid().selection.set(id);
                });
            }
        });
    };

    $(document).on('click', '.deep-link-contacts', contactsHandler);

    //
    // Calendar
    //
    var calendarHandler = function (e) {
        e.preventDefault();
        var data = $(this).data();
        if (data.id) {
            ox.load(['io.ox/core/tk/dialogs', 'io.ox/calendar/api', 'io.ox/calendar/view-detail', 'io.ox/core/folder/api']).done(function (dialogs, api, view, folderApi) {
                var sidepopup = new dialogs.SidePopup({ arrow: true, tabTrap: true });

                sidepopup.show(e, function (popup) {
                    popup.busy();
                    // fix special id format
                    if (/^\d+\/\d+.\d+$/.test(data.id)) {
                        data = api.cid(data.id.replace(/\//, '.'));
                    }
                    api.get(data).then(
                        function success(data) {
                            // some invitation mails contain links to events where the participant has no reading rights. We don't know until we check, as this data is not part of the appointment.
                            // folder data is used to determine if the this is a shared folder and the folder owner must be used when confirming instead of the logged in user
                            folderApi.get(data.get('folder')).always(function (result) {
                                popup.idle().append(view.draw(data, { container: popup, noFolderCheck: result.error !== undefined }));
                            });
                        },
                        function fail(e) {
                            sidepopup.close();
                            yell(e);
                        }
                    );
                });
            });
        } else {
            //  if the calendar app was already started and this folder is not in the folder list, it's either invalid or our data is outdated. Get current data to be sure.
            if (data.folder && ox.ui.apps.get('io.ox/calendar').get('state') === 'running') {
                require(['io.ox/core/folder/api'], function (api) {
                    if ((api.pool.collections['flat/event/private'] && api.pool.collections['flat/event/private'].has(data.folder)) ||
                    (api.pool.collections['flat/event/shared'] && api.pool.collections['flat/event/shared'].has(data.folder)) ||
                    (api.pool.collections['flat/event/public'] && api.pool.collections['flat/event/public'].has(data.folder))) {

                        openFolder('io.ox/calendar/main', data.folder);
                        return;
                    }
                    // open folder no matter the result. Will at least open the correct app and show the default folder
                    api.flat({ module: 'event', cache: false }).always(function () {
                        openFolder('io.ox/calendar/main', data.folder);
                    });
                });
                return;
            }

            openFolder('io.ox/calendar/main', data.folder);
        }
    };

    $(document).on('click', '.deep-link-calendar', calendarHandler);

    //
    // Tasks
    //
    var tasksHandler = function (e) {
        e.preventDefault();
        var data = $(this).data();
        ox.launch('io.ox/tasks/main', { folder: data.folder }).done(function () {
            var app = this,
                folder = data.folder,
                id = String(data.id || '').replace(/\//, '.'),
                cid = id.indexOf('.') > -1 ? id : _.cid({ folder: folder, id: id });

            $.when()
                .then(function () {
                    // set folder
                    if (!app.folder.get() === folder) return app.folder.set(folder);
                })
                .then(function () {
                    // select item
                    if (id) return app.getGrid().selection.set(cid);
                });
        });
    };

    $(document).on('click', '.deep-link-tasks', tasksHandler);

    //
    // Mail
    //

    var mailHandler = function (e) {
        e.preventDefault();

        var node = $(this), data = node.data(), address, name, tmp, params = {};

        require(['io.ox/mail/sanitizer', 'settings!io.ox/mail'], function (sanitizer, mailSettings) {

            // has data?
            if (data.address) {
                // use existing address and name
                address = data.address;
                name = data.name || data.address;
            } else {
                // parse mailto string
                // cut off leading "mailto:" and split at "?"
                tmp = node.attr('href').substr(7).split(/\?/, 2);
                // address
                address = tmp[0];
                //  use the address as display name because it is not sure that the text is the name
                name = tmp[0];
                // process additional parameters; all lower-case (see bug #31345)
                params = _.deserialize(tmp[1]);
                for (var key in params) params[key.toLowerCase()] = params[key];
                // fix linebreaks in mailto body (OXUIB-776)
                if (params.body && mailSettings.get('messageFormat') !== 'text') params.body = params.body.replace(/\n/g, '<br>');
            }

            // go!
            ox.registry.call('mail-compose', 'open', {
                to: [[name, address]],
                subject: params.subject || '',
                content: sanitizer.sanitize({ content: params.body || '', content_type: 'text/html' }, { WHOLE_DOCUMENT: false }).content
            });
        });
    };

    //
    // GDPR direct link to settings page
    //
    var gdprHandler = function (e) {
        e.preventDefault();
        var data = $(this).data();
        require(['io.ox/settings/personalData/api'], function (gdprAPI) {
            // this triggers a redraw of the view if it was drawn before (usually this is only done on 'refresh^')
            gdprAPI.trigger('updateStatus');
        });

        ox.launch('io.ox/settings/main', { folder: data.folder }).done(function () {
            // special handling for settings (bad, but apparently solved differently)
            this.setSettingsPane({ folder: data.folder });
        });
    };

    $(document).on('click', '.deep-link-gdpr', gdprHandler);

    if (capabilities.has('webmail')) {
        $(document).on('click', '.mailto-link', mailHandler);
    }

    // event hub
    ox.on('click:deep-link-mail', function (e, scope) {
        var types = e.currentTarget.className.split(' ');

        if (types.indexOf('deep-link-files') >= 0) filesHandler.call(scope, e);
        else if (types.indexOf('deep-link-contacts') >= 0) contactsHandler.call(scope, e);
        else if (types.indexOf('deep-link-calendar') >= 0) calendarHandler.call(scope, e);
        else if (types.indexOf('deep-link-tasks') >= 0) tasksHandler.call(scope, e);
        else if (types.indexOf('deep-link-gdpr') >= 0) gdprHandler.call(scope, e);
        else if (types.indexOf('deep-link-app') >= 0) appHandler.call(scope, e);
        else if (types.indexOf('mailto-link') >= 0) mailHandler.call(scope, e);
    });

});
