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
define('io.ox/mail/mailfilter/settings/model',
      ['io.ox/backbone/modelFactory',
       'io.ox/backbone/validation',
       'io.ox/mail/mailfilter/api',
       'gettext!io.ox/mail'
       ], function (ModelFactory, Validators, api, gt) {

    'use strict';

    function buildFactory(ref, api) {
        var factory = new ModelFactory({
            api: api,
            ref: ref,

            update: function (model) {

                var newAttributes = {
                        days: model.attributes.days,
                        id: model.attributes.id,
                        subject: model.attributes.subject,
                        text: model.attributes.text
                    };

                var preparedData = {
                        "actioncmds": [newAttributes],
                        "id": model.attributes.mainID
                    };

                var addresses = [];
                _(model.attributes).each(function (value, attribute) {
                    if (value === true && attribute !== 'activateTimeFrame') {
                        addresses.push(attribute);
                        preparedData.active = true;
                    }
                });

                if (!_.isEmpty(addresses)) {
                    newAttributes.addresses = addresses;

                } else {
                    newAttributes.addresses = [model.attributes.primaryMail];
                    preparedData.active = false;
                }


                var testForTimeframe = {
                        "id": "allof",
                        "tests": []
                    };

                if (model.attributes.dateFrom) {
                    testForTimeframe.tests.push(
                        {
                            "id": "currentdate",
                            "comparison": "ge",
                            "datepart": "date",
                            "datevalue": [model.attributes.dateFrom]
                        }
                    );
                }

                if (model.attributes.dateUntil) {
                    testForTimeframe.tests.push(
                        {
                            "id": "currentdate",
                            "comparison": "le",
                            "datepart": "date",
                            "datevalue": [model.attributes.dateUntil]
                        }
                    );
                }

                if (testForTimeframe.tests.length === 0 || model.attributes.activateTimeFrame === false) {
                    testForTimeframe = { id: "true" };
                }

                preparedData.test = testForTimeframe;

                return api.update(preparedData);
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

