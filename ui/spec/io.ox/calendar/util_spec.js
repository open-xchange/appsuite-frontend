/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */
define(['io.ox/calendar/util', 'io.ox/core/date'], function (util, date) {

    describe('Util for calendar', function () {

        describe('can convert timestamp to smart dates', function () {

            var testDate = new date.Local(),
                data = {
                    full_time: false,
                    start_date: testDate.setHours(0, 0, 0, 0).getTime()
                };

            it('last week', function () {
                data.start_date = testDate.add(-7 * date.DAY).getTime();
                expect(util.getSmartDate(data, true)).toEqual('Letzte Woche');
            });

            it('yesterday', function () {
                data.start_date = testDate.add(6 * date.DAY).getTime();
                expect(util.getSmartDate(data, true)).toEqual('Gestern');
            });

            it('same day', function () {
                data.start_date = testDate.add(date.DAY).getTime();
                expect(util.getSmartDate(data, false)).toEqual('Heute');
            });

            it('tomorrow', function () {
                data.start_date = testDate.add(date.DAY).getTime();
                expect(util.getSmartDate(data, false)).toEqual('Morgen');
            });

            it('next week', function () {
                data.start_date = testDate.add(6 * date.DAY).getTime();
                expect(util.getSmartDate(data, false)).toEqual('Nächste Woche');
            });

            it('next week with showdate option', function () {
                data.start_date = testDate.getTime();
                expect(util.getSmartDate(data, true)).toEqual(testDate.format(date.DATE));
            });

            it('after next week', function () {
                data.start_date = testDate.add(7 * date.DAY).getTime();
                expect(util.getSmartDate(data, false)).toEqual(date.locale.months[testDate.getMonth()] + ' ' + testDate.getYear());
            });

            it('date in the past', function () {
                data.start_date = testDate.setYear(2012, 10, 11).getTime();
                expect(util.getSmartDate(data, false)).toEqual('November 2012');
            });

            it('date in the past with showdate option', function () {
                expect(util.getSmartDate(data, true)).toEqual('11.11.2012');
            });

        });

        describe('can convert timestamp to even smarter dates', function () {

            var testDate = new date.Local(),
                data = {
                    full_time: false,
                    start_date: testDate.setHours(0, 0, 0, 0).getTime()
                };

            it('yesterday', function () {
                data.start_date = testDate.add(-date.DAY).getTime();
                expect(util.getEvenSmarterDate(data)).toEqual('Gestern, ' + testDate.format(date.DATE));
            });

            it('same day', function () {
                data.start_date = testDate.add(date.DAY).getTime();
                expect(util.getEvenSmarterDate(data)).toEqual('Heute, ' + testDate.format(date.DATE));
            });

            it('tomorrow', function () {
                data.start_date = testDate.add(date.DAY).getTime();
                expect(util.getEvenSmarterDate(data)).toEqual('Morgen, ' + testDate.format(date.DATE));
            });

            it('date in the past', function () {
                data.start_date = testDate.setYear(2012, 10, 11).getTime();
                expect(util.getEvenSmarterDate(data)).toEqual('So., 11.11.2012');
            });

        });

        describe('can convert two dates to a date interval string', function () {

            it('no given dates', function () {
                expect(util.getDateInterval()).toEqual('');
            });

            it('same day', function () {
                var start = new date.Local(2012, 10, 11).getTime();
                expect(util.getDateInterval({ start_date: start, end_date: start })).toEqual('So., 11.11.2012');
            });

            it('same day', function () {
                var start = new date.Local(2012, 10, 11).getTime();
                expect(util.getDateInterval({ start_date: start, end_date: start + date.WEEK})).toEqual('So., 11.11.2012 – So., 18.11.2012');
            });

        });

        describe('can convert two time values to an interval string', function () {

            it('no given dates', function () {
                expect(util.getTimeInterval()).toEqual('');
            });

            it('same time', function () {
                var start = new date.Local(2012, 10, 11, 11, 11, 0).getTime();
                expect(util.getTimeInterval({ start_date: start, end_date: start })).toEqual('11:11-11:11');
            });

            it('same day', function () {
                var start = new date.Local(2012, 10, 11, 11, 11, 0).getTime();
                expect(util.getTimeInterval({ start_date: start, end_date: start + date.HOUR})).toEqual('11:11-12:11');
            });

        });

        describe('build reminder options', function () {

            it('object', function () {
                var result = {
                    '-1' : 'Keine Erinnerung',
                    0 : '0 Minuten',
                    5 : '5 Minuten',
                    10 : '10 Minuten',
                    15 : '15 Minuten',
                    30 : '30 Minuten',
                    45 : '45 Minuten',
                    60 : '1 Stunde',
                    120 : '2 Stunden',
                    240 : '4 Stunden',
                    360 : '6 Stunden',
                    480 : '8 Stunden',
                    720 : '12 Stunden',
                    1440 : '1 Tag',
                    2880 : '2 Tage',
                    4320 : '3 Tage',
                    5760 : '4 Tage',
                    7200 : '5 Tage',
                    8640 : '6 Tage',
                    10080 : '1 Woche',
                    20160 : '2 Wochen',
                    30240 : '3 Wochen',
                    40320 : '4 Wochen'
                };
                expect(util.getReminderOptions()).toEqual(result);
            });

        });

        describe('should translate recurrence strings', function () {

            var data = {
                day_in_month: 13,
                days: 1,
                interval: 1,
                month: 1,
                recurrence_type: 1
            };

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

        describe('can resolve group ids to user arrays', function () {
            var userList = {
                'timestamp': 1385422043857,
                'data': [
                    [1, 6, 'Max Muster1', 'Max', 'Muster1', 'Founder', 1, 'maxmuster1@open-xchange.com', null, 0],
                    [2, 6, 'Max Muster2', 'Max', 'Muster1', '', 2, 'maxmuster2@open-xchange.com', null, 1],
                    [3, 6, 'Max Muster3', 'Max', 'Muster1', null, 3, 'maxmuster3@open-xchange.com', null, 2],
                    [4, 6, 'Max Muster4', 'Max', 'Muster1', 'CEO', 4, 'maxmuster4@open-xchange.com', null, 3]
                ]
            };

            beforeEach(function () {
                this.server.respondWith('PUT', /api\/user\?action=list/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(userList));
                });
                this.server.respondWith('GET', /api\/group\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                        '{"timestamp":1383694139525,"data":{"id":1337,"display_name":"dream-team","members":[1,2,3],"last_modified_utc":1383694139525,"name":"dream-team"}}'
                    );
                });
            });

            it('for test group', function () {
                this.expect(util.resolveGroupMembers([1337], [4])).toResolveWith(function (result) {
                    var expectedResult = [{
                        'id': 1,
                        'folder_id': 6,
                        'display_name': 'Max Muster1',
                        'first_name': 'Max',
                        'last_name': 'Muster1',
                        'title': 'Founder',
                        'internal_userid': 1,
                        'email1': 'maxmuster1@open-xchange.com',
                        'image1_url': null,
                        'contact_id': 0,
                        'mail': 'maxmuster1@open-xchange.com',
                        'mail_field': 1
                    }, {
                        'id': 2,
                        'folder_id': 6,
                        'display_name': 'Max Muster2',
                        'first_name': 'Max',
                        'last_name': 'Muster1',
                        'title': '',
                        'internal_userid': 2,
                        'email1': 'maxmuster2@open-xchange.com',
                        'image1_url': null,
                        'contact_id': 1,
                        'mail': 'maxmuster2@open-xchange.com',
                        'mail_field': 1
                    }, {
                        'id': 3,
                        'folder_id': 6,
                        'display_name': 'Max Muster3',
                        'first_name': 'Max',
                        'last_name': 'Muster1',
                        'title': null,
                        'internal_userid': 3,
                        'email1': 'maxmuster3@open-xchange.com',
                        'image1_url': null,
                        'contact_id': 2,
                        'mail': 'maxmuster3@open-xchange.com',
                        'mail_field': 1
                    }, {
                        'id': 4,
                        'folder_id': 6,
                        'display_name': 'Max Muster4',
                        'first_name': 'Max',
                        'last_name': 'Muster1',
                        'title': 'CEO',
                        'internal_userid': 4,
                        'email1': 'maxmuster4@open-xchange.com',
                        'image1_url': null,
                        'contact_id': 3,
                        'mail': 'maxmuster4@open-xchange.com',
                        'mail_field': 1
                    }];
                    expect(result).toEqual(expectedResult);
                    return true;
                });
            });

        });

    });

});
