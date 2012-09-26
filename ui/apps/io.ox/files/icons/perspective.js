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
                img = $('<img>', { alt: file.title });
            this.addClass('file-icon pull-left').attr('data-cid', _.cid(file));
            if ((/^((?!\._?).)*\.(gif|tiff|jpe?g|gmp|png)$/i).test(file.filename) && (/^(image\/(gif|png|jpe?g|gmp)|(application\/octet-stream))$/i).test(file.file_mimetype)) {
                img.attr('src', api.getIcon(file)).addClass('img-polaroid lazy');
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

    return _.extend(new ox.ui.Perspective('icons'), {

        draw: function (app) {

            var options = ext.point('io.ox/mail/icons/options').options();
            var that = this,
                mode = false,
                win = app.getWindow(),
                currentDetailViewTarget,
                iconview = $('<div class="files-scrollable-pane">'),
                iconContainer,
                rows,
                cols,
                start,
                end,
                drawIcons,
                redraw,
                loadAll,
                drawFirst,
                allIds,
                displayedRows,
                fileIconHeight = 149,
                fileIconWidth = 176,

                baton = new ext.Baton({ app: app }),

                dialog = new dialogs.SidePopup();

            this.main.append(
                $('<div class="files-iconview">').append(iconview)
            );

            var filesIconviewHeight = iconview.parent().height() - 26;
            var filesIconviewWidth = iconview.parent().width() - 26;

            dialog.delegate(iconview, '.file-icon', iconClick);

            loadAll = function () {
                var deferred = new $.Deferred();
                if (!mode) {
                    api.getAll({ folder: app.folder.get() })
                        .done(deferred.resolve)
                        .fail(deferred.reject);
                } else {
                    api.search(win.search.query, {
                        action: "search"
                    })
                    .done(deferred.resolve)
                    .fail(deferred.reject);
                }
                return deferred;
            };

            drawIcons = function (ids) {
                return api.getList(ids).done(function (files) {
                    var nodes = [];
                    _(files).each(function (file) {
                        var node = $('<div>');
                        ext.point('io.ox/files/icons/file').invoke(
                            'draw', node, new ext.Baton({ data: file })
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
                            end = end + cols;
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

                loadAll().done(function (ids) {
                    iconview.idle();
                    // still some work to do here. get's stuck sometimes
                    rows = Math.round(filesIconviewHeight / fileIconHeight);
                    cols = Math.round(filesIconviewWidth / fileIconWidth);
                    displayedRows = rows + 1;
                    start = 0;
                    end = displayedRows * cols;
                    allIds = ids;
                    redraw(allIds.slice(start, end));
                });
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

            win.on('search cancel-search', function (e) {
                mode = (e.type === 'search' ? true : false);
                drawFirst();
            });

            // published?
            app.folder.getData().done(function (data) {
                win.nodes.title.find('.has-publications').remove();
                if (data['com.openexchange.publish.publicationFlag']) {
                    win.nodes.title.prepend(
                        $('<img>', {
                            src: ox.base + '/apps/themes/default/glyphicons_232_cloud_white.png',
                            title: gt('This folder has publications'),
                            alt: ''
                        })
                        .addClass('has-publications')
                    );
                }
            });
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
