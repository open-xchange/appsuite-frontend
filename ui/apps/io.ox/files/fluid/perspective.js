/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/fluid/perspective',
    ['io.ox/files/fluid/view-detail',
     'io.ox/core/extensions',
     'io.ox/core/commons',
     'io.ox/core/tk/dialogs',
     'io.ox/files/api',
     'io.ox/core/date',
     'io.ox/core/tk/upload',
     'io.ox/core/extPatterns/dnd',
     'io.ox/core/extPatterns/shortcuts',
     'io.ox/core/extPatterns/actions',
     'io.ox/core/api/folder',
     'gettext!io.ox/files',
     'io.ox/core/capabilities',
     'io.ox/core/tk/selection',
     'io.ox/core/notifications',
     'apps/io.ox/core/tk/jquery.imageloader.js'
     ], function (viewDetail, ext, commons, dialogs, api, date, upload, dnd, shortcuts, actions, folderAPI, gt, Caps, Selection, notifications) {

    'use strict';

    var dropZone,
        loadFilesDef = $.Deferred(),
        dialog = new dialogs.SidePopup(),
        //nodes
        filesContainer, breadcrumb, inlineRight, inline, wrapper,
        scrollpane = $('<div class="files-scrollable-pane" role="section">'),
        topBar = $('<div class="window-content-top">'), // used on desktop
        topActions = $('<div class="inline-actions-ms">').appendTo(topBar);

    // *** helper functions ***

    function drawGenericIcon(name) {
        var node = $('<i>');
        if (/docx?$/i.test(name)) { node.addClass('icon-align-left file-type-doc'); }
        else if (/xlsx?$/i.test(name)) { node.addClass('icon-table file-type-xls'); }
        else if (/pptx?$/i.test(name)) { node.addClass('icon-picture file-type-ppt'); }
        else if ((/(aac|mp3|m4a|m4b|ogg|opus|wav)$/i).test(name)) { node.addClass('icon-music'); }
        else if ((/(mp4|ogv|webm)$/i).test(name)) { node.addClass('icon-film'); }
        else if ((/(epub|mobi)$/i).test(name)) { node.addClass('icon-book'); }
        else if ((/(cbz|cbr|cb7|cbt|cba)$/i).test(name)) { node.addClass('icon-comment-alt'); }
        else if ((/(zip|tar|gz|rar|7z|bz2)$/i).test(name)) { node.addClass('icon-archive'); }
        else { node.addClass('icon-file'); }
        return node;
    }

    function iconError() {
        $(this).remove();
    }

    function cut(str, maxLen, cutPos) {
        return _.ellipsis(str, {
                max: maxLen || 70,
                length: cutPos || 15,
                charpos: 'middle'
            });
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

    function previewMode(file) {
        if ((/^(image\/(gif|png|jpe?g|bmp|tiff))$/i).test(file.file_mimetype)) {
            return 'thumbnail';
        } else if ((/^audio\/(mpeg|m4a|m4b|mp3|ogg|oga|opus|x-m4a)$/i).test(file.file_mimetype)) {
            return 'cover';
        } else if (Caps.has('document_preview') &&
                (/^application\/.*(ms-word|ms-excel|ms-powerpoint|msword|msexcel|mspowerpoint|openxmlformats|opendocument|pdf|rtf).*$/i).test(file.file_mimetype) ||
                (/^text\/.*(rtf|plain).*$/i).test(file.file_mimetype)) {
            return 'preview';
        }
        return false;
    }

    function cid_find(str) {
        return str.replace(/\\\./g, '\\\\.');
    }

    function loadFiles(app) {
        var def = $.Deferred();
        if (!app.getWindow().search.active) {
            api.getAll({ folder: app.folder.get() }, false).done(def.resolve).fail(def.reject);
        } else {
            api.search(app.getWindow().search.query).done(def.resolve).fail(def.reject);
        }
        return def;
    }

    function getDateFormated(timestamp, options) {
        if (!_.isNumber(timestamp))
            return gt('unknown');
        var opt = $.extend({ fulldate: false, filtertoday: true }, options || {}),
            now = new date.Local(),
            d = new date.Local(timestamp),
            timestr = function () {
                return d.format(date.TIME);
            },
            datestr = function () {
                return d.format(date.DATE) + (opt.fulldate ? ' ' + timestr() : '');
            },
            isSameDay = function () {
                return d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getYear() === now.getYear();
            };
        return isSameDay() && opt.filtertoday ? timestr() : datestr();
    }

    function calculateLayout(el, options) {
        var rows = Math.round((el.height() - 40) / options.fileIconHeight),
            cols = Math.floor((el.width() - 6) / options.fileIconWidth);

        if (rows === 0) rows = 1;
        if (cols === 0) cols = 1;

        return { iconRows: rows, iconCols: cols, icons: rows * cols };
    }

    function identifyMode(opt) {
        var mode = opt.perspective.split(':')[1] || '';
        if (!/^(icon|list|tile)$/.test(mode)) {
            mode = 'list';
        }
        return mode;
    }

    function focus(prevent) {
        var y = wrapper.scrollTop();
        if (!!prevent) {
            //in some cases IE flickers without this hack
            filesContainer.addClass('fixed').focus().removeClass('fixed');
        } else {
            filesContainer.focus();
        }
        wrapper.scrollTop(y);
    }

    function preview(e, cid) {
        var app = this.baton.app, el;
        api.get(cid).done(function (file) {
            app.currentFile = file;
            if (dropZone) {
                dropZone.update();
            }
            dialog.show(e, function (popup) {
                popup.append(viewDetail.draw(file, app));
                el = popup.closest('.io-ox-sidepopup');
            });
            _.defer(function () { el.focus(); }); // Focus SidePopup
        });
    }
    // mobile multiselect helpers
    // Not DRYed, duplicated code from io.ox/core/commons because files modules
    // does not use a Vgrid. So we have to rewrite some code here to be used without a
    // vgrid.
    function drawMobileMultiselect(id, selected, selection) {
        var node = $('<div>'),
            points = {};
        ext.point('io.ox/core/commons/mobile/multiselect').invoke('draw', node, {count: selected.length});

        (points[id] || (points[id] = ext.point(id + '/mobileMultiSelect/toolbar')))
            .invoke('draw', node, {data: selected, selection: selection});
        return node;
    }

    function toggleToolbar(selected, selection) {
        // get current toolbar buttons
        var buttons = $('.window-toolbar .toolbar-button'),
            toolbar = $('.window-toolbar'),
            toolbarID = 'multi-select-toolbar',
            container;
        if ($('#' + toolbarID).length > 0) {
            // reuse old toolbar
            container = $('#' + toolbarID);
        } else {
            // or creaet a new one
            container = $('<div>', {id: toolbarID});
        }
        if (selected.length > 0) {

            buttons.hide();
            $('#multi-select-toolbar').remove();
            toolbar.append(container.append(drawMobileMultiselect('io.ox/files', selected, selection)));
        } else {
            // selection empty
            $('#multi-select-toolbar').remove();
            buttons.show();
        }
    }
    // END mobile multiselect helpers

    // *** ext points ***

    ext.point('io.ox/files/icons/options').extend({
        thumbnailWidth: 128,
        thumbnailHeight: 128,
        fileIconWidth: 158,
        fileIconHeight: 182
    });

    ext.point('io.ox/files/icons').extend({
        id: 'selection',
        register: function (baton) {
            var pers = this;
            Selection.extend(pers, scrollpane, { draggable: true, dragType: 'mail', scrollpane: wrapper, focus: undefined});
            pers.selection
                .setEditable(true, '.checkbox')
                .keyboard(scrollpane, true)
                // toggle visibility of multiselect actions
                .on('change', function (e, selected) {
                    var self = this, dummy = $('<div>');

                    // clear top-bar
                    topActions.empty();

                    if (_.device('smartphone')) {
                        // use custom multiselect toolbar
                        toggleToolbar(selected, self);
                    } else {

                        if (selected.length > 1) {
                            // draw inline links
                            commons.multiSelection('io.ox/files', dummy, selected, api, {test: selected.length}, {forcelimit: true});
                            // append to bar
                            topActions.append(dummy.find('.io-ox-inline-links'));
                            // fade in or yet visible?
                            if (!topActions.is(':visible')) {
                                topBar.stop().fadeIn(250);
                            }
                        } else {
                            topBar.stop().hide();
                        }
                    }
                    // set url
                    var id = _(selected.length > 50 ? selected.slice(0, 1) : selected).map(function (obj) {
                        return self.serialize(obj);
                    }).join(',');
                    _.url.hash('id', id !== '' ? id : null);
                })
                .on('keyboard', function (selEvent, orgEvent) {
                    var sel = this.get();
                    switch (orgEvent.keyCode || orgEvent.which) {
                    case 13: // enter: treat like click on title
                        if (sel.length === 1) {
                            //trigger click event on title (preview action)
                            $(orgEvent.target).find('[data-obj-id="' + _.cid(sel[0])  + '"]')
                                .find('.not-selectable')
                                .trigger('click');
                        }
                        break;
                    case 37: // left: treat like up
                        orgEvent.which = 38;
                        break;
                    case 39: // right: treat like down
                        orgEvent.which = 40;
                        break;
                    }
                })
                .on('update', function (e, state) {
                    var id = _.url.hash('id'),
                        list, cid, node;

                    //ids to list of objects
                    list = _.isEmpty(id) ? [] : id.split(/,/);
                    list = _(list).map(_.cid);

                    //set selection
                    if (list.length) {
                        // select by object (cid)
                        if (this.contains(list)) {
                            this.set(list);
                        } else {
                            _.url.hash('id', null);
                            this.clear();
                        }
                    } else {
                        if (_.device('!smartphone')) {
                            this.selectFirst();
                        }
                    }

                    //deep link handling
                    if (state === 'inital' && list.length === 1) {
                        cid = _.cid(this.get()[0]);
                        node = filesContainer.find('[data-obj-id="' + cid + '"]');
                        //node not drawn yet?
                        if (!node.length) {
                            //draw gap
                            pers.redrawGap(baton.allIds, cid);
                            node = filesContainer.find('[data-obj-id="' + cid + '"]');
                            wrapper.scrollTop(wrapper.prop('scrollHeight'));
                        }
                        //trigger click
                        node.trigger('click', 'automated');
                    }
                });
        }
    });

    ext.point('io.ox/files/icons').extend({
        id: 'search-term',
        index: 100,
        draw: function (baton) {
            if (baton.app.getWindow().search.active) {
                this.append(
                    breadcrumb = $('<li class="breadcrumb">').append(
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
                filesContainer = $('<div class="files-container f6-target view-' + baton.mode + '" tabindex="1">')
            );
        }
    });

    ext.point('io.ox/files/icons/file').extend({
        draw: function (baton) {
            var file = baton.data,
                options = _.extend({ version: true, scaletype: 'cover' }, baton.options),
                mode = previewMode(file),
                changed = getDateFormated(baton.data.last_modified),
                //view mode: icon
                iconImage = drawGenericIcon(file.filename),
                previewImage = $('<div class="preview">').append($('<span class="preview-border">').append(iconImage)),
                //view modes: list, tile
                iconBackground = drawGenericIcon(file.filename),
                previewBackground = $('<div class="preview-cover">').append(iconBackground);

            //use block instead flexbox
            if (_.browser.IE < 11 || _.browser.safari < 7) {
                previewImage.find('.preview-border').addClass('non-flexbox');
            }

            //add preview image
            if (mode) {
                var url = api.getUrl(file, mode, options);
                previewImage.find('.preview-border')
                    .append(
                        $('<img>', {
                                alt: '',
                                'data-src': url
                            })
                            .addClass('img-polaroid lazy')
                            .one({
                                load: function () {
                                    iconImage.remove();
                                    iconBackground.remove();
                                    previewBackground.css('backgroundImage', 'url(' + url + ')');
                                },
                                error: iconError
                            })
                    );
            }

            this.addClass('file-cell pull-left selectable')
                .attr('data-obj-id', _.cid(file))
                .attr('tabindex', -1)
                .append(
                    //checkbox
                    $('<div class="checkbox">').append(
                        $('<label>').append(
                            $('<input type="checkbox" class="reflect-selection" aria-hidden="true" tabindex="-1">')
                        )
                    ),
                    //preview
                    previewImage, previewBackground,
                    //details
                    $('<div class="details">').append(
                        //title
                        $('<div class="text title drag-title">').append(
                            $('<span class="not-selectable">').text(gt.noI18n(cut(file.filename || file.title, 55))).append(
                                    (file.locked_until ? $('<i class="icon-lock">') : '')
                                )
                        ),
                        //title-short
                        $('<span class="text title-hover">').text(gt.noI18n(cut(file.filename || file.title, 12))).append(
                                (file.locked_until ? $('<i class="icon-lock">') : '')
                            ),
                        //smart last modified
                        $('<span class="text modified">').text(gt.noI18n(changed)),
                        //filesize
                        $('<span class="text size">').text(gt.noI18n(_.filesize(file.file_size || 0, {digits: 1, zerochar: ''})))
                    )
                );
        }
    });

    // Mobile multi select extension points
    // action

    // move
    ext.point('io.ox/files/mobileMultiSelect/toolbar').extend({
        id: 'move',
        index: 10,
        draw: function (data) {
            //var baton = new ext.Baton({data: data.data}),
            var btn;
            $(this).append($('<div class="toolbar-button">')
                .append(btn = $('<a href="#" data-action="io.ox/files/actions/move">')
                    .append(
                        $('<i class="icon-signin">')
                    )
                )
            );
            actions.updateCustomControls($(this), data.data, {cssDisable: true, eventType: 'tap'});

        }
    });

    ext.point('io.ox/files/mobileMultiSelect/toolbar').extend({
        id: 'delete',
        index: 20,
        draw: function (data) {
            //var baton = new ext.Baton({data: data.data});
            $(this).append($('<div class="toolbar-button">')
                .append($('<a href="#" data-action="io.ox/files/actions/delete">')
                    .append(
                        $('<i>')
                            .addClass('icon-trash')
                    )
                )
            );
            actions.updateCustomControls($(this), data.data,  {cssDisable: true, eventType: 'tap'});
        }
    });

    // selection clear button
    ext.point('io.ox/files/mobileMultiSelect/toolbar').extend({
        id: 'selectionclear',
        index: 50,
        draw: function (data) {
            $(this).append($('<div class="toolbar-button" style="float:right">')
                .append($('<a href="#">')
                    .append(
                        $('<i class="icon-remove">').on('tap', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            data.selection.clear();
                        })
                    )
                )
            );
        }
    });

    // *** perspective ***
    return _.extend(new ox.ui.Perspective('fluid'), {

        //handles mode changes
        afterShow: function (app, opt) {
            var mode = identifyMode(opt), baton = this.baton;
            //mode changed?
            if (baton.mode !== mode) {
                //set button group state
                inlineRight
                    .find('a')
                    .removeClass('active');
                inlineRight
                    .find('[data-action="layout-' + mode + '"]')
                    .addClass('active');
                //switch to mode
                filesContainer.removeClass('view-' + baton.mode)
                                     .addClass('view-' + mode);
                //update baton
                baton.mode = mode;
                focus();
            }
        },

        render: function (app, opt) {
            var options = ext.point('io.ox/files/icons/options').options(),
                win = app.getWindow(),
                self = this,
                //functions
                drawFile,
                drawFiles,
                adjustWidth,
                redraw,
                drawFirst,
                layout,
                recalculateLayout,
                //simple
                start,
                end,
                allIds = [],
                drawnCids = [],
                displayedRows,
                baton = new ext.Baton({ app: app });
            self.baton = baton;
            baton.mode = identifyMode(opt);

            self.main.empty().append(
                                topBar,
                                wrapper = $('<div class="files-wrapper">')
                                            .append(
                                                scrollpane
                                            )
            );

            //register selection accessible via 'self.selection'
            ext.point('io.ox/files/icons').invoke(
                'register', self, baton
            );

            layout = calculateLayout(scrollpane.parent(), options);

            //set media query styles also if container width changes
            adjustWidth = function () {
                var width = wrapper.width(),
                    container = self.main;
                if (width > 768)
                    container.removeClass('width-less-than-768 width-less-than-480');
                else if (width >= 480 && width <= 768) {
                    container.addClass('width-less-than-768');
                    container.removeClass('width-less-than-480');
                } else if (width <= 480)
                    container.addClass('width-less-than-768 width-less-than-480');
            };
            adjustWidth();
            app.on('folderview:close folderview:open folderview:resize', _.debounce(adjustWidth, 300));

            //register dnd handler
            dropZoneInit(app);
            app.on('perspective:fluid:hide', dropZoneOff)
               .on('perspective:fluid:show', dropZoneOn)
               .on('folder:change', function () {
                    app.currentFile = null;
                    dropZoneInit(app);
                    app.getWindow().search.clear();
                    app.getWindow().search.active = false;
                    self.main.closest('.search-open').removeClass('search-open');
                    dialog.close();
                    breadcrumb = undefined;
                    allIds = [];
                    self.selection.clear();
                    drawFirst();
                });

            //register click handler
            scrollpane.on(_.device('smartphone') ? 'tap' : 'click', '.selectable', function (e, data) {
                var cid = _.cid($(this).attr('data-obj-id')),
                    special = (e.metaKey || e.ctrlKey || e.shiftKey || e.target.type === 'checkbox' || $(e.target).attr('class') === 'checkbox'),
                    valid = !filesContainer.hasClass('view-list') || $(e.target).hasClass('not-selectable') || data === 'automated';
                if (valid & !special)
                    preview.call(self, e, cid);
            });

            //register dialog handler
            dialog.on('close', function () {
                if (window.mejs) {
                    _(window.mejs.players).each(function (player) {
                        if ($(player.node).parents('.preview').length > 0) {
                            player.pause();
                        }
                    });
                }
                if (dropZone) {
                    var tmp = app.currentFile;
                    app.currentFile = null;
                    dropZone.update();
                    dropZoneInit(app);
                    app.currentFile = tmp;
                }
                focus(true);
            });

            drawFile = function (file) {
                var node = $('<a>');
                ext.point('io.ox/files/icons/file').invoke(
                    'draw', node, new ext.Baton({ data: file, options: options })
                );
                return node;
            };

            drawFiles = function (files) {
                filesContainer.find('.scroll-spacer').before(
                    _(files).map(function (file) {
                        drawnCids.push(_.cid(file));
                        return drawFile(file);
                    })
                );
            };

            redraw = function (ids) {
                drawFiles(ids);
                wrapper.on('scroll', function () {
                    /*
                     *  How this works:
                     *
                     *      +--------+     0
                     *      |        |
                     *      |        |
                     *      |        |
                     *      |        |
                     *   +--+--------+--+  scrollTop
                     *   |  |        |  |
                     *   |  |        |  |
                     *   |  |        |  |  height
                     *   |  |        |  |
                     *   |  |        |  |
                     *   +--+--------+--+  bottom
                     *      |        |
                     *      |        |
                     *      +--------+     scrollHeight
                     *
                     *  If bottom and scrollHeight are near (~ 50 pixels) load new icons.
                     *
                     */
                    var scrollTop = wrapper.scrollTop(),
                        scrollHeight = wrapper.prop('scrollHeight'),
                        height = wrapper.outerHeight(),
                        bottom = scrollTop + height;
                    // scrolled to bottom?
                    if (bottom > (scrollHeight - 50)) {
                        wrapper.off('scroll');
                        start = end;
                        end = end + layout.iconCols;
                        if (layout.iconCols <= 3) end = end + 10;
                        displayedRows = displayedRows + 1;
                        redraw(allIds.slice(start, end));
                    }
                });
                $('img.img-polaroid').imageloader({
                    callback: function (elm) {
                        $(elm).fadeIn().removeClass('lazy');
                    },
                    timeout: 60000
                });

                self.selection.update();
            };

            self.redrawGap = function (ids, cid) {
                start = end;
                _.find(ids, function (file, index) {
                    //identify gap
                    if (cid === _.cid(file)) {
                        end = Math.min(index + 1, baton.allIds.length);
                        return true;
                    }
                });
                //draw gap
                redraw(baton.allIds.slice(start, end));
            };

            drawFirst = function () {
                scrollpane.empty().busy();

                loadFilesDef.reject();

                loadFilesDef = loadFiles(app);

                loadFilesDef.then(
                    function success(ids) {

                        scrollpane.empty().idle();
                        baton.allIds = allIds = ids;
                        ext.point('io.ox/files/icons').invoke('draw', scrollpane, baton);

                        //anchor node
                        if (!breadcrumb)
                            scrollpane.prepend(breadcrumb = $('<div>'));
                         // add inline link
                        if ($('.inline-actions', scrollpane).length === 0) {
                            breadcrumb.after(
                                inline = $('<div>').addClass('inline-actions'),
                                inlineRight = $('<div>').addClass('inline-actions-right'),
                                $('<div>').addClass('clearfix')
                            );
                        }

                        // add element to provoke scrolling
                        filesContainer.append(
                            $('<div class="scroll-spacer">').css({ height: '20px', clear: 'both' })
                        );

                        displayedRows = layout.iconRows;
                        start = 0;
                        end = displayedRows * layout.iconCols;
                        if (layout.iconCols <= 3) end = end + 10;

                        redraw(allIds.slice(start, end));

                        ext.point('io.ox/files/icons/actions').invoke('draw', inline.empty(), baton);
                        ext.point('io.ox/files/icons/actions-right').invoke('draw', inlineRight.empty(), baton);
                        //set button state
                        inlineRight.find('[data-ref="io.ox/files/actions/layout-' + baton.mode + '"]').addClass('active');

                        self.selection
                                .init(allIds)
                                .trigger('update', 'inital');

                        focus();
                    },
                    function fail(response) {
                        if (response) {
                            scrollpane.idle();
                            notifications.yell('error', response.error);
                        }
                    }
                );
            };

            recalculateLayout = function () {
                // This should be improved
                var last_layout = layout;
                layout = calculateLayout($('.files-wrapper'), options);

                if (last_layout.icons < layout.icons) {
                    start = end;
                    end = end + (layout.icons - last_layout.icons);
                    redraw(allIds.slice(start, end));
                }
                displayedRows = layout.iconRows + 1;
                start = end;
                end = end + layout.iconCols;
                redraw(allIds.slice(start, end));
                //adjust topBar width on window resize
                adjustWidth();
            };

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
                    })
                    .fail(function (e) {
                        if (e && e.data && e.data.custom) {
                            notifications.yell(e.data.custom.type, e.data.custom.text);
                        }
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
                            timestamp: _.now()
                        })
                        .progress(function (e) {
                            var sub = e.loaded / e.total;
                            win.busy(pct + sub / files.length, sub);
                        }).fail(function (e) {
                            if (e && e.data && e.data.custom) {
                                notifications.yell(e.data.custom.type, e.data.custom.text);
                            }
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

            win.on('search cancel-search', function () {
                breadcrumb = undefined;
                allIds = [];
                drawFirst();
            });

            win.on('hide', function () {
                shortcutPoint.deactivate();
            });

            api.on('update', function (e, obj) {
                // update icon
                var cid = _.cid(obj),
                    icon = scrollpane.find('.file-cell[data-obj-id="' + cid_find(cid) + '"]');
                if (icon.length) {
                    icon.replaceWith(drawFile(obj));
                }
            });

            api.on('refresh.all', function () {
                if (!app.getWindow().search.active) {
                    api.getAll({ folder: app.folder.get() }, false).done(function (ids) {

                        var hash = {},
                            oldhash  = {},
                            oldIds   = [],
                            newIds   = [],
                            changed  = [],
                            deleted  = [],
                            added    = [],
                            indexPrev,
                            indexPrevPosition,
                            indexNextPosition;

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

                        for (var id in oldIds) {
                            if (-1 === newIds.indexOf(oldIds[id])) {
                                deleted.push(oldIds[id]);
                            }
                        }

                        for (var id in newIds) {
                            if (-1 === oldIds.indexOf(newIds[id])) {
                                added.push(newIds[id]);
                            }
                        }

                        baton.allIds = allIds = ids;

                        ext.point('io.ox/files/icons/actions').invoke('draw', inline.empty(), baton);

                        _(changed).each(function (cid) {

                            var data = hash[cid],
                                prev = indexPrevPosition(newIds, cid);

                            scrollpane.find('.file-cell[data-obj-id="' + cid_find(cid) + '"]').remove();

                            if (indexPrev(newIds, cid)) {
                                if (scrollpane.find('.file-cell[data-obj-id="' + cid_find(prev) + '"]').length) {
                                    scrollpane.find('.file-cell[data-obj-id="' + cid_find(prev) + '"]').after(drawFile(data));
                                } else {
                                    scrollpane.find('.files-container').prepend(drawFile(data));
                                }
                            } else {
                                end = end - 1;
                            }

                        });

                        _(deleted).each(function (cid) {

                            scrollpane.find('.file-cell[data-obj-id="' + cid_find(cid) + '"]').remove();
                            end = end - 1;

                        });

                        _(added).each(function (cid) {

                            var data = hash[cid],
                                prev = indexPrevPosition(newIds, cid);

                            if (indexPrev(newIds, cid)) {
                                if (scrollpane.find('.file-cell[data-obj-id="' + cid_find(prev) + '"]').length) {
                                    scrollpane.find('.file-cell[data-obj-id="' + cid_find(prev) + '"]').after(drawFile(data));
                                } else {
                                    scrollpane.find('.files-container').prepend(drawFile(data));
                                }
                                end = end + 1;
                            }
                        });
                        recalculateLayout();

                        self.selection
                                .init(allIds)
                                .trigger('update');

                        focus();
                        hash = oldhash = oldIds = newIds = changed = deleted = added = indexPrev = indexPrevPosition = indexNextPosition = null;
                    });
                }
            });
            drawFirst();
        }
    });
});
