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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define([
    'io.ox/core/extensions',
    'io.ox/core/tk/attachments',
    'io.ox/core/notifications',
    'spec/shared/capabilities',
    'fixture!io.ox/files/attachment.json'
], function (ext, attachments, notifications, caputil, attachmentFile) {
    'use strict';

    var capabilities = caputil.preset('common').init('io.ox/core/tk/attachments', attachments);

    describe('Attachments Util has a', function () {

        describe('FileUploadWidget:', function () {
            describe('when capability "infostore" is disabled', function () {
                beforeEach(function () {
                    capabilities.disable('infostore');
                });
                it('and ox.drive is enabled "Files" button should be hidden', function () {
                    var node = attachments.fileUploadWidget({ drive: true });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(0);
                });
                it('and ox.drive is disabled "Files" button should be hidden', function () {
                    var node = attachments.fileUploadWidget({ drive: false });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(0);
                });
            });
            describe('when capability "infostore" is enabled', function () {
                beforeEach(function () {
                    capabilities.enable('infostore');
                });
                it.skip('and ox.drive is enabled "Files" button should be shown', function () {
                    var node = attachments.fileUploadWidget({ drive: true });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(1);
                });
                it('and ox.drive is disabled "Files" button should be hidden', function () {
                    var node = attachments.fileUploadWidget({ drive: false });
                    expect(node.find('[data-action="addinternal"]')).to.have.length(0);
                });
            });
        });

        describe('EditableFileList:', function () {
            var def, baton;

            var setUploadLimit = function (limit) {
                return require(['settings!io.ox/core']).then(function (coreSettings) {
                    coreSettings.set('properties', limit);
                });
            },
            createList = function (baton, file, mail) {
                if (mail) baton.app = { app: { attributes: { name: 'io.ox/mail/compose' }}};

                new attachments.EditableFileList({
                    id: 'attachment_list',
                    fileClasses: 'background',
                    preview: false,
                    labelmax: 18,
                    registerTo: baton
                }, baton);
                return function () {
                    return baton.fileList.checkQuota(file);
                };
            },
            getList = function (baton) {
                return function () {
                    return baton.fileList.get();
                };
            };

            beforeEach(function () {
                baton = new ext.Baton();
            });

            afterEach(function (done) {
                def.always(function (result) {
                    def = null;
                    baton = null;
                    expect(result).to.equal('done');
                    done();
                });
            });

            describe('list with one file added', function () {
                var setup;
                beforeEach(function () {
                    setup = setUploadLimit({
                        'infostoreMaxUploadSize': 2000,
                        'infostoreQuota': 2000,
                        'infostoreUsage': 1000
                    })
                    .then(createList(baton, attachmentFile));
                });

                it('should be cleared', function () {

                    def = setup.then(getList(baton))
                    .then(function () {
                        baton.fileList.clear();
                        var result = baton.fileList.get();
                        expect(result).to.be.an('array');
                        expect(result).to.be.empty;

                        return 'done';
                    });
                });

                it('should return the file', function () {
                    def = setup.then(getList(baton))
                    .then(function () {
                        var result = baton.fileList.get();
                        expect(result).to.be.an('array');
                        expect(result).to.have.deep.property('[0]', attachmentFile);

                        return 'done';
                    });
                });
            });

            describe('check quota while', function () {

                describe('adding file to infostore', function () {

                    it('when exeeding infostore quota', function () {
                        def = setUploadLimit({
                            'infostoreMaxUploadSize': 2000,
                            'infostoreQuota': 1999,
                            'infostoreUsage': 1000
                        })
                        .then(createList(baton, attachmentFile))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.have.property('reason');
                            expect(result.reason).to.equal('quota');
                            expect(result.error).to.be.a('string');

                            return 'done';
                        });
                    });

                    it('when exceeding infostore maximum upload size limit', function () {
                        def = setUploadLimit({
                            'infostoreMaxUploadSize': 999,
                            'infostoreQuota': 2000,
                            'infostoreUsage': 1000
                        })
                        .then(createList(baton, attachmentFile))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.have.property('reason');
                            expect(result.reason).to.equal('filesize');
                            expect(result.error).to.be.a('string');

                            return 'done';
                        });
                    });

                    it('when having the same size as available infostore quota limit', function () {
                        def = setUploadLimit({
                            'infostoreMaxUploadSize': 1000,
                            'infostoreQuota': 2000,
                            'infostoreUsage': 1000
                        })
                        .then(createList(baton, attachmentFile))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.not.have.property('reason');
                            expect(result).to.not.have.property('error');

                            return 'done';
                        });
                    });

                    it('when having the smaller size as available infostore quota limit', function () {
                        def = setUploadLimit({
                            'infostoreMaxUploadSize': 1001,
                            'infostoreQuota': 2001,
                            'infostoreUsage': 1000
                        })
                        .then(createList(baton, attachmentFile))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.not.have.property('reason');
                            expect(result).to.not.have.property('error');

                            return 'done';
                        });
                    });

                    it('when infostore quota limit is 0', function () {
                        def = setUploadLimit({
                            'infostoreMaxUploadSize': 1000,
                            'infostoreQuota': 0,
                            'infostoreUsage': 1000
                        })
                        .then(createList(baton, attachmentFile))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.not.have.property('reason');
                            expect(result).to.not.have.property('error');

                            return 'done';
                        });
                    });

                    it('when infostore quota limit is -1', function () {
                        def = setUploadLimit({
                            'infostoreMaxUploadSize': 1000,
                            'infostoreQuota': -1,
                            'infostoreUsage': 1000
                        })
                        .then(createList(baton, attachmentFile))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.not.have.property('reason');
                            expect(result).to.not.have.property('error');

                            return 'done';
                        });
                    });

                    it('when infostore max upload size is 0', function () {
                        def = setUploadLimit({
                            'infostoreMaxUploadSize': 0,
                            'infostoreQuota': 0,
                            'infostoreUsage': 1000
                        })
                        .then(createList(baton, attachmentFile))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.not.have.property('reason');
                            expect(result).to.not.have.property('error');

                            return 'done';
                        });
                    });

                    it('when infostore max upload size is -1', function () {
                        def = setUploadLimit({
                            'infostoreMaxUploadSize': -1,
                            'infostoreQuota': -1,
                            'infostoreUsage': 1000
                        })
                        .then(createList(baton, attachmentFile))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.not.have.property('reason');
                            expect(result).to.not.have.property('error');

                            return 'done';
                        });
                    });
                });

                describe('adding a file as attachment', function () {

                    it('when exceeding attachment quota', function () {
                        def = setUploadLimit({
                            'attachmentQuota': 999,
                            'attachmentQuotaPerFile': 1000
                        })
                        .then(createList(baton, attachmentFile, true))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.have.property('reason');
                            expect(result.reason).to.equal('quota');
                            expect(result.error).to.be.a('string');

                            return 'done';
                        });
                    });

                    it('when having the same size as available attachment quota limit', function () {
                        def = setUploadLimit({
                            'attachmentQuota': 1000,
                            'attachmentQuotaPerFile': 1000
                        })
                        .then(createList(baton, attachmentFile, true))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.not.have.property('reason');
                            expect(result).to.not.have.property('error');

                            return 'done';
                        });
                    });

                    it('when having the smaller size as available attachment quota limit', function () {
                        def = setUploadLimit({
                            'attachmentQuota': 1001,
                            'attachmentQuotaPerFile': 1001
                        })
                        .then(createList(baton, attachmentFile, true))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.not.have.property('reason');
                            expect(result).to.not.have.property('error');

                            return 'done';
                        });
                    });

                    it('when attachment quota limit is 0', function () {
                        def = setUploadLimit({
                            'attachmentQuota': 0,
                            'attachmentQuotaPerFile': 0
                        })
                        .then(createList(baton, attachmentFile, true))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.not.have.property('reason');
                            expect(result).to.not.have.property('error');

                            return 'done';
                        });
                    });

                    it('when attachment quota limit is -1', function () {
                        def = setUploadLimit({
                            'attachmentQuota': -1,
                            'attachmentQuotaPerFile': -1
                        })
                        .then(createList(baton, attachmentFile, true))
                        .then(function (result) {
                            expect(result).to.have.property('added');
                            expect(result).to.not.have.property('reason');
                            expect(result).to.not.have.property('error');

                            return 'done';
                        });
                    });

                    describe('having capability publish_mail_attachments enabled', function () {
                        beforeEach(function () {
                            capabilities.enable('publish_mail_attachments');
                        });

                        it('when exceeding attachment quota', function () {
                            def = setUploadLimit({
                                'infostoreMaxUploadSize': 1000,
                                'infostoreQuota': 1000,
                                'infostoreUsage': 0,
                                'attachmentQuota': 999,
                                'attachmentQuotaPerFile': 1000
                            })
                            .then(createList(baton, attachmentFile, true))
                            .then(function (result) {
                                expect(result).to.have.property('added');
                                expect(result).to.not.have.property('reason');
                                expect(result).to.not.have.property('error');
                                return 'done';
                            });
                        });

                        it('when exceeding attachment quota per file', function () {
                            def = setUploadLimit({
                                'infostoreMaxUploadSize': 1000,
                                'infostoreQuota': 1000,
                                'infostoreUsage': 0,
                                'attachmentQuota': -1,
                                'attachmentQuotaPerFile': 999
                            })
                            .then(createList(baton, attachmentFile, true))
                            .then(function (result) {
                                expect(result).to.have.property('added');
                                expect(result).to.not.have.property('reason');
                                expect(result).to.not.have.property('error');
                                return 'done';
                            });
                        });

                        it('when exceeding attachment quota and attachment quota per file', function () {
                            def = setUploadLimit({
                                'infostoreMaxUploadSize': 1000,
                                'infostoreQuota': 1000,
                                'infostoreUsage': 0,
                                'attachmentQuota': 999,
                                'attachmentQuotaPerFile': 999
                            })
                            .then(createList(baton, attachmentFile, true))
                            .then(function (result) {
                                expect(result).to.have.property('added');
                                expect(result).to.not.have.property('reason');
                                expect(result).to.not.have.property('error');
                                return 'done';
                            });
                        });

                        it('when exceeding attachment quota and infostore maximum upload size', function () {
                            def = setUploadLimit({
                                'infostoreMaxUploadSize': 999,
                                'infostoreQuota': 1000,
                                'infostoreUsage': 0,
                                'attachmentQuota': -1,
                                'attachmentQuotaPerFile': 999
                            })
                            .then(createList(baton, attachmentFile, true))
                            .then(function (result) {
                                expect(result).to.have.property('added');
                                expect(result).to.have.property('reason');
                                expect(result.reason).to.equal('filesizeAutoPublish');
                                expect(result.error).to.be.a('string');
                                return 'done';
                            });
                        });

                        it('when exceeding attachment quota and infostore quota', function () {
                            def = setUploadLimit({
                                'infostoreMaxUploadSize': 1000,
                                'infostoreQuota': 1000,
                                'infostoreUsage': 999,
                                'attachmentQuota': -1,
                                'attachmentQuotaPerFile': 999
                            })
                            .then(createList(baton, attachmentFile, true))
                            .then(function (result) {
                                expect(result).to.have.property('added');
                                expect(result).to.have.property('reason');
                                expect(result.reason).to.equal('quotaAutoPublish');
                                expect(result.error).to.be.a('string');
                                return 'done';
                            });
                        });
                    });
                });
            });
        });
    });
});
