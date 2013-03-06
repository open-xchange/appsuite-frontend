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
    ['io.ox/core/event',
    'gettext!io.ox/core',
    'less!io.ox/core/tk/dialog.less'], function (Events, gt) {

    'use strict';

    // scaffolds
    var underlay = $('<div class="abs io-ox-dialog-underlay">').hide(),
        popup = $('<div class="io-ox-dialog-popup" tabindex="-1" role="dialog" aria-labelledby="dialog-title">').hide()
            .append(
                $('<div class="modal-header">'),
                $('<div class="modal-body">'),
                $('<div class="modal-footer">')
            );

    var Dialog = function (options) {

        var nodes = {
                buttons: [],
                underlay: underlay.clone().appendTo('body'),
                popup: popup.clone().appendTo('body')
            },

            lastFocus = $(),
            innerFocus = $(),
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

            keepFocus = function (e) {
                if (!nodes.popup.get(0).contains(e.target)) {
                    e.stopPropagation();
                    nodes.popup.focus();
                }
            },

            close = function () {
                self.trigger('close');
                nodes.popup.off('keydown', closeViaEscapeKey);
                document.removeEventListener('focus', keepFocus, true); // not via jQuery!
                nodes.popup.empty().remove();
                nodes.underlay.remove();

                // restore focus
                lastFocus = lastFocus.closest(':visible');
                if (lastFocus.hasClass('dropdown')) {
                    lastFocus.children().first().focus();
                } else {
                    lastFocus.focus();
                }
                // self destruction
                for (var prop in self) {
                    delete self[prop];
                }
                self.close = self.idle = $.noop;
                nodes.header = nodes.body = nodes.footer = null;
                nodes = deferred = self = data = o = null;
            },

            busy = function () {
                nodes.footer.find('input, select, button').attr('disabled', 'disabled');
                nodes.body.find('input, select, button, textarea').attr('disabled', 'disabled');
                nodes.body.css('opacity', 0.5);
                innerFocus = $(document.activeElement);
                nodes.popup.focus();
            },

            idle = function () {
                nodes.footer.find('input, select, button').removeAttr('disabled');
                nodes.body.find('input, select, button, textarea').removeAttr('disabled');
                nodes.body.css('opacity', '');
                innerFocus.focus();
            },

            invoke = function (e) {
                var action = e.data ? e.data.action : e,
                    async = o.async && action !== 'cancel';
                // be busy?
                if (async) {
                    busy();
                }
                // trigger action event
                self.trigger('action ' + action, data, self);
                // resolve & close?
                if (!async) {
                    deferred.resolveWith(nodes.popup, [action, data, self.getContentNode().get(0)]);
                    close();
                }

                (e.originalEvent || e).processed = true;
            };

        _(['header', 'body', 'footer']).each(function (part) {
            nodes[part] = nodes.popup.find('.modal-' + part);
        });


        if (o.addclass) {
            nodes.popup.addClass(o.addclass);
        }
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
            p.append($('<h4 class="plain-text" id="dialog-title">').text(str || ""));
            return this;
        };

        this.build = function (fn) {
            if (_.isFunction(fn)) {
                fn.call(this);
            }
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
                click: invoke,
                dataaction: dataaction,
                purelink: options.purelink,
                inverse: options.inverse
            };

            if (options.type) {
                opt[options.type] = true;
            }

            var button = $.button(opt);
            nodes.buttons.push(button);
            return button.addClass(options.classes);
        };

        this.addButton = function (action, label, dataaction, options) {
            var button = addButton(action, label, dataaction, options);
            nodes.footer.prepend(button);
            return this;
        };

        this.addDangerButton = function (action, label, dataaction, options) {
            var button = addButton(action, label, dataaction, options);
            button.addClass('btn-danger');
            nodes.footer.prepend(button);
            return this;
        };
        this.addSuccessButton = function (action, label, dataaction, options) {
            var button = addButton(action, label, dataaction, options);
            button.addClass('btn-success');
            nodes.footer.prepend(button);
            return this;
        };
        this.addWarningButton = function (action, label, dataaction, options) {
            var button = addButton(action, label, dataaction, options);
            button.addClass('btn-warning');
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
                invoke('cancel');
            }
        };

        this.close = function () {
            if (!o || o.async)  {
                close();
            } else {
                invoke('cancel');
            }
        };

        this.invoke = function (action) {
            invoke(action);
            return this;
        };

        this.idle = function () {
            idle();
            return this;
        };

        this.busy = function () {
            busy();
            return this;
        };

        this.show = function (callback) {

            // remember focussed element
            lastFocus = $(document.activeElement);
            document.addEventListener('focus', keepFocus, true); // not via jQuery!

            // empty header?
            if (nodes.header.children().length === 0) {
                nodes.header.remove();
            }

            var dim = {
                width: parseInt(o.width || nodes.popup.width() * 1.1, 10),
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
                var max = $(document)[d]() - 50;
                if (dim[d] && dim[d] > max) {
                    dim[d] = max;
                }
            });

            // apply dimensions, only on desktop and pad
            if (_.device('!small')) {
                if (o.center) {
                    // center vertically
                    nodes.popup.css({
                        width: dim.width + "px",
                        top: "50%",
                        marginTop: 0 - (dim.height / 2 >> 0) + "px"
                    });
                } else {
                    // use fixed top position
                    nodes.popup.css({
                        width: dim.width + "px",
                        top: o.top || "0px"
                    });
                }
            }

            if (_.device('small')) {

                // rebuild button section for mobile devices
                nodes.footer.rowfluid = $('<div class="row-fluid">');
                nodes.footer.append(nodes.footer.rowfluid);

                _.each(nodes.buttons, function (buttonNode) {
                    nodes.footer.rowfluid.prepend(buttonNode/*.addClass('btn-large')*/);
                    buttonNode.wrap('<div class="span3">');
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
                nodes.popup.on('keydown', closeViaEscapeKey);
            }

            if (callback) {
                callback.call(nodes.popup, this);
            }

            this.trigger('show');

            return deferred;
        };

        nodes.underlay.click(function () {
            if (o && o.underlayAction) {
                invoke(o.underlayAction);
            } else if (o && o.easyOut) {
                invoke("cancel");
            }
        });

        nodes.popup.click(function () {
            if (o && o.defaultAction) {
                invoke(o.defaultAction);
            }
        });

        this.setUnderlayAction = function (action) {
            o.underlayAction = action;
            return this;
        };

        this.topmost = function () {
            nodes.underlay.addClass('topmost');
            nodes.popup.addClass('topmost');
            return this;
        };

        this.setUnderlayStyle =  function (css) {
            nodes.underlay.css(css || {});
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

    var SidePopup = function (options) {

        options = _.extend({
            modal: false,
            arrow: true
        }, options || {});

        var processEvent,
            isProcessed,
            open,
            close,
            closeAll,
            closeByEscapeKey,
            closeByScroll,
            closeByClick,
            previousProp,
            timer = null,

            overlay,

            pane = $('<div class="io-ox-sidepopup-pane default-content-padding abs">'),

            closer = $('<div class="io-ox-sidepopup-close">').append(
                    $('<button class="btn btn-small btn-primary" data-action="close" >').text(gt('Close'))
                ),

            popup = $('<div class="io-ox-sidepopup abs">').append(closer, pane),

            arrow = options.arrow === false ? $() :
                $('<div class="io-ox-sidepopup-arrow">').append(
                    $('<div class="border">'),
                    $('<div class="triangle">')
                ),

            target = null,

            self = this;

        pane = pane.scrollable();

        // add event hub
        Events.extend(this);

        if (options.modal) {
            overlay = $('<div class="io-ox-sidepopup-overlay abs">').append(popup, arrow);
        }

        // public nodes
        this.nodes = {};
        this.lastTrigger = null;

        processEvent = function (e) {
            if (!(e.target && $(e.target).attr('data-process-event') === 'true')) {
                (e.originalEvent || e).processed = true;
            }
        };

        isProcessed = function (e) {
            return (e.originalEvent || e).processed === true;
        };

        closeByEscapeKey = function (e) {
            if (e.which === 27) {
                close(e);
            }
        };

        closeByScroll = function (e) {
            if (!options.disableCloseByScroll) {
                close(e);
            }
        };

        closeByClick = function (e) {
            if (!(e.target && $(e.target).attr('data-process-event') === 'true') && !isProcessed(e)) {
                processEvent(e);
                close(e);
            }
        };

        close = function (e) {
            // use this to check if it's open
            if (self.nodes.closest) {
                // remove handlers & avoid leaks
                $(document).off('keydown', closeByEscapeKey);
                self.nodes.closest.off("scroll", closeByScroll).prop('sidepopup', previousProp);
                self.nodes.click.off("click", closeByClick);
                self.lastTrigger = previousProp = null;
                // use time to avoid flicker
                timer = setTimeout(function () {
                    if (options.modal) {
                        overlay.detach();
                    } else {
                        arrow.detach();
                        popup.detach();
                    }
                    pane.empty();
                    self.trigger('close');
                }, 100);
            }
        };

        closeAll = function (e) {
            e.data.target.find('.io-ox-sidepopup').trigger('close');
        };

        popup.on('close', close);

        closer.find('.btn').on('click', function (e) {
            pane.trigger('click'); // route click to 'pane' since closer is above pane
            close(e); // close side popup
            return false;
        });

        popup.on("click", processEvent);

        open = function (e, handler) {
            // get proper elements
            var my = $(this), zIndex, sidepopup;
            self.nodes = {
                closest: target || my.parents(".io-ox-sidepopup-pane, .window-content, .io-ox-dialog-popup, .notifications-overlay"),
                click: my.parents(".io-ox-sidepopup-pane, .window-body, .io-ox-dialog-popup, .notifications-overlay"),
                target: target || my.parents(".window-body, .io-ox-dialog-popup, .notifications-overlay")
            };
            // get active side popup & triggering element
            sidepopup = self.nodes.closest.prop("sidepopup") || null;
            self.lastTrigger = sidepopup ? sidepopup.lastTrigger : null;
            // get zIndex for visual stacking
            zIndex = (my.parents(".io-ox-sidepopup, .window-content, .io-ox-dialog-popup, .notifications-overlay").css("zIndex") || 1) + 2;
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
                previousProp = sidepopup;
                self.nodes.closest.prop("sidepopup", self);

                // prevent default to avoid close
                processEvent(e);
                // clear timer
                clearTimeout(timer);

                // add "Close all"
                if (self.nodes.closest.is('.io-ox-sidepopup-pane')) {
                    closer.find('.close-all').remove();
                    closer.prepend(
                        $('<button class="btn btn-small close-all" data-action="close-all">').text(gt('Close all'))
                        .on('click', { target: self.nodes.target }, closeAll)
                    );
                }

                // add handlers to close popup
                self.nodes.click.on("click", closeByClick);
                self.nodes.closest.on("scroll", closeByScroll);
                $(document).on("keydown", closeByEscapeKey);

                // decide for proper side
                var docWidth = $('body').width(), mode,
                    parentPopup = my.parents(".io-ox-sidepopup").first(),
                    firstPopup = parentPopup.length === 0;

                // get side
                if (/^(left|right)$/.test(options.side)) {
                    mode = options.side;
                } else {
                    mode = (firstPopup && e.pageX > docWidth / 2) ||
                        parentPopup.hasClass("right")  ? 'left' : 'right';
                }

                popup.add(arrow).removeClass("left right").addClass(mode).css('zIndex', zIndex);
                arrow.css('zIndex', zIndex + 1);

                // add popup to proper element
                self.nodes.target.append((options.modal ? overlay : popup).css('visibility', 'hidden'));

                // call custom handler
                (handler || $.noop).call(self, pane.empty(), e, my);

                // set arrow top
                var halfHeight = (my.outerHeight(true) / 2 >> 0),
                    targetOffset = self.nodes.target.offset() ? self.nodes.target.offset().top : 0,
                    top = my.offset().top + halfHeight - targetOffset;
                arrow.css("top", top);

                // finally, add arrow
                (options.modal ? overlay : popup).css('visibility', '');
                if (!options.modal) {
                    self.nodes.target.append(arrow);
                }

                self.trigger('show');
            }
        };

        this.delegate = function (node, selector, handler) {
            $(node).on("click", selector, function (e) {
                if ((e.originalEvent || e).processed !== true) {
                    open.call(this, e, handler);
                }
            });
            return this;
        };

        this.setTarget = function (t) {
            target = $(t);
            return this;
        };

        this.show = function (e, handler) {
            setTimeout(function () {
                open.call(e.target, e, handler);
            }, 0);
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

        invoke = function (e) {
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
                    click: invoke
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
                invoke("toggeled");
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
        SidePopup: SidePopup,
        busy: function (node) {
            node.find('button').attr('disabled', 'disabled');
            node.find('input').attr('disabled', 'disabled');
        },
        idle: function (node) {
            node.find('button').removeAttr('disabled');
            node.find('input').removeAttr('disabled');
        }
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
