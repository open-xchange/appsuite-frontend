/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012 Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define("io.ox/core/test/mailfilter",
    ["io.ox/core/extensions", "io.ox/mail/mailfilter/api"], function (ext, api) {

    'use strict';

    /*
     * Suite: Model Test
     */
    ext.point('test/suite').extend({
        id: 'core-api-mailfilter',
        index: 100,
        test: function (j) {
            j.describe('Simple api tests', function () {

                j.it('triggers a getRules call without filter', function () {
                    api.getRules().done(function (response) {
                        j.expect(response).toBe(true);
                    });
                });

                j.it('triggers a getRules call with unsupported filter', function () {
                    var data;
                    api.getRules('aaaaaaaa').done(function (response) {
                        data = response;
                    });
                    j.expect(_.isEmpty(data)).toBe(true);
                });


            });
        }
    });
});
