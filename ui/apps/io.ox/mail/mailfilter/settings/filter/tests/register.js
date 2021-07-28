/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define.async('io.ox/mail/mailfilter/settings/filter/tests/register', [
    'io.ox/core/extensions',
    'gettext!io.ox/mailfilter',
    'io.ox/backbone/mini-views',
    'io.ox/mail/mailfilter/settings/filter/tests/util',
    'io.ox/backbone/mini-views/datepicker',
    'io.ox/core/capabilities',
    'io.ox/core/api/mailfilter'
], function (ext, gt, mini, util, DatePicker, capabilities, api) {

    'use strict';

    var defer = $.Deferred();

    function processConfig(config) {

        var getIdList = function () {
            var list = {};
            _.each(config.tests, function (val) {
                list[val.id] = val;
            });
            return list;
        };

        var supportedConditions = getIdList();

        if (config.options.allowNestedTests) {

            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'nested',

                index: 1500,

                initialize: function (opt) {
                    var defaults = {
                        'nested': {
                            'id': 'anyof',
                            'tests': []
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'nested': gt('Nested condition')
                    });

                    _.extend(opt.conditionsMapping, { 'nested': ['nested'] });

                    opt.conditionsOrder.push('nested');
                },

                draw: function (baton, conditionKey) {
                    var arrayOfTests = baton.model.get('test').tests[conditionKey],
                        options = {
                            target: 'nestedID',
                            toggle: 'dropup',
                            caret: true,
                            type: 'appliesto',
                            classes: 'appliesto'
                        },
                        optionsSwitch = util.drawDropdown(arrayOfTests.id, { allof: gt('continue if all of these conditions are met'), anyof: gt('continue if any of these conditions are met') }, options),
                        assembled = arrayOfTests.id === 'allof' || arrayOfTests.id === 'anyof' ? optionsSwitch : $('<div>').addClass('line').text(gt('continue if all conditions are met'));
                    this.append(
                        $('<li>').addClass('filter-settings-view row nestedrule').attr({ 'data-test-id': conditionKey }).append(
                            $('<div>').addClass('col-sm-9 singleline').append(
                                assembled
                            ),
                            $('<div>').addClass('col-sm-3 singleline').append(
                                util.drawDropdown(gt('Add condition'), baton.view.conditionsTranslation, {
                                    type: 'condition',
                                    nested: true,
                                    toggle: 'dropdown',
                                    classes: 'add-condition',
                                    // multi options?
                                    skip: 'nested',
                                    sort: baton.view.defaults.conditionsOrder
                                })
                            ),
                            util.drawDeleteButton('test')
                        )
                    );

                }

            });
        }

        if (supportedConditions.body) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'body',

                index: 700,

                initialize: function (opt) {
                    var defaults = {
                        'body': {
                            'id': 'body',
                            'comparison': util.returnDefault(config.tests, 'body', 'comparisons', 'contains'),
                            'extensionskey': 'text',
                            'extensionsvalue': null,
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'body': gt('Body')
                    });

                    _.extend(opt.conditionsMapping, { 'body': ['body'] });

                    opt.conditionsOrder.push('body');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('body_'),
                        li;

                    this.append(
                        li = util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.body,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                            inputLabel: baton.view.conditionsTranslation.body + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });

                }

            });
        }

        if (supportedConditions.currentdate) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'currentdate',

                index: 1400,

                initialize: function (opt) {
                    var defaults = {
                        'currentdate': {
                            'id': 'currentdate',
                            'comparison': util.returnDefault(config.tests, 'currentdate', 'comparisons', 'ge'),
                            'datepart': 'date',
                            'datevalue': [],
                            'zone': 'original'
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'currentdate': gt('Current date')
                    });

                    _.extend(opt.conditionsMapping, { 'currentdate': ['currentdate'] });

                    opt.conditionsOrder.push('currentdate');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {

                    function generateTimezoneValues(from, to) {
                        var values = {};
                        for (var i = from; i <= to; i += 1) {
                            var label = Math.abs(i).toString() + ':00',
                                value = Math.abs(i).toString() + '00';

                            label = label.length === 4 ? '0' + label : label;
                            value = value.length === 3 ? '0' + value : value;

                            label = i > -1 ? '+' + label : '-' + label;
                            value = i > -1 ? '+' + value : '-' + value;
                            values[value] = label;
                        }
                        values.original = gt('original time zone');
                        return values;
                    }

                    var timeValues = {
                        //#. greater than or equal to
                        'ge': gt('Greater equals'),
                        //#. lower than or equal to
                        'le': gt('Lower equals'),
                        'is': gt('Is exactly'),
                        'not is': gt('Is not exactly'),
                        //#. lower than the given value
                        'not ge': gt('Lower'),
                        //#. greater than the given value
                        'not le': gt('Greater')
                    };

                    var timezoneValues = generateTimezoneValues(-12, 14);

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

                    var li;

                    // set to default if not available
                    if (!_.has(cmodel.attributes, 'zone') || cmodel.get('zone') === null) cmodel.attributes.zone = 'original';

                    cmodel.on('change:datevalue', function () {
                        if (cmodel.get('datevalue')[0] === null) {
                            baton.view.$el.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').addClass('has-error');
                        } else {
                            baton.view.$el.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').removeClass('has-error');
                        }
                        baton.view.$el.trigger('toggle:saveButton');
                    });
                    this.append(
                        li = $('<li>').addClass('filter-settings-view row ' + addClass).attr({ 'data-test-id': conditionKey }).append(
                            $('<div>').addClass('col-sm-3 singleline').append(
                                $('<span>').addClass('list-title').text(baton.view.conditionsTranslation[condition.id])
                            ),
                            $('<div>').addClass('col-sm-9').append(
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-4').append(
                                        new util.DropdownLinkView({ name: 'comparison', model: cmodel, values: filterValues('currentdate', timeValues) }).render().$el
                                    ),
                                    $('<div>').addClass('col-sm-4').append(
                                        new mini.DropdownLinkView({ name: 'zone', model: cmodel, values: timezoneValues }).render().$el
                                    ),
                                    $('<div class="col-sm-4">').append(
                                        new ModifiedDatePicker({
                                            model: cmodel,
                                            display: 'DATE',
                                            attribute: 'datevalue',
                                            label: gt('datepicker')
                                        }).render().$el
                                    )
                                )
                            ),
                            util.drawDeleteButton('test')
                        )
                    ).find('[data-test-id="' + conditionKey + '"] label').addClass('sr-only');
                    if (cmodel.get('datevalue')[0] === null || cmodel.get('datevalue').length === 0) this.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').addClass('has-error');

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues('currentdate', timeValues),
                        model: cmodel
                    });
                }

            });
        }

        if (supportedConditions.date) {

            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'date',

                index: 1300,

                initialize: function (opt) {
                    var defaults = {
                        'date': {
                            'id': 'date',
                            'comparison': util.returnDefault(config.tests, 'date', 'comparisons', 'ge'),
                            'zone': 'original',
                            'header': 'Date',
                            'datepart': 'date',
                            'datevalue': []
                        }

                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'date': gt('Sent date')
                    });

                    _.extend(opt.conditionsMapping, { 'date': ['date'] });

                    opt.conditionsOrder.push('date');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {

                    function generateTimezoneValues(from, to) {
                        var values = {};
                        for (var i = from; i <= to; i += 1) {
                            var label = Math.abs(i).toString() + ':00',
                                value = Math.abs(i).toString() + '00';

                            label = label.length === 4 ? '0' + label : label;
                            value = value.length === 3 ? '0' + value : value;

                            label = i > -1 ? '+' + label : '-' + label;
                            value = i > -1 ? '+' + value : '-' + value;
                            values[value] = label;
                        }
                        values.original = gt('original time zone');
                        return values;
                    }

                    var timeValues = {
                        //#. greater than or equal to
                        'ge': gt('Greater equals'),
                        //#. lower than or equal to
                        'le': gt('Lower equals'),
                        'is': gt('Is exactly'),
                        'not is': gt('Is not exactly'),
                        //#. lower than the given value
                        'not ge': gt('Lower'),
                        //#. greater than the given value
                        'not le': gt('Greater')
                    };

                    var timezoneValues = generateTimezoneValues(-12, 14);

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
                    var li;

                    // set to default if not available
                    if (!_.has(cmodel.attributes, 'zone') || cmodel.get('zone') === null) cmodel.attributes.zone = 'original';

                    cmodel.on('change:datevalue', function () {
                        if (cmodel.get('datevalue')[0] === null) {
                            baton.view.$el.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').addClass('has-error');
                        } else {
                            baton.view.$el.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').removeClass('has-error');
                        }
                        baton.view.$el.trigger('toggle:saveButton');
                    });

                    this.append(
                        li = $('<li>').addClass('filter-settings-view row ' + addClass).attr({ 'data-test-id': conditionKey }).append(
                            $('<div>').addClass('col-sm-3 singleline').append(
                                $('<span>').addClass('list-title').text(baton.view.conditionsTranslation[condition.id])
                            ),
                            $('<div>').addClass('col-sm-9').append(
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-4').append(
                                        new util.DropdownLinkView({ name: 'comparison', model: cmodel, values: filterValues('date', timeValues) }).render().$el
                                    ),
                                    $('<div>').addClass('col-sm-4').append(
                                        new mini.DropdownLinkView({ name: 'zone', model: cmodel, values: timezoneValues }).render().$el
                                    ),
                                    $('<div class="col-sm-4">').append(
                                        new ModifiedDatePicker({
                                            model: cmodel,
                                            display: 'DATE',
                                            attribute: 'datevalue',
                                            label: gt('datepicker'),
                                            timezoneButton: false
                                        }).render().$el
                                    )
                                )
                            ),
                            util.drawDeleteButton('test')
                        )
                    ).find('[data-test-id="' + conditionKey + '"] label').addClass('sr-only');
                    if (cmodel.get('datevalue')[0] === null || cmodel.get('datevalue').length === 0) this.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').addClass('has-error');

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues('date', timeValues),
                        model: cmodel
                    });

                }

            });
        }

        if (supportedConditions.envelope) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'envelope',

                index: 900,

                initialize: function (opt) {
                    var defaults = {
                        'envelope': {
                            'id': 'envelope',
                            'comparison': util.returnDefault(config.tests, 'envelope', 'comparisons', 'is'),
                            'addresspart': util.returnDefault(config.tests, 'envelope', 'parts', 'all'),
                            'headers': [util.returnDefault(config.tests, 'envelope', 'headers', 'to')],
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'envelope': gt('Envelope')
                    });

                    _.extend(opt.conditionsMapping, { 'envelope': ['envelope'] });

                    opt.conditionsOrder.push('envelope');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {

                    var headerValues = {
                            'to': gt('To'),
                            'from': gt('From')
                        },
                        addressValues = {
                            'all': gt('All'),
                            'localpart': gt('Local-part'),
                            'domain': gt('Domain'),
                            'user': gt('User'),
                            'detail': gt('Detail')
                        }, li;

                    var inputId = _.uniqueId('envelope_');
                    this.append(
                        li = util.drawCondition({
                            layout: '3',
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.envelope,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                            seconddropdownOptions: { name: 'headers', model: cmodel, values: util.filterHeaderValues(config.tests, 'envelope', headerValues), saveAsArray: true },
                            thirddropdownOptions: { name: 'addresspart', model: cmodel, values: util.filterPartValues(config.tests, 'envelope', addressValues) },
                            inputLabel: baton.view.conditionsTranslation.envelope + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });

                }

            });
        }

        if (supportedConditions.header) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'header',

                index: 1000,

                initialize: function (opt) {
                    var defaults = {
                        'cleanHeader': {
                            'comparison': util.returnDefault(config.tests, 'header', 'comparisons', 'matches'),
                            'headers': [''],
                            'id': 'header',
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'cleanHeader': gt('Header')
                    });

                    _.extend(opt.conditionsMapping, { 'header': ['cleanHeader'] });

                    opt.conditionsOrder.push('cleanHeader');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var secondInputId = _.uniqueId('values'),
                        li;

                    var title,
                        inputId = _.uniqueId('header_');

                    title = baton.view.conditionsTranslation.cleanHeader;
                    this.append(
                        li = util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: title,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                            inputOptions: { name: 'headers', model: cmodel, className: 'form-control', id: inputId },
                            secondInputId: secondInputId,
                            secondInputLabel: title + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                            secondInputOptions: { name: 'values', model: cmodel, className: 'form-control', id: secondInputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });

                    util.handleSpecialComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values',
                        defaults: baton.view.defaults.tests[baton.view.defaults.conditionsMapping[condition.id]]
                    });
                }
            });
        }

        if (supportedConditions.subject) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'subject',

                index: 600,

                initialize: function (opt) {
                    var defaults = {
                        'subject': {
                            'comparison': util.returnDefault(config.tests, 'subject', 'comparisons', 'contains'),
                            'headers': ['Subject'],
                            'id': 'subject',
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'subject': gt('Subject')
                    });

                    _.extend(opt.conditionsMapping, { 'subject': ['subject'] });

                    opt.conditionsOrder.push('subject');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('subject_'),
                        li;

                    this.append(
                        li = util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.subject,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                            inputLabel: baton.view.conditionsTranslation.subject + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });

                    util.handleSpecialComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values',
                        defaults: baton.view.defaults.tests[condition.id]
                    });
                }

            });
        }

        if (supportedConditions.from) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'from',

                index: 100,

                initialize: function (opt) {
                    var defaults = {
                        'from': {
                            'comparison': util.returnDefault(config.tests, 'from', 'comparisons', 'contains'),
                            'headers': ['From'],
                            'id': 'from',
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'from': gt('From')
                    });
                    _.extend(opt.conditionsMapping, { 'from': ['from'] });

                    opt.conditionsOrder.push('from');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('from_'),
                        li;

                    this.append(
                        li = util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.from,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()), tooltips: util.returnDefaultToolTips() },
                            inputLabel: baton.view.conditionsTranslation.from + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });

                    util.handleSpecialComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values',
                        defaults: baton.view.defaults.tests[baton.view.defaults.conditionsMapping[condition.id]]
                    });
                }

            });
        }

        if (supportedConditions.to) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'to',

                index: 200,

                initialize: function (opt) {
                    var defaults = {
                        'to': {
                            'comparison': util.returnDefault(config.tests, 'to', 'comparisons', 'contains'),
                            'headers': ['To'],
                            'id': 'to',
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'to': gt('To')
                    });

                    _.extend(opt.conditionsMapping, { 'to': ['to'] });

                    opt.conditionsOrder.push('to');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('to_'),
                        li;

                    this.append(
                        li = util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.to,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                            inputLabel: baton.view.conditionsTranslation.to + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });

                    util.handleSpecialComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values',
                        defaults: baton.view.defaults.tests[baton.view.defaults.conditionsMapping[condition.id]]
                    });
                }

            });
        }

        if (supportedConditions.cc) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'cc',

                index: 300,

                initialize: function (opt) {
                    var defaults = {
                        'cc': {
                            'comparison': util.returnDefault(config.tests, 'cc', 'comparisons', 'contains'),
                            'headers': ['Cc'],
                            'id': 'cc',
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'cc': gt('Cc')
                    });

                    _.extend(opt.conditionsMapping, { 'cc': ['cc'] });

                    opt.conditionsOrder.push('cc');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('cc_'),
                        li;

                    this.append(
                        li = util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.cc,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                            inputLabel: baton.view.conditionsTranslation.cc + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });

                    util.handleSpecialComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values',
                        defaults: baton.view.defaults.tests[baton.view.defaults.conditionsMapping[condition.id]]
                    });
                }

            });
        }

        if (supportedConditions.anyrecipient) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'anyrecipient',

                index: 400,

                initialize: function (opt) {
                    var defaults = {
                        'anyrecipient': {
                            'comparison': util.returnDefault(config.tests, 'anyrecipient', 'comparisons', 'contains'),
                            'headers': ['To', 'Cc'],
                            'id': 'anyrecipient',
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'anyrecipient': gt('Any recipient')
                    });

                    _.extend(opt.conditionsMapping, { 'anyrecipient': ['anyrecipient'] });

                    opt.conditionsOrder.push('anyrecipient');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('anyrecipient_'),
                        li;

                    this.append(
                        li = util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.anyrecipient,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                            inputLabel: baton.view.conditionsTranslation.anyrecipient + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });

                    util.handleSpecialComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values',
                        defaults: baton.view.defaults.tests[condition.id]
                    });
                }

            });
        }

        if (supportedConditions.mailinglist) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'mailinglist',

                index: 500,

                initialize: function (opt) {
                    var defaults = {
                        'mailinglist': {
                            'comparison': util.returnDefault(config.tests, 'mailinglist', 'comparisons', 'contains'),
                            'headers': ['List-Id', 'X-BeenThere', 'X-Mailinglist', 'X-Mailing-List'],
                            'id': 'mailinglist',
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'mailinglist': gt('Mailing list')
                    });

                    _.extend(opt.conditionsMapping, { 'mailinglist': ['mailinglist'] });

                    opt.conditionsOrder.push('mailinglist');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('mailinglist_'),
                        li;

                    this.append(
                        li = util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.mailinglist,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                            inputLabel: baton.view.conditionsTranslation.mailinglist + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });

                    util.handleSpecialComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values',
                        defaults: baton.view.defaults.tests[baton.view.defaults.conditionsMapping[condition.id]]
                    });
                }

            });
        }

        if (supportedConditions.size) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'size',

                index: 1200,

                initialize: function (opt) {
                    var defaults = {
                        'size': {
                            'comparison': util.returnDefault(config.tests, 'size', 'comparisons', 'over'),
                            'id': 'size',
                            'size': ''
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'size': gt('Size')
                    });

                    _.extend(opt.conditionsMapping, { 'size': ['size'] });

                    opt.conditionsOrder.push('size');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('size_'),
                        sizeValues = {
                            'over': gt('Is bigger than'),
                            'under': gt('Is smaller than')
                        }, li;

                    var unitValues = {
                        'B': 'Byte',
                        'K': 'kB',
                        'M': 'MB',
                        'G': 'GB'
                    };

                    var sizeValueView = new util.Input({ name: 'sizeValue', model: cmodel, className: 'form-control', id: inputId });

                    var size = cmodel.get('size'),
                        unit = size.charAt(size.length - 1),
                        number = size.substring(0, size.length - 1);

                    if (!unitValues[unit]) {
                        unit = null;
                        number = cmodel.get('size');
                    }

                    // initial states
                    cmodel.set('unit', unit || 'B', { silent: true });
                    cmodel.set('sizeValue', number, { silent: true });

                    cmodel.on('change:sizeValue change:unit', function () {
                        // workaround to trigger validation on sizevalue-input also when unit changes
                        if (this.changed.unit) sizeValueView.onKeyup();
                        this.set('size', this.get('sizeValue') + this.get('unit'));
                    });

                    this.append(
                        li = $('<li>').addClass('filter-settings-view row ' + addClass).attr({ 'data-test-id': conditionKey }).append(
                            $('<div>').addClass('col-sm-3 singleline').append(
                                $('<span>').addClass('list-title').text(baton.view.conditionsTranslation[condition.id])
                            ),
                            $('<div>').addClass('col-sm-9').append(
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-7').append(
                                        new util.DropdownLinkView({ name: 'comparison', model: cmodel, values: filterValues(condition.id, sizeValues) }).render().$el
                                    ),
                                    $('<div class="col-sm-4">').append(
                                        sizeValueView.render().$el
                                    ),
                                    $('<div>').addClass('col-sm-1 no-padding-left').append(
                                        new mini.DropdownLinkView({ name: 'unit', model: cmodel, values: unitValues }).render().$el,
                                        new mini.ErrorView({ selector: '.row' }).render().$el
                                    )
                                )
                            ),
                            util.drawDeleteButton('test')
                        )
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, sizeValues),
                        model: cmodel,
                        inputName: 'size'
                    });
                }

            });
        }

        if (supportedConditions.address) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'address',

                index: 800,

                initialize: function (opt) {
                    var defaults = {
                        'address': {
                            'id': 'address',
                            'addresspart': util.returnDefault(config.tests, 'address', 'parts', 'all'),
                            'comparison': util.returnDefault(config.tests, 'address', 'comparisons', 'is'),
                            'headers': [util.returnDefault(config.tests, 'address', 'headers', 'from')],
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'address': gt('Email address')
                    });

                    _.extend(opt.conditionsMapping, { 'address': ['address'] });

                    opt.conditionsOrder.push('address');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var addressValues = {
                            'all': gt('All'),
                            'localpart': gt('Local-part'),
                            'domain': gt('Domain'),
                            'user': gt('User'),
                            'detail': gt('Detail')
                        },
                        headerValues = {
                            'from': gt('From'),
                            'to': gt('To'),
                            'cc': gt('Cc'),
                            'bcc': gt('Bcc'),
                            'sender': gt('Sender'),
                            //#. header entry - needs no different translation
                            'resent-from': gt('Resent-From'),
                            //#. header entry - needs no different translation
                            'resent-to': gt('Resent-To')
                        },
                        inputId = _.uniqueId('address_'),
                        li;

                    this.append(
                        li = util.drawCondition({
                            layout: '3',
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.address,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                            seconddropdownOptions: { name: 'headers', model: cmodel, values: util.filterHeaderValues(config.tests, 'address', headerValues), saveAsArray: true },
                            thirddropdownOptions: { name: 'addresspart', model: cmodel, values: util.filterPartValues(config.tests, 'address', addressValues) },
                            inputLabel: baton.view.conditionsTranslation.address + ' ' + addressValues[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });
                }
            });
        }

        if (supportedConditions.string) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'string',

                index: 1000,

                initialize: function (opt) {
                    var defaults = {
                        'string': {
                            'comparison': util.returnDefault(config.tests, 'string', 'comparisons', 'matches'),
                            'source': [''],
                            'id': 'string',
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'string': gt('String')
                    });

                    _.extend(opt.conditionsMapping, { 'string': ['string'] });

                    opt.conditionsOrder.push('string');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var secondInputId = _.uniqueId('values'),
                        li;

                    var title,
                        inputId = _.uniqueId('string_');

                    title = baton.view.conditionsTranslation.string;
                    this.append(
                        li = util.drawCondition({
                            conditionKey: conditionKey,
                            title: title,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                            inputId: inputId,
                            InputLabel: gt('Source'),
                            inputOptions: { name: 'source', model: cmodel, className: 'form-control', id: inputId },
                            secondInputId: secondInputId,
                            secondInputLabel: title + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                            secondInputOptions: { name: 'values', model: cmodel, className: 'form-control', id: secondInputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                    util.handleUnsupportedComparisonValues({
                        $li: li,
                        values: filterValues(condition.id, util.returnContainsOptions()),
                        model: cmodel,
                        inputName: 'values'
                    });

                    // util.handleSpecialComparisonValues({
                    //     $li: li,
                    //     values: filterValues(condition.id, util.returnContainsOptions()),
                    //     model: cmodel,
                    //     inputName: 'values',
                    //     defaults: baton.view.defaults.tests[baton.view.defaults.conditionsMapping[condition.id]]
                    // });
                }
            });
        }


        if (supportedConditions.guard_verify && capabilities.has('guard-mail')) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'guard_verify',

                index: 500,

                initialize: function (opt) {
                    var defaults = {
                        'guard_verify': {
                            'id': 'guard_verify',
                            'comparison': 'is'
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'guard_verify': gt('PGP signature')
                    });

                    _.extend(opt.conditionsMapping, { 'guard_verify': ['guard_verify'] });

                    opt.conditionsOrder.push('guard_verify');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    this.append(
                        $('<li class="filter-settings-view row">').addClass(addClass).attr('data-test-id', conditionKey).append(
                            $('<div class="col-sm-3 singleline">').append(
                                $('<span class="list-title">').text(baton.view.conditionsTranslation.guard_verify)
                            ),
                            $('<div class="col-sm-9">').append(
                                $('<div class="col-sm-9">').append($('<div class="row">').append(
                                    //#. Tests for PGP Signature.
                                    new util.DropdownLinkView({ name: 'comparison', model: cmodel, values: { 'is': gt('The signature exists and is valid'), 'not is': gt('The signature is missing or is not valid') } }).render().$el)
                                )),
                            util.drawDeleteButton('test')));
                }

            });
        }

    }

    return api.getConfig().then(processConfig).then(function () {
        defer.resolve({ processConfig: processConfig });
        return defer;
    });

});
