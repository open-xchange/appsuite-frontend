/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/edit/main', [
    'io.ox/contacts/edit/view-form',
    'io.ox/contacts/model',
    'gettext!io.ox/contacts',
    'io.ox/core/extensions',
    'io.ox/contacts/util',
    'io.ox/core/extPatterns/dnd',
    'io.ox/core/capabilities',
    'io.ox/core/notifications',
    'io.ox/core/util',
    'less!io.ox/contacts/edit/style'
], function (view, model, gt, ext, util, dnd, capabilities, notifications, coreUtil) {

    'use strict';

    // multi instance pattern
    function createInstance(data) {

        var app, getDirtyStatus, container, editView;

        app = ox.ui.createApp({
            name: 'io.ox/contacts/edit',
            title: 'Edit Contact',
            userContent: true,
            closable: true
        });

        app.setLauncher(function () {

            var def = $.Deferred();
            var win = ox.ui.createWindow({
                name: 'io.ox/contacts/edit',
                title: 'Edit Contact',
                chromeless: true
            });

            app.setWindow(win);

            container = win.nodes.main.scrollable();

            var cont = function (data) {

                app.cid = 'io.ox/contacts/contact:edit.' + _.cid(data);

                win.show(function () {

                    var considerSaved = false;

                    function cont(contact) {
                        var appTitle = (contact.get('display_name')) ? contact.get('display_name') : util.getFullName(contact.toJSON());
                        app.setTitle(appTitle || gt('Create contact'));
                        win.setTitle(contact.has('id') ? gt('Edit contact') : gt('Create contact'));
                        app.contact = contact;
                        editView = new view.ContactEditView({ model: contact, app: app });
                        container.append(
                            editView.render().$el
                        );
                        // no autofocus on smartphone and for iOS in special (see bug #36921)
                        if (_.device('!smartphone && !iOS')) {
                            container.find('input[type=text]:visible').eq(0).focus();
                            // focus first_name if visible
                            container.find('[data-field="first_name"] input').eq(0).focus();
                        }

                        editView.on('save:start', function () {
                            win.busy();
                        });

                        editView.on('save:fail', function (e, error) {

                            // invalid data?
                            var invalid = false, field;
                            if (error && error.model) {
                                _(error.model.attributeValidity).each(function (valid, id) {
                                    if (!valid && !invalid) {
                                        field = container.find('[data-field="' + id + '"]');
                                        invalid = true;
                                    }
                                });
                            }

                            win.idle();

                            if (invalid) {
                                notifications.yell('error', gt('Some fields contain invalid data'));
                                field.get(0).scrollIntoView();
                                field = null;
                            } else {
                                notifications.yell(error);
                            }
                        });

                        editView.listenTo(contact, 'server:error', function (error) {
                            notifications.yell(error);
                        });

                        function fnToggleSave(isDirty) {
                            var node = container.find('.btn[data-action="save"]');
                            if (_.device('smartphone')) node = container.parent().parent().find('.btn[data-action="save"]');
                            if (isDirty) node.prop('disabled', false); else node.prop('disabled', true);
                        }

                        if (!data.id) {
                            editView.listenTo(contact, 'change', function () {
                                if (!getDirtyStatus) return;
                                var isDirty = getDirtyStatus();
                                fnToggleSave(isDirty);
                            });

                            if (contact.id === undefined && _.keys(contact.attributes).length <= 1) {
                                container.find('.btn[data-action="save"]').prop('disabled', true);
                            }

                            container.find('input[type="text"]').on('keyup', _.debounce(function () {
                                var isDirty = getDirtyStatus();
                                if (!isDirty && $(this).val()) {
                                    fnToggleSave(true);
                                } else if (!isDirty) {
                                    fnToggleSave(false);
                                }
                            }, 100));
                        }

                        editView.on('save:success', function (e, data) {
                            if (def.resolve) {
                                def.resolve(data);
                            }
                            considerSaved = true;
                            win.idle();
                            if (app.dropZone) app.dropZone.remove();
                            app.quit();
                        });

                        if ((_.browser.IE === undefined || _.browser.IE > 9) && capabilities.has('infostore')) {

                            app.dropZone = new dnd.UploadZone({
                                ref: 'io.ox/contacts/edit/dnd/actions'
                            }, editView);

                            app.dropZone.include();

                            win.on('show', function () {
                                if (app.dropZone) { app.dropZone.include(); }
                            });

                            win.on('hide', function () {
                                if (app && app.dropZone) {
                                    app.dropZone.remove();
                                }
                            });
                        }
                        win.on('show', function () {
                            if (contact.get('id')) {
                                //set url parameters
                                app.setState({ folder: contact.get('folder_id'), id: contact.get('id') });
                            } else {
                                app.setState({ folder: contact.get('folder_id'), id: null });
                            }
                        });

                        ext.point('io.ox/contacts/edit/main/model').invoke('customizeModel', contact, contact);

                        contact.on('change:display_name', function () {
                            var newTitle = contact.get('display_name');
                            if (!newTitle) {
                                if (contact.get('id')) {
                                    newTitle = gt('Edit Contact');
                                } else {
                                    newTitle = gt('Create contact');
                                }
                            }
                            app.setTitle(newTitle);
                        });

                        def.resolve();
                    }

                    // create model & view
                    if (data.id) {
                        model.factory.realm('edit').retain().get({
                            id: data.id,
                            folder: data.folder_id
                        })
                        .done(function (model) {
                            // fix "display_name only" contacts, e.g. in collected addresses folder
                            var data = model.toJSON();
                            if (($.trim(data.first_name) + $.trim(data.yomiFirstName) === '' &&
                                $.trim(data.last_name) + $.trim(data.yomiLastName)) === '') {
                                model.set('last_name', coreUtil.unescapeDisplayName(model.get('display_name')), { silent: true });
                            }
                            cont(model);
                        });
                    } else {
                        cont(model.factory.create(data));
                        container.find('[data-extension-id="io.ox/contacts/edit/view/display_name_header"]').text(gt('New contact'));
                    }

                    getDirtyStatus = function () {
                        var isNew = !data.id,
                            changes = app.contact.changedSinceLoading();
                        if (isNew) {
                            if (changes.display_name && (!changes.first_name && !changes.last_name)) {
                                delete changes.display_name;
                            }
                            for (var k in changes) {
                                if (changes.hasOwnProperty(k) && !changes[k]) {
                                    delete changes[k];
                                }
                            }
                        }
                        if (considerSaved) return false;
                        if (changes.folder_id && _(changes).size() === 1) return false;
                        if (changes.display_name && _(changes).size() === 1) return false;
                        return app.contact && !_.isEmpty(app.contact.changedSinceLoading());
                    };

                });
            };

            if (data) {
                // hash support
                app.setState(data.id ? { folder: data.folder_id, id: data.id }
                                     : { folder: data.folder_id });
                cont(data);
            } else {
                cont({ folder_id: app.getState().folder, id: app.getState().id });
            }

            return def;
        });

        app.setQuit(function () {
            var def = $.Deferred();

            if (getDirtyStatus()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to discard your changes?'))
                        //#. "Discard changes" appears in combination with "Cancel" (this action)
                        //#. Translation should be distinguishable for the user
                        .addPrimaryButton('delete', gt.pgettext('dialog', 'Discard changes'), 'delete',  { 'tabIndex': '1' })
                        .addButton('cancel', gt('Cancel'), 'cancel',  { 'tabIndex': '1' })
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                def.resolve();
                                model.factory.realm('edit').release();
                            } else {
                                def.reject();
                            }
                        });
                });
            } else {
                def.resolve();
                model.factory.realm('edit').release();
            }
            //clean
            return def;
        });

        app.failSave = function () {
            if (this.contact) {
                var title = this.contact.get('display_name');
                return {
                    description: gt('Contact') + (title ? ': ' + title : ''),
                    module: 'io.ox/contacts/edit',
                    point: this.contact.attributes
                };
            }
            return false;
        };

        app.failRestore = function (point) {
            if (_.isUndefined(point.id)) {
                this.contact.set(point);
            } else {
                this.contact.set(point);
                this.cid = 'io.ox/contacts/contact:edit.' + _.cid(data);
                //this.setTitle(point.title || gt('Edit Contact'));
            }
            editView.trigger('restore');
            return $.when();
        };

        ext.point('io.ox/contacts/edit/main/model').extend({
            id: 'io.ox/contacts/edit/main/model/auto_display_name',
            customizeModel: function (contact) {
                contact.on('change:first_name change:last_name change:title',
                    function (model) {
                        if (model.changed.display_name) return;
                        var mod = model.toJSON();
                        delete mod.display_name;
                        model.set('display_name', util.getFullName(mod));
                    });
            }
        });

        return app;
    }

    return {

        getApp: createInstance,

        reuse: function (type, data) {
            if (type === 'edit') {
                return ox.ui.App.reuse('io.ox/contacts/contact:edit.' + _.cid(data));
            }
        }
    };

});
