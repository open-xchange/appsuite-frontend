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
                    var self = this;
                    this.attachmentsToAdd = [];
                    this.attachmentsToDelete = [];
                    this.attachmentsOnServer = [];

                    this.allAttachments = [];

                    this.loadAttachments();

                    function uploadOnSave(response) {
                        self.model.off('create update', uploadOnSave);
                        self.save(response.id, response.folder || response.folder_id);
                    }

                    this.model.on('create update', uploadOnSave);
                },

                render: function () {
                    var self = this;
                    _(this.allAttachments).each(function (attachment) {
                        self.$el.append(self.renderAttachment(attachment));
                    });
                    return this;
                },
                renderAttachment: function (attachment) {
                    var self = this;
                    var $el = $('<div class="io-ox-core-tk-attachment">');
                    $el.append(
                        $('<table width="100%">').append(
                            $('<tr>').append(
                                $('<td class="attachment-icon">').append($('<img src="' + ox.base + '/apps/themes/default/attachment.png">')),
                                $('<td class="details">').append(
                                    $('<table>').append(
                                        $('<tr>').append(
                                            $('<td class="filename">').text(attachment.filename)
                                        ),
                                        $('<tr>').append(
                                            $('<td class="filesize muted">').text(strings.fileSize(attachment.file_size))
                                        )
                                    )
                                ),
                                $('<td class="delete">').text('x').on('click', function () {
                                    self.deleteAttachment(attachment);
                                })
                            )
                        )
                    );
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
                    this.addAttachment({file: file, newAttachment: true, cid: counter++, filename: file.name, file_size: file.size});
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
                    } else {
                        this.attachmentsToDelete.push(attachment);
                    }
                    this.updateState();
                },

                save: function (id, folderId) {
                    var self = this;
                    var apiOptions = {
                        module: this.module,
                        id: id || this.model.id,
                        folder: folderId || this.model.get('folder') || this.model.get('folder_id')
                    };
                    if (this.attachmentsToDelete.length) {
                        attachmentAPI.remove(apiOptions, _(this.attachmentsToDelete).pluck('id')).fail(function (resp) {
                            self.model.trigger('backendError', resp);
                        });
                    }

                    if (this.attachmentsToAdd.length) {
                        attachmentAPI.create(apiOptions, _(this.attachmentsToAdd).pluck('file')).fail(function (resp) {
                            self.model.trigger('backendError', resp);
                        });
                    }

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
            action: function (data) {
                var url = attachmentAPI.getUrl(data, 'view');
                window.open(url);
            }
        });

        new links.Action('io.ox/core/tk/attachment/actions/download-attachment', {
            id: 'download',
            requires: 'one',
            action: function (data) {
                var url = attachmentAPI.getUrl(data, 'download');
                window.open(url);
            }
        });

        return {
            EditableAttachmentList: EditableAttachmentList,
            AttachmentList: AttachmentList
        };
    }
);
