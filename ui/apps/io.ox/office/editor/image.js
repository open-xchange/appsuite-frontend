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
 * @author Ingo Schmidt-Rosbiegal <ingo.schmidt-rosbiegal@open-xchange.com>
 */

define('io.ox/office/editor/image',
    ['io.ox/office/tk/apphelper',
     'io.ox/office/tk/dialogs',
     'gettext!io.ox/office/main'
    ], function (AppHelper, Dialogs, gt) {

    'use strict';

    /**
     * Shows an error box if a resource could not be inserted as image.
     */
    function insertImageError() {
        alert(gt("Sorry, image could not be inserted."));
    }

    // static class Image =====================================================

    /**
     * Provides static helper methods for manipulation and calculation
     * of image nodes.
     */
    var Image = {};

    // static functions =======================================================

    /**
     * Shows an insert image file dialog
     *
     * @param  app the current application
     */
    Image.insertFileDialog = function (app) {
        Dialogs.showFileDialog({
            title: gt('Select Image File'),
            filter: 'image/*',
            placeholder: gt('URL'),
            okLabel: gt('Insert')
        })
        .done(function (file) {
            Image.insertFile(app, file, true);
        });
    };

    /**
     * Inserts the image from the specified file into a document.
     *
     * @param {ox.ui.App} app
     *  The application object representing the edited document.
     *
     * @param {File} file
     *  The file object describing the image file to be inserted.
     *
     * @param {Boolean} [showError]
     *  If set to true, an alert box is shown in case of an error. Otherwise,
     *  errors are silently ignored.
     */
    Image.insertFile = function (app, file, showError) {

        var // the error handler function that shows an error box if requested
            errorHandler = showError ? insertImageError : $.noop;

        AppHelper.readFileAsDataUrl(file)
        .done(function (dataUrl) {

            var uniqueName = _.uniqueId(ox.session + '_') + file.name.substring(file.name.lastIndexOf('.'));
            $.ajax({
                type: 'POST',
                url: app.getDocumentFilterUrl('addfile', { add_filename: uniqueName, alt_filename: file.name }),
                dataType: 'json',
                data: { add_filedata: dataUrl },
                beforeSend: function (xhr) {
                    if (xhr && xhr.overrideMimeType) {
                        xhr.overrideMimeType('application/j-son;charset=UTF-8');
                    }
                }
            })
            .done(function (response) {

                var // the name of the image fragment in the document on the server
                    fragmentName = (response && response.data) ? response.data.added_filename : null;

                // if fragmentName is a valid string, the insertion of the image was successful
                if (_.isString(fragmentName) && (fragmentName.length > 0)) {
                    // set version of file descriptor to version that is returned in response
                    // app.getFileDescriptor().version = response.data.version;
                    // create the insertImage operation with the newly added fragment
                    app.getEditor().insertImageFile(fragmentName);
                } else {
                    errorHandler();
                }
            })
            .fail(errorHandler);
        })
        .fail(errorHandler);
    };

    /**
     * Shows an insert image file dialog
     *
     * @param  app the current application
     */
    Image.insertURLDialog = function (app) {
        Dialogs.showTextDialog({
            title: gt('Enter Image URL'),
            placeholder: gt('URL'),
            okLabel: gt('Insert')
        })
        .done(function (url) {
            Image.insertURL(app, url.trim(), true);
        });
    };

    /**
     * Inserts the image specified by a URL into a document.
     *
     * @param {ox.ui.App} app
     *  The application object representing the edited document.
     *
     * @param {String} url
     *  The full URL of the image to be inserted.
     *
     * @param {Boolean} [showError]
     *  If set to true, an alert box is shown in case of an error. Otherwise,
     *  errors are silently ignored.
     */
    Image.insertURL = function (app, url, showError) {
        if (_.isString(url) && /:\/\//.test(url)) {
            app.getEditor().insertImageURL(url);
        } else if (showError) {
            insertImageError();
        }
    };

    // exports ================================================================

    return Image;

});
