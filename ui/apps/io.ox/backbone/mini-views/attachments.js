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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/mini-views/attachments',
    ['io.ox/backbone/mini-views/abstract',
     'io.ox/core/api/attachment',
     'io.ox/core/tk/attachments',
     'io.ox/core/strings',
     'gettext!io.ox/core/tk/attachments'
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
            var attachment = $(e.currentTarget).data();
            this.deleteAttachment(attachment);
        },

        setup: function () {

            var self = this;

            this.oldMode = _.browser.IE < 10;
            this.attachmentsToAdd = [];
            this.attachmentsToDelete = [];
            this.attachmentsOnServer = [];
            this.allAttachments = [];

            this.listenToOnce(this.model, 'create update', function (response) {

                var id = self.model.get('id'),
                    folder = self.model.get('folder') || self.model.get('folder_id');

                if (id === undefined && response !== undefined) id = response.id;

                if (folder && id) self.save(id, folder);
            });

            this.loadAttachments();
        },

        dispose: function () {
            this.stopListening();
        },

        render: function () {

            this.$el.append(
                _(this.allAttachments).map(this.renderAttachment)
            );

            return this;
        },

        renderAttachment: function (attachment) {

            var size = attachment.file_size > 0 ? strings.fileSize(attachment.file_size) : '\u00A0';
            return $('<div class="attachment">').append(
                $('<i class="fa fa-paperclip">'),
                $('<div class="row-1">').text(attachment.filename),
                $('<div class="row-2">').append(
                    $('<span class="filesize">').text(size)
                ),
                $('<a href="#" class="remove" tabindex="1">')
                .attr({
                    'title': gt('Remove attachment'),
                    'role': 'button',
                    'aria-label': gt('Remove attachment') + ' ' + attachment.filename
                })
                .data(attachment)
                .append(
                    $('<i class="fa fa-trash-o">')
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
                // 0 ready 1 delete 2 add 3 delete and add
                allDone = 0,
                //store errormessages
                errors = [],
                apiOptions = {
                module: this.options.module,
                id: id || this.model.id,
                folder: folderId || this.model.get('folder') || this.model.get('folder_id')
            };

            function done() {
                if (self.options.changeCallback) {
                    self.options.changeCallback(self.model, id, errors);
                }
            }

            if (this.attachmentsToDelete.length) allDone++;

            if (this.attachmentsToAdd.length) allDone += 2;

            if (this.attachmentsToDelete.length) {
                api.remove(apiOptions, _(this.attachmentsToDelete).pluck('id')).then(
                    function success() {
                        allDone--;
                        if (allDone <= 0) done();
                    },
                    function fail(e) {
                        self.model.trigger('server:error', e);
                        allDone--;
                        errors.push(e);
                        if (allDone <= 0) done();
                    }
                );
            }

            if (this.attachmentsToAdd.length) {
                if (this.oldMode) {
                    api.createOldWay(apiOptions, this.$el.closest('form')).then(
                        function success() {
                            allDone -= 2;
                            if (allDone <= 0) done();
                        },
                        function fail(e) {
                            self.model.trigger('server:error', e);
                            allDone -= 2;
                            errors.push(e);
                            if (allDone <= 0) done();
                        }
                    );
                } else {
                    api.create(apiOptions, _(this.attachmentsToAdd).pluck('file')).then(
                        function success() {
                            allDone -= 2;
                            if (allDone <= 0) done();
                        },
                        function fail(e) {
                            self.model.trigger('server:error', e);
                            allDone -= 2;
                            errors.push(e);
                            if (allDone <= 0) done();
                        }
                    );
                }
            }

            if (allDone <= 0) done();

            this.attachmentsToAdd = [];
            this.attachmentsToDelete = [];
            this.attachmentsOnServer = [];
            this.allAttachments = [];
        },

        isDirty: function () {
            return this.attachmentsToDelete.length > 0 || this.attachmentsToAdd.length > 0;
        }
    });

    var UploadView = AbstractView.extend({

        className: 'contact_attachments_buttons',

        render: function () {

            var self = this;

            var uploadWidget = attachments.fileUploadWidget({
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
                            $input.parent().append(
                                $input = $('<input type="file">')
                            );
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
