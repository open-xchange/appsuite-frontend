/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define("io.ox/backbone/tests/validations", ["io.ox/core/extensions", "io.ox/backbone/validation"], function (ext, validations) {
    "use strict";

    ext.point("test/suite").extend({
        id: 'backbone-validations',
        index: 100,
        test: function (j, utils) {
            // Note: Most of these are todos
            j.describe("Backbone Validation", function () {
                var formats = validations.formats;

                j.it("should be able to validate strings", function () {
                    j.expect(formats.string("Hello")).toEqual(true);
                });

                j.it("should be able to validate texts", function () {
                    j.expect(formats.text("Hello")).toEqual(true);
                });

                j.it("should be able to validate numbers", function () {
                    j.expect(formats.number("Hello")).not.toEqual(true);
                    j.expect(formats.number("2")).toEqual(true);
                    j.expect(formats.number(2)).toEqual(true);

                });

                j.it("should be able to validate arrays", function () {
                    j.expect(formats.array("Hello")).not.toEqual(true);
                    j.expect(formats.array(["Hello"])).toEqual(true);
                });

                j.it("should be able to validate booleans", function () {
                    j.expect(formats.boolean("Hello")).not.toEqual(true);
                    j.expect(formats.boolean(false)).toEqual(true);
                    j.expect(formats.boolean(true)).toEqual(true);
                });

                j.xit("should be able to validate dates", function () {
                    // FIXME
                });

                j.it("should be able to validate pastDates", function () {
                    j.expect(formats.pastDate(new Date(_.now() + 10000))).not.toEqual(true);
                    j.expect(formats.pastDate(new Date(_.now() - 10000))).toEqual(true);
                });

                j.it("should be able to validate emails", function () {
                    j.expect(formats.email("Hello")).not.toEqual(true);
                    j.expect(formats.email("francisco.laguna@open-xchange.com")).toEqual(true);
                });

                j.xit("should be able to validate urls", function () {
                    // FIXME
                });
            });

        }
    });

});
