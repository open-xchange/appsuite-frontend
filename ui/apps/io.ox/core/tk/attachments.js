/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/tk/attachments', [
    'io.ox/core/api/attachment',
    'io.ox/core/folder/title',
    'io.ox/core/strings',
    'io.ox/core/tk/attachmentsUtil',
    'io.ox/core/capabilities',
    'io.ox/preview/main',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/core/tk/attachments',
    'io.ox/core/extPatterns/links',
    'settings!io.ox/core',
    'io.ox/core/notifications',
    'less!io.ox/core/tk/attachments',
    'io.ox/core/pim/actions'
], function (attachmentAPI, shortTitle, strings, util, capabilities, pre, dialogs, gt, links, settings, notifications) {

    'use strict';

    var oldMode = _.browser.IE < 10;

    // EditableAttachmentList is only used by tasks and calendar
    function EditableAttachmentList(options) {
        var counter = 0;

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
                    var id = response.id || self.model.attributes.id,
                        folder = self.model.attributes.folder || self.model.attributes.folder_id;
                    if (folder && id) {
                        self.save(id, folder);
                    }
                }

                this.model.on('create update', uploadOnSave);
            },

            finishedCallback: function (model) {
                model.trigger('finishedAttachmentHandling');
            },

            render: function () {
                var self = this;
                _(this.allAttachments).each(function (attachment) {
                    //clearfix because all attachments have css float
                    self.$el.addClass('io-ox-core-tk-attachment-list clearfix').append(self.renderAttachment(attachment));
                });

                //trigger refresh of attachmentcounter
                this.baton.parentView.trigger('attachmentCounterRefresh', this.allAttachments.length);

                return this;
            },

            renderAttachment: function (attachment) {
                var self = this;
                var size, removeFile;
                var $el = $('<div class="col-lg-6 col-md-6">').append(
                    $('<div class="io-ox-core-tk-attachment file">').append(
                        $('<i class="fa fa-paperclip">'),
                        $('<div class="row-1">').text(_.ellipsis(attachment.filename, { max: 40, charpos: 'middle' })),
                        $('<div class="row-2">').append(
                            size = $('<span class="filesize">').text(strings.fileSize(attachment.file_size))
                        ),
                        removeFile = $('<a href="#" class="remove" tabindex="1">').attr('title', gt('Remove attachment')).append($('<i class="fa fa-trash-o">'))
                    )
                );

                removeFile.on('click', function () { self.deleteAttachment(attachment); });

                if (size.text() === '0 B') {size.text(' '); }

                return $el;
            },

            loadAttachments: function () {
                var self = this;
                if (this.model.id) {
                    attachmentAPI.getAll({ module: options.module, id: this.model.id, folder: this.model.get('folder') || this.model.get('folder_id') }).done(function (attachments) {
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
                if (oldMode) {
                    this.addAttachment({ file: file.hiddenField, newAttachment: true, cid: counter++, filename: file.name, file_size: file.size });
                } else {
                    this.addAttachment({ file: file, newAttachment: true, cid: counter++, filename: file.name, file_size: file.size });
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
                    if (oldMode) {
                        attachment.file.remove();
                    }
                } else {
                    this.attachmentsToDelete.push(attachment);
                }
                this.updateState();
            },

            save: function (id, folderId) {
                var self = this,
                    //errors are saved and send to callback
                    errors = [],
                    // 0 ready 1 delete 2 add 3 delete and add
                    allDone = 0,
                    apiOptions = {
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
                        errors.push(resp);
                        allDone--;
                        if (allDone <= 0) { self.finishedCallback(self.model, id, errors); }
                    }).done(function () {
                        allDone--;
                        if (allDone <= 0) { self.finishedCallback(self.model, id, errors); }
                    });
                }

                if (this.attachmentsToAdd.length) {
                    if (oldMode) {
                        attachmentAPI.createOldWay(apiOptions, self.baton.parentView.$el.find('.attachments-form')[0]).fail(function (resp) {
                            self.model.trigger('backendError', resp);
                            errors.push(resp);
                            allDone -= 2;
                            if (allDone <= 0) { self.finishedCallback(self.model, id, errors); }
                        }).done(function () {
                            allDone -= 2;
                            if (allDone <= 0) { self.finishedCallback(self.model, id, errors); }
                        });
                    } else {
                        attachmentAPI.create(apiOptions, _(this.attachmentsToAdd).pluck('file')).fail(function (resp) {
                            self.model.trigger('backendError', resp);
                            errors.push(resp);
                            allDone -= 2;
                            if (allDone <= 0) { self.finishedCallback(self.model, id, errors); }
                        }).done(function () {
                            allDone -= 2;
                            if (allDone <= 0) { self.finishedCallback(self.model, id, errors); }
                        });
                    }
                }

                if (allDone <= 0) {
                    self.finishedCallback(self.model, id, errors);
                }

                this.attachmentsToAdd = [];
                this.attachmentsToDelete = [];
                this.attachmentsOnServer = [];
                this.allAttachments = [];
            }

        }, options);
    }

    /**
     * Only used by mail and files: gui widget collecting files user wants to upload
     * @param {object} options
     * @param {object} baton
     */
    function EditableFileList(options, baton) {

        var self = this,
            counter = 0,
            files = [],
            $el = (options.$el || $('<div>').addClass('row'));

        if (options.registerTo) {
            _.each([].concat(options.registerTo), function (obj) {
                obj.fileList = self;
            });
        }

        _.extend(this, {

            init: function () {
                // add preview side-popup
                this.sidepopup = new dialogs.SidePopup().delegate($el, '.attachment-preview', util.preview);
                // destroy if removed from DOM
                $el.on('dispose', this.destroy.bind(this));
            },

            destroy: function () {
                this.sidepopup.undelegate($el).destroy();
                this.sidepopup = $el = self = options = baton = null;
            },

            render: function () {
                var self = this,
                    nodes = $('<div>');
                $el.empty();
                if (files && files.length > 0) {
                    nodes.css('margin-bottom', '20px');
                }
                _(files).each(function (file) {
                    nodes.append(self.renderFile(file));
                });
                $el.addClass('io-ox-core-tk-attachment-list').prepend(nodes);
                return this;
            },

            renderFile: function (file) {
                var opt = {
                    showpreview: options.preview && util.hasPreview(file) && baton.view && baton.view.rightside,
                    rightside: (baton.view ? baton.view.rightside : undefined),
                    labelmax: options.labelmax,
                    ref: options.ref
                };
                return util.node.call(this, file, opt);
            },

            listChanged: function () {
                this.empty();
                this.render();
            },

            empty: function () {
                //remove all nodes
                $el.find('.file').parent().remove();
            },

            get: function (group) {
                var list = [].concat(files);
                if (group) {
                    list = _.filter(list, function (item) {
                        return item.group === group;
                    });
                }
                return _.map(list, function (file) {
                    return file.file;
                });
            },

            getNode: function () {
                return $el;
            },

            clear: function () {
                files = [];
                this.listChanged();
            },

            add: function (file) {
                var result = this.checkQuota(file);
                if (result && result.error) {
                    notifications.yell('error', result.error);
                }
            },

            checkQuota: function (file) {
                var self = this,
                    list = [].concat(file),
                    properties = settings.get('properties'),
                    total = 0,
                    maxFileSize,
                    quota,
                    usage,
                    isMail = (baton.app && baton.app.app.attributes.name === 'io.ox/mail/compose'),
                    filesLength = files.length,
                    autoPublish = require('io.ox/core/capabilities').has('publish_mail_attachments'),
                    result = { added: [] };

                if (!list.length) return;

                //check
                if (isMail) {
                    maxFileSize = autoPublish ? -1 : properties.attachmentQuotaPerFile;
                    quota = autoPublish ? -1 : properties.attachmentQuota;
                    usage = 0;
                } else {
                    maxFileSize = properties.infostoreMaxUploadSize;
                    quota = properties.infostoreQuota;
                    usage = properties.infostoreUsage;
                }

                _.find(list, function (item) {

                    var fileTitle = item.filename || item.name || item.subject,
                        fileSize = item.file_size || item.size;

                    if (fileSize) {
                        total += fileSize;
                        if (maxFileSize > 0 && fileSize > maxFileSize) {
                            result.error = gt('The file "%1$s" cannot be uploaded because it exceeds the maximum file size of %2$s', fileTitle, strings.fileSize(maxFileSize));
                            result.reason = 'filesize';
                            return true;
                        }
                        if (quota > 0 && (total > (quota - usage))) {
                            result.error = gt('The file "%1$s" cannot be uploaded because it exceeds the quota limit of %2$s', fileTitle, strings.fileSize(quota));
                            result.reason = 'quota';
                            return true;
                        }
                        if (isMail && autoPublish) {
                            if (properties.infostoreMaxUploadSize > 0 && fileSize > properties.infostoreMaxUploadSize) {
                                result.error = gt('The file "%1$s" cannot be uploaded because it exceeds the attachment publication maximum file size of %2$s', fileTitle, strings.fileSize(properties.infostoreMaxUploadSize));
                                result.reason = 'filesizeAutoPublish';
                                return true;
                            }
                            if (properties.infostoreQuota > 0 && (total > (properties.infostoreQuota - properties.infostoreUsage))) {
                                result.error = gt('The file "%1$s" cannot be uploaded because it exceeds the infostore quota limit of %2$s', fileTitle, strings.fileSize(properties.infostoreQuota));
                                result.reason = 'quotaAutoPublish';
                                return true;
                            }
                        }
                    }

                    result.added.push({
                        file: (oldMode && item.hiddenField ? item.hiddenField : item),
                        name: fileTitle,
                        size: fileSize,
                        group: item.group || 'unknown',
                        cid: counter++
                    });
                });

                files = files.concat(result.added);
                if (filesLength !== files.length) self.listChanged();

                return result;
            },

            remove: function (attachment) {
                files = _.filter(files, function (att) {
                    return att.cid !== attachment.cid;
                });
                //remove hidden input form field
                if (attachment.file instanceof $ && attachment.file[0].tagName === 'INPUT') {
                    attachment.file.remove();
                }
                this.listChanged();
            }
        }, options);

        this.init();
    }

    function AttachmentListOld(options) {
        var self = this;
        _.extend(this, {

            draw: function (baton) {
                if (self.processArguments) {
                    baton = self.processArguments.apply(this, $.makeArray(arguments));
                }

                var $node = $('<div>').addClass('attachment-list').appendTo(this);

                function drawAttachment(data, label) {
                    return new links.Dropdown({
                        label: label || data.filename,
                        classes: 'attachment-link',
                        ref: 'io.ox/core/tk/attachment/links'
                    }).draw.call($node, { data: data, options: options });
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
                            _(attachments).each(function (a) {
                                drawAttachment(a, _.noI18n(a.filename));
                            });
                            if (attachments.length > 1)
                                drawAttachment(attachments, gt('All attachments')).find('a').removeClass('attachment-link');
                        } else {
                            $node.append(gt('None'));
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

    var fileUploadWidget = function (options) {

        options = _.extend({
            buttontext: gt('Add attachments'),
            tabindex: 1,
            drive: false,
            multi: true
        }, options);

        var node = $('<div>').addClass((options.wrapperClass ? options.wrapperClass : 'form-group')),
            gguid = _.uniqueId('form-control-label-'),
            label = $('<label>').attr('for', gguid).addClass('sr-only').text(options.buttontext),
            input = $('<input name="file" type="file" class="file-input">').prop({ multiple: options.multi }).attr({ id: gguid, tabindex: options.tabindex }),
            uploadButton = $('<span class="btn btn-default btn-file" role="button" tabindex="1">').append($.txt(options.buttontext)).append(label, input),
            driveButton = $('<button type="button" class="btn btn-default" data-action="addinternal">').attr({ tabindex: options.tabindex }).text(gt('Add from Drive'));

        input.on('focus', function () {
            uploadButton.addClass('active');
        }).on('blur', function () {
            uploadButton.removeClass('active');
        });

        if (options.drive && _.device('!smartphone') && capabilities.has('infostore')) {
            node.append(
                $('<div class="btn-group">').append(uploadButton, driveButton)
            );
        } else {
            node.append(uploadButton);
        }

        node.on('keypress', function (e) {
            if (e.which === 32) {
                input.focus(); // BUG #34034: FF needs to focus the input-element first
                input.trigger('click');
            }
        });

        return node;
    };

    return {
        EditableAttachmentList: EditableAttachmentList,
        EditableFileList: EditableFileList,
        AttachmentList: AttachmentListOld,
        fileUploadWidget: fileUploadWidget
    };
});
