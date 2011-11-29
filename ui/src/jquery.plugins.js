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

(function () {

    "use strict";

    $.preventDefault = function (e) {
        e.preventDefault();
    };

    $.button = function (options) {

        // options
        var opt = $.extend({
            label: "",
            click: $.noop,
            enabled: true,
            data: {},
            theme: "bright",
            css: {}
            // other options:
            // tabIndex, id, mousedown
        }, options || {});

        // class name
        var className = "io-ox-button" + (!opt.enabled ? " disabled" : "");

        if (opt.theme === "dark") {
            // dark theme
            className += " dark";
        }

        // create text node
        var text;
        if (opt.label.nodeType === 3) {
            // is text node!
            text = opt.label;
        } else {
            text = document.createTextNode(opt.label);
        }

        // create button
        var button = $("<button/>").addClass(className).append(
            $("<span/>").append(text)
        ).on(
            "click", opt.data, opt.click
        );

        // add id?
        if (opt.id !== undefined) {
            button.attr("id", opt.id);
        }

        // add tabindex?
        if (opt.tabIndex !== undefined) {
            button.attr("tabindex", opt.tabIndex);
        }

        return button;
    };

    $.fn.busy = function (empty) {
        return this.each(function () {
            var self = $(this);
            clearTimeout(self.data("busy-timeout"));
            self.data("busy-timeout", setTimeout(function () {
                self.addClass("io-ox-busy");
                if (empty) {
                    self.empty();
                }
            }, 200));
        });
    };

    $.fn.idle = function () {
        return this.each(function () {
            var self = $(this);
            clearTimeout(self.data("busy-timeout"));
            self.removeClass("io-ox-busy");
        });
    };

    $.fn.intoViewport = function (node) {

        if (!node || this.length === 0) {
            return this;
        }

        try {

            // get pane
            var pane = $(node),
                // get pane height
                height = 0,
                // get visible area
                y1 = pane.scrollTop(),
                y2 = 0,
                // get top position
                top = this.offset().top + y1 - pane.offset().top,
                h = 0;
            // out of visible area?
            if (top < y1) {
                // scroll up!
                top = top < 50 ? 0 : top;
                pane.scrollTop(top);
            } else {
                // scroll down!
                y2 = y1 + pane.height();
                h = this.outerHeight();
                if (top + h > y2) {
                    pane.scrollTop(y1 + top + h - y2);
                }
            }

        } catch (e) {
            // IE sometimes crashes
            // even Chrome might get in trouble during ultra fast scrolling
            console.error("$.fn.intoViewport", this, e);
        }

        return this;
    };

    // center content via good old stupid table stuff
    $.center = function (stuff) {
        // probably does not run in IE properly
        return $("<div/>")
            .addClass("abs io-ox-center")
            .append($("<div/>").append(stuff));
    };

    $.fail = function (msg, retry) {
        var tmp = $("<span/>").addClass("io-ox-fail").text(msg);
        if (retry) {
            tmp = tmp.add(
                    $("<span/>").text(" ")
                ).add(
                    $("<span/>").text("Retry").addClass("link")
                    .on("click", function () {
                        $(this).parents(".io-ox-center").remove();
                        retry.apply(this, arguments);
                    })
                );
        }
        return $.center(tmp);
    };

    // simple shake effect

    $.fn.shake = function (num, dist, d) {
        // defaults
        num = num || 4;
        dist = dist || 10;
        d = d || 25;
        // return deferred
        var def = $.Deferred(), count = 0, max = num * 3,
            node = this.eq(0),
            position = node.css('position'),
            inc = function () {
                if (++count === max) {
                    node.css('position', position);
                    def.resolve();
                }
            };
        if (position !== 'absolute') {
            node.css('position', 'relative');
        }
        for (var i = 0; i < num; i++) {
            node.animate({ left: -dist }, d, inc)
                .animate({ left: dist }, d * 2, inc)
                .animate({ left: 0 }, d, inc);
        }
        return def;
    };

    $.txt = function (str) {
        return document.createTextNode(str);
    };

    $.inlineEdit = function () {

        var restore, blur, key, click;

        restore = function (node, text) {
            node.text(text).insertBefore(this);
            $(this).remove();
        };

        blur = function (e) {
            restore.call(this, e.data.node, $(this).val());
        };

        key = function (e) {
            var val;
            if (e.which === 13) {
                // enter = update
                if ((val = $.trim($(this).val()))) {
                    restore.call(this, e.data.node, val);
                    e.data.node.trigger("update", val);
                }
            } else if (e.which === 27) {
                // escape = cancel
                restore.call(this, e.data.node, e.data.text);
            }
        };

        click = function (e) {
            // create input field as replacement for current element
            var self = $(this);
            $('<input type="text" class="nice-input">')
                .css({
                    width: self.width() + "px",
                    fontSize: self.css("fontSize"),
                    fontWeight: self.css("fontWeight"),
                    lineHeight: self.css("lineHeight"),
                    marginBottom: self.css("marginBottom")
                })
                .val(self.text())
                .on("keydown", { node: self, text: self.text() }, key)
                .on("blur", { node: self }, blur)
                .insertBefore(self)
                .focus()
                .select();
            self.detach();
        };

        return $('<div>').on("dblclick", click);
    };

}());


