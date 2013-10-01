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

define('io.ox/mail/mailfilter/settings/filter',
    ['io.ox/core/extensions',
     'io.ox/core/api/mailfilter',
     'io.ox/mail/mailfilter/settings/model',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/mail',
     'io.ox/settings/util',
     'text!io.ox/mail/mailfilter/settings/tpl/listbox.html',
     'text!io.ox/mail/mailfilter/settings/tpl/filter_select.html',
     'io.ox/mail/mailfilter/settings/filter/view-form'
    ], function (ext, api, mailfilterModel, dialogs, gt, settingsUtil, listboxtmpl, tmpl, FilterDetailView) {

    'use strict';

    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/mailfilter/model', api),
        collection;

    function renderDetailView(evt, data) {
        var myView,
            header = data.id === undefined ? gt('Create new rule') : gt('Edit rule'),
            testArray, actionArray, rulename,

            checkForPosition = function (array, target) {
                var position;
                _.each(array, function (val, index) {
                    if (_.isEqual(val, target)) {
                        position = index;
                    }
                });
                return position;
            },

            filterCondition = function (tests, condition) {
                var position = checkForPosition(tests, condition);
                if (position) {
                    tests.splice(position, 1);
                }
                return tests;
            };

        myView = new FilterDetailView({ model: data, listView: evt.data.listView });

        testArray = _.copy(myView.model.get('test'), true);
        actionArray = _.copy(myView.model.get('actioncmds'), true);
        rulename = _.copy(myView.model.get('rulename'), true);

        if (testArray.tests) {
            testArray.tests = filterCondition(testArray.tests, {id: 'true'});

            if (testArray.tests.length === 1) {
                var includedTest = _.copy(testArray.tests[0]);
                testArray = includedTest;
            }
            myView.model.set('test', testArray);
        }

        myView.dialog = new dialogs.ModalDialog({
            top: 60,
            width: 800,
            center: false,
            maximize: true,
            async: true
        }).header($('<h4>').text(header));

        myView.dialog.append(
            myView.render().el
        )
        .addPrimaryButton('save', gt('Save'))
        .addButton('cancel', gt('Cancel'));

        myView.dialog.show();
        myView.$el.find('input[name="rulename"]').focus();
        myView.collection = collection;

        myView.dialog.on('save', function () {
            myView.dialog.getBody().find('.io-ox-mailfilter-edit').trigger('save');
        });

        myView.dialog.on('cancel', function () {
            // reset the model
            myView.model.set('test', testArray);
            myView.model.set('actioncmds', actionArray);
            myView.model.set('rulename', rulename);
        });
    }

    ext.point('io.ox/settings/mailfilter/filter/settings/detail').extend({
        index: 200,
        id: 'mailfiltersettings',
        draw: function (evt) {
            renderDetailView(evt, evt.data.obj);
        }
    });

    return {
        editMailfilter: function ($node) {

            var deferred = $.Deferred(),

                staticStrings =  {
                    BUTTON_ADD: gt('Add new rule'),
                    TITLE: gt('Mail Filter'),
                    EMPTY: gt('There is no rule defined')
                },
                createExtpointForSelectedFilter = function (args) {
                    ext.point('io.ox/settings/mailfilter/filter/settings/detail').invoke('draw', args.data.node, args);
                };

            api.getRules().done(function (data) {

                collection = factory.createCollection(data);
                var AccountSelectView = Backbone.View.extend({

                    _modelBinder: undefined,
                    initialize: function () {
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
                        this.$el.parent().find('li[selected="selected"]').prop('selected', false);
                        this.$el.find('.deletable-item').prop('selected', true);
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

                        if (this.collection.length === 0) {
                            self.$el.find('.widget-list').append($('<div>').text(staticStrings.EMPTY));
                        } else {
                            this.collection.each(function (item) {
                                self.$el.find('.widget-list').append(
                                    new AccountSelectView({ model: item }).render().el
                                );
                            });
                            this.$el.trigger('makesortable');
                        }

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
                        args.data = {
                            node: this.el,
                            listView: this,
                            obj: factory.create(mailfilterModel.protectedMethods.provideEmptyModel())
                        };
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
                        if (id !== false) {
                             //yell on reject
                            settingsUtil.yellOnReject(
                                api.deleteRule(id).done(function () {
                                    self.collection.remove(id);
                                })
                            );
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

                        //yell on reject
                        settingsUtil.yellOnReject(
                            api.update(selectedObj).done(function () {
                                self.render();
                            })
                        );
                    },

                    onMakeSortable: function () {

                        this.$el.find('ol').sortable({
                            containment: this.el,
                            axis: 'y',
                            handle: '.drag-handle',
                            scroll: true,
                            delay: 150,
                            stop: function () {
                                var arrayOfFilters = $node.find('li[data-id]'),
                                data = _.map(arrayOfFilters, function (single) {
                                    return parseInt($(single).attr('data-id'), 10);
                                });
                                 //yell on reject
                                settingsUtil.yellOnReject(
                                    api.reorder(data)
                                );
                            }
                        });
                    }

                }),

                    mailFilter = new MailfilterEdit();
                $node.append(mailFilter.render().$el);


            }).fail(function (error) {
                deferred.reject(error);
            });

            return deferred;

        }
    };

});
