/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/files/filepicker', [
    'io.ox/core/cache',
    'io.ox/core/extensions',
    'io.ox/core/tk/selection',
    'io.ox/core/tk/upload',
    'io.ox/core/folder/api',
    'io.ox/core/folder/picker',
    'io.ox/core/viewer/views/sidebar/fileinfoview',
    'io.ox/files/api',
    'io.ox/files/common-extensions',
    'io.ox/core/notifications',
    'io.ox/core/page-controller',
    'io.ox/core/toolbars-mobile',
    'settings!io.ox/core',
    'gettext!io.ox/files',
    'io.ox/files/mobile-navbar-extensions'
], function (cache, ext, Selection, upload, folderAPI, picker, FileInfoView, filesAPI, filesExtensions, notifications, PageController, Bars, settings, gt) {

    'use strict';

    // local module code - shared with or used by every `FilePicker` instance -----------------------------------

    //      - user story DOCS-589 :: User can see image preview in file picker.
    //      - for later use, in case of providing previews for every file/mine-type and not only for image types as with #DOCS-589.
    //
    // /**
    //  *
    //  * @constructor PreviewStore
    //  *  sub typed key value store for caching jquerified preview images
    //  *  in order to not always having them requested via the backend.
    //  */
    // function PreviewStore() {
    //     var
    //         store       = this,
    //         registry    = {},
    //
    //       //$emptyImage = $('<img src="" width="auto" height="auto" />'),
    //
    //         isPreviewImage = function ($previewImage) {
    //             return ($previewImage && $previewImage[0] && $previewImage[0].nodeName && ($previewImage[0].nodeName.toLowerCase() === 'img'));
    //         };
    //
    //     store.get = function (previewType, previewKey) {
    //         var
    //             type = registry[String(previewType)],
    //             $img = (type && type[String(previewKey)]);
    //
    //         return ($img && $img.clone()); // return a clone of the stored jquerified image object.
    //     };
    //     store.put = function (previewType, previewKey, $previewImage) {
    //         var $img;
    //         if (previewType && previewKey && isPreviewImage($previewImage = $($previewImage))) {
    //
    //             $img = $previewImage;
    //
    //             previewType = String(previewType);
    //             previewKey = String(previewKey);
    //
    //             var type = registry[previewType] || (registry[previewType] = {});
    //
    //             type[previewKey] = $previewImage.clone(); // store a clone of the valid jquerified image object.
    //         }
    //         return $img; // return same valid jquerified image reference.
    //     };
    // }

    function isFileTypeDoc(mimeType, fileModel) {
        return filesAPI.Model.prototype.isWordprocessing.call((fileModel || null), mimeType);
    }
    function isFileTypeXls(mimeType, fileModel) {
        return filesAPI.Model.prototype.isSpreadsheet.call((fileModel || null), mimeType);
    }
    function isFileTypePpt(mimeType, fileModel) {
        return filesAPI.Model.prototype.isPresentation.call((fileModel || null), mimeType);
    }

    function isFileTypePdf(mimeType, fileModel) {
        return filesAPI.Model.prototype.isPDF.call((fileModel || null), mimeType);
    }
    function isFileTypeTxt(mimeType, fileModel) {
        return filesAPI.Model.prototype.isText.call((fileModel || null), mimeType);
    }

    function isFileTypeZip(mimeType, fileModel) {
        return filesAPI.Model.prototype.isZIP.call((fileModel || null), mimeType);
    }

    function isFileTypeAudio(mimeType, fileModel) {
        return filesAPI.Model.prototype.isAudio.call((fileModel || null), mimeType);
    }
    function isFileTypeVideo(mimeType, fileModel) {
        return filesAPI.Model.prototype.isVideo.call((fileModel || null), mimeType);
    }

    function isFileTypeEncrypted(mimeType, fileModel) {
        return filesAPI.Model.prototype.isEncrypted.call((fileModel || null), mimeType);
    }

    function isFileTypeSvg(mimeType, fileModel) {
        return filesAPI.Model.prototype.isSVG.call((fileModel || null), mimeType);
    }
    function isFileTypeImage(mimeType, fileModel) {
        return filesAPI.Model.prototype.isImage.call((fileModel || null), mimeType);
    }

    // function isMimetypeImage(mimetype) {
    //     return REGX__MIMETYPE_IMAGE.test(mimetype);
    // }

    // function getImageType(fileObject) {
    //     var imageType;
    //
    //     return ({
    //         gif: 'GIF',
    //         png: 'PNG',
    //         jpg: 'JPG',
    //         jpeg: 'JPG',
    //         unknown: 'Unknown Image Type'
    //     }[
    //         ((imageType = REGX__IMAGE_EXTENSION.exec(fileObject.file_mimetype)) && imageType[1]) ||
    //         ((imageType = REGX__IMAGE_EXTENSION.exec(fileObject.filetype)) && imageType[1]) ||
    //         'unknown'
    //     ]);
    // }

    var
        //REGX__IMAGE_EXTENSION = (/[./](gif|png|jpg|jpeg)$/),
        //REGX__MIMETYPE_IMAGE  = (/(?:^image\/)|(?:(?:gif|png|jpg|jpeg)$)/),

        fileTypeIconClassNameMap = {

            doc: 'file-type-doc',
            xls: 'file-type-xls',
            ppt: 'file-type-ppt',

            pdf: 'file-type-pdf',
            txt: 'file-type-txt',
            svg: 'file-type-svg',

            zip: 'file-type-zip',

            //image: 'file-type-image',
            audio: 'file-type-audio',
            video: 'file-type-video',

            guard: 'file-type-guard'
            //folder: 'file-type-folder'
        };

    function getFileTypeIconClassName(fileObject) {
        var
            mimeType  = fileObject.file_mimetype,
            fileModel = new filesAPI.Model(fileObject);

        return (
            (isFileTypeDoc(mimeType, fileModel) && fileTypeIconClassNameMap.doc) ||
            (isFileTypeXls(mimeType, fileModel) && fileTypeIconClassNameMap.xls) ||
            (isFileTypePpt(mimeType, fileModel) && fileTypeIconClassNameMap.ppt) ||

            (isFileTypePdf(mimeType, fileModel) && fileTypeIconClassNameMap.pdf) ||
            (isFileTypeTxt(mimeType, fileModel) && fileTypeIconClassNameMap.txt) ||
            (isFileTypeSvg(mimeType, fileModel) && fileTypeIconClassNameMap.svg) ||

            (isFileTypeZip(mimeType, fileModel) && fileTypeIconClassNameMap.zip) ||

            (isFileTypeAudio(mimeType, fileModel) && fileTypeIconClassNameMap.audio) ||
            (isFileTypeVideo(mimeType, fileModel) && fileTypeIconClassNameMap.video) ||

            (isFileTypeEncrypted(mimeType, fileModel) && fileTypeIconClassNameMap.guard) ||
            ''
        );
    }

    /**
     * does create lazy on demand a filepicker's 3rd possible pane, the preview pane,
     * that is the root node for all following preview render actions.
     *
     * @param $filesPane
     * @returns {*|jQuery|HTMLElement}
     */
    function createPreviewPane($filesPane) {
        var
            $previewPane  = $('<div class="preview-pane"></div>');

        $previewPane.insertAfter($filesPane);

        return $previewPane;
    }

    function appendFileInfoToPreviewPane($previewPane, $fileinfo, model) {
        //console.log('+++ appendFileInfoToPreviewPane +++ [$previewPane, $fileinfo, fileObject, fileModel] : ', $previewPane, $fileinfo, fileObject, fileModel);

        if (model) {
            var
                jsonModel = model.toJSON(),
                baton     = ext.Baton({
                    model:  model,
                    data:   jsonModel,
                    options: {
                        disableFolderInfo:  true,
                        disableSharesInfo:  true,
                        disableLink:        true
                    }
                });

            //  - invoke `FileInfoView`s rendering service (extension point)
            //    as of 'io.ox/core/viewer/views/sidebar/fileinfoview'
            //
            ext.point('io.ox/core/viewer/sidebar/fileinfo').invoke('draw', $fileinfo, baton);
        }
        $previewPane.append($fileinfo);

    }

    /**
     * renders the preview image and all necessary file info data into a 3rd pane, the preview pane.
     *
     * @param $previewPane
     * @param fileObject
     */
    function renderImagePreview($previewPane, fileObject, fileModel/*, previewStore*/) {
        //console.log('+++ renderImagePreview +++ [$previewPane, fileObject] : ', $previewPane, fileObject);
        var
            $preview      = $('<div class="preview"></div>'),
            $fileinfo     = $('<div class="fileinfo"><div class="sidebar-panel-body"></div></div>'),

            thumbnailUrl  = filesAPI.getUrl(fileObject, 'thumbnail', {
                scaleType:  'contain',  // - contain or cover or auto
                height:     140,        // - image height in pixels
                width:      250,        // - image widht in pixels
                version:    false       // - true/false. if false no version will be appended
            });

        $preview.css('background-image', ('url(' + thumbnailUrl + ')'));

        $previewPane.empty();
        $previewPane.append($preview);

        appendFileInfoToPreviewPane($previewPane, $fileinfo, fileModel);
    }

    function renderNonImagePreview($previewPane, fileObject, fileModel/*, previewStore*/) {
        //console.log('+++ renderNonImagePreview +++ [$previewPane, fileObject] : ', $previewPane, fileObject);
        var
            $preview      = $('<div class="preview"></div>'),
            $fileinfo     = $('<div class="fileinfo"><div class="sidebar-panel-body"></div></div>'),

            $fileTypeIcon = $('<div><i class="fa file-type-icon" aria-hidden="true"></i></div>');

        $preview.append(
            $fileTypeIcon.addClass(
                getFileTypeIconClassName(fileObject)
            )
        );
        $previewPane.empty();
        $previewPane.append($preview);

        appendFileInfoToPreviewPane($previewPane, $fileinfo, fileModel);
    }

    // Constructor ------------------------------------------------------------------

    /**
     *
     * @param options
     * @returns {*}
     * @constructor FilePicker
     */
    var FilePicker = function (options) {

        options = _.extend({
            filter: function () { return true; },
            sorter: function () {},
            header: gt('Add files'),
            primaryButtonText: gt('Save'),
            // cancelButtonText: gt('Cancel'), // really?
            multiselect: true,
            width: window.innerWidth * 0.8 > 1300 ? 1300 : Math.round(window.innerWidth * 0.8), // limit width to 1300px
            uploadButton: false,
            uploadButtonText: gt('Upload local file'),
            tree: {
                // must be noop (must return undefined!)
                filter: $.noop
            },
            acceptLocalFileType: '', //e.g.  '.jpg,.png,.doc', 'audio/*', 'image/*' see@ https://developer.mozilla.org/de/docs/Web/HTML/Element/Input#attr-accept
            cancel: $.noop,
            close: $.noop,
            initialize: $.noop,
            createFolderButton: true,
            extension: 'io.ox/files/mobile/navbar'
        }, options);

        var filesPane = $('<ul class="io-ox-fileselection list-unstyled">'),
            $uploadButton,
            def = $.Deferred(),
            self = this,
            toolbar = $('<div class="mobile-toolbar">'),
            navbar = $('<div class="mobile-navbar">'),
            pcContainer = $('<div class="picker-pc-container">'),
            pages = new PageController({ appname: 'filepicker', toolbar: toolbar, navbar: navbar, container: pcContainer, disableAnimations: true }),
            containerHeight = $(window).height() - 200,
            hub = _.extend({}, Backbone.Events),
            currentFolder,
            //previewStore = new PreviewStore(),
            $previewPane,
            isAllowPreviewPane = !_.device('smartphone');

        pages.addPage({
            name: 'folderTree',
            navbar: new Bars.NavbarView({
                title: gt('Folders'),
                extension: options.extension //save to use as this is very generic
            }),
            startPage: true
        });

        pages.addPage({
            name: 'fileList',
            navbar: new Bars.NavbarView({
                title: gt('Files'),
                extension: options.extension
            })
        });

        pages.setBackbuttonRules({
            'fileList': 'folderTree'
        });

        pages.getNavbar('fileList').setLeft(gt('Folders'));

        pages.getNavbar('fileList').on('leftAction', function () {
            pages.goBack({ disableAnimations: true });
        });

        Selection.extend(this, filesPane, { markable: true });

        this.selection.keyboard(filesPane, true);
        this.selection.setMultiple(options.multiselect);

        if (options.multiselect) {
            this.selection.setEditable(true, '.checkbox-inline');
            filesPane.addClass('multiselect');
        } else {
            filesPane.addClass('singleselect');
        }

        function toggleOkButton(state) {
            $('[data-action="ok"]', filesPane.closest('.add-infostore-file')).prop('disabled', !state);
        }

        toggleOkButton(false);

        this.selection.on('change', function (e, selectedFiles) {

            toggleOkButton(selectedFiles.length > 0);

            // workaround for Bug 50500, instead of a real fix, we should use the NEW list from mail or drive
            filesPane.find('input[type=checkbox]').prop('checked', false);
            selectedFiles.forEach(function (selectedFile) {
                filesPane.find('li.file[data-obj-id="' + _.cid(selectedFile) + '"] input').prop('checked', true);
            });
        });
        if (isAllowPreviewPane) {

            this.selection.on('mark', handleFileSelectionChange);
            this.selection.on('select', handleFileSelectionChange);
        }

        // - user story DOCS-589 :: User can see image preview in file picker
        // - https://jira.open-xchange.com/browse/DOCS-589
        // - according to some counseling from Olpe the required 3rd preview-pane is supposed to be hacked into this modal dialogue.
        //
        function handleFileSelectionChange(event, fileId, fileObject) {
            //console.log('Filepicker::Selection::handleSelect - [event, fileId, fileObject] : ', event, fileId, fileObject);
            if (!$previewPane) {
                $previewPane = createPreviewPane(filesPane);
            }
            var
                mimeType  = fileObject.file_mimetype,
                fileModel = new filesAPI.Model(fileObject);

            if (isFileTypeImage(mimeType, fileModel)) {

                renderImagePreview($previewPane, fileObject, fileModel/*, previewStore*/);
            } else {
                renderNonImagePreview($previewPane, fileObject, fileModel/*, previewStore*/);

                //deletePreviewPane();
            }
        }

        function onVirtualChange(id) {
            if (id === 'virtual/favorites/infostore') {
                if (currentFolder === id) {
                    hub.trigger('folder:changed');
                    return;
                }

                if (options.uploadButton) {
                    $('[data-action="alternative"]', filesPane.closest('.add-infostore-file'))
                        .prop('disabled', true);
                }

                if (_.device('smartphone')) {
                    pages.getNavbar('fileList').setTitle(gt('Favorites'));
                }

                // disable ok button on folder change (selection will enable it)
                toggleOkButton(false);

                filesPane.empty();
                return filesAPI.getList(settings.get('favoriteFiles/infostore', []), { errors: true, cache: cache, onlyAttributes: true }).then(function (files) {
                    updateFileList(id, files);
                });
            }
        }

        function onFolderChange(id) {

            if (currentFolder === id) {
                hub.trigger('folder:changed');
                return;
            }
            if (options.uploadButton) {
                folderAPI.get(id).done(function (folder) {
                    $('[data-action="alternative"]', filesPane.closest('.add-infostore-file'))
                    .prop('disabled', !folderAPI.can('create', folder));
                });
            }
            if (_.device('smartphone')) {
                folderAPI.get(id).done(function (folder) {
                    pages.getNavbar('fileList').setTitle(folder.title);
                }).fail(function () {
                    pages.getNavbar('fileList').setTitle(gt('Files'));
                });
            }

            // disable ok button on folder change (selection will enable it)
            toggleOkButton(false);

            filesPane.empty();
            filesAPI.getAll(id, { cache: false, params: { sort: 702 } }).done(function (files) {
                updateFileList(id, files);
            });
        }

        function updateFileList(id, files) {
            /**
             *  fixing Bug 50949: 'Insert image' from drive offers non image file
             *  fixing Bug 50501: File picker:Travelling through file name list with keyboard seems random
             *
             *  [https://bugs.open-xchange.com/show_bug.cgi?id=50949]
             *  [https://bugs.open-xchange.com/show_bug.cgi?id=50501]
             */
            files = _.chain(files)                                  // - 1stly, really do what the original intention was:
                .filter(options.filter)                             //
                .sortBy(options.sorter)                             //   ... filter and sort the model and not the view.
                .value();                                           //

            if (files.length <= 0) {                                // (additional win: change view acoording to the filtered model)

                deletePreviewPane();
            } else {                                                // - 2ndly, use human readable variable names
                var paneItems = files.map(function (file) {         //   in order to show other developers what
                    //                                                   direction you are heading to.
                    var guid = _.uniqueId('form-control-label-');   // - nice: model and view after 3 years are finally in sync.
                    var title = (file['com.openexchange.file.sanitizedFilename'] || file.filename || file.title),
                        $div = $('<li class="file selectable">').attr('data-obj-id', _.cid(file)).append(
                            $('<label class="checkbox-inline sr-only">')
                                .attr({ 'title': title, 'for': guid })
                                .append(
                                    $('<input type="checkbox" tabindex="-1">').attr('id', guid)
                                        .val(file.id).data('file', file)
                                ),
                            $('<div class="name">').text(title)
                        );
                    if (options.point) {
                        ext.point(options.point + '/filelist/filePicker/customizer').invoke('customize', $div, file);
                    }
                    return $div;
                });
                //                                                     - 3rd, you provide a result that got processed stepwise
                filesPane.append(                                   //   (and not by spaghetti code), thus other devs much easear
                    paneItems                                       //   recognize its creation process, thus they will be able changing
                );                                                  //   this process' control flow (better refactoring/maintaining of code).
            }                                                       // - last: sticking to some simple coding rules, most probably had prevented creating this bugs.
            self.selection.clear();
            self.selection.init(files); // - provide the filtered model ... see 1st point above.

            // at first load: the file list should be focused
            if (options.multiselect && options.wasLoaded === undefined) {
                self.selection.selectFirst(true);
                // flag to indicate the initial load
                options.wasLoaded = true;
            } else {
                self.selection.selectFirst();
            }
            currentFolder = id;
            hub.trigger('folder:changed');
        }

        function fileUploadHandler(e) {
            var queue,
                dialog = e.data.dialog,
                tree = e.data.tree;

            queue = upload.createQueue({
                start: function () {
                    dialog.busy();
                },
                progress: function (item) {
                    var o = item.options;

                    return filesAPI.upload({
                        file: item.file,
                        filename: o.filename,
                        folder: o.folder || folderAPI.getDefaultFolder('infostore'),
                        timestamp: _.now()
                    })
                    .then(
                        function success(data) {
                            item.data = data;
                        },
                        function fail(e) {
                            if (e && e.data && e.data.custom) {
                                notifications.yell(e.data.custom.type, e.data.custom.text);
                            }
                            throw e;
                        }
                    );
                },
                stop: function (current, position, list) {
                    var defList = _(list).map(function (file) {
                        return filesAPI.get(file.data);
                    });

                    $.when.apply(this, defList).then(function success() {
                        var filtered = _(arguments).filter(options.filter);

                        if (filtered.length > 0) {
                            if (!options.keepDialogOpenOnSuccess) {
                                def.resolve(filtered);
                                return dialog.close();
                            }

                            var file = _.first(filtered),
                                folderId = file.folder_id;

                            filesPane.empty();
                            filesAPI.getAll(folderId, { cache: false, params: { sort: 702 } }).done(function (files) {
                                updateFileList(folderId, files);
                                self.selection.set(file);
                                self.selection.focus();
                                dialog.idle();
                            });
                        } else {
                            // do not use "gt.ngettext" for plural without count
                            notifications.yell('error', (list.length === 1) ?
                                gt('The uploaded file does not match the requested file type.') :
                                gt('None of the uploaded files matches the requested file type.')
                            );
                            dialog.idle();
                        }
                    }, notifications.yell);
                }
            });

            _(e.target.files).each(function (file) {
                queue.offer(file, { folder: tree.selection.get(), filename: file.name });
            });
        }

        // support for
        // - fixing Bug 50949: 'Insert image' from drive offers non image file
        // - fixing Bug 50501: File picker:Travelling through file name list with keyboard seems random
        //
        function deletePreviewPane() {
            if ($previewPane) {

                $previewPane.remove();
                $previewPane = null;
            }
        }

        function focusButtons() {
            this.$footer.find('button').first().focus();
        }

        function onResize() {
            var height = $(window).height() - 200;
            pcContainer.css('height', height)
                .find('.modal-body').css('height', height);
        }

        picker({

            addClass: 'zero-padding add-infostore-file',
            button: options.primaryButtonText,
            alternativeButton: options.uploadButton ? options.uploadButtonText : null,
            height: _.device('desktop') ? 350 : containerHeight,
            module: 'infostore',
            persistent: 'folderpopup/filepicker',
            root: '9',
            settings: settings,
            title: options.header,
            width: options.width,
            async: true,
            abs: false,
            folder: options.folder || undefined,
            hideTrashfolder: options.hideTrashfolder || undefined,
            createFolderButton: options.createFolderButton,
            autoFocusOnIdle: false,

            disable: function (data) {
                if (!/^virtual\//.test(data.id)) return false;
                // enable favorites in drive
                if (data.id === 'virtual/favorites/infostore') return false;
                // disable other virtual folders
                return true;
            },

            done: function (id, dialog) {
                def.resolve(
                    _(filesPane.find('li.selected input')).map(function (node) {
                        return $(node).data('file');
                    })
                );
                dialog.close();
            },

            filter: options.tree.filter,

            initialize: function (dialog, tree) {
                if (options.uploadButton) {
                    $uploadButton = $('<input name="file" type="file" class="file-input">')
                        .attr('multiple', options.multiselect)
                        .attr('accept', options.acceptLocalFileType)
                        .hide()
                        .on('change', { dialog: dialog, tree: tree }, fileUploadHandler);
                }
                // standard handling for desktop only
                if (_.device('desktop')) {
                    dialog.$body.append(filesPane);
                    filesPane.on('dblclick', '.file', function () {
                        var file = $('input', this).data('file');
                        if (!file) return;
                        def.resolve([file]);
                        dialog.close();
                    });
                } else if (_.device('!smartphone')) {
                    // tablet
                    dialog.$body.append(filesPane);
                    dialog.$body.css({ overflowY: 'hidden' });
                    filesPane.on('dblclick', '.file', function () {
                        var file = $('input', this).data('file');
                        if (!file) return;
                        def.resolve([file]);
                        dialog.close();
                    });
                } else {
                    // some re-sorting of nodes for mobile
                    // we have to use the pagecontroller pages instead of the classic
                    // splitview on desktop
                    var container = dialog.$body.parent();
                    pages.getPage('fileList').append(filesPane);
                    pages.getPage('folderTree').append(dialog.$body);

                    pcContainer.css('height', containerHeight + 'px');
                    pcContainer.append(navbar, toolbar);
                    pcContainer.insertAfter(dialog.$header, container);
                    $(window).on('resize', onResize);
                    dialog.on('close', function () {
                        $(window).off('resize', onResize);
                    });

                    // always change pages on click, do not wait for folder-change
                    dialog.$body.on('click', 'li .folder.selectable.open, li.folder.selectable.favorites', function (e) {
                        if ($(e.target).closest('.folder-arrow').length) return;
                        pages.changePage('fileList', { disableAnimations: true });
                    });
                }

                // fix for Bug 50587
                focusButtons.call(dialog);
                tree.once('change', focusButtons.bind(dialog));

                tree.on('change', onFolderChange);
                tree.on('virtual', onVirtualChange);
                options.initialize(dialog);
            },

            alternative: function (dialog) {
                dialog.idle();
                if ($uploadButton) {
                    $uploadButton.trigger('click');
                }
            },
            cancel: options.cancel,
            close: function () {
                if (_.isFunction(options.close)) options.close();
                if (def.state() === 'pending') def.reject();
            }
        });

        return def.promise();
    };
    return FilePicker;
});
