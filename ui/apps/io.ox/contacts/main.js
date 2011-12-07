/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define("io.ox/contacts/main",
    ["io.ox/contacts/util", "io.ox/contacts/api", "io.ox/core/tk/vgrid",
     "io.ox/help/hints",
     "io.ox/contacts/view-detail",
     "io.ox/core/config",
     "io.ox/core/extensions",
     "css!io.ox/contacts/style.css"
    ], function (util, api, VGrid, hints, viewDetail, config, ext) {

    "use strict";

    // application object
    var app = ox.ui.createApp(),
        // app window
        win,
        // grid
        grid,
        GRID_WIDTH = 290,
        // nodes
        left,
        thumbs,
        right;

    // launcher
    app.setLauncher(function () {

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/contacts',
            title: "Global Address Book",
            titleWidth: (GRID_WIDTH - 10) + "px",
            toolbar: true,
            search: true
        });

        app.setWindow(win);

//      create extensionpoints
//      link actions

//        ext.point("io.ox/contacts/main/create").extend({
//            index: 100,
//            id: "create",
//            action: function () {
//                create.show();
//            }
//        });

//      ext.point link creation

        ext.point("io.ox/contacts/links/toolbar").extend(new ext.Link({
            index: 100,
            id: "create",
            label: "create",
            ref: "io.ox/contacts/main/create"
        }));



        // left panel
        left = $("<div/>")
            .addClass("leftside border-right")
            .css({
                width: GRID_WIDTH + "px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);

        // thumb index
        thumbs = $("<div/>")
            .addClass("atb contact-grid-index border-left border-right")
            .css({
                left: GRID_WIDTH + 3 + "px",
                width: "34px"
            })
            .appendTo(win.nodes.main);

        // right panel
        right = $("<div/>")
            .css({ left: GRID_WIDTH + 39 + "px", overflow: "auto" })
            .addClass("rightside default-content-padding")
            .appendTo(win.nodes.main);

        // grid
        grid = new VGrid(left);

        // add template
        grid.addTemplate({
            build: function () {
                var name, email, job;
                this
                    .addClass("contact")
                    .append(name = $("<div/>").addClass("fullname"))
                    .append(email = $("<div/>"))
                    .append(job = $("<div/>").addClass("bright-text"));
                return { name: name, job: job, email: email };
            },
            set: function (data, fields, index) {
                if (data.mark_as_distributionlist === true) {
                    fields.name.text(data.display_name || "");
                    fields.email.text("");
                    fields.job.text("Distribution list");
                } else {
                    fields.name.text(util.getFullName(data));
                    fields.email.text(util.getMail(data));
                    fields.job.text(util.getJob(data));
                }
            }
        });

        // add label template
        grid.addLabelTemplate({
            build: function () {
            },
            set: function (data, fields, index) {
                var name = data.last_name || data.display_name || "#";
                this.text(name.substr(0, 1).toUpperCase());
            }
        });

        // requires new label?
        grid.requiresLabel = function (i, data, current) {
            var name = data.last_name || data.display_name || "#",
                prefix = name.substr(0, 1).toUpperCase();
            return (i === 0 || prefix !== current) ? prefix : false;
        };

        // all request
        grid.setAllRequest(function () {
            return api.getAll();
        });

        // search request
        grid.setAllRequest("search", function () {
            return api.search(win.search.query);
        });

        // list request
        grid.setListRequest(function (ids) {
            return api.getList(ids);
        });

        /*
         * Search handling
         */
        win.bind("search", function (q) {
            grid.setMode("search");
        });

        win.bind("cancel-search", function () {
            grid.setMode("all");
        });

        // LFO callback
        var showContact, drawContact, drawFail;

        showContact = function (obj) {
            // get contact
            right.busy(true);
            api.get(obj)
                .done(_.lfo(drawContact))
                .fail(_.lfo(drawFail, obj));
        };

        drawContact = function (data) {
            //right.idle().empty().append(base.draw(data));
            right.idle().empty().append(viewDetail.draw(data));

        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail("Connection lost.", function () {
                    showContact(obj);
                })
            );
        };
        /*
         * Selection handling
         */
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                showContact(selection[0]);
            } else {
                right.empty();
            }
        });

        /**
         * Thumb index
         */

        function drawThumb(char) {
            return $("<div/>").addClass("thumb-index border-bottom")
                .text(char)
                .on("click", { text: char }, grid.scrollToLabelText);
        }

        // draw thumb index
        grid.bind("ids-loaded", function () {
            // get labels
            thumbs.empty();
            var textIndex = grid.getLabels().textIndex, char = "";
            for (char in textIndex) {
                // add thumb
                thumbs.append(drawThumb(char));
            }
        });

        win.bind("show", function () {
            grid.selection.keyboard(true);
        });
        win.bind("hide", function () {
            grid.selection.keyboard(false);
        });

        // bind all refresh
        api.bind("refresh.all", function (data) {
            grid.refresh();
        });

        // bind list refresh
        api.bind("refresh.list", function (data) {
            grid.repaint();
        });

        // go!
        win.show(function () {
            grid.paint();

            /* turn off for demo purposes
            var searchAdapter = {
                    search: function (options) {
                        api.search(options.query)
                            .done(_.lfo(options.success))
                            .fail(_.lfo(options.fail));
                    }
                };
            $("#autocomplete").tokenInput(searchAdapter, {
                searchDelay: 500,
                minChars: 3,
                tokenLimit: 3,
                propertyToSearch: 'display_name',
                preventDuplicates: false,
                theme: 'ox',
                onResult: function (result, query) {
                    //console.debug('on Result');
                    console.debug(arguments);
                    result.unshift({display_name: query, last_name: query});
                    return result;
                },
                onAdd: function (input, tokenlist) {
                    var q = "";
                    console.debug("ONADD");
                    console.debug(tokenlist);
                    _.each(tokenlist, function (token) {
                        q += " " + token.last_name;
                    });
                    $(this).val($.trim(q));
                },
                onDelete: function (token_data, tokenlist) {
                    var q = "";
                    console.debug('onDelete');
                    console.debug(token_data);
                    _.each(tokenlist, function (token) {
                        q += " " + token.last_name;
                    });
                    $(this).val($.trim(q));
                },
                onReady: function () {
                    console.debug('onReady');
                }
            });
            */
        });
    });

    return {
        getApp: app.getInstance
    };
});
var getTestCreate = function () {
    "use strict";
    require(["io.ox/contacts/tests"], function (test) {
    // test for create
        test.testCreate();
    });
};
var getTestEdit = function () {
    "use strict";
    require(["io.ox/contacts/tests"], function (test) {
    // test for edit
        test.testEdit();
    });
};
