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
    'io.ox/backbone/views/modal',
    'io.ox/core/notifications',
    'io.ox/settings/util',
    'io.ox/mail/mailfilter/settings/filter/view-form',
    'gettext!io.ox/mail',
    'io.ox/backbone/mini-views/listutils',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/backbone/views/disposable',
    'settings!io.ox/mail',
    'io.ox/mail/mailfilter/settings/filter/defaults',
    'io.ox/core/folder/picker',
    'io.ox/mail/api',
    'static/3rd.party/jquery-ui.min.js',
    'less!io.ox/mail/mailfilter/settings/style'
], function (ext, api, mailfilterModel, ModalDialog, notifications, settingsUtil, FilterDetailView, gt, listUtils, ListView, DisposableView, settings, DEFAULTS, picker, mailAPI) {

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
            // manipulating the focus renders the dialog dropdown menus dysfunctional
            pause: function () {
                // $(document).off('focusin', this.keepFocus);
                this.$el.next().addBack().hide();
            },
            resume: function () {
                // $(document).on('focusin', $.proxy(this.keepFocus, this));
                this.$el.next().addBack().show();
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
            help: data.id === undefined ? 'ox.appsuite.user.sect.email.mailfilter.create.html' : 'ox.appsuite.user.sect.email.mailfilter.change.html'
        });

        myView.dialog.$body.append(
            myView.render().el
        );

        if (defaults.applyMailFilterSupport) {
            myView.dialog.addButton({
                label: gt('Save and apply'),
                action: 'apply'
            });
        }

        myView.dialog.addButton({
            label: gt('Save'),
            action: 'save'
        })
        .addCancelButton({ left: true });

        //disable save button if no action is set
        if (actionArray.length === 0) myView.dialog.$el.find('.modal-footer[data-action="save"]').prop('disabled', true);

        myView.dialog.open();
        myView.$el.find('input[name="rulename"]').focus();

        if (data.id === undefined) {
            myView.$el.find('input[name="rulename"]').trigger('select');
        }

        myView.collection = collection;

        myView.dialog.on('save', function () {
            myView.onSave();
        });

        myView.dialog.on('apply', function () {
            myView.onApply();
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
                applytoggle = gt('Apply'),
                texttoggle = model.get('active') ? gt('Disable') : gt('Enable'),
                actioncmds = model.get('actioncmds'),
                faClass = containsStop(actioncmds) ? 'fa-ban' : 'fa-arrow-down',
                actionValue,
                applyToggle = flag === 'vacation' || flag === 'autoforward' || !defaults.applyMailFilterSupport ? [] : listUtils.applyToggle(applytoggle);

            if (flag === 'vacation') {
                actionValue = 'edit-vacation';
            } else if (flag === 'autoforward') {
                actionValue = 'edit-autoforward';
            } else {
                actionValue = 'edit';
            }

            $(this).append(
                applyToggle,
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
        editMailfilter: function ($node, baton) {
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

                    initialize: function () {
                        if (_.indexOf(this.model.get('flags'), 'vacation') !== -1) this.listenTo(ox, 'mail:change:vacation-notice', this.handleToogleState);
                        if (_.indexOf(this.model.get('flags'), 'autoforward') !== -1) this.listenTo(ox, 'mail:change:auto-forward', this.handleToogleState);
                        this.listenTo(this.model, 'apply', function () {
                            this.onApply();
                        });
                    },

                    handleToogleState: function (model) {
                        this.model.set('active', model.get('active'));
                    },

                    render: function () {
                        if (this.disposed) return;

                        var flag = (this.model.get('flags') || [])[0],
                            self = this,
                            actions = (this.model.get('actioncmds') || []),
                            testsPart = this.model.get('test'),
                            supportColorFlags = settings.get('features/flag/color');

                        function checkForUnknown() {
                            var unknown = false;

                            function checkForColorFlags(a) {
                                if (!a.flags) return;
                                return !supportColorFlags && (/\$cl_/g.test(a.flags[0]));
                            }

                            function collectIds(testsPart) {
                                var idList = {};
                                // is single test
                                if (!testsPart.tests) {
                                    idList[testsPart.id] = true;
                                } else {
                                    _.each(testsPart.tests, function (value) {
                                        if (!value.tests) {
                                            idList[value.id] = true;
                                        } else {
                                            // there is a nested test in the rule
                                            if (!config.options.allowNestedTests) unknown = true;
                                            _.each(value.tests, function (value) {
                                                idList[value.id] = true;
                                            });
                                        }
                                    });
                                }

                                return idList;
                            }

                            // is there an unsupported/disabled action?
                            _.each(actions, function (action) {
                                // in MW
                                if (_.isEmpty(_.where(config.actioncmds, { id: action.id })) || checkForColorFlags(action)) unknown = true;
                                // in UI
                                if (!_.contains(['vacation', 'stop'], action.id) && _.isEmpty(_.where(defaults.actions, { id: action.id })) || checkForColorFlags(action)) unknown = true;

                            });

                            // is there an unsupported/disabled test?
                            _.each(collectIds(testsPart), function (value, key) {
                                // in MW
                                if (_.isEmpty(_.where(config.tests, { id: key }))) unknown = true;
                                // in UI
                                if (_.isEmpty(_.where(defaults.tests, { id: key }))) unknown = true;
                            });

                            return unknown ? 'unknown' : undefined;
                        }

                        function getEditableState() {
                            return (checkForUnknown() === 'unknown' || _.contains(['autoforward', 'spam', 'vacation'], flag)) ? 'fixed' : 'editable';
                        }

                        var title = self.model.get('rulename'),
                            titleNode;

                        this.$el.attr('data-id', self.model.get('id'))
                            .addClass('draggable ' + getEditableState())
                            .attr('draggable', true)
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
                        'click [data-action="apply"]': 'onApply',
                        'click [data-action="delete"]': 'onDelete',
                        'click [data-action="edit"]': 'onEdit',
                        'click [data-action="toggle-process-subsequent"]': 'onToggleProcessSub',
                        'click [data-action="edit-vacation"]': 'onEditVacation',
                        'click [data-action="edit-autoforward"]': 'onEditAutoforward'
                    },

                    propagate: function (model) {

                        if (_.indexOf(model.get('flags'), 'vacation') !== -1) {
                            require(['io.ox/mail/mailfilter/vacationnotice/model'], function (Model) {
                                var vacationnoticeModel = new Model();
                                vacationnoticeModel.set(model.toJSON());
                                ox.trigger('mail:change:vacation-notice', vacationnoticeModel);
                            });
                        }

                        if (_.indexOf(model.get('flags'), 'autoforward') !== -1) {
                            require(['io.ox/mail/mailfilter/autoforward/model'], function (Model) {
                                var autoforwardModel = new Model();
                                autoforwardModel.set(model.toJSON());
                                ox.trigger('mail:change:auto-forward', autoforwardModel);
                            });
                        }
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
                                self.propagate(self.model);
                            })
                        );
                    },

                    onApply: function (e) {
                        if (e) e.preventDefault();
                        var self = this;
                        picker({
                            async: true,
                            context: 'filter',
                            title: gt('Select the folder to apply the rule to'),
                            //#. 'Apply' as button text to confirm the chosen email folder where a new filter rule shall be applied to via a picker dialog.
                            button: gt('Apply'),
                            done: function (id, dialog) {
                                dialog.close();
                                var rule = self.$el.find('a[data-action="apply"]');
                                rule.empty().append($('<i aria-hidden="true">').addClass('fa fa-refresh fa-spin'));

                                api.apply({ folderId: id, id: self.model.id }).then(function () {
                                    return mailAPI.expunge(id);
                                }).fail(function (response) {
                                    notifications.yell('error', response.error);
                                }).then(function () {
                                    // applied rule might have moved mails into folders or changed mails
                                    _(mailAPI.pool.getCollections()).forEach(function (o) {
                                        o.collection.expire();
                                    });
                                    mailAPI.refresh();
                                    rule.empty().text(gt('Apply'));
                                });
                            },
                            module: 'mail',
                            root: '1',
                            settings: settings,
                            persistent: 'folderpopup'
                        });
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

                        //#. 'Delete filter rule' as a header of a modal dialog to confirm to delete a mail filter rule.
                        new ModalDialog({ title: gt('Delete filter rule'), description: gt('Do you really want to delete this filter rule?') })
                            .addCancelButton()
                            .addButton({ label: gt('Delete'), action: 'delete' })
                            .on('delete', function () {
                                var view = this,
                                    model = this.model;
                                if (model.get('id') === false) return;
                                collection.remove(model);
                                //yell on reject
                                settingsUtil.yellOnReject(
                                    api.deleteRule(model.get('id')).done(function () {
                                        // for proper handling in mail-settings/mail-list
                                        view.propagate(model.set('active', false));
                                        $node.find('.controls [data-action="add"]').focus();
                                        var arrayOfFilters = $node.find('li[data-id]'),
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
                            }.bind(this))
                            .open();
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
                        this.listenTo(ox, 'refresh^', this.onRefresh);
                        this.listenTo(ox, 'app:start app:resume', function (data) { this.handleRefresh(data); });
                        this.$el.on('dispose', function () { this.stopListening(); }.bind(this));
                    },

                    onRefresh: function () {
                        self.refresh();
                    },

                    handleRefresh: function (data) {
                        if (data.attributes.name !== baton.tree.app.attributes.name) {
                            this.stopListening(ox, 'refresh^');
                        } else {
                            this.listenTo(ox, 'refresh^', this.onRefresh);
                        }
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
                            childView: FilterSettingsView
                        }).on('order:changed', function () {
                            var arrayOfFilters = $node.find('li[data-id]'),
                                data = _.map(arrayOfFilters, function (single) {
                                    return parseInt($(single).attr('data-id'), 10);
                                });

                            //yell on reject
                            settingsUtil.yellOnReject(
                                api.reorder(data)
                            );
                            updatePositionInCollection(collection, data);
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
