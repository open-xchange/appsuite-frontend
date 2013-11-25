/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/util',
    ['io.ox/core/tk/dialogs',
     'gettext!io.ox/files'
    ], function (dialogs, gt) {

    'use strict';

    return {
        /**
         * shows confirm dialog in case user changes file extension
         * @param  {string} formFilename    filename
         * @param  {string} serverFilename  filename
         * @return {promise} resolves if user confirms or dialogie needen
         */
        confirmDialog: function (formFilename, serverFilename) {
                    //be robust
                    serverFilename = serverFilename || '';

                    var def = $.Deferred(),
                        name = formFilename || '',
                        extServer = serverFilename.indexOf('.') >= 0 ? _.last(serverFilename.split('.')) :  '',
                        extForm = _.last(name.split('.')),
                        $hint = $('<div class="row-fluid muted inset">').append(
                                    $('<small style="padding-top: 8px">').text(
                                        gt('Please note, changing or removing the file extension will cause problems when viewing or editing.')
                                    )
                                ),
                        message;

                    //set message
                    if (name !== '' && name.split('.').length === 1) {
                        //file extension ext missing
                        message = gt('Do you really want to remove the extension ".%1$s" from your filename?', extServer);
                    } else if (extServer !== extForm && extServer !== '') {
                        //ext changed
                        message = gt('Do you really want to change the file extension from  ".%1$s" to ".%2$s" ?', extServer, extForm);
                    }
                    //confirmation needed
                    if (message) {
                        new dialogs.ModalDialog()
                            .header($('<h4>').text(gt('Confirmation')))
                            .append(message, $hint)
                            .addPrimaryButton('rename', gt('Yes'), 'rename', {'tabIndex': '1'})
                            .addButton('change', gt('Adjust'), 'change', {'tabIndex': '1'})
                            .show()
                            .done(function (action) {
                                if (action === 'rename')
                                    def.resolve();
                                else
                                    def.reject();
                            });
                    } else if (name === '') {
                        //usually prevented from ui
                        def.reject();
                    } else {
                        def.resolve();
                    }
                    return def.promise();
                }
    };
});
