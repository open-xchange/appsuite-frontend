/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/files/filepicker', [

    'io.ox/core/cache',
    'io.ox/core/extensions',

    'io.ox/core/tk/selection',
    'io.ox/core/tk/dialogs',
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
    'gettext!io.ox/files'

], function (cache, ext, Selection, dialogs, upload, folderAPI, picker, FileInfoView, filesAPI, filesExtensions, notifications, PageController, Bars, settings, gt) {

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
        // 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // 'docm': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // 'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        // 'dotm': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        // 'doc':  'application/msword',
        // 'dot':  'application/msword',
        // 'odt':  'application/vnd.oasis.opendocument.text',
        // 'odm':  'application/vnd.oasis.opendocument.text-master',
        // 'ott':  'application/vnd.oasis.opendocument.text-template',
        // 'oth':  'application/vnd.oasis.opendocument.text-web',
      //return (/^application\/(?:msword|vnd\.(?:ms-word|openxmlformats-officedocument\.wordprocessingml|oasis\.opendocument\.text))/).test(mimeType);

        // ... with Dec.2016 implemented into Files-API similar to `isPresentation` that already did exist.
        return filesAPI.Model.prototype.isWordprocessing.call((fileModel || null), mimeType);
    }
    function isFileTypeXls(mimeType, fileModel) {
        // 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // 'xlsm': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // 'xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
        // 'xltm': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
        // 'xls':  'application/vnd.ms-excel',
        // 'xlb':  'application/vnd.ms-excel',
        // 'xlt':  'application/vnd.ms-excel',
        // 'ods':  'application/vnd.oasis.opendocument.spreadsheet',
        // 'ots':  'application/vnd.oasis.opendocument.spreadsheet-template',
      //return (/^application\/(?:powerpoint|vnd\.(?:ms-powerpoint|openxmlformats-officedocument\.presentationml|oasis\.opendocument\.presentation))/).test(mimeType);

        // ... with Dec.2016 implemented into Files-API similar to `isPresentation` that already did exist.
        return filesAPI.Model.prototype.isSpreadsheet.call((fileModel || null), mimeType);
    }
    function isFileTypePpt(mimeType, fileModel) {
        // 'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // 'pptm': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // 'ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
        // 'potx': 'application/vnd.openxmlformats-officedocument.presentationml.template',
        // 'potm': 'application/vnd.openxmlformats-officedocument.presentationml.template',
        // 'ppt':  'application/vnd.ms-powerpoint',
        // 'pot':  'application/vnd.ms-powerpoint',
        // 'pps':  'application/vnd.ms-powerpoint'
        // 'odp':  'application/vnd.oasis.opendocument.presentation',
        // 'otp':  'application/vnd.oasis.opendocument.presentation-template',
      //return (/^application\/vnd\.(?:openxmlformats\-officedocument\.presentationml\.)|(?:oasis\.opendocument\.presentation)|(?:ms-powerpoint$)/).test(mimeType);

        // did already exist in Files-API:
        return filesAPI.Model.prototype.isPresentation.call((fileModel || null), mimeType);
    }

    function isFileTypePdf(mimeType, fileModel) {
        return filesAPI.Model.prototype.isPDF.call((fileModel || null), mimeType);
    }
    function isFileTypeTxt(mimeType, fileModel) {
        return filesAPI.Model.prototype.isText.call((fileModel || null), mimeType);
    }

    function isFileTypeZip(mimeType, fileModel) {
      //return (/^application\/zip$/).test(mimeType);

        // ... with Dec.2016 implemented into Files-API similar to `isPDF` that already did exist.
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
    // function isFileTypeImage(mimeType) {
    //     return filesAPI.Model.prototype.isImage.call(null, mimeType);
    // }

    function isMimetypeImage(mimetype/*, fileModel*/) {
        return REGX__MIMETYPE_IMAGE.test(mimetype);
    }

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
        REGX__MIMETYPE_IMAGE  = (/(?:^image\/)|(?:(?:gif|png|jpg|jpeg)$)/),

        fileTypeIconClassNameMap = {

            doc: 'file-type-doc',
            xls: 'file-type-xls',
            ppt: 'file-type-ppt',

            pdf: 'file-type-pdf',
            txt: 'file-type-txt',

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

    function appendFileInfoToPreviewPane($previewPane, $fileinfo, fileObject) {
      //console.log('+++ appendFileInfoToPreviewPane +++ [$previewPane, $fileinfo, fileObject] : ', $previewPane, $fileinfo, fileObject);

        filesAPI.get(fileObject).done(function (fileDescriptor) {

            var model = filesAPI.pool.get('detail').get(_.cid(fileDescriptor));
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

        })/*.fail(function () { console.warn('Filepicker::renderImagePreview ... async loading did fail'); })*/;
    }

    /**
     * renders the preview image and all necessary file info data into a 3rd pane, the preview pane.
     *
     * @param $previewPane
     * @param fileObject
     */
    function renderImagePreview($previewPane, fileObject/*, previewStore*/) {
      //console.log('+++ renderImagePreview +++ [$previewPane, fileObject] : ', $previewPane, fileObject);
        var
            $preview      = $('<div class="preview"></div>'),
            $fileinfo     = $('<div class="fileinfo"><div class="sidebar-panel-body"></div></div>'),

            thumbnailUrl  = filesAPI.getUrl(fileObject, 'thumbnail', {
                scaletype:  'contain',  // - contain or cover or auto
                height:     140,        // - image height in pixels
                width:      250,        // - image widht in pixels
                version:    false       // - true/false. if false no version will be appended
            });

        $preview.css('background-image', ('url(' + thumbnailUrl + ')'));

        $previewPane.empty();
        $previewPane.append($preview);

        appendFileInfoToPreviewPane($previewPane, $fileinfo, fileObject);
    }

    function renderNonImagePreview($previewPane, fileObject/*, previewStore*/) {
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

        appendFileInfoToPreviewPane($previewPane, $fileinfo, fileObject);
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
            width: window.innerWidth * 0.8,
            uploadButton: false,
            tree: {
                // must be noop (must return undefined!)
                filter: $.noop
            },
            acceptLocalFileType: '', //e.g.  '.jpg,.png,.doc', 'audio/*', 'image/*' see@ https://developer.mozilla.org/de/docs/Web/HTML/Element/Input#attr-accept
            cancel: $.noop,
            initialize: $.noop
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
                extension: 'io.ox/mail/mobile/navbar' //save to use as this is very generic
            }),
            startPage: true
        });

        pages.addPage({
            name: 'fileList',
            navbar: new Bars.NavbarView({
                title: gt('Files'),
                extension: 'io.ox/mail/mobile/navbar'
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

        if (_.device('!desktop')) {
            options.uploadButton = false;
        }

        function toggleOkButton(state) {
            $('[data-action="ok"]', filesPane.closest('.add-infostore-file')).prop('disabled', !state);
        }

        toggleOkButton(false);

        this.selection.on('change', function (e, list) {
            toggleOkButton(list.length > 0);
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
            if (isMimetypeImage(fileObject.file_mimetype)) {
              //console.log('+++ Filepicker::select:file:type:image - image type +++ : ', getImageType(fileObject));

                renderImagePreview($previewPane, fileObject/*, previewStore*/);
            } else {
                renderNonImagePreview($previewPane, fileObject/*, previewStore*/);

              //deletePreviewPane();
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
                    .attr('disabled', !folderAPI.can('create', folder));
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
            filesAPI.getAll(id, { cache: false }).done(function (files) {
                filesPane.append(
                    _.chain(files)
                    .filter(options.filter)
                    .sortBy(options.sorter)
                    .map(function (file) {
                        var title = (file.filename || file.title),
                            $div = $('<li class="file selectable">').attr('data-obj-id', _.cid(file)).append(
                                $('<label class="checkbox-inline sr-only">')
                                    .attr('title', title)
                                    .append(
                                        $('<input type="checkbox" class="reflect-selection" tabindex="-1">')
                                            .val(file.id).data('file', file)
                                    ),
                                $('<div class="name">').text(title)
                            );
                        if (options.point) {
                            ext.point(options.point + '/filelist/filePicker/customizer').invoke('customize', $div, file);
                        }
                        return $div;
                    })
                    .value()
                );
                self.selection.clear();
                self.selection.init(files);
                self.selection.selectFirst();
                currentFolder = id;
                hub.trigger('folder:changed');
            });
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
                        folder: o.folder,
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
                            def.resolve(filtered);
                            dialog.close();
                        } else {
                            notifications.yell('error', gt.ngettext(
                                'The uploaded file does not match the requested file type.',
                                'None of the uploaded files matches the requested file type.', list.length));
                        }

                        dialog.idle();
                    }, notifications.yell);
                }
            });

            _(e.target.files).each(function (file) {
                queue.offer(file, { folder: tree.selection.get(), filename: file.name });
            });
        }

        // function deletePreviewPane() {
        //     if ($previewPane) {
        //
        //         $previewPane.remove();
        //         $previewPane = null;
        //     }
        // }

        function focusButtons() {
            this.getFooter().find('button').first().focus();
        }

        picker({

            addClass: 'zero-padding add-infostore-file',
            button: options.primaryButtonText,
            alternativeButton: options.uploadButton ? gt('Upload local file') : undefined,
            height: _.device('smartphone') ? containerHeight : 350,
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
                if (_.device('!smartphone')) {
                    dialog.getContentNode().append(filesPane);
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
                    var container = dialog.getBody().parent();
                    pages.getPage('fileList').append(filesPane);
                    pages.getPage('folderTree').append(dialog.getBody());

                    pcContainer.css('height', containerHeight + 'px');
                    pcContainer.append(navbar, toolbar);
                    pcContainer.insertAfter('.clearfix', container);

                    // always change pages on click, do not wait for folder-change
                    dialog.getBody().on('click', 'li .folder.selectable.open', function (e) {
                        if ($(e.target).closest('.folder-arrow').length) return;
                        pages.changePage('fileList', { disableAnimations: true });
                    });
                }

                // fix for Bug 50587
                focusButtons.call(dialog);
                tree.once('change', focusButtons.bind(dialog));

                tree.on('change', onFolderChange);
                options.initialize(dialog);
            },

            alternative: function (dialog) {
                dialog.idle();
                if ($uploadButton) {
                    $uploadButton.trigger('click');
                }
            },
            cancel: options.cancel
        });

        return def.promise();
    };
    return FilePicker;
});
