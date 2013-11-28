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

define(['io.ox/core/extensions', 'io.ox/core/tk/attachments', 'io.ox/core/notifications'], function (ext, attachments, notifications) {

    'use strict';

    describe('Attachments Util:', function () {

        var setUploadLimit = function (limit) {
            return require(['settings!io.ox/core']).then(function (coreSettings) {
                coreSettings.set('properties', limit);
            });
        },
        createList = function (baton, file, mail) {
            if (mail) baton.app = {app: { attributes: { name:'io.ox/mail/write' }}};

            new attachments.EditableFileList({
                    id: 'attachment_list',
                    fileClasses: 'background',
                    preview: false,
                    labelmax: 18,
                    registerTo: baton
                },
                baton
            );
            return function () {
                return baton.fileList.checkQuota(file);
            };
        };

        beforeEach(function () {
            this.baton = new ext.Baton();
        });

        afterEach(function () {
            expect(this.def).toResolveWith('done');
        });

        describe('Adding to a file to infostore', function () {

            beforeEach(function () {
                this.file = {
                    name: 'Testfile',
                    size: 1000
                };
            });

            it('exceeding infostore quota', function () {
                this.def = setUploadLimit({
                    'infostoreMaxUploadSize': 2000,
                    'infostoreQuota': 1999,
                    'infostoreUsage': 1000
                })
                .then(createList(this.baton, this.file))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.have.property('reason');
                    expect(result.reason).toBe('quota');
                    chai.expect(result.error).to.be.a('string');

                    return 'done';
                });
            });

            it('exceeding infostore maximum upload size limit', function () {
                this.def = setUploadLimit({
                    'infostoreMaxUploadSize': 999,
                    'infostoreQuota': 2000,
                    'infostoreUsage': 1000
                })
                .then(createList(this.baton, this.file))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.have.property('reason');
                    expect(result.reason).toBe('filesize');
                    chai.expect(result.error).to.be.a('string');

                    return 'done';
                });
            });

            it('having the same size as available infostore quota limit', function () {
                this.def = setUploadLimit({
                    'infostoreMaxUploadSize': 1000,
                    'infostoreQuota': 2000,
                    'infostoreUsage': 1000
                })
                .then(createList(this.baton, this.file))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });

            it('having the smaller size as available infostore quota limit', function () {
                this.def = setUploadLimit({
                    'infostoreMaxUploadSize': 1001,
                    'infostoreQuota': 2001,
                    'infostoreUsage': 1000
                })
                .then(createList(this.baton, this.file))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });

            it('infostore quota limit is 0', function () {
                this.def = setUploadLimit({
                    'infostoreMaxUploadSize': 1000,
                    'infostoreQuota': 0,
                    'infostoreUsage': 1000
                })
                .then(createList(this.baton, this.file))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });

            it('infostore quota limit is -1', function () {
                this.def = setUploadLimit({
                    'infostoreMaxUploadSize': 1000,
                    'infostoreQuota': -1,
                    'infostoreUsage': 1000
                })
                .then(createList(this.baton, this.file))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });

            it('infostore max upload size is 0', function () {
                this.def = setUploadLimit({
                    'infostoreMaxUploadSize': 0,
                    'infostoreQuota': 0,
                    'infostoreUsage': 1000
                })
                .then(createList(this.baton, this.file))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });

            it('infostore max upload size is -1', function () {
                this.def = setUploadLimit({
                    'infostoreMaxUploadSize': -1,
                    'infostoreQuota': -1,
                    'infostoreUsage': 1000
                })
                .then(createList(this.baton, this.file))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });
        });

        describe('Adding to a file as attachment to mail', function () {

            beforeEach(function () {
                this.file = {
                    name: 'Testfile',
                    size: 1000
                };
            });

            it('exceeding attachment quota', function () {
                this.def = setUploadLimit({
                    'attachmentMaxUploadSize': 1000,
                    'attachmentQuota': 999,
                    'attachmentQuotaPerFile': 1000
                })
                .then(createList(this.baton, this.file, true))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.have.property('reason');
                    expect(result.reason).toBe('quota');
                    chai.expect(result.error).to.be.a('string');

                    return 'done';
                });
            });

            it('exceeding attachment maximum upload size limit', function () {
                this.def = setUploadLimit({
                    'attachmentMaxUploadSize': 999,
                    'attachmentQuota': 1000,
                    'attachmentQuotaPerFile': 1000
                })
                .then(createList(this.baton, this.file, true))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.have.property('reason');
                    expect(result.reason).toBe('filesize');
                    chai.expect(result.error).to.be.a('string');

                    return 'done';
                });
            });

            it('having the same size as available attachment quota limit', function () {
                this.def = setUploadLimit({
                    'attachmentMaxUploadSize': 1000,
                    'attachmentQuota': 1000,
                    'attachmentQuotaPerFile': 1000
                })
                .then(createList(this.baton, this.file, true))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });

            it('having the smaller size as available attachment quota limit', function () {
                this.def = setUploadLimit({
                    'attachmentMaxUploadSize': 1001,
                    'attachmentQuota': 1001,
                    'attachmentQuotaPerFile': 1001
                })
                .then(createList(this.baton, this.file, true))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });

            it('attachment quota limit is 0', function () {
                this.def = setUploadLimit({
                    'attachmentMaxUploadSize': 1000,
                    'attachmentQuota': 0,
                    'attachmentQuotaPerFile': 0
                })
                .then(createList(this.baton, this.file, true))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });

            it('attachment quota limit is -1', function () {
                this.def = setUploadLimit({
                    'attachmentMaxUploadSize': 1000,
                    'attachmentQuota': -1,
                    'attachmentQuotaPerFile': -1
                })
                .then(createList(this.baton, this.file, true))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });

            it('attachment max upload size is 0', function () {
                this.def = setUploadLimit({
                    'attachmentMaxUploadSize': 0,
                    'attachmentQuota': 1000,
                    'attachmentQuotaPerFile': 1000
                })
                .then(createList(this.baton, this.file, true))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });

            it('attachment max upload size is -1', function () {
                this.def = setUploadLimit({
                    'attachmentMaxUploadSize': -1,
                    'attachmentQuota': 1000,
                    'attachmentQuotaPerFile': 1000
                })
                .then(createList(this.baton, this.file, true))
                .then(function (result) {
                    chai.expect(result).to.have.property('added');
                    chai.expect(result).to.not.have.property('reason');
                    chai.expect(result).to.not.have.property('error');

                    return 'done';
                });
            });
        });
    });
});
