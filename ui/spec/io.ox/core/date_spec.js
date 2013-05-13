/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define(['io.ox/core/date', 'io.ox/core/extensions'],
function (date, ext) {

    'use strict';

    describe('Date', function () {
        beforeEach(function () {
            var data = date.getTimeZone('Europe/Berlin').then(function (tz) {
                this.D = tz;
                return tz;
            });

            waitsFor(function () {
                return data.state() === 'resolved';
            }, 'Could not load timezone', 1000);
        });

        it('initializes', function () {
            expect(D).toBeDefined();
        });
        describe('TTInfo from UTC', function () {
            function change(toDST) {
                var args = Array.prototype.slice.call(arguments, 1);
                args[1]--;
                var t = Date.UTC.apply(Date, args);
                expect(Boolean(D.getTTInfo(t - 1).isdst)).toBe(!toDST);
                expect(Boolean(D.getTTInfo(t).isdst)).toBe(toDST);
            }
            it('before first DST is STD', function () {
                expect(D.getTTInfo(Date.UTC(1800, 5)).isdst).toBeFalsy();
            });
            it('2011-03-27 01:00 UTC changes to DST', function () {
                change(true, 2011, 3, 27, 1);
            });
            it('2011-10-30 01:00 UTC changes to STD', function () {
                change(false, 2011, 10, 30, 1);
            });
            // does not work on mac; checks finalTTInfo in date.js
            // it('2100-03-28 01:00 UTC changes to DST', function () {
            //     change(true, 2100, 3, 28, 1);
            // });
            // it('2100-10-31 01:00 UTC changes to STD', function () {
            //     change(false, 2100, 10, 31, 1);
            // });
        });
        describe('TTInfo from local time', function () {
            function change(toDST) {
                var args = Array.prototype.slice.call(arguments, 1);
                args[1]--;
                var t = Date.UTC.apply(Date, args);
                expect(Boolean(D.getTTInfoLocal(t - 1).isdst)).toBe(!toDST);
                expect(Boolean(D.getTTInfoLocal(t).isdst)).toBe(toDST);
            }
            it('before first DST is STD', function () {
                expect(D.getTTInfoLocal(Date.UTC(1800, 5)).isdst)
                .toBeFalsy();
            });
            it('2011-03-27 02:00 CET changes to DST', function () {
                change(true, 2011, 3, 27, 2);
            });
            it('2011-10-30 03:00 CEST changes to STD', function () {
                change(false, 2011, 10, 30, 3);
            });
            // does not work on mac (see above)
            // it('2100-03-28 02:00 CET changes to DST', function () {
            //     change(true, 2100, 3, 28, 2);
            // });
            // it('2100-10-31 03:00 CEST changes to STD', function () {
            //     change(false, 2100, 10, 31, 3);
            // });
        });
        describe('Date arithmetic', function () {
            it('adds UTC time', function () {
                expect(new D(2012, 2, 25).addUTC(date.DAY))
                .toEqual(new D(2012, 2, 26, 1));
            });
            it('adds local time', function () {
                expect(new D(2012, 2, 25).add(date.DAY))
                .toEqual(new D(2012, 2, 26));
            });
            it('adds months', function () {
                expect(new D(2012, 2, 1).addMonths(1))
                .toEqual(new D(2012, 3, 1));
            });
            it('adds years', function () {
                expect(new D(2012, 2, 1).addYears(1))
                .toEqual(new D(2013, 2, 1));
            });
            it('rounds weeks', function () {
                expect(new D(2012, 2, 25, 12, 34).setStartOfWeek())
                .toEqual(new D(2012, 2, 19));
            });
        });
        describe('should parse', function () {
            beforeEach(function () {
                var m = /should parse (.*) as (.*)\.$/.exec(this.getFullName());
                this.parsedDate = D.parse(m[1], m[2]).getTime();
            });

            it('2012-01-01 as yyyy-MM-dd', function () {
                expect(this.parsedDate).toEqual(D.utc(Date.UTC(2012, 0, 1)));
            });

            it('29.2.2012 as dd.MM.yyyy', function () {
                expect(this.parsedDate).toEqual(D.utc(Date.UTC(2012, 1, 29)));
            });

            it('20120101T123456 as yyyyMMdd\'T\'HHmmss', function () {
                expect(this.parsedDate).toEqual(D.utc(Date.UTC(2012, 0, 1, 12, 34, 56)));
            });

            it('12 vorm. as h a', function () {
                expect(this.parsedDate).toEqual(D.utc(Date.UTC(1970, 0, 1, 0)));
            });

            it('12 nachm. as h a', function () {
                expect(this.parsedDate).toEqual(D.utc(Date.UTC(1970, 0, 1, 12)));
            });
        });
        describe('Formatting', function () {
            it('v in standard time', function () {
                expect(new D(2012, 0, 1).format('v')).toEqual('CET');
            });
            it('v in DST', function () {
                expect(new D(2012, 5, 1).format('v')).toEqual('CEST');
            });
        });
        describe('Localized formatting', function () {
            beforeEach(function () {
                runs(function () {
                    this.d = new D(2012, 4, 16, 12, 34);
                });
            });
            _.each([['day of week',   date.DAYOFWEEK, 'Mi.'      ],
                    ['date',          date.DATE,      '16.5.2012'],
                    ['time',          date.TIME,      '12:34'    ],
                    ['timezone',      date.TIMEZONE,  'CEST'     ],
                    ['day of week and date', date.DAYOFWEEK_DATE,
                                      'Mi., 16.5.2012'           ],
                    ['date and time', date.DATE_TIME,
                                           '16.5.2012 12:34'     ],
                    ['time and timezone', date.TIME_TIMEZONE,
                                                     '12:34 CEST'],
                    ['everything',    date.FULL_DATE,
                                      'Mi., 16.5.2012 12:34 CEST'],
                    ['timezone implies time', date.DATE + date.TIMEZONE,
                                           '16.5.2012 12:34 CEST'],
                    ['day of week implies date', date.DAYOFWEEK + date.TIME,
                                      'Mi., 16.5.2012 12:34']],
                function (item) {
                    it(item[0], function () {
                        expect(this.d.format(item[1])).toEqual(item[2]);
                    });
                });
        });
        describe('Intervals', function () {
            beforeEach(function () {
                this.d = new D(2012, 4, 16, 12, 34);
            });

            it('Timezone with same date', function () {
                var result = this.d.formatInterval(new D(2012, 4, 16, 12, 56), date.TIMEZONE);
                expect(result).toEqual('CEST');
            });

            it('Time with same date', function () {
                var result = this.d.formatInterval(new D(2012, 4, 16, 12, 56), date.TIME);
                expect(result).toEqual('12:34-12:56');
            });

            it('Time with different dates', function () {
                var result = this.d.formatInterval(new D(2012, 5, 16, 12, 34), date.TIME);
                expect(result).toEqual('16.5.2012 12:34 - 16.6.2012 12:34');
            });

            it('Date with same date', function () {
                var result = this.d.formatInterval(new D(2012, 4, 16, 12, 34), date.DATE);
                expect(result).toEqual('16.5.2012');
            });

            it('Date with different days', function () {
                var result = this.d.formatInterval(new D(2012, 4, 17, 12, 34), date.DATE);
                expect(result).toEqual('16.-17. Mai 2012');
            });

            it('Date with different months', function () {
                var result = this.d.formatInterval(new D(2012, 5, 16, 12, 34), date.DATE);
                expect(result).toEqual('16. Mai - 16. Juni 2012');
            });

            it('Date with different years', function () {
                    var result = this.d.formatInterval(new D(2013, 4, 16, 12, 34), date.DATE);
                    expect(result).toEqual('16. Mai 2012 - 16. Mai 2013');
            });

            it('Time with different timezones', function () {
                var start = new D(Date.UTC(2012, 9, 28, 0, 30));
                var end = new D(Date.UTC(2012, 9, 28, 1, 30));
                expect(start.formatInterval(end, date.TIME_TIMEZONE))
                .toEqual('02:30 CEST - 02:30 CET');
            });
        });
    });
});
