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
    ['io.ox/core/extensions',
     'io.ox/core/api/attachment',
     'io.ox/core/strings',
     'io.ox/core/tk/attachmentsUtil',
     'io.ox/preview/main',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/core/tk/attachments',
     'io.ox/core/extPatterns/links',
     'less!io.ox/core/tk/attachments.less'
    ], function (ext, attachmentAPI, strings, util, pre, dialogs, gt, links) {

    'use strict';

    var oldMode = _.browser.IE < 10;

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
            finishedCallback: function (model) {
                model.trigger('finishedAttachmentHandling');
            },
            render: function () {
                var self = this;
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
                        $('<div class="row-1">').text(_.ellipsis(attachment.filename, {max: 40, charpos: 'middel'})),
                        $('<div class="row-2">').append(
                            size = $('<span class="filesize">').text(strings.fileSize(attachment.file_size))
                        ),
                        removeFile = $('<a href="#" class="remove" tabindex="1" title="Remove attachment">').append($('<i class="icon-trash">'))
                    )
                );

                removeFile.on('click', function () { self.deleteAttachment(attachment); });

                if (size.text() === '0 B') {size.text(' '); }

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
        var self = this,
            counter = 0,
            files = [],
            $el = (options.$el || $('<div>').addClass('row-fluid'));

        if (options.registerTo) {
            _.each([].concat(options.registerTo), function (obj) {
                obj.fileList = self;
            });
        }

        _.extend(this, {

            init: function () {
                // add preview side-popup
                new dialogs.SidePopup().delegate($el, '.attachment-preview', util.preview);

            },

            render: function () {
                var self = this,
                    nodes = $('<div>').css('margin-bottom', '20px');
                this.empty();
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
                    labelmax: options.labelmax
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
                var proceed = true, self = this,
                    list = [].concat(file);


                if (list.length) {
                    //check
                    require(['settings!io.ox/core', 'io.ox/core/notifications'], function (settings, notifications) {

                        var properties = settings.get('properties');
                        if (baton.app && baton.app.app.attributes.name !== 'io.ox/mail/write') {
                            proceed = false;
                        }
                        if (properties && proceed) {
                            var total = 0,
                                maxFileSize = properties.infostoreMaxUploadSize,
                                quota = properties.infostoreQuota;
                            _.each(list, function (item) {
                                var fileTitle = item.filename || item.name || item.subject,
                                    fileSize = item.file_size || item.size;
                                if (fileSize) {
                                    total += fileSize;
                                    if (maxFileSize !== 0 && fileSize > maxFileSize) {
                                        proceed = false;
                                        notifications.yell('error', gt('The file "%1$s" cannot be uploaded because it exceeds the maximum file size of %2$s', fileTitle, strings.fileSize(maxFileSize)));
                                        return;
                                    }
                                    if (quota !== -1) {
                                        if (total > quota - properties.infostoreUsage) {
                                            proceed = false;
                                            notifications.yell('error', gt('The file "%1$s" cannot be uploaded because it exceeds the quota limit of %2$s', fileTitle, strings.fileSize(quota)));
                                            return;
                                        }
                                    }
                                }
                                //add
                                if (proceed) {
                                    files.push({
                                        file: (oldMode && item.hiddenField ? item.hiddenField : item),
                                        name: fileTitle,
                                        size: fileSize,
                                        group: item.group || 'unknown',
                                        cid: counter++
                                    });
                                }
                            });
                        } else {
                            _.each(list, function (item) {
                                files.push({
                                    file: (oldMode && item.hiddenField ? item.hiddenField : item),
                                    name: item.filename || item.name || item.subject,
                                    size: item.file_size || item.size,
                                    group: item.group || 'unknown',
                                    cid: counter++
                                });
                            });
                            proceed = true;
                        }
                        if (proceed) self.listChanged();
                    });
                }
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
                    _(list).each(function (data) {
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
            tabindex: 1,
            drive: false
        }, options);

        var node = $('<div>').addClass((options.wrapperClass ? options.wrapperClass : 'row-fluid')),
            icon = options.buttonicon ? $('<i>').addClass(options.buttonicon) : $(),
            input;

        //add space for icon
        options.buttontext = options.buttonicon ? '\u00A0' + options.buttontext : options.buttontext;

        if (options.displayLabel) node.append($('<label>').text(gt.noI18n(options.displayLabelText) || gt('File')));
        node.append(
            $('<div>', { 'data-provides': 'fileupload' }).addClass('fileupload fileupload-new')
                .append($('<div>').addClass('input-prepend input-append').append(
                    $('<div>').addClass('btn-group').append(
                        $('<div>').addClass('uneditable-input').append(
                            $('<i>').addClass('icon-file fileupload-exists'),
                            $('<span>').addClass('fileupload-preview')
                        ),
                        $('<span>').attr({tabIndex: '1', 'role': 'button'}).addClass('btn btn-file').append( //Marko added: attributes "tabindex", "role"
                            icon,
                            $('<span>').addClass('fileupload-new').text(options.buttontext),
                            $('<span>').attr({'role': 'button', 'aria-label': 'Change'}).addClass('fileupload-exists').text(gt('Change')), //Marko added: attributes "role", "aria-label"
                            input = $('<input name="file" type="file" role="button">')
                                .prop({
                                    multiple: options.multi
                                })
                                .attr({
                                    tabindex: options.tabindex
                                })
                        ),
                        $('<a>', {'data-dismiss': 'fileupload', tabindex: 1, href: '#', role: 'button', 'aria-label': 'cancel'}).addClass('btn fileupload-exists').text(gt('Cancel')),
                        (options.displayButton ?                                                      //Marko added: attribute 'aria-label'
                            $('<button type="button" class="btn btn-primary" data-action="upload" tabindex="1">')
                                .text(gt('Upload file')).hide() : ''
                        ),
                        (options.drive ? $('<button type="button" class="btn" data-action="addinternal">').text(gt('Files')) : '')
                    )
                )
            )

        );
        input.on('hover', function () {
            $(this).parent().addClass('hover');
        }, function () {
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
});
