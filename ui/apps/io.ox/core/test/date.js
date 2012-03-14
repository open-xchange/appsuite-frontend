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

define.async("io.ox/core/test/date", ["io.ox/core/date", "io.ox/core/extensions"],
function (date, ext) {
    
    "use strict";
    
    var zones = ["Europe/Berlin"];
    
    function test(jasmine) {
        var describe = jasmine.describe, it = jasmine.it,
            expect = jasmine.expect;
        
        describe("Date", function () {
            var D = zones["Europe/Berlin"];
            it("initializes", function () {
                expect(D).toBeTruthy();
            });
            describe("TTInfo from UTC", function () {
                function change(toDST) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    args[1]--;
                    var t = Date.UTC.apply(Date, args);
                    expect(Boolean(D.getTTInfo(t - 1).isdst)).toBe(!toDST);
                    expect(Boolean(D.getTTInfo(t).isdst)).toBe(toDST);
                }
                it("before first DST is STD", function () {
                    expect(D.getTTInfo(Date.UTC(1800, 5)).isdst).toBeFalsy();
                });
                it("2011-03-27 01:00 UTC changes to DST", function () {
                    change(true, 2011, 3, 27, 1);
                });
                it("2011-10-30 01:00 UTC changes to STD", function () {
                    change(false, 2011, 10, 30, 1);
                });
                it("2100-03-28 01:00 UTC changes to DST", function () {
                    change(true, 2100, 3, 28, 1);
                });
                it("2100-10-31 01:00 UTC changes to STD", function () {
                    change(false, 2100, 10, 31, 1);
                });
            });
            describe("TTInfo from local time", function () {
                function change(toDST) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    args[1]--;
                    var t = Date.UTC.apply(Date, args);
                    expect(Boolean(D.getTTInfoLocal(t - 1).isdst)).toBe(!toDST);
                    expect(Boolean(D.getTTInfoLocal(t).isdst)).toBe(toDST);
                }
                it("before first DST is STD", function () {
                    expect(D.getTTInfoLocal(Date.UTC(1800, 5)).isdst)
                        .toBeFalsy();
                });
                it("2011-03-27 02:00 CET changes to DST", function () {
                    change(true, 2011, 3, 27, 2);
                });
                it("2011-10-30 03:00 CEST changes to STD", function () {
                    change(false, 2011, 10, 30, 3);
                });
                it("2100-03-28 02:00 CET changes to DST", function () {
                    change(true, 2100, 3, 28, 2);
                });
                it("2100-10-31 03:00 CEST changes to STD", function () {
                    change(false, 2100, 10, 31, 3);
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
            ext.point('test/suite').extend({ id: "date", test: test });
        });
});