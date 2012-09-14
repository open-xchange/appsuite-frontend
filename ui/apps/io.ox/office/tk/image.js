/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Kai Ahrens <kai.ahrens@open-xchange.com>
 */

define('io.ox/office/tk/image',
    ['gettext!io.ox/office/main'
    ], function (gt) {

    'use strict';

    var Image = {};

    /**
     * Handles the insertion of the file into the document
     *
     * @param  app
     *
     * @param  imageFile
     */
    Image.insertFile = function (app, editor, imageFile) {
        if (app && editor && imageFile && window.FileReader) {
            var that = this,
                fileReader = new window.FileReader();

            fileReader.onload = function (e) {
                if (e.target.result) {
                    $.ajax({
                        type: 'POST',
                        url: app.getDocumentFilterUrl('addfile', { add_filename: imageFile.name}),
                        dataType: 'json',
                        data: { image_data: e.target.result },
                        beforeSend: function (xhr) {
                            if (xhr && xhr.overrideMimeType) {
                                xhr.overrideMimeType('application/j-son;charset=UTF-8');
                            }
                        }
                    })
                    .done(function (response) {
                        if (response && response.data) {

                            // if added_fragment is set to a valid name,
                            // the insertioin of the image was successful
                            if (response.data.added_fragment && response.data.added_fragment.length > 0) {

                                // set version of FileDescriptor to version that is returned in response
                                app.getFileDescriptor().version = response.data.version;

                                // update the editor's DocumentURL accordingly
                                editor.setDocumentURL(app.getDocumentFilterUrl('getfile'));

                                // create an InsertImage operation with the newly added fragment
                                editor.insertImageFile(response.data.added_fragment);
                            }
                            else {
                                that.handleInsertImageError();
                            }
                        }
                    })
                    .fail(function (response) {
                        that.handleInsertImageError();
                    });
                }
            };

            fileReader.onerror = function (e) {
                that.handleInsertImageError();
            };

            fileReader.readAsDataURL(imageFile);
        }
    };

    /**
     * Handles the insertion of the image URL into the document
     *
     * @param  app
     * @param  editor
     * @param  imageURL
     */
    Image.insertURL = function (app, editor, imageURL) {
        if (app && editor && imageURL && imageURL.lengtn > 0) {
            editor.insertImageURL(imageURL);
        }
    };

    // exports ================================================================

    return Image;
});
