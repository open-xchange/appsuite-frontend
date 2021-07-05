/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/files/actions/save-as-pdf', [
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/core/tk/doc-converter-utils',
    'gettext!io.ox/files'
], function (FolderApi, FilesApi, ext, ModalDialog, ConverterUtils, gt) {

    'use strict';

    return function (baton) {

        //      newFileName = oldFileName;
        //      title = gt('Save as PDF');
        //
        //      // create the dialog
        //      dialog = new Dialogs.SaveAsFileDialog({ title: title, value: newFileName, preselect: app.getFileParameters().folder_id });

        var
        //  data     = baton.data,
            model    = baton.models[0],

            isAccessWrite = FolderApi.can('create', FolderApi.pool.models[model.get('folder_id')].toJSON()),

            filename = model.getDisplayName(),

            len      = filename.length,
            idx      = filename.lastIndexOf('.'),

            errorMessage;

        filename = filename.substring(0, ((idx >= 0) ? idx : len));

        //console.log('+++ io.ox/files/actions/save-as-pdf :: data, model, filename : ', data, model, filename);
        //console.log('+++ io.ox/files/actions/save-as-pdf :: isAccessWrite : ', isAccessWrite);

        function save(name) {
            var fileOptions = {
                documentformat: 'pdf',
                saveas_filename: name + '.pdf',
                saveas_folder_id: (isAccessWrite ? model.get('folder_id') : require('settings!io.ox/files').get('folder/documents'))
            };
            return ConverterUtils.sendConverterRequest(model, fileOptions)
            .done(function (response) {
                //console.log('+++ save as pdf :: done - response : ', response);

                if (('id' in response) && ('filename' in response)) {
                    /**
                     *  fixing Bug #63558 ... "Save as pdf:=> JQuery exception"
                     *
                     *  - rejected promise was due to not providing `FilesApi.trigger`
                     *    with a minimal viable file descriptor which was expected with
                     *    introducing `api.on('add:file add:version', preconvertPDF);`
                     *    as of "ui/apps/io.ox/files/main.js"
                     */
                    FilesApi.trigger('add:file', { id: response.id, folder_id: fileOptions.saveas_folder_id });

                    if (!isAccessWrite) {
                        notify('info', 'The PDF has been saved to "/drive/myfiles/documents" due to not having write access for the current folder.');
                    }
                } else {
                    errorMessage = ConverterUtils.getErrorTextFromResponse(response) || ConverterUtils.getErrorText('importError');
                    notify('error', errorMessage);
                }
            })
            .fail(function (response) {
                notify('error', ConverterUtils.getErrorTextFromResponse(response));
            });
        }

        // notifications lazy load
        function notify() {
            var self = this, args = arguments;
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.yell.apply(self, args);
            });
        }

        /**
         * user have to confirm if name doesn't contains a file extension
         * @return { promise }
         */
        function process(name) {

            var invalid;

            // taken and refactored from 'io.ox/files/actions/rename'
            // TODO - Olpe please check if processing of `invalid` does ever take place - I doubt it though.
            //
            // check for valid filename
            ext.point('io.ox/core/filename')
                .invoke('validate', null, name, 'file')
                .find(function (result) {
                    if (result !== true) {
                        notify('warning', result);
                        return (invalid = true);
                    }
                });

            if (invalid) return $.Deferred().reject();

            // show confirm dialog if necessary
            return save.call(this, name);
        }

        new ModalDialog({ title: gt('Save as PDF'), enter: 'save', async: true })
            .build(function () {
                this.$body.append(
                    this.$input = $('<input type="text" name="name" class="form-control">')
                );
                this.$input.focus().val(filename).get(0).setSelectionRange(0, filename.lastIndexOf('.'));
            })
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'save' })
            .on('save', function () {
                var name = this.$input.val();
                process(name).then(this.close, this.idle).fail(function () {
                    _.defer(function () { this.$input.focus(); });
                });
            })
            .open();

    };
});
