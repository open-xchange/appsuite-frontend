/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

// this file contains helper methods for external file storages, such as a method for displaying conflicts
define('io.ox/core/tk/filestorageUtil', [
    'io.ox/core/tk/dialogs',
    'io.ox/core/yell',
    'gettext!io.ox/core',
    'less!io.ox/files/style'
], function (dialogs, yell, gt) {

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
                var popup = new dialogs.ModalDialog(),
                    warnings = [];
                if (!options.callbackCancel && !options.callbackIgnoreConflicts) {
                    popup.addPrimaryButton('ok', gt('Ok'), 'changechange', { tabIndex: 1 });
                } else {
                    popup.addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                        .addPrimaryButton('ignorewarnings', gt('Ignore warnings'), 'changechange', { tabIndex: 1 });
                }
                // build a list of warnings
                _(conflicts.warnings).each(function (warning) {
                    warnings.push($('<div class="filestorage-conflict-warning">').text(warning));
                });
                popup.getBody().append(
                    $('<h4>').text(gt('Conflicts')),
                    $('<div>').text(conflicts.title),
                    warnings.length ? $('<div class="filestorage-conflict-container">').append($('<h4>').text(gt('Warnings:')), warnings) : ''
                );
                popup.show().done(function (action) {
                    if (action === 'ignorewarnings') {
                        if (options.callbackIgnoreConflicts) {
                            options.callbackIgnoreConflicts(conflicts);
                        }
                    } else if (action === 'cancel') {
                        if (options.callbackCancel) {
                            options.callbackCancel(conflicts);
                        } else {
                            yell('info', gt('Canceled'));
                        }
                    }
                });
            }
        };
    return util;
});
