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

         beforeEach(function () {
             this.server = sinon.fakeServer.create();
             this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                 xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"}, '{"data":{}}');
             });
         });
         afterEach(function () {
             this.server.restore();
         });

        it('should return available filters', function () {
            var result = api.getRules();
            expect(result).toBeDeferred();
            expect(result.state()).toBe('pending');
            this.server.respond();
            expect(result.state()).toBe('resolved');
        });

    });
});
