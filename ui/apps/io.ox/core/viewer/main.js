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
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */

define('io.ox/core/viewer/main', [
    'io.ox/core/viewer/models/filemodel',
    'io.ox/core/viewer/views/mainview'
], function (FileModel, MainView) {

    'use strict';

    /**
     * Main bootstrap file for the OX Viewer.
     */
    // debug stuff
    var dummyMailImage = {
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

    var dummyDriveImage = {
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
    };

    console.log('debug data, mail attachment, image file: ', dummyMailImage, dummyDriveImage);

    var modelDummy1 = new FileModel(dummyMailImage, { parse: true });
    console.log('model: ', modelDummy1);

    var modelDummy2 = new FileModel(dummyDriveImage, { parse: true });
    console.log('model: ', modelDummy2);
    console.log(MainView);
});
