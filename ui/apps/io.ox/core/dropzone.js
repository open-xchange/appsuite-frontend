/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/dropzone', [], function () {

    'use strict';

    var EVENTS = 'dragenter dragover dragleave drop';

    // iframe overlay during dnd
    var toggleDndMask = _.throttle(function (state) {
        var active = $('html').hasClass('dndmask-enabled');

        if (active === state) return;

        $('html').toggleClass('dndmask-enabled', state);
        if (!state) return $('.dndmask').remove();

        $('iframe:visible').each(function () {
            var id = _.uniqueId('overlay-'),
                iframe = $(this)
                    .attr('data-overlay', id)
                    .before(
                        // overlay
                        $('<div id="' + id + '" class="dndmask">')
                        .on(EVENTS, function (e) {
                            var event = $.Event(e.type, { 'offsetX': e.offsetX, 'offsetY': e.offsetY });
                            $('body', iframe.contents()).trigger(event);
                        })
                    );
        });
    }, 100);
    ox.on('drag:start', _.partial(toggleDndMask, true));
    ox.on('drag:stop', _.partial(toggleDndMask, false));

    // Backbone Dropzone
    var InplaceDropzone = Backbone.View.extend({

        className: 'inplace-dropzone',

        events: {
            'drop': 'onDrop',
            'dragenter .dropzone-overlay': 'onDragenter',
            'dragover .dropzone-overlay': 'onDragover',
            'dragleave .dropzone-overlay': 'onDragleave'
        },

        onLeave: function (e) {
            if (!this.leaving) return;
            ox.trigger('drag:stop', this.cid);
            this.hide(e);
        },

        onDrag: function (e) {
            if (!this.$el.parent().is(':visible')) return;
            if (!this.isSupported()) return;
            switch (e.type) {
                case 'dragenter':
                case 'dragover':
                    ox.trigger('drag:start', this.cid);
                    this.stop(e);
                    this.leaving = false;
                    if (!this.checked) this.checked = true; else return;
                    if (!this.isValid(e)) return;
                    if (!this.visible) this.show();
                    return false;
                case 'dragleave':
                    this.leaving = true;
                    clearTimeout(this.timeout);
                    this.timeout = setTimeout(this.onLeave.bind(this), 100, e);
                    break;
                case 'drop':
                    ox.trigger('drag:stop', this.cid);
                    this.stop(e);
                    this.hide();
                    return false;
                // no default
            }
        },

        isSupported: _.constant(true),

        stop: function (e) {
            e.preventDefault();
            e.stopPropagation();
        },

        show: function () {
            // show dropzone
            this.visible = true;
            this.$el.show();
            this.trigger('show');
            $(window).trigger('resize');
        },

        hide: function () {
            // hide dropzone
            this.visible = this.checked = false;
            this.$el.hide().removeClass('dragover');
            this.trigger('hide');
        },

        initialize: function (options) {
            this.options = options;
            this.checked = false;
            this.visible = false;
            this.leaving = false;
            this.timeout = -1;
            this.eventTarget = options.eventTarget;
            this.folderSupport = options && options.folderSupport;

            this.onDrag = this.onDrag.bind(this);
            $(document).on(EVENTS, this.onDrag);
            // firefox does not fire dragleave correct when leaving the window.
            // it also does not fire mouseevents while dragging (so mouseout does not work either)
            // use mouseenter to remove the dropzones when eintering the window wiand nothing is dragged
            if (_.device('firefox')) {
                this.onMouseenter = this.onMouseenter.bind(this);
                $(document).on('mouseenter', this.onMouseenter);
            }

            if (this.eventTarget) {
                // check if event target is inside a different document (e.g. iframe)
                this.eventTargetDocument = this.eventTarget.prop('nodeName') === '#document' ? this.eventTarget.get(0) : this.eventTarget.prop('ownerDocument');
                if (this.eventTargetDocument !== document) $(this.eventTargetDocument).on(EVENTS, this.onDrag);

                this.onDrop = this.onDrop.bind(this);
                this.onDragenter = this.onDragenter.bind(this);
                this.onDragover = this.onDragover.bind(this);
                this.onDragleave = this.onDragleave.bind(this);
                this.eventTarget
                    .on('drop', this.onDrop)
                    .on('dragenter', this.onDragenter)
                    .on('dragover', this.onDragover)
                    .on('dragleave', this.onDragleave);
            }

            this.$el.on('dispose', function (e) { this.dispose(e); }.bind(this));
        },

        isValid: function (e) {
            if (!_.isFunction(this.isEnabled)) return this.isFile(e);
            return this.isEnabled(e) && this.isFile(e);
        },

        // overwrite for custom checks
        isEnabled: true,

        isFile: function (e) {
            var dt = e.originalEvent.dataTransfer;
            return _(dt.types).contains('Files') || _(dt.types).contains('application/x-moz-file');
        },

        filterDirectories: function (dataTransfer) {
            var def = new $.Deferred(),
                files = _(dataTransfer.files).toArray();

            // special handling for newer chrome, firefox or edge
            // check if items element is there (also needed for the e2e dropzone helper to work)
            if (dataTransfer.items && ((_.browser.Chrome && _.browser.Chrome > 21) || (_.browser.firefox && _.browser.firefox >= 50) || _.browser.edge)) {
                var items = dataTransfer.items;

                def.resolve(_(files).filter(function (file, index) {
                    var entry = items[index].webkitGetAsEntry();
                    if (entry.isDirectory) return false;

                    return true;
                }));
            } else {
                $.when.apply(this, _(files).map(function (file) {
                    // a directory has no type and has small size
                    if (!file.type && file.size <= 16384) {
                        var loadFile = new $.Deferred();

                        // try to read the file. if it is a folder, the result will contain an error
                        var reader = new FileReader();
                        reader.onloadend = function () {
                            loadFile.resolve(reader.error);
                        };
                        reader.readAsDataURL(file);

                        return loadFile;
                    }

                    return $.when();
                })).done(function () {
                    var args = arguments;
                    def.resolve(_(files).filter(function (file, index) {
                        return !args[index];
                    }));
                });
            }

            return def;
        },

        getFiles: function (e) {
            var dataTransfer = e.originalEvent.dataTransfer,
                numFiles = dataTransfer.files.length, // required for safari, which removes the files from that array while processing
                filter = this.options.filter;

            return this.filterDirectories(dataTransfer).then(function (files) {

                // numFiles !== null detects, when an image from inside appsuite (e.g. compose window) is dragged onto the dropzone
                if ((!files.length || numFiles !== files.length) && numFiles !== 0) {
                    require(['io.ox/core/yell', 'gettext!io.ox/core'], function (yell, gt) {
                        //#. 'display area' is the name used in the appsuite help/documentation for a zone where items can be droped at a drag & drop operation
                        yell('error', gt('Uploading folders is not supported in this display area.'));
                    });
                }

                // no regex?
                if (!_.isRegExp(filter)) return files;
                // apply regex to filter valid files
                return _(files).filter(function (file) {
                    return filter.test(file.name);
                });
            });
        },

        getFilesAndFolders: function (e) {
            var dataTransfer = e.originalEvent.dataTransfer;
            var allEntriesAccumulator = [];
            var droppedItems = dataTransfer.items;

            // Chrome does only read 100 entries per readEntries call,
            // repeat until the buffer is empty
            function directoryItemReader(item) {
                var dirReader = item.createReader();
                var readerDef = $.Deferred();
                var allItems = [];
                var readEntries = function () {
                    // readEntries returns void, must use callbacks
                    dirReader.readEntries(
                        function (items) {
                            if (items.length) {
                                allItems = allItems.concat(items);
                                // next round
                                readEntries();
                            } else {
                                // done
                                readerDef.resolve(allItems);
                            }
                        // error callback
                        }, function (err) {
                            readerDef.reject(err);
                        }
                    );
                };
                readEntries();
                return readerDef;
            }

            function traverseTreeAndAccumulateItems(item, path) {
                // just configuration, see comment further below
                var supportEmptyFolderUpload = false;
                var traverseDef = $.Deferred();

                if (item.isFile) {
                    item.file(function (file) {
                        allEntriesAccumulator.push({  // obj structure file
                            file: file,
                            fullPath: item.fullPath,
                            preventFileUpload: false,
                            isEmptyFolder: false
                        });
                        traverseDef.resolve();
                    });

                } else if (item.isDirectory) {
                    directoryItemReader(item).then(
                        function (entries) {
                            var entriesPromises = [];
                            var folderIsEmpty = entries.length === 0;
                            // Uploading empty folders is currently disabled. But keep the code to change it easily.
                            // Reason: Uploading folders via filepicker currently (2020) doesn't support uploading empty folders,
                            // so better have one consistent behavior for folder upload for the user.
                            if (folderIsEmpty && supportEmptyFolderUpload) {
                                allEntriesAccumulator.push({ // obj structure for emtpy folder
                                    file: {},
                                    fullPath: item.fullPath,
                                    preventFileUpload: true,
                                    isEmptyFolder: true
                                });
                                traverseDef.resolve();
                            } else {
                                entries.forEach(function (entr) {
                                    entriesPromises.push(traverseTreeAndAccumulateItems(entr, path + item.name + '/'));
                                });
                            }

                            $.when.apply($, entriesPromises).then(function () {
                                traverseDef.resolve(); // hint: finished with all containing items for this folder
                            }, function (err) {
                                traverseDef.reject(err);
                            });
                        },

                        function (err) {
                            traverseDef.reject(err);
                        }
                    );
                }

                return traverseDef;
            }

            var traverseAllEntriesPromises = _.map(droppedItems, function (droppedItem) {
                return traverseTreeAndAccumulateItems(droppedItem.webkitGetAsEntry(), '');
            });

            return $.when.apply($, traverseAllEntriesPromises)
                .then(
                    function () {
                        return allEntriesAccumulator;
                    }
                );
        },

        onDragenter: function (e) {
            // highlight dropzone
            $(e.currentTarget).parent().addClass('dragover');
        },

        onDragover: function (e) {
            // takes care of drop effect
            e.originalEvent.dataTransfer.dropEffect = 'copy';
        },

        onDragleave: function (e) {
            // remove highlight
            $(e.currentTarget).parent().removeClass('dragover');
        },

        // firefox only. Firefox has the strange behavior of only triggering this when no file is dragged
        // so it can be used to clear the dropzones (firefox does not trigger the dragleave event on window leave)
        onMouseenter: function (e) {
            if (!this.visible) return;
            var from = e.relatedTarget || e.toElement;
            if (!from) {
                _.delay(function () {
                    this.leaving = true;
                    clearTimeout(this.timeout);
                    this.onLeave(e);
                }.bind(this), 50);
            }
        },

        // while we can ignore document's drop event, we need this one
        // to detect that a file was dropped over the dropzone
        onDrop: function (e) {
            var self = this;
            var def = self.folderSupport ? this.getFilesAndFolders(e) : this.getFiles(e);
            // final event when a file was dropped over the dropzone
            def.then(function success(items) {
            //this.getFiles(e).then(function success(files) {
                // call proper event
                self.trigger(items.length > 0 ? 'drop' : 'invalid', items, e);
            }, function fail() {
                self.trigger('invalid', [], e);
            });
        },

        render: function () {

            this.$el.hide().append(
                $('<div class="abs dropzone-caption">').text(this.options.caption || ''),
                $('<div class="abs dropzone-dragover"><i class="fa fa-check" aria-hidden="true"></i></div>'),
                $('<div class="abs dropzone-overlay">')
            );

            return this;
        },

        dispose: function () {
            this.stopListening();
            $(document).off(EVENTS, this.onDrag);
            if (_.device('firefox')) {
                $(document).off('mouseenter', this.onMouseenter);
            }
            if (this.eventTarget) {
                if (this.eventTargetDocument !== document) $(this.eventTargetDocument).off(EVENTS, this.onDrag);

                this.eventTarget
                    .off('drop', this.onDrop)
                    .off('dragenter', this.onDragenter)
                    .off('dragover', this.onDragover)
                    .off('dragleave', this.onDragleave);
            }
        }
    });

    // avoid any native drop
    $(document).on('dragover drop', false);

    return {
        Inplace: InplaceDropzone
    };
});
