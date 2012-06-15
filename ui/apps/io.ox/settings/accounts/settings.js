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
define('io.ox/settings/accounts/settings',
      ['io.ox/core/extensions',
       'io.ox/core/tk/view',
       'io.ox/settings/utils',
       'io.ox/core/tk/dialogs',
       'io.ox/core/api/account',
       'io.ox/core/tk/forms',
       'io.ox/settings/accounts/email/settings',
       'io.ox/settings/accounts/email/model',
       'text!io.ox/settings/accounts/email/tpl/account_select.html',
       'text!io.ox/settings/accounts/email/tpl/listbox.html'
       ], function (ext, View, utils, dialogs, api, forms, email, AccountModel, tmpl, listboxtmpl) {


    'use strict';

    var collection,

        createExtpointForSelectedAccount = function (args) {
            if (args.data.id !== undefined) {
                require(['io.ox/settings/accounts/email/settings'], function (m) {
                    ext.point('io.ox/settings/accounts/email/settings/detail').invoke('draw', args.data.node, args);
                });
            }
        },

        removeSelectedItem = function (dataid) {
            var def = $.Deferred();

            require(["io.ox/core/tk/dialogs"], function (dialogs) {
                new dialogs.ModalDialog()
                    .text("Do you really want to delete this account?")
                    .addPrimaryButton("delete", 'delete account')
                    .addButton("cancel", 'Cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            def.resolve();

                            var obj = collection.get([dataid]);
                            collection.remove([dataid]);
                            obj.destroy();

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
                    id: this.model.get('id')
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
                removeSelectedItem(this.model.get('id'));
            },
            onSelect: function () {
                this.$el.parent().find('div[selected="selected"]').attr('selected', null);
                this.$el.find('.deletable-item').attr('selected', 'selected');
            }

        }),

        Collection = Backbone.Collection.extend({

            model: AccountModel
        });

    ext.point("io.ox/settings/accounts/settings/detail").extend({
        index: 200,
        id: "accountssettings",
        draw: function (data) {
            var  that = this;
            api.all().done(function (allAccounts) {

                collection = new Collection(allAccounts);

                var AccountsView = Backbone.View.extend({

                    initialize: function () {
                        this.template = doT.template(listboxtmpl);
                        _.bindAll(this);
                        this.collection = collection;

                        this.collection.bind('add', this.render);
                        this.collection.bind('remove', this.render);
                    },
                    render: function () {
                        var self = this;
                        self.$el.empty().append(self.template({}));

                        this.collection.each(function (item) {
                            self.$el.find('.listbox').append(new AccountSelectView({ model: item }).render().el);
                        });

                        return this;
                    },

                    events: {
                        'click [data-action="add"]': 'onAdd',
                        'click [data-action="edit"]': 'onEdit',
                        'click [data-action="delete"]': 'onDelete'
                    },

                    onAdd: function (args) {
                        email.mailAutoconfigDialog(args, {
                            collection: collection
                        });
                    },

                    onEdit: function (args) {
                        args.data = {};
                        args.data.id = this.$el.find('[selected]').data('id');
                        args.data.node = this.el;
                        createExtpointForSelectedAccount(args);
                    },
                    onDelete: function () {
                        var id = this.$el.find('[selected]').data('id');
                        removeSelectedItem(id);
                    }

                });

                var accountsList = new AccountsView();

                that.append(accountsList.render().el);
            });

        },
        save: function () {
            console.log('now accounts get saved?');
        }
    });

    return {}; //whoa return nothing at first

});

