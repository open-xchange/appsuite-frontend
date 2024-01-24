/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/files/actions/upload-new-version', [
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/tk/attachments',
    'gettext!io.ox/files'
], function (FilesAPI, folderApi, ModalDialog, Attachments, gt) {

    'use strict';

    return function (data) {

        /**
         * notifications lazy load
         */
        function notify() {
            var self = this, args = arguments;
            require(['io.ox/core/yell'], function (yell) {
                yell.apply(self, args);
            });
        }

        // Check if previous file was encrypted
        function isEncrypted() {
            return (data.meta && data.meta.Encrypted);
        }

        /**
         * Process the upload of the new version.
         *
         * @param { File } file
         *  The file object to upload.
         * @param { String } [comment = '']
         *  The version comment (optional).
         * @return { jQuery.Promise }
         *  The upload result promise.
         */
        function process(file, comment) {
            if (!file) { return $.Deferred().reject(); }
            var obj = {
                file: file,
                id: data.id,
                folder: data.folder_id,
                version_comment: comment || '',
                params: isEncrypted() ? { 'cryptoAction': 'Encrypt' } : {} // If previous file encrypted new version should also be
            };

            if (folderApi.pool.getModel(data.folder_id).supports('extended_metadata')) {
                obj.version_comment = comment || '';
            }
            return FilesAPI.versions.upload(obj)
            .fail(notify);
        }

        var $input = Attachments.fileUploadWidget({
                multi: false,
                buttontext: gt('Select file')
            }),
            filename = $('<div class="form-group">').css('font-size', '14px').hide();

        new ModalDialog({ title: gt('Upload new version'), async: true })
            .build(function () {
                this.$body.append(
                    $input.on('change', function () {
                        if ($input.find('input[type="file"]')[0].files.length === 0) {
                            filename.text('').hide();
                        } else {
                            filename.text($input.find('input[type="file"]')[0].files[0].name).show();
                        }
                    }),
                    filename,
                    folderApi.pool.getModel(data.folder_id).supports('extended_metadata') ? $('<textarea rows="6" class="form-control">') : ''
                );
            })
            .addCancelButton()
            .addButton({ label: gt('Upload'), action: 'upload' })
            .on('upload', function () {
                var $node = this.$body,
                    files = $node.find('input[type="file"]')[0].files,
                    comment = (folderApi.pool.getModel(data.folder_id).supports('extended_metadata') ? $node.find('textarea').val() : '');

                process(_.first(files), comment).then(this.close, this.idle)
                .fail(function () {
                    if (files.length === 0) notify('info', gt('You have to select a file to upload.'));
                    _.defer(function () { $node.focus(); });
                });
            })
            .open();
    };
});
