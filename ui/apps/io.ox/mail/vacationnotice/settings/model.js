/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define('io.ox/mail/vacationnotice/settings/model', [
    'io.ox/backbone/modelFactory',
    'io.ox/backbone/validation',
    'io.ox/core/api/mailfilter',
    'io.ox/settings/util',
    'gettext!io.ox/mail'
], function (ModelFactory, Validators, api, settingsUtil, gt) {

    'use strict';

    function providePreparedData(attributes) {
        var newAttributes = {
                days: attributes.days,
                id: attributes.internal_id,
                subject: attributes.subject,
                text: attributes.text,
                from: attributes.from
            },

            preparedData = {
                'actioncmds': [newAttributes]
            };

        if (attributes.id !== undefined) {
            preparedData.id = attributes.id;
        }

        var addresses = [];
        _(attributes).each(function (value, attribute) {
            if (value === true && attribute !== 'activateTimeFrame') {
                addresses.push(attribute);
                preparedData.active = true;
            }
        });

        if (!_.isEmpty(addresses)) {
            newAttributes.addresses = addresses;

        } else {
            newAttributes.addresses = [attributes.primaryMail];
            preparedData.active = false;
        }

        var testForTimeframe = {
                'id': 'allof',
                'tests': []
            };

        if (attributes.dateFrom) {
            testForTimeframe.tests.push(
                {
                    'id': 'currentdate',
                    'comparison': 'ge',
                    'datepart': 'date',
                    'datevalue': [attributes.dateFrom]
                }
            );
        }

        if (attributes.dateUntil) {
            testForTimeframe.tests.push(
                {
                    'id': 'currentdate',
                    'comparison': 'le',
                    'datepart': 'date',
                    'datevalue': [attributes.dateUntil]
                }
            );
        }

        if (testForTimeframe.tests.length === 0 || attributes.activateTimeFrame === false) {
            testForTimeframe = { id: 'true' };
        }

        preparedData.test = testForTimeframe;

        if (attributes.position !== undefined) {
            preparedData.position = attributes.position;
        }

        return preparedData;
    }

    function buildFactory(ref, api) {
        var factory = new ModelFactory({
            api: api,
            ref: ref,
            model: {
                idAttribute: 'id',

                init: function () {

                    // End date automatically shifts with start date
                    var length = this.get('dateUntil') - this.get('dateFrom'),
                        updatingStart = false,
                        updatingEnd = false;
                    this.on({
                        'change:dateFrom': function (model, dateFrom) {
                            if (length < 0 || updatingStart) {
                                return;
                            }
                            updatingEnd = true;
                            if (dateFrom && _.isNumber(length)) {
                                model.set('dateUntil', dateFrom + length, { validate: true });
                            }
                            updatingEnd = false;
                        },
                        'change:dateUntil': function (model, dateUntil) {
                            if (updatingEnd) {
                                return;
                            }
                            var tmpLength = dateUntil - model.get('dateFrom');
                            if (tmpLength < 0) {
                                updatingStart = true;
                                if (dateUntil && _.isNumber(length)) {
                                    model.set('dateFrom', dateUntil - length, { validate: true });
                                }
                                updatingStart = false;
                            } else {
                                length = tmpLength;
                            }
                        }
                    });
                }
            },
            update: function (model) {
                return settingsUtil.yellOnReject(
                    api.update(providePreparedData(model.attributes))
                );
            },

            create: function (model) {
                var preparedData = providePreparedData(model.attributes);
                preparedData.rulename = gt('vacation notice');
                preparedData.flags = ['vacation'];

                return settingsUtil.yellOnReject(
                    api.create(preparedData)
                );
            }

        });

        Validators.validationFor(ref, {
            subject: { format: 'string' },
            text: { format: 'string' },
            days: { format: 'string' },
            active: { format: 'boolean' },
            addresses: { format: 'array' },
            dateFrom: { format: 'date' },
            dateUntil: { format: 'date' },
            activateTimeFrame: { format: 'boolean' }
        });
        return factory;

    }

    var fields = {
        headline: gt('Vacation Notice'),
        subject: gt('Subject'),
        text: gt('Text'),
        days: gt('Number of days between vacation notices to the same sender'),
        headlineAdresses: gt('Enabled for the following addresses'),
        addresses: gt('Email addresses'),
        dateFrom: gt('Start'),
        dateUntil: gt('End'),
        activateTimeFrame: gt('Send vacation notice during this time only')
    };

    return {
        api: api,
        fields: fields,
        protectedMethods: {
            buildFactory: buildFactory,
            providePreparedData: providePreparedData
        }
    };
});
