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
     * Adds OK and Cancel buttons to the passed dialog.
     */
    function addDialogButtons(dialog, options) {
        dialog.addButton('cancel', Utils.getStringOption(options, 'cancelLabel', gt('Cancel')))
            .addPrimaryButton('ok', Utils.getStringOption(options, 'okLabel', gt('OK')));
    }

    // static class Dialogs ===================================================

    var Dialogs = {};

    // methods ----------------------------------------------------------------

    /**
     * Creates and returns an empty modal dialog.
     *
     * @param {Object} [options]
     *  Additional options that control the appearance and behavior of the
     *  dialog. The following options are supported:
     *  @param {String} [options.title]
     *      The title of the dialog window that will be shown in a larger font.
     *  @param {Boolean} [options.async]
     *      Whether the dialog will be opened in asynchronous mode.
     *
     * @returns {CoreDialogs.ModalDialog}
     *  A modal dialog object initialized with options.
     */
    Dialogs.createDialog = function (options) {

        var // create the dialog instance
            dialog = new CoreDialogs.ModalDialog({
                width: Utils.getIntegerOption(options, 'width', 400),
                async: Utils.getBooleanOption(options, 'async', false)
            }),
            // the title text
            title = Utils.getStringOption(options, 'title');

        // add title
        if (_.isString(title)) {
            dialog.header($('<h4>').text(title));
        }

        return dialog;
    };

    /**
     * Shows a simple OK/Cancel dialog with customizable button texts.
     *
     * @param {Object} [options]
     *  Additional options that control the appearance and behavior of the
     *  dialog. The following options are supported:
     *  @param {String} [options.title]
     *      The title of the dialog window that will be shown in a larger font.
     *  @param {String} [options.message]
     *      If specified, the message shown in the dialog body.
     *  @param {String} [options.okLabel=gt('OK')]
     *      The label of the primary OK button that resolves the promise object
     *      returned by this method.
     *  @param {String} [options.cancelLabel=gt('Cancel')]
     *      The label of the Cancel button that rejects the promise object
     *      returned by this method.
     *
     * @returns {jQuery.Promise}
     *  The promise of a deferred object that will be resolved if the dialog
     *  has been confirmed, or rejected if the dialog has been canceled.
     */
    Dialogs.showOkCancelDialog = function (options) {

        var // the dialog object
            dialog = Dialogs.createDialog(options),

            // the message text
            message = Utils.getStringOption(options, 'message'),

            // the result deferred
            def = $.Deferred();

        // add the message text
        if (_.isString(message)) {
            dialog.text(message);
        }

        // add OK and Cancel buttons
        addDialogButtons(dialog, options);

        // show the dialog and register listeners for the results
        dialog.show().done(function (action, data, node) {
            def[(action === 'ok') ? 'resolve' : 'reject']();
        });

        return def.promise();
    };

    /**
     * Shows a simple Yes/No dialog with customizable button texts. This is a
     * slightly modified version of the Dialogs.showOkCancelDialog() method
     * with modified defaults for the dialog buttons.
     *
     * @param {Object} [options]
     *  Additional options that control the appearance and behavior of the
     *  dialog. The following options are supported:
     *  @param {String} [options.title]
     *      If specified, the title of the dialog window that will be shown in
     *      a larger font.
     *  @param {String} [options.message]
     *      If specified, the message shown in the dialog body.
     *  @param {String} [options.okLabel=gt('Yes')]
     *      The label of the primary Yes button that resolves the promise
     *      object returned by this method.
     *  @param {String} [options.cancelLabel=gt('No')]
     *      The label of the No button that rejects the promise object returned
     *      by this method.
     *
     * @returns {jQuery.Promise}
     *  The promise of a deferred object that will be resolved if the dialog
     *  has been confirmed, or rejected if the dialog has been canceled.
     */
    Dialogs.showYesNoDialog = function (options) {
        return Dialogs.showOkCancelDialog(Utils.extendOptions({ okLabel: gt('Yes'), cancelLabel: gt('No') }, options));
    };

    /**
     * Shows a simple text input dialog.
     *
     * @param {Object} [options]
     *  Additional options that control the appearance and behavior of the
     *  dialog. The following options are supported:
     *  @param {String} [options.title]
     *      If specified, the title of the dialog window that will be shown in
     *      a larger font.
     *  @param {String} [options.value='']
     *      The initial value of the text field.
     *  @param {String} [options.placeholder='']
     *      The place-holder text that will be shown in the empty text field.
     *  @param {String} [options.okLabel=gt('OK')]
     *      The label of the primary button that triggers the intended action
     *      by resolving the promise object returned by this method.
     *  @param {String} [options.cancelLabel=gt('Cancel')]
     *      The label of the Cancel button that rejects the promise object
     *      returned by this method.
     *
     * @returns {jQuery.Promise}
     *  The promise of a deferred object that will be resolved if the primary
     *  button has been activated, or rejected if the dialog has been canceled.
     *  The done handlers registered at the promise object will receive the
     *  entered text.
     */
    Dialogs.showTextDialog = function (options) {

        var // the text input field
            input = $('<input>', {
                    placeholder: Utils.getStringOption(options, 'placeholder', ''),
                    value: Utils.getStringOption(options, 'value', '')
                }),

            // the dialog object
            dialog = Dialogs.createDialog(options).append(input.addClass('nice-input')),

            // the result deferred
            def = $.Deferred();

        // add OK and Cancel buttons
        addDialogButtons(dialog, options);

        // show the dialog and register listeners for the results
        dialog.show(function () { input.focus(); })
        .done(function (action, data, node) {
            if (action === 'ok') {
                def.resolve(input.val());
            } else {
                def.reject();
            }
        });

        return def.promise();
    };

    /**
     * Shows a generic file selector dialog.
     *
     * @param {Object} [options]
     *  Additional options that control the appearance and behavior of the
     *  dialog. The following options are supported:
     *  @param {String} [options.title]
     *      If specified, the title of the dialog window that will be shown in
     *      a larger font.
     *  @param {String} [options.filter='*']
     *      The filter string restricting the type of files that will be able
     *      to select.
     *  @param {String} [options.placeholder='']
     *      The place-holder text that will be shown in the empty text field.
     *  @param {String} [options.okLabel=gt('OK')]
     *      The label of the primary button that triggers the intended action
     *      by resolving the promise object returned by this method.
     *  @param {String} [options.cancelLabel=gt('Cancel')]
     *      The label of the Cancel button that rejects the promise object
     *      returned by this method.
     *
     * @returns {jQuery.Promise}
     *  The promise of a deferred object that will be resolved if the primary
     *  button has been activated, or rejected if the dialog has been canceled.
     *  The done handlers registered at the promise object will receive the
     *  file descriptor object of the selected file.
     */
    Dialogs.showFileDialog = function (options) {

        var // the text input field
            input = $('<input>', {
                    placeholder: Utils.getStringOption(options, 'placeholder', ''),
                    value: '',
                    name: 'files[]',
                    type: 'file',
                    accept: Utils.getStringOption(options, 'filter', '*')
                }),

            // the dialog object
            dialog = Dialogs.createDialog(options).append(input.addClass('nice-input')),

            // the file descriptor of the file currently selected
            file = null,

            // the result deferred
            def = $.Deferred();

        // add OK and Cancel buttons
        addDialogButtons(dialog, options);

        // register a change handler at the input field that extracts the file descriptor
        input.change(function (event) {
            file = (event.target && event.target.files && event.target.files[0]) || null;  // requires IE 10+
            if ((file === null) && (event.target.value)) {
                file = event.target.value;
            }
        });

        // show the dialog and register listeners for the results
        dialog.show(function () { input.focus(); })
        .done(function (action, data, node) {
            if ((action === 'ok') && (_.isObject(file) || _.isString(file))) {
                def.resolve(file);
            } else {
                def.reject();
            }
        });

        return def.promise();
    };

    // exports ================================================================

    return Dialogs;

});
