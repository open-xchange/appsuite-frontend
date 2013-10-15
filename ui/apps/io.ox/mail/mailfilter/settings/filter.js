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
     'io.ox/settings/util',
     'io.ox/mail/mailfilter/settings/filter/view-form',
     'gettext!io.ox/mail'
    ], function (ext, api, mailfilterModel, dialogs, settingsUtil, FilterDetailView, gt) {

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
                createExtpointForSelectedFilter = function (args) {
                    ext.point('io.ox/settings/mailfilter/filter/settings/detail').invoke('draw', args.data.node, args);
                };

            api.getRules().done(function (data) {

                collection = factory.createCollection(data);
                var AccountSelectView = Backbone.View.extend({

                    _modelBinder: undefined,

                    initialize: function () {
                        this._modelBinder = new Backbone.ModelBinder();
                    },

                    render: function () {
                        var flagArray = this.model.get('flags'),
                            self = this;

                        function getEditableState() {
                            if (flagArray) {
                                return flagArray[0] !== 'vacation' && flagArray[0] !== 'autoforward' ? 'editable' : 'fixed';
                            } else {
                                return 'editable';
                            }
                        }

                        var listItem = $('<li>').attr({
                                'data-id': self.model.get('id')
                            })
                            .addClass('selectable deletable-item ' + getEditableState() + ' ' + (self.model.get('active') ? 'active' : 'disabled'))
                            .append(
                                $('<div>').addClass('drag-handle').append(
                                    $('<i/>').addClass('icon-reorder')
                                ),
                                $('<div>').addClass('pull-right').append(function () {
                                    if (getEditableState() !== 'editable') return;
                                    $(this).append(
                                        $('<a>').addClass('action').text(gt('Edit')).attr({
                                            'data-action': 'edit'
                                        }),
                                        $('<a>').addClass('action').text(self.model.get('active') ? gt('Disable') : gt('Enable')).attr({
                                            'data-action': 'toggle'
                                        }),
                                        $('<a>').addClass('close').append($('<i/>').addClass('icon-trash')).attr({
                                            'data-action': 'delete'
                                        })
                                    );
                                }),
                                $('<span>').attr('data-property', 'rulename').addClass('list-title')
                            );

                        self.$el.empty().append(listItem);
                        self._modelBinder.bind(this.model, this.el, Backbone.ModelBinder.createDefaultBindings(this.el, 'data-property'));
                        return self;
                    },
                    events: {
                        'click .deletable-item.editable': 'onSelect'
                    },

                    onSelect: function () {
                        // in this special case dont't use prop instead of attr
                        this.$el.parent().find('li[selected="selected"]').attr('selected', null);
                        this.$el.find('.deletable-item').attr('selected', 'selected');
                    }

                }),

                MailfilterEdit = Backbone.View.extend({

                    initialize: function () {
                        _.bindAll(this);
                        this.collection = collection;
                        this.collection.bind('add', this.render);
                        this.collection.bind('remove', this.render);
                    },

                    render: function () {
                        var self = this;

                        // <div>
                        //     <h1 class="no-margin">{{=it.strings.TITLE}}</h1>
                        // </div>
                        // <div class="section">
                        //     <div id="controls">
                        //         <div class="btn-group pull-right">
                        //             <button type="button" class="btn btn-primary" data-action="add">{{=it.strings.BUTTON_ADD}}</button>
                        //         </div>
                        //     </div>
                        //     <ol class="widget-list"></ol>
                        //     <div class="sectioncontent"></div>
                        // </div>


                        // staticStrings =  {
                        //     BUTTON_ADD: gt('Add new rule'),
                        //     TITLE: gt('Mail Filter'),
                        //     EMPTY: gt('There is no rule defined')
                        // },

                        self.$el.empty().append(
                            $('<div>').append(
                                $('<h1>').addClass('no-margin').text(gt('Mail Filter'))
                            ),
                            $('<div>').addClass('section').append(
                                $('<div>').attr('id', 'controls').append(
                                    $('<div>').addClass('btn-group pull-right').append(
                                        $('<button>').addClass('btn btn-primary').text(gt('Add new rule')).attr({
                                            'data-action': 'add'
                                        })
                                    )
                                ),
                                $('<ol>').addClass('widget-list'),
                                $('<div>').addClass('sectioncontent')
                            )
                        );

                        if (this.collection.length === 0) {
                            self.$el.find('.widget-list').append($('<div>').text(gt('There is no rule defined')));
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
                            start: function (e, ui) {
                                ui.item.attr('aria-grabbed', 'true');
                            },
                            stop: function (e, ui) {
                                ui.item.attr('aria-grabbed', 'false');
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
