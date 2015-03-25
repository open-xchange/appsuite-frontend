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
                locked_until: 0,
                number_of_versions: 1
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
            },
            
            pimAttachment = {
                attached: 1,
                file_mimetype: "image/png",
                file_size: 24670,
                filename: "Happy-Minion-Icon.png",
                folder: 187,
                id: 3,
                module: 4
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
                    expect(model.get('module')).to.equal(null);
                    expect(model.get('versions')).to.equal(null);
                    expect(model.get('description')).to.equal(null);
                    expect(model.get('numberOfVersions')).to.equal(0);
                    
                    expect(model.isMailAttachment()).to.be['false'];
                    expect(model.isPIMAttachment()).to.be['false'];
                    expect(model.isDriveFile()).to.be['false'];

                    expect(model.getPreviewUrl()).to.equal(null);
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
                    expect(model.get('module')).to.equal(null);
                    expect(model.get('numberOfVersions')).to.equal(1);

                    expect(model.isMailAttachment()).to.be['false'];
                    expect(model.isPIMAttachment()).to.be['false'];
                    expect(model.isDriveFile()).to.be['true'];

                    expect(model.getPreviewUrl()).to.be.a('string');
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
                    expect(model.get('source')).to.equal('mail-attachment');
                    expect(model.get('filename')).to.equal('cola.jpg');
                    expect(model.get('size')).to.equal(145218);
                    expect(model.get('version')).to.equal(null);
                    expect(model.get('contentType')).to.equal('image/jpeg');
                    expect(model.get('id')).to.equal('2');
                    expect(model.get('folderId')).to.equal('default0/INBOX');
                    expect(model.get('meta')).to.deep.equal({});
                    expect(model.get('lastModified')).to.equal(null);
                    expect(model.get('module')).to.equal(null);
                    expect(model.get('numberOfVersions')).to.equal(0);

                    expect(model.isMailAttachment()).to.be['true'];
                    expect(model.isPIMAttachment()).to.be['false'];
                    expect(model.isDriveFile()).to.be['false'];

                    expect(model.getPreviewUrl()).to.be.a('string');
                });
            });
            
            describe('result of creating a Model from a PIM attachment', function () {
                it('should return a non empty object', function () {
                    var model = new Model(pimAttachment, { parse: true });
                    expect(model).to.be.an('object');
                    expect(model).to.be.not.empty;
                });

                it('should be initialized with correct attributes', function () {
                    var model = new Model(pimAttachment, { parse: true });
                    expect(model.get('origData')).to.be.not.empty;
                    expect(model.get('source')).to.equal('pim-attachment');
                    expect(model.get('filename')).to.equal('Happy-Minion-Icon.png');
                    expect(model.get('size')).to.equal(24670);
                    expect(model.get('version')).to.equal(null);
                    expect(model.get('contentType')).to.equal('image/png');
                    expect(model.get('id')).to.equal(3);
                    expect(model.get('folderId')).to.equal(187);
                    expect(model.get('meta')).to.deep.equal({});
                    expect(model.get('lastModified')).to.equal(null);
                    expect(model.get('module')).to.equal(4);
                    expect(model.get('numberOfVersions')).to.equal(0);
                    
                    expect(model.isMailAttachment()).to.be['false'];
                    expect(model.isPIMAttachment()).to.be['true'];
                    expect(model.isDriveFile()).to.be['false'];

                    expect(model.getPreviewUrl()).to.be.a('string');
                });
            });
            
        });

        // ----------------------------------------------------------------
    });
});
