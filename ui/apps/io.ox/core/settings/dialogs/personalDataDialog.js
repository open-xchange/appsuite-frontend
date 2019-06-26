/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/settings/dialogs/personalDataDialog', [
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/core',
    'io.ox/backbone/views/modal'
], function (DisposableView, gt, ModalDialog) {

    'use strict';

    var openDialog = function () {
        new ModalDialog({
            title: gt('Personal data'),
            width: 360
        })
        .build(function () {
            this.$body.append(
                $('<div>').text(gt('Please select the data to be included in your download'))
            );
        })
        .addCancelButton({ left: true })
        .addButton({ action: 'generate', label: gt('Generate download') })
        .on('cancel', function () {
        })
        .on('generate', function () {
        })
        .open();
    };

    return {
        openDialog: openDialog
    };

});
