/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
/*global
define: true, _: true
*/

define('io.ox/settings/accounts/settings/pane',
    ['io.ox/core/extensions',
       'io.ox/core/tk/dialogs',
       "io.ox/keychain/api",
       "io.ox/keychain/model",
       "io.ox/core/api/folder",
       'text!io.ox/settings/accounts/email/tpl/account_select.html',
       'text!io.ox/settings/accounts/email/tpl/listbox.html',
       'gettext!io.ox/settings/accounts',
       'withPluginsFor!keychainSettings'
   ], function (ext, dialogs, api, keychainModel, folderAPI, tmpl, listboxtmpl, gt) {

    'use strict';

    var collection,
        staticStrings =  {
            BUTTON_ADD: gt('Add'),
            BUTTON_EDIT: gt('Edit'),
            BUTTON_DELETE: gt('Delete'),
            TITLE: gt('Mail and Social Accounts')
        },

        createExtpointForSelectedAccount = function (args) {
            if (args.data.id !== undefined && args.data.accountType !== undefined) {
                ext.point('io.ox/settings/accounts/' + args.data.accountType + '/settings/detail').invoke('draw', args.data.node, args);
            }
        },

        removeSelectedItem = function (account) {
            var def = $.Deferred();
            require(["io.ox/core/tk/dialogs"], function (dialogs) {
                new dialogs.ModalDialog()
                    .text('Do you really want to delete this account?')
                    .addPrimaryButton('delete', 'Delete account')
                    .addButton('cancel', 'Cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            def.resolve();
                            api.remove(account).done(function () {
                                folderAPI.subFolderCache.remove('1');
                                folderAPI.folderCache.remove('default' + account);
                                folderAPI.trigger('update');
                            });
                        } else {
                            def.reject();
                        }
                    });
            });
        },

        AccountSelectView = Backbone.View.extend({

            _modelBinder: undefined,
            initialize: function (options) {
                this.template = doT.template(tmpl);
                this._modelBinder = new Backbone.ModelBinder();
            },
            render: function () {
                var self = this;
                self.$el.empty().append(self.template({
                    id: this.model.get('id'),
                    accountType: this.model.get('accountType')
                }));

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);

                return self;
            },
            events: {
                'click .close': 'onClose',
                'click .deletable-item': 'onSelect'
            },
            onClose: function () {
                removeSelectedItem({ id: this.model.get('id'), accountType: this.model.get('accountType')});
            },
            onSelect: function () {
                this.$el.parent().find('div[selected="selected"]').attr('selected', null);
                this.$el.find('.deletable-item').attr('selected', 'selected');
            }

        });


    ext.point("io.ox/settings/accounts/settings/detail").extend({
        index: 200,
        id: "accountssettings",
        draw: function (data) {
            var  that = this;

            function redraw() {

                that.empty();
                var allAccounts = api.getAll();

                collection = keychainModel.wrap(allAccounts);

                var AccountsView = Backbone.View.extend({

                    initialize: function () {
                        this.template = doT.template(listboxtmpl);
                        _.bindAll(this);
                        this.collection = collection;

                        this.collection.bind('add', this.render);
                        this.collection.bind('remove', this.render);
                    },
                    render: function () {
                        var self = this,
                            $dropDown;
                        self.$el.empty().append(self.template({
                            strings: staticStrings
                        }));
                        this.collection.each(function (item) {
                            self.$el.find('.listbox').append(
                                new AccountSelectView({ model: item }).render().el
                            );
                        });

                        // Enhance Add... options
                        $dropDown = this.$el.find('.dropdown-menu');

                        _(api.submodules).each(function (submodule) {
                            $dropDown.append(
                                $('<li>').append(
                                    $('<a>', { href: '#', 'data-actionname': submodule.actionName || submodule.id || '' })
                                    .text(submodule.displayName)
                                    .on('click', function (e) {
                                        e.preventDefault();
                                        // looks like oauth?
                                        if ('reauthorize' in submodule) {
                                            var win = window.open(ox.base + "/busy.html", "_blank", "height=400, width=600");
                                            submodule.createInteractively(win);
                                        } else {
                                            submodule.createInteractively(e);
                                        }
                                    })
                                )
                            );
                        });

                        return this;
                    },

                    events: {
                        'click [data-action="edit"]': 'onEdit',
                        'click [data-action="delete"]': 'onDelete'
                    },

                    onAdd: function (args) {
                        require(["io.ox/settings/accounts/settings/createAccountDialog"], function (accountDialog) {
                            accountDialog.createAccountInteractively(args);
                        });
                    },

                    onEdit: function (args) {
                        var selected = this.$el.find('[selected]');
                        args.data = {};
                        args.data.id = selected.data('id');
                        args.data.accountType = selected.data('accounttype');
                        args.data.node = this.el;
                        createExtpointForSelectedAccount(args);
                    },
                    onDelete: function () {
                        var $selected = this.$el.find('[selected]'),
                            id = $selected.data('id'),
                            account = {
                                id: id,
                                accountType: $selected.data('accounttype')
                            };

                        if (id !== 0) {
                            removeSelectedItem(account);
                        } else {
                            require(["io.ox/core/tk/dialogs"], function (dialogs) {
                                new dialogs.ModalDialog()
                                    .text('Your primary mail account can not be deleted.')
                                    .addPrimaryButton('ok', 'Ok')
                                    .show();
                            });
                        }

                    }

                });

                var accountsList = new AccountsView();

                that.append(accountsList.render().el);
            }

            redraw();

            api.on("refresh.all refresh.list", redraw);
            that.on("dispose", function () {
                api.off("refresh.all refresh.list", redraw);
            });
        },
        save: function () {
            // TODO
            //console.log('now accounts get saved?');
        }
    });

    return {}; //whoa return nothing at first

});

