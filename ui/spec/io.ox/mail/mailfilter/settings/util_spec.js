/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define([
    'io.ox/mail/mailfilter/settings/util',
    'io.ox/mail/mailfilter/settings/model',
    'gettext!io.ox/mail',
    'io.ox/mail/mailfilter/settings/filter/tests/register',
    'io.ox/mail/mailfilter/settings/filter/actions/register',
    'io.ox/core/extensions',
    'io.ox/mail/mailfilter/settings/filter/defaults',
    'fixture!io.ox/mail/mailfilter/config.json'
], function (util, mailfilterModel, gt, conditionsExtensions, actionsExtensions, ext, defaults, fixtureMailfilterConfig) {

    'use strict';

    var FROM = {
            'comparison': 'contains',
            'headers': ['From'],
            'id': 'from',
            'values': ['test@open-xchange.com']
        },
        TO = {
            'comparison': 'contains',
            'headers': ['To'],
            'id': 'to',
            'values': ['test@open-xchange.com']
        },
        SUBJECT = {
            'comparison': 'contains',
            'headers': ['Subject'],
            'id': 'subject',
            'values': ['Test subject']
        };

    describe('Mailfilter util generates default name', function () {

        beforeEach(function () {

            conditionsExtensions.processConfig(fixtureMailfilterConfig);
            actionsExtensions.processConfig(fixtureMailfilterConfig);

            ext.point('io.ox/mail/mailfilter/tests').invoke('initialize', null, { defaults: defaults });
            ext.point('io.ox/mail/mailfilter/actions').invoke('initialize', null, { defaults: defaults });

        });

        describe('mails from', function () {
            it('keep', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: FROM,
                    actioncmds: [{
                        'id': 'keep'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Keep mails from %1$s', 'test@open-xchange.com'));
                    done();
                });
            });

            it('discard', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: FROM,
                    actioncmds: [{
                        'id': 'discard'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Discard mails from %1$s', 'test@open-xchange.com'));
                    done();
                });
            });

            it('redirect', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: FROM,
                    actioncmds: [{
                        'id': 'redirect',
                        'to': 'test2@open-xchange.com'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Redirect mails from %1$s to %2$s', 'test@open-xchange.com', 'test2@open-xchange.com'));
                    done();
                });
            });

            it('move', function (done) {
                this.server.respondWith('GET', /api\/folders\?action=get.+id=123456&/, [
                    200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                        timestamp: 1368791630910,
                        data: { id: '123456', folder_id: '1', module: 'mail', title: 'INBOX', standard_folder: true }
                    })]
                );

                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: FROM,
                    actioncmds: [{
                        'id': 'move',
                        'into': '123456'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Move mails from %1$s into folder %2$s', 'test@open-xchange.com', 'INBOX'));
                    done();
                });
            });

            it('reject', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: FROM,
                    actioncmds: [{
                        'id': 'reject',
                        'text': 'some reason'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Reject mails from %1$s with reason %2$s', 'test@open-xchange.com', 'some reason'));
                    done();
                });
            });

            describe('mark mails', function () {

                it('as seen', function (done) {
                    util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                        test: FROM,
                        actioncmds: [{
                            'flags': ['\\seen'],
                            'id': 'addflags'
                        }]
                    })).done(function (rulename) {
                        rulename.should.equal(gt('Mark mails from %1$s as seen', 'test@open-xchange.com'));
                        done();
                    });
                });

                it('as deleted', function (done) {
                    util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                        test: FROM,
                        actioncmds: [{
                            'flags': ['\\deleted'],
                            'id': 'addflags'
                        }]
                    })).done(function (rulename) {
                        rulename.should.equal(gt('Mark mails from %1$s as deleted', 'test@open-xchange.com'));
                        done();
                    });
                });

            });

            it('tag', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: FROM,
                    actioncmds: [{
                        'flags': ['$some flag'],
                        'id': 'addflags'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Tag mails from %1$s with %2$s', 'test@open-xchange.com', 'some flag'));
                    done();
                });
            });

            it('flag', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: FROM,
                    actioncmds: [{
                        'flags': ['$cl_1'],
                        'id': 'addflags'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Flag mails from %1$s with a color', 'test@open-xchange.com'));
                    done();
                });
            });

        });

        describe('mails to', function () {
            it('keep', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: TO,
                    actioncmds: [{
                        'id': 'keep'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Keep mails to %1$s', 'test@open-xchange.com'));
                    done();
                });
            });

            it('discard', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: TO,
                    actioncmds: [{
                        'id': 'discard'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Discard mails to %1$s', 'test@open-xchange.com'));
                    done();
                });
            });

            it('redirect', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: TO,
                    actioncmds: [{
                        'id': 'redirect',
                        'to': 'test2@open-xchange.com'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Redirect mails to %1$s to %2$s', 'test@open-xchange.com', 'test2@open-xchange.com'));
                    done();
                });
            });

            it('move', function (done) {
                this.server.respondWith('GET', /api\/folders\?action=get.+id=123456&/, [
                    200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                        timestamp: 1368791630910,
                        data: { id: '123456', folder_id: '1', module: 'mail', title: 'INBOX', standard_folder: true }
                    })]
                );

                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: TO,
                    actioncmds: [{
                        'id': 'move',
                        'into': '123456'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Move mails to %1$s into folder %2$s', 'test@open-xchange.com', 'INBOX'));
                    done();
                });
            });

            it('reject', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: TO,
                    actioncmds: [{
                        'id': 'reject',
                        'text': 'some reason'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Reject mails to %1$s with reason %2$s', 'test@open-xchange.com', 'some reason'));
                    done();
                });
            });

            describe('mark mails', function () {

                it('as seen', function (done) {
                    util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                        test: TO,
                        actioncmds: [{
                            'flags': ['\\seen'],
                            'id': 'addflags'
                        }]
                    })).done(function (rulename) {
                        rulename.should.equal(gt('Mark mails to %1$s as seen', 'test@open-xchange.com'));
                        done();
                    });
                });

                it('as deleted', function (done) {
                    util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                        test: TO,
                        actioncmds: [{
                            'flags': ['\\deleted'],
                            'id': 'addflags'
                        }]
                    })).done(function (rulename) {
                        rulename.should.equal(gt('Mark mails to %1$s as deleted', 'test@open-xchange.com'));
                        done();
                    });
                });

            });

            it('tag', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: TO,
                    actioncmds: [{
                        'flags': ['$some flag'],
                        'id': 'addflags'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Tag mails to %1$s with %2$s', 'test@open-xchange.com', 'some flag'));
                    done();
                });
            });

            it('flag', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: TO,
                    actioncmds: [{
                        'flags': ['$cl_1'],
                        'id': 'addflags'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Flag mails to %1$s with a color', 'test@open-xchange.com'));
                    done();
                });
            });

        });

        describe('with subject', function () {
            it('keep', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: SUBJECT,
                    actioncmds: [{
                        'id': 'keep'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Keep mails with subject %1$s', 'Test subject'));
                    done();
                });
            });

            it('discard', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: SUBJECT,
                    actioncmds: [{
                        'id': 'discard'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Discard mails with subject %1$s', 'Test subject'));
                    done();
                });
            });

            it('redirect', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: SUBJECT,
                    actioncmds: [{
                        'id': 'redirect',
                        'to': 'test2@open-xchange.com'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Redirect mails with subject %1$s to %2$s', 'Test subject', 'test2@open-xchange.com'));
                    done();
                });
            });

            it('move', function (done) {
                this.server.respondWith('GET', /api\/folders\?action=get.+id=123456&/, [
                    200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({
                        timestamp: 1368791630910,
                        data: { id: '123456', folder_id: '1', module: 'mail', title: 'INBOX', standard_folder: true }
                    })]
                );

                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: SUBJECT,
                    actioncmds: [{
                        'id': 'move',
                        'into': '123456'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Move mails with subject %1$s into folder %2$s', 'Test subject', 'INBOX'));
                    done();
                });
            });

            it('reject', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: SUBJECT,
                    actioncmds: [{
                        'id': 'reject',
                        'text': 'some reason'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Reject mails with subject %1$s with reason %2$s', 'Test subject', 'some reason'));
                    done();
                });
            });

            describe('mark mails', function () {

                it('as seen', function (done) {
                    util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                        test: SUBJECT,
                        actioncmds: [{
                            'flags': ['\\seen'],
                            'id': 'addflags'
                        }]
                    })).done(function (rulename) {
                        rulename.should.equal(gt('Mark mails with subject %1$s as seen', 'Test subject'));
                        done();
                    });
                });

                it('as deleted', function (done) {
                    util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                        test: SUBJECT,
                        actioncmds: [{
                            'flags': ['\\deleted'],
                            'id': 'addflags'
                        }]
                    })).done(function (rulename) {
                        rulename.should.equal(gt('Mark mails with subject %1$s as deleted', 'Test subject'));
                        done();
                    });
                });

            });

            it('tag', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: SUBJECT,
                    actioncmds: [{
                        'flags': ['$some flag'],
                        'id': 'addflags'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Tag mails with subject %1$s with %2$s', 'Test subject', 'some flag'));
                    done();
                });
            });

            it('flag', function (done) {
                util.getDefaultRulename(_.extend(mailfilterModel.protectedMethods.provideEmptyModel(), {
                    test: SUBJECT,
                    actioncmds: [{
                        'flags': ['$cl_1'],
                        'id': 'addflags'
                    }]
                })).done(function (rulename) {
                    rulename.should.equal(gt('Flag mails with subject %1$s with a color', 'Test subject'));
                    done();
                });
            });

        });

    });
});
