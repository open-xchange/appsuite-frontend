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

    // save some original jQuery methods
    $.original = { val: $.fn.val };

    $.preventDefault = function (e) {
        e.preventDefault();
    };

    $.escape = function (str) {
        return String(str).replace(/([!"#$%&'()*+,.\/:;<=>?@\[\]\^`{|}~])/g, '\\$1');
    };

    $.button = function (options) {

        // options
        var opt = $.extend({
            label: "",
            click: $.noop,
            enabled: true,
            data: {},
            css: {},
            primary: false,
            info: false,
            success: false,
            warning: false,
            danger: false,
            inverse: false

            // other options:
            // tabIndex, id, mousedown
        }, options || {});
        // class name
        var className;
        if (opt.purelink === true) {
            className = "button io-ox-action-link";
        } else {
            className = "btn" + (!opt.enabled ? " btn-disabled" : "") + (opt.primary ? " btn-primary" : "") + (opt.info ? " btn-info" : "") + (opt.success ? " btn-success" : "") + (opt.warning ? " btn-warning" : "") + (opt.danger ? " btn-danger" : "") + (opt.inverse ? " btn-inverse" : "");

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
        var button;
        if (opt.purelink === true) {
            button = $("<a>").addClass(className).append(text);

        } else {
            button = $("<button>").addClass(className).append(
                $("<span>").append(text)
                );
        }
        button.on(
        "click", opt.data, opt.click
        );

        // add id?
        if (opt.id !== undefined) {
            button.attr("id", opt.id);
        }

        button.attr("data-action", opt.dataaction || opt.data.action);

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
    $.fn.center = function () {
        // probably does not run in IE properly
        return this.wrap($('<div>').addClass('io-ox-center')).parent();
    };

    $.fail = function (msg, retry) {
        var tmp = $("<div>")
            .addClass('io-ox-fail')
            .append(
                $('<span>').text(msg)
            );
        if (retry) {
            tmp.append(
                $('<span>').text(' ')
            )
            .append(
                $('<a>', { href: '#' }).text('Retry')
                .on('click', function (e) {
                    e.preventDefault();
                    $(this).closest('.io-ox-center').remove();
                    retry.apply(this, arguments);
                })
            );
        }
        return tmp.center();
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
        return document.createTextNode(str !== undefined ? str : '');
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

    $.fn.scrollable = function () {
        return $('<div>').addClass('scrollable-pane').appendTo(this.addClass('scrollable'));
    };

    $.labelize = (function () {

        var guid = 1;

        return function (node, id) {
            if (node.attr('id')) {
                id = node.attr('id');
            } else {
                id = (id || 'field') + '_' + (guid++);
            }
            return $('<label>', { 'for': id }).addClass('wrapping-label').append(node.attr('id', id));
        };
    }());

    $.alert = function (title, text) {
        return $('<div>').addClass('alert alert-block alert-error fade in')
            .append(
                $('<a>', { href: '#' }).addClass('close').attr('data-dismiss', 'alert').html('&times;'),
                title ? $('<h4>').addClass('alert-heading').text(title) : $(),
                text ? $('<p>').text(text) : $()
            );
    };

    $.linkSplit = function(str) {
        var regex = new RegExp("(?:https?:\/\/|ftp:\/\/|mailto:|news\\\\.|www\\\\.)[-A-Za-z0-9+&@#\/%?=~_()|!:,.;]*[-A-Za-z0-9+&@#\/%=~_()|]", "gi");
        var parts = [], match, lastIndex = 0;

        while (match = regex.exec(str)) {
            parts.push($( document.createTextNode(str.substring(lastIndex, match.index))));
            parts.push($( document.createTextNode(' ')));
            parts.push($('<a>', {href: match[0], target: '_blank'}).text(match[0]));
            parts.push($( document.createTextNode(' ')));
            lastIndex = match.index + match[0].length;
        }
        if(lastIndex < str.length) {
            parts.push($( document.createTextNode(str.substring(lastIndex, str.length))));
        }

    	return parts;
    }

}());
