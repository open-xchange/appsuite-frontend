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
     'io.ox/office/tk/image',
     'gettext!io.ox/office/main'
    ], function (Dialogs, Image, gt) {

    'use strict';

    var CommonDialogs = {};

    /**
     * Shows an insert image file dialog
     *
     * @param  app
     */
    CommonDialogs.insertImageFile = function (app, editor) {
        var that = this,
            imageFile = null;

        new Dialogs.ModalDialog({
            width: 400,
            easyOut: true
        })
        .header(
            $('<h4>').text(gt('Insert Image File'))
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
                Image.insertFile(app, editor, that.imageFile);
            }
        });
    };

    /**
     * Shows an insert image file dialog
     *
     * @param  app
     */
    CommonDialogs.insertImageURL = function (app, editor) {
        var that = this,
            imageURL = null;

        new Dialogs.ModalDialog({
            width: 400,
            easyOut: true
        })
        .header(
            $('<h4>').text(gt('Insert Image URL'))
        )
        .append(
            $('<input>', { placeholder: gt('URL'), value: '' })
            .attr('data-property', 'imageURL')
            .addClass('nice-input')
            .change(function (e) {
                that.imageURL = $('input[data-property="imageURL"]').val().trim();
            })
        )
        .addButton('cancel', gt('Cancel'))
        .addPrimaryButton('insert', gt('Insert'))
        .show(function () {
            $('input[data-property="imageURL"]').focus();
        })
        .done(function (action, data, node) {
            if (action === 'insert') {
                if (editor && that.imageURL && (that.imageURL.search("http://") === 0)) {
                    editor.insertImageURL(that.imageURL);
                }
            }
        });
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
