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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define(["io.ox/core/api/mailfilter",
        "shared/examples/for/api"], function (api, sharedExamplesFor) {

    'use strict';

     describe('Mailfilter', function () {

//         sharedExamplesFor(api);

        it('triggers a getRules call without filter', function () {
            api.getRules().done(function (response) {
                expect(response).toBe(true);
            });
        });

        it('triggers a getRules call with unsupported filter', function () {
            var data;
            api.getRules('aaaaaaaa').done(function (response) {
                data = response;
            });
            expect(_.isEmpty(data)).toBe(true);
        });
    });
});
