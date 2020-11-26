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

define('io.ox/mail/mailfilter/settings/filter/view-form', [
    'gettext!io.ox/settings',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/mail/mailfilter/settings/filter/tests/util',
    'settings!io.ox/core'
], function (gt, ext, mini, Dropdown, util, coreSettings) {

    'use strict';

    var POINT = 'io.ox/mailfilter/settings/filter/detail',
        testCapabilities,
        currentState = null,

        checkForMultipleTests = function (el) {
            return $(el).find('[data-test-id]');
        },

        setFocus = function (el, type, nestedConditionID) {

            var node = nestedConditionID ? $(el).find('[data-test-id="' + nestedConditionID + '"]') : $(el);

            if (type === 'condition') node.find((nestedConditionID ? '' : '.main') + '.add-condition > a').focus();

            if (type === 'action') $(el).find('.add-action > a').focus();

            if (type === 'appliesto') node.find((nestedConditionID ? '' : '.main') + '.appliesto > a').focus();
        },

        renderWarningForEmptyTests = function (node) {
            var warning = $('<div class="alert alert-info">').text(gt('This rule applies to all messages. Please add a condition to restrict this rule to specific messages.'));
            node.append(warning);
        },

        renderWarningForEmptyActions = function (node) {
            var warning = $('<div>').addClass('alert alert-danger').text(gt('Please define at least one action.'));
            node.append(warning);
        },

        filterValues = function (testType, possibleValues) {
            var availableValues = {};
            _.each(possibleValues, function (value, key) {
                if (_.indexOf(testCapabilities[testType], key) !== -1) availableValues[key] = value;
            });
            return availableValues;
        },

        drawDropdown = function (activeValue, values, options) {
            var active = values[activeValue] || activeValue;
            if (options.caret) {
                active = active + '<b class="caret">';
            }

            function getOptions() {
                return options.sort ?
                    _(options.sort).map(function (value) {
                        if (value === options.skip) return;
                        return $('<li>').append(
                            $('<a href="#" data-action="change-dropdown-value" role="menuitemradio">').attr('data-value', value).data(options).append(
                                $.txt(values[value])
                            )
                        );
                    }) :
                    _(values).map(function (name, value) {
                        if (value === options.skip) return;
                        return $('<li>').append(
                            $('<a href="#" data-action="change-dropdown-value">').attr('data-value', value).data(options).append(
                                $.txt(name)
                            )
                        );
                    });
            }

            var $toggle = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="0">').html(active),
                $ul = $('<ul class="dropdown-menu" role="menu">').append(
                    getOptions()
                );

            return new Dropdown({
                className: 'action dropdown value ' + (options.classes ? options.classes : ''),
                $toggle: $toggle,
                $ul: $ul
            }).render().$el;
        },

        returnKeyForStop = function (actionsArray) {
            var indicatorKey;
            _.each(actionsArray, function (action, key) {
                if (_.isEqual(action, { id: 'stop' })) {
                    indicatorKey = key;
                }
            });
            return indicatorKey;
        },

        FilterDetailView = Backbone.View.extend({
            tagName: 'div',
            className: 'io-ox-mailfilter-edit',

            initialize: function (opt) {
                this.conditionsTranslation = opt.conditionsTranslation;
                this.actionsTranslations = opt.actionsTranslations;
                this.defaults = opt.defaults;
                this.config = opt.config;

                testCapabilities = {};
                _.each(opt.config.tests, function (value) {
                    testCapabilities[value.id] = value.comparisons;
                });

                this.listView = opt.listView;
            },

            render: function () {

                var baton = ext.Baton({ model: this.model, view: this });
                ext.point(POINT + '/view').invoke('draw', this.$el.empty(), baton);

                baton.view.$el.trigger('toggle:saveButton');

                return this;

            },
            events: {
                'save': 'onSave',
                'apply': 'onApply',
                'click [data-action=change-dropdown-value]': 'onChangeDropdownValue',
                'click [data-action="change-color"]': 'onChangeColor',
                'click [data-action="remove-test"]': 'onRemoveTest',
                'click [data-action="remove-action"]': 'onRemoveAction',
                'toggle:saveButton': 'onToggleSaveButton'
            },

            onToggleSaveButton: function () {
                if (this.$el.find('.has-error, .alert-danger').length === 0) {
                    this.dialog.$el.find('.modal-footer [data-action="save"]').prop('disabled', false);
                    this.dialog.$el.find('.modal-footer [data-action="apply"]').prop('disabled', false);
                } else {
                    this.dialog.$el.find('.modal-footer [data-action="save"]').prop('disabled', true);
                    this.dialog.$el.find('.modal-footer [data-action="apply"]').prop('disabled', true);
                }
            },

            removeTest: function (testArray, testID) {

                // nested condition
                if (testID.split('_').length === 2) {
                    var rootConditionID = testID.split('_')[0],
                        nestedConditionID = testID.split('_')[1];

                    // remove condition in nested condition
                    testArray.tests[rootConditionID].tests.splice(nestedConditionID, 1);
                    // handle empty nested condition
                    if (testArray.tests[rootConditionID].tests.length === 0) testArray.tests.splice(rootConditionID, 1);

                    // only one test left
                    if (testArray.tests.length === 1) testArray = testArray.tests[0];

                } else if (testArray.tests && testArray.tests.length > 2) {
                    testArray.tests = _(testArray.tests).without(testArray.tests[testID]);
                } else if (testArray.tests) {
                    testArray.tests = _(testArray.tests).without(testArray.tests[testID]);
                    testArray = testArray.tests[0];
                } else {
                    testArray = { id: 'true' };
                }

                return testArray;

            },

            onRemoveTest: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    testID = node.closest('li').attr('data-test-id'),
                    testArray = _.copy(this.model.get('test'));

                this.model.set('test', this.removeTest(testArray, testID));
                this.render();

            },

            removeAction: function (actionArray, actionID) {
                actionArray.splice(actionID, 1);
                return actionArray;
            },

            onRemoveAction: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    actionID = node.closest('li').attr('data-action-id'),
                    actionArray = _.copy(this.model.get('actioncmds'));

                this.model.set('actioncmds', this.removeAction(actionArray, actionID));
                this.render();

            },

            onSave: function () {
                var self = this,
                    testsPart = this.model.get('test'),
                    actionArray = this.model.get('actioncmds'),
                    emptyValuesAllowed = ['exists', 'not exists'];

                function isValid(tests, actions) {

                    var result = true;
                    // single test
                    if (_.has(tests, 'values')) {
                        if (tests.values && tests.values[0] === '' && !_.contains(emptyValuesAllowed, tests.comparison)) result = false;
                    }

                    // multiple test
                    if (_.has(tests, 'tests')) {
                        _.each(tests.tests, function (singleTest) {
                            if (singleTest.values && singleTest.values[0] === '' && !_.contains(emptyValuesAllowed, singleTest.comparison)) result = false;

                            if (singleTest.tests) {
                                _.each(singleTest.tests, function (nestedTest) {
                                    if (nestedTest.values && nestedTest.values[0] === '' && !_.contains(emptyValuesAllowed, nestedTest.comparison)) result = false;
                                });
                            }
                        });
                    }

                    _.each(actions, function (val) {
                        if (val.to === '' || val.text === '') result = false;
                        if (val.flags && val.flags[0] === '$' && val.id !== 'setflags') result = false;
                    });

                    return result;
                }

                if (!isValid(testsPart, actionArray)) {
                    self.dialog.idle();
                    self.render();
                    return;
                }

                if (currentState !== null) self.model.trigger('ChangeProcessSub', currentState);
                currentState = null;

                function returnTzOffset(timeValue) {
                    return moment.tz(timeValue, coreSettings.get('timezone')).format('Z').replace(':', '');
                }

                if (testsPart.tests && testsPart.tests.length === 0) {
                    this.model.set('test', { id: 'true' });

                } else {
                    if (testsPart.id === 'header' && testsPart.values[0].trim() === '' && !_.contains(emptyValuesAllowed, testsPart.comparison)) {
                        this.model.set('test', { id: 'true' });
                    }
                    if (testsPart.id === 'size') {
                        if (testsPart.size.toString().trim() === '') {
                            this.model.set('test', { id: 'true' });
                        }
                    }

                    // set zone option in currentdate condition for single test if "original" is set
                    if (testsPart.zone === 'original' && testsPart.id === 'currentdate') {
                        this.model.attributes.test.zone = returnTzOffset(testsPart.datevalue[0]);
                    }
                }

                if (this.model.attributes.test.tests) {

                    _.each(this.model.attributes.test.tests, function (test, key) {

                        // set zone option in currentdate condition for multiple tests if "original" zone is set
                        if (test.zone === 'original' && test.id === 'currentdate') self.model.attributes.test.tests[key].zone = returnTzOffset(test.datevalue[0]);

                        // set zone option in currentdate condition for multiple nested tests if "original" zone is set
                        if (test.tests && !_.isEmpty(test.tests)) {
                            _.each(test.tests, function (nestedTest, nestedKey) {
                                if (nestedTest.zone === 'original' && nestedTest.id === 'currentdate') self.model.attributes.test.tests[key].tests[nestedKey].zone = returnTzOffset(nestedTest.datevalue[0]);
                            });
                        }
                    });
                }

                // if there is a stop action it should always be the last
                if (returnKeyForStop(actionArray) !== undefined) {
                    actionArray.splice(returnKeyForStop(actionArray), 1);
                    actionArray.push({ id: 'stop' });
                    this.model.set('actioncmds', actionArray);
                }

                return this.model.save().then(function (id) {
                    //first rule gets 0
                    if (!_.isUndefined(id) && !_.isNull(id) && !_.isUndefined(self.listView)) {
                        self.model.set('id', id);
                        self.listView.collection.add(self.model);
                    } else if (!_.isUndefined(id) && !_.isNull(id) && !_.isUndefined(self.collection)) {
                        self.model.set('id', id);
                        self.collection.add(self.model);
                    }
                    self.dialog.close();
                }, self.dialog.idle);
            },

            onApply: function () {
                var model = this.model;
                return this.onSave().then(function () {
                    model.trigger('apply');
                });
            },

            onChangeDropdownValue: function (e) {

                function triggerRender() {
                    self.render();

                    setTimeout(function () {
                        setFocus(self.el, valueType, nestedConditionID);
                    }, 100);
                }

                e.preventDefault();
                var node = $(e.target),
                    data = node.data(),
                    valueType = data.type,
                    self = this,
                    testArray,
                    arrayOfTests,
                    nestedConditionID;

                // allof/annyof
                if (data.target === 'id') {
                    arrayOfTests = _.copy(this.model.get('test'));
                    arrayOfTests.id = data.value;
                    this.model.set('test', arrayOfTests);
                    triggerRender();
                    return;
                }

                // allof/annyof nested condition
                if (data.target === 'nestedID') {
                    arrayOfTests = this.model.get('test');
                    nestedConditionID = node.closest('li').attr('data-test-id');

                    arrayOfTests.tests[nestedConditionID].id = data.value;
                    this.model.set('test', arrayOfTests);
                    triggerRender();
                    return;
                }

                // create nested condition
                if (data.nested && data.type === 'condition') {
                    testArray = this.model.get('test');
                    nestedConditionID = node.closest('li').attr('data-test-id');
                    testArray.tests[nestedConditionID].tests.push(_.copy(this.defaults.tests[data.value], true));
                    this.model.set('test', testArray);
                    triggerRender();
                    return;
                }

                // create condition
                if (data.type === 'condition') {
                    testArray = _.copy(this.model.get('test'));

                    if (checkForMultipleTests(this.el).length > 1) {
                        testArray.tests.push(_.copy(this.defaults.tests[data.value], true));

                    } else if (checkForMultipleTests(this.el).length === 1) {
                        var createdArray = [testArray];
                        createdArray.push(_.copy(this.defaults.tests[data.value], true));
                        testArray = { id: 'allof' };
                        testArray.tests = createdArray;
                    } else {

                        testArray = _.copy(this.defaults.tests[data.value], true);
                    }

                    this.model.set('test', testArray);
                    triggerRender();
                    return;
                }

                // create action
                if (data.type === 'action') {

                    var actionArray = this.model.get('actioncmds');
                    actionArray.push(_.copy(this.defaults.actions[data.value], true));

                    // if there is a stop action it should always be the last
                    if (returnKeyForStop(actionArray) !== undefined) {
                        actionArray.splice(returnKeyForStop(actionArray), 1);
                        actionArray.push({ id: 'stop' });
                        this.model.set('actioncmds', actionArray);
                    }
                    this.model.set('actioncmds', actionArray);
                    triggerRender();
                }

            },

            setModel: function (type, model, num) {

                // this.subModelHasError = model.validationError !== null;

                if (type === 'test') {
                    var testArray = _.copy(this.model.get(type));
                    if (checkForMultipleTests(this.el).length > 1) {
                        testArray.tests[num] = model.attributes;
                    } else {
                        testArray = model.attributes;
                    }
                    this.model.set(type, testArray);

                } else {
                    var actioncmds = _.copy(this.model.get(type));
                    actioncmds[num] = model.attributes;
                    this.model.set(type, actioncmds);
                }

            },

            setNestedModel: function (model, num) {
                var rootConditionKey = num.split('_')[0],
                    conditionKey = num.split('_')[1];

                var testArray = this.model.get('test'),

                    nestedConditionArray = testArray.tests[rootConditionKey];

                nestedConditionArray.tests[conditionKey] = model.attributes;

                testArray.tests[rootConditionKey] = nestedConditionArray;
                this.model.set('test', testArray);
            },

            onChangeColor: function (e) {
                e.preventDefault();
                var list = $(e.currentTarget).closest('li[data-action-id]'),
                    actionID = list.attr('data-action-id'),
                    colorValue = list.find('div.flag').attr('data-color-value'),
                    actionArray =  _.copy(this.model.get('actioncmds'));

                actionArray[actionID].flags[0] = '$cl_' + colorValue;
                this.model.set('actioncmds', actionArray);
                this.render();

                this.$el.find('[data-action-id="' + actionID + '"] .dropdown-toggle').focus();
            }

        });

    ext.point(POINT + '/view').extend({
        index: 150,
        id: 'tests',
        draw: function (baton) {

            var conditionList = $('<ol class="widget-list list-unstyled tests">'),
                actionList = $('<ol class="widget-list list-unstyled actions">'),
                appliedConditions = baton.model.get('test'),
                ConditionModel = Backbone.Model.extend({
                    validate: function (attrs) {
                        var emptyValuesAllowed = ['exists', 'not exists'];
                        if (_.has(attrs, 'size')) {
                            var isValid = util.validateSize({ unit: attrs.unit, size: attrs.sizeValue });
                            if (!isValid) {
                                this.trigger('invalid:sizeValue');
                                return 'sizeValue';
                            }
                            this.trigger('valid:size');
                        }

                        if (_.has(attrs, 'headers')) {
                            if ($.trim(attrs.headers[0]) === '' && !_.contains(emptyValuesAllowed, attrs.comparison)) {
                                if (attrs.values && $.trim(attrs.values[0]) === '' && !_.contains(emptyValuesAllowed, attrs.comparison)) {
                                    return 'headers values';
                                }
                                this.trigger('invalid:headers');
                                return 'headers';
                            }

                            if ($.trim(attrs.headers[0]) === '' && _.contains(emptyValuesAllowed, attrs.comparison) && attrs.id === 'header') {
                                return 'headers';
                            }

                            this.trigger('valid:headers');
                        }

                        if (_.has(attrs, 'source')) {
                            if ($.trim(attrs.source[0]) === '' && !_.contains(emptyValuesAllowed, attrs.comparison)) {
                                if (attrs.values && $.trim(attrs.values[0]) === '' && !_.contains(emptyValuesAllowed, attrs.comparison)) {
                                    return 'source values';
                                }
                                this.trigger('invalid:source');
                                return 'headers';
                            }

                            if ($.trim(attrs.source[0]) === '' && _.contains(emptyValuesAllowed, attrs.comparison) && attrs.id === 'source') {
                                return 'source';
                            }

                            this.trigger('valid:source');
                        }

                        if (_.has(attrs, 'values')) {
                            if (attrs.values && $.trim(attrs.values[0]) === '' && !_.contains(emptyValuesAllowed, attrs.comparison)) {
                                this.trigger('invalid:values');
                                return 'values';
                            }
                            this.trigger('valid:values');
                        }

                        // check for empty nested tests
                        if (_.has(attrs, 'tests')) {
                            if (_.isEmpty(attrs.tests)) {
                                this.trigger('invalid:tests');
                                return 'tests';
                            }
                        }

                    }
                }),
                redirectCounter = 0;

            appliedConditions = appliedConditions.tests ? appliedConditions.tests : [appliedConditions];

            _(appliedConditions).each(function (condition, conditionKey) {

                var isNested = function () {
                        if (condition.tests) return true;
                    },
                    addClass = isNested() ? 'nested' : '';

                if (isNested()) {
                    var nestedConditions = condition.tests;

                    // condition point
                    ext.point('io.ox/mail/mailfilter/tests').get('nested', function (point) {
                        point.invoke('draw', conditionList, baton, conditionKey, cmodel);
                    });

                    _(nestedConditions).each(function (ncondition, nconditionKey) {
                        var cmodel = new ConditionModel(ncondition),
                            assembledKey = conditionKey + '_' + nconditionKey;

                        cmodel.on('change', function () {
                            baton.view.setNestedModel(cmodel, assembledKey);
                        });

                        // condition point
                        ext.point('io.ox/mail/mailfilter/tests').get(cmodel.get('id'), function (point) {
                            point.invoke('draw', conditionList, baton, assembledKey, cmodel, filterValues, ncondition, addClass);
                        });

                        if (!cmodel.isValid()) {
                            conditionList.find('[data-test-id=' + assembledKey + '] input').closest('.row').addClass('has-error');
                        }

                    });

                }

                var cmodel = new ConditionModel(condition);

                cmodel.on('change', function () {
                    baton.view.setModel('test', cmodel, conditionKey);
                });

                // condition point
                ext.point('io.ox/mail/mailfilter/tests').get(cmodel.get('id'), function (point) {
                    point.invoke('draw', conditionList, baton, conditionKey, cmodel, filterValues, condition, addClass);
                });

                // inintial validation to disable save button
                if (!cmodel.isValid()) {
                    _.each(cmodel.validationError.split(' '), function (name) {
                        conditionList.find('[data-test-id=' + conditionKey + '] input[name="' + name + '"]').closest('.row').addClass('has-error');
                        if (name === 'tests') conditionList.find('[data-test-id=' + conditionKey + ']').addClass('has-error');
                    });
                }
            });

            _(baton.model.get('actioncmds')).each(function (action, actionKey) {

                var ActionModel = Backbone.Model.extend({
                        validate: function (attrs) {
                            if (_.has(attrs, 'to')) {
                                if ($.trim(attrs.to) === '') {
                                    this.trigger('invalid:to');
                                    return 'error';
                                }
                                this.trigger('valid:to');
                            }

                            if (_.has(attrs, 'text')) {
                                if ($.trim(attrs.text) === '') {
                                    this.trigger('invalid:text');
                                    return 'error';
                                }
                                this.trigger('valid:text');
                            }

                            if (_.has(attrs, 'flags')) {
                                if ($.trim(attrs.flags[0]) === '$' && attrs.id !== 'setflags') {
                                    this.trigger('invalid:flags');
                                    return 'error';
                                }
                                this.trigger('valid:flags');
                            }
                        }
                    }),
                    amodel = new ActionModel(action);

                amodel.on('change', function () {
                    baton.view.setModel('actioncmds', amodel, actionKey);
                });

                // action point
                if (action.id !== 'stop') {
                    ext.point('io.ox/mail/mailfilter/actions').get(amodel.get('id'), function (point) {
                        if (point.id === 'redirect') redirectCounter += 1;
                        point.invoke('draw', actionList, baton, actionKey, amodel, filterValues, action);
                    });

                    // inintial validation to disable save button
                    if (!amodel.isValid()) {
                        actionList.find('[data-action-id=' + actionKey + '] .row').addClass('has-error');
                    }
                }
            });

            var headlineTest = $('<legend>').addClass('sectiontitle conditions').text(gt('Conditions')),
                headlineActions = $('<legend>').addClass('sectiontitle actions').text(gt('Actions')),
                notificationConditions = $('<div class="notification-for-conditions">'),
                notificationActions = $('<div class="notification-for-actions">');

            if (_.isEqual(appliedConditions[0], { id: 'true' })) {
                renderWarningForEmptyTests(notificationConditions);
            }

            //disable save button if no action is set
            if (_.isEmpty(baton.model.get('actioncmds'))) {
                renderWarningForEmptyActions(notificationActions);
            }
            this.append(
                headlineTest, notificationConditions, conditionList,
                drawDropdown(gt('Add condition'), baton.view.conditionsTranslation, {
                    type: 'condition',
                    toggle: 'dropdown',
                    skip: baton.model.get('test').id === 'true' ? 'nested' : '',
                    sort: baton.view.defaults.conditionsOrder,
                    classes: 'add-condition main'
                }),
                headlineActions, notificationActions, actionList,
                drawDropdown(gt('Add action'), baton.view.actionsTranslations, {
                    type: 'action',
                    toggle: 'dropup',
                    skip: redirectCounter >= baton.view.config.options.MAXREDIRECTS ? 'redirect' : '',
                    sort: baton.view.defaults.actionsOrder,
                    classes: 'add-action'
                })
            );

        }
    });

    ext.point(POINT + '/view').extend({
        id: 'rulename',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<label for="rulename">').text(gt('Rule name')),
                new mini.InputView({ name: 'rulename', model: baton.model, className: 'form-control', id: 'rulename' }).render().$el
            );
        }
    });

    ext.point(POINT + '/view').extend({
        index: 100,
        id: 'appliesto',
        draw: function (baton) {
            var arrayOfTests = baton.model.get('test'),
                options = {
                    target: 'id',
                    toggle: 'dropup',
                    classes: 'no-positioning appliesto main',
                    caret: true,
                    type: 'appliesto'
                },
                optionsSwitch = drawDropdown(arrayOfTests.id, { allof: gt('Apply rule if all conditions are met'), anyof: gt('Apply rule if any condition is met') }, options);
            if (arrayOfTests.id === 'allof' || arrayOfTests.id === 'anyof') {
                this.append($('<div>').addClass('line').append(optionsSwitch));
            } else {
                this.append($('<div>').addClass('line').text(gt('Apply rule if all conditions are met')));
            }

        }
    });

    ext.point(POINT + '/view').extend({
        index: 200,
        id: 'stopaction',
        draw: function (baton) {
            var self = this,
                toggleWarning = function () {
                    if (baton.model.get('actioncmds').length >= 1) {
                        self.find('.alert.alert-danger').remove();
                    } else {
                        self.find('.alert.alert-danger').remove();
                        renderWarningForEmptyActions(self.find('.notification-for-actions'));
                    }
                    baton.view.$el.trigger('toggle:saveButton');
                },
                checkStopAction = function (e) {
                    currentState = $(e.currentTarget).find('[type="checkbox"]').prop('checked');
                    var arrayOfActions = baton.model.get('actioncmds');

                    function getCurrentPosition(array) {
                        var currentPosition;
                        _.each(array, function (single, id) {
                            if (single.id === 'stop') {
                                currentPosition = id;
                            }
                        });

                        return currentPosition;
                    }

                    if (currentState === true) {
                        arrayOfActions.splice(getCurrentPosition(arrayOfActions), 1);
                    } else {
                        arrayOfActions.push({ id: 'stop' });
                    }
                    baton.model.set('actioncmds', arrayOfActions);
                    toggleWarning();
                },

                drawcheckbox = function (value) {
                    var guid = _.uniqueId('form-control-label-');
                    return $('<div class="control-group mailfilter checkbox custom">').append(
                        $('<div class="controls">'),
                        $('<label>').attr('for', guid).text(gt('Process subsequent rules')).prepend(
                            $('<input type="checkbox" class="sr-only">').attr('id', guid).prop('checked', value),
                            $('<i class="toggle" aria-hidden="true">')
                        )
                    );
                },
                modalBody = baton.view.dialog.$el.find('.modal-body'),
                arrayOfActions = baton.model.get('actioncmds');

            function checkForStopAction(array) {
                return _.findIndex(array, { id: 'stop' }) === -1;
            }

            toggleWarning();

            var target = baton.view.$el.find('.sectiontitle.conditions');

            if (!modalBody.find('[type="checkbox"]').length) {
                _.defer(function () {
                    target.prepend(drawcheckbox(checkForStopAction(arrayOfActions)).on('change', checkStopAction));
                    baton.view.$el.trigger('toggle:saveButton');
                });
            }

        }
    });

    return FilterDetailView;

});
