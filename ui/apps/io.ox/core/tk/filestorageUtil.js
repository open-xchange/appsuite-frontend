/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

// this file contains helper methods for external file storages, such as a method for displaying conflicts
define('io.ox/core/tk/filestorageUtil', [
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'gettext!io.ox/core',
    'less!io.ox/files/style'
], function (ModalDialog, yell, gt) {

    'use strict';

    var util = {
        /* displays conflicts when a filestorage does not support some features like versioning. Offers cancel and ignore warnings function
         conflicts is an object with a title and a warnings array containing strings
         options may have :
            callbackIgnoreConflicts - function that is called when the ignore conflicts button is pressed
            callbackCancel - function that is called when the ignore cancel button is pressed
         if there is no callback function only an OK button is drawn
        */
        displayConflicts: function (conflicts, options) {
            options = options || {};
            var dialog = new ModalDialog({ title: gt('Conflicts') });
            if (!options.callbackCancel && !options.callbackIgnoreConflicts) {
                dialog.addButton({ label: gt('Ok'), action: 'ok' });
            } else {
                dialog.addCancelButton()
                    .addButton({ label: gt('Ignore warnings'), action: 'ignorewarnings' });
            }
            dialog.build(function () {
                // build a list of warnings
                var warnings = _(conflicts.warnings).map(function (warning) {
                    return $('<div class="filestorage-conflict-warning">').text(warning);
                });
                this.$body.append(
                    $('<div>').text(conflicts.title),
                    warnings.length ? $('<div class="filestorage-conflict-container">').append($('<h4>').text(gt('Warnings:')), warnings) : ''
                );
            })
            .on('ignorewarnings', function () {
                if (options.callbackIgnoreConflicts) options.callbackIgnoreConflicts(conflicts);
            })
            .on('cancel', function () {
                if (options.callbackCancel) options.callbackCancel(conflicts);
                else yell('info', gt('Canceled'));
            })
            .open();
        }
    };
    return util;
});
