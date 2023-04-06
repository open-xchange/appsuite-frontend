/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/mailfilter/vacationnotice/model', ['io.ox/core/api/mailfilter', 'gettext!io.ox/mail'], function (api, gt) {

    'use strict';

    var DAY = 24 * 60 * 60 * 1000;

    function getDefaultRange() {
        return { dateFrom: +moment().startOf('day'), dateUntil: +moment().endOf('day').add(1, 'week') };
    }

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

            // position
            attr.position = data.position;

            this.parseTest(attr, data.test);

            return attr;
        },

        parseTest: function (attr, test) {

            if (test.id === 'allof') {
                var parseTest = this.parseTest;
                _(test.tests).each(function (test) { parseTest(attr, test); });
            } else if (test.id === 'currentdate') {
                // we do have just start or end date
                parseCurrentDateTest(test);
                attr.activateTimeFrame = true;
            } else {
                _.extend(attr, getDefaultRange());
            }

            function parseCurrentDateTest(test) {

                function utcOffset(t) {
                    return moment(t).format('Z').replace(':', '');
                }

                if (test.zone === undefined) {
                    test.zone = utcOffset(test.datevalue[0]);
                }

                // we start with timestamp t and stay in UTC, therefore moment.utc(t)
                // now we set the timezone offset while keeping the same time (true)
                // finally we switch into local time without keeping the time (false).
                // we could just say moment(t) but this case ignores users who change timezone. yep, edge-case.
                var value = moment.utc(test.datevalue[0]).utcOffset(test.zone, true).local(false).valueOf();
                attr[test.comparison === 'ge' ? 'dateFrom' : 'dateUntil'] = value;
            }
        },

        getDefaultRange: getDefaultRange,

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

            cmd.addresses = _.uniq(cmd.addresses);

            // time
            var testForTimeframe = { id: 'allof', tests: [] };

            function utcOffset(t) {
                return moment(t).format('Z').replace(':', '');
            }

            // date range
            [['dateFrom', 'ge'], ['dateUntil', 'le']].forEach(function (test) {
                var value = attr[test[0]], cmp = test[1];
                if (!value) return;
                testForTimeframe.tests.push({
                    id: 'currentdate',
                    comparison: cmp,
                    datepart: 'date',
                    // server expects UTC timestamp
                    datevalue: [value + moment(value).utcOffset() * 60 * 1000],
                    // zone readds offset
                    zone: utcOffset(value)
                });
            });

            if (testForTimeframe.tests.length === 1 && attr.activateTimeFrame) {
                testForTimeframe = testForTimeframe.tests[0];
            } else if (testForTimeframe.tests.length === 0 || attr.activateTimeFrame === false) {
                testForTimeframe = { id: 'true' };
            }

            // get final json
            var json = {
                active: attr.active,
                actioncmds: [cmd],
                test: testForTimeframe,
                flags: ['vacation'],
                rulename: gt('vacation notice')
            };

            // position
            if (attr.position !== undefined) json.position = attr.position;

            if (attr.id !== undefined) json.id = attr.id;

            return json;
        },

        sync: function (method, module, options) {
            switch (method) {
                case 'create':
                    return api.create(this.toJSON())
                    .done(this.onUpdate.bind(this))
                    .done(options.success).fail(options.error);
                case 'read':
                    return api.getRules('vacation')
                        .done(options.success).fail(options.error);
                case 'update':
                    return api.update(this.toJSON())
                        .done(this.onUpdate.bind(this))
                        .done(options.success).fail(options.error);
                // no default
            }
        },

        // add missing promise support
        save: function () {
            var promise = Backbone.Model.prototype.save.apply(this, arguments);
            return !promise ? $.Deferred().reject(this.validationError) : promise;
        },

        onUpdate: function () {
            // an easy way to propagate changes
            // otherwise we need to sync data across models or introduce a singleton-model-approach
            ox.trigger('mail:change:vacation-notice', this);
        },

        isActive: function () {
            if (!this.get('active')) return false;
            if (!this.get('activateTimeFrame')) return true;
            var now = +moment();
            // FROM and UNTIL
            if (this.has('dateFrom') && this.has('dateUntil')) {
                return this.get('dateFrom') <= now && (this.get('dateUntil') + DAY) > now;
            }
            // just FROM
            if (this.has('dateFrom')) return this.get('dateFrom') <= now;
            // just UNTIL
            return (this.get('dateUntil') + DAY) > now;
        },

        isPast: function () {
            return this.has('dateUntil') && (this.get('dateUntil') + DAY) < +moment();
        },

        isReverse: function () {
            return this.has('dateFrom') && this.has('dateUntil') && this.get('dateFrom') > this.get('dateUntil');
        },

        getDuration: function () {
            var from = this.get('dateFrom'), until = this.get('dateUntil');
            return Math.floor(moment.duration(moment(until + DAY).diff(from)).asDays());
        },

        validate: function () {
            // false means "good"
            if (!this.get('active')) return false;
            if (!this.get('activateTimeFrame')) return false;
            if (this.isReverse()) return { dateUntil: gt('The end date must be after the start date.') };
            if (this.isPast()) return { dateUntil: gt('The time frame is in the past.') };
            return false;
        }
    });

    function parseAddress(address) {
        var match = address.match(/^(.+)\s<(.+)>$/);
        return match ? match.slice(1, 3) : address;
    }

    return VacationNoticeModel;
});
