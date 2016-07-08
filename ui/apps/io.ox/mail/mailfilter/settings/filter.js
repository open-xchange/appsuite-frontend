/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/filter', [
    'io.ox/core/extensions',
    'io.ox/core/api/mailfilter',
    'io.ox/mail/mailfilter/settings/model',
    'io.ox/core/tk/dialogs',
    'io.ox/core/notifications',
    'io.ox/settings/util',
    'io.ox/mail/mailfilter/settings/filter/view-form',
    'gettext!io.ox/mail',
    'io.ox/mail/mailfilter/settings/filter/defaults',
    'io.ox/backbone/mini-views/listutils',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/backbone/disposable',
    'static/3rd.party/jquery-ui.min.js',
    'less!io.ox/mail/mailfilter/settings/style'
], function (ext, api, mailfilterModel, dialogs, notifications, settingsUtil, FilterDetailView, gt, DEFAULTS, listUtils, ListView, DisposableView) {

    'use strict';

    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/mailfilter/model', api),
        collection,
        notificationId = _.uniqueId('notification_');

    function containsStop(actioncmds) {
        var stop = false;
        _.each(actioncmds, function (action) {
            if (_.contains(['stop'], action.id)) {
                stop = true;
            }
        });
        return stop;
    }

    function updatePositionInCollection(collection, positionArray) {
        _.each(positionArray, function (key, val) {
            collection.get(key).set('position', val);
        });
        collection.sort();
    }

    function renderDetailView(evt, data, config) {
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

        myView = new FilterDetailView({ model: data, listView: evt.data.listView, config: config });

        if (myView.model.get('test').tests) {
            var conditionsCopy = myView.model.get('test');

            conditionsCopy.tests = filterCondition(conditionsCopy.tests, { id: 'true' });

            if (conditionsCopy.tests.length === 1) {
                var includedTest = _.copy(conditionsCopy.tests[0]);
                conditionsCopy = includedTest;
            }
            myView.model.set('test', conditionsCopy);
        }

        testArray = _.copy(myView.model.get('test'), true);
        actionArray = _.copy(myView.model.get('actioncmds'), true);
        rulename = _.copy(myView.model.get('rulename'), true);

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
        .addPrimaryButton('save', gt('Save'), 'save', { tabIndex: 1 })
        .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 });

        //disable save button if no action is set
        if (actionArray.length === 0) myView.dialog.getFooter().find('[data-action="save"]').prop('disabled', true);

        myView.dialog.show();
        myView.$el.find('input[name="rulename"]').focus();

        if (data.id === undefined) {
            myView.$el.find('input[name="rulename"]').trigger('select');
        }

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
        draw: function (evt, config) {
            renderDetailView(evt, evt.data.obj, config);
        }
    });

    ext.point('io.ox/settings/mailfilter/filter/settings/actions/common').extend({
        index: 200,
        id: 'actions',
        draw: function (model) {
            var flag = (model.get('flags') || [])[0];
            var title = model.get('rulename'),
                texttoggle = model.get('active') ? gt('Disable') : gt('Enable'),
                actioncmds = model.get('actioncmds'),
                faClass = containsStop(actioncmds) ? 'fa-ban' : 'fa-arrow-down',
                actionValue;

            if (flag === 'vacation') {
                actionValue = 'edit-vacation';
            } else if (flag === 'autoforward') {
                actionValue = 'edit-autoforward';
            } else {
                actionValue = 'edit';
            }

            $(this).append(
                listUtils.controlsEdit({
                    'aria-label': gt('Edit %1$s', title),
                    'data-action': actionValue
                }),
                listUtils.controlsToggle(texttoggle),
                listUtils.controlProcessSub({
                    faClass: faClass,
                    title: gt('Process subsequent rules of %1$s', title)
                }),
                listUtils.controlsDelete({ title: gt('Remove %1$s', title) })
            );
        }
    });

    ext.point('io.ox/settings/mailfilter/filter/settings/actions/vacation').extend({
        index: 200,
        id: 'actions',
        draw: function (model) {
            //redirect
            ext.point('io.ox/settings/mailfilter/filter/settings/actions/common')
                .invoke('draw', this, model);
        }
    });

    ext.point('io.ox/settings/mailfilter/filter/settings/actions/autoforward').extend({
        index: 200,
        id: 'actions',
        draw: function (model) {
            //redirect
            ext.point('io.ox/settings/mailfilter/filter/settings/actions/common')
                .invoke('draw', this, model);
        }
    });

    return {
        editMailfilter: function ($node, baton) {

            var createExtpointForSelectedFilter = function (node, args, config) {
                    ext.point('io.ox/settings/mailfilter/filter/settings/detail').invoke('draw', node, args, config);
                },
                self = this;

            return this.initialize().then(function (data, config) {
                data = data[0];
                config = config[0];

                collection = factory.createCollection(data);
                collection.comparator = function (model) {
                    return model.get('position');
                };

                $node.closest('.scrollable-pane').on('refresh:mailfilter', function () {
                    self.refresh();
                });

                var FilterSettingsView,
                    MailfilterEdit;

                FilterSettingsView = DisposableView.extend({
                    tagName: 'li',

                    className: 'settings-list-item',

                    saveTimeout: 0,

                    render: function () {
                        var flag = (this.model.get('flags') || [])[0],
                            self = this,
                            actions = (this.model.get('actioncmds') || []);

                        if (this.disposed) {
                            return;
                        }

                        function checkForUnknown() {
                            var unknown = false;
                            _.each(actions, function (action) {
                                if (!_.contains(['stop', 'vacation'], action.id)) {
                                    unknown = _.isEmpty(_.where(DEFAULTS.actions, { id: action.id }));
                                }
                            });

                            return unknown ? 'unknown' : undefined;
                        }

                        function getEditableState() {
                            return (checkForUnknown() === 'unknown' || _.contains(['autoforward', 'spam', 'vacation'], flag)) ? 'fixed' : 'editable';
                        }

                        var title = self.model.get('rulename'),
                            titleNode;

                        this.$el.attr({
                            'data-id': self.model.get('id')
                        })
                        .addClass('draggable ' + getEditableState() + ' ' + (self.model.get('active') ? 'active' : 'disabled'))
                        .empty().append(

                            listUtils.dragHandle(gt('Drag to reorder filter rules'), this.model.collection.length <= 1 ? 'hidden' : ''),
                            titleNode = listUtils.makeTitle(title),
                            listUtils.makeControls().append(function () {
                                var point = ext.point('io.ox/settings/mailfilter/filter/settings/actions/' + (checkForUnknown() || flag || 'common'));
                                point.invoke('draw', $(this), self.model);
                            })
                        );

                        self.model.on('change:rulename', function (el, val) {
                            titleNode.text(val);
                        });

                        self.model.on('ChangeProcessSub', function (status) {
                            var target = self.$el.find('[data-action="toggle-process-subsequent"] i');
                            if (status) {
                                target.removeClass('fa-ban').addClass('fa-arrow-down');
                            } else {
                                target.removeClass('fa-arrow-down').addClass('fa-ban');
                            }

                        });
                        return self;
                    },

                    events: {
                        'click [data-action="toggle"]': 'onToggle',
                        'click [data-action="delete"]': 'onDelete',
                        'click [data-action="edit"]': 'onEdit',
                        'click [data-action="toggle-process-subsequent"]': 'onToggleProcessSub',
                        'click [data-action="edit-vacation"]': 'onEditVacation',
                        'click [data-action="edit-autoforward"]': 'onEditAutoforward'
                    },

                    onToggle: function (e) {
                        e.preventDefault();
                        var self = this;
                        this.model.set('active', !this.model.get('active'));

                        //yell on reject
                        settingsUtil.yellOnReject(
                            api.update(self.model).done(function () {
                                self.$el.toggleClass('active', self.model.get('active'));
                                self.$el.toggleClass('disabled', !self.model.get('active'));
                                $(e.target).text(self.model.get('active') ? gt('Disable') : gt('Enable'));
                            })
                        );
                    },

                    onToggleProcessSub: function (e) {
                        e.preventDefault();
                        var self = this,
                            actioncmds = this.model.get('actioncmds'),
                            stop = containsStop(actioncmds);

                        if (stop) {
                            actioncmds.pop();
                        } else {
                            actioncmds.push({ id: 'stop' });
                        }

                        this.model.set('actioncmds', actioncmds);

                        //yell on reject
                        settingsUtil.yellOnReject(
                            api.update(self.model).done(function () {
                                var target = $(e.target).closest('.list-item-controls').find('[data-action="toggle-process-subsequent"] i');
                                if (containsStop(actioncmds)) {
                                    target.removeClass('fa-arrow-down').addClass('fa-ban');
                                } else {
                                    target.removeClass('fa-ban').addClass('fa-arrow-down');
                                }
                            })
                        );
                    },

                    onDelete: function (e) {
                        e.preventDefault();
                        var self = this,
                            id = self.model.get('id');

                        new dialogs.ModalDialog()
                        .text(gt('Do you really want to delete this filter rule?'))
                        .addPrimaryButton('delete', gt('Delete'), 'delete', { 'tabIndex': '1' })
                        .addButton('cancel', gt('Cancel'), 'cancel', { 'tabIndex': '1' })
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                if (id !== false) {
                                    //yell on reject
                                    self.model.collection.remove(id);
                                    settingsUtil.yellOnReject(
                                        api.deleteRule(id).done(function () {
                                            var arrayOfFilters,
                                                data;
                                            $node.find('.controls [data-action="add"]').focus();

                                            arrayOfFilters = $node.find('li[data-id]');
                                            data = _.map(arrayOfFilters, function (single) {
                                                return parseInt($(single).attr('data-id'), 10);
                                            });
                                            //yell on reject
                                            settingsUtil.yellOnReject(
                                                api.reorder(data)
                                            );
                                            updatePositionInCollection(collection, data);

                                        })
                                    );
                                }
                            }
                        });

                    },

                    onEdit: function (e) {
                        e.preventDefault();
                        var self = this;
                        e.data = {};
                        e.data.id = self.model.get('id');
                        e.data.obj = self.model;
                        if (e.data.obj !== undefined) {
                            createExtpointForSelectedFilter(this.$el.parent(), e, config);
                        }
                    },

                    onEditVacation: function (e) {
                        e.preventDefault();
                        baton.tree.trigger('virtual', 'virtual/settings/' + 'io.ox/vacation', {});
                    },

                    onEditAutoforward: function (e) {
                        e.preventDefault();
                        baton.tree.trigger('virtual', 'virtual/settings/' + 'io.ox/autoforward', {});
                    }
                });

                MailfilterEdit = Backbone.View.extend({

                    initialize: function () {
                        this.collection = collection;
                    },

                    render: function () {
                        this.$el.append($('<h1>').addClass('pull-left').text(gt('Mail Filter Rules')),
                            $('<div>').addClass('btn-group pull-right').append(
                                $('<button>').addClass('btn btn-primary').text(gt('Add new rule')).attr({
                                    'data-action': 'add',
                                    tabindex: 1,
                                    type: 'button'
                                })
                            ),
                            $('<div class="clearfix">'),
                            $('<div class="sr-only" role="log" aria-live="polite" aria-relevant="all">').attr('id', notificationId)
                        );
                        this.renderFilter();
                        return this;
                    },

                    renderFilter: function () {
                        var self = this,
                            list = self.$el.find('.widget-list').empty();
                        if (this.collection.length === 0) {
                            list.append($('<div>').text(gt('There is no rule defined')));
                        } else {
                            this.$el.append(new ListView({
                                collection: this.collection,
                                sortable: true,
                                containment: this.$el,
                                notification: this.$('#' + notificationId),
                                childView: FilterSettingsView,
                                update: function () {
                                    var arrayOfFilters = $node.find('li[data-id]'),
                                        data = _.map(arrayOfFilters, function (single) {
                                            return parseInt($(single).attr('data-id'), 10);
                                        });

                                    //yell on reject
                                    settingsUtil.yellOnReject(
                                        api.reorder(data)
                                    );
                                    updatePositionInCollection(collection, data);
                                }
                            }).render().$el);
                        }
                    },

                    events: {
                        'click [data-action="add"]': 'onAdd'
                    },

                    onAdd: function (args) {
                        args.data = {
                            listView: this,
                            obj: factory.create(mailfilterModel.protectedMethods.provideEmptyModel())
                        };
                        createExtpointForSelectedFilter(this.el, args, config);
                    }

                });

                var mailFilter = new MailfilterEdit();

                $node.append(mailFilter.render().$el);
                return collection;
            });

        },
        initialize: function () {
            var options = {
                api: api,
                model: mailfilterModel,
                filterDefaults: DEFAULTS
            };
            return $.when(api.getRules(), api.getConfig(), options);
        },

        refresh: function () {
            this.initialize().done(function (data) {
                _.each(data[0], function (rule) {
                    collection.add(factory.create(rule), { merge: true });
                });
                collection.trigger('add');
            });

        }
    };

});
