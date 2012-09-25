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
     'gettext!io.ox/files/files',
     'io.ox/core/config'
     ], function (viewDetail, ext, dialogs, api, upload, dnd, shortcuts, commons, gt, config) {

    'use strict';

    var perspective = new ox.ui.Perspective('icons');

    _.extend(perspective, {
        app:            null,
        dialog:         $(),
        iconview:       $(),

        drawIcon: function (file) {
            var node = $('<div class="file-icon pull-left">').attr('data-obj-id', file.id),
                wrap = $('<div class="wrap">');
            if ((/^((?!\._?).)*\.(gif|jpg|jpeg|tiff|jpe?g|gmp|png)$/i).test(file.filename) && (/^(image\/(gif|png|jpe?g|gmp)|(application\/octet-stream))$/i).test(file.file_mimetype)) {
                var src = api.getIcon(file);
                node.append(wrap.append($('<img>', { src: src, alt: file.title }).addClass('img-polaroid').addClass('lazy')));
            }
            else
            {
                node.append(wrap.append(
                    $('<img>', { src: ox.base + '/apps/themes/default/icons/file-generic.png', alt: file.title }).addClass('file-generic')
                ));
            }
            node.append($('<div class="title">').text(
                    file.title.replace(/^(.{10}).+(.{9})$/, "$1…$2")));
            return node;
        },

        draw: function (app) {
            var that = this;
            var mode = false,
                win = app.getWindow(),
                currentDetailViewTarget,
                iconview = $('<div class="files-scrollable-pane">'),
                rows,
                cols,
                start,
                end,
                drawIcons,
                Icon,
                redraw,
                loadAll,
                drawFirst,
                allIds,
                displayedRows,
                fileIconHeight = 149,
                fileIconWidth = 176;

            this.main.append(iconview);

            var filesIconviewHeight = iconview.parent().height() - 26;
            var filesIconviewWidth = iconview.parent().width() - 26;

            iconview.on('click', '.file-icon', function (data) {
                var currentTarget = $(data.currentTarget).attr('data-obj-id');
                if (currentDetailViewTarget !== currentTarget)
                {
                    that.dialog.show(data, function (popup, e, target) {
                        currentDetailViewTarget = currentTarget;
                        api.get({id: currentTarget}).done(function (file) {
                            var currentDetailView = viewDetail.draw(file);
                            popup.append(currentDetailView.element);
                        });
                    });
                }
                else
                {
                    currentDetailViewTarget = null;
                }
            });

            loadAll = function () {
                var deferred = new $.Deferred();
                if (!mode)
                {
                    api.getAll({ folder: app.folder.get() })
                        .done(deferred.resolve)
                        .fail(deferred.reject);
                }
                else
                {
                    api.search(win.search.query, {
                        action: "search"
                    })
                        .done(deferred.resolve)
                        .fail(deferred.reject);
                }
                return deferred;
            };

            drawIcons = function (ids) {
                var deferred = new $.Deferred();
                api.getList(ids)
                    .done(function (files) {
                        _(files).each(function (file) {
                            iconview.append(that.drawIcon(file));
                        });
                        deferred.resolve();
                    })
                    .fail(deferred.reject);
                return deferred;
            };
            var loadingResults;

            redraw = function (ids) {
                drawIcons(ids).done(function () {
                    var $p = $('.files-scrollable-pane');
                    var $o = $('.files-iconview');
                    $o.on('scroll', function (event) {
                        if ($p[0].scrollHeight - $o.scrollTop() === $o.outerHeight()) {
                            if (!loadingResults) {
                                $o.off('scroll');
                                start = end;
                                end = end + cols;
                                displayedRows = displayedRows + 1;
                                redraw(allIds.slice(start, end));
                            }
                        }
                    });
                });
            };

            drawFirst = function () {
                loadAll().done(function (ids) {
                    iconview.idle();
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

            win.on('search cancel-search', function (e) {
                mode = (e.type === 'search' ? true : false);
                iconview.empty().busy();
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
            this.main.addClass('files-iconview')
                .empty();

            var that = this,
                win = app.getWindow();

            app.on('folder:change', function (e, id, folder) {
                that.main.empty();
                that.draw(app);
            });

            this.dialog = new dialogs.SidePopup();
            this.draw(app);
        }
    });

    return perspective;

});
