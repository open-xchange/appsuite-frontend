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
     'gettext!io.ox/office/main'
    ], function (Dialogs, gt) {

    'use strict';

    var CommonDialogs = {};

    CommonDialogs.insertImageDialog = function (cbFilename) {

        var
            self = this;

        new Dialogs.ModalDialog({
            width: 400,
            easyOut: true
        })
        .header(
            $('<h4>').text(gt('Insert Image'))
        )
        .append(
            $('<input>', { placeholder: gt('Filename'), value: '' })
            .attr('type', 'file')
            .attr('accept', 'image/*')
            .attr('data-property', 'filename')
            .addClass('nice-input')
        )
        .addButton('cancel', gt('Cancel'))
        .addPrimaryButton('insert', gt('Insert'))
        .show(function () {
            this.find('input').focus();
        })
        .done(function (action, data, node) {
            if (action === 'upload') {
                cbFilename($.trim($(node).find('[data-property="filename"]').val()));
            }
        });
    };

    // exports ================================================================

    return CommonDialogs;
});
