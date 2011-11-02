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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/conversation/main",
    ["io.ox/mail/util",
     "io.ox/conversation/api",
     "io.ox/core/tk/vgrid",
     "css!io.ox/conversation/style.css"
    ], function (util, api, VGrid) {
    
    "use strict";
    
    // application object
    var app = ox.ui.createApp(),
        // app window
        win,
        // grid
        grid,
        gridWidth = 310,
        // nodes
        left,
        right;
    
    // launcher
    app.setLauncher(function () {
    
        // get window
        win = ox.ui.createWindow({
            title: "Conversations",
            toolbar: true
        });
        
        win.addClass("io-ox-conversations-main");
        app.setWindow(win);
        
        // left panel
        left = $("<div/>")
            .addClass("leftside border-right")
            .css({
                width: gridWidth + "px"
            })
            .appendTo(win.nodes.main);
        
        // right panel
        right = $("<div/>")
            .css({ left: gridWidth + 1 + "px" })
            .addClass("rightside io-ox-conversation")
            .appendTo(win.nodes.main);
        
        // grid
        grid = new VGrid(left);
        
        // add template
        grid.addTemplate({
            build: function () {
                var subject;
                this.addClass("conversation")
                    .append(
                        $("<div/>")
                        .append(subject = $("<span/>").addClass("subject"))
                    );
                return { subject: subject };
            },
            set: function (data, fields, index) {
                fields.subject.text(data.subject || "#");
            }
        });
        
        // all request
        grid.setAllRequest(function () {
            return api.getAll();
        });
        
        // list request
        grid.setListRequest(function (ids) {
            return api.getList(ids);
        });
        
        // -------------------------------------------------------------
        
        var currentChatId = null,
            
            lastMessage = "",
            
            drawMessages,
            
            pollTimer = null,
            
            stopPolling = function () {
                if (pollTimer !== null) {
                    clearInterval(pollTimer);
                    pollTimer = null;
                }
            },
            
            startPolling = function () {
                stopPolling();
                pollTimer = setInterval(function () {
                    // fetch messages
                    api.getMessages(currentChatId)
                    .done(drawMessages);
                }, 1000);
            };
        
        var pane = $("<div>").addClass("abs conversation default-content-padding")
            .css({ overflow: "auto" })
            .appendTo(right);
        
        var box = $("<div>").addClass("abs box")
            .append(
                $("<textarea>")
                .css("resize", "none")
                .on("keydown", function (e) {
                    var self, val;
                    // pressed enter?
                    if (e.which === 13) {
                        self = $(this);
                        val = self.val();
                        self.attr("disabled", "disabled");
                        api.sendMessage(currentChatId, val)
                            .done(function () {
                                lastMessage = val;
                                self.val("").removeAttr("disabled");
                            })
                            .fail(function () {
                                self.removeAttr("disabled");
                            });
                    } else if (e.which === 38) {
                        self = $(this);
                        if (self.val() === "") {
                            self.val(lastMessage);
                        }
                    }
                })
            )
            .appendTo(right);
            
        drawMessages = function (list) {
            
            pane.idle().empty();
            
            _(list).each(function (msg) {
                pane.append(
                    $("<div>").addClass("message")
                    .append(
                        $("<div>").addClass("from")
                        .text(msg.from.name)
                    )
                    .append(
                        $("<div>").addClass("text")
                        .text(msg.text)
                    )
                );
            });
            
            pane.scrollTop(pane.get(0).scrollHeight);
        };
        
        var showChat = function (obj) {
            currentChatId = obj.id;
            startPolling();
        };
        
        /*
         * Selection handling
         */
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                showChat(selection[0]);
            } else {
                pane.empty();
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
        });
    });
    
    return {
        getApp: app.getInstance
    };
});
