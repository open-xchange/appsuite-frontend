/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/files/filepicker', [
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/core/folder/picker',
    'io.ox/core/cache',
    'io.ox/files/api',
    'io.ox/core/tk/selection',
    'settings!io.ox/core',
    'gettext!io.ox/files',
    'io.ox/core/tk/upload',
    'io.ox/core/notifications',
    'io.ox/core/folder/api'
], function (ext, dialogs, picker, cache, filesAPI, Selection, settings, gt, upload, notifications, folderAPI) {

    'use strict';

    var FilePicker = function (options) {

        options = _.extend({
            filter: function () { return true; },
            header: gt('Add files'),
            primaryButtonText: gt('Save'),
            // cancelButtonText: gt('Cancel'), // really?
            multiselect: true,
            width: window.innerWidth * 0.8,
            uploadButton: false,
            tree: {
                // must be noop (must return undefined!)
                filter: $.noop
            }
        }, options);

        var filesPane = $('<ul class="io-ox-fileselection list-unstyled">'),
            $uploadButton,
            def = $.Deferred(),
            self = this;

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

        function onFolderChange(id) {

            if (options.uploadButton) {
                folderAPI.get(id).done(function (folder) {
                    $('[data-action="alternative"]', filesPane.closest('.add-infostore-file'))
                    .attr('disabled', !folderAPI.can('create', folder));
                });
            }

            filesPane.empty();
            filesAPI.getAll({ folder: id }, false).then(function (files) {
                filesPane.append(
                    _.chain(files)
                    .filter(options.filter)
                    .map(function (file) {
                        var title = (file.filename || file.title),
                            $div = $('<li class="file selectable">').attr('data-obj-id', _.cid(file)).append(
                                $('<label class="">')
                                    .addClass('checkbox-inline' + (!options.multiselect ? ' sr-only' : ''))
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

                    return filesAPI.uploadFile({
                        file: item.file,
                        filename: o.filename,
                        folder: o.folder,
                        timestamp: _.now()
                    }).then(function success(data) {
                        item.data = data;
                    }, function fail(e) {
                        if (e && e.data && e.data.custom) {
                            notifications.yell(e.data.custom.type, e.data.custom.text);
                        }
                    });
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

        picker({

            addClass: 'zero-padding add-infostore-file',
            button: options.primaryButtonText,
            alternativeButton: options.uploadButton ? gt('Upload local file') : undefined,
            height: 350,
            module: 'infostore',
            persistent: 'folderpopup/filepicker',
            root: '9',
            settings: settings,
            title: options.header,
            width: options.width,
            async: true,
            abs: false,

            done: function (id, dialog) {
                def.resolve(
                    _(filesPane.find('input:checked')).map(function (node) {
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
                        .hide()
                        .on('change', { dialog: dialog, tree: tree }, fileUploadHandler);
                }

                dialog.getContentNode().append(filesPane);

                filesPane.on('dblclick', '.file', function () {
                    var file = $('input', this).data('file');
                    if (!file) return;
                    def.resolve([file]);
                    dialog.close();
                });

                tree.on('change', onFolderChange);
            },

            alternative: function (dialog) {
                dialog.idle();
                if ($uploadButton) {
                    $uploadButton.trigger('click');
                }
            }
        });

        return def.promise();
    };

    return FilePicker;
});
