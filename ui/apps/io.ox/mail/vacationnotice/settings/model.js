/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define('io.ox/mail/vacationnotice/settings/model',
      ['io.ox/backbone/modelFactory',
       'io.ox/backbone/validation',
       'io.ox/core/api/mailfilter',
       'gettext!io.ox/mail'
       ], function (ModelFactory, Validators, api, gt) {

    'use strict';

    function providePreparedData(attributes) {
        var newAttributes = {
                days: attributes.days,
                id: attributes.internal_id,
                subject: attributes.subject,
                text: attributes.text
            },

            preparedData = {
                "actioncmds": [newAttributes]
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
                "id": "allof",
                "tests": []
            };

        if (attributes.dateFrom) {
            testForTimeframe.tests.push(
                {
                    "id": "currentdate",
                    "comparison": "ge",
                    "datepart": "date",
                    "datevalue": [attributes.dateFrom]
                }
            );
        }

        if (attributes.dateUntil) {
            testForTimeframe.tests.push(
                {
                    "id": "currentdate",
                    "comparison": "le",
                    "datepart": "date",
                    "datevalue": [attributes.dateUntil]
                }
            );
        }

        if (testForTimeframe.tests.length === 0 || attributes.activateTimeFrame === false) {
            testForTimeframe = { id: "true" };
        }

        preparedData.test = testForTimeframe;

        return preparedData;
    }

    function buildFactory(ref, api) {
        var factory = new ModelFactory({
            api: api,
            ref: ref,

            update: function (model) {
                return api.update(providePreparedData(model.attributes));
            },

            create: function (model) {
                var preparedData = providePreparedData(model.attributes);
                preparedData.rulename = gt("vacation notice");
                preparedData.flags = ["vacation"];

                return api.create(preparedData);
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
        addresses: gt('E-mail addresses'),
        dateFrom: gt('From'),
        dateUntil: gt('End'),
        activateTimeFrame: gt('Send vacation notice during this time only')
    };


    return {
        api: api,
        fields: fields,
        protectedMethods: {
            buildFactory: buildFactory
        }
    };
});

