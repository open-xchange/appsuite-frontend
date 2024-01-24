/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/settings/accounts/views', [
    'io.ox/core/extensions',
    'io.ox/settings/util',
    'io.ox/backbone/mini-views/listutils',
    'io.ox/backbone/views/disposable',
    'io.ox/oauth/keychain',
    'gettext!io.ox/settings/accounts'
], function (ext, settingsUtil, listUtils, DisposableView, oauthAPI, gt) {

    'use strict';

    var createExtpointForSelectedAccount = function (args) {
            if (args.data.id !== undefined && args.data.accountType !== undefined) {
                ext.point('io.ox/settings/accounts/' + args.data.accountType + '/settings/detail').invoke('draw', args.data.node, args);
            }
        },
        drawIcon = (function () {
            return function (model) {
                var type = model.get('accountType') || model.get('module'),
                    shortId = String(model.get('serviceId') || model.id).match(/\.?([a-zA-Z]*)(\d*)$/)[1] || 'fallback';
                return $('<i class="account-icon fa" aria-hidden="true">')
                    .addClass(type.toLowerCase())
                    .addClass('logo-' + shortId);
            };
        })(),

        /**
         * getAccountState
         * Used to display a possible error message.
         * Returns a jQuery node
         * containing the error.
         */
        drawAccountState = function (model) {
            if ((typeof model.get('status') === 'undefined') || model.get('status') === 'ok') return;
            // ignore secondary account errors when deactivated (props 'deactivated' and 'status' does not change at the same time)
            if (model.get('deactivated') || (model.get('status') || {}).status === 'deactivated') return;

            return $('<div class="error-wrapper">').append(
                $('<i class="error-icon fa fa-exclamation-triangle" aria-hidden="true">'),
                $('<div class="error-message">').text(model.get('status').message)
            );
        },

        SettingsAccountListItemView = DisposableView.extend({

            tagName: 'li',

            className: 'settings-list-item',

            events: {
                'click [data-action="edit"]': 'onEdit',
                'click [data-action="delete"]': 'onDelete',
                'click [data-action="enable"]': 'onEnable'
            },

            initialize: function () {
                this.listenTo(this.model, 'change', this.render);
            },

            getTitle: function () {
                // mail accounts are special, displayName might be different from account name, want account name, here
                var titleAttribute = this.model.get('accountType') === 'mail' ? 'name' : 'displayName';
                // no translation needed, this is only a dev feature, for convenience. Those accounts are only displayed when ox.debug is set to true
                if (/xox\d+|xctx\d+/.test(this.model.get('filestorageService'))) return 'Shared folders from ' + this.model.get(titleAttribute);
                return this.model.get(titleAttribute);
            },

            renderSubtitle: function () {
                var el = $('<div class="list-item-subtitle">');
                ext.point('io.ox/settings/accounts/' + this.model.get('accountType') + '/settings/detail').invoke('renderSubtitle', el, this.model);
                return el;
            },

            renderTitle: function (title) {
                return listUtils.makeTitle(title);
            },

            renderAction: function (action) {
                var POINT = 'io.ox/settings/accounts/' + this.model.get('accountType') + '/settings/detail';
                switch (action) {
                    case 'edit':
                        if (this.model.get('deactivated') && !_.device('smartphone')) return $();
                        if (this.model.get('accountType') !== 'fileAccount' && ext.point(POINT).pluck('draw').length <= 0) return;
                        return listUtils.appendIconText(
                            listUtils.controlsEdit({ 'aria-label': gt('Edit %1$s', this.getTitle()) }), gt('Edit'), 'edit'
                        );
                    case 'delete':
                        if (this.model.get('id') === 0 || this.model.get('secondary')) return $('<div class="remove-placeholder">');
                        return listUtils.controlsDelete({ title: gt('Delete %1$s', this.getTitle()) });
                    case 'enable':
                        if (!this.model.get('secondary')) return $();
                        if (!this.model.get('deactivated')) return $();
                        this.$el.addClass('disabled');
                        if (_.device('smartphone')) return $();
                        return $('<a href="#" class="action" role="button" class="toggle" data-action="enable">').attr('aria-label', gt('Enable %1$s', this.getTitle())).text(gt('Enable'));
                    default:
                        return $();
                }
            },

            render: function () {
                var self = this;
                self.$el.attr({
                    'data-id': self.model.get('id'),
                    'data-accounttype': self.model.get('accountType')
                });

                self.$el.empty().append(
                    drawIcon(self.model),
                    this.renderTitle(self.getTitle()).append(
                        this.renderSubtitle()
                    ),
                    listUtils.makeControls().append(
                        self.renderAction('edit'),
                        self.renderAction('enable'),
                        self.renderAction('delete')
                    ),
                    // show a possible account error
                    drawAccountState(this.model)
                );

                return self;
            },

            onDelete: function (e) {

                e.preventDefault();
                var account = this.model.pick('id', 'accountType', 'folder', 'rootFolder', 'filestorageService'),
                    self = this,
                    parentAccountRemoved;
                if (account.accountType === 'fileAccount') {
                    account.folder = account.rootFolder;
                }
                require(['io.ox/backbone/views/modal'], function (ModalDialog) {
                    new ModalDialog({
                        async: true,
                        title: gt('Delete account')
                    })
                    .build(function () {
                        this.$body.append(gt('Do you really want to delete this account?'));
                    })
                    .addCancelButton()
                    .addButton({ action: 'delete', label: gt('Delete account') })
                    .on('delete', function () {
                        var popup = this,
                            req, opt,
                            parentModel = oauthAPI.accounts.findWhere({ serviceId: self.model.attributes.serviceId });

                        function simplifyId(id) {
                            return id.substring(id.lastIndexOf('.') + 1);
                        }

                        if (account.accountType === 'fileAccount') {
                            req = 'io.ox/core/api/filestorage';
                            opt = { id: account.id, filestorageService: account.filestorageService };
                        } else if (parentModel && parentModel.get('associations').length === 1) {
                            opt = { id: parentModel.get('id'), accountType: simplifyId(parentModel.get('serviceId')) };
                            req = 'io.ox/keychain/api';
                            parentAccountRemoved = true;
                        } else {
                            // use correct api, folder API if there's a folder and account is not a mail account,
                            // keychain API otherwise
                            var useFolderAPI = typeof account.folder !== 'undefined' && account.accountType !== 'mail';
                            req = useFolderAPI ? 'io.ox/core/folder/api' : 'io.ox/keychain/api';
                            opt = useFolderAPI ? account.folder : account;
                        }
                        settingsUtil.yellOnReject(
                            require([req]).then(function (api) {
                                return api.remove(opt);
                            }).then(
                                function success() {
                                    if (self.disposed) {
                                        popup.close();
                                        return;
                                    }

                                    if (parentAccountRemoved) {
                                        popup.close('', { resetDialogQueue: true });
                                    } else {
                                        self.model.collection.remove(self.model);
                                        popup.close();
                                    }
                                },
                                function fail() {
                                    popup.close();
                                    throw arguments;
                                }
                            )
                            .always(function () {
                                // update folder tree
                                require(['io.ox/core/api/account', 'io.ox/core/folder/api'], function (accountAPI, folderAPI) {
                                    accountAPI.getUnifiedInbox().done(function (unifiedInbox) {
                                        accountAPI.trigger('refresh.list');
                                        if (!unifiedInbox) return folderAPI.refresh();
                                        var prefix = unifiedInbox.split('/')[0];
                                        folderAPI.pool.unfetch(prefix);
                                        folderAPI.refresh();
                                    });
                                });
                            })
                        );
                    })
                    .open();
                });
            },

            onEdit: function (e) {
                e.preventDefault();
                e.data = {
                    id: this.model.get('id'),
                    accountType: this.model.get('accountType'),
                    model: this.model,
                    node: this.el
                };
                if (this.model.get('accountType') === 'fileAccount') {
                    ox.load(['io.ox/files/actions/basic-authentication-account']).done(function (update) {
                        update('update', e.data.model);
                    });

                } else { createExtpointForSelectedAccount(e); }
            },

            onEnable: function () {
                var self = this;
                require(['io.ox/core/api/account', 'io.ox/mail/accounts/model'], function (accountAPI, AccountModel) {
                    accountAPI.get(self.model.get('id')).done(function (data) {
                        var aModel = new AccountModel(data);
                        aModel.set('deactivated', false).save();
                        self.listenTo(aModel, 'sync', function (model) {
                            self.model.set(model.attributes);
                        });
                    });
                });
            }
        });

    return {
        ListItem: SettingsAccountListItemView
    };
});
