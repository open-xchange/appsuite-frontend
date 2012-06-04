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

        // ad data-action
        if (opt.dataaction !== undefined) {
            button.attr("data-action", opt.dataaction);
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

    /** jGrowl Wrapper - Establish a base jGrowl Container for compatibility with older releases. **/
    $.jGrowl = function (m, o) {
        // To maintain compatibility with older version that only supported one instance we'll create the base container.
        if ($('#jGrowl').size() === 0) $('<div id="jGrowl"></div>').addClass((o && o.position) ? o.position : $.jGrowl.defaults.position).appendTo('body');

        // Create a notification on the container.
        $('#jGrowl').jGrowl(m, o);
    };


    /** Raise jGrowl Notification on a jGrowl Container **/
    $.fn.jGrowl = function (m, o) {
        if ($.isFunction(this.each)) {
            var args = arguments;

            return this.each(function () {
                var self = this;

                /** Create a jGrowl Instance on the Container if it does not exist **/
                if ($(this).data('jGrowl.instance') === undefined) {
                    $(this).data('jGrowl.instance', $.extend(new $.fn.jGrowl(), {
                        notifications: [],
                        element: null,
                        interval: null
                    }));
                    $(this).data('jGrowl.instance').startup(this);
                }

                /** Optionally call jGrowl instance methods, or just raise a normal notification **/
                if ($.isFunction($(this).data('jGrowl.instance')[m])) {
                    $(this).data('jGrowl.instance')[m].apply($(this).data('jGrowl.instance'), $.makeArray(args).slice(1));
                } else {
                    $(this).data('jGrowl.instance').create(m, o);
                }
            });
        }
    };

    $.extend($.fn.jGrowl.prototype, {

        /** Default JGrowl Settings **/
        defaults: {
            pool: 0,
            header: '',
            group: '',
            sticky: false,
            position: 'top-right',
            glue: 'after',
            theme: 'default',
            themeState: 'highlight',
            corners: '10px',
            check: 250,
            life: 3000,
            closeDuration: 'normal',
            openDuration: 'normal',
            easing: 'swing',
            closer: true,
            closeTemplate: '&times;',
            closerTemplate: '<div>[ close all ]</div>',
            log: function (e, m, o) {},
            beforeOpen: function (e, m, o) {},
            afterOpen: function (e, m, o) {},
            open: function (e, m, o) {},
            beforeClose: function (e, m, o) {},
            close: function (e, m, o) {},
            animateOpen: {
                opacity: 'show'
            },
            animateClose: {
                opacity: 'hide'
            }
        },

        notifications: [],

        /** jGrowl Container Node **/
        element: null,

        /** Interval Function **/
        interval: null,

        /** Create a Notification **/
        create: function (message, o) {
            o = $.extend({}, this.defaults, o);

            /* To keep backward compatibility with 1.24 and earlier, honor 'speed' if the user has set it */
            if (typeof o.speed !== 'undefined') {
                o.openDuration = o.speed;
                o.closeDuration = o.speed;
            }

            this.notifications.push({
                message: message,
                options: o
            });

            o.log.apply(this.element, [this.element, message, o]);
        },

        render: function (notification) {
            var self = this;
            var message = notification.message;
            var o = notification.options;

            // Support for jQuery theme-states, if this is not used it displays a widget header
            o.themeState = (o.themeState === '') ? '' : 'ui-state-' + o.themeState;

            notification = $('<div class="jGrowl-notification ' + o.themeState + ' ui-corner-all' + ((o.group !== undefined && o.group !== '') ? ' ' + o.group : '') + '">' + '<div class="jGrowl-close">' + o.closeTemplate + '</div>' + '<div class="jGrowl-header">' + o.header + '</div>' + '<div class="jGrowl-message">' + message + '</div></div>').data("jGrowl", o).addClass(o.theme).children('div.jGrowl-close').bind("click.jGrowl", function () {
                $(this).parent().trigger('jGrowl.close');
            }).parent();


            /** Notification Actions **/
            $(notification).bind("mouseover.jGrowl", function () {
                $('div.jGrowl-notification', self.element).data("jGrowl.pause", true);
            }).bind("mouseout.jGrowl", function () {
                $('div.jGrowl-notification', self.element).data("jGrowl.pause", false);
            }).bind('jGrowl.beforeOpen', function () {
                if (o.beforeOpen.apply(notification, [notification, message, o, self.element]) !== false) {
                    $(this).trigger('jGrowl.open');
                }
            }).bind('jGrowl.open', function () {
                if (o.open.apply(notification, [notification, message, o, self.element]) !== false) {
                    if (o.glue === 'after') {
                        $('div.jGrowl-notification:last', self.element).after(notification);
                    } else {
                        $('div.jGrowl-notification:first', self.element).before(notification);
                    }

                    $(this).animate(o.animateOpen, o.openDuration, o.easing, function () {
                        // Fixes some anti-aliasing issues with IE filters.
                        if ($.browser.msie && (parseInt($(this).css('opacity'), 10) === 1 || parseInt($(this).css('opacity'), 10) === 0)) this.style.removeAttribute('filter');

                        if ($(this).data("jGrowl") !== null) // Happens when a notification is closing before it's open.
                            $(this).data("jGrowl").created = new Date();

                        $(this).trigger('jGrowl.afterOpen');
                    });
                }
            }).bind('jGrowl.afterOpen', function () {
                o.afterOpen.apply(notification, [notification, message, o, self.element]);
            }).bind('jGrowl.beforeClose', function () {
                if (o.beforeClose.apply(notification, [notification, message, o, self.element]) !== false) $(this).trigger('jGrowl.close');
            }).bind('jGrowl.close', function () {
                // Pause the notification, lest during the course of animation another close event gets called.
                $(this).data('jGrowl.pause', true);
                $(this).animate(o.animateClose, o.closeDuration, o.easing, function () {
                    if ($.isFunction(o.close)) {
                        if (o.close.apply(notification, [notification, message, o, self.element]) !== false) $(this).remove();
                    } else {
                        $(this).remove();
                    }
                });
            }).trigger('jGrowl.beforeOpen');

            /** Optional Corners Plugin **/
            if (o.corners !== '' && $.fn.corner !== undefined) $(notification).corner(o.corners);

            /** Add a Global Closer if more than one notification exists **/
            if ($('div.jGrowl-notification:parent', self.element).size() > 1 && $('div.jGrowl-closer', self.element).size() === 0 && this.defaults.closer !== false) {
                $(this.defaults.closerTemplate).addClass('jGrowl-closer ' + this.defaults.themeState + ' ui-corner-all').addClass(this.defaults.theme).appendTo(self.element).animate(this.defaults.animateOpen, this.defaults.speed, this.defaults.easing).bind("click.jGrowl", function () {
                    $(this).siblings().trigger("jGrowl.beforeClose");

                    if ($.isFunction(self.defaults.closer)) {
                        self.defaults.closer.apply($(this).parent()[0], [$(this).parent()[0]]);
                    }
                });
            }
        },

        /** Update the jGrowl Container, removing old jGrowl notifications **/
        update: function () {
            $(this.element).find('div.jGrowl-notification:parent').each(function () {
                if ($(this).data("jGrowl") !== undefined && $(this).data("jGrowl").created !== undefined && ($(this).data("jGrowl").created.getTime() + parseInt($(this).data("jGrowl").life, 10)) < (new Date()).getTime() && $(this).data("jGrowl").sticky !== true && ($(this).data("jGrowl.pause") === undefined || $(this).data("jGrowl.pause") !== true)) {

                    // Pause the notification, lest during the course of animation another close event gets called.
                    $(this).trigger('jGrowl.beforeClose');
                }
            });

            if (this.notifications.length > 0 && (this.defaults.pool === 0 || $(this.element).find('div.jGrowl-notification:parent').size() < this.defaults.pool)) this.render(this.notifications.shift());

            if ($(this.element).find('div.jGrowl-notification:parent').size() < 2) {
                $(this.element).find('div.jGrowl-closer').animate(this.defaults.animateClose, this.defaults.speed, this.defaults.easing, function () {
                    $(this).remove();
                });
            }
        },

        /** Setup the jGrowl Notification Container **/
        startup: function (e) {
            this.element = $(e).addClass('jGrowl').append('<div class="jGrowl-notification"></div>');
            this.interval = setInterval(function () {
                $(e).data('jGrowl.instance').update();
            }, parseInt(this.defaults.check, 10));

            if ($.browser.msie && parseInt($.browser.version, 10) < 7 && !window.XMLHttpRequest) {
                $(this.element).addClass('ie6');
            }
        },

        /** Shutdown jGrowl, removing it and clearing the interval **/
        shutdown: function () {
            $(this.element).removeClass('jGrowl').find('div.jGrowl-notification').remove();
            clearInterval(this.interval);
        },

        close: function () {
            $(this.element).find('div.jGrowl-notification').each(function () {
                $(this).trigger('jGrowl.beforeClose');
            });
        }
    });

    /** Reference the Defaults Object for compatibility with older versions of jGrowl **/
    $.jGrowl.defaults = $.fn.jGrowl.prototype.defaults;



}());
