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

define('io.ox/office/tk/dialogs',
    ['io.ox/core/tk/dialogs',
     'io.ox/office/tk/utils',
     'gettext!io.ox/office/main'
    ], function (CoreDialogs, Utils, gt) {

    'use strict';

    // private helper functions ===============================================

    /**
     * Creates and returns an empty modal dialog object.
     *
     * @param {String} title
     *  The title of the dialog window.
     *
     * @returns {CoreDialogs.ModalDialog}
     *  The new dialog object.
     */
    function createModalDialog(title) {
        return new CoreDialogs.ModalDialog({ width: 400, easyOut: true }).header($('<h4>').text(title));
    }

    // static class Dialogs ===================================================

    var Dialogs = {};

    // methods ----------------------------------------------------------------

    /**
     * Shows a simple text input dialog.
     *
     * @param {String} title
     *  The title of the dialog window.
     *
     * @param {Object} [options]
     *  Additional options that control the appearance and behavior of the
     *  dialog. The following options are supported:
     *  @param {String} [value='']
     *      The initial value of the text field.
     *  @param {String} [placeholder='']
     *      The place-holder text that will be shown in the empty text field.
     *  @param {String} [buttonLabel=gt('OK')]
     *      The label of the primary button that triggers the intended action
     *      by resolving the promise object returned by this method.
     *
     * @returns {jQuery.Promise}
     *  The promise of a deferred object that will be resolved if the primary
     *  button has been activated, or rejected if the dialog has been canceled.
     *  The done handlers registered at the promise object will receive the
     *  entered text.
     */
    Dialogs.showTextDialog = function (title, options) {

        var // the text input field
            input = $('<input>', {
                    placeholder: Utils.getStringOption(options, 'placeholder', ''),
                    value: Utils.getStringOption(options, 'value', '')
                }),

            // the label of the primary button
            buttonLabel = Utils.getStringOption(options, 'buttonLabel', gt('OK')),

            // the dialog object
            dialog = createModalDialog(title)
                .append(input.addClass('nice-input'))
                .addButton('cancel', gt('Cancel'))
                .addPrimaryButton('action', buttonLabel),

            // the result deferred
            def = $.Deferred();

        // show the dialog and register listeners for the results
        dialog.show(function () {
            input.focus();
        })
        .done(function (action, data, node) {
            if (action === 'action') {
                def.resolve(input.val());
            } else {
                def.reject();
            }
        }).fail(function () {
            def.reject();
        });

        return def.promise();
    };

    /**
     * Shows a generic file selector dialog.
     *
     * @param {String} title
     *  The title of the dialog window.
     *
     * @param {Object} [options]
     *  Additional options that control the appearance and behavior of the
     *  dialog. The following options are supported:
     *  @param {String} [filter='*']
     *      The filter string restricting the type of files that will be able
     *      to select.
     *  @param {String} [placeholder='']
     *      The place-holder text that will be shown in the empty text field.
     *  @param {String} [buttonLabel=gt('OK')]
     *      The label of the primary button that triggers the intended action
     *      by resolving the promise object returned by this method.
     *
     * @returns {jQuery.Promise}
     *  The promise of a deferred object that will be resolved if the primary
     *  button has been activated, or rejected if the dialog has been canceled.
     *  The done handlers registered at the promise object will receive the
     *  file descriptor object of the selected file.
     */
    Dialogs.showFileDialog = function (title, options) {

        var // the text input field
            input = $('<input>', {
                    placeholder: Utils.getStringOption(options, 'placeholder', ''),
                    value: '',
                    name: 'files[]',
                    type: 'file',
                    accept: Utils.getStringOption(options, 'filter', '*')
                }),

            // the label of the primary button
            buttonLabel = Utils.getStringOption(options, 'buttonLabel', gt('OK')),

            // the dialog object
            dialog = createModalDialog(title)
                .append(input.addClass('nice-input'))
                .addButton('cancel', gt('Cancel'))
                .addPrimaryButton('action', buttonLabel),

            // the file descriptor of the file currently selected
            file = null,

            // the result deferred
            def = $.Deferred();

        // register a change handler at the input field that extracts the file descriptor
        input.change(function (event) { file = event.target.files[0] || null; });

        // show the dialog and register listeners for the results
        dialog.show(function () {
            input.focus();
        })
        .done(function (action, data, node) {
            if ((action === 'action') && _.isObject(file)) {
                def.resolve(file);
            } else {
                def.reject();
            }
        }).fail(function () {
            def.reject();
        });

        return def.promise();
    };

    // exports ================================================================

    return Dialogs;

});
