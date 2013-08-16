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
        'io.ox/preview/main',
        'io.ox/core/tk/dialogs',
        'gettext!io.ox/core/tk/attachments',
        'io.ox/core/extPatterns/links',
        'less!io.ox/core/tk/attachments.less'
    ], function (ext, attachmentAPI, strings, pre, dialogs, gt, links) {

        'use strict';
        var oldMode = _.browser.IE < 10,
            supportsPreview = function (file) {
                // is not local?
                if (file.message) { // mail
                    return new pre.Preview({ mimetype: 'message/rfc822' }).supportsPreview();
                } else if (file.display_name) { // v-card
                    return true;
                } else if (file.id && file.folder_id) { // infostore
                    return true;
                } else if (file.atmsgref) { // forward mail attachment
                    return true;
                } else {
                    return window.FileReader && (/^image\/(png|gif|jpe?g|bmp)$/i).test(file.type);
                }
            },
            createPreview = function (file, app, rightside) {
                //rightside is needed for mail to let the popup check for events in the editor iframe
                return $('<a href="#" class="attachment-preview">')
                            .data({file: file, app: app, rightside: rightside })
                            .text(gt('Preview'));
            };

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
                        self.$el.addClass('span12 io-ox-core-tk-attachment-list').append(self.renderAttachment(attachment));
                    });

                    //trigger refresh of attachmentcounter
                    this.baton.parentView.trigger('attachmentCounterRefresh', this.allAttachments.length);

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
                    if (oldMode) {
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
                        if (oldMode) {
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

        /**
         * gui widget collecting files user wants to upload
         * @param {object} options
         * @param {object} baton
         */
        function EditableFileList(options, baton) {
            var counter = 0,
                files = [],
                $el = (options.$el || $('<div>').addClass('row-fluid'));

            _.extend(this, {

                init: function () {
                    var self = this;
                    //use referenced placeholder
                    if (baton) {
                        baton.fileList = self;
                    }
                    // add preview side-popup
                    new dialogs.SidePopup().delegate($el, '.attachment-preview', this.previewAttachment);
                },

                previewAttachment: function (popup, e, target) {
                    e.preventDefault();

                    var file = target.data('file'), message = file.message, app = target.data('app'),
                        editor = (target.data('rightside') || $()).find('iframe').contents().find('body'),//get the editor in the iframe
                        preview, reader;

                    //close if editor is selected (causes overlapping, bug 27875)
                    editor.one('click', this.close);

                    // nested message?
                    if (message) {
                        preview = new pre.Preview({
                                data: { nested_message: message },
                                mimetype: 'message/rfc822'
                            }, {
                                width: popup.parent().width(),
                                height: 'auto'
                            });
                        if (preview.supportsPreview()) {
                            preview.appendTo(popup);
                            popup.append($('<div>').text(_.noI18n('\u00A0')));
                        }
                    } else if (file.display_name) {
                        // if is vCard
                        require(['io.ox/contacts/view-detail'], function (view) {
                            popup.append(view.draw(file));
                        });
                    } else if (file.id && file.folder_id) { // infostore
                        // if is infostore
                        require(['io.ox/files/api'], function (filesAPI) {
                            var prev = new pre.Preview({
                                name: file.filename,
                                filename: file.filename,
                                mimetype: file.file_mimetype,
                                size: file.file_size,
                                dataURL: filesAPI.getUrl(file, 'bare'),
                                version: file.version,
                                id: file.id,
                                folder_id: file.folder_id
                            }, {
                                width: popup.parent().width(),
                                height: 'auto'
                            });
                            if (prev.supportsPreview()) {
                                popup.append(
                                    $('<h4>').addClass('mail-attachment-preview').text(file.filename)
                                );
                                prev.appendTo(popup);
                                popup.append($('<div>').text('\u00A0'));
                            }
                        });
                    } else if (file.atmsgref) { // forward mail attachment
                        require(['io.ox/mail/api'], function (mailAPI) {
                            var pos = file.atmsgref.lastIndexOf('/');
                            file.parent = {
                                folder_id: file.atmsgref.substr(0, pos),
                                id: file.atmsgref.substr(pos + 1)
                            };
                            var prev = new pre.Preview({
                                data: file,
                                filename: file.filename,
                                source: 'mail',
                                folder_id: file.parent.folder_id,
                                id: file.parent.id,
                                attached: file.id,
                                parent: file.parent,
                                mimetype: file.content_type,
                                dataURL: mailAPI.getUrl(file, 'view')
                            }, {
                                width: popup.parent().width(),
                                height: 'auto'
                            });
                            if (prev.supportsPreview()) {
                                popup.append(
                                    $('<h4>').addClass('mail-attachment-preview').text(file.filename)
                                );
                                prev.appendTo(popup);
                                popup.append($('<div>').text('\u00A0'));
                            }
                        });
                    } else {
                        // inject image as data-url
                        reader = new FileReader();
                        reader.onload = function (e) {
                            popup.css({ width: '100%', height: '100%' })
                            .append(
                                $('<div>')
                                .css({
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: 'url(' + e.target.result + ')',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center center',
                                    backgroundSize: 'contain'
                                })
                            );
                            reader = reader.onload = null;
                        };
                        reader.readAsDataURL(file);
                    }
                },

                render: function () {
                    var self = this,
                        odd = true,
                        row;
                    this.empty();
                    _(files).each(function (file) {
                        $el.addClass('io-ox-core-tk-attachment-list').prepend(self.renderFile(file));
                    });
                    return this;
                },

                renderFile: function (attachment) {
                    var self = this,
                        showpreview = options.preview && supportsPreview(attachment.file) && baton.view && baton.view.rightside,
                        removeFile,
                        size = attachment.file_size !== undefined ? gt.format('%1$s\u00A0 ', strings.fileSize(attachment.file_size)) : '',
                        //item
                        $el = $('<div>')
                            .addClass(this.itemClasses)
                            .append(
                                //file
                                $('<div class="item file">')
                                    .addClass(this.fileClasses)
                                    .append(
                                        $('<i class="icon-paper-clip">'),
                                        $('<div class="row-1">').text(attachment.filename),
                                        $('<div class="row-2">').append(
                                            size = $('<span class="filesize">').text(size),
                                            showpreview ? createPreview(attachment.file, baton.app, baton.view.rightside) : $()
                                        ),
                                        removeFile = $('<a href="#" class="remove" tabindex="1" title="Remove attachment">').append($('<i class="icon-trash">'))
                                )
                        );

                    removeFile.on('click', function () { self.remove(attachment); });

                    if (size.text() === "0 B") {
                        size.text(" ");
                    }

                    return $el;
                },

                listChanged: function () {
                    this.empty();
                    this.render();
                },

                empty: function () {
                    //remove all items
                    $el.find('.file').parent().remove();
                },

                get: function () {
                    return [].concat(files);
                },

                getNode: function () {
                    return $el;
                },

                clear: function () {
                    files = [];
                    this.listChanged();
                },

                add: function (file) {
                    if (oldMode) {
                        files.push({file: file.hiddenField, cid: counter++, filename: file.name, file_size: file.size});
                    } else {
                        files.push({file: file, cid: counter++, filename: file.name, file_size: file.size});
                    }
                    this.listChanged();
                },

                remove: function (attachment) {
                    files = _.filter(files, function (att) {
                        return att.cid !== attachment.cid;
                    });
                    //remove hidden input field from form
                    if (oldMode) {
                        attachment.file.remove();
                    }
                    this.listChanged();
                }
            }, options);

            this.init();
        }

        function AttachmentList(options) {
            var self = this;
            _.extend(this, {

                draw: function (baton) {
                    if (self.processArguments) {
                        baton = self.processArguments.apply(this, $.makeArray(arguments));
                    }

                    var $node = $('<div>').addClass('attachment-list').appendTo(this);

                    function drawAttachment(data, label) {
                        return new links.DropdownLinks({
                            label: label || data.filename,
                            classes: 'attachment-link',
                            ref: 'io.ox/core/tk/attachments/links'
                        }).draw.call($node, { data: data, options: options});
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
                                _(attachments).each(function (a, index) {
                                    drawAttachment(a, _.noI18n(a.filename));
                                });
                                if (attachments.length > 1)
                                    drawAttachment(attachments, gt('All attachments')).find('a').removeClass('attachment-link');
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
            id: 'slideshow',
            index: 100,
            label: gt('Slideshow'),
            ref: 'io.ox/core/tk/attachment/actions/slideshow-attachment'
        }));

        ext.point('io.ox/core/tk/attachments/links').extend(new links.Link({
            id: 'preview',
            index: 100,
            label: gt('Preview'),
            ref: 'io.ox/core/tk/attachment/actions/preview-attachment'
        }));

        ext.point('io.ox/core/tk/attachments/links').extend(new links.Link({
            id: 'open',
            index: 150,
            label: gt('Open in browser'),
            ref: 'io.ox/core/tk/attachment/actions/open-attachment'
        }));

        ext.point('io.ox/core/tk/attachments/links').extend(new links.Link({
            id: 'download',
            index: 200,
            label: gt('Download'),
            ref: 'io.ox/core/tk/attachment/actions/download-attachment'
        }));

        ext.point('io.ox/core/tk/attachments/links').extend(new links.Link({
            id: 'save',
            index: 400,
            label: gt('Save in file store'),
            ref: 'io.ox/core/tk/attachment/actions/save-attachment'
        }));

        //attachment actions
        new links.Action('io.ox/core/tk/attachment/actions/preview-attachment', {
            id: 'preview',
            requires: function (e) {
                return require(['io.ox/preview/main'])
                    .pipe(function (p) {
                        var list = _.getArray(e.context);
                        // is at least one attachment supported?
                        return e.collection.has('some') && _(list).reduce(function (memo, obj) {
                            return memo || new p.Preview({
                                filename: obj.filename,
                                mimetype: obj.content_type
                            })
                            .supportsPreview();
                        }, false);
                    });
            },
            multiple: function (list, baton) {
                ox.load(['io.ox/core/tk/dialogs',
                         'io.ox/preview/main',
                         'io.ox/core/api/attachment']).done(function (dialogs, p, attachmentAPI) {
                    //build Sidepopup
                    new dialogs.SidePopup().show(baton.e, function (popup) {
                        _(list).each(function (data, index) {
                            data.dataURL = attachmentAPI.getUrl(data, 'view');
                            var pre = new p.Preview(data, {
                                width: popup.parent().width(),
                                height: 'auto'
                            });
                            if (pre.supportsPreview()) {
                                popup.append(
                                    $('<h4>').text(data.filename)
                                );
                                pre.appendTo(popup);
                                popup.append($('<div>').text('\u00A0'));
                            }
                        });
                        if (popup.find('h4').length === 0) {
                            popup.append($('<h4>').text(gt('No preview available')));
                        }
                    });
                });
            }
        });

        new links.Action('io.ox/core/tk/attachment/actions/slideshow-attachment', {
            id: 'slideshow',
            requires: function (e) {
                return e.collection.has('multiple') && _(e.context).reduce(function (memo, obj) {
                    return memo || (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
                }, false);
            },
            multiple: function (list, baton) {
                require(['io.ox/files/carousel'], function (slideshow) {
                    var files = _(list).map(function (file) {
                        return {
                            url: attachmentAPI.getUrl(file, 'open'),
                            filename: file.filename
                        };
                    });
                    slideshow.init({
                        baton: {allIds: files},
                        attachmentMode: false,
                        selector: baton.options.selector
                    });
                });
            }
        });

        new links.Action('io.ox/core/tk/attachment/actions/open-attachment', {
            id: 'open',
            requires: 'some',
            multiple: function (list) {
                _(list).each(function (data) {
                    var url = attachmentAPI.getUrl(data, 'open');
                    window.open(url);
                });
            }
        });

        //attachments api currently doesn't support zip download
        new links.Action('io.ox/core/tk/attachment/actions/download-attachment', {
            id: 'download',
            requires: 'one',
            action: function (baton) {
                var url = attachmentAPI.getUrl(baton.data, 'download');
                window.open(url);
            }
        });

        new links.Action('io.ox/core/tk/attachment/actions/save-attachment', {
            id: 'save',
            capabilities: 'infostore',
            requires: 'some',
            multiple: function (list) {
                //cannot be converted to multiple request because of backend bug (module overides params.module)
                _(list).each(function (data) {
                    attachmentAPI.save(data);
                });
                require(['io.ox/core/notifications'], function (notifications) {
                    setTimeout(function () {notifications.yell('success', gt('Attachments have been saved!')); }, 300);
                });
            }
        });

        var fileUploadWidget = function (options) {
            options = _.extend({
                buttontext: gt('Select file'),
                tabindex: 1
            }, options);
            var node = $('<div>').addClass((options.wrapperClass ? options.wrapperClass : 'row-fluid')),
                icon = options.buttonicon ? $('<i>').addClass(options.buttonicon) : $(),
                input;

            //add space for icon
            options.buttontext = options.buttonicon ? '\u00A0' + options.buttontext : options.buttontext;

            if (options.displayLabel) node.append($('<label>').text(gt.noI18n(options.displayLabelText) || gt('File')));
            node.append(
                $('<div>', { 'data-provides': 'fileupload' }).addClass('fileupload fileupload-new')
                    .append($('<div>').addClass('input-append').append(
                        $('<div>').addClass('uneditable-input').append(
                            $('<i>').addClass('icon-file fileupload-exists'),
                            $('<span>').addClass('fileupload-preview')
                        ),
                        $('<span>').addClass('btn btn-file').append(
                            icon,
                            $('<span>').addClass('fileupload-new').text(options.buttontext),
                            $('<span>').addClass('fileupload-exists').text(gt('Change')),
                            input = $('<input name="file" type="file">')
                                .prop({
                                    multiple: options.multi
                                })
                                .attr({
                                    tabindex: options.tabindex
                                })
                        ),
                        $('<a>', {'data-dismiss': 'fileupload', tabindex: 1, href: '#'}).addClass('btn fileupload-exists').text(gt('Cancel')),
                        (options.displayButton ?
                            $('<button type="button" class="btn btn-primary" data-action="upload" tabindex="1">')
                                .text(gt('Upload file')).hide() : ''
                        )
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
            EditableFileList: EditableFileList,
            AttachmentList: AttachmentList,
            fileUploadWidget: fileUploadWidget
        };
    }
);
