/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

/* jshint ignore:start */

define(['io.ox/core/date', 'io.ox/core/extensions'],
function (date, ext) {

    'use strict';

    describe('Date', function () {
        beforeEach(function (done) {
            date.getTimeZone('Europe/Berlin').then(function (tz) {
                this.D = tz;
                done();
            });

        });

        it('initializes', function () {
            expect(D).to.exist;
        });
        describe('TTInfo from UTC', function () {
            function change(toDST) {
                var args = Array.prototype.slice.call(arguments, 1);
                args[1]--;
                var t = Date.UTC.apply(Date, args);
                expect(Boolean(D.getTTInfo(t - 1).isdst)).not.to.equal(toDST);
                expect(Boolean(D.getTTInfo(t).isdst)).to.equal(toDST);
            }
            it('before first DST is STD', function () {
                expect(D.getTTInfo(Date.UTC(1800, 5)).isdst).not.to.be.ok;
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
                expect(Boolean(D.getTTInfoLocal(t - 1).isdst)).not.to.equal(toDST);
                expect(Boolean(D.getTTInfoLocal(t).isdst)).to.equal(toDST);
            }
            it('before first DST is STD', function () {
                expect(D.getTTInfoLocal(Date.UTC(1800, 5)).isdst)
                .not.to.be.ok;
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
                .to.deep.equal(new D(2012, 2, 26, 1));
            });
            it('adds local time', function () {
                expect(new D(2012, 2, 25).add(date.DAY))
                .to.deep.equal(new D(2012, 2, 26));
            });
            it('adds months', function () {
                expect(new D(2012, 2, 1).addMonths(1))
                .to.deep.equal(new D(2012, 3, 1));
            });
            it('adds years', function () {
                expect(new D(2012, 2, 1).addYears(1))
                .to.deep.equal(new D(2013, 2, 1));
            });
            it('rounds weeks', function () {
                expect(new D(2012, 2, 25, 12, 34).setStartOfWeek())
                .to.deep.equal(new D(2012, 2, 19));
            });
        });
        describe('should parse', function () {
            beforeEach(function () {
                var m = /(.*) as (.*)$/.exec(this.currentTest.title);
                if (m[1] && m[2]) {
                    this.parsedDate = D.parse(m[1], m[2]).getTime();
                }
            });

            it('2012-01-01 as yyyy-MM-dd', function () {
                expect(this.parsedDate).to.equal(D.utc(Date.UTC(2012, 0, 1)));
            });

            it('29.2.2012 as dd.MM.yyyy', function () {
                expect(this.parsedDate).to.equal(D.utc(Date.UTC(2012, 1, 29)));
            });

            it('20120101T123456 as yyyyMMdd\'T\'HHmmss', function () {
                expect(this.parsedDate).to.equal(D.utc(Date.UTC(2012, 0, 1, 12, 34, 56)));
            });

            it('12 vorm. as h a', function () {
                expect(this.parsedDate).to.equal(D.utc(Date.UTC(1970, 0, 1, 0)));
            });

            it('12 nachm. as h a', function () {
                expect(this.parsedDate).to.equal(D.utc(Date.UTC(1970, 0, 1, 12)));
            });

            describe('dates with 2-digit years like', function () {
                it('13.08.13 as dd.MM.yyyy', function () {
                    var parsedDate = new D(this.parsedDate).format('yyyyMMdd');

                    expect(parsedDate).to.equal('20130813');
                });

                describe('from a birthday', function () {
                    it('9.8.0000 as d.M.yyyy', function () {
                        var parsedDate = new D(this.parsedDate).format('yyyyMMdd');

                        expect(parsedDate).to.equal('00010809');
                    });
                });
            });
        });
        describe('Formatting', function () {
            it('v in standard time', function () {
                expect(new D(2012, 0, 1).format('v')).to.equal('CET');
            });
            it('v in DST', function () {
                expect(new D(2012, 5, 1).format('v')).to.equal('CEST');
            });
        });
        describe('Localized formatting', function () {
            beforeEach(function () {
                this.d = new D(2012, 4, 16, 12, 34);
            });
            _.each([
                ['day of week',              date.DAYOFWEEK,             'Mi.'],
                ['date',                     date.DATE,                  '16.5.2012'],
                ['time',                     date.TIME,                  '12:34'],
                ['timezone',                 date.TIMEZONE,              'CEST'],
                ['day of week and date',     date.DAYOFWEEK_DATE,        'Mi., 16.5.2012'],
                ['date and time',            date.DATE_TIME,             '16.5.2012 12:34'],
                ['time and timezone',        date.TIME_TIMEZONE,         '12:34 CEST'],
                ['everything',               date.FULL_DATE,             'Mi., 16.5.2012 12:34 CEST'],
                ['timezone implies time',    date.DATE + date.TIMEZONE,  '16.5.2012 12:34 CEST'],
                ['day of week implies date', date.DAYOFWEEK + date.TIME, 'Mi., 16.5.2012 12:34'],
                ['date without year',        date.DATE_NOYEAR,           '16.5.']
            ], function (item) {
                it(item[0], function () {
                    expect(this.d.format(item[1])).to.equal(item[2]);
                });
            });
        });
        describe('Intervals', function () {
            beforeEach(function () {
                this.d = new D(2012, 4, 16, 12, 34);
            });

            it('Timezone with same date', function () {
                var result = this.d.formatInterval(new D(2012, 4, 16, 12, 56), date.TIMEZONE);
                expect(result).to.equal('CEST');
            });

            it('Time with same date', function () {
                var result = this.d.formatInterval(new D(2012, 4, 16, 12, 56), date.TIME);
                expect(result).to.equal('12:34-12:56');
            });

            it('Time with different dates', function () {
                var result = this.d.formatInterval(new D(2012, 5, 16, 12, 34), date.TIME);
                expect(result).to.equal('16.5.2012 12:34 - 16.6.2012 12:34');
            });

            it('Date with same date', function () {
                var result = this.d.formatInterval(new D(2012, 4, 16, 12, 34), date.DATE);
                expect(result).to.equal('16.5.2012');
            });

            it('Date with different days', function () {
                var result = this.d.formatInterval(new D(2012, 4, 17, 12, 34), date.DATE);
                expect(result).to.equal('16.-17. Mai 2012');
            });

            it('Date with different months', function () {
                var result = this.d.formatInterval(new D(2012, 5, 16, 12, 34), date.DATE);
                expect(result).to.equal('16. Mai - 16. Juni 2012');
            });

            it('Date with different years', function () {
                var result = this.d.formatInterval(new D(2013, 4, 16, 12, 34), date.DATE);
                expect(result).to.equal('16. Mai 2012 - 16. Mai 2013');
            });

            it('Time with different timezones', function () {
                var start = new D(Date.UTC(2012, 9, 28, 0, 30));
                var end = new D(Date.UTC(2012, 9, 28, 1, 30));
                expect(start.formatInterval(end, date.TIME_TIMEZONE))
                .to.equal('02:30 CEST - 02:30 CET');
            });
        });
        describe('constructor', function () {
            it('from a full date', function () {
                expect(new D(2013, 7, 9).format('yyyyMMdd')).to.equal('20130809');
            });
            it('should interpret 2-digit years as 19xx', function () {
                //this is, because the date class internally does this
                //if you want to use our specification of how to treat these numbers,
                //use date.parse method
                expect(new D(13, 7, 9).format('yyyyMMdd')).to.equal('19130809');
            });
        });
    });
});
/* jshint ignore:end */
