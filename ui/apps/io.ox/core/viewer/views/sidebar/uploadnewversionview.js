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

define('io.ox/core/viewer/views/sidebar/uploadnewversionview', [
    'io.ox/backbone/views/disposable',
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/files/util',
    'io.ox/core/extensions',
    'io.ox/core/api/user',
    'io.ox/files/upload/main',
    'gettext!io.ox/core/viewer'
], function (DisposableView, FilesAPI, folderApi, ModalDialog, util, ext, userAPI, fileUpload, gt) {

    'use strict';

    /**
     * The UploadNewVersionView is intended as a sub view of the SidebarView and
     * is responsible for uploading a new file version.
     * It triggers the system file selection dialog and opens the version comment dialog.
     */
    var UploadNewVersionView = DisposableView.extend({

        className: 'viewer-uploadnewversion',

        events: {
            'change input[type="file"]': 'onFileSelected'
        },

        /**
         * Handle file input change events.
         * Gets the file object, opens a version comment dialog and uploads
         * the file as new version.
         */
        onFileSelected: function (event) {
            event.preventDefault();
            if (!(folderApi.pool.getModel(this.model.get('folder_id')).supports('extended_metadata'))) return this.upload();

            var self = this;

            new ModalDialog({ title: gt('Version Comment') })
                .addCancelButton()
                .addButton({ label: gt('Upload'), action: 'upload' })
                .build(function () {
                    this.$body.append(
                        $('<textarea rows="6" class="form-control comment">')
                    );
                })
                .on('upload', function () {
                    var comment = this.$body.find('textarea.comment').val() || '';
                    // upload file
                    self.upload(comment);
                })
                .on('cancel', function () {
                    // reset file input
                    _.first(self.$('input[type="file"]')).value = '';
                })
                .open();
        },

        getFile: function () {
            return _.first(this.$('input[type="file"]')[0].files);
        },

        upload: function (comment) {
            var newFile = this.getFile();
            var data = {
                    folder: this.model.get('folder_id'),
                    id: this.model.get('id'),
                    // If file already encrypted, update should also be encrypted
                    params: FilesAPI.versions.mustEncryptNewVersion(this.model, newFile.name) ? { 'cryptoAction': 'Encrypt' } : {}
                },
                node = this.app ? this.app.getWindowNode() : this.$el.closest('.io-ox-viewer').find('.viewer-displayer');

            if (folderApi.pool.getModel(this.model.get('folder_id')).supports('extended_metadata')) data.version_comment = comment || '';

            fileUpload.setWindowNode(node);
            fileUpload.update.offer(newFile, data);
        },

        initialize: function (options) {
            options = options || {};
            if (!this.model || !this.model.isFile()) {
                this.$el.hide();
            }
            this.app = options.app;
        },

        render: function () {
            if (!this.model || !this.model.isFile()) return this;
            var self = this;

            // check if the user has permission to upload new versions
            $.when(folderApi.get(this.model.get('folder_id')), userAPI.get()).done(function (folderData, userData) {

                if (this.disposed) return;
                if (util.hasStatus('lockedByOthers', { context: this.model.attributes })) return;
                if (!folderApi.can('add:version', folderData)) return;

                // try to find available permissions
                if (!folderApi.can('write', folderData)) {
                    var array = self.model.get('object_permissions') || self.model.get('com.openexchange.share.extendedObjectPermissions') || [],
                        myself = _(array).findWhere({ entity: ox.user_id });
                    // check if there is a permission for a group, the user is a member of
                    // use max permissions available
                    if ((!myself || (myself && myself.bits < 2)) && _(array).findWhere({ group: true })) {
                        myself = _(array).findWhere({ entity: _(_.pluck(array, 'entity')).intersection(userData.groups)[0] });
                    }
                    if (!(myself && (myself.bits >= 2))) return;
                }

                // add file upload widget
                var $el = this.$el;
                require(['io.ox/core/tk/attachments'], function (Attachments) {
                    $el.append(
                        Attachments.fileUploadWidget({
                            multi: false,
                            buttontext: gt('Upload new version')
                        })
                    );
                    // Extension point required for Guard implementation
                    ext.point('io.ox/core/viewer/views/sidebarview/uploadnewversion').invoke('draw', this);
                }.bind(this));
            }.bind(this));
            return this;
        },

        /**
         * Destructor function of this view.
         */
        onDispose: function () {
            if (this.model) this.model = null;
        }

    });

    return UploadNewVersionView;
});
