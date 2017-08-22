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
 *
 */

define.async('io.ox/mail/mailfilter/settings/filter/tests/register', [
    'io.ox/core/extensions',
    'gettext!io.ox/mailfilter',
    'io.ox/backbone/mini-views',
    'io.ox/mail/mailfilter/settings/filter/tests/util',
    'io.ox/backbone/mini-views/datepicker',
    'io.ox/core/api/mailfilter'
], function (ext, gt, mini, util, DatePicker, api) {

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
                                    skip: 'nested'
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
                            'comparison': 'contains',
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
                    var inputId = _.uniqueId('body_');

                    this.append(
                        util.drawCondition({
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
                            'comparison': 'ge',
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
                        $('<li>').addClass('filter-settings-view row ' + addClass).attr({ 'data-test-id': conditionKey }).append(
                            $('<div>').addClass('col-sm-2 singleline').append(
                                $('<span>').addClass('list-title').text(baton.view.conditionsTranslation[condition.id])
                            ),
                            $('<div>').addClass('col-sm-10').append(
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-4').append(
                                        new mini.DropdownLinkView({ name: 'comparison', model: cmodel, values: filterValues('currentdate', timeValues) }).render().$el
                                    ),
                                    $('<div>').addClass('col-sm-3').append(
                                        new mini.DropdownLinkView({ name: 'zone', model: cmodel, values: timezoneValues }).render().$el
                                    ),
                                    $('<div class="col-sm-5">').append(
                                        new ModifiedDatePicker({
                                            model: cmodel,
                                            display: 'DATETIME',
                                            attribute: 'datevalue',
                                            label: gt('datepicker')
                                        }).render().$el
                                    )
                                )
                            ),
                            util.drawDeleteButton('test')
                        )
                    ).find('legend').addClass('sr-only');
                    if (cmodel.get('datevalue')[0] === null || cmodel.get('datevalue').length === 0) this.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').addClass('has-error');

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
                            'comparison': 'ge',
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
                        $('<li>').addClass('filter-settings-view row ' + addClass).attr({ 'data-test-id': conditionKey }).append(
                            $('<div>').addClass('col-sm-2 singleline').append(
                                $('<span>').addClass('list-title').text(baton.view.conditionsTranslation[condition.id])
                            ),
                            $('<div>').addClass('col-sm-10').append(
                                $('<div>').addClass('row').append(
                                    $('<div>').addClass('col-sm-4').append(
                                        new mini.DropdownLinkView({ name: 'comparison', model: cmodel, values: filterValues('date', timeValues) }).render().$el
                                    ),
                                    $('<div>').addClass('col-sm-3').append(
                                        new mini.DropdownLinkView({ name: 'zone', model: cmodel, values: timezoneValues }).render().$el
                                    ),
                                    $('<div class="col-sm-5">').append(
                                        new ModifiedDatePicker({
                                            model: cmodel,
                                            display: 'DATETIME',
                                            attribute: 'datevalue',
                                            label: gt('datepicker'),
                                            timezoneButton: false
                                        }).render().$el
                                    )
                                )
                            ),
                            util.drawDeleteButton('test')
                        )
                    ).find('legend').addClass('sr-only');
                    if (cmodel.get('datevalue')[0] === null || cmodel.get('datevalue').length === 0) this.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').addClass('has-error');

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
                            'comparison': 'is',
                            'addresspart': 'all',
                            'headers': ['to'],
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
                            'localpart': gt('Localpart'),
                            'domain': gt('Domain'),
                            'user': gt('User'),
                            'detail': gt('Detail')
                        };

                    var inputId = _.uniqueId('envelope_');
                    this.append(
                        util.drawCondition({
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
                            'comparison': 'matches',
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
                    var secondInputId = _.uniqueId('values');

                    var title,
                        inputId = _.uniqueId('header_');

                    title = baton.view.conditionsTranslation.cleanHeader;
                    this.append(
                        util.drawCondition({
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
                            'comparison': 'contains',
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
                    var inputId = _.uniqueId('subject_');

                    this.append(
                        util.drawCondition({
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
                            'comparison': 'contains',
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
                    var inputId = _.uniqueId('from_');

                    this.append(
                        util.drawCondition({
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
                            'comparison': 'contains',
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
                    var inputId = _.uniqueId('to_');

                    this.append(
                        util.drawCondition({
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
                            'comparison': 'contains',
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
                    var inputId = _.uniqueId('cc_');

                    this.append(
                        util.drawCondition({
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
                            'comparison': 'contains',
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
                    var inputId = _.uniqueId('anyrecipient_');

                    this.append(
                        util.drawCondition({
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
                            'comparison': 'contains',
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
                    var inputId = _.uniqueId('mailinglist_');

                    this.append(
                        util.drawCondition({
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
                            'comparison': 'over',
                            'id': 'size',
                            'size': ''
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'size': gt('Size (bytes)')
                    });

                    _.extend(opt.conditionsMapping, { 'size': ['size'] });

                    opt.conditionsOrder.push('size');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('size_'),
                        sizeValues = {
                            'over': gt('Is bigger than'),
                            'under': gt('Is smaller than')
                        };

                    this.append(
                        util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.size,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, sizeValues) },
                            inputLabel: baton.view.conditionsTranslation.size + ' ' + sizeValues[cmodel.get('comparison')],
                            inputOptions: { name: 'size', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );
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
                            'addresspart': 'all',
                            'comparison': 'is',
                            'headers': ['from'],
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'address': gt('Address')
                    });

                    _.extend(opt.conditionsMapping, { 'address': ['address'] });

                    opt.conditionsOrder.push('address');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var addressValues = {
                            'all': gt('All'),
                            'localpart': gt('Localpart'),
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
                        inputId = _.uniqueId('address_');

                    this.append(
                        util.drawCondition({
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
                }
            });
        }

        if (supportedConditions.exists) {
            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'exists',

                index: 1100,

                initialize: function (opt) {
                    var defaults = {
                        'exists': {
                            'headers': [],
                            'id': 'exists'
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'exists': gt('Header exists')
                    });

                    _.extend(opt.conditionsMapping, { 'exists': ['exists'] });

                    opt.conditionsOrder.push('exists');
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('exists_');

                    this.append(
                        util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.exists,
                            inputLabel: baton.view.conditionsTranslation.exists + ' ' + cmodel.get('headers'),
                            inputOptions: { name: 'headers', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );
                }

            });
        }

    }

    return api.getConfig().then(processConfig).then(function () {
        defer.resolve({ processConfig: processConfig });
        return defer;
    });

});
