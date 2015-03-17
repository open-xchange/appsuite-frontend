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

define('io.ox/files/filepicker',
    ['io.ox/core/extensions',
     'io.ox/core/tk/dialogs',
     'io.ox/core/folder/picker',
     'io.ox/core/cache',
     'io.ox/files/api',
     'io.ox/core/tk/selection',
     'settings!io.ox/core',
     'gettext!io.ox/files'
    ], function (ext, dialogs, picker, cache, filesAPI, Selection, settings, gt) {

    'use strict';

    var FilePicker = function (options) {

        options = _.extend({
            filter: function () { return true; },
            header: gt('Add files'),
            primaryButtonText: gt('Save'),
            // cancelButtonText: gt('Cancel'), // really?
            multiselect: true,
            width: window.innerWidth * 0.8,
            tree: {
                // must be noop (must return undefined!)
                filter: $.noop
            }
        }, options);

        var filesPane = $('<ul class="io-ox-fileselection list-unstyled">'),
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

        function onFolderChange(id) {
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

        picker({

            addClass: 'zero-padding add-infostore-file',
            button: options.primaryButtonText,
            height: 350,
            module: 'infostore',
            persistent: 'folderpopup/filepicker',
            root: '9',
            settings: settings,
            title: options.header,
            width: options.width,
            abs: false,

            done: function () {
                def.resolve(
                    _(filesPane.find('input:checked')).map(function (node) {
                        return $(node).data('file');
                    })
                );
            },

            filter: options.tree.filter,

            initialize: function (dialog, tree) {
                dialog.getContentNode().append(filesPane);

                filesPane.on('dblclick', '.file', function () {
                    var file = $('input', this).data('file');
                    if (!file) return;
                    def.resolve([file]);
                    dialog.close();
                });

                tree.on('change', onFolderChange);
            }
        });

        return def.promise();
    };

    return FilePicker;
});
