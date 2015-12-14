/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/contacts/distrib/main', [
    'io.ox/contacts/api',
    'io.ox/contacts/model',
    'io.ox/contacts/distrib/create-dist-view',
    'gettext!io.ox/contacts',
    'less!io.ox/contacts/distrib/style'
], function (api, contactModel, ContactCreateDistView, gt) {

    'use strict';

    // multi instance pattern
    function createInstance(data) {

        var app,
            win,
            container,
            considerSaved = false,
            initialDistlist;

        app = ox.ui.createApp({
            name: 'io.ox/contacts/distrib',
            title: gt('Distribution List'),
            userContent: true,
            closable: true
        });

        app.create = function (folderId, initdata) {

            initialDistlist = _.extend({ mark_as_distributionlist: true, last_name: '' }, data || {}, { folder_id: folderId });

            // set title, init model/view
            win.setTitle(gt('Create distribution list'));

            if (initdata) {
                app.model = contactModel.factory.create({
                    display_name: initdata.display_name ? initdata.display_name : '',
                    folder_id: folderId,
                    mark_as_distributionlist: true,
                    distribution_list: initdata.distribution_list,
                    last_name: ''
                });
            } else {
                app.model = contactModel.factory.create(initialDistlist);
            }

            app.view = new ContactCreateDistView({
                model: app.model,
                app: this
            });

            function quit() {
                app.quit();
            }

            app.model.on({
                'sync:start': function () {
                    win.busy();
                },
                'sync': function () {
                    var lfoquit = _.lfo(quit);
                    require('io.ox/core/notifications').yell('success', gt('Distribution list has been saved'));
                    considerSaved = true;
                    win.idle();
                    // quit app after last sync event was handled
                    lfoquit();
                },
                'sync:fail': function (response) {
                    require('io.ox/core/notifications').yell('error', response.error ? response.error : gt('Failed to save distribution list.'));
                    win.idle();
                }
            });

            win.on('show', function () {
                if (app.model.get('id')) {
                    //set url parameters
                    app.setState({ folder: app.model.get('folder_id'), id: app.model.get('id') });
                } else {
                    app.setState({ folder: app.model.get('folder_id'), id: null });
                }
            });

            // go!
            container.append(app.view.render().$el);
            win.show();
        };

        app.edit = function (obj) {

            app.cid = 'io.ox/contacts/group:edit.' + _.cid(obj);
            return contactModel.factory.realm('edit').retain().get(api.reduce(obj)).done(function (data) {

                // actually data IS a model
                app.model = data;

                // set state
                app.setState({ folder: app.model.get('folder_id'), id: app.model.get('id') });

                app.setTitle(app.model.get('display_name'));

                // set title, init model/view
                win.setTitle(gt('Edit distribution list'));

                app.view = new ContactCreateDistView({ model: app.model, app: app });

                app.model.on({
                    'sync:start': function () {
                        win.busy();
                    },
                    'sync': function () {
                        require('io.ox/core/notifications').yell('success', gt('Distribution list has been saved'));
                        considerSaved = true;
                        win.idle();
                        app.quit();
                    },
                    'sync:fail': function (response) {
                        require('io.ox/core/notifications').yell('error', response.error ? response.error : gt('Failed to save distribution list.'));
                        win.idle();
                    }
                });

                win.on('show', function () {
                    if (app.model.get('id')) {
                        //set url parameters
                        app.setState({ folder: app.model.get('folder_id'), id: app.model.get('id') });
                    } else {
                        app.setState({ folder: app.model.get('folder_id'), id: null });
                    }
                });

                // go!
                container.append(app.view.render().$el);
                win.show();
            });
        };

        app.setLauncher(function () {

            app.setWindow(win = ox.ui.createWindow({
                title: '',
                chromeless: true,
                name: 'io.ox/contacts/distrib'
            }));

            function fnToggleSave(isDirty) {
                app.getWindow().nodes.header.find('.btn[data-action="save"]').prop('disabled', !isDirty);
            }

            win.on('show', function () {
                if (!container.find('[data-extension-id="displayname"] input').val()) {
                    app.getWindow().nodes.header.find('.btn[data-action="save"]').prop('disabled', true);
                }
                // no autofocus on smartphone and for iOS in special (see bug #36921)
                if (_.device('!smartphone && !iOS')) {
                    container.find('input[type=text]:visible').eq(0).focus();
                }
                container.find('[data-extension-id="displayname"] input').on('keyup', _.debounce(function () {
                    app.setTitle(_.noI18n($.trim($(this).val())) || gt('Distribution List'));
                    fnToggleSave($(this).val());
                }, 150));
            });

            container = $('<div>').addClass('create-distributionlist container');

            win.nodes.main.addClass('scrollable').append(container);

            // hash state support
            var state = app.getState();
            if ('id' in state) {
                app.edit(state);
            } else if ('folder' in state) {
                app.create(state.folder);
            }
        });

        app.setQuit(function () {
            var def = $.Deferred();
            if (app.model.isDirty() && considerSaved === false) {
                if (_.isEqual(initialDistlist, app.model.changedSinceLoading())) {
                    def.resolve();
                } else {
                    require(['io.ox/core/tk/dialogs'], function (dialogs) {
                        new dialogs.ModalDialog()
                            .text(gt('Do you really want to discard your changes?'))
                            //#. "Discard changes" appears in combination with "Cancel" (this action)
                            //#. Translation should be distinguishable for the user
                            .addPrimaryButton('delete', gt.pgettext('dialog', 'Discard changes'), 'delete', { 'tabIndex': '1' })
                            .addButton('cancel', gt('Cancel'), 'cancel', { 'tabIndex': '1' })
                            .show()
                            .done(function (action) {
                                if (action === 'delete') {
                                    app.model.factory.realm('edit').release();
                                    def.resolve();
                                } else {
                                    // NOTE: biggeleben: maybe we need a better function here
                                    // actually I just want to reset the current model
                                    // see Bug 26184 - [L3] Contact in Distribution list will still be deleted although the removal of the contact in edit mode was cancelled
                                    app.model.factory.realm('edit').destroy();
                                    def.reject();
                                }
                            });
                    });
                }

            } else {
                app.model.factory.realm('edit').release();
                def.resolve();
            }

            //clean
            return def;
        });

        // TODO: fix me
        // app.failSave = function () {
        //     if (model) {
        //         var title = model.get('display_name');
        //         return {
        //             description: gt('Distribution List') + (title ? ': ' + title : ''),
        //             module: 'io.ox/contacts/distrib',
        //             point: model.attributes
        //         };
        //     }
        //     return false;
        // };

        // app.failRestore = function (point) {
        //     if (_.isUndefined(point.id)) {
        //         this.create(point.folder_id, point);
        //     } else {
        //         this.edit(point);
        //     }
        //     return $.when();
        // };

        return app;
    }

    return {

        getApp: createInstance,

        reuse: function (type, data) {
            if (type === 'edit') {
                return ox.ui.App.reuse('io.ox/contacts/group:edit.' + _.cid(data));
            }
        }
    };

});
