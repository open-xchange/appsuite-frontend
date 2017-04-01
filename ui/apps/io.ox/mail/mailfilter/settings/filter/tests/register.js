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

define('io.ox/mail/mailfilter/settings/filter/tests/register', [
    'io.ox/core/extensions',
    'gettext!io.ox/mailfilter',
    'io.ox/backbone/mini-views',
    'io.ox/mail/mailfilter/settings/filter/tests/util',
    'io.ox/backbone/mini-views/datepicker',
    'io.ox/core/api/mailfilter',

], function (ext, gt, mini, util, DatePicker, api) {

    'use strict';

    api.getConfig().done(function (config) {

        var cap = _.object(config.capabilities, config.capabilities);
        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'nested',

            index: 100,

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
            },

            draw: function (baton, conditionKey) {
                var arrayOfTests = baton.model.get('test').tests[conditionKey],
                    options = {
                        target: 'nestedID',
                        toggle: 'dropup',
                        caret: true
                    },
                    optionsSwitch = util.drawDropdown(arrayOfTests.id, { allof: gt('continue if all of these conditions are met'), anyof: gt('continue if any of these condition is met.') }, options),
                    assembled = arrayOfTests.id === 'allof' || arrayOfTests.id === 'anyof' ? optionsSwitch : $('<div>').addClass('line').text(gt('continue if all conditions are met'));
                this.append(
                    $('<li>').addClass('filter-settings-view row nestedrule').attr({ 'data-test-id': conditionKey }).append(
                        $('<div>').addClass('col-sm-9 singleline').append(
                            assembled
                        ),
                        $('<div>').addClass('col-sm-3 singleline').append(
                            util.drawDropdown(gt('Add condition'), baton.view.conditionsTranslation, {
                                test: 'create',
                                nested: true,
                                toggle: 'dropdown',
                                classes: 'condition',
                                // multi optiuons?
                                skip: 'nested'
                            })
                        ),
                        util.drawDeleteButton('test')
                    )
                );

            }

        });

        if (_.has(cap, 'body')) {

            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'body',

                index: 200,

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
                        'body': gt('Content')
                    });

                    _.extend(opt.conditionsMapping, { 'body': ['body'] });
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                    var inputId = _.uniqueId('body_');

                    this.append(
                        util.drawCondition({
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.body,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions(cap)) },
                            inputLabel: baton.view.conditionsTranslation.body + ' ' + util.returnContainsOptions(cap)[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                }

            });

        }

        if (_.has(cap, 'date') && _.has(cap, 'relational')) {

            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'currentdate',

                index: 300,

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
                        values.original = gt('original timezone');
                        return values;
                    }

                    var timeValues = {
                        'ge': gt('Rule applies from'),
                        'le': gt('Rule applies until'),
                        'is': gt('Rule applies on'),
                        'not is': gt('Rule applies not on'),
                        'not ge': gt('Rule applies not from'),
                        'not le': gt('Rule applies not until')
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
                                        new ModifiedDatePicker({ model: cmodel, display: 'DATE', attribute: 'datevalue', label: gt('datepicker') }).render().$el
                                    )
                                )
                            ),
                            util.drawDeleteButton('test')
                        )
                    ).find('legend').addClass('sr-only');
                    if (cmodel.get('datevalue')[0] === null || cmodel.get('datevalue').length === 0) this.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').addClass('has-error');

                }

            });

            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'date',

                index: 400,

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
                        values.original = gt('original timezone');
                        return values;
                    }

                    var timeValues = {
                        'ge': gt('Rule applies from'),
                        'le': gt('Rule applies until'),
                        'is': gt('Rule applies on'),
                        'not is': gt('Rule applies not on'),
                        'not ge': gt('Rule applies not from'),
                        'not le': gt('Rule applies not until')
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

        if (_.has(cap, 'envelope')) {

            ext.point('io.ox/mail/mailfilter/tests').extend({

                id: 'envelope',

                index: 500,

                initialize: function (opt) {
                    var defaults = {
                        'envelope': {
                            'id': 'envelope',
                            'comparison': 'matches',
                            'addresspart': 'all',
                            'headers': ['To'],
                            'values': ['']
                        }
                    };
                    _.extend(opt.defaults.tests, defaults);
                    _.extend(opt.conditionsTranslation, {
                        'envelope': gt('Envelope')
                    });

                    _.extend(opt.conditionsMapping, { 'envelope': ['envelope'] });
                },

                draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {

                    var headerValues = {
                            'To': gt('To'),
                            'From': gt('From')
                        },
                        addressValues = {
                            'all': gt('All'),
                            'localpart': gt('Localpart'),
                            'domain': gt('Domain')
                        };

                    if (_.indexOf(config.capabilities, 'subaddress') !== -1) {
                        _.extend(addressValues, {
                            'user': gt('User'),
                            'detail': gt('Detail')
                        });
                    }

                    var inputId = _.uniqueId('envelope_');
                    this.append(
                        util.drawCondition({
                            layout: '3',
                            conditionKey: conditionKey,
                            inputId: inputId,
                            title: baton.view.conditionsTranslation.envelope,
                            dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions(cap)) },
                            seconddropdownOptions: { name: 'headers', model: cmodel, values: headerValues, saveAsArray: true },
                            thirddropdownOptions: { name: 'addresspart', model: cmodel, values: addressValues },
                            inputLabel: baton.view.conditionsTranslation.envelope + ' ' + util.returnContainsOptions(cap)[cmodel.get('comparison')],
                            inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                            errorView: true,
                            addClass: addClass
                        })
                    );

                }

            });

        }

        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'header',

            index: 600,

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
                        dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions(cap)) },
                        inputOptions: { name: 'headers', model: cmodel, className: 'form-control', id: inputId },
                        secondInputId: secondInputId,
                        secondInputLabel: title + ' ' + util.returnContainsOptions(cap)[cmodel.get('comparison')],
                        secondInputOptions: { name: 'values', model: cmodel, className: 'form-control', id: secondInputId },
                        errorView: true,
                        addClass: addClass
                    })
                );
            }
        });

        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'subject',

            index: 700,

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
            },

            draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                var inputId = _.uniqueId('subject_');

                this.append(
                    util.drawCondition({
                        conditionKey: conditionKey,
                        inputId: inputId,
                        title: baton.view.conditionsTranslation.subject,
                        dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions(cap)) },
                        inputLabel: baton.view.conditionsTranslation.subject + ' ' + util.returnContainsOptions(cap)[cmodel.get('comparison')],
                        inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                        errorView: true,
                        addClass: addClass
                    })
                );
            }

        });

        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'from',

            index: 800,

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
                    'from': gt('Sender/From'),
                });

                _.extend(opt.conditionsMapping, { 'from': ['from'] });
            },

            draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                var inputId = _.uniqueId('from_');

                this.append(
                    util.drawCondition({
                        conditionKey: conditionKey,
                        inputId: inputId,
                        title: baton.view.conditionsTranslation.from,
                        dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions(cap)) },
                        inputLabel: baton.view.conditionsTranslation.from + ' ' + util.returnContainsOptions(cap)[cmodel.get('comparison')],
                        inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                        errorView: true,
                        addClass: addClass
                    })
                );
            }

        });

        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'to',

            index: 900,

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
            },

            draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                var inputId = _.uniqueId('to_');

                this.append(
                    util.drawCondition({
                        conditionKey: conditionKey,
                        inputId: inputId,
                        title: baton.view.conditionsTranslation.to,
                        dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions(cap)) },
                        inputLabel: baton.view.conditionsTranslation.to + ' ' + util.returnContainsOptions(cap)[cmodel.get('comparison')],
                        inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                        errorView: true,
                        addClass: addClass
                    })
                );
            }

        });

        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'cc',

            index: 1000,

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
                    'cc': gt('CC')
                });

                _.extend(opt.conditionsMapping, { 'cc': ['cc'] });
            },

            draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                var inputId = _.uniqueId('cc_');

                this.append(
                    util.drawCondition({
                        conditionKey: conditionKey,
                        inputId: inputId,
                        title: baton.view.conditionsTranslation.cc,
                        dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions(cap)) },
                        inputLabel: baton.view.conditionsTranslation.cc + ' ' + util.returnContainsOptions(cap)[cmodel.get('comparison')],
                        inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                        errorView: true,
                        addClass: addClass
                    })
                );
            }

        });

        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'anyRecipient',

            index: 1100,

            initialize: function (opt) {
                var defaults = {
                    'anyRecipient': {
                        'comparison': 'contains',
                        'headers': ['To', 'Cc'],
                        'id': 'anyRecipient',
                        'values': ['']
                    }
                };
                _.extend(opt.defaults.tests, defaults);
                _.extend(opt.conditionsTranslation, {
                    'anyRecipient': gt('Any recipient')
                });

                _.extend(opt.conditionsMapping, { 'anyRecipient': ['anyRecipient'] });
            },

            draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                var inputId = _.uniqueId('anyRecipient_');

                this.append(
                    util.drawCondition({
                        conditionKey: conditionKey,
                        inputId: inputId,
                        title: baton.view.conditionsTranslation.anyRecipient,
                        dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions(cap)) },
                        inputLabel: baton.view.conditionsTranslation.anyRecipient + ' ' + util.returnContainsOptions(cap)[cmodel.get('comparison')],
                        inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                        errorView: true,
                        addClass: addClass
                    })
                );
            }

        });

        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'mailingList',

            index: 1200,

            initialize: function (opt) {
                var defaults = {
                    'mailingList': {
                        'comparison': 'contains',
                        'headers': ['List-Id', 'X-BeenThere', 'X-Mailinglist', 'X-Mailing-List'],
                        'id': 'mailingList',
                        'values': ['']
                    }
                };
                _.extend(opt.defaults.tests, defaults);
                _.extend(opt.conditionsTranslation, {
                    'mailingList': gt('Mailing list')
                });

                _.extend(opt.conditionsMapping, { 'mailingList': ['mailingList'] });
            },

            draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                var inputId = _.uniqueId('mailingList_');

                this.append(
                    util.drawCondition({
                        conditionKey: conditionKey,
                        inputId: inputId,
                        title: baton.view.conditionsTranslation.mailingList,
                        dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions(cap)) },
                        inputLabel: baton.view.conditionsTranslation.mailingList + ' ' + util.returnContainsOptions(cap)[cmodel.get('comparison')],
                        inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                        errorView: true,
                        addClass: addClass
                    })
                );
            }

        });

        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'size',

            index: 1300,

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

        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'address',

            index: 1400,

            initialize: function (opt) {
                var defaults = {
                    'address': {
                        'id': 'address',
                        'addresspart': 'all',
                        'comparison': 'is',
                        'headers': ['From'],
                        'values': ['']
                    }
                };
                _.extend(opt.defaults.tests, defaults);
                _.extend(opt.conditionsTranslation, {
                    'address': gt('Address')
                });

                _.extend(opt.conditionsMapping, { 'address': ['address'] });
            },

            draw: function (baton, conditionKey, cmodel, filterValues, condition, addClass) {
                var addressValues = {
                        'all': gt('All'),
                        'localpart': gt('Localpart'),
                        'domain': gt('Domain')
                    },
                    headerValues = {
                        'From': gt('From'),
                        'To': gt('To'),
                        'Cc': gt('Cc'),
                        'Bcc': gt('Bcc'),
                        'Sender': gt('Sender'),
                        'Resent-From': gt('Resent-From'),
                        'Resent-To': gt('Resent-To')
                    },
                    inputId = _.uniqueId('address_');

                if (_.has(cap, 'subaddress')) {
                    _.extend(addressValues, {
                        'user': gt('User'),
                        'detail': gt('Detail')
                    });
                }

                this.append(
                    util.drawCondition({
                        layout: '3',
                        conditionKey: conditionKey,
                        inputId: inputId,
                        title: baton.view.conditionsTranslation.address,
                        dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions(cap)) },
                        seconddropdownOptions: { name: 'headers', model: cmodel, values: headerValues },
                        thirddropdownOptions: { name: 'addresspart', model: cmodel, values: addressValues },
                        inputLabel: baton.view.conditionsTranslation.address + ' ' + addressValues[cmodel.get('comparison')],
                        inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                        errorView: true,
                        addClass: addClass
                    })
                );
            }
        });

        ext.point('io.ox/mail/mailfilter/tests').extend({

            id: 'exists',

            index: 1500,

            initialize: function (opt) {
                var defaults = {
                    'exists': {
                        'headers': [],
                        'id': 'exists',
                    }
                };
                _.extend(opt.defaults.tests, defaults);
                _.extend(opt.conditionsTranslation, {
                    'exists': gt('Exists'),
                });

                _.extend(opt.conditionsMapping, { 'exists': ['exists'] });
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

        // testcase
        // ext.point('io.ox/mail/mailfilter/tests').extend({

        //     id: 'newtest',

        //     initialize: function (opt) {
        //         var defaults = {
        //             'newtest': {
        //                 'comparison': 'contains',
        //                 'headers': ['newHeader'],
        //                 'id': 'newtest',
        //                 'values': ['']
        //             }
        //         };
        //         _.extend(opt.defaults.tests, defaults);
        //         _.extend(opt.conditionsTranslation, {
        //             'newtest': gt('Newtest/Trans')
        //         });

        //         _.extend(opt.conditionsMapping, { 'newtest': ['newtest'] });
        //     },

        //     draw: function (baton, conditionKey, cmodel, filterValues, condition) {
        //         debugger;
        //         var inputId = _.uniqueId('newtest_');
        //         this.append(
        //             util.drawCondition({
        //                 conditionKey: conditionKey,
        //                 inputId: inputId,
        //                 title: baton.view.conditionsTranslation.newtest,
        //                 dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions({ 'testValue': gt('testValue') })) },
        //                 inputLabel: baton.view.conditionsTranslation.envelope + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
        //                 inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
        //                 errorView: true
        //             })
        //         );

        //     }

        // });

    });


});
