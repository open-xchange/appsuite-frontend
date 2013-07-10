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
     'io.ox/core/strings'
    ], function (AbstractView, api, strings) {

    'use strict';

    var counter = 0;

    return AbstractView.extend({

        tagName: 'div',
        className: 'row-fluid',

        setup: function () {

            var self = this;

            console.log('setup!');

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
        },

        finishedCallback: function (model, id) {
            model.trigger("finishedAttachmentHandling");
        },

        render: function () {
            var self = this,
                odd = true,
                row;
            _(this.allAttachments).each(function (attachment) {
                self.$el.addClass('span12 io-ox-core-tk-attachment-list').append(self.renderAttachment(attachment));
            });

            //trigger refresh of attachmentcounter
            //this.baton.parentView.trigger('attachmentCounterRefresh', this.allAttachments.length);

            return this;
        },

        renderAttachment: function (attachment) {
            var self = this;
            var size, removeFile;
            var $el = $('<div class="span6">').append(
                $('<div class="io-ox-core-tk-attachment file">').append(
                    $('<i class="icon-paper-clip">'),
                    $('<div class="row-1">').text(attachment.filename),
                    $('<div class="row-2">').append(
                        size = $('<span class="filesize">').text(strings.fileSize(attachment.file_size))
                    ),
                    removeFile = $('<a href="#" class="remove" tabindex="1" title="Remove attachment">').append($('<i class="icon-trash">'))
                )
            );

            removeFile.on('click', function () { self.deleteAttachment(attachment); });

            if (size.text() === "0 B") {size.text(" "); }

            return $el;
        },

        loadAttachments: function () {
            var self = this;
            console.log('loadAttachments', this.model.id);
            if (this.model.id) {
                api.getAll({ module: this.options.module, id: this.model.id, folder: this.model.get('folder') || this.model.get('folder_id')}).done(function (attachments) {
                    self.attachmentsOnServer = attachments;
                    console.log('updateState ...');
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
});
