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

define('io.ox/contacts/edit/main', [
    'io.ox/contacts/edit/view',
    'gettext!io.ox/contacts',
    'io.ox/core/tk/upload',
    'io.ox/core/api/user',
    'io.ox/core/extensions',
    'io.ox/contacts/util',
    'io.ox/core/capabilities',
    'io.ox/core/notifications',
    'io.ox/core/util',
    'io.ox/core/a11y',
    'io.ox/core/yell',
    'io.ox/backbone/views/modal',
    // 'settings!io.ox/core',
    'less!io.ox/contacts/edit/style'
], function (View, gt, upload, userApi, ext, util, capabilities, notifications, coreUtil, a11y, yell, ModalDialog) {

    'use strict';

    function createInstance(data) {

        var app = ox.ui.createApp({
            name: 'io.ox/contacts/edit',
            title: gt('Edit Contact'),
            userContent: true,
            closable: true,
            floating: !_.device('smartphone'),
            size: 'width-sm'
        });

        app.setLauncher(function () {

            var win = ox.ui.createWindow({
                name: 'io.ox/contacts/edit',
                chromeless: true,
                floating: !_.device('smartphone'),
                closable: true
            });

            app.setWindow(win);

            var id, folder_id, def = $.Deferred();

            if (data) {
                id = data.id;
                folder_id = data.folder && !data.folder_id ? data.folder : data.folder_id;
                app.setState(id ? { folder: folder_id, id: id } : { folder: folder_id });
            } else {
                id = app.getState().id;
                folder_id = app.getState().folder;
            }


            var isNewContact = !id,
                // check whether we edit some contact or the current user
                isUser = String(folder_id) === '6' && String(id) === String(ox.user_id),
                view = app.view = new View({ data: { id: id, folder_id: folder_id }, isUser: isUser });

            if (isUser) {
                app.setTitle(gt('My contact data'));
            } else {
                app.setTitle(isNewContact ? gt('New contact') : gt('Edit contact'));
                view.listenTo(view.model, 'change:display_name', function () {
                    app.setTitle(util.getFullName(this.model.toJSON()) || (isNewContact ? gt('New contact') : gt('Edit Contact')));
                });
            }

            win.nodes.main.append(view.$el);

            win.setHeader(
                $('<div class="header">').append(
                    $('<button type="button" class="btn btn-primary save" data-action="save">')
                        .text(gt('Save'))
                        .on('click', function () {
                            win.busy();
                            view.model.save().then(
                                function success() {
                                    win.idle();
                                    app.quit();
                                },
                                function fail(e) {
                                    win.idle();
                                    notifications.yell(e);
                                }
                            );
                        }),
                    $('<button type="button" class="btn btn-default discard" data-action="discard">')
                        .text(gt('Discard'))
                        .on('click', function () {
                            app.quit();
                        })
                )
            );

            win.show();

            if (isNewContact) {
                view.render();
            } else {
                win.busy();
                view.model.fetch(data)
                    .fail(function (e) {
                        yell(e);
                        app.quit();
                    })
                    .done(function () {
                        win.idle();
                        view.render();
                    });
            }

            // seems to be outdated since we have floating windows
            // container = win.nodes.main.scrollable();
            // container = ;

            // var cont = function (data) {

            //     // if edit mode
            //     if (data.id) {
            //         app.cid = 'io.ox/contacts/contact:edit.' + _.cid(data);
            //     }

            //     win.show(function () {

            //         var considerSaved = false;

            //         function cont(contact) {
            //             // fix "display_name only" contacts, e.g. in collected addresses folder
            //             var data = contact.toJSON();
            //             if (($.trim(data.first_name) + $.trim(data.yomiFirstName) === '') &&
            //                 ($.trim(data.last_name) + $.trim(data.yomiLastName)) === '') {
            //                 contact.set('last_name', coreUtil.unescapeDisplayName(contact.get('display_name')), { silent: true });
            //             }

            //             if (app.userMode) {
            //                 app.setTitle(gt('My contact data'));
            //             } else {
            //                 app.setTitle(getTitle(contact));
            //                 win.setTitle(contact.has('id') ? gt('Edit contact') : gt('Create contact'));
            //             }

            //             app.contact = contact;
            //             var editViewtoUse = app.userMode ? view.protectedMethods.createContactEdit('io.ox/core/user') : view.ContactEditView;
            //             app.newView = new View({ model: new Backbone.Model(data) });
            //             app.view = editView = new editViewtoUse({ model: contact, app: app });
            //             container.append(app.newView.render().$el);
            //             // just render, no longer add
            //             editView.render();

            //             // no autofocus on smartphone and for iOS in special (see bug #36921)
            //             if (_.device('!smartphone && !iOS')) {
            //                 a11y.getTabbable(container).first().focus();
            //             }

            //             editView.on('save:start', function () {
            //                 win.busy();
            //                 // reset error marker
            //                 container.find('[data-field]').removeClass('has-error');
            //             });

            //             editView.on('save:fail', function (e, error) {

            //                 // invalid data?
            //                 var invalid = false, field;
            //                 if (error && error.model) {
            //                     _(error.model.attributeValidity).each(function (valid, id) {

            //                         if (!valid && !invalid) {
            //                             field = container.find('[data-field="' + id + '"]');
            //                             invalid = true;
            //                         }
            //                     });
            //                 }

            //                 win.idle();

            //                 if (invalid) {
            //                     if (error && _.isArray(error.error)) {
            //                         // specific errors
            //                         var allErrors = '';
            //                         _(error.error).each(function (err) {
            //                             // concat issues
            //                             allErrors += err + '\n';
            //                         });
            //                         if (allErrors) notifications.yell('error', allErrors);
            //                     } else {
            //                         // unspecific case
            //                         notifications.yell('error', gt('Some fields contain invalid data'));
            //                     }
            //                     // set error marker and scroll
            //                     field = field.addClass('has-error').get(0);
            //                     if (field) field.scrollIntoView();
            //                     field = null;
            //                 } else {
            //                     notifications.yell(error);
            //                 }
            //             });

            //             editView.listenTo(contact, 'server:error', function (error) {
            //                 notifications.yell(error);
            //             });

            //             function fnToggleSave(isDirty) {
            //                 var node = win.nodes.footer.find('.btn[data-action="save"]');
            //                 if (_.device('smartphone')) node = container.parent().parent().find('.btn[data-action="save"]');
            //                 node.prop('disabled', !isDirty);
            //             }

            //             if (!data.id) {
            //                 editView.listenTo(contact, 'change', function () {
            //                     if (!getDirtyStatus) return;
            //                     var isDirty = getDirtyStatus();
            //                     fnToggleSave(isDirty);
            //                 });

            //                 if (contact.id === undefined && _.values(_(contact.attributes).compact()).length <= 1) {
            //                     win.nodes.footer.find('.btn[data-action="save"]').prop('disabled', true);
            //                 }

            //                 container.find('input[type="text"]').on('keyup', _.debounce(function () {
            //                     var isDirty = getDirtyStatus();
            //                     if (!isDirty && $(this).val()) {
            //                         fnToggleSave(true);
            //                     } else if (!isDirty) {
            //                         fnToggleSave(false);
            //                     }
            //                 }, 100));
            //             }

            //             editView.on('save:success', function (e, data) {
            //                 if (def.resolve) {
            //                     def.resolve(data);
            //                 }
            //                 considerSaved = true;
            //                 win.idle();
            //                 app.quit();
            //             });

            //             if (settings.get('features/PIMAttachments', capabilities.has('filestore'))) {
            //                 // using parent here cause it's top padding affects 'getDimensions'
            //                 app.view.$el.parent().append(
            //                     new upload.dnd.FloatingDropzone({
            //                         app: app,
            //                         point: 'io.ox/contacts/edit/dnd/actions'
            //                     }).render().$el
            //                 );
            //             }
            //             win.on('show', function () {
            //                 if (contact.get('id')) {
            //                     //set url parameters
            //                     app.setState({ folder: contact.get('folder_id'), id: contact.get('id') });
            //                 } else {
            //                     app.setState({ folder: contact.get('folder_id'), id: null });
            //                 }
            //             });

            //             ext.point('io.ox/contacts/edit/main/model').invoke('customizeModel', contact, contact);

            //             contact.on('change:first_name change:last_name change:display_name', function () {
            //                 app.setTitle(getTitle(contact));
            //             });

            //             def.resolve();
            //         }

            //         // create model & view
            //         if (data.id) {
            //             app.userMode = data.id === data.user_id || (data.folder === '6' && data.id === String(ox.user_id));
            //             var factory = app.userMode ? model.protectedMethods.buildFactory('io.ox/core/user/model', userApi) : model.factory;

            //             factory.realm('edit').retain().get({
            //                 id: data.id,
            //                 folder: data.folder_id
            //             })
            //             .done(function (model) {
            //                 cont(model);
            //             });
            //         } else {
            //             cont(model.factory.create(data));
            //             container.find('[data-extension-id="io.ox/contacts/edit/view/display_name_header"]').text(gt('New contact'));
            //         }

            //         getDirtyStatus = function () {
            //             var isNew = !data.id,
            //                 changes = app.contact.changedSinceLoading();
            //             if (isNew) {
            //                 if (changes.display_name && (!changes.first_name && !changes.last_name)) {
            //                     delete changes.display_name;
            //                 }
            //                 for (var k in changes) {
            //                     if (changes.hasOwnProperty(k) && !changes[k]) {
            //                         delete changes[k];
            //                     }
            //                 }
            //             }
            //             if (considerSaved) return false;
            //             if (changes.folder_id && _(changes).size() === 1) return false;
            //             if (changes.display_name && _(changes).size() === 1) return false;
            //             return app.contact && !_.isEmpty(app.contact.changedSinceLoading());
            //         };

            //     });
            // };

            return def;
        });

        app.setQuit(function () {

            if (!this.view.model.isDirty()) return $.when();

            var def = $.Deferred();

            if (this.getWindow().floating) {
                this.getWindow().floating.toggle(true);
            } else if (_.device('smartphone')) {
                this.getWindow().resume();
            }

            //#. "Discard changes" appears in combination with "Cancel" (this action)
            //#. Translation must be distinguishable for the user
            new ModalDialog({ title: gt('Do you really want to discard your changes?') })
                .addCancelButton()
                .addButton({ label: gt.pgettext('dialog', 'Discard changes'), action: 'delete' })
                .on('action', function (action) {
                    if (action === 'delete') def.resolve(); else def.reject();
                })
                .open();

            return def;
        });

        app.failSave = function () {
            // if (this.contact) {
            //     var title = this.contact.get('display_name'),
            //         savePoint = {
            //             description: gt('Contact') + (title ? ': ' + title : ''),
            //             module: 'io.ox/contacts/edit',
            //             point: _.omit(this.contact.attributes, 'crop', 'pictureFile', 'pictureFileEdited'),
            //             passPointOnGetApp: true
            //         };

            //     return savePoint;
            // }
            return false;
        };

        app.failRestore = function () {
            // if (_.isUndefined(point.id)) {
            //     this.contact.set(point);
            // } else {
            //     this.contact.set(point);
            //     this.cid = 'io.ox/contacts/contact:edit.' + _.cid(data);
            //     //this.setTitle(point.title || gt('Edit Contact'));
            // }
            // editView.trigger('restore');
            return $.when();
        };

        app.getContextualHelp = function () {
            return this.userMode ? 'ox.appsuite.user.sect.settings.personaldata.html' : 'ox.appsuite.user.sect.contacts.gui.create.html';
        };

        // ext.point('io.ox/contacts/edit/main/model').extend({
        //     id: 'io.ox/contacts/edit/main/model/auto_display_name',
        //     customizeModel: function (contact) {
        //         contact.on('change:first_name change:last_name change:title',
        //             function (model) {
        //                 if (model.changed.display_name) return;
        //                 var mod = model.toJSON();
        //                 delete mod.display_name;
        //                 model.set('display_name', util.getFullName(mod));
        //             });
        //     }
        // });

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
