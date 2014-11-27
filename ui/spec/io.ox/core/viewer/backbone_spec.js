/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */

define([
    'io.ox/core/viewer/backbone'
], function (backbone) {

    'use strict';

    var Model = backbone.Model,
        Collection = backbone.Collection;

    describe('OX Viewer', function () {

        var driveFile = {
                id: '124/374',
                modified_by: 20,
                last_modified: 1402646241319,
                folder_id: '124',
                meta: {},
                title: 'cola.jpg',
                filename: 'cola.jpg',
                file_mimetype: 'image/jpeg',
                file_size: 106120,
                version: '1',
                locked_until: 0
            },

            mailAttachment = {
                id: '2',
                filename: 'cola.jpg',
                size: 145218,
                disp: 'attachment',
                content_type: 'image/jpeg',
                content: null,
                mail: {
                    id: '3',
                    folder_id: 'default0/INBOX'
                },
                title: 'cola.jpg',
                parent: {
                    id: '3',
                    folder_id: 'default0/INBOX'
                },
                group: 'mail',
                uploaded: 1,
                meta: {}
            };

        describe('Model and Collection definition', function () {

            it('Model should exist', function () {
                expect(Model).to.be.a('function');
            });

            it('Collection should exist', function () {
                expect(Collection).to.be.a('function');
            });
        });

        // constants ======================================================

        // methods ========================================================

        describe('Model instance', function () {
            describe('result of creating an empty Model instance', function () {
                it('should return a non empty object', function () {
                    var model = new Model();
                    expect(model).to.be.an('object');
                    expect(model).to.be.not.empty;
                });

                it('should be initialized with defaults', function () {
                    var model = new Model();
                    expect(model.get('origData')).to.equal(null);
                    expect(model.get('source')).to.equal(null);
                    expect(model.get('filename')).to.equal('');
                    expect(model.get('size')).to.equal(0);
                    expect(model.get('version')).to.equal(null);
                    expect(model.get('contentType')).to.equal(null);
                    expect(model.get('id')).to.equal(null);
                    expect(model.get('folderId')).to.equal(null);
                    expect(model.get('meta')).to.deep.equal({});
                    expect(model.get('lastModified')).to.equal(null);

                    expect(model.isMailAttachment()).to.be['false'];
                    expect(model.isDriveFile()).to.be['false'];

                    expect(model.getPreviewUrl()).to.equal(null);
                    expect(model.getDownloadUrl()).to.equal(null);
                    expect(model.getThumbnailUrl()).to.equal(null);
                });
            });

            describe('result of creating a Model from a Drive file', function () {
                it('should return a non empty object', function () {
                    var model = new Model(driveFile, { parse: true });
                    expect(model).to.be.an('object');
                    expect(model).to.be.not.empty;
                });

                it('should be initialized with correct attributes', function () {
                    var model = new Model(driveFile, { parse: true });
                    expect(model.get('origData')).to.be.not.empty;
                    expect(model.get('source')).to.equal('file');
                    expect(model.get('filename')).to.equal('cola.jpg');
                    expect(model.get('size')).to.equal(106120);
                    expect(model.get('version')).to.equal('1');
                    expect(model.get('contentType')).to.equal('image/jpeg');
                    expect(model.get('id')).to.equal('124/374');
                    expect(model.get('folderId')).to.equal('124');
                    expect(model.get('meta')).to.deep.equal({});
                    expect(model.get('lastModified')).to.equal(1402646241319);

                    expect(model.isMailAttachment()).to.be['false'];
                    expect(model.isDriveFile()).to.be['true'];

                    expect(model.getPreviewUrl()).to.contain('/api/files?')
                                                .and.to.contain('action=document')
                                                .and.to.contain('folder=124')
                                                .and.to.contain('id=124/374')
                                                .and.to.contain('version=1')
                                                .and.to.contain('delivery=view')
                                                .and.to.contain('format=preview_image')
                                                .and.to.contain('content_type=image/jpeg');

                    expect(model.getDownloadUrl()).to.contain('/api/files/cola.jpg?')
                                                .and.to.contain('action=document')
                                                .and.to.contain('folder=124')
                                                .and.to.contain('id=124/374')
                                                .and.to.contain('version=1')
                                                .and.to.contain('delivery=download');

                    expect(model.getThumbnailUrl()).to.contain('/api/files?')
                                                .and.to.contain('action=document')
                                                .and.to.contain('folder=124')
                                                .and.to.contain('id=124/374')
                                                .and.to.contain('version=1')
                                                .and.to.contain('delivery=view')
                                                .and.to.contain('scaleType=contain')
                                                .and.to.contain('content_type=image/jpeg');
                });
            });

            describe('result of creating a Model from a mail attachment', function () {
                it('should return a non empty object', function () {
                    var model = new Model(mailAttachment, { parse: true });
                    expect(model).to.be.an('object');
                    expect(model).to.be.not.empty;
                });

                it('should be initialized with correct attributes', function () {
                    var model = new Model(mailAttachment, { parse: true });
                    expect(model.get('origData')).to.be.not.empty;
                    expect(model.get('source')).to.equal('attachment');
                    expect(model.get('filename')).to.equal('cola.jpg');
                    expect(model.get('size')).to.equal(145218);
                    expect(model.get('version')).to.equal(null);
                    expect(model.get('contentType')).to.equal('image/jpeg');
                    expect(model.get('id')).to.equal('2');
                    expect(model.get('folderId')).to.equal('default0/INBOX');
                    expect(model.get('meta')).to.deep.equal({});
                    expect(model.get('lastModified')).to.equal(null);

                    expect(model.isMailAttachment()).to.be['true'];
                    expect(model.isDriveFile()).to.be['false'];

                    expect(model.getPreviewUrl()).to.contain('/api/attachment/cola.jpg?')
                                                .and.to.contain('action=document')
                                                .and.to.contain('id=2')
                                                .and.to.contain('delivery=view');

                    expect(model.getDownloadUrl()).to.contain('/api/attachment/cola.jpg?')
                                                .and.to.contain('action=document')
                                                .and.to.contain('id=2')
                                                .and.to.contain('delivery=download');

                    expect(model.getThumbnailUrl()).to.contain('/api/attachment/cola.jpg?')
                                                .and.to.contain('action=document')
                                                .and.to.contain('id=2')
                                                .and.to.contain('delivery=view');
                });
            });

            describe('Huba Huba Marsupilami', function () {
                it('should always fail', function () {
                    expect(true).to.be['false'];
                });
            });

        });

        // ----------------------------------------------------------------
    });
});
