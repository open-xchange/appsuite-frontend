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

define('io.ox/contacts/distrib/main',
    ['io.ox/contacts/api',
     'io.ox/contacts/model',
     'io.ox/contacts/distrib/create-dist-view',
     'gettext!io.ox/contacts',
     'less!io.ox/contacts/distrib/style.less'
    ], function (api, contactModel, ContactCreateDistView, gt) {

    'use strict';

    // multi instance pattern
    function createInstance(data) {

        var app,
            win,
            container,
            model,
            view,
            considerSaved = false,
            initialDistlist;

        app = ox.ui.createApp({
            name: 'io.ox/contacts/distrib',
            title: gt('Distribution List'),
            userContent: true,
            closable: true
        });

        app.create = function (folderId, initdata) {

            initialDistlist = _.extend({
                    mark_as_distributionlist: true,
                    last_name: ''
                },
                data || {}, { folder_id: folderId }
            );

            // set title, init model/view
            win.setTitle(gt('Create distribution list'));

            if (initdata) {
                model = contactModel.factory.create({
                    folder_id: folderId,
                    mark_as_distributionlist: true,
                    distribution_list: initdata.distribution_list,
                    last_name: ''
                });
            } else {
                model = contactModel.factory.create(initialDistlist);
            }

            view = new ContactCreateDistView({ model: model });

            view.on('save:start', function () {
                win.busy();
            });

            view.on('save:fail', function () {
                require('io.ox/core/notifications').yell('error', gt('Failed to save distribution list.'));
                win.idle();
            });

            view.on('save:success', function () {
                require('io.ox/core/notifications').yell('success', gt('Distribution list has been saved'));
                considerSaved = true;
                win.idle();
                app.quit();
            });
            win.on('show', function () {
                if (model.get('id')) {//set url parameters
                    app.setState({ folder: model.get('folder_id'), id: model.get('id') });
                } else {
                    app.setState({ folder: model.get('folder_id'), id: null});
                }
            });

            // go!
            container.append(view.render().$el);
            win.show();
        };

        app.edit = function (obj) {

            app.cid = 'io.ox/contacts/group:edit.' + _.cid(obj);
            return contactModel.factory.realm('edit').retain().get(api.reduce(obj)).done(function (data) {

                // actually data IS a model
                model = data;

                // set state
                app.setState({ folder: model.get('folder_id'), id: model.get('id') });

                app.setTitle(model.get('display_name'));

                view = new ContactCreateDistView({ model: model });

                view.on('save:start', function () {
                    win.busy();
                });

                view.on('save:fail', function () {
                    win.idle();
                });

                view.on('save:success', function () {
                    considerSaved = true;
                    win.idle();
                    app.quit();
                });
                win.on('show', function () {
                    if (model.get('id')) {//set url parameters
                        app.setState({ folder: model.get('folder_id'), id: model.get('id') });
                    } else {
                        app.setState({ folder: model.get('folder_id'), id: null});
                    }
                });

                // go!
                container.append(view.render().$el);
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
                container.find('.btn[data-action="save"]').prop('disabled', !isDirty);
            }

            win.on('show', function () {
                if (!container.find('[data-extension-id="displayname"] input').val()) {
                    container.find('.btn[data-action="save"]').prop('disabled', true);
                }
                container.find('input[type=text]:visible').eq(0).focus();
                container.find('[data-extension-id="displayname"] input').on('keyup', _.debounce(function () {
                    app.setTitle(_.noI18n($.trim($(this).val())) || gt('Distribution List'));
                    fnToggleSave($(this).val());
                }, 150));
            });

            container = $('<div>').addClass('create-distributionlist container default-content-padding');

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
            if (model.isDirty() && considerSaved === false) {
                if (_.isEqual(initialDistlist, model.changedSinceLoading())) {
                    def.resolve();
                } else {
                    require(['io.ox/core/tk/dialogs'], function (dialogs) {
                        new dialogs.ModalDialog()
                            .text(gt('Do you really want to discard your changes?'))
                            .addPrimaryButton('delete', gt('Discard'), 'delete', {'tabIndex': '1'})
                            .addButton('cancel', gt('Cancel'), 'cancel', {'tabIndex': '1'})
                            .show()
                            .done(function (action) {
                                if (action === 'delete') {
                                    model.factory.realm('edit').release();
                                    def.resolve();
                                } else {
                                    // biggeleben: maybe we need a better function here
                                    // actually I just want to reset the current model
                                    // see https://bugs.open-xchange.com/show_bug.cgi?id=26184
                                    model.factory.realm('edit').destroy();
                                    def.reject();
                                }
                            });
                    });
                }

            } else {
                model.factory.realm('edit').release();
                def.resolve();
            }

            //clean
            return def;
        });

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
