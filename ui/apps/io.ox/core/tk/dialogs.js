/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/dialogs', [
    'io.ox/core/event',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/help',
    'less!io.ox/core/tk/dialog'
], function (Events, ext, HelpView) {

    'use strict';

    // scaffolds
    function getUnderlay() {
        return $('<div class="abs io-ox-dialog-underlay">').hide();
    }

    function getPopup() {
        return $('<div class="io-ox-dialog-popup" tabindex="-1" role="dialog" aria-labelledby="dialog-title">').hide()
            .append(
                $('<div class="modal-header" id="dialog-title">'),
                $('<div class="modal-body">'),
                $('<div class="clearfix">'),
                $('<div class="modal-footer">')
            );
    }

    var Dialog = function (options) {

        var o = _.extend({
                width: 500,
                underlayAction: null,
                defaultAction: null,
                easyOut: true,
                center: true,
                async: false,
                //prevents busy function even in asyncmode (needed for IE9 uploads)
                noBusy: false,
                maximize: false,
                top: '50%',
                container: $('#io-ox-core'),
                tabTrap: true,
                focus: true
            }, options),

            nodes = {
                buttons: [],
                underlay: getUnderlay(),
                popup: getPopup(),
                wrapper: $('<div class="abs io-ox-dialog-wrapper">')
            },

            lastFocus = $(),
            innerFocus = $(),
            deferred = $.Deferred(),
            isBusy = false,
            self = this,
            data = {},

            keepFocus = function (e) {
                // we have to consider that two popups might be open
                // so we cannot just refocus the current popup
                var insidePopup = $(e.target).closest('.io-ox-dialog-popup, .io-ox-sidepopup, .mce-window').length > 0;
                if (insidePopup) return;
                if (nodes.popup.is(':visible')) {
                    e.stopPropagation();
                    nodes.popup.focus();
                }
            },

            close = function () {

                // already closed?
                if (!self) return;

                // disable scrollblocker - Bug 29011
                o.container.removeClass('blockscroll');

                self.trigger('close');
                // not via jQuery!
                document.removeEventListener('focus', keepFocus, true);
                nodes.popup.empty().remove();
                nodes.underlay.remove();
                nodes.wrapper.remove();

                // restore focus
                lastFocus = lastFocus.closest(':visible');
                if (o.focus) {
                    if (lastFocus.hasClass('dropdown')) {
                        lastFocus.children().first().focus();
                    } else {
                        lastFocus.focus();
                    }
                }
                // self destruction
                self.events.destroy();
                for (var prop in self) {
                    delete self[prop];
                }
                self.close = self.idle = $.noop;
                nodes.header = nodes.body = nodes.footer = nodes.underlay = nodes.wrapper = null;
                nodes.buttons = lastFocus = innerFocus = null;
                nodes = deferred = self = data = o = null;
            },

            busy = function () {
                nodes.footer
                    .find('input, select, button')
                    .add(
                        nodes.body
                            .css('opacity', 0.5)
                            .find('input, select, button, textarea')
                    )
                    .each(function (key, val) {
                        val = $(val);
                        if (_.isUndefined(val.data('wasDisabled'))) {
                            val.data('wasDisabled', val.prop('disabled'));
                            val.prop('disabled', true);
                        }
                    });

                innerFocus = $(document.activeElement);
                nodes.popup.focus();
                isBusy = true;
            },

            idle = function () {
                nodes.footer
                    .find('input, select, button')
                    .add(
                        nodes.body
                            .css('opacity','')
                            .find('input, select, button, textarea')
                    )
                    .each(function (key, val) {
                        val = $(val);
                        if (!_.isUndefined(val.data('wasDisabled'))) {
                            val.prop('disabled', val.data('wasDisabled'));
                            val.removeData('wasDisabled');
                        }
                    });

                innerFocus.focus();
                isBusy = false;
            },

            invoke = function (e) {
                var action = e.data ? e.data.action : e,
                    async = o.async && action !== 'cancel';
                // be busy?
                if (async && !o.noBusy) {
                    busy();
                }
                // trigger action event
                self.trigger('action ' + action, data, self);
                // resolve & close?
                if (!async && self) {
                    deferred.resolveWith(nodes.popup, [action, data, self.getContentNode().get(0)]);
                    close();
                }

                // Fix for #33214 - TypeError: Attempted to assign to readonly property.
                if (_.isObject(e) && !_.browser.Safari) e.processed = true;
            },

            fnKey = function (e) {

                var items, focus, index;

                switch (e.which || e.keyCode) {
                case 27:
                    // ESC
                    if (!isBusy) {
                        // prevent other elements to trigger close
                        e.stopPropagation();
                        if (o.easyOut) invoke('cancel');
                    }
                    break;
                case 13:
                    // Enter
                    if (!isBusy && $(e.target).is('input:text, input:password')) {
                        if (!o.enter) return false;
                        if (_.isFunction(o.enter)) return o.enter.call(self);
                        invoke(o.enter);
                        return false;
                    }
                    break;
                case 9:
                    // tab
                    if (o.tabTrap) {
                        // get items first
                        items = $(this).find('[tabindex][tabindex!="-1"][disabled!="disabled"]:visible');
                        if (items.length) {
                            e.preventDefault();
                            focus = $(document.activeElement);
                            index = (items.index(focus) >= 0) ? items.index(focus) : 0;
                            index += (e.shiftKey) ? -1 : 1;

                            if (index >= items.length) {
                                index = 0;
                            } else if (index < 0) {
                                index = items.length - 1;
                            }
                            items.eq(index).focus();
                        }
                    }
                    break;
                default:
                    break;
                }
            };
        // pass options to ext point
        ext.point('io.ox/core/dialogs').invoke('customize', this, o);
        // append all elements
        o.container.append(
            nodes.wrapper
                .append(nodes.underlay, nodes.popup)
        );

        _(['header', 'body', 'footer']).each(function (part) {
            nodes[part] = nodes.popup.find('.modal-' + part);
        });

        if (o.addClass) {
            nodes.popup.addClass(o.addClass);
        }

        if (o.help) {
            nodes.header.append(new HelpView({
                href: o.help,
                tabindex: '-1'
            }).render().$el);
        }
        // add event hub
        Events.extend(this);

        this.resizeBody = function () {
            var topSpace = self.getPopup().position().top,
                docHeight = $(document).height(),
                bodyHeight = self.getBody().height(),
                popupHeight = self.getPopup().height(),
                bottomSpace = 30,
                cellHeight = self.getBody().find('.vgrid-cell').eq(0).outerHeight(),
                neededHeight = popupHeight + topSpace + bottomSpace;
            if (neededHeight >= docHeight) {
                var overSize = docHeight - neededHeight,
                    heightVal = bodyHeight + overSize;
                if (heightVal >= cellHeight) {
                    self.getBody().css('height', heightVal +'px');
                } else {
                    self.getBody().css('height', cellHeight +'px');
                }
            }
        };

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
            p.find('.plain-text').remove();
            p.append($('<h4 class="plain-text">').text(str || ''));
            return this;
        };

        this.build = function (fn) {
            if (_.isFunction(fn)) {
                fn.call(this);
            }
            return this;
        };

        this.append = function () {
            nodes.body.append.apply(nodes.body, arguments);
            return this;
        };

        this.prepend = function (node) {
            nodes.body.prepend(node);
            return this;
        };

        var addButton = function (action, label, dataaction, options) {

            options = options || {};

            var opt = {
                label: label,
                data: { action: action },
                click: options.click || invoke,
                dataaction: dataaction,
                purelink: options.purelink,
                inverse: options.inverse,
                tabIndex: options.tabIndex || options.tabindex
            };

            if (options.type) {
                opt[options.type] = true;
            }
            var button = $.button(opt);
            nodes.buttons.push(button);
            return button.addClass(options.classes).attr({
                role: 'button',
                type: 'button'
            });
        };

        this.addButton = function (action, label, dataaction, options) {
            nodes.footer.prepend(addButton(action, label, dataaction, options).addClass('btn-default'));
            return this;
        };

        this.addDangerButton = function (action, label, dataaction, options) {
            nodes.footer.prepend(addButton(action, label, dataaction, options).addClass('btn-danger'));
            return this;
        };

        this.addSuccessButton = function (action, label, dataaction, options) {
            nodes.footer.prepend(addButton(action, label, dataaction, options).addClass('btn-success'));
            return this;
        };

        this.addWarningButton = function (action, label, dataaction, options) {
            nodes.footer.prepend(addButton(action, label, dataaction, options).addClass('btn-warning'));
            return this;
        };

        this.addPrimaryButton = function (action, label, dataaction, options) {
            nodes.footer.prepend(addButton(action, label, dataaction, options).addClass('btn-primary'));
            return this;
        };

        this.addAlternativeButton = function (action, label, dataaction, options) {
            nodes.footer.prepend(addButton(action, label, dataaction, options).addClass('btn-default').css({ 'float': 'left', marginLeft: 0 }));
            return this;
        };

        this.addButtonMobile = function (action, label, dataaction, options) {
            return addButton(action, label, dataaction, options);
        };

        this.close = function () {
            if (!o || o.async) {
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

            // enable scrollblocker - Bug 29011
            o.container.addClass('blockscroll');
            if (o.focus) {
                // remember focussed element
                lastFocus = $(document.activeElement);
                // not via jQuery!
                document.addEventListener('focus', keepFocus, true);
            }

            // empty header?
            if (nodes.header.children().length === 0) {
                nodes.header.remove();
            }

            // show but keep invisible
            // this speeds up calculation of dimenstions
            nodes.underlay.show().addClass('in');
            nodes.popup.addClass('invisible').show();

            var fnSetDimensions = function () {
                var dim = {
                    width: parseInt(o.width || nodes.popup.width() * 1.1, 10),
                    height: parseInt(o.height || nodes.popup.height(), 10)
                };
                // limit width & height
                _(['width', 'height']).each(function (d) {
                    // apply explicit limit
                    var id = o[$.camelCase('max-' + d)];
                    if (o[id] && dim[d] > o[id]) {
                        dim[d] = o[id];
                    }
                    // apply document limits
                    var max = $(document)[d]();
                    if (dim[d] && dim[d] > max) {
                        dim[d] = max;
                    }
                });
                return dim;
            };

            var fnSetMaxDimensions = function () {
                if (nodes) {
                    var dim = fnSetDimensions();
                    nodes.popup.css({
                        'max-width': dim.width,
                        top: o.top || 0
                    });
                    //not window here, or we might overlap ads or sth
                    var height = o.substract ? $('#io-ox-core').height() - o.substract - o.top : $('#io-ox-core').height() - 170 - o.top;
                    nodes.body.css({
                        'height': height,
                        'max-height': height
                    });
                }
            };

            var dim = fnSetDimensions();

            // apply dimensions, only on desktop and pad
            if (_.device('!smartphone')) {
                var css = { 'max-width': dim.width + 'px' };
                if (o.center) {
                    // center vertically
                    css.top = '50%';
                    var calcSize = function () {
                        if (nodes) {
                            var nodeHeight = nodes.popup.height(),
                                winHeight = $(window).height();
                            // adjust on very small windows
                            if (winHeight < nodes.popup.height()) {
                                nodeHeight = winHeight;
                                css.overflow = 'auto';
                                css.maxHeight = '100%';
                            }
                            css.marginTop = 0 - (nodeHeight / 2 >> 0) + 'px';
                            nodes.popup.css(css);
                        }
                    };

                    $(window)
                        .off('resize.checkTop')
                        .on('resize.checkTop', calcSize);
                    calcSize();

                } else {
                    // use fixed top position
                    nodes.popup.css('top', o.top || '0px');
                    if (o.maximize) {
                        fnSetMaxDimensions();
                        $(window)
                            .off('resize.maximizedpopup')
                            .on('resize.maximizedpopup', fnSetMaxDimensions);
                    }
                }
            }

            if (_.device('smartphone')) {
                // rebuild button section for mobile devices
                nodes.popup.addClass('mobile-dialog');
                nodes.footer.rowfluid = $('<div class="row">');
                nodes.footer.append(nodes.footer.rowfluid);

                _.each(nodes.buttons, function (buttonNode) {
                    nodes.footer.rowfluid.prepend(buttonNode.addClass('btn-medium'));
                    buttonNode.wrap('<div class="col-xs-12 col-md-3">');
                });
                //nodes.body.css('margin-bottom', Math.ceil(nodes.buttons.length / 2) * 40);
            }

            this.trigger('beforeshow');

            nodes.popup.removeClass('invisible');

            // focus button (if available)
            var button = nodes.popup.find('.btn-primary').first().focus();
            if (!button.length) {
                nodes.popup.find('.btn').not('.btn-danger').first().focus();
            }

            nodes.popup.on('keydown', fnKey);

            if (callback) {
                callback.call(nodes.popup, this);
            }

            this.trigger('show');

            return deferred;
        };

        nodes.underlay.click(function () {
            if (o && o.underlayAction) {
                invoke(o.underlayAction);
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

        options = $.extend(
            { top: '50px', center: false },
            options || {}
        );

        Dialog.call(this, options);
    };

    //
    // global click handler to properly close side-popups
    $(document).on('click', function (e) {

        var popups = $('.io-ox-sidepopup');
        if (popups.length === 0) return;
        //check if we are inside a modal dialog or pressed a button in the footer (footer buttons usually close the dialog so check with .io-ox-dialog-popup would fail)
        if ($(e.target).closest('.io-ox-dialog-popup, .io-ox-dialog-underlay, .modal-footer').length > 0) {
            return;
        }

        var inside = $(e.target).closest('.io-ox-sidepopup'),
            index = popups.index(inside);

        popups.slice(index + 1).trigger('close');
    });

    $(document).on('keydown', function (e) {
        if (e.which === 27) $('.io-ox-sidepopup').trigger('close');
    });

    var SidePopup = function (options) {

        options = _.extend({
            modal: false,
            arrow: true,
            // closely positon to click/touch location
            closely: false,
            tabTrap: true
        }, options || {});

        var open,
            close,
            closeAll,
            // for example: The view within this SidePopup closes itself
            closeByEvent,
            previousProp,
            timer = null,
            lastFocus = $(),

            overlay,

            pane = $('<div class="io-ox-sidepopup-pane f6-target default-content-padding abs" tabindex="1">'),

            closer = $('<div class="io-ox-sidepopup-close">').append(
                    $('<a href="#" class="close" data-action="close" role="button" tabindex="1">').append(
                        $('<i class="fa fa-times">')
                    )
                ),

            popup = $('<div class="io-ox-sidepopup abs">').attr('role', 'complementary').append(closer, pane),

            arrow = options.arrow === false ? $() :
                $('<div class="io-ox-sidepopup-arrow">').append(
                    $('<div class="border">'),
                    $('<div class="triangle">')
                ),

            target = null,

            self = this,

            fnKey = function (e) {
                var items, focus, index;
                if (e.which === 9 && options.tabTrap) {

                    items = $(this).find('[tabindex][disabled!="disabled"]:visible');
                    if (items.length) {
                        e.preventDefault();
                        focus = $(document.activeElement);
                        index = (items.index(focus) >= 0) ? items.index(focus) : 0;
                        index += (e.shiftKey) ? -1 : 1;

                        if (index >= items.length) {
                            index = 0;
                        } else if (index < 0) {
                            index = items.length - 1;
                        }
                        items.eq(index).focus();
                    }
                }
            },

            pane = pane.scrollable();

        // add event hub
        Events.extend(this);

        if (options.modal) {
            overlay = $('<div class="io-ox-sidepopup-overlay abs">').append(popup, arrow);
        }

        // public nodes
        this.nodes = {};
        this.lastTrigger = null;

        closeByEvent = function (e) {
            close(e);
        };

        close = function () {

            // use this to check if it's open
            if (self.nodes.closest) {

                if (options.saveOnClose) {
                    pane.find('.settings-detail-pane').trigger('save');
                }

                // remove handlers & avoid leaks
                self.nodes.closest.prop('sidepopup', previousProp);
                popup.off('view:remove remove close', closeByEvent);
                self.lastTrigger = previousProp = null;
                // use time to avoid flicker
                timer = setTimeout(function () {

                    // is inside simple-window?
                    if (self.nodes.simple.length) {
                        var popups = self.nodes.simple.find('.io-ox-sidepopup'), prev;
                        if (popups.length > 1) {
                            prev = popups.eq(-2);
                            prev.show();
                            $('body').scrollTop(prev.attr('data-scrolltop') || 0);
                        } else {
                            self.nodes.simple.find('[data-hidden-by-sidepopup]')
                                .removeAttr('data-hidden-by-sidepopup')
                                .show();
                            $('body').scrollTop(self.lastSimpleScrollPos || 0);
                        }
                        self.nodes.simple = null;
                    }

                    if (options.modal) {
                        overlay.detach();
                    } else {
                        arrow.detach();
                        popup.detach();
                    }
                    pane.empty();

                    if (options.focus) {
                        lastFocus = lastFocus.closest(':visible');
                        lastFocus.focus();
                    }

                    self.trigger('close');
                }, 100);
            }
        };

        closeAll = function (e) {
            e.data.target.find('.io-ox-sidepopup').trigger('close');
        };

        popup.on('close', close);

        popup.on('keydown', fnKey);

        closer.find('.close')
            .on('click', function (e) {
                // route click to 'pane' since closer is above pane
                pane.trigger('click');
                // close side popup
                close(e);
                return false;
            })
            .on('keydown', function (e) {
                // enter
                if ((e.keyCode || e.which) === 13) {
                    $(this).trigger('click');
                }
            });

        function getPct(x) {
            var pct = x / $('body').width() * 100 >> 0;
            // ensure 0-100 range
            return Math.max(0, Math.min(100, pct));
        }

        open = function (e, handler) {
            // get proper elements
            var my = $(this), zIndex, sidepopup;

            lastFocus = $(document.activeElement);

            self.nodes = {
                closest: target || my.parents('.io-ox-sidepopup-pane, .window-content, .window-container-center, .io-ox-dialog-popup, .notifications-overlay, body').first(),
                click: my.parents('.io-ox-sidepopup-pane, .io-ox-dialog-popup, .notifications-overlay, body').first(),
                target: target || my.parents('.simple-window, .window-container-center, .notifications-overlay, body').first(),
                simple: my.closest('.simple-window')
            };

            // get active side popup & triggering element
            sidepopup = self.nodes.closest.prop('sidepopup') || null;
            self.lastTrigger = sidepopup ? sidepopup.lastTrigger : null;
            // get zIndex for visual stacking
            zIndex = my.parents('.io-ox-sidepopup, .window-content, .io-ox-dialog-popup, .window-container-center, .notifications-overlay, body').css('zIndex');
            zIndex = parseInt(zIndex, 10);
            zIndex = _.isNumber(zIndex) ? zIndex + 2 : 100;
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
                self.nodes.closest.prop('sidepopup', self);

                // clear timer
                clearTimeout(timer);

                // add handlers to close popup
                popup.on('view:remove remove', closeByEvent);

                // decide for proper side
                var docWidth = $('body').width(), mode, pct, left, right,
                    parentPopup = my.parents('.io-ox-sidepopup').first(),
                    firstPopup = parentPopup.length === 0;

                // get side
                if (/^(left|right)$/.test(options.side)) {
                    mode = options.side;
                } else if (self.nodes.target.is('.notifications-overlay')) {
                    // classic behavior: consider position of previous popup
                    mode = parentPopup.hasClass('right') ? 'left' : 'right';
                } else {
                    // use click position to determine which side to appear
                    mode = e.pageX > docWidth / 2 ? 'left' : 'right';
                    if (firstPopup) {
                        options.closely = true;
                        popup.add(arrow).addClass('first');
                    }
                }

                popup.add(arrow).removeClass('left right').addClass(mode).css('z-index', zIndex);
                arrow.css('zIndex', zIndex + 1);

                if (options.closely && _.device('!smartphone')) {
                    if (mode === 'left') {
                        pct = getPct(e.pageX - 100);
                        left = '';
                        right = (100 - pct) + '%';
                    } else {
                        pct = getPct(e.pageX + 100);
                        left = pct + '%';
                        right = '';
                    }
                    // we need to set left AND right because the popup might be reused (delegate mode)
                    popup.add(arrow).css({ left: left, right: right });
                }

                // is inside simple-window?
                if (self.nodes.simple.length) {
                    self.lastSimpleScrollPos = $('body').scrollTop();
                    self.nodes.simple.find('.window-content:visible')
                        .attr('data-hidden-by-sidepopup', 'true')
                        .hide();
                    self.nodes.simple.find('.io-ox-sidepopup:visible').each(function () {
                        $(this).attr('data-scrolltop', $('body').scrollTop()).hide();
                    });
                    $('body').scrollTop(0);
                }

                // defer to avoid being closed directly
                _.defer(function () {

                    // add popup to proper element
                    self.nodes.target.append(
                        (options.modal ? overlay : popup).css('visibility', 'hidden')
                    );

                    // call custom handler
                    (handler || $.noop).call(self, pane.empty(), e, my);

                    // set arrow top
                    var halfHeight = (my.outerHeight(true) / 2 >> 0),
                        targetOffset = self.nodes.target.offset() ? self.nodes.target.offset().top : 0,
                        top = my.offset().top + halfHeight - targetOffset;

                    //
                    arrow.css('top', top);

                    // finally, add arrow
                    (options.modal ? overlay : popup).css('visibility', '');
                    if (!options.modal) {
                        self.nodes.target.append(arrow);
                    }

                    pane.parent().focus();
                    self.trigger('show');
                });
            }
        };

        this.delegate = function (node, selector, handler) {

            $(node).on('click.sidepopup', selector, function (e) {
                if ((e.originalEvent || e).processed !== true) {
                    open.call(this, e, handler);
                }
            });

            $(node).on('keypress.sidepopup', selector, function (e) {
                if (e.which === 13 && (e.originalEvent || e).processed !== true) {
                    open.call(this, e, handler);
                }
            });

            return this;
        };

        this.undelegate = function (node) {
            $(node).off('.sidepopup');
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

        this.destroy = function () {
            close();
            this.nodes = overlay = pane = closer = popup = arrow = null;
            return this;
        };
    };

    return {
        ModalDialog: Dialog,
        CreateDialog: CreateDialog,
        SidePopup: SidePopup,
        busy: function (node) {
            node.find('button, input').each(function (key, val) {
                val = $(val);
                if (val.prop('disabled')) {
                    val.data('disabled', true);
                } else {
                    val.prop('disabled', true);
                }
            });
        },
        idle: function (node) {
            node.find('button, input').each(function (key, val) {
                val = $(val);
                if (val.data('disabled')) {
                    val.removeData('disabled');
                } else {
                    val.prop('disabled', false);
                }
            });
        }
    };
});

// DEBUGGING
/*
require(['io.ox/core/tk/dialogs'], function (dialogs) {
    new dialogs.ModalDialog()
        .text('Are you really sure about your decision? Are you aware of all consequences you have to live with?')
        .addButton('cancel', 'No, rather not')
        .addPrimaryButton('delete', 'Shut up and delete it!')
        .show()
        .done(function (action) {
            console.debug('Action', action);
        });
});

require(['io.ox/core/tk/dialogs'], function (dialogs) {
    new dialogs.CreateDialog()
        .text(new Array(20).join('Lorem ipsum dolor sit amet, consetetur sadipscing elitr'))
        .data({ id: 1234 })
        .addButton('cancel', 'Cancel')
        .addButton('yep', 'Yep')
        .show()
        .done(function (action, data) {
            console.debug('Action', action, data);
        });
});

*/
