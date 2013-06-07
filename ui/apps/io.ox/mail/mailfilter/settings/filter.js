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
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/mail',
    'text!io.ox/mail/mailfilter/settings/tpl/listbox.html',
    'text!io.ox/mail/mailfilter/settings/tpl/filter_select.html',
    'io.ox/mail/mailfilter/settings/filter/view-form'
], function (ext, api, mailfilterModel, dialogs, gt, listboxtmpl, tmpl, AccountDetailView) {

    'use strict';

    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/mailfilter/model', api),
        collection;

    function renderDetailView(evt, data) {
        var myView,
            header = data.id === undefined ? gt('Create new rule') : gt('Edit rule');

        myView = new AccountDetailView({model: data});

        myView.dialog = new dialogs.ModalDialog({
            width: 685,
            async: true
        }).header($('<h4>').text(header));

        myView.dialog.append(
            myView.render().el
        )
        .addPrimaryButton("save", gt('Save'))
        .addButton("cancel", gt('Cancel'));

        myView.dialog.show();
        myView.collection = collection;

        myView.dialog.on('save', function () {
//            if (myModel.isValid()) {
            myView.dialog.getBody().find('.io-ox-mailfilter-edit').trigger('save');
//            } else {
//                myView.dialog.idle();
//            }
        });

        myView.dialog.on('cancel', function () {
//            console.log(myView);
        });
    }

    ext.point("io.ox/settings/mailfilter/filter/settings/detail").extend({
        index: 200,
        id: "mailfiltersettings",
        draw: function (evt) {
            renderDetailView(evt, evt.data.obj);
        }
    });

    return {
        editMailfilter: function ($node) {

            var deferred = $.Deferred(),

                staticStrings =  {
                    BUTTON_ADD: gt('Add new rule'),
                    TITLE: gt('Mail Filter')
                },
                createExtpointForSelectedFilter = function (args) {
                    ext.point('io.ox/settings/mailfilter/filter/settings/detail').invoke('draw', args.data.node, args);
                };

            api.getRules().done(function (data) {

                if (_.isEmpty(data)) {

//                    no filters

                } else {

                    collection = factory.createCollection(data);

                    var AccountSelectView = Backbone.View.extend({

                        _modelBinder: undefined,
                        initialize: function (options) {
                            this.template = doT.template(tmpl);
                            this._modelBinder = new Backbone.ModelBinder();

                        },
                        render: function () {
                            var flagArray = this.model.get('flags');

                            function getEditableState() {
                                if (flagArray) {
                                    var value = flagArray[0] !== 'vacation' && flagArray[0] !== 'autoforward' ? 'editable' : 'fixed';
                                    return value;
                                } else {
                                    return 'editable';
                                }
                            }
                            this.$el.empty().append(this.template({
                                id: this.model.get('id'),
                                state: this.model.get('active') ? { 'value': 'active', 'text': gt('Disable') } : { 'value': 'disabled', 'text': gt('Enable') },
                                edit: gt('Edit'),
                                editable: getEditableState()

                            }));

                            this._modelBinder.bind(this.model, this.el, Backbone.ModelBinder.createDefaultBindings(this.el, 'data-property'));

                            return this;
                        },
                        events: {
                            'click .deletable-item.editable': 'onSelect'
                        },

                        onSelect: function () {
                            this.$el.parent().find('li[selected="selected"]').attr('selected', null);
                            this.$el.find('.deletable-item').attr('selected', 'selected');
                        }

                    }),

                        MailfilterEdit = Backbone.View.extend({

                        initialize: function () {
                            this.template = doT.template(listboxtmpl);
                            _.bindAll(this);
                            this.collection = collection;

                            this.collection.bind('add', this.render);
                            this.collection.bind('remove', this.render);

                        },
                        render: function () {
                            var self = this;
                            self.$el.empty().append(self.template({
                                strings: staticStrings
                            }));
                            this.collection.each(function (item) {
                                self.$el.find('.widget-list').append(
                                    new AccountSelectView({ model: item }).render().el
                                );
                            });
                            this.$el.trigger('makesortable');

                            return this;
                        },

                        events: {
                            'click [data-action="edit"]': 'onEdit',
                            'click [data-action="delete"]': 'onDelete',
                            'click [data-action="add"]': 'onAdd',
                            'click [data-action="toggle"]': 'onToggle',
                            'makesortable': 'onMakeSortable'
                        },

                        onAdd: function (args) {
                            args.data = {};
                            args.data.node = this.el;

                            args.data.obj = factory.create(mailfilterModel.protectedMethods.provideEmptyModel());
                            createExtpointForSelectedFilter(args);
                        },

                        onEdit: function (e) {
                            e.preventDefault();
                            var selected = this.$el.find('[selected]');
                            e.data = {};
                            e.data.id = selected.data('id');

                            e.data.obj = this.collection.get(e.data.id);

                            e.data.node = this.el;

                            if (e.data.obj !== undefined) {
                                createExtpointForSelectedFilter(e);
                            }

                        },

                        onDelete: function (e) {
                            e.preventDefault();
                            var selected = this.$el.find('[selected]'),
                                self = this,
                                id = selected.data('id');
                            if (id) {
                                api.deleteRule(id).done(function () {
                                    self.collection.remove(id);
                                });
                            }

                        },

                        onToggle: function (e) {
                            e.preventDefault();
                            var selected = this.$el.find('[selected]'),
                                self = this,
                                id = selected.data('id'),
                                selectedObj = this.collection.get(id),
                                state = selectedObj.get('active') ? false : true;

                            selectedObj.set('active', state);

                            api.update(selectedObj).done(function () {
                                self.render();
                            });
                        },

                        onMakeSortable: function () {

                            this.$el.find('ol').sortable({
                                containment: this.el,
                                axis: 'y',
                                scroll: true,
                                delay: 150,
                                stop: function (e, ui) {
                                    var arrayOfFilters = $node.find('li[data-id]'),
                                    data = _.map(arrayOfFilters, function (single) {
                                        return parseInt($(single).attr('data-id'), 10);
                                    });
                                    api.reorder(data); //TODO needs a response?;
                                }
                            });
                        }

                    }),

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
