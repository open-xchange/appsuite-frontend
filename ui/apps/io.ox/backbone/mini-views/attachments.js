/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/mini-views/attachments',
    ['io.ox/backbone/mini-views/abstract',
     'io.ox/core/api/attachment',
     'io.ox/core/tk/attachments',
     'io.ox/core/strings',
     'gettext!io.ox/core'
    ], function (AbstractView, api, attachments, strings, gt) {

    'use strict';

    var counter = 0;

    var ListView = AbstractView.extend({

        tagName: 'div',
        className: 'attachment-list',

        events: {
            'click .attachment .remove': 'onDeleteAttachment'
        },

        onDeleteAttachment: function (e) {
            e.preventDefault();
            var attachment = $(e.target).data();
            this.deleteAttachment(attachment);
        },

        setup: function () {

            var self = this;

            this.oldMode = _.browser.IE < 10;
            this.attachmentsToAdd = [];
            this.attachmentsToDelete = [];
            this.attachmentsOnServer = [];
            this.allAttachments = [];
            this.form = $();

            this.loadAttachments();

            this.listenToOnce(this.model, 'create update', function (response) {

                var id = self.model.get('id'),
                    folder = self.model.get('folder') || self.model.get('folder_id');

                if (id === undefined && response !== undefined) id = response.id;

                if (folder && id) self.save(id, folder);
            });

            this.$el.data('view', this);
        },

        finishedCallback: function (model, id) {
            model.trigger("finishedAttachmentHandling");
        },

        render: function () {

            if (this.allAttachments.length === 0) {
                this.$el.append(
                    $('<span>').text(gt('No attachments'))
                );
            }

            this.$el.append(
                _(this.allAttachments).map(this.renderAttachment)
            );

            return this;
        },

        renderAttachment: function (attachment) {

            var size = attachment.file_size > 0 ? strings.fileSize(attachment.file_size) : '\u00A0';

            return $('<div class="attachment">').append(
                $('<i class="icon-paper-clip">'),
                $('<div class="row-1">').text(attachment.filename),
                $('<div class="row-2">').append(
                    $('<span class="filesize">').text(size)
                ),
                $('<a href="#" class="remove" tabindex="1" title="Remove attachment">')
                .data(attachment)
                .append(
                    $('<i class="icon-trash">')
                )
            );
        },

        loadAttachments: function () {
            var self = this;
            if (this.model.id) {
                api.getAll({ module: this.options.module, id: this.model.id, folder: this.model.get('folder') || this.model.get('folder_id')})
                .done(function (attachments) {
                    self.attachmentsOnServer = attachments;
                    self.updateState();
                });
            }
        },

        updateState: function () {
            var self = this;
            this.allAttachments = _(this.attachmentsOnServer.concat(this.attachmentsToAdd)).reject(function (attachment) {
                return _(self.attachmentsToDelete).any(function (toDelete) {
                    return toDelete.id === attachment.id;
                });
            });
            this.attachmentsChanged();
        },

        attachmentsChanged: function () {
            this.$el.empty();
            this.render();
        },

        addFile: function (file) {
            if (this.oldMode) {
                this.addAttachment({file: file.hiddenField, newAttachment: true, cid: counter++, filename: file.name, file_size: file.size});
            } else {
                this.addAttachment({file: file, newAttachment: true, cid: counter++, filename: file.name, file_size: file.size});
            }
        },

        addAttachment: function (attachment) {
            this.attachmentsToAdd.push(attachment);
            this.updateState();
        },

        deleteAttachment: function (attachment) {
            if (attachment.newAttachment) {
                this.attachmentsToAdd = _(this.attachmentsToAdd).reject(function (att) {
                    return att.cid === attachment.cid;
                });
                if (this.oldMode) {
                    attachment.file.remove();
                }
            } else {
                this.attachmentsToDelete.push(attachment);
            }
            this.updateState();
        },

        save: function (id, folderId) {
            var self = this,
                allDone = 0;//0 ready 1 delete 2 add 3 delete and add
            var apiOptions = {
                module: this.module,
                id: id || this.model.id,
                folder: folderId || this.model.get('folder') || this.model.get('folder_id')
            };
            if (this.attachmentsToDelete.length) {
                allDone++;
            }
            if (this.attachmentsToAdd.length) {
                allDone += 2;
            }
            if (this.attachmentsToDelete.length) {
                api.remove(apiOptions, _(this.attachmentsToDelete).pluck('id')).fail(function (resp) {
                    self.model.trigger('backendError', resp);
                }).done(function () {
                    allDone--;
                    if (allDone <= 0) { self.finishedCallback(self.model, id); }
                });
            }

            if (this.attachmentsToAdd.length) {
                if (this.oldMode) {
                    // TODO: fix form
                    api.createOldWay(apiOptions, self.form).fail(function (resp) {
                        self.model.trigger('backendError', resp);
                    }).done(function () {
                        allDone -= 2;
                        if (allDone <= 0) { self.finishedCallback(self.model, id); }
                    });
                } else {
                    api.create(apiOptions, _(this.attachmentsToAdd).pluck('file')).fail(function (resp) {
                        self.model.trigger('backendError', resp);
                    }).done(function () {
                        allDone -= 2;
                        if (allDone <= 0) { self.finishedCallback(self.model, id); }
                    });
                }
            }

            if (allDone <= 0) { self.finishedCallback(self.model, id); }

            this.attachmentsToAdd = [];
            this.attachmentsToDelete = [];
            this.attachmentsOnServer = [];

            this.allAttachments = [];
        }
    });

    var UploadView = AbstractView.extend({

        className: 'contact_attachments_buttons',

        render: function () {

            var self = this;

            var uploadWidget = attachments.fileUploadWidget({
                displayButton: false,
                multi: true,
                wrapperClass: 'form-horizontal control-group'
            });

            var $input = uploadWidget.find('input[type="file"]')
                .on('change', function (e) {
                    e.preventDefault();
                    var list = self.$el.closest('form').find('.attachment-list').data('view');
                    if (_.browser.IE !== 9) {
                        _($input[0].files).each(function (fileData) {
                            // add to attachment list
                            list.addFile(fileData);
                        });
                        $input.trigger('reset.fileupload');
                    } else {
                        if ($input.val()) {
                            var fileData = {
                                name: $input.val().match(/[^\/\\]+$/),
                                size: 0,
                                hiddenField: $input
                            };
                            list.addFile(fileData);
                            $input.addClass('add-attachment').hide();
                            $input = $('<input>', { type: 'file' }).appendTo($input.parent());
                        }
                    }
                })
                .on('focus', function () {
                    $input.attr('tabindex', '1');
                });

            this.$el.append(uploadWidget);
            return this;
        }
    });

    return {
        ListView: ListView,
        UploadView: UploadView
    };
});
