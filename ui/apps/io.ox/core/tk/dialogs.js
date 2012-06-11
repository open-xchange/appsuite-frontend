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

define("io.ox/core/tk/dialogs",
    ['io.ox/core/event', "io.ox/core/bootstrap/basics"], function (Events) {

    'use strict';

    // scaffolds
    var underlay = $("<div>").hide().addClass("abs io-ox-dialog-underlay"),
        popup = $("<div>").hide().addClass("io-ox-dialog-popup")
            .append(
                $("<div>").addClass("modal-header"),
                $("<div>").addClass("modal-body"),
                $("<div>").addClass("modal-footer")
            );

    var Dialog = function (options) {

        var nodes = {
                underlay: underlay.clone().appendTo('body'),
                popup: popup.clone().appendTo('body')
            },

            deferred = $.Deferred(),

            closeViaEscapeKey,

            self = this,

            data = {},

            o = _.extend({
                underlayAction: null,
                defaultAction: null,
                easyOut: false,
                center: true,
                async: false,
                top: "50%"
                // width (px), height (px),
                // maxWidth (px), maxHeight (px)
            }, options),

            close = function () {
                $(document).off("keydown", closeViaEscapeKey);
                nodes.popup.empty().remove();
                nodes.underlay.remove();
                // self destruction
                for (var prop in self) {
                    delete self[prop];
                }
                self.close = self.idle = $.noop;
                nodes.header = nodes.body = nodes.footer = null;
                nodes = deferred = self = data = o = null;
            },

            busy = function () {
                nodes.footer.find('button').attr('disabled', 'disabled');
                nodes.body.find('input').attr('disabled', 'disabled');
            },

            idle = function () {
                nodes.footer.find('button').removeAttr('disabled');
                nodes.body.find('input').removeAttr('disabled');
            },

            process = function (e) {
                var action = e.data ? e.data.action : e,
                    async = o.async && action !== 'cancel';
                // be busy?
                if (async) {
                    busy();
                }
                // trigger action event
                self.trigger('action ' + action, data);
                // resolve & close?
                if (!async) {
                    deferred.resolve(action, data);
                    close();
                }
            };

        _(['header', 'body', 'footer']).each(function (part) {
            nodes[part] = nodes.popup.find('.modal-' + part);
        });

        // add event hub
        Events.extend(this);

        this.data = function (d) {
            data = d !== undefined ? d : {};
            return this;
        };

        this.header = function () {
            nodes.header.append.apply(nodes.header, arguments);
            return this;
        };

        this.getHeader = function () {
            return nodes.header;
        };

        this.getPopup = function () {
            return nodes.popup;
        };

        this.getContentNode = this.getBody = function () {
            return nodes.body;
        };

        this.getContentControls = this.getFooter = function () {
            return nodes.footer;
        };

        this.text = function (str) {
            var p = nodes.body;
            p.find(".plain-text").remove();
            p.append($("<h4>").addClass("plain-text").text(str || ""));
            return this;
        };

        this.append = function (node) {
            nodes.body.append(node);
            return this;
        };

        var addButton = function (action, label, dataaction, options) {

            options = options || {};

            var opt = {
                label: label,
                data: { action: action },
                click: process,
                dataaction: dataaction,
                purelink: options.purelink,
                inverse: options.inverse
            };

            if (options.type) {
                opt[options.type] = true;
            }

            var button = $.button(opt);
            return button.addClass(options.classes);
        };

        this.addButton = function (action, label, dataaction, options) {
            var button = addButton(action, label, dataaction, options);
            nodes.footer.append(button);
            return this;
        };

        this.addDangerButton = function (action, label, dataaction, options) {
            var button = addButton(action, label, dataaction, options);
            button.addClass('btn-danger');
            nodes.footer.prepend(button);
            return this;
        };

        this.addPrimaryButton = function (action, label, dataaction, options) {
            var button = addButton(action, label, dataaction, options);
            button.addClass('btn-primary');
            nodes.footer.prepend(button);
            return this;
        };

        this.addAlternativeButton = function (action, label, dataaction, options) {
            var button = addButton(action, label, dataaction, options);
            button.css({ 'float': 'left', marginLeft: 0 });
            nodes.footer.prepend(button);
            return this;
        };

        closeViaEscapeKey = function (e) {
            if (e.which === 27) {
                process("cancel");
            }
        };

        this.close = function () {
            if (!o || o.async)  {
                close();
            } else {
                process('cancel');
            }
        };

        this.idle = function () {
            idle();
        };

        this.show = function (callback) {

            // empty header?
            if (nodes.header.children().length === 0) {
                nodes.header.remove();
            }

            var dim = {
                width: parseInt(o.width || nodes.popup.width(), 10),
                height: parseInt(o.height || nodes.popup.height(), 10)
            };

            // limit width & height
            _(["width", "height"]).each(function (d) {
                // apply explicit limit
                var id = o[$.camelCase("max-" + d)];
                if (o[id] && dim[d] > o[id]) {
                    dim[d] = o[id];
                }
                // apply document limits
                var max = $(document)[d]() - 100;
                if (dim[d] && dim[d] > max) {
                    dim[d] = max;
                }
            });

            // apply dimensions
            if (o.center) {
                // center vertically
                nodes.popup.css({
                    width: dim.width + "px",
                    top: "50%",
                    marginTop: 0 - ((dim.height + 60) / 2 >> 0) + "px"
                });
            } else {
                // use fixed top position
                nodes.popup.css({
                    width: dim.width + "px",
                    top: o.top || "0px"
                });
            }

            nodes.underlay.show();
            nodes.popup.show();

            // focus button (if available)
            var button = nodes.popup.find('.btn-primary').first().focus();
            if (!button.length) {
                nodes.popup.find('.btn').not('.btn-danger').first().focus();
            }

            if (o.easyOut) {
                $(document).on("keydown", closeViaEscapeKey);
            }

            if (callback) {
                callback.call(nodes.popup);
            }

            this.trigger('show');

            return deferred;
        };

        nodes.underlay.click(function () {
            if (o.underlayAction) {
                process(o.underlayAction);
            } else if (o.easyOut) {
                process("cancel");
            }
        });

        nodes.popup.click(function () {
            if (o.defaultAction) {
                process(o.defaultAction);
            }
        });

        this.setUnderlayAction = function (action) {
            o.underlayAction = action;
            return this;
        };

        this.setDefaultAction = function (action) {
            o.defaultAction = action;
            return this;
        };
    };

    var CreateDialog = function (options) {

        options = options || {};
        options.top = "50px";
        options.center = false;

        Dialog.call(this, options);
    };

    var SidePopup = function (width) {

        var processEvent,
            isProcessed,
            open,
            close,
            closeByEscapeKey,
            closeByScroll,
            closeByClick,
            timer = null,

            pane = $("<div>")
                .addClass("io-ox-sidepopup-pane default-content-padding abs"),

            closeIcon = $('<span>').addClass('io-ox-sidepopup-close close').html('&times'),

            popup = $("<div>")
                .addClass("io-ox-sidepopup abs")
                .append(closeIcon, pane),

            arrow = $("<div>")
                .addClass("io-ox-sidepopup-arrow")
                .append($("<div>").addClass("border"))
                .append($("<div>").addClass("triangle")),

            self = this;

        pane = pane.scrollable();

        // public nodes
        this.nodes = {};
        this.lastTrigger = null;

        processEvent = function (e) {
            e.preventDefault();
        };

        isProcessed = function (e) {
            return e.isDefaultPrevented();
        };

        closeByEscapeKey = function (e) {
            if (e.which === 27) {
                close(e);
            }
        };

        closeByScroll = function (e) {
            close(e);
        };

        closeByClick = function (e) {
            if (!isProcessed(e)) {
                processEvent(e);
                close(e);
            }
        };

        close = function (e) {
            // remove handlers & avoid leaks
            $(document).off("keydown", closeByEscapeKey);
            self.nodes.closest.off("scroll", closeByScroll);
            self.nodes.click.off("click", closeByClick);
            self.lastTrigger = null;
            // use time to avoid flicker
            timer = setTimeout(function () {
                arrow.detach();
                pane.empty();
                popup.detach();
            }, 100);
        };

        closeIcon.on('click', function (e) {
            pane.trigger('click'); // route click to 'pane' since closeIcon is above pane
            close(e); // close side popup
            return false;
        });

        popup.on("click", processEvent);

        open = function (e, handler) {
            // get proper elements
            var my = $(this), zIndex, sidepopup;
            self.nodes = {
                closest: my.parents(".io-ox-sidepopup-pane, .window-content"),
                click: my.parents(".io-ox-sidepopup-pane, .window-body"),
                target: my.parents(".window-body")
            };
            // get active side popup & triggering element
            sidepopup = self.nodes.closest.prop("sidepopup") || null;
            self.lastTrigger = sidepopup ? sidepopup.lastTrigger : null;
            // get zIndex for visual stacking
            zIndex = (my.parents(".io-ox-sidepopup, .window-content").css("zIndex") || 1) + 2;
            // second click?
            if (self.lastTrigger === this) {
                close(e);
            } else {

                // open siblings?
                if (sidepopup) {
                    sidepopup.close();
                }

                // remember as current trigger
                self.lastTrigger = this;
                self.nodes.closest.prop("sidepopup", self);

                // prevent default to avoid close
                processEvent(e);
                // clear timer
                clearTimeout(timer);

                // add handlers to close popup
                self.nodes.click.on("click", closeByClick);
                self.nodes.closest.on("scroll", closeByScroll);
                $(document).on("keydown", closeByEscapeKey);

                // decide for proper side
                var docWidth = $(document).width(), mode,
                    parentPopup = my.parents(".io-ox-sidepopup").first(),
                    firstPopup = parentPopup.length === 0;

                // get side
                mode = (firstPopup && my.offset().left > docWidth / 2) ||
                    parentPopup.hasClass("right")  ? 'left' : 'right';

                popup.add(arrow).removeClass("left right").addClass(mode).css('zIndex', zIndex);
                arrow.css('zIndex', zIndex + 1);

                // add popup to proper element
                self.nodes.target.append(popup.css('visibility', 'hidden'));

                // call custom handler
                (handler || $.noop).call(this, pane.empty(), e);

                // set arrow top
                var halfHeight = (my.outerHeight(true) / 2 >> 0),
                    top = my.offset().top + halfHeight - self.nodes.target.offset().top;
                arrow.css("top", top);

                // finally, add arrow
                popup.css('visibility', '');
                self.nodes.target.append(arrow);
            }
        };

        this.delegate = function (node, selector, handler) {
            $(node).on("click", selector, function (e) {
                open.call(this, e, handler);
            });
            return this;
        };

        this.show = function (e, handler) {
            open.call(e.target, e, handler);
            return this;
        };

        this.close = function (e) {
            close(e);
        };
    };

    //TODO: Less C&P
    var pane = $('<div>').addClass('abs io-ox-dialog-pane').append(
        $("<div>").addClass("content")
    )
    .append(
        $("<div>").addClass("form-actions")
    );


    var SlidingPane = function () {
        var self = this;
        var nodes = {
            pane: pane.clone().hide().appendTo('body'),
            relativeTo: null
        };

        nodes.content = nodes.pane.find('.content');
        nodes.controls = nodes.pane.find('.form-actions');

        this.visible = false;

        var deferred = $.Deferred(),

        close = function () {
            self.visible = false;
            nodes.pane.fadeOut();
        },

        process = function (e) {
            deferred.resolve(e.data);
            close();
        };

        this.text = function (str) {
            nodes.content.text(str || "");
            return this;
        };

        this.append = function (node) {
            nodes.content.append(node);
            return this;
        };

        this.addButton = function (action, label) {
            nodes.controls.append(
                $.button({
                    label: label,
                    data: action,
                    click: process
                })
            );
            return this;
        };

        this.relativeTo = function (node) {
            nodes.relativeTo = $(node);
            return this;
        };

        this.toggle = function () {
            if (this.visible) {
                process("toggeled");
            } else {
                this.show();
            }
        };

        this.show = function () {
            this.visible = true;
            var offset, top, left, height, width, windowHeight, windowWidth;

            windowHeight = $(window).height();
            windowWidth = $(window).width();

            // Force Rendering for shrink-to-fit size detection
            // There has to be a cleverer way to do this
            var oldOpacity = nodes.pane.css("opacity");
            nodes.pane.css("opacity", "0.001");
            nodes.pane.show();

            height = nodes.controls.outerHeight(true) + nodes.content.outerHeight(true) + 2;
            //width =  Math.max(nodes.controls.outerWidth(true), nodes.content.outerWidth(true)) + 2;
            width = nodes.content.find('.block').outerWidth(true) + 20;
            nodes.pane.hide();
            nodes.pane.css("opacity", oldOpacity);

            if (nodes.relativeTo) {
                // Depending on where our anchor element is, position the pane
                offset = nodes.relativeTo.offset();
                // Is the anchor in the upper half?
                if (offset.top < (windowHeight / 2)) {
                    // Yup, so we'll put the pane below the anchor
                    top = offset.top + nodes.relativeTo.outerHeight() + 3;
                } else {
                    // Nope, so we'll put the pane above the anchor
                    top = offset.top - height - 10;
                    if (top < 0) {
                        top = 0;
                    }
                }

                // Is the anchor to the left or the right of the center?

                if (offset.left < (windowWidth / 2)) {
                    // It's on the left, so we align the left sides
                    left = offset.left;
                } else {
                    // It's on the right, so we align the right sides
                    left = offset.left + nodes.relativeTo.outerWidth() - width;
                }

                nodes.pane.css({
                    height: height + "px",
                    width: width + "px",
                    top: top + "px",
                    left: left + "px"
                });
            } else {
                // Hm. Put it in the center. Though, truth be told, this is probably supposed
                // to be a dialog
                nodes.pane.css({
                    height: height + "px",
                    width: width + "px",
                    marginTop: 0 - (height / 2 >> 0) + "px"
                });
            }
            nodes.pane.fadeIn();
            return deferred;
        };
    };

    return {
        ModalDialog: Dialog,
        CreateDialog: CreateDialog,
        SlidingPane: SlidingPane,
        SidePopup: SidePopup
    };
});

/* Test

require(["io.ox/core/tk/dialogs"], function (dialogs) {
    new dialogs.ModalDialog()
        .text("Are you really sure about your decision? Are you aware of all consequences you have to live with?")
        .addButton("cancel", "No, rather not")
        .addPrimaryButton("delete", "Shut up and delete it!")
        .show()
        .done(function (action) {
            console.debug("Action", action);
        });
});

require(["io.ox/core/tk/dialogs"], function (dialogs) {
    new dialogs.CreateDialog()
        .text(new Array(20).join("Lorem ipsum dolor sit amet, consetetur sadipscing elitr"))
        .data({ id: 1234 })
        .addButton("cancel", "Cancel")
        .addButton("yep", "Yep")
        .show()
        .done(function (action, data) {
            console.debug("Action", action, data);
        });
});

*/
