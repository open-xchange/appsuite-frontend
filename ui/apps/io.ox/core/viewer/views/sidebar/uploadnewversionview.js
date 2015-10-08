/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */

define('io.ox/core/viewer/views/sidebar/uploadnewversionview', [
    'io.ox/backbone/disposable',
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/core/tk/dialogs',
    'io.ox/files/util',
    'gettext!io.ox/core/viewer'
], function (DisposableView, FilesAPI, folderApi, Dialogs, util, gt) {

    'use strict';

    /**
     * notifications lazy load
     */
    function notify () {
        var self = this, args = arguments;
        require(['io.ox/core/notifications'], function (notifications) {
            notifications.yell.apply(self, args);
        });
    }

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
            var model = this.model,
                files = this.$('input[type="file"]')[0].files;

            event.preventDefault();

            new Dialogs.ModalDialog()
            .header(
                $('<h4>').text(gt('Version Comment'))
            )
            .append(
                $('<textarea rows="6" class="form-control" tabindex="1">')
            )
            .addPrimaryButton('upload', gt('Upload'), 'upload',  { 'tabIndex': '1' })
            .addButton('cancel', gt('Cancel'), 'cancel',  { 'tabIndex': '1' })
            .on('upload', function () {
                var comment = this.getContentNode().find('textarea').val() || '';

                FilesAPI.versions.upload({
                    file: _.first(files),
                    id: model.get('id'),
                    folder: model.get('folder_id'),
                    version_comment: comment
                })
                .fail(notify);
            })
            .show(function () {
                this.find('.btn-primary').focus();
            });
        },

        initialize: function () {
            // attach event handlers
            this.on('dispose', this.disposeView.bind(this));
            if (!this.model || !this.model.isFile()) {
                this.$el.hide();
            }
        },

        render: function () {
            if (!this.model || !this.model.isFile()) return this;
            // check if the user has permission to upload new versions
            folderApi.get(this.model.get('folder_id')).done(function (folderData) {

                if (this.disposed || !folderApi.can('write', folderData) || util.hasStatus('lockedByOthers', { context: this.model.attributes })) return;

                // add file upload widget
                var $el = this.$el;
                require(['io.ox/core/tk/attachments'], function (Attachments) {
                    $el.append(
                        Attachments.fileUploadWidget({
                            multi: false,
                            buttontext: gt('Upload new version')
                        })
                    );
                });
            }.bind(this));
            return this;
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            if (this.model) {
                this.model = null;
            }
        }

    });

    return UploadNewVersionView;
});
