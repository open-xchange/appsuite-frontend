/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/settings/accounts/email/test",
    ["io.ox/core/extensions", "io.ox/core/api/account"], function (ext, api) {

    "use strict";


    // test objects


    var TIMEOUT = 5000;


    /*
     * Suite: Contacts Test
     */
    ext.point('test/suite').extend({
        id: 'email-account-create',
        index: 100,
        test: function (j) {
            j.describe("Creates a new Emailaccount", function () {

                j.it('sends a GET request', function () {

                });

            });
        }
    });
});