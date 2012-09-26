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
     'gettext!io.ox/files/files',
     'io.ox/core/config'
     ], function (viewDetail, ext, dialogs, api, upload, dnd, shortcuts, commons, folderAPI, gt, config) {

    'use strict';

    ext.point('io.ox/mail/icons/options').extend({
        fileIconWidth: 176,
        fileIconHeight: 149
    });

    ext.point('io.ox/files/icons').extend({
        id: 'breadcrumb',
        index: 100,
        draw: function (baton) {
            if (!baton.app.getWindow().search.active) {
                this.append(
                    baton.$.breadcrumb = folderAPI.getBreadcrumb(baton.app.folder.get(), baton.app.folder.set)
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
                    $('<h4 class="search-query">').text('Searched for: ' + baton.app.getWindow().search.query)
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

    ext.point('io.ox/files/icons/file').extend({
        draw: function (baton) {
            var file = baton.data,
                options = baton.options,
                img = $('<img>', { alt: file.title });
            this.addClass('file-icon pull-left').attr('data-cid', _.cid(file));
            if ((/^((?!\._?).)*\.(gif|tiff|jpe?g|gmp|png)$/i).test(file.filename) && (/^(image\/(gif|png|jpe?g|gmp)|(application\/octet-stream))$/i).test(file.file_mimetype)) {
                img.attr('src', getIcon(file, options)).addClass('img-polaroid');
            } else {
                img.attr('src', ox.base + '/apps/themes/default/icons/file-generic.png').addClass('file-generic');
            }
            this.append(
                $('<div class="wrap">').append(img),
                $('<div class="title">').text(file.title.replace(/^(.{10}).+(.{9})$/, "$1…$2"))
            );
        }
    });

    function iconClick(popup, e, target) {
        var cid = target.attr('data-cid');
        api.get(_.cid(cid)).done(function (file) {
            popup.append(viewDetail.draw(file).element);
        });
    }

    function getIcon(file, options) {
        return api.getUrl(file, 'open') + '&scaleType=contain&width=' + options.fileIconWidth + '&height=' + options.fileIconHeight;
    }

    function loadFiles(app) {
        var deferred = new $.Deferred();
        if (!app.getWindow().search.active) {
            api.getAll({ folder: app.folder.get() })
                .done(deferred.resolve)
                .fail(deferred.reject);
        } else {
            api.search(app.getWindow().search.query)
            .done(deferred.resolve)
            .fail(deferred.reject);
        }
        return deferred;
    }

    function calculateLayout(el, options) {
        return { iconRows: Math.round(el.parent().height() / options.fileIconHeight),
                 iconCols: Math.round(el.parent().width() / options.fileIconWidth) };
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
                allIds,
                displayedRows,
                layout,
                recalculateLayout,

                baton = new ext.Baton({ app: app }),

                dialog = new dialogs.SidePopup();

            this.main.append(
                $('<div class="files-iconview">').append(iconview)
            );

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

                // add element to provoke scrolling
                iconContainer.append(
                    $('<div class="scroll-spacer">').css({ height: '50px', clear: 'both' })
                );

                loadFiles(app).done(function (ids) {
                    iconview.idle();
                    // still some work to do here. get's stuck sometimes
                    displayedRows = layout.iconRows + 1;
                    start = 0;
                    end = displayedRows * layout.iconCols;
                    allIds = ids;
                    redraw(allIds.slice(start, end));
                });
            };

            recalculateLayout = function () {
                // This should be improved
                var last_layout = layout;
                layout = calculateLayout($('.files-iconview'), options);
                if (last_layout.iconCols !== layout.iconCols || last_layout.iconRows !== layout.iconRows)
                {
                    $('.icon-container').empty().append(
                        $('<div class="scroll-spacer">').css({ height: '50px', clear: 'both' })
                    );
                    displayedRows = layout.iconRows + 1;
                    start = 0;
                    end = displayedRows * layout.iconCols;
                    redraw(allIds.slice(start, end));
                }
            };

            drawFirst();

            app.queues = {};

            app.queues.create = upload.createQueue({
                processFile: function (file) {
                    win.busy();
                    return api.uploadFile({file: file, folder: app.folder.get()})
                        .done(drawFirst)
                        .always(win.idle);
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

            win.on('search cancel-search', function (e) {
                drawFirst();
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
