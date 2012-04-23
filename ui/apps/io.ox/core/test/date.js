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
 */

define.async('io.ox/core/test/date',
             ['io.ox/core/date', 'io.ox/core/extensions'],
function (date, ext) {
    
    'use strict';
    
    var zones = ['Europe/Berlin'];
    
    function test(jasmine) {
        var describe = jasmine.describe, it = jasmine.it,
            expect = jasmine.expect;
        
        describe('Date', function () {
            var D = zones['Europe/Berlin'];
            it('initializes', function () {
                expect(D).toBeTruthy();
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
                it('2100-03-28 01:00 UTC changes to DST', function () {
                    change(true, 2100, 3, 28, 1);
                });
                it('2100-10-31 01:00 UTC changes to STD', function () {
                    change(false, 2100, 10, 31, 1);
                });
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
                it('2100-03-28 02:00 CET changes to DST', function () {
                    change(true, 2100, 3, 28, 2);
                });
                it('2100-10-31 03:00 CEST changes to STD', function () {
                    change(false, 2100, 10, 31, 3);
                });
            });
            describe('Constructor', function () {
                it('uses proper month numbers', function () {
                    expect(new D(1970, 1, 1).getTime()).toEqual(-date.HOUR);
                });
            });
            describe('Parsing', function () {
                _.each({
                    '2012-01-01 as yyyy-MM-dd': [2012, 1, 1],
                    '29.2.2012 as dd.MM.yyyy': [2012, 2, 29],
                    '20120101T123456 as yyyyMMdd\'T\'HHmmss':
                        [2012, 1, 1, 12, 34, 56],
                    '12 vorm. as h a': [1970, 1, 1, 0],
                    '12 nachm. as h a': [1970, 1, 1, 12]
                }, function (time, text) {
                    var m = /^(.*) as (.*)$/.exec(text);
                    time[1]--;
                    it(text, function () {
                        expect(D.parse(m[1], m[2]).getTime())
                            .toEqual(Date.UTC.apply(Date, time));
                    });
                });
            });
            describe('Date arithmetic', function () {
                it('adds UTC time', function () {
                    expect(new D(2012, 3, 25).addUTC(date.DAY))
                        .toEqual(new D(2012, 3, 26, 1));
                });
                it('adds local time', function () {
                    expect(new D(2012, 3, 25).add(date.DAY))
                        .toEqual(new D(2012, 3, 26));
                });
                it('adds months', function () {
                    expect(new D(2012, 3, 1).addMonths(1))
                        .toEqual(new D(2012, 4, 1));
                });
                it('adds years', function () {
                    expect(new D(2012, 3, 1).addYears(1))
                        .toEqual(new D(2013, 3, 1));
                });
            });
        });
    }
    
    return $.when.apply($, _.map(zones, date.getTimeZone))
        .pipe(function () {
            var zoneData = {};
            for (var i = 0; i < zones.length; i++) {
                zoneData[zones[i]] = arguments[i];
            }
            zones = zoneData;
            ext.point('test/suite').extend({ id: 'date', test: test });
        });
});