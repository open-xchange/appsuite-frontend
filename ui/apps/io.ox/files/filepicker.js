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
     'io.ox/core/tk/folderviews',
     'io.ox/core/cache',
     'io.ox/files/api',
     'io.ox/core/tk/selection',
     'gettext!io.ox/files'
    ], function (ext, dialogs, folderviews, cache, filesAPI, Selection, gt) {

    'use strict';

    var FilePicker = function (options) {

        options = _.extend({
            filter: function () { return true; },
            header: gt('Add files'),
            primaryButtonText: gt('Save'),
            cancelButtonText: gt('Cancel'),
            multiselect: true,
            width: window.innerWidth * 0.8
        }, options);

        var folderCache = new cache.SimpleCache('folder-all'),
            subFolderCache = new cache.SimpleCache('subfolder-all'),
            container = $('<div>'),
            filesPane = $('<ul>').addClass('io-ox-fileselection list-unstyled').attr({ tabindex: 0}),
            tree = new folderviews.ApplicationFolderTree(container, {
                type: 'infostore',
                tabindex: 0,
                rootFolderId: '9',
                all: true,
                storage: {
                    folderCache: folderCache,
                    subFolderCache: subFolderCache
                }
            }),
            pane = new dialogs.ModalDialog({
                width: options.width,
                height: 350,
                addclass: 'add-infostore-file'
            }),
            self = this,
            pickerDef = $.Deferred();

        Selection.extend(this, filesPane, {});

        this.selection.keyboard(filesPane, true);
        this.selection.setMultiple(options.multiselect);
        if (options.multiselect) {
            this.selection.setEditable(true, '.checkbox-inline');
            filesPane.addClass('multiselect');
        } else {
            filesPane.addClass('singleselect');
        }

        pane.header($('<h4>').text(options.header))
            .build(function () {
                this.getContentNode().append(container, filesPane);
            })
            .addPrimaryButton('save', options.primaryButtonText, 'save', {tabIndex: '1'})
            .addButton('cancel', options.cancelButtonText, 'cancel', {tabIndex: '1'})
            .show(function () {
                tree.paint().done(function () {
                    tree.selection.updateIndex().selectFirst();
                    pane.getBody().find('.io-ox-foldertree').focus();
                });
            })
            .then(function (action) {
                tree.destroy().done(function () {
                    tree = pane = null;
                });
                if (action === 'save') {
                    var files = [];
                    filesPane.find('input:checked').each(function (index, el) {
                        files.push($(el).data('fileData'));
                    });
                    pickerDef.resolve(files);
                }
            }, pickerDef.reject);

        // add dbl-click option like native file-chooser
        filesPane.on('dblclick', '.file', function () {
            var file = $('input', this).data('fileData');
            if (file) {
                pickerDef.resolve([file]);
                pane.close();
            }
        });

        // on foldertree change update file selection
        tree.selection.on('select', function (e, folderId) {
            filesPane.empty();
            filesAPI.getAll({ folder: folderId }, false).then(function (files) {
                filesPane.append(
                    _.chain(files).filter(options.filter).map(function (file) {
                        var title = (file.filename || file.title),
                            $div = $('<li class="file selectable">').attr('data-obj-id', _.cid(file)).append(
                                $('<label class="">')
                                    .addClass('checkbox-inline' + (!options.multiselect ? ' sr-only' : ''))
                                    .attr('title', title)
                                    .append(
                                        $('<input type="checkbox" class="reflect-selection" tabindex="-1">')
                                            .val(file.id).data('fileData', file)
                                    ),
                                $('<div class="name">').text(title)
                            );
                        if (options.point) {
                            ext.point(options.point + '/filelist/filePicker/customizer').invoke('customize', $div, file);
                        }
                        return $div;
                    }).value()
                );
                self.selection.clear();
                self.selection.init(files);
                self.selection.selectFirst();
            });
        });

        return pickerDef.promise();
    };

    return FilePicker;

});
