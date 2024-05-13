/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/tk/dialogs', [
    'io.ox/core/event',
    'io.ox/core/extensions',
    'io.ox/core/a11y',
    'io.ox/backbone/mini-views/helplink',
    'gettext!io.ox/core'
], function (Events, ext, a11y, HelpLinkView, gt) {

    'use strict';

    // scaffolds
    function getUnderlay() {
        return $('<div class="modal-backdrop in" aria-hidden="true">').hide();
    }

    function getPopup() {
        return $('<div class="io-ox-dialog-popup" role="dialog" aria-labelledby="dialog-title">').hide()
            .append(
                $('<div role="document">').append(
                    $('<div class="modal-header" id="dialog-title">'),
                    $('<div class="modal-body">'),
                    $('<div class="clearfix">'),
                    $('<div class="modal-footer">')
                )
            );
    }

    var Dialog = function (options) {

        if (ox.debug) console.warn('io.ox/core/tk/dialogs is deprecated. Please use io.ox/backbone/views/modal for modal dialogs. io.ox/core/tk/dialogs will be removed in future releases.');

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
                // sidepopups may be in body node under certain circumstances. Prevent new dialogs from hiding under them
                container: ($('body>.io-ox-sidepopup-overlay').length ? $('body') : $('#io-ox-core')),
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
                var insidePopup = $(e.target).closest('.io-ox-dialog-popup, .io-ox-sidepopup, .mce-window, .date-picker, .addressbook-popup').length > 0;
                if (insidePopup) return;
                // should not keep focus if smart dropdown is open
                var smartDropdown = $('body > .smart-dropdown-container').length > 0;
                if (smartDropdown) return;
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
                // remove mobile resize listener
                $(window).off('resize.mobile-dialog');
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
                            .css('opacity', '')
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

                switch (e.which) {
                    case 27:
                        // ESC
                        if (!isBusy && self.getBody().find('.open > .dropdown-menu').length === 0) {
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
                        if (o.tabTrap) a11y.trapFocus(this, e);
                        break;
                    default:
                        break;
                }
            },

            /*
             * This function hides the siblings of the element itself and the siblings of all parents (except body) from screen-readers
             * by setting aria-hidden="true". It also registers a listener, which restores the aria-hidden attribute after the
             * dialog has been closed.
             */
            ariaHideSiblings = function () {
                // add aria-hidden="true" to all siblings of the wrapper and all parents of the wrapper
                $(nodes.wrapper).parentsUntil('body').add(nodes.wrapper).siblings(':not(script,noscript)').each(function () {
                    var el = $(this);
                    // save aria-hidden value for later restoring
                    el.data('ox-restore-aria-hidden', el.attr('aria-hidden'));
                }).attr('aria-hidden', true);
                self.on('close', function () {
                    // restore aria-hidden and remove restoring information
                    $(nodes.wrapper).parentsUntil('body').add(nodes.wrapper).siblings(':not(script,noscript)').removeAttr('aria-hidden').each(function () {
                        var el = $(this);
                        if (el.data('ox-restore-aria-hidden')) el.attr('aria-hidden', el.data('ox-restore-aria-hidden'));
                        el.removeData('ox-restore-aria-hidden');
                    });
                });
            };
        // pass options to ext point
        ext.point('io.ox/core/dialogs').invoke('customize', this, o);
        // append all elements
        o.container.append(
            nodes.wrapper
                .append(nodes.popup, nodes.underlay)
        );

        _(['header', 'body', 'footer']).each(function (part) {
            nodes[part] = nodes.popup.find('.modal-' + part);
        });

        if (o.addClass) {
            nodes.popup.addClass(o.addClass);
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
                    self.getBody().css('height', heightVal + 'px');
                } else {
                    self.getBody().css('height', cellHeight + 'px');
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
            var p = nodes.body,
                id = _.uniqueId('label-');
            p.find('.plain-text').remove();
            p.append($('<h4 class="plain-text">').attr('id', id).text(str || ''));
            nodes.popup.attr({
                'aria-labelledby': id,
                role: 'alertdialog'
            });
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
                inverse: options.inverse
            };

            if (options.type) {
                opt[options.type] = true;
            }
            var button = $.button(opt);
            nodes.buttons.push(button);
            return button.addClass(options.classes).attr({
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

        this.addCheckbox = function (label, action, status) {
            var guid = _.uniqueId('form-control-label-');
            nodes.footer.prepend(
                $('<div class="checkbox">').append(
                    $('<div class="controls">'),
                    $('<label>').attr('for', guid).text(label).prepend(
                        $('<input type="checkbox">').attr({ 'id': guid, 'data-action': action }).prop('checked', status)
                    )
                )
            );
            return this;
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

            if (o.help) nodes.header.addClass('help').append(new HelpLinkView({ href: o.help, modal: true }).render().$el);

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
                    // not window here, or we might overlap ads or sth
                    var height = $('#io-ox-core').height() - (2 * o.top) - nodes.header.outerHeight() - nodes.footer.outerHeight();
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

            // make sure, that the maximum height of the dialog does not exceed the screen height
            function fnMobileMaxHeight() {
                nodes.body.css('max-height', $('#io-ox-core').height() - 40 - nodes.header.outerHeight() - nodes.footer.outerHeight());
            }
            if (_.device('smartphone')) {
                fnMobileMaxHeight();
                $(window).on('resize.mobile-dialog', fnMobileMaxHeight);
            }

            // focus button (if available)
            if (_.device('!smartphone')) {
                var button = nodes.popup.find('.btn-primary').first().focus();
                if (!button.length) {
                    nodes.popup.find('.btn').not('.btn-danger').first().focus();
                }
            }

            nodes.popup.on('keydown', fnKey);

            if (callback) {
                callback.call(nodes.popup, this);
            }

            ariaHideSiblings();
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

        this.setUnderlayStyle = function (css) {
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

    // global click handler to properly close side-popups
    $(document).on('click', function (e) {

        var popups, target = $(e.target);

        function isWhitelisted(target) {
            var whiteList = [
                // check if we are inside a floating-window, a modal dialog or pressed a button in the footer (footer buttons usually close the dialog so check with .io-ox-dialog-popup would fail)
                '.io-ox-dialog-popup',
                '.modal.in',
                '.modal-backdrop.in',
                '.modal-footer',
                '.floating-window',
                // see bug 63561
                '.participant-wrapper.removable',
                '.autocomplete-item',
                // see bug 41822
                '.io-ox-dialog-sidepopup-toggle'
            ].join(', ');

            // blocklist needed to handle removed elements [OXUIB-2713]
            var blockList = [
                'td[role=gridcell]'
            ].join(', ');

            return target.closest(whiteList).length > 0 || target.is('html') || (!document.contains(target.get(0)) && target.closest(blockList).length === 0);
        }

        if (target.hasClass('apptitle')) {
            popups = $('.io-ox-sidepopup:not(.preserve-on-appchange)');
        } else {
            popups = $('.io-ox-sidepopup:not(.preserve-on-appchange), .preserve-on-appchange:visible');
        }

        if (popups.length === 0) return;

        if (isWhitelisted(target)) return;

        var inside = $(e.target).closest('.io-ox-sidepopup'),
            index = popups.index(inside);

        popups.slice(index + 1).trigger('close');
    });

    $(document).on('keydown', function (e) {
        if (e.which === 27) {
            $('.io-ox-sidepopup:not(.preserve-on-appchange), .preserve-on-appchange:visible').last().trigger('close');
        }
    });

    var SidePopup = function (options) {

        options = _.extend({
            modal: false,
            arrow: true,
            // closely positon to click/touch location
            closely: false,
            tabTrap: true,
            focus: true
        }, options || {});

        var open,
            close,
            // for example: The view within this SidePopup closes itself
            closeByEvent,
            previousProp,
            timer = null,
            lastFocus = $(),

            overlay,

            sidepopuppane = $('<div class="io-ox-sidepopup-pane f6-target default-content-padding abs">'),

            id = _.uniqueId('sidepopup-'),

            closer = $('<div class="io-ox-sidepopup-close">').append(
                $('<a href="#" class="close" data-action="close" role="button">').attr({
                    'aria-label': gt('Close'),
                    'aria-controls': id
                }).append(
                    $('<i class="fa fa-times" aria-hidden="true">').attr('title', gt('Close'))
                )
            ),

            popup = $('<div class="io-ox-sidepopup abs" role="dialog">').attr('id', id).append($('<div role="document">').append(closer, sidepopuppane)),

            arrow = options.arrow === false ? $() :
                $('<div class="io-ox-sidepopup-arrow">').append(
                    $('<div class="border">'),
                    $('<div class="triangle">')
                ),

            target = null,

            self = this,

            fnKey = function (e) {
                if (e.which === 9 && options.tabTrap) a11y.trapFocus(this, e);
            },

            pane = sidepopuppane.scrollable();

        // add event hub
        Events.extend(this);

        if (options.modal) {
            overlay = $('<div class="io-ox-sidepopup-overlay abs">').append(popup, arrow);
        }

        // prevent popups from closing when the app changes
        // used in calendar week/month views see Bug 41346
        if (options.preserveOnAppchange) {
            popup.addClass('preserve-on-appchange');
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

        // TODO: unused
        // closeAll = function (e) {
        //     e.data.target.find('.io-ox-sidepopup').trigger('close');
        // };

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
                if (e.which === 13) {
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
                target: target || my.parents('.simple-window, .window-container-center, .notifications-overlay, #io-ox-notifications-sidepopup, body').first(),
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

                if (e) {
                    e.stopPropagation();
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
                    // for click events inside iframes we need to add the iframe's offset too
                    var offset = e.target && $(e.target).is('iframe') ? e.target.getBoundingClientRect().left : 0;
                    if (mode === 'left') {
                        // sidepopup's max-width is 45%, so we limit to 54%
                        pct = Math.min(54, 100 - getPct(e.pageX + offset - 100));
                        left = '';
                        right = pct + '%';
                    } else {
                        pct = Math.min(54, getPct(e.pageX + offset + 100));
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
                    closer.find('.close').focus();
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
                    // needed or the click handler is also triggered, which causes the popup to close again immediately
                    e.preventDefault();
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
