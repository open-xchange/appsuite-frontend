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
     'io.ox/core/commons',
     'io.ox/core/api/folder',
     'gettext!io.ox/files'
     ], function (viewDetail, ext, dialogs, api, upload, dnd, shortcuts, commons, folderAPI, gt) {

    'use strict';

    ext.point('io.ox/mail/icons/options').extend({
        thumbnailWidth: 128,
        thumbnailHeight: 90,
        fileIconWidth: 158,
        fileIconHeight: 182,
        fileFilterRegExp: '^[^.].*$'
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
                        $('<li class="active">').text('Searched for: ' + baton.app.getWindow().search.query)
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
                baton.$.iconContainer = $('<div class="icon-container">')
            );
        }
    });

    function startSlideshow(e) {
        e.preventDefault();
        require(['io.ox/files/carousel'], function (carousel) {
            var app = e.data.app;
            carousel.init({
                fullScreen: !!e.data.fullScreen,
                list: app.getFiles(),
                app: app,
                attachmentMode: false
            });
        });
    }

    function startMediaplayer(e) {
        e.preventDefault();
        require(['io.ox/files/mediaplayer'], function (mediaplayer) {
            var app = e.data.app;
            mediaplayer.init({
                list: app.getFiles(),
                app: app,
                videoSupport: !!e.data.videoSupport
            });
        });
    }

    ext.point('io.ox/files/icons/actions').extend({
        id: 'slideshow',
        draw: function (baton) {
            this.append(
                $('<a href="#" class="slideshow">').text(gt('View Slideshow'))
                    .on('click', { app: baton.app, fullScreen: false }, startSlideshow),
                $('<span class="slideshow_fullscreen">').append(
                    $.txt('('),
                    $('<a href="#" class="slideshow">').text(gt('Fullscreen'))
                        .on('click', { app: baton.app, fullScreen: true }, startSlideshow),
                    $.txt(')')
                )
            );
        }
    });

    ext.point('io.ox/files/icons/actions').extend({
        id: 'audioplayer',
        draw: function (baton) {
            this.append(
                $('<a href="#" class="mediaplayer">').text(gt('Play audio files'))
                    .on('click', { app: baton.app, fullScreen: true, videoSupport: false }, startMediaplayer)
            );
        }
    });

    ext.point('io.ox/files/icons/actions').extend({
        id: 'videoplayer',
        draw: function (baton) {
            console.log('ADD VIDEO', baton);
            this.append(
                $('<a href="#" class="mediaplayer">').show().text(gt('Play video files'))
                    .on('click', { app: baton.app, fullScreen: true, videoSupport: true }, startMediaplayer)
            );
        }
    });




    function drawGeneric(name) {
        var node = $('<i>');
        if (/docx?$/i.test(name)) { node.addClass('icon-align-left file-type-doc'); }
        else if (/xlsx?$/i.test(name)) { node.addClass('icon-table file-type-xls'); }
        else if (/pptx?$/i.test(name)) { node.addClass('icon-picture file-type-ppt'); }
        else if ((/mp3$/i).test(name)) { node.addClass('icon-music'); }
        else if ((/mp4$/i).test(name)) { node.addClass('icon-film'); }
        else if ((/ogv$/i).test(name)) { node.addClass('icon-film'); }
        else if ((/webm$/i).test(name)) { node.addClass('icon-film'); }
        else { node.addClass('icon-file'); }
        return node;
    }

    function iconError() {
        $(this).replaceWith(drawGeneric());
    }

    function drawImage(src) {
        return $('<img>', { alt: '', src: src })
            .addClass('img-polaroid').on('error', iconError);
    }

    function getIcon(file, options) {
        return api.getUrl(file, 'open') + '&scaleType=contain&width=' + options.thumbnailWidth + '&height=' + options.thumbnailHeight + '&content_type=' + file.file_mimetype;
    }

    ext.point('io.ox/files/icons/file').extend({
        draw: function (baton) {
            var file = baton.data,
                options = baton.options,
                img;
            this.addClass('file-icon pull-left').attr('data-cid', _.cid(file));
            if ((/^(image\/(gif|png|jpe?g|bmp|tiff))$/i).test(file.file_mimetype)) {
                img = drawImage(getIcon(file, options));
            } else {
                img = drawGeneric(file.filename);
            }
            this.append(
                $('<div class="wrap">').append(img),
                $('<div class="title">').text((file.title || '').replace(/^(.{10}).+(.{9})$/, "$1…$2"))
            );
        }
    });

    function iconClick(popup, e, target) {
        var cid = target.attr('data-cid');
        api.get(_.cid(cid)).done(function (file) {
            popup.append(viewDetail.draw(file).element);
        });
    }

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

    function filterMediaList(list) {
        return $.grep(list, function (o) { return (/\.(mp3|m4a|m4b|wma|wav|ogg)$/i).test(o.filename); });
    }

    function filterImagesList(list) {
        return $.grep(list, function (o) { return (/\.(gif|tiff|jpe?g|gmp|png)$/i).test(o.filename); });
    }

    function activateInlineLinks(list) {

        if (filterImagesList(list).length > 0) $('span.slideshow_fullscreen, a.slideshow').show();
        if (filterMediaList(list).length > 0) $('a.mediaplayer').show();
    }

    function calculateLayout(el, options) {

        var rows = Math.round((el.parent().height() - 40) / options.fileIconHeight);
        var cols = Math.floor((el.parent().width() - 6) / options.fileIconWidth);

        if (rows === 0) rows = 1;
        if (cols === 0) cols = 1;

        return { iconRows: rows, iconCols: cols, icons: rows * cols };
    }

    return _.extend(new ox.ui.Perspective('icons'), {

        draw: function (app) {
            var options = ext.point('io.ox/mail/icons/options').options();
            var win = app.getWindow(),
                iconview = $('<div class="files-scrollable-pane">'),
                iconContainer,
                start,
                end,
                drawIcons,
                redraw,
                drawFirst,
                allIds = [],
                displayedRows,
                layout,
                recalculateLayout,

                baton = new ext.Baton({ app: app }),

                dialog = new dialogs.SidePopup();

            this.main.append(
                $('<div class="files-iconview">').append(iconview)
            );

            app.getFiles = function () {
                return allIds;
            };

            layout = calculateLayout(iconview, options);

            dialog.delegate(iconview, '.file-icon', iconClick);

            drawIcons = function (ids) {
                return api.getList(ids).done(function (files) {
                    var nodes = [];
                    _(files).each(function (file) {
                        var node = $('<div>');
                        ext.point('io.ox/files/icons/file').invoke(
                            'draw', node, new ext.Baton({ data: file, options: options })
                        );
                        nodes.push(node);
                    });
                    iconContainer.find('.scroll-spacer').before(nodes);
                });
            };

            redraw = function (ids) {
                drawIcons(ids).done(function () {
                    $('.files-iconview').on('scroll', function (event) {
                        if ($('.files-scrollable-pane')[0].scrollHeight - $(this).scrollTop() === $(this).outerHeight()) {
                            $(this).off('scroll');
                            start = end;
                            end = end + layout.iconCols;
                            displayedRows = displayedRows + 1;
                            redraw(allIds.slice(start, end));
                        }
                    });
                });
            };

            drawFirst = function () {

                iconview.empty().busy();

                // call extensions

                ext.point('io.ox/files/icons').invoke('draw', iconview, baton);
                iconContainer = baton.$.iconContainer;

                // add inline link
                var inline;
                iconview.find('.breadcrumb').after(
                    inline = $('<div class="inline-actions">')
                );

                ext.point('io.ox/files/icons/actions').invoke('draw', inline, baton);

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
                        allIds = filterFiles(ids, options);
                        activateInlineLinks(allIds);
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

                if (last_layout.icons < layout.icons)
                {
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
                    win.busy((position + 1) / files.length);
                    return api.uploadFile({ file: file, folder: app.folder.get() });
                },
                stop: function () {
                    drawFirst();
                    win.idle();
                }
            });

            var dropZone = new dnd.UploadZone({
                ref: "io.ox/files/dnd/actions"
            }, app);

            var shortcutPoint = new shortcuts.Shortcuts({
                ref: "io.ox/files/shortcuts"
            });

            dropZone.include();

            $(window).resize(_.debounce(recalculateLayout, 300));

            win.on('search', function () {
                drawFirst();
            });

            win.on('cancel-search', function () {
                // TODO: Abort xhr request if still running
                drawFirst();
            });

            win.on("hide", function () {
                dropZone.remove();
                shortcutPoint.deactivate();
            });

//            // published?
//            app.folder.getData().done(function (data) {
//                win.nodes.title.find('.has-publications').remove();
//                if (data['com.openexchange.publish.publicationFlag']) {
//                    win.nodes.title.prepend(
//                        $('<img>', {
//                            src: ox.base + '/apps/themes/default/glyphicons_232_cloud_white.png',
//                            title: gt('This folder has publications'),
//                            alt: ''
//                        })
//                        .addClass('has-publications')
//                    );
//                }
//            });
        },

        render: function (app) {
            this.main.addClass('files-icon-perspective').empty();

            var that = this;

            app.on('folder:change', function (e, id, folder) {
                that.main.empty();
                that.draw(app);
            });

            this.draw(app);
        }
    });
});
