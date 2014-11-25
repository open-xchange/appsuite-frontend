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
    'io.ox/core/viewer/models/filemodel'
], function (FileModel) {

    'use strict';

    describe('OX Viewer', function () {
        describe('filemodel', function () {

            it('should exist', function () {
                expect(FileModel).to.be.a('function');
            });

            // constants ======================================================

            // methods ========================================================
            // lets work with dummies first
            //
            //var dummyMailImage = {
            //    id: '2',
            //    filename: 'cola.jpg',
            //    size: 145218,
            //    disp: 'attachment',
            //    content_type: 'image/jpeg',
            //    content: null,
            //    mail: {
            //        id: '3',
            //        folder_id: 'default0/INBOX'
            //    },
            //    title: 'cola.jpg',
            //    parent: {
            //        id: '3',
            //        folder_id: 'default0/INBOX'
            //    },
            //    group: 'mail',
            //    uploaded: 1,
            //    meta: {}
            //};
            //
            //var dummyDriveImage = {
            //     id: '124/374',
            //     modified_by: 20,
            //     last_modified: 1402646241319,
            //     folder_id: '124',
            //     meta: {},
            //     title: 'cola.jpg',
            //     filename: 'cola.jpg',
            //     file_mimetype: 'image/jpeg',
            //     file_size: 106120,
            //     version: '1',
            //     locked_until: 0
            // };
            //

            // ----------------------------------------------------------------

        });
    });
});
