/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/contacts/edit/main', [
    'io.ox/contacts/edit/view',
    'gettext!io.ox/contacts',
    'io.ox/contacts/util',
    'io.ox/core/a11y',
    'io.ox/core/yell',
    'io.ox/backbone/views/modal',
    'io.ox/core/folder/api',
    'io.ox/core/folder/util',
    // 'settings!io.ox/core',
    'less!io.ox/contacts/edit/style'
], function (View, gt, util, a11y, yell, ModalDialog, folderApi, folderUtils) {

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

            var def = $.Deferred();

            if (data) {
                // we start with data from a save point
                app.setState(data.id ? { folder: data.folder_id, id: data.id } : { folder: data.folder_id });
            } else {
                // clean start / id might still be undefined
                data = { id: app.getState().id, folder_id: app.getState().folder };
            }

            folderApi.get(data.folder_id).always(function (folderData) {
                var isNewContact = !data.id,
                    // check whether we edit some contact or the current user. 6 is gab 16 is guest user
                    isUser = (String(data.folder_id) === util.getGabId(true) || String(data.folder_id) === '16') && String(data.id) === String(ox.user_id),
                    isPublic = folderData && !folderData.error && folderUtils.is('public', folderData),
                    view = app.view = new View({ data: data, isUser: isUser, isPublic: isPublic });

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
                                        yell(e);
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

                win.show(onWindowShow);

                function onWindowShow() {

                    if (isNewContact) {
                        view.render();
                        onRender();
                    } else {
                        win.busy();
                        view.model.fetch(data)
                            .fail(function (e) {
                                yell(e);
                                app.quit();
                                def.reject();
                            })
                            .done(function () {
                                // after inital fetch
                                view.model.resetDirty();
                                win.idle();
                                view.render();
                                onRender();
                            });
                    }
                }

                function onRender() {

                    // if edit mode
                    if (data.id) {
                        app.cid = 'io.ox/contacts/contact:edit.' + _.cid(data);
                    }

                    // no autofocus on smartphone and for iOS in special (see bug #36921)
                    if (_.device('!smartphone && !iOS')) {
                        a11y.getTabbable(view.$el).first().focus();
                    }

                    def.resolve();
                }

                // TODO (pre-hardeing)
                // - fail save & restore -> DONE
                // - support for Furigana -> DONE
                // - support for YOMI fields -> DONE
                // - fix "display_name only" contacts, e.g. in collected addresses folder -> DONE
                // - too much code for disabling "Save"; just show it (cp. https://axesslab.com/disabled-buttons-suck/) -> DONE
                // - a11y (make automated audits happy) -> DONE
                // - Smartphone support (it looks okay) -> DONE
                // - check server-side errors
                // - support for PIM attachments
            });

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

            //#. Translation must be distinguishable for the user
            //#. "Discard changes" appears as a header of the modal dialog to discard changes while editing a contact
            new ModalDialog({ title: gt('Discard changes'), description: gt('Do you really want to discard your changes?') })
            .addCancelButton()
                //#. "Discard changes" appears in combination with "Cancel" (this action)
                .addButton({ label: gt.pgettext('dialog', 'Discard changes'), action: 'delete' })
                .on('action', function (action) {
                    if (action === 'delete') def.resolve(); else def.reject();
                })
                .open();

            return def;
        });

        app.failSave = function () {
            if (!this.view || !this.view.model) return false;
            var model = this.view.model,
                title = model.get('display_name');
            return {
                description: gt('Contact') + (title ? ': ' + title : ''),
                module: 'io.ox/contacts/edit',
                point: model.toJSON(),
                passPointOnGetApp: true
            };
        };

        app.failRestore = function (point) {
            this.view.model.set(point).trigger('change:display_name');
        };

        app.getContextualHelp = function () {
            return this.view.model.isUserMode() ?
                'ox.appsuite.user.sect.settings.personaldata.html' :
                'ox.appsuite.user.sect.contacts.gui.create.html';
        };

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
