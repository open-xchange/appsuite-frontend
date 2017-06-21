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

    var VacationNoticeModel = Backbone.Model.extend({

        parse: function (response) {

            // early return is required for model.save()
            // server does not return usable data
            if (!_.isArray(response)) return {};

            var data = response[0],
                attr = {
                    active: false,
                    activateTimeFrame: false,
                    days: '7',
                    internal_id: 'vacation',
                    subject: '',
                    text: ''
                };

            // use defaults
            if (!data || !data.actioncmds[0]) {
                return _.extend(attr, this.getDefaultRange());
            }

            // copy all attributes from actioncmds[0], e.g. days, subject, text
            _.extend(attr, data.actioncmds[0]);

            // from
            if (!attr.from) attr.from = 'default';

            // addresses
            _(attr.addresses).each(function (address) {
                attr['alias_' + address] = true;
            });

            // IDs
            attr.internal_id = attr.id;
            attr.id = data.id;

            // active
            attr.active = !!data.active;

            this.parseTime(attr, data.test);

            return attr;
        },

        parseTime: function (attr, test) {

            if (_(test).size() === 2) {
                // we do have a time frame
                _(test.tests).each(parseTest);
                attr.activateTimeFrame = true;
            } else if (test.id === 'currentdate') {
                // we do have just start or end date
                parseTest(test);
                attr.activateTimeFrame = true;
            } else {
                _.extend(attr, this.getDefaultRange());
            }

            function parseTest(test) {
                attr[test.comparison === 'ge' ? 'dateFrom' : 'dateUntil'] = test.datevalue[0];
            }
        },

        getDefaultRange: function () {
            return { dateFrom: +moment().utc(true), dateUntil: +moment().utc(true).add(1, 'week') };
        },

        toJSON: function () {

            var attr = this.attributes,
                cmd = _(attr).pick('days', 'subject', 'text');

            // copy internal_id as id
            cmd.id = attr.internal_id;

            // from
            if (attr.from && attr.from !== 'default') {
                cmd.from = parseAddress(attr.from);
            }

            // addresses
            cmd.addresses = [attr.primaryMail];
            _(attr).each(function (value, name) {
                if (value === true && /^alias_.*@.*$/.test(name)) cmd.addresses.push(name.substr(6));
            });

            // position
            if (attr.position !== undefined) cmd.position = attr.position;

            // time
            var testForTimeframe = { id: 'allof', tests: [] };

            if (attr.dateFrom) {
                testForTimeframe.tests.push({
                    id: 'currentdate',
                    comparison: 'ge',
                    datepart: 'date',
                    datevalue: [attr.dateFrom]
                });
            }

            if (attr.dateUntil) {
                testForTimeframe.tests.push({
                    id: 'currentdate',
                    comparison: 'le',
                    datepart: 'date',
                    datevalue: [attr.dateUntil]
                });
            }

            if (testForTimeframe.tests.length === 1 && attr.activateTimeFrame) {
                testForTimeframe = testForTimeframe.tests[0];
            } else if (testForTimeframe.tests.length === 0 || attr.activateTimeFrame === false) {
                testForTimeframe = { id: 'true' };
            }

            // get final json
            var json = {
                active: attr.active,
                actioncmds: [cmd],
                test: testForTimeframe
            };

            if (attr.id !== undefined) json.id = attr.id;

            return json;
        },

        sync: function (method, module, options) {
            switch (method) {
                case 'read': return api.getRules('vacation').done(options.success).fail(options.error);
                case 'update': return api.update(this.toJSON()).done(options.success).fail(options.error);
                // no default
            }
        }
    });

    function parseAddress(address) {
        var match = address.match(/^(.+)\s<(.+)>$/);
        return match ? match.slice(1, 3) : address;
    }

    VacationNoticeModel.fields = {
        headline: gt('Vacation Notice'),
        subject: gt('Subject'),
        text: gt('Text'),
        //#. Context: Vacation notices
        days: gt('Days between notices to the same sender'),
        headlineAdresses: gt('Enable for the following addresses'),
        headlineSender: gt('Default sender for vacation notice'),
        addresses: gt('Email addresses'),
        dateFrom: gt('Start'),
        dateUntil: gt('End'),
        activateTimeFrame: gt('Send vacation notice during this time only'),
        active: gt('Enabled'),
        placeholder: gt('Add contact') + ' \u2026',
        label: gt('Add contact'),
        sendFrom: gt('Send from')
    };

    return VacationNoticeModel;
});
