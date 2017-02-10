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
    'io.ox/backbone/mini-views/datepicker'

], function (ext, gt, mini, util, DatePicker) {

    'use strict';

    ext.point('io.ox/mail/mailfilter/tests').extend({

        id: 'body',

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

        draw: function (baton, conditionKey, cmodel, filterValues, condition) {
            var inputId = _.uniqueId('body_');

            this.append(
                util.drawCondition({
                    conditionKey: conditionKey,
                    inputId: inputId,
                    title: baton.view.conditionsTranslation.body,
                    dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                    inputLabel: baton.view.conditionsTranslation.body + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                    inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                    errorView: true
                })
            );

        }

    });

    ext.point('io.ox/mail/mailfilter/tests').extend({

        id: 'currentdate',

        initialize: function (opt) {
            var defaults = {
                'currentdate': {
                    'id': 'currentdate',
                    'comparison': 'ge',
                    'datepart': 'date',
                    'datevalue': []
                }
            };
            _.extend(opt.defaults.tests, defaults);
            _.extend(opt.conditionsTranslation, {
                'currentdate': gt('Date')
            });

            _.extend(opt.conditionsMapping, { 'currentdate': ['currentdate'] });
        },

        draw: function (baton, conditionKey, cmodel, filterValues, condition) {

            var timeValues = {
                'ge': gt('Rule applies from'),
                'le': gt('Rule applies until'),
                'is': gt('Rule applies on')
            };

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
                    baton.view.$el.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').addClass('has-error');
                } else {
                    baton.view.$el.find('[data-test-id="' + conditionKey + '"] input.datepicker-day-field').closest('.row').removeClass('has-error');
                }
                baton.view.$el.trigger('toggle:saveButton');
            });
            this.append(
                $('<li>').addClass('filter-settings-view row').attr({ 'data-test-id': conditionKey }).append(
                    $('<div>').addClass('col-sm-4 singleline').append(
                        $('<span>').addClass('list-title').text(baton.view.conditionsTranslation[condition.id])
                    ),
                    $('<div>').addClass('col-sm-8').append(
                        $('<div>').addClass('row').append(
                            $('<div>').addClass('col-sm-4').append(
                                new mini.DropdownLinkView({ name: 'comparison', model: cmodel, values: filterValues('currentdate', timeValues) }).render().$el
                            ),
                            $('<div class="col-sm-8">').append(
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

        id: 'envelope',

        initialize: function (opt) {
            var defaults = {
                'envelope': {
                    'comparison': 'matches',
                    'headers': ['To'],
                    'id': 'envelope',
                    'values': ['']
                }
            };
            _.extend(opt.defaults.tests, defaults);
            _.extend(opt.conditionsTranslation, {
                'envelope': gt('Envelope')
            });

            _.extend(opt.conditionsMapping, { 'envelope': ['envelope'] });
        },

        draw: function (baton, conditionKey, cmodel, filterValues, condition) {

            var headerValues = {
                'To': gt('To'),
                'From': gt('From')
            };

            var inputId = _.uniqueId('envelope_');
            this.append(
                util.drawCondition({
                    conditionKey: conditionKey,
                    inputId: inputId,
                    title: baton.view.conditionsTranslation.envelope,
                    dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, util.returnContainsOptions()) },
                    seconddropdownOptions: { name: 'headers', model: cmodel, values: headerValues, saveAsArray: true },
                    inputLabel: baton.view.conditionsTranslation.envelope + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                    inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                    errorView: true
                })
            );

        }

    });

    ext.point('io.ox/mail/mailfilter/tests').extend({

        id: 'header',

        initialize: function (opt) {
            var defaults = {
                'From': {
                    'comparison': 'contains',
                    'headers': ['From'],
                    'id': 'header',
                    'values': ['']
                },
                'any': {
                    'comparison': 'contains',
                    'headers': ['To', 'Cc'],
                    'id': 'header',
                    'values': ['']
                },
                'Subject': {
                    'comparison': 'contains',
                    'headers': ['Subject'],
                    'id': 'header',
                    'values': ['']
                },
                'mailingList': {
                    'comparison': 'contains',
                    'headers': ['List-Id', 'X-BeenThere', 'X-Mailinglist', 'X-Mailing-List'],
                    'id': 'header',
                    'values': ['']
                },
                'To': {
                    'comparison': 'contains',
                    'headers': ['To'],
                    'id': 'header',
                    'values': ['']
                },
                'Cc': {
                    'comparison': 'contains',
                    'headers': ['Cc'],
                    'id': 'header',
                    'values': ['']
                },
                'cleanHeader': {
                    'comparison': 'matches',
                    'headers': [''],
                    'id': 'header',
                    'values': ['']
                }
            };
            _.extend(opt.defaults.tests, defaults);
            _.extend(opt.conditionsTranslation, {
                'From': gt('Sender/From'),
                'any': gt('Any recipient'),
                'Subject': gt('Subject'),
                'mailingList': gt('Mailing list'),
                'To': gt('To'),
                'Cc': gt('CC'),
                'cleanHeader': gt('Header')
            });

            _.extend(opt.conditionsMapping, { 'header': ['From', 'any', 'Subject', 'mailingList', 'To', 'Cc', 'cleanHeader'] });
        },

        draw: function (baton, conditionKey, cmodel, filterValues, condition) {
            var secondInputId = _.uniqueId('values');

            var title,
                translation,
                inputId = _.uniqueId('header_');

            if (cmodel.get('headers').length === 4) {
                title = baton.view.conditionsTranslation.mailingList;
            } else if (cmodel.get('headers').length === 2) {
                title = baton.view.conditionsTranslation.any;
            } else {
                translation = _.chain(baton.view.conditionsTranslation).pick(function (value, key) {
                    return cmodel.get('headers')[0].toUpperCase() === key.toUpperCase();
                }).values().first().value();

                title = cmodel.get('headers')[0] === '' ? baton.view.conditionsTranslation.cleanHeader : translation;
            }

            if (cmodel.get('headers')[0] === '' || title === undefined) {
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
                        errorView: true
                    })
                );
            } else {

                this.append(
                    util.drawCondition({
                        conditionKey: conditionKey,
                        inputId: secondInputId,
                        title: title,
                        dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(cmodel.get('id'), util.returnContainsOptions()) },
                        inputLabel: title + ' ' + util.returnContainsOptions()[cmodel.get('comparison')],
                        inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: secondInputId, conditionView: baton.view },
                        errorView: true
                    })
                );
            }

        }
    });

    ext.point('io.ox/mail/mailfilter/tests').extend({

        id: 'size',

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

        draw: function (baton, conditionKey, cmodel, filterValues, condition) {
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
                    errorView: true
                })
            );
        }

    });

    ext.point('io.ox/mail/mailfilter/tests').extend({

        id: 'address',

        initialize: function (opt) {
            var defaults = {
                'address': {
                    'id': 'address',
                    'comparison': 'all',
                    'headers': ['From'],
                    'values': ['']
                }
            };
            _.extend(opt.defaults.tests, defaults);
            _.extend(opt.conditionsTranslation, {
                'address': gt('Sender address')
            });

            _.extend(opt.conditionsMapping, { 'address': ['address'] });
        },

        draw: function (baton, conditionKey, cmodel, filterValues, condition) {
            var addressValues = {
                    'user': gt('User'),
                    'detail': gt('Detail'),
                    'all': gt('All'),
                    'localpart': gt('Localpart'),
                    'domain': gt('Domain')
                }, inputId = _.uniqueId('address_');

            this.append(
                util.drawCondition({
                    conditionKey: conditionKey,
                    inputId: inputId,
                    title: baton.view.conditionsTranslation.address,
                    dropdownOptions: { name: 'comparison', model: cmodel, values: filterValues(condition.id, addressValues) },
                    inputLabel: baton.view.conditionsTranslation.address + ' ' + addressValues[cmodel.get('comparison')],
                    inputOptions: { name: 'values', model: cmodel, className: 'form-control', id: inputId },
                    errorView: true
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
