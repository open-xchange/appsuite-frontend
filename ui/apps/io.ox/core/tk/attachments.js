/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/tk/attachments',
    [
        'io.ox/core/extensions',
        'io.ox/core/api/attachment',
        'io.ox/core/strings',
        'gettext!io.ox/core/tk/attachments',
        'io.ox/core/extPatterns/links',
        'less!io.ox/core/tk/attachments.less'
    ], function (ext, attachmentAPI, strings, gt, links) {

        'use strict';
        var counter = 0;

        function EditableAttachmentList(options) {
            _.extend(this, {

                init: function () {
                    this.oldMode = _.browser.IE < 10;
                    var self = this;
                    this.attachmentsToAdd = [];
                    this.attachmentsToDelete = [];
                    this.attachmentsOnServer = [];

                    this.allAttachments = [];

                    this.loadAttachments();

                    function uploadOnSave(response) {
                        self.model.off('create update', uploadOnSave);
                        var id = self.model.attributes.id,
                            folder = self.model.attributes.folder || self.model.attributes.folder_id;

                        if (id === undefined && response !== undefined) {
                            id = response.id;
                        }
                        if (folder && id) {
                            self.save(id, folder);
                        }
                    }

                    this.model.on('create update', uploadOnSave);
                },
                finishedCallback: function (model, id) {
                    model.trigger("finishedAttachmentHandling");
                },
                render: function () {
                    var self = this,
                        odd = true,
                        row;
                    _(this.allAttachments).each(function (attachment) {
                        if (odd) {
                            row = $('<div>').addClass("row-fluid attachment-edit-row").appendTo(self.$el);
                            odd = false;
                        } else {
                            odd = true;
                        }
                        row.append($('<div>').addClass('span6').append(self.renderAttachment(attachment).addClass('span12')));
                    });

                    //trigger refresh of attachmentcounter
                    this.baton.parentView.trigger('attachmentCounterRefresh', this.allAttachments.length);

                    //replace x with icon
                    self.$el.find('.delete').each(function (index, deleteNode) {
                        $(deleteNode).text('').append('<i class="icon-remove">');
                    });
                    return this;
                },
                renderAttachment: function (attachment) {
                    var self = this;
                    var size;
                    var $el = $('<div class="io-ox-core-tk-attachment">');
                    $el.append(
                        $('<table width="100%">').append(
                            $('<tr>').append(
                                $('<td class="attachment-icon">').append($('<i>').addClass('icon-paper-clip')),
                                $('<td class="details">').append(
                                    $('<table>').append(
                                        $('<tr>').append(
                                            $('<td class="filename">').text(attachment.filename)
                                        ),
                                        $('<tr>').append(
                                            size = $('<td class="filesize muted">').text(strings.fileSize(attachment.file_size))
                                        )
                                    )
                                ),
                                $('<td class="delete">').text('x').on('click', function () {
                                    self.deleteAttachment(attachment);
                                })
                            )
                        )
                    );
                    if (size.text() === "0 B") {size.text(" "); }

                    return $el;
                },
                loadAttachments: function () {
                    var self = this;
                    if (this.model.id) {
                        attachmentAPI.getAll({module: options.module, id: this.model.id, folder: this.model.get('folder') || this.model.get('folder_id')}).done(function (attachments) {
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
                        attachmentAPI.remove(apiOptions, _(this.attachmentsToDelete).pluck('id')).fail(function (resp) {
                            self.model.trigger('backendError', resp);
                        }).done(function () {
                            allDone--;
                            if (allDone <= 0) { self.finishedCallback(self.model, id); }
                        });
                    }

                    if (this.attachmentsToAdd.length) {
                        if (this.oldMode) {
                            attachmentAPI.createOldWay(apiOptions, self.baton.parentView.$el.find('#attachmentsForm')[0]).fail(function (resp) {
                                self.model.trigger('backendError', resp);
                            }).done(function () {
                                allDone -= 2;
                                if (allDone <= 0) { self.finishedCallback(self.model, id); }
                            });
                        } else {
                            attachmentAPI.create(apiOptions, _(this.attachmentsToAdd).pluck('file')).fail(function (resp) {
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

            }, options);
        }

        function AttachmentList(options) {
            var self = this;
            _.extend(this, {

                draw: function (baton) {
                    if (self.processArguments) {
                        baton = self.processArguments.apply(this, $.makeArray(arguments));
                    }

                    var $node = $('<div>').appendTo(this);

                    function drawAttachment(attachment) {
                        new links.DropdownLinks({
                            label: attachment.filename,
                            classes: 'attachment-link',
                            ref: 'io.ox/core/tk/attachments/links'
                        }).draw.call($node, attachment);
                    }

                    function redraw(e, obj) {
                        if (obj && (obj.module !== options.module || obj.id !== baton.data.id || obj.folder !== (baton.data.folder || baton.data.folder_id))) {
                            return;
                        }
                        $node.empty();
                        attachmentAPI.getAll({
                            module: options.module,
                            id: baton.data.id,
                            folder: baton.data.folder || baton.data.folder_id
                        }).done(function (attachments) {
                            if (attachments.length) {
                                _(attachments).each(drawAttachment);
                            } else {
                                $node.append(gt("None"));
                            }
                        });
                    }

                    attachmentAPI.on('attach detach', redraw);
                    $node.on('dispose', function () {
                        attachmentAPI.off('attach detach', redraw);
                    });

                    redraw();
                }

            }, options);
        }

        ext.point('io.ox/core/tk/attachments/links').extend(new links.Link({
            id: 'open',
            index: 100,
            label: gt('Open in new tab'),
            ref: 'io.ox/core/tk/attachment/actions/open-attachment'
        }));

        ext.point('io.ox/core/tk/attachments/links').extend(new links.Link({
            id: 'download',
            index: 200,
            label: gt('Download'),
            ref: 'io.ox/core/tk/attachment/actions/download-attachment'
        }));

        new links.Action('io.ox/core/tk/attachment/actions/open-attachment', {
            id: 'open',
            requires: 'one',
            action: function (baton) {
                var url = attachmentAPI.getUrl(baton.data, 'view');
                window.open(url);
            }
        });

        new links.Action('io.ox/core/tk/attachment/actions/download-attachment', {
            id: 'download',
            requires: 'one',
            action: function (baton) {
                var url = attachmentAPI.getUrl(baton.data, 'download');
                window.open(url);
            }
        });

        var fileUploadWidget = function (options) {
            options = _.extend({
                tabindex: 1
            }, options);
            var node = $('<div>').addClass((options.wrapperClass ? options.wrapperClass : 'row-fluid')),
            input;
            if (options.displayLabel) node.append($('<label>').text(options.displayLabelText || gt('File')));
            node.append(
                $('<div>', { 'data-provides': 'fileupload' }).addClass('fileupload fileupload-new')
                    .append($('<div>').addClass('input-append').append(
                        $('<div>').addClass('uneditable-input').append(
                            $('<i>').addClass('icon-file fileupload-exists'),
                            $('<span>').addClass('fileupload-preview')
                        ),
                        $('<span>').addClass('btn btn-file').append(
                            $('<span>').addClass('fileupload-new').text(gt('Select file')),
                            $('<span>').addClass('fileupload-exists').text(gt('Change')),
                            input = $('<input name="file" type="file">')
                                .prop({
                                    multiple: options.multi
                                })
                                .attr({
                                    tabindex: options.tabindex
                                })
                        ),
                        $('<a>', {'data-dismiss': 'fileupload', tabindex: 1}).addClass('btn fileupload-exists').text(gt('Cancel')),
                        (options.displayButton ? $('<button>', { 'data-action': 'upload', tabindex: 1 }).addClass('btn btn-primary').text(gt('Upload file')).hide() : '')
                    )
                )

            );
            input.on('focus', function () {
                $(this).parent().addClass('hover');
            }).on('blur', function () {
                $(this).parent().removeClass('hover');
            });
            return node;
        };

        return {
            EditableAttachmentList: EditableAttachmentList,
            AttachmentList: AttachmentList,
            fileUploadWidget: fileUploadWidget
        };
    }
);
