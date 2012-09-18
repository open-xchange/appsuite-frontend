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
     'io.ox/core/config',
     'less!io.ox/files/icons/style.css'
     ], function (viewDetail, ext, dialogs, api, upload, dnd, shortcuts, commons, gt, config) {

    'use strict';

    var perspective = new ox.ui.Perspective('icons');

    _.extend(perspective, {
        app:            null,
        dialog:         $(),

        draw: function (app) {
            var that = this;

            var win = app.getWindow(),
                iconview;

            iconview = $('<div class="files-iconview">')
                .on('click', '.file-icon', function (data) {
                    $('.files-iconview > .file-icon').removeClass('selected');
                    $(this).addClass('selected');
                    api.get({id: $(data.currentTarget).attr('data-obj-id')}).done(function (file) {
                        app.currentFile = file;
                    });
                })
                .on('dblclick', '.file-icon', function (data) {
                    that.dialog.show(data, function (popup, e, target) {
                        api.get({id: $(data.currentTarget).attr('data-obj-id')}).done(function (file) {
                            var currentDetailView = viewDetail.draw(file);
                            popup.append(currentDetailView.element)
                                .on("dblclick", function (e) {
                                    if (_(["a", "button", "input", "textarea"]).include(e.srcElement.tagName.toLowerCase())) {
                                        return;
                                    }
                                    if (currentDetailView) {
                                        currentDetailView.toggleEdit();
                                    }
                                });
                        });
                    });
                })
                .appendTo(this.main.empty());

            var drawIcon, showIconview, drawIconview, drawFail;

            drawIcon = function (file) {
                var preview = $('<div class="file-icon pull-left">')
                    .attr('data-obj-id', file.id);
                var wrap = $('<div class="wrap img-polaroid">');
                if (file.file_mimetype.match(/^image\/[gif|png|jpe?g|gmp]/i)) {
                    var src = api.getIcon(file);
                    preview.append(wrap.append($('<img>', { src: src, alt: file.title })));
                }
                else
                {
                    preview.append(wrap.append(
                        $('<span class="file-mimetype label">')
                            .text(file.file_mimetype)
                    ));
                }
                preview.append($('<div class="title">').text(
                        file.title.replace(/^(.{26}).+(.{10})$/, "$1…$2")));
                return preview;
            };

            showIconview = function (mode) {
                iconview.busy(true);
                if (!mode)
                {
                    api.getAll({ columns: "20,1,700,701,703,705,706", folder: app.folder.get() }, false)
                        .done(_.lfo(drawIconview))
                        .fail(_.lfo(drawFail));
                }
                else
                {
                    api.search(win.search.query, {
                        action: "search",
                        columns: "20,1,700,701,703,705,706",
                        sort: "700",
                        order: "asc"
                    })
                        .done(_.lfo(drawIconview))
                        .fail(_.lfo(drawFail));
                }
            };

            drawIconview = function (data) {
                iconview.idle().empty().append(
                    _(data).each(function (file) {
                        iconview.append(drawIcon(file));
                    })
                );
            };

            drawFail = function () {
                iconview.idle().empty().append(
                    $.fail("Oops, couldn't load file data.", function () {
                        showIconview();
                    })
                );
            };
            showIconview();

            win.on('search', function () {
                showIconview(true);
            })
            .on('cancel-search', function () {
                showIconview();
            });

        },
        render: function (app) {
            this.app = app;
            var win = app.getWindow();
            app.on('folder:change', function () {
                this.draw(app);
            });
            this.dialog = new dialogs.SidePopup({ arrow: false});
            this.draw(app);
        }
    });

    return perspective;

});
