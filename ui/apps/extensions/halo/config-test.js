/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 */

define("extensions/halo/config-test", function () {
    console.log("load test");
    return function (jasmine) {
        var describe = jasmine.describe;
        var it = jasmine.it;
        var expect = jasmine.expect;
       
        describe("something", function () {
            it("does something", function () {
                expect(1 + 1).toEqual(2);
            });
            it("fails", function () {
                expect(1 + 1).toEqual(2);
                expect(1 + 1).toEqual(3);
            });
        });
    };
});