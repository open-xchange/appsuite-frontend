/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2013
 * Mail: info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/util',
    ['io.ox/core/tk/dialogs',
     'gettext!io.ox/files'], function (dialogs, gt) {

    'use strict';

    return {
        /**
         * shows confirm dialog in case user changes file extension
         * @param  {string} formvalue    filename
         * @param  {string} servervalue  filename
         * @return {promise} resolves if user confirms or dialogie needen
         */
        confirmDialog: function (formvalue, servervalue) {
                    var def = $.Deferred(),
                        name = formvalue,
                        extServer = servervalue.indexOf('.') >= 0 ? _.last(servervalue.split('.')) :  '',
                        extForm = _.last(name.split('.')),
                        $hint = $('<div class="row-fluid muted inset">').append(
                                    '<small style="padding-top: 8px">' +
                                        gt('Please note, changing/removing will cause problems by viewing and editing.') +
                                        '</small>'
                                ),
                        message;

                    //set message
                    if (name.split('.').length === 1) {
                        //file extensionext missing
                        message = gt('Do you really want to remove the extension ".%1$s" from your filename?', extServer);
                    } else if (extServer !== extForm && extServer !== '') {
                        //ext changed
                        message = gt('Do you really want to change the file extension from  ".%1$s" to ".%2$s" ?', extServer, extForm);
                    }
                    //missing extension
                    if (message) {
                        new dialogs.ModalDialog()
                            .header($('<h4>').text(gt('Confirmation')))
                            .append(message)
                            .append($hint)
                            .addPrimaryButton('rename', gt('Yes'))
                            .addButton('change', gt('Adjust'))
                            .show()
                            .done(function (action) {
                                if (action === 'rename')
                                    def.resolve();
                                else
                                    def.reject();
                            });
                    } else {
                        def.resolve();
                    }
                    return def.promise();
                }

    };
});
