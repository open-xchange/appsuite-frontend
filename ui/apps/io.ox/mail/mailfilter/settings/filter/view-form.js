/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/filter/view-form', [
    'io.ox/core/notifications',
    'gettext!io.ox/settings',
    'io.ox/core/extensions',
    'io.ox/mail/mailfilter/settings/filter/defaults',
    'io.ox/backbone/mini-views',
    'io.ox/core/folder/picker',
    'io.ox/backbone/mini-views/datepicker'
], function (notifications, gt, ext, DEFAULTS, mini, picker, DatePicker) {

    'use strict';

    var POINT = 'io.ox/mailfilter/settings/filter/detail',
        testCapabilities,

        sizeValues = {
            'over': gt('Is bigger than'),
            'under': gt('Is smaller than')
        },

        flagValues = {
            '\\deleted': gt('deleted'),
            '\\seen': gt('seen')
        },

        containsValues = {
            'contains': gt('Contains'),
            'is': gt('Is exactly'),
            'matches': gt('Matches'),
            //needs no different translation
            'regex': gt('Regex')
        },

        timeValues = {
            'ge': gt('starts on'),
            'le': gt('ends on'),
            'is': gt('is on')
        },

        headerTranslation = {
            'From': gt('Sender/From'),
            'any': gt('Any recipient'),
            'Subject': gt('Subject'),
            'mailingList': gt('Mailing list'),
            'To': gt('To'),
            'Cc': gt('CC'),
            'cleanHeader': gt('Header'),
            'envelope': gt('Envelope - To'),
            'size': gt('Size (bytes)'),
            'body': gt('Content'),
            'currentdate': gt('Current Date')
        },

        conditionsMapping = {
            'header': ['From', 'any', 'Subject', 'mailingList', 'To', 'Cc', 'cleanHeader'],
            'envelope': ['envelope'],
            'size': ['size'],
            'body': ['body'],
            'currentdate': ['currentdate']
        },

        actionsTranslations = {
            'keep': gt('Keep'),
            'discard': gt('Discard'),
            'redirect': gt('Redirect to'),
            'move': gt('Move to folder'),
            'reject': gt('Reject with reason'),
            'markmail': gt('Mark mail as'),
            'tag': gt('Tag mail with'),
            'flag': gt('Flag mail with')
        },

        actionCapabilities = {
            'keep': 'keep',
            'discard': 'discard',
            'redirect': 'redirect',
            'move': 'move',
            'reject': 'reject',
            'markmail': 'addflags',
            'tag': 'addflags',
            'flag': 'addflags'
        },

        COLORS = {
            NONE: { value: 0, text: gt('None') },
            RED: { value: 1, text: gt('Red') },
            ORANGE: { value: 7, text: gt('Orange') },
            YELLOW: { value: 10, text: gt('Yellow') },
            LIGHTGREEN: { value: 6, text: gt('Light green') },
            GREEN: { value: 3, text: gt('Green') },
            LIGHTBLUE: { value: 9, text: gt('Light blue') },
            BLUE: { value: 2, text: gt('Blue') },
            PURPLE: { value: 5, text: gt('Purple') },
            PINK: { value: 8, text: gt('Pink') },
            GRAY: { value: 4, text: gt('Gray') }
        },

        COLORFLAGS = {
            '$cl_1': '1',
            '$cl_2': '2',
            '$cl_3': '3',
            '$cl_4': '4',
            '$cl_5': '5',
            '$cl_6': '6',
            '$cl_7': '7',
            '$cl_8': '8',
            '$cl_9': '9',
            '$cl_10': '10'
        },
        currentState = null,

        checkForMultipleTests = function (el) {
            return $(el).find('[data-test-id]');
        },

        setFocus = function (el, type) {
            var listelement = $(el).find('[data-' + type + '-id]').last();
            if (type === 'test') listelement.find('input[tabindex="1"]').first().focus();

            if (type === 'action') listelement.find('[tabindex="1"]').first().focus();
        },

        renderWarningForEmptyTests = function (node) {
            var warning = $('<div>').addClass('alert alert-info').text(gt('This rule applies to all messages. Please add a condition to restrict this rule to specific messages.'));
            node.append(warning);
        },

        renderWarningForEmptyActions = function (node) {
            var warning = $('<div>').addClass('alert alert-danger').text(gt('Please define at least one action.'));
            node.append(warning);
        },

        prepareFolderForDisplay = function (folder) {
            var arrayOfParts = folder.split('/');
            arrayOfParts.shift();
            return arrayOfParts.join('/');
        },

        toggleSaveButton = function (footer, pane) {
            if (pane.find('.has-error, .alert-danger').length === 0) {
                footer.find('[data-action="save"]').prop('disabled', false);
            } else {
                footer.find('[data-action="save"]').prop('disabled', true);
            }
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
            return $('<div class="action ' + options.toggle + ' value">').addClass(options.classes).append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">').html(active),
                $('<ul class="dropdown-menu" role="menu">').append(
                    _(values).map(function (name, value) {
                        return $('<li>').append(
                            $('<a>', { href: '#', 'data-action': 'change-dropdown-value', 'data-value': value, 'tabindex': '1' }).data(options).append(
                                $.txt(name)
                            )
                        );
                    })
                )
            );
        },

        FilterDetailView = Backbone.View.extend({
            tagName: 'div',
            className: 'io-ox-mailfilter-edit',

            initialize: function (opt) {
                testCapabilities = {};
                _.each(opt.config.tests, function (value) {
                    testCapabilities[value.test] = value.comparison;
                });

                var unsupported = [];
                _.each(actionCapabilities, function (val, key) {
                    var index = _.indexOf(opt.config.actioncommands, val);
                    if (index === -1) {
                        unsupported.push(key);
                    }
                });
                actionsTranslations = _.omit(actionsTranslations, unsupported);

                _.each(conditionsMapping, function (list, conditionGroup) {
                    if (!_.has(testCapabilities, conditionGroup)) {
                        _.each(conditionsMapping[conditionGroup], function (condition) {
                            delete headerTranslation[condition];
                        });
                    }
                });

                this.listView = opt.listView;
            },

            render: function () {

                var baton = ext.Baton({ model: this.model, view: this });
                ext.point(POINT + '/view').invoke('draw', this.$el.empty(), baton);
                toggleSaveButton(this.dialog.getFooter(), this.$el);
                return this;

            },
            events: {
                'save': 'onSave',
                'click [data-action=change-dropdown-value]': 'onChangeDropdownValue',
                'click .folderselect': 'onFolderSelect',
                'click [data-action="change-color"]': 'onChangeColor',
                'click [data-action="remove-test"]': 'onRemoveTest',
                'click [data-action="remove-action"]': 'onRemoveAction'
            },

            onRemoveTest: function (e) {

                e.preventDefault();
                var node = $(e.target),
                    testID = node.closest('li').attr('data-test-id'),
                    testArray =  this.model.get('test');

                if (checkForMultipleTests(this.el).length > 2) {
                    testArray.tests.splice(testID, 1);
                } else {

                    if (testArray.tests) {
                        testArray.tests.splice(testID, 1);
                        testArray = testArray.tests[0];
                    } else {
                        testArray = { id: 'true' };
                    }

                }

                this.model.set('test', testArray);
                this.render();
            },

            onRemoveAction: function (e) {

                e.preventDefault();
                var node = $(e.target),
                    actionID = node.closest('li').attr('data-action-id'),
                    actionArray =  this.model.get('actioncmds');

                actionArray.splice(actionID, 1);
                this.model.set('actioncmds', actionArray);
                this.render();

            },

            onSave: function () {
                var self = this,
                    testsPart = this.model.get('test'),
                    actionArray = this.model.get('actioncmds');

                if (currentState !== null) self.model.trigger('ChangeProcessSub', currentState);
                currentState = null;

                function returnKeyForStop(actionsArray) {
                    var indicatorKey;
                    _.each(actionsArray, function (action, key) {
                        if (_.isEqual(action, { id: 'stop' })) {
                            indicatorKey = key;
                        }
                    });
                    return indicatorKey;
                }

                if (testsPart.tests) {
                    if (testsPart.tests.length === 0) {
                        this.model.set('test', { id: 'true' });
                    } else {
                        this.model.set('test', testsPart);
                    }
                } else {
                    if (testsPart.id === 'header' && testsPart.values[0].trim() === '') {
                        this.model.set('test', { id: 'true' });
                    }
                    if (testsPart.id === 'size' && testsPart.size.toString().trim() === '') {
                        this.model.set('test', { id: 'true' });
                    }
                }

                // if there is a stop action it should always be the last
                if (returnKeyForStop(actionArray) !== undefined) {
                    actionArray.splice(returnKeyForStop(actionArray), 1);
                    actionArray.push({ id: 'stop' });
                    this.model.set('actioncmds', actionArray);
                }

                this.model.save().then(function (id) {
                    //first rule gets 0
                    if (!_.isUndefined(id) && !_.isNull(id)) {
                        self.model.set('id', id);
                        self.listView.collection.add(self.model);
                    }
                    self.dialog.close();
                }, self.dialog.idle);
            },

            onChangeDropdownValue: function (e) {
                e.preventDefault();
                var node = $(e.target),
                    data = node.data(),
                    valueType = data.test ? 'test' : 'action',
                    self = this;
                if (data.target) {
                    var arrayOfTests = this.model.get('test');
                    arrayOfTests.id = data.value;
                    this.model.set('test', arrayOfTests);
                } else if (data.test === 'create') {

                    var testArray =  this.model.get('test');
                    if (checkForMultipleTests(this.el).length > 1) {
                        testArray.tests.push(_.copy(DEFAULTS.tests[data.value], true));

                    } else if (checkForMultipleTests(this.el).length === 1) {
                        var createdArray = [testArray];
                        createdArray.push(_.copy(DEFAULTS.tests[data.value], true));
                        testArray = { id: 'allof' };
                        testArray.tests = createdArray;
                    } else {

                        testArray = _.copy(DEFAULTS.tests[data.value], true);
                    }

                    this.model.set('test', testArray);
                } else if (data.action === 'create') {
                    var actionArray = this.model.get('actioncmds');
                    actionArray.push(_.copy(DEFAULTS.actions[data.value], true));

                    this.model.set('actioncmds', actionArray);
                }
                this.render();

                setTimeout(function () {
                    setFocus(self.el, valueType);
                }, 100);

            },

            setModel: function (type, model, num) {
                if (type === 'test') {
                    var testArray = this.model.get(type);
                    if (checkForMultipleTests(this.el).length > 1) {
                        testArray.tests[num] = model.attributes;
                    } else {
                        testArray = model.attributes;
                    }
                    this.model.set(type, testArray);

                } else {
                    var actioncmds = this.model.get(type);
                    actioncmds[num] = model.attributes;
                }

            },

            onFolderSelect: function (e) {

                e.preventDefault();

                var self = this,
                    list = $(e.currentTarget).closest('li'),
                    actionID = list.attr('data-action-id'),
                    inputField = list.find('input'),
                    currentFolder =  this.model.get('actioncmds')[actionID].into,
                    actionArray =  this.model.get('actioncmds');

                this.dialog.getPopup().hide();

                picker({
                    context: 'filter',
                    done: function (id) {

                        var prepared = prepareFolderForDisplay(id);

                        actionArray[actionID].into = id;
                        self.model.set('actioncmds', actionArray);

                        inputField.val(prepared);
                        inputField.attr('title', id);
                    },
                    close: function () {
                        self.dialog.getPopup().show();
                        self.$el.find('[data-action-id="' + actionID + '"] .folderselect').focus();
                    },
                    folder: currentFolder,
                    module: 'mail',
                    root: '1'
                });
            },

            onChangeColor: function (e) {
                e.preventDefault();
                var list = $(e.currentTarget).closest('li[data-action-id]'),
                    actionID = list.attr('data-action-id'),
                    colorValue = list.find('div.flag').attr('data-color-value'),
                    actionArray =  this.model.get('actioncmds');

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

                drawDeleteButton = function (type) {
                    return $('<a href="#" class="remove" tabindex="1" data-action="remove-' + type + '">').append($('<i class="fa fa-trash-o">'));
                };

            if (appliedConditions.tests) {
                appliedConditions = appliedConditions.tests;
            } else {
                appliedConditions = [appliedConditions];
            }

            _(appliedConditions).each(function (condition, num) {
                var ConditionModel = Backbone.Model.extend({
                        validate: function (attrs) {
                            if (_.has(attrs, 'size')) {
                                if (_.isNaN(attrs.size) || attrs.size === '') {
                                    this.trigger('invalid:size');
                                    return 'error';
                                } else {
                                    this.trigger('valid:size');
                                }
                            }

                            if (_.has(attrs, 'headers')) {
                                if ($.trim(attrs.headers[0]) === '') {
                                    this.trigger('invalid:headers');
                                    return 'error';
                                } else {
                                    this.trigger('valid:headers');
                                }
                            }

                            if (_.has(attrs, 'values') ) {
                                if ($.trim(attrs.values[0]) === '') {
                                    this.trigger('invalid:values');
                                    return 'error';
                                } else {
                                    this.trigger('valid::values');
                                }
                            }

                        }
                    }),
                    cmodel = new ConditionModel(condition);

                cmodel.on('change', function () {
                    baton.view.setModel('test', cmodel, num);
                });

                var Input = mini.InputView.extend({
                    events: { 'change': 'onChange', 'keyup': 'onKeyup' },
                    onChange: function () {
                        if (this.name === 'size') {
                            var isValid = /^[0-9]+$/.test(this.$el.val()) && parseInt(this.$el.val(), 10) < 2147483648 && parseInt(this.$el.val(), 10) >= 0;
                            if (isValid) {
                                this.model.set(this.name, parseInt(this.$el.val(), 10));
                                this.update();
                            }
                        }
                        if (this.name === 'values' || this.name === 'headers') this.model.set(this.name, [this.$el.val()]);
                    },
                    onKeyup: function () {
                        var state,
                            isValid;
                        if (this.name === 'size') {
                            isValid = /^[0-9]+$/.test(this.$el.val()) && parseInt(this.$el.val(), 10) < 2147483648 && parseInt(this.$el.val(), 10) >= 0;
                            state = isValid ? 'valid:' : 'invalid:';
                        } else {
                            state = $.trim(this.$el.val()) === '' ? 'invalid:' : 'valid:';
                        }
                        this.model.trigger(state + this.name);
                        toggleSaveButton(baton.view.dialog.getFooter(), baton.view.$el);
                    }
                });

                function drawCondition(o) {

                    if (o.secondInputId) {
                        return $('<li>').addClass('filter-settings-view row').attr({ 'data-test-id': num }).append(
                            $('<div>').addClass('col-sm-4 doubleline').append(
                                $('<span>').addClass('list-title').text(o.title)
                            ),
                            $('<div>').addClass('col-sm-8').append(
                                $('<div>').addClass('row').append(
                                    $('<label for="' + o.inputId + '" class="col-sm-4 control-label" >').text(gt('Name')),
                                    $('<div>').addClass('first-label inline-input col-sm-8').append(
                                        new Input(o.inputOptions).render().$el,
                                        o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                                    )
                                ),
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-4').append(
                                        new mini.DropdownLinkView(o.dropdownOptions).render().$el
                                    ),
                                    $('<div class="col-sm-8">').append(
                                        $('<label for="' + secondInputId + '" class="sr-only">').text(o.secondInputLabel),
                                        new Input(o.secondInputOptions).render().$el,
                                        o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                                    )
                                )
                            ),
                            drawDeleteButton('test')
                        );
                    } else {
                        return $('<li>').addClass('filter-settings-view row').attr({ 'data-test-id': num }).append(
                            $('<div>').addClass('col-sm-4 singleline').append(
                                $('<span>').addClass('list-title').text(o.title)
                            ),
                            $('<div>').addClass('col-sm-8').append(
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-4').append(
                                        new mini.DropdownLinkView(o.dropdownOptions).render().$el
                                    ),
                                    $('<div class="col-sm-8">').append(
                                        $('<label for="' + o.inputId + '" class="sr-only">').text(o.inputLabel),
                                        new Input(o.inputOptions).render().$el,
                                        o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : []
                                    )
                                )
                            ),
                            drawDeleteButton('test')
                        );
                    }

                }

                switch (cmodel.get('id')) {
                    case 'size':
                        var inputId = _.uniqueId('size');
                        conditionList.append(
                            drawCondition({
                                inputId: inputId,
                                title: headerTranslation.size,
                                dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues('size', sizeValues) },
                                inputLabel: headerTranslation.size + ' ' + sizeValues[cmodel.get('comparison')],
                                inputOptions: { name: 'size', model: cmodel, className: 'form-control', id: inputId },
                                errorView: true
                            })
                        );
                        break;
                    case 'body':
                        var inputId = _.uniqueId('values');
                        conditionList.append(
                            drawCondition({
                                inputId: inputId,
                                title: headerTranslation.body,
                                dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues('body', containsValues) },
                                inputLabel: headerTranslation.size + ' ' + sizeValues[cmodel.get('comparison')],
                                inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                                errorView: true
                            })
                        );
                        break;
                    case 'currentdate':
                        var ModifiedDatePicker = DatePicker.extend({
                            updateModel: function () {
                                var time = this.getTimestamp();
                                if (_.isNull(time) || _.isNumber(time)) {
                                    this.model[this.model.setDate ? 'setDate' : 'set'](this.attribute, [time], { validate: true });
                                    this.model.trigger('valid');
                                } else {
                                    this.model.trigger('invalid:' + this.attribute, [gt('Please enter a valid date')]);
                                }
                            }
                        });
                        cmodel.on('change:datevalue', function () {
                            if (cmodel.get('datevalue')[0] === null) {
                                conditionList.find('[data-test-id="' + num + '"] input.datepicker-day-field').closest('.row').addClass('has-error');
                            } else {
                                conditionList.find('[data-test-id="' + num + '"] input.datepicker-day-field').closest('.row').removeClass('has-error');
                            }
                            toggleSaveButton(baton.view.dialog.getFooter(), baton.view.$el);
                        });

                        conditionList.append(
                            $('<li>').addClass('filter-settings-view row').attr({ 'data-test-id': num }).append(
                                $('<div>').addClass('col-sm-4 singleline').append(
                                    $('<span>').addClass('list-title').text(headerTranslation[condition.id])
                                ),
                                $('<div>').addClass('col-sm-8').append(
                                    $('<div>').addClass('row').append(
                                        $('<div>').addClass('col-sm-4').append(
                                            new mini.DropdownLinkView({ name: 'comparison', model: cmodel, values: filterValues('currentdate', timeValues) }).render().$el
                                        ),
                                        $('<div class="col-sm-8">').append(
                                            new ModifiedDatePicker({ model: cmodel, display: 'DATE', attribute: 'datevalue', label: gt('datepicker' ) }).render().$el
                                        )
                                    )
                                ),
                                drawDeleteButton('test')
                            )
                        ).find('legend').addClass('sr-only');
                        if (cmodel.get('datevalue')[0] === null || cmodel.get('datevalue').length === 0) conditionList.find('[data-test-id="' + num + '"] input.datepicker-day-field').closest('.row').addClass('has-error');
                        break;
                    case 'header':
                        var title,
                            inputId = _.uniqueId('headers'),
                            secondInputId = _.uniqueId('values');
                        if (cmodel.get('headers').length === 4) {
                            title = headerTranslation.mailingList;
                        } else if (cmodel.get('headers').length === 2) {
                            title = headerTranslation.any;
                        } else {
                            title = cmodel.get('headers')[0] === '' ? headerTranslation.cleanHeader : headerTranslation[condition.headers[0]];
                        }

                        if (cmodel.get('headers')[0] === '' || title === undefined) {
                            title = headerTranslation.cleanHeader;

                            conditionList.append(
                                drawCondition({
                                    inputId: inputId,
                                    secondInputId: secondInputId,
                                    title: title,
                                    dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, containsValues) },
                                    inputOptions: { name: 'headers', model: cmodel, className: 'form-control', id: inputId },
                                    secondInputLabel: title + ' ' + containsValues[cmodel.get('comparison')],
                                    secondInputOptions: { name: 'values', model: cmodel, className: 'form-control', id: secondInputId },
                                    errorView: true
                                })
                            );
                        } else {
                            conditionList.append(
                                drawCondition({
                                    inputId: secondInputId,
                                    title: title,
                                    dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, containsValues) },
                                    inputLabel: title + ' ' + containsValues[cmodel.get('comparison')],
                                    inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: secondInputId },
                                    errorView: true
                                })
                            );
                        }
                        break;
                    case 'envelope':
                        var inputId = _.uniqueId('values');
                        conditionList.append(
                            drawCondition({
                                inputId: inputId,
                                title: headerTranslation.envelope,
                                dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, containsValues) },
                                inputLabel: headerTranslation.envelope + ' ' + containsValues[cmodel.get('comparison')],
                                inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                                errorView: true
                            })
                        );
                        break;
                    // no default
                }
                // inintial validation to disable save button
                if (!cmodel.isValid()) {
                    conditionList.find('[data-test-id=' + num + '] .row').addClass('has-error');
                }
            });

            _(baton.model.get('actioncmds')).each(function (action, num) {

                var ActionModel = Backbone.Model.extend({
                        validate: function (attrs) {
                            if (_.has(attrs, 'to')) {
                                if ($.trim(attrs.to) === '') {
                                    this.trigger('invalid:to');
                                    return 'error';
                                } else {
                                    this.trigger('valid:to');
                                }
                            }

                            if (_.has(attrs, 'text')) {
                                if ($.trim(attrs.text) === '') {
                                    this.trigger('invalid:text');
                                    return 'error';
                                } else {
                                    this.trigger('valid:text');
                                }
                            }

                            if (_.has(attrs, 'flags')) {
                                if ($.trim(attrs.flags[0]) === '$') {
                                    this.trigger('invalid:flags');
                                    return 'error';
                                } else {
                                    this.trigger('valid:flags');
                                }
                            }
                        }
                    }),
                    amodel = new ActionModel(action);

                amodel.on('change', function () {
                    baton.view.setModel('actioncmds', amodel, num);
                });

                var Input = mini.InputView.extend({
                    events: { 'change': 'onChange', 'keyup': 'onKeyup' },
                    onChange: function () {
                        if (this.name === 'flags') {
                            var value = (/customflag_/g.test(this.id)) ? ['$' + this.$el.val().toString()] : [this.$el.val()];
                            this.model.set(this.name, value);
                        } else if (this.name === 'to') {
                            this.model.set(this.name, this.$el.val().trim());
                        } else {
                            this.model.set(this.name, this.$el.val());
                        }
                    },
                    update: function () {
                        if (/customflag_/g.test(this.id)) {
                            this.$el.val(this.model.get('flags')[0].replace(/^\$+/, ''));
                        } else if (/move_/g.test(this.id)) {
                            this.$el.val(prepareFolderForDisplay(this.model.get('into')));
                        } else {
                            this.$el.val($.trim(this.model.get(this.name)));
                        }
                    },
                    onKeyup: function () {
                        var state = $.trim(this.$el.val()) === '' ? 'invalid:' : 'valid:';
                        this.model.trigger(state +  this.name);
                        toggleSaveButton(baton.view.dialog.getFooter(), baton.view.$el);
                    }
                }),
                    Dropdown = mini.DropdownLinkView.extend({
                    onClick: function (e) {
                        e.preventDefault();
                        if (/markas_/g.test(this.id)) {
                            this.model.set(this.name, [$(e.target).attr('data-value')]);
                        } else {
                            this.model.set(this.name, $(e.target).attr('data-value'));
                        }
                    }
                });

                function drawColorDropdown(activeColor, colors, colorflags) {

                    function changeLabel(e) {
                        e.preventDefault();
                        $(this).closest('.flag-dropdown').attr('data-color-value', e.data.color).removeClass(e.data.flagclass).addClass('flag_' + e.data.color);
                    }

                    var flagclass = 'flag_' + colorflags[activeColor];
                    return $('<div class="dropup flag-dropdown clear-title flag">').attr({ 'data-color-value': activeColor })
                    .addClass(flagclass)
                    .append(
                        // box
                        $('<a href="#" class="abs dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">'),
                        // drop down
                        $('<ul class="dropdown-menu" role="menu">')
                        .append(
                            _(colors).map(function (colorObject) {
                                return $('<li>').append(
                                    $('<a href="#">').attr({ 'data-action': 'change-color', 'tabindex': '1' }).append(
                                        colorObject.value > 0 ? $('<span class="flag-example">').addClass('flag_' + colorObject.value) : $(),
                                        $.txt(colorObject.text)
                                    )
                                    .on('click', { color: colorObject.value, flagclass: flagclass }, changeLabel)
                                );
                            })
                        )
                    );
                }

                function drawAction(o) {
                    var errorView = o.errorView ? new mini.ErrorView({ selector: '.row' }).render().$el : [];

                    if (o.activeLink) {
                        return $('<li>').addClass('filter-settings-view row').attr({ 'data-action-id': num }).append(
                            $('<div>').addClass('col-sm-4 singleline').append(
                                $('<span>').addClass('list-title').text(o.title)
                            ),
                            $('<div>').addClass('col-sm-8').append(
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-4 rightalign').append(
                                        $('<a href="#" tabindex="1">').addClass('folderselect').text(gt('Select folder'))
                                    ),
                                    $('<div class=" col-sm-8">').append(
                                        $('<label for="' + o.inputId + '" class="sr-only">').text(o.inputLabel),
                                        new Input(o.inputOptions).render().$el.attr({ disabled: 'disabled' })
                                    )
                                )
                            ),
                            drawDeleteButton('action')
                        );
                    } else if (/markas_/g.test(inputId)) {
                        return $('<li>').addClass('filter-settings-view row').attr({ 'data-action-id': num }).append(
                            $('<div>').addClass('col-sm-4 singleline').append(
                                $('<span>').addClass('list-title').text(o.title)
                            ),

                            $('<div>').addClass('col-sm-8').append(
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-3 col-sm-offset-9 rightalign').append(
                                        new Dropdown(o.dropdownOptions).render().$el
                                    )
                                )
                            ),
                            drawDeleteButton('action')
                        );
                    } else if (/discard_/g.test(inputId) || /keep_/g.test(inputId)) {
                        return $('<li>').addClass('filter-settings-view ' +  o.addClass + ' row').attr('data-action-id', num).append(
                            $('<div>').addClass('col-sm-4 singleline').append(
                                $('<span>').addClass('list-title').text(o.title)
                            ),
                            drawDeleteButton('action')
                        );
                    } else {
                        return $('<li>').addClass('filter-settings-view row').attr({ 'data-action-id': num }).append(
                            $('<div>').addClass('col-sm-4 singleline').append(
                                $('<span>').addClass('list-title').text(o.title)
                            ),
                            $('<div>').addClass('col-sm-8').append(
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-8 col-sm-offset-4').append(
                                        $('<label for="' + o.inputId + '" class="sr-only">').text(o.inputLabel),
                                        new Input(o.inputOptions).render().$el,
                                        errorView
                                    )
                                )
                            ),
                            drawDeleteButton('action')
                        );
                    }
                }

                if (action.id !== 'stop') {
                    switch (action.id) {
                        case 'redirect':
                            var inputId = _.uniqueId('redirect');
                            actionList.append(
                                drawAction({
                                    inputId: inputId,
                                    title: actionsTranslations[action.id],
                                    inputLabel: actionsTranslations.redirect,
                                    inputOptions: { name: 'to', model: amodel, className: 'form-control', id: inputId },
                                    errorView: true
                                })
                            );
                            break;
                        case 'move':
                            var inputId = _.uniqueId('move_');
                            actionList.append(
                                drawAction({
                                    inputId: inputId,
                                    title: actionsTranslations[action.id],
                                    activeLink: true,
                                    inputLabel: actionsTranslations[action.id],
                                    inputOptions: { name: 'into', model: amodel, className: 'form-control', id: inputId }
                                })
                            );
                            break;
                        case 'reject':
                            var inputId = _.uniqueId('reject');
                            actionList.append(
                                drawAction({
                                    inputId: inputId,
                                    title: actionsTranslations[action.id],
                                    inputLabel: actionsTranslations.reject,
                                    inputOptions: { name: 'text', model: amodel, className: 'form-control', id: inputId },
                                    errorView: true
                                })
                            );
                            break;
                        case 'addflags':
                            if (/delete|seen/.test(action.flags[0])) {
                                var inputId = _.uniqueId('markas_');
                                actionList.append(
                                    drawAction({
                                        inputId: inputId,
                                        title: actionsTranslations.markmail,
                                        dropdownOptions: { name: 'flags', model: amodel, values: flagValues, id: inputId }
                                    })
                                );
                            } else if (/^\$cl/.test(action.flags[0])) {
                                var inputId = _.uniqueId('colorflag_');
                                actionList.append($('<li>').addClass('filter-settings-view row').attr({ 'data-action-id': num }).append(
                                    $('<div>').addClass('col-sm-4 singleline').append(
                                        $('<span>').addClass('list-title').text(actionsTranslations.flag)
                                    ),
                                    $('<div>').addClass('col-sm-8').append(
                                        $('<div>').addClass('row').append(
                                            $('<div>').addClass('col-sm-3 col-sm-offset-9 rightalign').append(
                                                drawColorDropdown(action.flags[0], COLORS, COLORFLAGS)
                                            )
                                        )
                                    ),
                                    drawDeleteButton('action')
                                ));
                            } else {
                                var inputId = _.uniqueId('customflag_');
                                actionList.append(
                                    drawAction({
                                        inputId: inputId,
                                        title: actionsTranslations.tag,
                                        inputLabel: actionsTranslations.tag,
                                        inputOptions: { name: 'flags', model: amodel, className: 'form-control', id: inputId },
                                        errorView: true
                                    })
                                );
                            }
                            break;
                        case 'discard':
                            var inputId = _.uniqueId('discard_');
                            actionList.append(
                                drawAction({
                                    inputId: inputId,
                                    addClass: 'warning',
                                    title: actionsTranslations[action.id]
                                })
                            );
                            break;
                        case 'keep':
                            var inputId = _.uniqueId('keep_');
                            actionList.append(
                                drawAction({
                                    inputId: inputId,
                                    title: actionsTranslations[action.id]
                                })
                            );
                            break;
                        // no default
                    }
                    // inintial validation to disable save button
                    if (!amodel.isValid()) {
                        actionList.find('[data-action-id=' + num + '] .row').addClass('has-error');
                    }
                }
            });

            var headlineTest = $('<legend>').addClass('sectiontitle expertmode conditions').text(gt('Conditions')),
                headlineActions = $('<legend>').addClass('sectiontitle expertmode actions').text(gt('Actions')),
                notificationConditions = $('<div>'),
                notificationActions = $('<div>');

            if (_.isEqual(appliedConditions[0], { id: 'true' })) {
                renderWarningForEmptyTests(notificationConditions);
            }

            if (_.isEmpty(baton.model.get('actioncmds'))) {
                renderWarningForEmptyActions(notificationActions);
            }

            this.append(
                headlineTest, notificationConditions, conditionList,
                drawDropdown(gt('Add condition'), headerTranslation, {
                    test: 'create',
                    toggle: 'dropdown'
                }),
                headlineActions, notificationActions, actionList,
                drawDropdown(gt('Add action'), actionsTranslations, {
                    action: 'create',
                    toggle: 'dropup'
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
                    classes: 'no-positioning',
                    caret: true
                },
                optionsSwitch = drawDropdown(arrayOfTests.id, { allof: gt('Apply rule if all conditions are met'), anyof: gt('Apply rule if any condition is met.') }, options);
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
            var checkStopAction = function (e) {
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

            },

            drawcheckbox = function (value) {
                return $('<div>').addClass('control-group mailfilter checkbox').append(
                    $('<div>').addClass('controls'),
                    $('<label>').text(gt('Process subsequent rules')).prepend(
                        $('<input type="checkbox" tabindex="1">').attr({ 'data-action': 'check-for-stop', 'checked': value })
                    )
                );
            },

            target = baton.view.dialog.getFooter(),
            arrayOfActions = baton.model.get('actioncmds');

            function checkForStopAction(array) {
                var stopAction;
                if (baton.model.id === undefined) {
                    // default value
                    return true;
                }

                _.each(array, function (single) {
                    if (single.id === 'stop') {
                        stopAction = false;
                    }

                });
                if (stopAction === undefined) {
                    return true;
                }
                return stopAction;
            }

            if (!target.find('[type="checkbox"]').length) {
                target.append(drawcheckbox(checkForStopAction(arrayOfActions)).on('change', checkStopAction));
            }

        }
    });

    return FilterDetailView;

});

