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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/settings/accounts/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/keychain/api',
    'io.ox/keychain/model',
    'io.ox/core/folder/api',
    'io.ox/settings/util',
    'io.ox/core/notifications',
    'io.ox/backbone/mini-views/listutils',
    'io.ox/backbone/disposable',
    'io.ox/core/api/filestorage',
    'gettext!io.ox/settings/accounts',
    'withPluginsFor!keychainSettings'
], function (ext, dialogs, api, keychainModel, folderAPI, settingsUtil, notifications, listUtils, DisposableView, filestorageApi, gt) {

    'use strict';

    var collection,

        createExtpointForSelectedAccount = function (args) {
            if (args.data.id !== undefined && args.data.accountType !== undefined) {
                ext.point('io.ox/settings/accounts/' + args.data.accountType + '/settings/detail').invoke('draw', args.data.node, args);
            }
        },

        drawAddButton = function () {
            return $('<div class="btn-group col-md-4 col-xs-12">').append(
                $('<a class="btn btn-primary dropdown-toggle pull-right" role="button" data-toggle="dropdown" href="#" aria-haspopup="true" tabindex="1">').append(
                    $.txt(gt('Add account')), $.txt(' '),
                    $('<span class="caret">')
                ),
                $('<ul class="dropdown-menu" role="menu">')
            );
        },

        drawRecoveryButtonHeadline = function () {
            return $('<h2 class="sr-only">').text(gt('Password recovery'));
        },

        drawRecoveryButton = function () {
            return $('<div class="hint">').append(
                $.txt(
                    gt('For security reasons, all credentials are encrypted with your primary account password. ' +
                        'If you change your primary password, your external accounts might stop working. In this case, ' +
                        'you can use your old password to recover all account passwords:')
                ),
                $.txt(' '),
                $('<a href="#" data-action="recover">').text(gt('Recover passwords')).attr({
                    role: 'button',
                    title: gt('Recover passwords'),
                    'aria-label': gt('Recover passwords')
                })
                .on('click', function (e) {
                    e.preventDefault();
                    ox.load(['io.ox/keychain/secretRecoveryDialog']).done(function (srd) {
                        srd.show();
                    });
                })
            );
        },

        drawPane = function () {
            return $('<div class="io-ox-accounts-settings">').append(
                $('<div>').addClass('row').append(
                    $('<h1 class="col-md-8 col-xs-12">').text(gt('Accounts')),
                    drawAddButton()
                ),
                $('<ul class="list-unstyled list-group widget-list">')
            );
        },

        AccountSelectView = DisposableView.extend({

            tagName: 'li',

            className: 'widget-settings-view',

            events: {
                'click [data-action="edit"]': 'onEdit',
                'click [data-action="delete"]': 'onDelete'
            },

            initialize: function () {
                this.model.on('change', this.render, this);
            },

            render: function () {
                var self = this,
                    title = self.model.get('displayName');
                self.$el.attr({
                    'data-id': self.model.get('id'),
                    'data-accounttype': self.model.get('accountType')
                });

                self.$el.append(
                    listUtils.widgetIcon(self.model.get('accountType')),
                    listUtils.widgetTitle(title),
                    listUtils.widgetControlls().append(
                        listUtils.controlsDelete(title, gt('Delete'), self.model.get('id')),
                        listUtils.appendIconText(
                                listUtils.controlsEdit(title, gt('Edit')),
                                gt('Edit'),
                                'edit'
                            )
                    ),
                    // some Filesorage accounts may contain errors, if thats the case show them
                    listUtils.drawError(filestorageApi.getAccountForOauth(self.model))
                );

                return self;
            },

            onDelete: function (e) {

                e.preventDefault();

                var account = { id: this.model.get('id'), accountType: this.model.get('accountType') },
                    self = this;

                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog({ async: true })
                    .text(gt('Do you really want to delete this account?'))
                    .addPrimaryButton('delete', gt('Delete account'), 'delete', { tabIndex: 1 })
                    .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                    .on('delete', function () {
                        var popup = this;
                        settingsUtil.yellOnReject(
                            api.remove(account).then(
                                function success() {
                                    folderAPI.list('1', { cache: false });
                                    if (self.disposed) {
                                        popup.close();
                                        return;
                                    }

                                    self.model.collection.remove(self.model);
                                    popup.close();
                                },
                                function fail() {
                                    popup.close();
                                }
                            )
                            .always(function () {
                                // update folder tree
                                require(['io.ox/core/api/account', 'io.ox/core/folder/api'], function (accountAPI, folderAPI) {
                                    accountAPI.getUnifiedInbox().done(function (unifiedInbox) {
                                        if (!unifiedInbox) return;
                                        var prefix = unifiedInbox.split('/')[0];
                                        folderAPI.pool.unfetch(prefix);
                                        folderAPI.refresh();
                                    });
                                });
                            })
                        );
                    })
                    .show();
                });
            },

            onEdit: function (e) {
                e.preventDefault();
                e.data = {
                    id: this.model.get('id'),
                    accountType: this.model.get('accountType'),
                    node: this.el
                };
                createExtpointForSelectedAccount(e);
            }
        });
    /**
     * Extension point for account settings detail view
     *
     * This extension point provides a list to manage accounts of the keyring.
     *
     * As an extension to basic extension points, accounts can implement a canAdd
     * attribute of type {bool|function} to specify if the user is able to add new
     * accounts of this type. If false, the user is able to view the account in the
     * list and edit it, but it will be filtered from the dropdown menu of the add
     * button.
     *
     */

    ext.point('io.ox/settings/accounts/settings/detail').extend({
        index: 300,
        id: 'accountssettings',
        draw: function (data) {
            var that = this;

            function redraw() {

                that.empty();
                var allAccounts = api.getAll();

                collection = keychainModel.wrap(allAccounts);

                var AccountsView = Backbone.View.extend({

                    initialize: function () {
                        _.bindAll(this, 'render', 'onAdd');
                        this.collection = collection;

                        this.collection.bind('add', this.render);
                        this.collection.bind('remove', this.render);
                    },

                    render: function () {

                        this.$el.empty().append(drawPane);

                        if (this.collection.length > 1) {
                            this.$el.find('.io-ox-accounts-settings').append(drawRecoveryButtonHeadline(), drawRecoveryButton());
                        }

                        this.$el.find('.widget-list').append(
                            this.collection.map(function (item) {
                                return new AccountSelectView({ model: item }).render().el;
                            })
                        );

                        var submodules = _(api.submodules).filter(function (submodule) {
                            return !submodule.canAdd || submodule.canAdd.apply(this);
                        });

                        // Enhance Add... options

                        function add(e) {
                            e.preventDefault();
                            var submodule = e.data.submodule;
                            // looks like oauth?
                            if ('reauthorize' in submodule) {
                                var win = window.open(ox.base + '/busy.html', '_blank', 'height=600, width=800, resizable=yes, scrollbars=yes');
                                submodule.createInteractively(win);
                            } else {
                                submodule.createInteractively(e);
                            }
                        }

                        this.$el.find('.dropdown-menu').append(
                            _(submodules).map(function (submodule) {
                                return $('<li role="presentation">').append(
                                    $('<a href="#" role="menuitem" tabindex="1">')
                                    .attr('data-actionname', submodule.actionName || submodule.id || '')
                                    .text(submodule.displayName)
                                    .on('click', { submodule: submodule }, add)
                                );
                            })
                        );

                        var toggle = this.$el.find('.dropdown-toggle').dropdown();
                        if (submodules.length === 0) toggle.hide();

                        return this;
                    },

                    onAdd: function (args) {
                        require(['io.ox/settings/accounts/settings/createAccountDialog'], function (accountDialog) {
                            accountDialog.createAccountInteractively(args);
                        });
                    }
                });

                var accountsList = new AccountsView();

                that.append(accountsList.render().el);
            }

            redraw();

            function onChange(id, list) {
                if (!list || list.length === 0 || (id !== 'virtual/io.ox/settings/accounts' && id !== 'virtual/settings/io.ox/settings/accounts')) {
                    api.off('refresh.all refresh.list', redraw);
                    data.tree.off('virtual', onChange);
                }
            }
            api.on('refresh.all refresh.list', redraw);
            data.tree.on('virtual', onChange);
        },
        save: function () {
            // TODO
            //console.log('now accounts get saved?');
        }
    });

    return {};

});
