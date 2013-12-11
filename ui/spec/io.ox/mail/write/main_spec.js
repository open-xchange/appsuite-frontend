/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(['io.ox/mail/write/main',
        'io.ox/core/notifications',
        'settings!io.ox/mail'
        ], function (main, notifications, settings) {

    describe('mail write app', function () {
        beforeEach(function () {
            ox.testUtils.stubAppsuiteBody();
            settings.set('messageFormat', 'text');
            this.app = main.getApp();
            var launched = this.app.launch();

            waitsFor(function () {
                return launched.state() === 'resolved';
            });
        });

        describe('provides useful feedback', function () {
            describe('for mails with attachments', function () {
                var setAutoCreatePublicationLimit = function (limit) {
                        return require(['settings!io.ox/core']).then(function (coreSettings) {
                            coreSettings.set('properties', limit);
                        });
                    },
                    sendMailWithApp = function (mail, app) {
                        return function () {
                            return app.compose(mail).then(function () {
                                (_.bind(app.send, app)());
                            });
                        };
                    },
                    setupFakeServer = function (server) {
                        server.respondWith('PUT', /api\/mail\?action=new/, function (xhr) {
                            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                                JSON.stringify({'data': 'default0/Inbox/Sent Items/42'})
                            );
                        });
                    };

                beforeEach(function () {
                    this.mail = {
                        to: [['John Doe', 'john.doe@example.com']],
                        subject: 'Testmail',
                        attachments: [
                            {/* content, we don’t care */},
                            {
                                disp: 'attachment',
                                size: 123412
                            }
                        ]
                    };

                    ox.testUtils.modules.caps('auto_publish_attachments', 'io.ox/mail/write/main', main);

                    if (notifications.yell.restore)
                        notifications.yell.restore();
                    this.notificationSpy = sinon.spy(notifications, 'yell');
                    setupFakeServer(this.server);
                });

                afterEach(function () {
                    var spy = this.notificationSpy;

                    this.def.always(function () {
                        spy.restore();
                    });
                    expect(this.def).toResolve();
                });

                it('exceeding publication limit', function () {
                    var notificationSpy = this.notificationSpy;

                    this.def = setAutoCreatePublicationLimit({
                        'attachmentQuotaPerFile': 123400,
                        'attachmentQuota': 123500
                    })
                    .then(sendMailWithApp(this.mail, this.app))
                    .done(function () {
                        expect(notificationSpy).toHaveBeenCalledWithMatch({type: 'info'});

                    });
                });

                it('having the same size as publication limit', function () {
                    var notificationSpy = this.notificationSpy;

                    this.def = setAutoCreatePublicationLimit({
                        'attachmentQuotaPerFile': 123412,
                        'attachmentQuota': 123500
                    })
                    .then(sendMailWithApp(this.mail, this.app))
                    .done(function () {
                        expect(notificationSpy).not.toHaveBeenCalledWithMatch({type: 'info'});
                    });
                });

                it('having smaller size than publication limit', function () {
                    var notificationSpy = this.notificationSpy;

                    this.def = setAutoCreatePublicationLimit({
                        'attachmentQuotaPerFile': 123500,
                        'attachmentQuota': 123500
                    })
                    .then(sendMailWithApp(this.mail, this.app))
                    .done(function () {
                        expect(notificationSpy).not.toHaveBeenCalledWithMatch({type: 'info'});
                    });
                });

                describe('with general quota set', function () {
                    it('exceeding publication limit', function () {
                        var notificationSpy = this.notificationSpy;

                        this.def = setAutoCreatePublicationLimit({'attachmentQuota': 123400})
                            .then(sendMailWithApp(this.mail, this.app))
                            .done(function () {
                                expect(notificationSpy).toHaveBeenCalledWithMatch({type: 'info'});
                            });
                    });

                    it('having the same size as publication limit', function () {
                        var notificationSpy = this.notificationSpy;

                        this.def = setAutoCreatePublicationLimit({'attachmentQuota': 123412})
                            .then(sendMailWithApp(this.mail, this.app))
                            .done(function () {
                                expect(notificationSpy).not.toHaveBeenCalledWithMatch({type: 'info'});
                            });
                    });

                    it('having smaller size than publication limit', function () {
                        var notificationSpy = this.notificationSpy;

                        this.def = setAutoCreatePublicationLimit({'attachmentQuota': 123500})
                            .then(sendMailWithApp(this.mail, this.app))
                            .done(function () {
                                expect(notificationSpy).not.toHaveBeenCalledWithMatch({type: 'info'});
                            });
                    });
                });

                describe('with per file quota set', function () {
                    it('exceeding publication limit', function () {
                        var notificationSpy = this.notificationSpy;

                        this.def = setAutoCreatePublicationLimit({'attachmentQuotaPerFile': 123400})
                        .then(sendMailWithApp(this.mail, this.app))
                        .done(function () {
                            expect(notificationSpy).toHaveBeenCalledWithMatch({type: 'info'});
                        });
                    });

                    it('having the same size as publication limit', function () {
                        var notificationSpy = this.notificationSpy;

                        this.def = setAutoCreatePublicationLimit({'attachmentQuotaPerFile': 123412})
                        .then(sendMailWithApp(this.mail, this.app))
                        .done(function () {
                            expect(notificationSpy).not.toHaveBeenCalledWithMatch({type: 'info'});
                        });
                    });

                    it('having smaller size than publication limit', function () {
                        var notificationSpy = this.notificationSpy;

                        this.def = setAutoCreatePublicationLimit({'attachmentQuotaPerFile': 123500})
                        .then(sendMailWithApp(this.mail, this.app))
                        .done(function () {
                            expect(notificationSpy).not.toHaveBeenCalledWithMatch({type: 'info'});
                        });
                    });
                });

                describe('with quota properties missing', function () {
                    it('provides no feedback concerning quota at all', function () {
                        var notificationSpy = this.notificationSpy;

                        this.def = setAutoCreatePublicationLimit({})
                        .then(sendMailWithApp(this.mail, this.app))
                        .done(function () {
                            expect(notificationSpy).not.toHaveBeenCalledWithMatch({type: 'info'});
                        });
                    });
                });
            });
        });
    });
});
