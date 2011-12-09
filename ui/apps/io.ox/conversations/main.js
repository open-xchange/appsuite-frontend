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

define("io.ox/conversations/main",
    ["io.ox/mail/util",
     "io.ox/conversations/api",
     "io.ox/core/tk/vgrid",
     "io.ox/core/api/user",
     "io.ox/core/config",
     "io.ox/core/extensions",
     "css!io.ox/conversations/style.css",
     "io.ox/conversations/actions"
    ], function (util, api, VGrid, userAPI, config, ext) {

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
        right,

        notifications = window.webkitNotifications,
        useNotifier = false;

    // launcher
    app.setLauncher(function () {

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/conversations',
            title: "Conversations",
            toolbar: true
        });

        win.addClass("io-ox-conversations-main");
        app.setWindow(win);

        // use notifications?
        if (notifications && document.webkitHidden !== undefined) {
            // get permission (0 = granted, 1 = ask, 2 = off)
            var perm = notifications.checkPermission();
            if (perm === 1) {
                // add toolbar link
                win.addButton({
                    label: "Use notifications",
                    action: function () {
                        notifications.requestPermission(function () {
                            useNotifier = true;
                        });
                    }
                });
            } else if (perm === 0) {
                useNotifier = true;
            }
        }

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
            //return $.Deferred().resolve([{ id: "db-0-1017" }]);
            return api.getAll();
        });

        // list request
        grid.setListRequest(function (ids) {
            //return $.Deferred().resolve([{ id: "db-0-1017", subject: "YEAH" }]);
            return api.getList(ids);
        });

        // -------------------------------------------------------------

        var currentChatId = null,
            lastMessage = "",
            lastMessageId = null,
            lastTimestamp = 0,
            pollTimer = null,
            firstPoll = true,
            // const
            POLL_FREQ = 2000,
            // current user id
            myself = String(config.get("identifier")),
            // DOM nodes
            pane, controls, textarea,
            // functions
            stopPolling,
            startPolling,
            resumePolling,
            pollNow,
            tick,
            processMessages,
            applyEmoticons,
            drawMessages,
            sendMessage;

        stopPolling = function () {
            if (pollTimer !== null) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
        };

        resumePolling = function () {
            if (pollTimer === null && currentChatId !== null) {
                pollTimer = setInterval(tick, POLL_FREQ);
            }
        };

        startPolling = function (id) {
            // stop running poll
            stopPolling();
            // init
            currentChatId = id;
            lastMessageId = null;
            lastTimestamp = 0;
            firstPoll = true;
            // poll now and every 1 second
            tick();
            resumePolling();
        };

        pollNow = function () {
            stopPolling();
            tick();
            resumePolling();
        };

        processMessages = function (list) {

            // remove stupid new unread object
            list.pop();

            // get most recent message
            var last = _(list).last() || { id: null, timestamp: 0 };
            // got new messages?
            if (last.id !== null && last.id !== lastMessageId) {

                lastMessageId = last.id;
                lastTimestamp = last.timestamp;

                drawMessages(list);

                // show notification?
                if (!firstPoll && useNotifier && ox.windowState === "background") {

                    var from = last.from || { name: "" };

                    userAPI.getPictureURL(from.id)
                        .done(function (url) {
                            // create & show notification
                            var n = notifications.createNotification(url, from.name, last.text);
                            n.show();
                            setTimeout(function () {
                                n.cancel();
                            }, 5000);
                        });
                }

                firstPoll = false;
            }
        };

        tick = function () {
            // fetch messages
            if (ox.session) {
//                processMessages([
//                    { id: 1, from: { id: 3, name: "Rafael" }, text: "Hi, lunch at 14h?", timestamp: 1320271984084 },
//                    { id: 2, from: { id: 4, name: "Matthias" }, text: "(y) Yep, where?", timestamp: 1320271984084 },
//                    { id: 3, from: { id: 3, name: "Rafael" }, text: "Stadtgrill :)", timestamp: 1320271984084 },
//                    { id: 4, from: { id: 4, name: "Matthias" }, text: "Okay... *just a test*", timestamp: 1320271984084 },
//                    { id: 5, from: { id: 5, name: "Tobi" }, text: "Lebenszeitvernichtung für Designer: I got 96/100 in this html5 kerning game http://type.method.ac :D", timestamp: 1320273474082 }
//                ]);
                api.getMessages(currentChatId, lastTimestamp)
                .done(processMessages);
            }
        };

        var emoticons = { ":D": "bigsmile", ":)": "smile", "(y)": "yes" };

        applyEmoticons = function (str) {
            return '<img src="' + ox.base + "/apps/io.ox/conversations/images/" +
                emoticons[str] + '.gif" class="emoticon">';
        };

        drawMessages = function (list) {

            _(list).each(function (msg) {
                var html = String(msg.text)
                        .replace(/</g, '&lt;')
                        .replace(/(\:D|\:\)|\(y\))/g, applyEmoticons)
                        .replace(/\*(\w[^\*]*\w)\*/g, "<b>$1</b>")
                        .replace(/(http:\/\/\S+)/ig, '<a href="$1" target="_blank">$1</a>'),
                    from = msg.from || {};
                pane.append(
                    $("<div>").addClass("message")
                    .append(
                        userAPI.getPicture(from.id)
                        .addClass("picture")
                    )
                    .append(
                        $("<div>").addClass("from" + (from.id === myself ? " me" : ""))
                        .text(from.name)
                    )
                    .append(
                        $("<div>").addClass("text")
                        .html(html)
                    )
                );
            });

            pane.parent().scrollTop(pane.height() + 100);
        };

        sendMessage = function () {
            var val = $.trim(textarea.val());
            if (val !== "") {
                textarea.attr("disabled", "disabled");
                api.sendMessage(currentChatId, val)
                    .done(function () {
                        lastMessage = val;
                        textarea.val("");
                        pollNow();
                    })
                    .always(function () {
                        textarea.removeAttr("disabled").focus();
                    });
            }
        };

        $("<div>").addClass("abs conversation default-content-padding")
            .css({ overflow: "auto", paddingBottom: "0" })
            .append(
                pane = $("<div>").addClass("centered-box")
            )
            .appendTo(right);

        textarea = $("<textarea>")
            .attr({ placeholder: "Type your message here..." })
            .css("resize", "none")
            .on("keydown", function (e) {
                // don't bubble up to the vgrid
                e.stopPropagation();
                var self;
                // pressed enter?
                if (e.which === 13) {
                    sendMessage();
                } else if (e.which === 38) {
                    self = $(this);
                    if (self.val() === "") {
                        self.val(lastMessage).select();
                    }
                }
            });

        controls = $("<div>").addClass("abs controls")
            .append(
                $("<div>").addClass("centered-box")
                .append(textarea)
                .append(
                    $("<button>").addClass("send").text("Send")
                    .on("click", sendMessage)
                )
            )
            .appendTo(right);

        var showChat = function (data) {
            // clear messages
            pane.idle().empty();
            // add subject
            pane.append(
                $.inlineEdit()
                .text(data.subject || "No subject")
                .css({
                    fontWeight: "bold",
                    fontSize: "14pt",
                    color: "#aaa",
                    lineHeight: "1.5em",
                    width: "500px",
                    marginBottom: "1em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                })
                .on("update", function (e, subject) {
                    api.update(data.id, { subject: subject });
                })
            );
            // focus textarea
            textarea.val("").focus();
            startPolling(data.id);
        };

        /*
         * Selection handling
         */
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                pane.busy();
                api.get({ id: selection[0].id })
                    .done(_.lfo(showChat));
            } else {
                pane.empty();
            }
        });

        win.bind("show", function () {
            grid.selection.keyboard(true);
            resumePolling();
        });
        win.bind("hide", function () {
            grid.selection.keyboard(false);
            stopPolling();
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
