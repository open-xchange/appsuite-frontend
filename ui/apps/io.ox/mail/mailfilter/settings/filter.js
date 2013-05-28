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


    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/mailfilter/model', api),
        collection;


    function renderDetailView(evt, data) {
        var myView, myModel, myViewNode;

        myViewNode = $("<div>").addClass("accountDetail");
        myModel = data;
        myView = new AccountDetailView({model: myModel, node: myViewNode});

        myView.dialog = new dialogs.ModalDialog({
            width: 685
//            async: true
        });


        myView.dialog.append(
            myView.render().el
        )
        .addPrimaryButton("save", gt('Save'))
        .addButton("cancel", gt('Cancel'));

        myView.dialog.show();
//        myView.succes = successDialog;
        myView.collection = collection;


        myView.dialog.on('save', function () {
//            if (myModel.isValid()) {
            myView.dialog.getBody().find('.io-ox-mailfilter-edit').trigger('save');
//            } else {
//                myView.dialog.idle();
//            }
        });

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
                } else {
                    ext.point('io.ox/settings/mailfilter/filter/settings/detail').invoke('draw', args.data.node, args);
                }
            };

            api.getRules().done(function (data) {

                if (_.isEmpty(data)) {

//                    no filters

                } else {
                    var mailFilter = {},
                        MailfilterEdit;

                    collection = _.reject(data, function (filter) {
                        if (_.isEmpty(filter.flags)) {
                            return false;
                        }
                        var test = _.reject(filter.flags, function (flag) {
                            return flag === 'vacation' || 'autoforward';
                        });

                        return _.isEmpty(test);

                    });

                    collection = factory.createCollection(collection);

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
                            'click .deletable-item': 'onSelect'
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

                            return this;
                        },

                        events: {
                            'click [data-action="edit"]': 'onEdit',
                            'click [data-action="delete"]': 'onDelete',
                            'click [data-action="add"]': 'onAdd'
                        },

                        onAdd: function (args) {
                            args.data = {};
                            args.data.node = this.el;


                            args.data.obj = factory.create(mailfilterModel.protectedMethods.provideEmptyModel());
                            createExtpointForSelectedAccount(args);
                        },

                        onEdit: function (args) {
                            var selected = this.$el.find('[selected]');
                            args.data = {};
                            args.data.id = selected.data('id');
                            args.data.obj = this.collection.get(args.data.id);

                            args.data.node = this.el;
                            console.log(args);
                            createExtpointForSelectedAccount(args);
                        },
                        onDelete: function (args) {

                            console.log('delete');
                            var selected = this.$el.find('[selected]'),
                                self = this,
                                id = selected.data('id');
                            console.log(this);
                            api.deleteRule(id).done(function () {
                                self.collection.remove(id);
                            });
                        }

                    });

                    mailFilter = new MailfilterEdit();
                    $node.append(mailFilter.render().$el);

                }

            }).fail(function (error) {
                deferred.reject(error);
            });

            return deferred;

        }
    };

});
