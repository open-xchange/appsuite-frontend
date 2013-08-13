/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/test', ['io.ox/core/extensions', 'io.ox/calendar/util'], function (ext, util) {

    'use strict';

    /*
     * Suite: Recurrence strings
     */

    ext.point('test/suite').extend({
        id: 'recurrence-strings',
        index: 100,
        test: function (j) {

            j.describe('Recurrence strings', function () {

                var data = {
                    day_in_month: 13,
                    days: 1,
                    interval: 1,
                    month: 1,
                    recurrence_type: 1
                };

                j.it('Only works for en_US', function () {
                    j.expect(ox.language).toEqual('en_US');
                });

                // Daily

                j.it('Every day', function () {
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every day');
                });

                j.it('Every 10 days', function () {
                    data.interval = 10;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every 10 days');
                });

                // Weekly

                j.it('Weekly on Monday', function () {
                    data.days = util.days.MONDAY;
                    data.interval = 1;
                    data.recurrence_type = 2;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Weekly on Monday');
                });

                j.it('Weekly on Monday and Tuesday', function () {
                    data.days = util.days.MONDAY | util.days.TUESDAY;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Weekly on Monday and Tuesday');
                });

                j.it('Weekly on Monday, Tuesday, Wednesday', function () {
                    data.days = util.days.MONDAY | util.days.TUESDAY | util.days.WEDNESDAY;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Weekly on Monday, Tuesday, Wednesday');
                });

                j.it('Weekly on weekdays', function () {
                    data.days = 2 + 4 + 8 + 16 + 32;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Weekly on weekdays');
                });

                j.it('Weekly on all days -> Every day', function () {
                    data.interval = 1;
                    data.days = 127;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every day');
                });

                // Weekly - interval > 1

                j.it('Every 2 weeks on Monday', function () {
                    data.days = util.days.MONDAY;
                    data.interval = 2;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every 2 weeks on Monday');
                });

                j.it('Every 2 weeks on Monday, Tuesday, Wednesday', function () {
                    data.days = util.days.MONDAY | util.days.TUESDAY | util.days.WEDNESDAY;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every 2 weeks on Monday, Tuesday, Wednesday');
                });

                j.it('Every 2 weeks on weekdays', function () {
                    data.days = 2 + 4 + 8 + 16 + 32;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every 2 weeks on weekdays');
                });

                j.it('Every 2 weeks on all days', function () {
                    data.days = 127;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every 2 weeks on all days');
                });

                // Monthly

                j.it('Monthly on day 11', function () {
                    data.day_in_month = 11;
                    data.days = null;
                    data.interval = 1;
                    data.recurrence_type = 3;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Monthly on day 11');
                });

                j.it('Every 2 months on day 11', function () {
                    data.interval = 2;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every 2 months on day 11');
                });

                // Monthly - specific days

                j.it('Monthly on the first Friday', function () {
                    data.day_in_month = 1;
                    data.days = util.days.FRIDAY;
                    data.interval = 1;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Monthly on the first Friday');
                });

                j.it('Monthly on the last Sunday', function () {
                    data.day_in_month = -1;
                    data.days = util.days.SUNDAY;
                    data.interval = 1;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Monthly on the last Sunday');
                });

                // Monthly - specific days - interval > 1

                j.it('Every 3 months on the first Friday', function () {
                    data.day_in_month = 1;
                    data.days = util.days.FRIDAY;
                    data.interval = 3;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every 3 months on the first Friday');
                });

                j.it('Every 3 months on the last Sunday', function () {
                    data.days = util.days.SUNDAY;
                    data.day_in_month = -1;
                    data.interval = 3;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every 3 months on the last Sunday');
                });

                // Yearly

                j.it('Yearly on January 29', function () {
                    data.day_in_month = 29;
                    data.days = null;
                    data.interval = 1;
                    data.month = 0;
                    data.recurrence_type = 4;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Yearly on January 29');
                });

                j.it('Every 2 years on January 29', function () {
                    data.interval = 2;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every 2 years on January 29');
                });

                // Yearly - specific days

                j.it('Yearly on the first Friday of July', function () {
                    data.day_in_month = 1;
                    data.days = util.days.FRIDAY;
                    data.interval = 1;
                    data.month = 6;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Yearly on the first Friday of July');
                });

                j.it('Every 2 years on the first Friday of July', function () {
                    data.day_in_month = 1;
                    data.days = util.days.FRIDAY;
                    data.interval = 2;
                    data.month = 6;
                    var str = util.getRecurrenceString(data);
                    j.expect(str).toEqual('Every 2 years on the first Friday of July');
                });
            });
        }
    });
});
