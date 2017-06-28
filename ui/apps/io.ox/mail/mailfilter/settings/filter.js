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
    'io.ox/backbone/views/modal',
    'io.ox/core/notifications',
    'io.ox/settings/util',
    'io.ox/mail/mailfilter/settings/filter/view-form',
    'gettext!io.ox/mail',
    'io.ox/backbone/mini-views/listutils',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/backbone/disposable',
    'settings!io.ox/mail',
    'io.ox/mail/mailfilter/settings/filter/defaults',
    'static/3rd.party/jquery-ui.min.js',
    'less!io.ox/mail/mailfilter/settings/style'

], function (ext, api, mailfilterModel, dialogs, ModalDialog, notifications, settingsUtil, FilterDetailView, gt, listUtils, ListView, DisposableView, settings, DEFAULTS) {

    'use strict';

    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/mailfilter/model', api),
        collection,
        notificationId = _.uniqueId('notification_'),
        conditionsTranslation = DEFAULTS.conditionsTranslation,
        actionsTranslations = DEFAULTS.actionsTranslations,
        defaults = DEFAULTS,
        actionCapabilities = DEFAULTS.actionCapabilities,
        conditionsMapping = DEFAULTS.conditionsMapping;

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

        myView = new FilterDetailView({
            model: data,
            listView: evt.data.listView,
            config: config,
            conditionsTranslation: conditionsTranslation,
            actionsTranslations: actionsTranslations,
            defaults: defaults,
            actionCapabilities: actionCapabilities,
            conditionsMapping: conditionsMapping
        });

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

        var Dialog = ModalDialog.extend({
            // manipulating the focus renders the dialog dropdowns unfunctional
            pause: function () {
                // $(document).off('focusin', this.keepFocus);
                this.$el.next().addBack().hide();
                this.toggleAriaHidden(false);
            },
            resume: function () {
                // $(document).on('focusin', $.proxy(this.keepFocus, this));
                this.$el.next().addBack().show();
                this.toggleAriaHidden(true);
            }
        });

        myView.dialog = new Dialog({
            top: 60,
            width: 800,
            center: false,
            maximize: true,
            async: true,
            point: 'io.ox/settings/mailfilter/filter/settings/detail/dialog',
            title: header,
            help: 'ox.appsuite.user.sect.email.mailfilter.change.html'
        });

        myView.dialog.$body.append(
            myView.render().el
        );

        myView.dialog.addButton({
            label: gt('Save'),
            action: 'save'
        })
        .addCancelButton();

        //disable save button if no action is set
        if (actionArray.length === 0) myView.dialog.$el.find('.modal-footer[data-action="save"]').prop('disabled', true);

        myView.dialog.open();
        myView.$el.find('input[name="rulename"]').focus();

        if (data.id === undefined) {
            myView.$el.find('input[name="rulename"]').trigger('select');
        }

        myView.collection = collection;

        myView.dialog.on('save', function () {
            myView.dialog.$body.find('.io-ox-mailfilter-edit').trigger('save');
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

    ext.point('io.ox/settings/mailfilter/filter/settings/actions/unknown').extend({
        index: 200,
        id: 'actions',
        draw: function (model) {
            var title = model.get('rulename');
            $(this).append(
                listUtils.drawWarning(gt('This rule contains unsupported properties. ')),
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
        editMailfilter: function ($node) {

            var createExtpointForSelectedFilter = function (node, args, config) {
                    ext.point('io.ox/settings/mailfilter/filter/settings/detail').invoke('draw', node, args, config);
                },
                self = this,
                scrollPane =  $node.closest('.scrollable-pane');

            return this.initialize().then(function (data, config) {

                // adds test for testcase
                // config.tests.push({ test: 'newtest', comparison: ['regex', 'is', 'contains', 'matches', 'testValue'] });

                collection = factory.createCollection(data);
                collection.comparator = function (model) {
                    return model.get('position');
                };

                scrollPane.one('refresh:mailfilter', function () {
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
                            actions = (this.model.get('actioncmds') || []),
                            supportColorFlags = settings.get('features/flag/color');

                        if (this.disposed) {
                            return;
                        }

                        function checkForUnknown() {
                            var unknown = false;

                            function checkForColorFlags(a) {
                                if (a.flags) {
                                    return !supportColorFlags && (/\$cl_/g.test(a.flags[0]));
                                }
                            }
                            _.each(actions, function (action) {
                                if (!_.contains(['stop', 'vacation'], action.id)) {
                                    unknown = _.isEmpty(_.where(defaults.actions, { id: action.id })) || checkForColorFlags(action);
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
                        .addClass('draggable ' + getEditableState())
                        .toggleClass('active', self.model.get('active'))
                        .toggleClass('disabled', !self.model.get('active'))
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
                        .addPrimaryButton('delete', gt('Delete'), 'delete')
                        .addButton('cancel', gt('Cancel'), 'cancel')
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
                        e.data.listView = this;
                        if (e.data.obj !== undefined) {
                            createExtpointForSelectedFilter(this.$el.parent(), e, config);
                        }
                    },

                    onEditVacation: function (e) {
                        e.preventDefault();
                        require(['io.ox/mail/mailfilter/vacationnotice/view'], function (view) {
                            view.open();
                        });
                    },

                    onEditAutoforward: function (e) {
                        e.preventDefault();
                        require(['io.ox/mail/mailfilter/autoforward/view'], function (view) {
                            view.open();
                        });
                    }
                });

                MailfilterEdit = Backbone.View.extend({

                    initialize: function () {
                        this.collection = collection;
                    },

                    render: function () {
                        this.$el.empty();
                        this.$el.append(
                            $('<h1>').text(gt('Mail Filter Rules')),
                            $('<div class="form-group buttons">').append(
                                $('<button type="button" class="btn btn-primary" data-action="add">').append(
                                    $('<i class="fa fa-plus" aria-hidden="true">'), $.txt(gt('Add new rule'))
                                )
                            ),
                            $('<div class="sr-only" role="log" aria-live="polite" aria-relevant="all">').attr('id', notificationId)
                        );
                        this.renderFilter();
                        return this;
                    },

                    handleEmptynotice: function () {
                        if (this.collection.length === 0) {
                            this.$el.append($('<div class="hint">').text(gt('There is no rule defined')));
                        } else {
                            this.$el.find('.hint').remove();
                        }
                    },

                    renderFilter: function () {
                        this.handleEmptynotice();

                        this.listenTo(this.collection, 'add remove', this.handleEmptynotice.bind(this));

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
            // needed for mail actions
            var options = {
                api: api,
                model: mailfilterModel,
                filterDefaults: defaults
            };

            return $.when(api.getRules(), api.getConfig(), options);
        },

        refresh: function () {
            this.initialize().done(function (data) {
                _(data).each(function (rule) {
                    collection.add(factory.create(rule), { merge: true });
                });
            });
        }
    };
});
