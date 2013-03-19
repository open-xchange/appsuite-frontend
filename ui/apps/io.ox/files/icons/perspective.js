/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/icons/perspective',
    ['io.ox/files/list/view-detail',
     'io.ox/core/extensions',
     'io.ox/core/tk/dialogs',
     'io.ox/files/api',
     'io.ox/core/tk/upload',
     'io.ox/core/extPatterns/dnd',
     'io.ox/core/extPatterns/shortcuts',
     'io.ox/core/api/folder',
     'gettext!io.ox/files',
     'io.ox/core/capabilities',
     'io.ox/core/tk/selection',
     'io.ox/core/notifications'
     ], function (viewDetail, ext, dialogs, api, upload, dnd, shortcuts, folderAPI, gt, Caps, Selection, notifications) {

    'use strict';

    var dropZone;

    ext.point('io.ox/files/icons/options').extend({
        thumbnailWidth: 128,
        thumbnailHeight: 90,
        fileIconWidth: 158,
        fileIconHeight: 182,
        fileFilterRegExp: '.*' // was: '^[^.].*$'
    });

    ext.point('io.ox/files/icons').extend({
        id: 'breadcrumb',
        index: 100,
        draw: function (baton) {
            if (!baton.app.getWindow().search.active) {
                this.append(
                    baton.$.breadcrumb = folderAPI.getBreadcrumb(baton.app.folder.get(), { handler: baton.app.folder.set })
                );
            }
        }
    });

    ext.point('io.ox/files/icons').extend({
        id: 'search-term',
        index: 100,
        draw: function (baton) {
            if (baton.app.getWindow().search.active) {
                this.append(
                    $('<li class="breadcrumb">').append(
                        $('<li class="active">').text(
                            //#. Appears in file icon view during searches
                            gt('Searched for: %1$s', baton.app.getWindow().search.query)
                        )
                    )
                );
            }
        }
    });

    ext.point('io.ox/files/icons').extend({
        id: 'icons',
        index: 200,
        draw: function (baton) {
            this.append(
                baton.$.iconContainer = $('<div class="file-icon-container">')
            );
        }
    });

    function drawGeneric(name) {
        var node = $('<i>');
        if (/docx?$/i.test(name)) { node.addClass('icon-align-left file-type-doc'); }
        else if (/xlsx?$/i.test(name)) { node.addClass('icon-table file-type-xls'); }
        else if (/pptx?$/i.test(name)) { node.addClass('icon-picture file-type-ppt'); }
        else if ((/(mp3|m4a)$/i).test(name)) { node.addClass('icon-music'); }
        else if ((/(mp4|ogv|webm)$/i).test(name)) { node.addClass('icon-film'); }
        else { node.addClass('icon-file'); }
        return node;
    }

    function iconError(e) {
        $(this).replaceWith(drawGeneric(e.data.name));
    }

    function officeIconError(e) {
        $(this).remove();
    }

    function drawImage(src) {
        return $('<img>', { alt: '', src: src }).addClass('img-polaroid');
    }

    function getCover(file, options) {
        return 'api/image/file/mp3Cover?folder=' + file.folder_id + '&id=' + file.id +
            '&scaleType=contain&width=' + options.thumbnailWidth + '&height=' + options.thumbnailHeight;
    }

    function getIcon(file, options) {
        return api.getUrl(file, 'open') +
            '&scaleType=contain&width=' + options.thumbnailWidth + '&height=' + options.thumbnailHeight +
            '&content_type=' + file.file_mimetype;
    }

    function getOfficePreview(file, options) {
        return 'api/infostore?action=document&folder=' + file.folder_id + '&id=' + file.id +
              '&scaleType=contain&width=' + options.thumbnailWidth + '&height=' + options.thumbnailHeight + '&format=preview_image&delivery=view';
    }

    function cut(str, maxLen, cutPos) {
            if (!cutPos) cutPos = 20;
            if (!maxLen) maxLen = 70;
            str = String(str || '');
            if (str.length > maxLen) {
                return str.substr(0, maxLen - cutPos).trim() + '\u2026' + str.substr(str.length - 8);
            } else {
                return str;
            }
        }

    function dropZoneInit(app) {
        if (_.browser.IE === undefined || _.browser.IE > 9) {
            dropZoneOff();
            dropZone = new dnd.UploadZone({
                ref: 'io.ox/files/dnd/actions'
            }, app);
            dropZoneOn();
        }
    }

    function dropZoneOn() {
        if (dropZone) dropZone.include();
    }

    function dropZoneOff() {
        if (dropZone) dropZone.remove();
    }

    ext.point('io.ox/files/icons/file').extend({
        draw: function (baton) {
            var file = baton.data,
                options = baton.options,
                img,
                wrap = $('<div class="wrap">'),
                iElement;
            this.addClass('file-icon pull-left selectable').attr('data-obj-id', _.cid(file));
            if ((/^(image\/(gif|png|jpe?g|bmp|tiff))$/i).test(file.file_mimetype)) {
                img = drawImage(getIcon(file, options)).on('error', { name: file.filename }, iconError);
            } else if ((/^audio\/(mpeg|m4a|x-m4a)$/i).test(file.file_mimetype)) {
                img = drawImage(getCover(file, options)).on('error', { name: file.filename }, iconError);
            } else if (Caps.has('document_preview') &&
                    (/^application\/.*(ms-word|ms-excel|ms-powerpoint|msword|msexcel|mspowerpoint|openxmlformats|opendocument|pdf|rtf).*$/i).test(file.file_mimetype) ||
                    (/^text\/.*(rtf|plain).*$/i).test(file.file_mimetype)) {
                iElement = drawGeneric(file.filename);
                wrap.append(iElement);
                img = drawImage(getOfficePreview(file, options)).on('error', { name: file.filename }, officeIconError);
                img.css('visibility', 'hidden');
                img.on('load', function (event) {
                    iElement.remove();
                    img.css('visibility', '');
                });

            } else {
                img = drawGeneric(file.filename);
            }
            this.append(
                wrap.append(img),
                $('<div class="title drag-title">').text(gt.noI18n(cut(file.title, 55))),
                $('<input type="checkbox" class="reflect-selection" style="display:none">')
            );
        }
    });

    function loadFiles(app) {
        if (!app.getWindow().search.active) {
            return api.getAll({ folder: app.folder.get() });
        } else {
            return api.search(app.getWindow().search.query);
        }
    }

    function filterFiles(files, options) {
        return $.grep(files, function (e) { return (new RegExp(options.fileFilterRegExp)).test(e.filename); });
    }

    function calculateLayout(el, options) {

        var rows = Math.round((el.height() - 40) / options.fileIconHeight);
        var cols = Math.floor((el.width() - 6) / options.fileIconWidth);

        if (rows === 0) rows = 1;
        if (cols === 0) cols = 1;

        return { iconRows: rows, iconCols: cols, icons: rows * cols };
    }

    return _.extend(new ox.ui.Perspective('icons'), {

        draw: function (app) {
            var options = ext.point('io.ox/files/icons/options').options(),
                win = app.getWindow(),
                iconview = $('<div class="files-scrollable-pane">'),
                iconContainer,
                start,
                end,
                drawIcon,
                drawIcons,
                redraw,
                drawFirst,
                allIds = [],
                drawnCids = [],
                displayedRows,
                layout,
                recalculateLayout,
                baton = new ext.Baton({ app: app }),
                dialog = new dialogs.SidePopup(),
                inline;

            this.main.append(
                $('<div class="files-iconview">').append(iconview)
            );

            Selection.extend(this, iconview, { draggable: true, dragType: 'mail' });

            layout = calculateLayout(iconview.parent(), options);

            var self = this;

            function iconClick(popup, e, target) {
                var cid = target.attr('data-obj-id');
                api.get(_.cid(cid)).done(function (file) {
                    app.currentFile = file;
                    if (dropZone) {
                        dropZone.update();
                    }
                    popup.append(viewDetail.draw(file));
                });
            }

            iconview.on('click', '.selectable', function (e) {
                var cid = _.cid($(this).attr('data-obj-id'));
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                    api.get(cid).done(function (file) {
                        app.currentFile = file;
                        if (dropZone) {
                            dropZone.update();
                        }
                        dialog.show(e, function (popup) {
                            popup.append(viewDetail.draw(file));
                        });
                        dialog.on('close', function () {
                            if (dropZone) {
                                var tmp = app.currentFile;
                                app.currentFile = null;
                                dropZone.update();
                                dropZoneInit(app);
                                app.currentFile = tmp;
                            }
                        });
                    });
                } else {
                    dialog.close();
                }
            });

            drawIcon = function (file) {
                var node = $('<div>');
                ext.point('io.ox/files/icons/file').invoke(
                    'draw', node, new ext.Baton({ data: file, options: options })
                );
                return node;
            };

            drawIcons = function (files) {
                iconContainer.find('.scroll-spacer', win).before(
                    _(files).map(function (file) {
                        drawnCids.push(_.cid(file));
                        return drawIcon(file);
                    })
                );
            };

            redraw = function (ids) {
                drawIcons(ids);
                $('.files-iconview').on('scroll', function (event) {
                    if ($('.files-scrollable-pane', win).length > 0 && $('.files-scrollable-pane', win)[0].scrollHeight - $(this).scrollTop() === $(this).outerHeight()) {
                        $(this).off('scroll');
                        start = end;
                        end = end + layout.iconCols;
                        if (layout.iconCols <= 3) end = end + 10;
                        displayedRows = displayedRows + 1;
                        redraw(allIds.slice(start, end));
                    }
                });
                self.selection.update();
            };

            drawFirst = function () {

                iconview.empty().busy();

                // call extensions

                ext.point('io.ox/files/icons').invoke('draw', iconview, baton);
                iconContainer = baton.$.iconContainer;

                // add inline link
                if ($('.inline-actions', iconview).length === 0) {
                    iconview.find('.breadcrumb').after(
                        inline = $('<div class="inline-actions">')
                    );
                }

                // add element to provoke scrolling
                iconContainer.append(
                    $('<div class="scroll-spacer">').css({ height: '50px', clear: 'both' })
                );

                loadFiles(app)
                    .done(function (ids) {
                        iconview.idle();
                        displayedRows = layout.iconRows;
                        start = 0;
                        end = displayedRows * layout.iconCols;
                        if (layout.iconCols <= 3) end = end + 10;
                        baton.allIds = filterFiles(ids, options);

                        allIds = baton.allIds;
                        self.selection.init(allIds);

                        redraw(allIds.slice(start, end));
                    })
                    .fail(function (response) {
                        iconview.idle();
                        iconContainer.prepend(
                            $('<div class="alert alert-info">').text(response.error)
                        );
                    });
            };

            recalculateLayout = function () {
                // This should be improved
                var last_layout = layout;
                layout = calculateLayout($('.files-iconview'), options);

                if (last_layout.icons < layout.icons) {
                    start = end;
                    end = end + (layout.icons - last_layout.icons);
                    redraw(allIds.slice(start, end));
                }
                displayedRows = layout.iconRows + 1;
                start = end;
                end = end + layout.iconCols;
                redraw(allIds.slice(start, end));
            };

            drawFirst();

            app.queues = {};

            app.queues.create = upload.createQueue({
                start: function () {
                    win.busy(0);
                },
                progress: function (file, position, files) {
                    var pct = position / files.length;
                    win.busy(pct, 0);
                    return api.uploadFile({ file: file, folder: app.folder.get() })
                    .progress(function (e) {
                        var sub = e.loaded / e.total;
                        win.busy(pct + sub / files.length, sub);
                    }).fail(function (e) {
                        if (e && e.code && e.code === 'UPL-0005')
                            notifications.yell('error', gt(e.error, e.error_params[0], e.error_params[1]));
                        else
                            notifications.yell('error', gt('This file has not been added'));
                    });
                },
                stop: function () {
                    api.trigger('refresh.all');
                    win.idle();
                }
            });

            app.queues.update = upload.createQueue({
                start: function () {
                    win.busy(0);
                },
                progress: function (file, position, files) {
                    var pct = position / files.length;
                    win.busy(pct, 0);
                    return api.uploadNewVersion({
                            file: file,
                            id: app.currentFile.id,
                            folder: app.currentFile.folder_id,
                            timestamp: app.currentFile.last_modified
                        }).progress(function (e) {
                            var sub = e.loaded / e.total;
                            win.busy(pct + sub / files.length, sub);
                        }).fail(function (e) {
                            if (e && e.code && e.code === 'UPL-0005')
                                notifications.yell('error', gt(e.error, e.error_params[0], e.error_params[1]));
                            else
                                notifications.yell('error', gt('This file has not been added'));
                        });
                },
                stop: function () {
                    win.idle();
                }
            });

            var shortcutPoint = new shortcuts.Shortcuts({
                ref: 'io.ox/files/shortcuts'
            });

            $(window).resize(_.debounce(recalculateLayout, 300));

            win.on('search', function () {
                drawFirst();
            });

            win.on('cancel-search', function () {
                // TODO: Abort xhr request if still running
                drawFirst();
            });

            win.on('hide', function () {
                shortcutPoint.deactivate();
            });

            api.on('delete.version', function () {
                // Close dialog after delete
                dialog.close();
            });

            api.on('update', function (e, obj) {
                // update icon
                var cid = _.cid(obj), icon = iconview.find('.file-icon[data-obj-id="' + cid + '"]');
                if (icon.length) {
                    icon.replaceWith(drawIcon(obj));
                }
            });

            api.on('refresh.all', function () {
                if (!app.getWindow().search.active) {
                    api.getAll({ folder: app.folder.get() }).done(function (ids) {

                        var hash = {}, oldhash = {}, oldIds, newIds, changed = [], deleted, added, indexPrev, indexPrevPosition, indexNextPosition;

                        indexPrev = function (index, cid) {
                            return _.indexOf(drawnCids, _.indexOf(index, cid) - 1);
                        };

                        indexPrevPosition = function (arr, key) {
                            return arr[(_.indexOf(arr, key) - 1 + arr.length) % arr.length];
                        };

                        indexNextPosition = function (arr, key) {
                            return arr[(_.indexOf(arr, key) + 1 + arr.length) % arr.length];
                        };

                        _(allIds).each(function (obj) {
                            oldhash[_.cid(obj)] = obj;
                        });

                        _(ids).each(function (obj) {
                            var cid = _.cid(obj);
                            hash[cid] = obj;

                            // Update if cid still exists, has already been drawn and object was modified.
                            // Note: If title is changed, last_modified date is not updated
                            if (_.isObject(oldhash[cid]) && (_.indexOf(drawnCids, cid) !== -1) &&
                               (obj.last_modified !== oldhash[cid].last_modified || obj.title !== oldhash[cid].title)) {
                                changed.push(cid);
                            }
                        });

                        oldIds = _.map(allIds, _.cid);
                        newIds = _.map(ids, _.cid);

                        deleted = _.difference(oldIds, newIds);
                        added   = _.difference(newIds, oldIds);

                        allIds  = ids;

                        baton.allIds = ids;
                        ext.point('io.ox/files/icons/actions').invoke('draw', inline.empty(), baton);

                        _(changed).each(function (cid) {

                            var data = hash[cid],
                                prev = indexPrevPosition(newIds, cid),
                                next = indexNextPosition(newIds, cid);

                            iconview.find('.file-icon[data-obj-id="' + cid + '"]').remove();

                            if (indexPrev(newIds, cid)) {
                                iconview.find('.file-icon[data-obj-id="' + prev + '"]').after(drawIcon(data));
                            } else {
                                end = end - 1;
                            }

                        });

                        _(deleted).each(function (cid) {

                            iconview.find('.file-icon[data-obj-id="' + cid + '"]').remove();
                            end = end - 1;

                        });

                        _(added).each(function (cid) {

                            var data = hash[cid],
                                prev = indexPrevPosition(newIds, cid);

                            if (indexPrev(newIds, cid)) {
                                if (iconview.find('.file-icon[data-obj-id="' + prev + '"]').length) {
                                    iconview.find('.file-icon[data-obj-id="' + prev + '"]').after(drawIcon(data));
                                } else {
                                    iconview.find('.file-icon-container').prepend(drawIcon(data));
                                }
                                end = end + 1;
                            }
                        });

                        recalculateLayout();

                        hash = oldhash = ids = null;
                    });
                } else {
                    drawFirst();
                }
            });
            api.trigger('refresh.all');
        },

        render: function (app) {
            this.main.addClass('files-icon-perspective').empty();
            var self = this;
            dropZoneInit(app);
            app.on('perspective:icons:hide', dropZoneOff)
               .on('perspective:icons:show', dropZoneOn)
               .on('folder:change', function (e, id, folder) {
                dropZoneInit(app);
                app.getWindow().search.close();
                self.main.closest('.search-open').removeClass('search-open');
                self.main.empty();
                self.draw(app);
            });

            this.draw(app);
        }
    });
});
