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

define('io.ox/office/dialog/common',
    ['io.ox/core/tk/dialogs',
     'io.ox/office/tk/apphelper',
     'gettext!io.ox/office/main'
    ], function (Dialogs, AppHelper, gt) {

    'use strict';

    var CommonDialogs = {};

    /**
     * Shows an insert image file dialog
     *
     * @param  app
     */
    CommonDialogs.insertImageDialog = function (app, newFragmentHandler) {
        var that = this,
            imageFile = null;

        new Dialogs.ModalDialog({
            width: 400,
            easyOut: true
        })
        .header(
            $('<h4>').text(gt('Insert Image'))
        )
        .append(
            $('<input>', { placeholder: gt('Filename'), value: '' })
            .attr('name', 'files[]')
            .attr('type', 'file')
            .attr('accept', 'image/*')
            .attr('data-property', 'imageFilename')
            .addClass('nice-input')
            .change(function (e) {
                that.imageFile = (e.target.files.length > 0) ? e.target.files[0] : null;
            })
        )
        .addButton('cancel', gt('Cancel'))
        .addPrimaryButton('insert', gt('Insert'))
        .show(function () {
            $('input[data-property="imageFilename"]').focus();
        })
        .done(function (action, data, node) {
            if (action === 'insert') {
                that.handleInsertImageFile(app, that.imageFile, newFragmentHandler);
            }
        });
    };

    /**
     * Handles the insertion of the file into the document
     *
     * @param  app
     *
     * @param  imageFile
     */
    CommonDialogs.handleInsertImageFile = function (app, imageFile, fragmentHandler) {
        if (app && imageFile && window.FileReader) {
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
                        console.log(response);
                        if (response && response.data) {

                            // if added_fragment is set to a valid name,
                            // the insertioin of the image was successful
                            if (response.data.added_fragment && response.data.added_fragment.length > 0) {

                                // call fragmentHandler with just created new image fragment
                                if (fragmentHandler) {
                                    fragmentHandler(response.data.added_fragment);
                                }
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
     * Shows an UI in case the resource could not be inserted as image
     */
    CommonDialogs.handleInsertImageError = function () {
        alert("Sorry, image could not be inserted.");
    };

    // exports ================================================================

    return CommonDialogs;
});
