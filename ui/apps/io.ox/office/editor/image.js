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
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/dialog/error'], function (Utils, ErrorDialogs) {

    'use strict';

    // static class Image =====================================================

    /**
     * Provides static helper methods for manipulation and calculation
     * of image nodes.
     */
    var Image = {};

    // static functions =======================================================

    /**
     * Checking, if at least one property of the attributes is
     * relevant for images.
     *
     * @param {Object} attr
     *  A map with formatting attribute values, mapped by the attribute
     *  names.
     *
     * @returns {Boolean} containsImageProperty
     *  A boolean value, indicating if the properties are relevant for
     *  images.
     */
    Image.containsImageAttributes = function (attributes) {

        var allImageAttributes = ['inline',
                                  'width',
                                  'height',
                                  'marginl',
                                  'margint',
                                  'marginr',
                                  'marginb',
                                  'anchorhbase',
                                  'anchorhalign',
                                  'anchorhoffset',
                                  'anchorvbase',
                                  'anchorvalign',
                                  'anchorvoffset',
                                  'textwrapmode',
                                  'textwrapside'];

        return _.any(allImageAttributes, function (attr) { return (attr in attributes); });
    };

    /**
     * Inserts the image from the specified file into a document.
     *
     * @param {io.ox.App} app
     *  The application object representing the edited document.
     *
     * @param {Object} file
     *  The file object describing the image file to be inserted.
     *
     * @param {Boolean} [showError]
     *  If set to true, an alert box is shown in case of an error. Otherwise,
     *  errors are silently ignored.
     */
    Image.insertFile = function (app, file, showError) {
        if (_.isObject(file) && _.isFunction(window.FileReader)) {
            var fileReader = new window.FileReader();

            fileReader.onload = function (e) {
                if (e.target.result) {
                    $.ajax({
                        type: 'POST',
                        url: app.getDocumentFilterUrl('addfile', { add_filename: file.name }),
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
                            // the insertion of the image was successful
                            if (_.isString(response.data.added_fragment) && (response.data.added_fragment.length > 0)) {

                                // set version of FileDescriptor to version that is returned in response
                                app.getFileDescriptor().version = response.data.version;

                                // create an InsertImage operation with the newly added fragment
                                app.getEditor().insertImageFile(response.data.added_fragment);
                            }
                            else if (showError) {
                                ErrorDialogs.insertImageError();
                            }
                        }
                    })
                    .fail(function (response) {
                        if (showError) {
                            ErrorDialogs.insertImageError();
                        }
                    });
                }
            };

            if (showError) {
                fileReader.onerror = ErrorDialogs.insertImageError;
            }

            fileReader.readAsDataURL(file);
        }
    };

    /**
     * Inserts the image specified by a URL into a document.
     *
     * @param {io.ox.App} app
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
            ErrorDialogs.insertImageError();
        }
    };

    // exports ================================================================

    return Image;

});
