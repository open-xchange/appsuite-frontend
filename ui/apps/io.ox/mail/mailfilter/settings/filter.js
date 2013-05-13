/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/filter', [
    'io.ox/core/extensions',
    'io.ox/core/api/mailfilter',
    'io.ox/mail/mailfilter/settings/model',
    'io.ox/mail/mailfilter/settings/view-form',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/mail',
    'text!io.ox/mail/mailfilter/settings/tpl/listbox.html',
    'text!io.ox/mail/mailfilter/settings/tpl/filter_select.html',
    'io.ox/mail/mailfilter/settings/filter/view-form'
], function (ext, api, mailfilterModel, ViewForm, dialogs, gt, listboxtmpl, tmpl, AccountDetailView) {

    'use strict';


    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/mailfilter/model', api);


    function renderDetailView(evt, data) {
        var myView, myModel, myViewNode;

        myViewNode = $("<div>").addClass("accountDetail");
        myModel = data;
        myView = new AccountDetailView({model: myModel, node: myViewNode});
        myView.dialog = new dialogs.SidePopup({modal: true, arrow: false, saveOnClose: true}).show(evt, function (pane) {
            pane.append(myView.render().el);
        });
//        myView.succes = successDialog;
//        myView.collection = collection;
        return myView.node;
    }

    ext.point("io.ox/settings/mailfilter/filter/settings/detail").extend({
        index: 200,
        id: "emailaccountssettings",
        draw: function (evt) {
            renderDetailView(evt, evt.data.obj);
        }
    });


    return {
        editMailfilter: function ($node) {

            var deferred = $.Deferred(),

            staticStrings =  {
                BUTTON_ADD: gt('Add'),
                BUTTON_EDIT: gt('Edit'),
                BUTTON_DELETE: gt('Delete'),
                TITLE: gt('Mail Filter')
            },
            createExtpointForSelectedAccount = function (args) {
                if (args.data.id !== undefined) {
                    ext.point('io.ox/settings/mailfilter/filter/settings/detail').invoke('draw', args.data.node, args);
                }
            };

            api.getRules().done(function (data) {

                if (_.isEmpty(data)) {
                    console.log('no rules available');
//                    var autoForwardData = {},
//                        ForwardEdit,
//                        autoForward;
//                    autoForwardData.userMainEmail = userMainEmail;
//                    ForwardEdit = ViewForm.protectedMethods.createAutoForwardEdit('io.ox/core/autoforward', multiValues);
//
//                    autoForward = new ForwardEdit({model: factory.create(autoForwardData)});
//
//                    $node.append(autoForward.render().$el);
//
//                    deferred.resolve(autoForward.model);

                } else {
                    console.log('these are the rules');
                    var mailFilter = {},
                        MailfilterEdit,
                        collection = factory.createCollection(data);

//                        autoForward;
//
//                    mailfilterData.id = data[0].id;
//                    autoForwardData.active = data[0].active;
//
//                    _(data[0].actioncmds).each(function (value) {
//                        if (value.id === 'redirect') {
//                            autoForwardData.forwardmail = value.to;
//                        }
//                    });
//                    autoForwardData.userMainEmail = userMainEmail;
//                    MailfilterEdit = ViewForm.protectedMethods.createMailfilterEdit('io.ox/core/mailfilter');


                    var AccountSelectView = Backbone.View.extend({

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
//                            removeSelectedItem({ id: this.model.get('id'), accountType: this.model.get('accountType')});
                        },
                        onSelect: function () {
                            this.$el.parent().find('div[selected="selected"]').attr('selected', null);
                            this.$el.find('.deletable-item').attr('selected', 'selected');
                        }

                    });

                    var MailfilterEdit = Backbone.View.extend({

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

                            _(api.submodules).chain()
                            .select(function (submodule) {
                                return !submodule.canAdd || submodule.canAdd.apply(this);
                            })
                            .each(function (submodule) {
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
                            }).value();

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
                            console.log(this.collection);
                            var selected = this.$el.find('[selected]');
                            args.data = {};
                            args.data.id = selected.data('id');
                            args.data.obj = this.collection.get(args.data.id);

//                            args.data.accountType = selected.data('accounttype');
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
//                                removeSelectedItem(account);
                            } else {
                                require(["io.ox/core/tk/dialogs"], function (dialogs) {
                                    new dialogs.ModalDialog()
                                        .text(gt('Your primary mail account can not be deleted.'))
                                        .addPrimaryButton('ok', gt('Ok'))
                                        .show();
                                });
                            }

                        }

                    });


//
                    mailFilter = new MailfilterEdit();
//
//                    if (data[0].active === true) {
//                       // set active state
//                    }
                    $node.append(mailFilter.render().$el);
//
//                    deferred.resolve(autoForward.model);

                }

            }).fail(function (error) {
                deferred.reject(error);
            });

            return deferred;

        }
    };

});
