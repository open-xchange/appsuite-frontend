/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

(function () {

    "use strict";

    // is defined!
    var ext = require('io.ox/core/extensions'),
        // dependencies
        deps = [
            "io.ox/core/extensions",
            "io.ox/core/config",
            "io.ox/core/api/user",
            "io.ox/core/i18n",
            "css!io.ox/portal/style.css"
        ].concat(ext.getPlugins({ prefix: 'plugins/portal/', name: 'portal' }));

    define("io.ox/portal/main", deps, function (ext, config, userAPI, i18n) {

        // application object
        var app = ox.ui.createApp(),
            // app window
            win,
            // update window title
            updateTitle = function () {
                win.setTitle(
                    $($.txt(i18n.getGreetingPhrase()))
                    .add($.txt(", "))
                    .add(userAPI.getTextNode(config.get("identifier")))
                    .add($.txt(" "))
                    .add($("<small>").addClass("subtitle").text("(" + ox.user + ")"))
                );
            };

        // launcher
        app.setLauncher(function () {

            // get window
            app.setWindow(win = ox.ui.createWindow({
                toolbar: true
            }));

            updateTitle();
            _.every(1, "hour", updateTitle);

            win.nodes.main.addClass("io-ox-portal").css({overflow: "auto"});

            var widgets = $(),
                lastCols = 0,
                columnTemplate = $("<div>").addClass("io-ox-portal-column");

            var resize = function () {

                var availWidth = win.nodes.main.width(),
                    numColumns = Math.max(1, availWidth / 400 >> 0),
                    width = 100 / numColumns,
                    columns = $(),
                    i, last;

                // create layout
                if (numColumns !== lastCols) {

                    win.nodes.main.find(".io-ox-portal-widget").detach();

                    for (i = 0; i < numColumns; i++) {
                        last = i % numColumns === numColumns - 1;
                        columns = columns.add(
                            columnTemplate.clone().css({
                                width: width - (last ? 0 : 5) + "%",
                                marginRight: last ? "0%": "5%"
                            })
                        );
                    }

                    win.nodes.main.empty().append(columns);

                    widgets.each(function (i, node) {
                        columns.eq(i % numColumns).append(node);
                    });

                    lastCols = numColumns;
                }
            };

            // demo AD widget
            ext.point('io.ox/portal/widget').extend({
                index: 410,
                id: 'ad',
                load: function () {
                    return $.when();
                },
                draw: function (data) {
                    this.append(
                        $("<img>")
                        .attr("src", ox.base + "/apps/themes/default/ad2.jpg")
                        .css({ width: "100%", height: "auto" })
                    );
                    return $.when();
                }
            });

            //TODO: Add Configurability
            ext.point("io.ox/portal/widget").each(function (extension) {

                var $node = $("<div>")
                    .addClass("io-ox-portal-widget")
                    .busy();

                widgets = widgets.add($node);

                extension.invoke("load")
                    .done(function (data) {
                        var drawingDone = extension.invoke("draw", $node, [data]);
                        if (drawingDone) {
                            drawingDone.done(function () {
                                $node.idle();
                            });
                        } else {
                            $node.idle();
                        }
                    })
                    .fail(function (e) {
                        $node.idle().remove(); //idle().text(String(e.error));
                    });
            });

            win.bind("show", function () {
                $(window).on("resize", resize);
                resize();
            });

            win.bind("hide", function () {
                $(window).off("resize", resize);
            });

            // go!
            win.show();
        });


        // TODO: Resize

        return {
            getApp: app.getInstance
        };
    });
}());