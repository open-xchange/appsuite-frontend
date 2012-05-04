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


    var TIMEOUT = 5000,

        TESTACCOUNT = {
            "name": "Ein Account",
            "primary_address": "christoph-kopp@gmx.net",
            "personal": "Christoph Kopp",
            "unified_inbox_enabled": false,
            "mail_protocol": "pop3",
            "mail_secure": true,
            "mail_server": "pop.gmx.net",
            "mail_port": 995,
            "login": "christoph-kopp@gmx.net",
            "password": " ",
            "pop3_refresh_rate": "3",
            "pop3_expunge_on_quit": true,
            "transport_secure": true,
            "transport_server": "mail.gmx.net",
            "transport_port": 465,
            "transport_login": "christoph-kopp@gmx.net",
            "transport_password": " ",
            "transport_protocol": "smtp",
            "pop3_storage": "mailaccount",
            "spam_handler": "NoSpamHandler"
        };



    /*
     * Suite: Contacts Test
     */
    ext.point('test/suite').extend({
        id: 'email-account-create',
        index: 100,
        test: function (j) {
            j.describe("Creates a new Emailaccount", function () {

                var dataId;

                j.it('sends a GET request and creates a account', function () {
                    api.create(TESTACCOUNT);
//                    api.all();
                });

                j.it('gets the id of the created account', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.on('account_created', function (e, data) {
                            if (data) {
                                dataId = data.id;
                                me.ready = true;
                            }
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'catches the id', TIMEOUT);

                    });


                });

                j.it('deletes the created account', function () {
//                    api.remove([dataId]);
                });

            });
        }
    });
});