/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */
define(['io.ox/calendar/util'], function (util) {

    describe('Recurrence strings', function () {

        var data = {
            day_in_month: 13,
            days: 1,
            interval: 1,
            month: 1,
            recurrence_type: 1
        }, oldLang = ox.language;

        it('Only works for en_US', function () {
            expect(ox.language).toEqual('de_DE');
        });

        // Daily
        it('Every day', function () {
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Jeden Tag');
        });

        it('Every 10 days', function () {
            data.interval = 10;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Alle 10 Tage');
        });

        // Weekly
        it('Weekly on Monday', function () {
            data.days = util.days.MONDAY;
            data.interval = 1;
            data.recurrence_type = 2;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Wöchentlich am Montag');
        });

        it('Weekly on Monday and Tuesday', function () {
            data.days = util.days.MONDAY | util.days.TUESDAY;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Wöchentlich am Montag und Dienstag');
        });

        it('Weekly on Monday, Tuesday, Wednesday', function () {
            data.days = util.days.MONDAY | util.days.TUESDAY | util.days.WEDNESDAY;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Wöchentlich am Montag, Dienstag, Mittwoch');
        });

        it('On work days', function () {
            data.days = 2 + 4 + 8 + 16 + 32;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('An Arbeitstagen');
        });

        it('Weekly on all days -> Every day', function () {
            data.interval = 1;
            data.days = 127;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Jeden Tag');
        });

        // Weekly - interval > 1
        it('Every 2 weeks on Monday', function () {
            data.days = util.days.MONDAY;
            data.interval = 2;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Alle 2 Wochen am Montag');
        });

        it('Every 2 weeks on Monday, Tuesday, Wednesday', function () {
            data.days = util.days.MONDAY | util.days.TUESDAY | util.days.WEDNESDAY;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Alle 2 Wochen am Montag, Dienstag, Mittwoch');
        });

        it('Every 2 weeks on work days', function () {
            data.days = 2 + 4 + 8 + 16 + 32;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Alle 2 Wochen an Arbeitstagen');
        });

        it('Every 2 weeks on all days', function () {
            data.days = 127;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Alle 2 Wochen an allen Tagen');
        });

        // Monthly
        it('Monthly on day 11', function () {
            data.day_in_month = 11;
            data.days = null;
            data.interval = 1;
            data.recurrence_type = 3;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Jeden 11. Tag im Monat');
        });

        it('Every 2 months on day 11', function () {
            data.interval = 2;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Alle 2 Monate am 11. Tag');
        });

        // Monthly - specific days
        it('Monthly on the first Friday', function () {
            data.day_in_month = 1;
            data.days = util.days.FRIDAY;
            data.interval = 1;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Am ersten Freitag jeden Monats');
        });

        it('Monthly on the last Sunday', function () {
            data.day_in_month = -1;
            data.days = util.days.SUNDAY;
            data.interval = 1;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Am letzten Sonntag jeden Monats');
        });

        // Monthly - specific days - interval > 1
        it('Every 3 months on the first Friday', function () {
            data.day_in_month = 1;
            data.days = util.days.FRIDAY;
            data.interval = 3;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Alle 3 Monate am ersten Freitag');
        });

        it('Every 3 months on the last Sunday', function () {
            data.days = util.days.SUNDAY;
            data.day_in_month = -1;
            data.interval = 3;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Alle 3 Monate am letzten Sonntag');
        });

        // Yearly
        it('Yearly on January 29', function () {
            data.day_in_month = 29;
            data.days = null;
            data.interval = 1;
            data.month = 0;
            data.recurrence_type = 4;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Jährlich am 29. Januar');
        });

        it('Every 2 years on January 29', function () {
            data.interval = 2;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Alle 2 Jahre am 29. Januar');
        });

        // Yearly - specific days
        it('Yearly on the first Friday of July', function () {
            data.day_in_month = 1;
            data.days = util.days.FRIDAY;
            data.interval = 1;
            data.month = 6;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Jährlich am ersten Freitag im Juli');
        });

        it('Every 2 years on the first Friday of July', function () {
            data.day_in_month = 1;
            data.days = util.days.FRIDAY;
            data.interval = 2;
            data.month = 6;
            var str = util.getRecurrenceString(data);
            expect(str).toEqual('Alle 2 Jahre am ersten Freitag im Juli');
        });
    });
});
