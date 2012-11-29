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
    ["io.ox/core/extensions", "io.ox/core/api/account",
     "io.ox/settings/main"], function (ext, api, settings) {

    "use strict";


    // test objects


    var TIMEOUT = 5000,

        TESTACCOUNT = {
            "primary_address": "oxtestermail@googlemail.com",
            "mail_protocol": "imap",
            "mail_port": "993",
            "mail_server": "imap.googlemail.com",
            "transport_protocol": "smtp",
            "transport_port": "465",
            "transport_server": "smtp.googlemail.com",
            "login": "oxtestermail@googlemail.com",
            "name": "Neuer Account",
            "personal": "oxtestermail",
            "unified_inbox_enabled": false,
            "mail_secure": true,
            "password": "supersicher0815",
            "transport_secure": true,
            "pop3_storage": "mailaccount",
            "spam_handler": "NoSpamHandler"
        },

        TESTACCOUNTVALDIDATION = {
            "name": "Neuer Account",
            "primary_address": "oxtestermail@googlemail.com",
            "personal": "oxtestermail",
            "unified_inbox_enabled": false,
            "mail_protocol": "imap",
            "mail_secure": true,
            "mail_server": "imap.googlemail.com",
            "mail_port": "993",
            "login": "oxtestermail@googlemail.com",
            "password": "supersicher0815",
            "transport_secure": true,
            "transport_server": "smtp.googlemail.com",
            "transport_port": "465",
            "transport_credentials": false
        },

        TESTMAILAUTOCONFIG = {
            'email': 'oxtestermail@googlemail.com',
            'password': 'supersicher0815'
        };



     // helpers
    function Done() {
        var f = function () {
            return f.value;
        };
        f.value = false;
        f.yep = function () {
            f.value = true;
        };
        return f;
    }


    /*
     * Suite: Contacts Test
     */
    ext.point('test/suite').extend({
        id: 'email-account-create-api',
        index: 100,
        test: function (j) {
            j.describe("Creates a new Emailaccount via api", function () {

                var dataId, obj;

                j.it('creates a new account', function () {
                    api.create(TESTACCOUNT);
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

                j.it('modifies the account name', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.get(dataId).done(function (data) {
                            obj = data;
                            obj.name = 'Ein Account changed';
                            me.ready = true;
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'update', TIMEOUT);

                    });

                });

//                j.it('updates the account', function () {
//                    var me = this;
//                    me.ready = false;
//                    api.update(obj).done(function (data) {
//                        me.ready = true;
//                        console.log('update');
//                        dataId = data.id;
//                        me.ready = true;
//                    });
//
//
//                    j.waitsFor(function () {
//                        return this.ready;
//                    }, 'update', TIMEOUT);
//
//                });

                j.it('deletes the created account', function () {
//                    console.log('delete');
                    api.remove([dataId]);
                });

            });
        }
    });

    ext.point('test/suite').extend({
        id: 'email-account-create-ui',
        index: 100,
        test: function (j) {
            j.describe("Creates a new Emailaccount via ui", function () {

                var app = null, accountPane, buttonAdd, buttonAddAutoconf, buttonAddPassword, dialogAutoconf, dialogPassword,
                    buttonSave, detailPane, dataId, dialogSuccess, buttonClose;

                j.it('opens settings app ', function () {

                    var loaded = new Done();

                    api.on('account_created', function (e, data) {
                        if (data) {
                            dataId = data.id;
                        }
                    });

                    j.waitsFor(loaded, 'Could not load app', TIMEOUT);

                    settings.getApp().launch().done(function () {
                        app = this;
                        loaded.yep();

                        j.waitsFor(function () {
                            accountPane = $('[data-obj-id="io.ox/settings/accounts"]');
                            if (accountPane[0]) {
                                accountPane.trigger('click');
                                return true;
                            }

                        }, 'trigger', TIMEOUT);

                        j.expect(app).toBeTruthy();
                    });
                });

                j.it('hits the add button', function () {

                    j.waitsFor(function () {
                        buttonAdd = $('[data-actionname="mailaccount"]');
                        if (buttonAdd[0]) {
                            return true;
                        }
                    }, 'looks for add button', TIMEOUT);

                    j.runs(function () {
                        buttonAdd.trigger('click');
                    });
                });

                j.it('looks for the autoconf form and the add button', function () {

                    j.waitsFor(function () {
                        dialogAutoconf = $('.io-ox-dialog-popup');
                        buttonAddAutoconf = $(dialogAutoconf).find('button.btn-primary');
                        if (dialogAutoconf[0] && buttonAddAutoconf[0]) {
                            return true;
                        }
                    }, 'looks for dialog', TIMEOUT);

                });

                j.it('fills the form', function () {
                    $(dialogAutoconf).find('input[type="text"]').val(TESTMAILAUTOCONFIG.email);
                    $(dialogAutoconf).find('input[type="password"]').val(TESTMAILAUTOCONFIG.password);
                });

                j.it('hits the add button', function () {

                    j.runs(function () {
                        buttonAddAutoconf.trigger('click');
                    });

                });

                j.it('looks for the success message and the close button', function () {

                    j.waitsFor(function () {
                        dialogSuccess = $('.io-ox-dialog-popup');
                        buttonClose = $(dialogSuccess).find('button.btn.closebutton');
                        if (buttonClose[0]) {
                            return true;
                        }
                    }, 'looks for dialog', 10000);

                });

                j.it('hits the close button', function () {

                    j.runs(function () {
                        buttonClose.trigger('click');
                    });

                });

                j.it('gets the id of the created account and deletes', function () {
                    j.expect(dataId).not.toBeUndefined();
                    j.runs(function () {
                        api.remove([dataId]);
                    });

                });
            });
        }
    });

    ext.point('test/suite').extend({
        id: 'email-autoconfig',
        index: 100,
        test: function (j) {
            j.describe("Tests the mail-autoconfig api", function () {

                j.it('tests the autoconfig api', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.autoconfig(TESTMAILAUTOCONFIG)
                        .done(function (data) {
                            console.log(data);
                            me.ready = true;
                        })
                        .fail(function () {
                            console.log('no configdata recived');
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'response from autoconfig arrived', TIMEOUT);

                    });

                });

            });
        }
    });

    ext.point('test/suite').extend({
        id: 'email-validate',
        index: 100,
        test: function (j) {
            j.describe("Tests the validate functions of the api", function () {

                j.it('tests the validate functions', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.validate(TESTACCOUNTVALDIDATION)
                        .done(function (data) {
                            if (data === true) {
                                me.ready = true;
                            }
                        })
                        .fail(function () {
                            console.log('no configdata recived');
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'response from autoconfig arrived', TIMEOUT);

                    });

                });

            });
        }
    });



});