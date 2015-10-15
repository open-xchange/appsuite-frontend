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
    'io.ox/core/extensions',
    'settings!io.ox/files',
    'gettext!io.ox/core/viewer'
], function (DisposableView, FilesAPI, folderApi, Dialogs, util, ext, settings, gt) {

    'use strict';

    var POINT = 'io.ox/core/viewer/upload-new-version',
        // TODO: switch to related capability when available
        COMMENTS = settings.get('features/comments', true);

    /**
     * notifications lazy load
     */
    function notify() {
        var self = this, args = arguments;
        require(['io.ox/core/notifications'], function (notifications) {
            notifications.yell.apply(self, args);
        });
    }

    /**
     * dialog
     */
    ext.point(POINT + '/dialog').extend({
        index: 100,
        id: 'header',
        draw: function (baton) {
            // version comment
            baton.$.header(
                $('<h4>').text(gt('Version Comment'))
            );
        }
    });

    ext.point(POINT + '/dialog').extend({
        index: 200,
        id: 'body',
        draw: function (baton) {
            baton.$.append(
                $('<textarea rows="6" class="form-control comment" tabindex="1">')
            );
        }
    });

    ext.point(POINT + '/dialog').extend({
        index: 300,
        id: 'primary',
        draw: function (baton) {
            var self = this;
            baton.$.addPrimaryButton('upload', gt('Upload'), 'upload',  { 'tabIndex': '1' })
                .on('upload', function () {
                    var comment = baton.$.getContentNode().find('textarea.comment').val() || '';
                    // upload file
                    self.upload(comment);
                });
        }
    });

    ext.point(POINT + '/dialog').extend({
        index: 400,
        id: 'cancel',
        draw: function (baton) {
            baton.$.addButton('cancel', gt('Cancel'), 'cancel',  { 'tabIndex': '1' });
        }
    });

    ext.point(POINT + '/dialog').extend({
        index: 500,
        id: 'show',
        draw: function (baton) {
            baton.$.show(function () {
                this.find('.btn-primary').focus();
            });
        }
    });
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

            if (!COMMENTS) return this.upload();

            // open dropdown for
            var baton = ext.Baton({
                    data: this.getFile(),
                    $: new Dialogs.ModalDialog()
                });
            // draw modal body
            ext.point(POINT + '/dialog').invoke('draw', this, baton);

        },

        getFile: function () {
            return _.first(this.$('input[type="file"]')[0].files);
        },

        upload: function (comment) {
            var data = {
                    file: this.getFile(),
                    id: this.model.get('id'),
                    folder: this.model.get('folder_id')
                };

            if (COMMENTS) data.version_comment = comment || '';

            FilesAPI.versions.upload(data).fail(notify);
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
