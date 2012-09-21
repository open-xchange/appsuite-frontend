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
            var node = $('<div class="file-icon pull-left">').attr('data-obj-id', file.id);
            var wrap = $('<div class="wrap">');
            if (file.file_mimetype.match(/^image\/[gif|png|jpe?g|gmp]/i)) {
                var src = api.getIcon(file);
                node.append(wrap.append($('<img>', { 'data-original': src, alt: file.title }).addClass('img-polaroid').addClass('lazy')));
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
            var mode = false;
            var win = app.getWindow(),
                currentDetailViewTarget,
                chunk,
                $view = this.main;
            var rows, cols;
            var fileIconHeight = 175;
            var fileIconWidth = 138;
            var fileiconMargin = 30;

            Array.prototype.chunk = function (chunkSize) {
                var array = this;
                return [].concat.apply([],
                    array.map(function (elem, i) {
                        return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
                    })
                );
            };

            this.main.on('click', '.file-icon', function (data) {
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

            var drawIcons, drawIconview, loadIcon, Icon;

            loadIcon = function () {
                var deferred = new $.Deferred();
                if (!mode)
                {
                    api.getAll({ folder: app.folder.get() })
                        .done(function (ids) {
                            chunk = 0;
                            //var tmp = ids.chunk(rows * cols * 2);
                            //api.getList(tmp[chunk])
                            api.getList(ids)
                            .done(deferred.resolve)
                            .fail(deferred.reject);
                        })
                        .fail(_.lfo(deferred.reject));
                }
                else
                {
                    api.search(win.search.query, {
                        action: "search"
                    })
                    .done(function (ids) {
                        api.getList(ids)
                            .done(deferred.resolve)
                            .fail(deferred.reject);
                    })
                    .fail(deferred.reject);

                }
                return deferred;
            };

            drawIcons = function () {
                var deferred = new $.Deferred();
                loadIcon().done(function (files) {
                    _(files).each(function (file) {
                        $view.append(that.drawIcon(file));
                    });
                    $view.idle().addClass('files-iconview-background');
                    deferred.resolve();
                });
                return deferred;
            };

            var redraw = function () {
                rows = Math.floor($view.height() / (fileIconHeight + fileiconMargin));
                cols = Math.floor($view.width() / (fileIconWidth + fileiconMargin));
                $view.empty().busy().removeClass('files-iconview-background');
                drawIcons().done(function () {
                    $(".file-icon > div > img").lazyload({
                        container: $view
                    });
                });
            };

            redraw();

            win.on('search cancel-search', function (e) {
                mode = (e.type === 'search' ? true : false);
                redraw();
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
            this.main.addClass('files-iconview').empty();
            var that = this;
            var win = app.getWindow();
            app.on('folder:change', function (e, id, folder) {
                that.draw(app);
            });
            this.dialog = new dialogs.SidePopup();
            this.draw(app);
        }
    });

    return perspective;

});
