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

define('io.ox/core/tk/list-selection', ['settings!io.ox/core'], function (settings) {

    'use strict';

    var SELECTABLE = '.selectable',
        SWIPEDELETE = '.swipe-button.delete',
        SWIPEMORE = '.swipe-button.more',
        isTouch = _.device('touch'),
        isLegacyWebview = _.device('android') && _.browser.android < '4.4',
        defaultBehavior = settings.get('selectionMode', 'normal'),
        // mobile stuff
        THRESHOLD_X =        20, // touchmove threshold for mobiles in PX
        THRESHOLD_STICK =    40, // threshold in px
        THRESHOLD_REMOVE =  250, //px
        LOCKDISTANCE =      190,
        MOVE_UP_TIME =      200,
        UNFOLD_TIME =       100,
        UNFOLD_TIME_FULL =   50,
        RESET_CELL_TIME =   100,
        CELL_HEIGHT = '-84px', // todo: calculate this
        cell,
        recentWindowsKey = false;

    function Selection(view, options) {

        options = _.isObject(options) ? options : {};

        this.view = view;
        this.behavior = options.behavior || defaultBehavior;
        this._direction = 'down';
        this._lastPosition = -1;

        switch (this.behavior) {
            case 'normal':
                _.extend(this, normalBehavior);
                break;
            case 'alternative':
                _.extend(this, normalBehavior, alternativeBehavior);
                break;
            case 'simple':
                _.extend(this, simpleBehavior);
                break;
            case 'single':
                _.extend(this, simpleBehavior, singleBehavior);
                break;
            default:
                console.error('Unknown selection behavior', this.behavior);
                break;
        }

        this.registerEvents();
    }

    var prototype = {

        // returns array of composite keys (strings)
        get: function () {
            // don't return jQuery's result directly, because it doesn't return a "normal" array (tests might fail)
            return _(this.view.$el.find(SELECTABLE + '.selected')).map(function (node) {
                return $(node).attr('data-cid');
            });
        },

        resolve: function () {
            var view = this.view;
            return this.get().map(function (cid) {
                return view.collection.get(cid);
            });
        },

        getItems: function (filter) {
            var items = this.view.$el.find(SELECTABLE);
            return filter ? items.filter(filter) : items;
        },

        getNode: function (cid) {
            return this.getItems().filter('[data-cid="' + cid + '"]');
        },

        getPosition: function (items) {
            items = items || this.getItems();
            var pos = items.index(items.filter('.precursor'));
            if (pos !== this._lastPosition) this._direction = pos < this._lastPosition ? 'up' : 'down';
            this._lastPosition = pos;
            return pos;
        },

        getDirection: function () {
            return this._direction;
        },

        check: function (nodes) {
            nodes.addClass('selected').attr('aria-selected', true);
            this.triggerSelectEvent('add', nodes);
        },

        uncheck: function (nodes) {
            nodes.removeClass('selected no-checkbox').attr({ 'aria-selected': false, tabindex: '-1' });
            this.triggerSelectEvent('remove', nodes);
        },

        toggle: function (node) {
            if (node.hasClass('selected')) this.uncheck(node); else this.check(node);
        },

        triggerSelectEvent: function (type, nodes) {
            var ids = nodes.map(function () { return $(this).attr('data-cid'); }).toArray();
            this.view.trigger('selection:' + type, ids);
        },

        set: function (list, focus) {

            if (!_.isArray(list)) return;

            var items = this.getItems(), hash = {};

            this.clear();

            // convert array to hash, then loop over all DOM nodes once (faster)
            _(list).each(function (item) {
                var cid = typeof item === 'string' ? item : _.cid(item);
                hash[cid] = true;
            });

            items = items.filter(function () {
                var cid = $(this).attr('data-cid');
                return (cid in hash);
            });

            this.check(items);

            if (items.length) {
                var node = items.last().attr('tabindex', '0');
                if (focus) node.focus();
            }

            this.triggerChange();
        },

        triggerAction: function (e) {
            var cid = $(e.currentTarget).attr('data-cid');
            this.view.trigger('selection:action', [cid]);
        },

        triggerDouble: function (e) {
            var cid = $(e.currentTarget).attr('data-cid');
            this.view.trigger('selection:doubleclick', [cid]);
        },

        triggerChange: function (items, currentTargetCID) {
            items = items || this.getItems();
            // default event
            var list = this.get(), events = 'selection:change';
            // empty, one, multiple
            if (list.length === 0) {
                events += ' selection:empty';
            } else if (list.length === 1) {
                events += ' selection:one';
            } else if (list.length > 1) {
                events += ' selection:multiple';
            }
            // to keep correct select all checkbox state
            // if the folder only contains one item, we must check the checkbox status
            if (items && items.length > 0 && items.length === list.length && (items.length !== 1 || !$(items[0]).hasClass('no-checkbox'))) {
                events += ' selection:all';
            } else {
                events += ' selection:subset';
            }
            this.view.trigger(events, list, currentTargetCID);
        },

        clear: function (items) {
            items = items || this.getItems();
            this.resetTabIndex(items);
            this.resetCheckmark(items);
            this.reset();
        },

        // a collection reset implies a clear
        reset: function () {
            this.triggerChange();
        },

        remove: function (cid, node) {
            node = node || this.getNode(cid);
            if (!node.is('.selected')) return;
            this.triggerChange();
        },

        isRange: function (e) {
            return e && e.shiftKey;
        },

        isCheckmark: function (e) {
            return e && $(e.target).is('.list-item-checkmark, .fa.fa-checkmark, .checkmark, .checkbox');
        },

        isMultiple: function (e) {
            return e && (e.metaKey || e.ctrlKey || /35|36/.test(e.which) || this.isCheckmark(e));
        },

        isEmpty: function () {
            return _.isEmpty(this.get());
        },

        resetTabIndex: function (items, skip) {
            items = items.filter('[tabindex="0"]');
            items.not(skip).attr('tabindex', '-1');
        },

        resetCheckmark: function (items) {
            items = items.filter('.selected').removeClass('selected no-checkbox').attr('aria-selected', false);
            this.triggerSelectEvent('remove', items);
        },

        // resets all (usually one) items with swipe-left class
        // return true if an item had to be reset
        resetSwipe: function (items) {
            var nodes = items.filter('.swipe-left');
            nodes.removeClass('swipe-left').find('.swipe-left-content').remove();
            return !!nodes.length;
        },

        focus: function (index, items, focus) {
            items = items || this.getItems();
            var node = items.eq(index).attr('tabindex', '0');
            if (focus !== false) {
                // call focus deferred due to some issues in internet explorer
                if (_.device('ie')) _.defer(function () { node.focus(); });
                else node.focus();
            }
            // workaround for chrome's CSS bug:
            // styles of "selected" class are not applied if focus triggers scrolling.
            // idea taken from http://forrst.com/posts/jQuery_redraw-BGv
            if (_.device('chrome < 48')) node.hide(0, function () { $(this).show(); });
            return node;
        },

        pick: function (index, items, e, focus) {
            var node;

            items = items || this.getItems();

            if (this.isRange(e)) {
                //range select
                this.pickRange(index, items);
            } else {
                // single select
                items.removeClass('precursor');
                node = this.focus(index, items, focus).addClass('precursor');

                if (this.isMultiple(e)) this.pickMultiple(node, items);
                else this.pickSingle(node);
            }
        },

        pickRange: function (index, items) {
            var cursor = this.getPosition(items, index),
                start = Math.min(index, cursor),
                end = Math.max(index, cursor);

            // remove no-checkbox class for range select
            $(items.slice(start, end + 1)).removeClass('no-checkbox');
            this.check(items.slice(start, end + 1));
            this.focus(index, items);
        },

        pickMultiple: function (node, items) {
            //already selected but checkbox is not yet marked
            if (node.hasClass('selected no-checkbox')) {
                node.removeClass('no-checkbox');
            } else {
                //remove selected items without checked checkbox in true multi selection
                items.filter('.no-checkbox').removeClass('selected no-checkbox').attr('aria-selected', false);
                this.toggle(node);
            }
        },

        pickSingle: function (node) {
            this.check(node);
        },

        // just select one item (no range; no multiple)
        select: function (index, items, focus) {
            items = items || this.getItems();
            if (index >= items.length) return;
            this.resetCheckmark(items);
            this.resetTabIndex(items, items.eq(index));
            this.pick(index, items, null, focus);
            this.selectEvents(items);
        },

        //events triggered by selection function
        selectEvents: function (items) {
            this.triggerChange(items);
        },

        selectAll: function (items) {
            items = _.isString(items) ? this.getItems(items) : (items || this.getItems());
            var slice = items.slice(0, items.length);
            slice.removeClass('no-checkbox precursor');
            slice.first().addClass('precursor');
            this.check(slice);
            this.focus(0, items);
            this.triggerChange(items);
        },

        selectNone: function () {
            this.clear();
            this.triggerChange();
        },

        move: function (step) {
            var items = this.getItems(),
                index = this.getPosition() + step;
            if (index < 0) {
                index = 0;
            } else if (index >= items.length) {
                index = items.length - 1;
            }
            this.select(index, items);
        },

        previous: function () {
            this.move(-1);
            this.view.trigger('selection:action', this.get());
        },

        next: function () {
            this.move(1);
            this.view.trigger('selection:action', this.get());
        },

        // to anticipate a removal of multiple items
        dodge: function () {

            var items = this.getItems(),
                selected = items.filter('.selected'),
                length = selected.length,
                first = items.index(selected.first()),
                last = items.index(selected.last()),
                tail = items.length - 1,
                apply = this.select.bind(this),
                direction = this.getDirection(),
                focus = $.contains(this.view.el, document.activeElement);

            // All: if all items are selected we dodge by clearing the entire selection
            if (items.length === length) return this.clear();

            // special case: always dodge upwards if end of selection is end of list, see OXUIB-510
            if (last === tail) direction = 'up';

            // up and enough room
            if (direction === 'up' && first > 0) return apply(first - 1, items, focus);

            // down and enough room
            if (direction === 'down' && last < tail) return apply(last + 1, items, focus);

            // otherwise: iterate over list to find a free spot
            items.slice(first).each(function (index) {
                if (!$(this).hasClass('selected')) {
                    apply(first + index, items, focus);
                    return false;
                }
            });
        },

        onCursor: function (e) {

            // cursor left/right have no effect in a list
            var grid = this.view.$el.hasClass('grid-layout'),
                cursorLeftRight = /37|39/.test(e.which);
            if (!grid && cursorLeftRight) return;

            // get current index
            var items = this.getItems(),
                current = $(document.activeElement),
                index = (items.index(current) || 0);

            var width = parseInt(this.view.$el.attr('grid-count') || 1, 10),
                column = index % width;

            // compute new index
            var cursorUpDown = /38|40|35|36/.test(e.which),
                cursorBack = /37|38|36/.test(e.which),
                step = grid && cursorUpDown ? width : 1;
            index += cursorBack ? -step : +step;

            // move to very last element on cursor down or end?
            if (step > 1 && /40|35/.test(e.which) && index >= items.length && column >= (items.length % width)) index = items.length - 1;

            // out of bounds?
            index = this.outOfBounds(index, items);
            if (index === false) return;

            // prevent default to avoid unwanted scrolling
            e.preventDefault();

            // jump to top/bottom OR range select / single select
            if (this.isMultiple(e)) {
                index = (/38|36/.test(e.which) ? 0 : -1);
            }

            var currentTarget = items.eq(index);
            this.resetTabIndex(items, currentTarget);
            this.resetCheckmark(items);
            this.pick(index, items, e);
            // just call get position to update "direction"
            this.getPosition();
            // alternative selection mode needs this, has no effect in default mode
            if (this.isMultiple(e) || this.isRange(e)) {
                this.triggerChange(items, currentTarget.attr('data-cid'));
            } else {
                this.selectEvents(items);
            }
        },

        // defines behaviour when index out of bounds should be selected by arrow keys
        outOfBounds: function (index, items) {
            if (index < 0) return false;
            if (index >= items.length) {
                // scroll to very bottom if at end of list (to keep a11y support)
                this.view.$el.scrollTop(0xFFFFFF);
                return false;
            }
            return index;
        },

        onPageUpDown: function (e) {
            e.preventDefault();
            var items = this.getItems(), height = items.first().outerHeight(), step;
            if (!height) return;
            step = Math.floor(this.view.$el.height() / height);
            if (e.which === 33) this.move(-step); else this.move(step);
        },

        onKeydown: function (e) {

            switch (e.which) {

                // [enter] > action
                // [space] > action
                case 13:
                case 32:
                    this.triggerAction(e);
                    break;

                // [Ctrl|Cmd + A] > select all
                // [a] > archive
                case 65:
                case 97:
                    if (e.ctrlKey || e.metaKey || recentWindowsKey) {
                        e.preventDefault();
                        this.selectAll();
                    } else if (e.which === 65 && !e.shiftKey && !e.altKey) {
                        this.view.trigger('selection:archive', this.get());
                    }
                    break;

                // Windows key (workaround for incomplete detection)
                case 91:
                    recentWindowsKey = true;
                    setTimeout(function () { recentWindowsKey = false; }, 2000);
                    break;

                // [Del], [Backspace] or [fn+Backspace] (MacOS) > delete item
                case 8:
                case 46:
                    // ignore combinations like ctrl+shift+del (see bug 55469)
                    if (e.ctrlKey || e.metaKey || e.altKey) return;
                    e.preventDefault();
                    this.view.trigger('selection:delete', this.get(), e.shiftKey);
                    break;

                // home/end cursor left/right up/down
                case 35:
                case 36:
                case 37:
                case 38:
                case 39:
                case 40:
                    this.onCursor(e);
                    break;

                // page up/down
                case 33:
                case 34:
                    this.onPageUpDown(e);
                    break;
                // no default
            }
        },

        onMousedown: function () {
            this.view.mousedown = true;
        },
        onMouseup: function () {
            this.view.mousedown = false;
        },

        onClick: function (e, options) {
            options = options || {};

            if (e.type === 'tap') {
                // prevent ghostclicks
                e.preventDefault();
                e.stopPropagation();
            }
            // consider mousedown only if unselected and not in multiple-mode
            if (e.type === 'mousedown' && !this.isMultiple(e) && $(e.currentTarget).is('.selected')) return;
            // ignore clicks in multiple-mode
            if (e.type === 'click' && this.isMultiple(e)) return;

            var items = this.getItems(),
                current = $(e.currentTarget),
                index = items.index(current) || 0,
                previous = this.get();

            if (isTouch && this.resetSwipe(items)) return;
            if (e.isDefaultPrevented() && e.type !== 'tap') return;
            if (!this.isMultiple(e)) this.resetCheckmark(items);
            this.resetTabIndex(items, items.eq(index));

            // range select / single select
            this.pick(index, items, e);

            // support custom events
            if (options.customEvents) return;
            // always trigger in multiple mode (sometimes only checkbox is changed)
            if (!_.isEqual(previous, this.get())) this.triggerChange(items, $(e.currentTarget).attr('data-cid'));
        },

        onSwipeDelete: function (e) {
            e.preventDefault();
            var node = $(this.currentSelection).closest(SELECTABLE),
                cid = node.attr('data-cid'),
                cellsBelow = node.nextAll(),
                self = this,
                resetStyle = function () {
                    this.removeAttr('style');
                    // reset velocitie's transfrom cache manually
                    _(this).each(function (listItem) {
                        // assigning the value directly leads to a typeerror on ios
                        // like $(listItem).data('velocity').transformCache = {}
                        var c = $(listItem).data('velocity');
                        c.transformCache = {};
                        $(listItem).data('velocity', c);
                    });
                    self.view.off('remove-mobile', resetStyle);
                };
            if (cellsBelow.length > 0) {
                // animate cell and delete mail afterwards
                cellsBelow.velocity({
                    translateY: CELL_HEIGHT
                }, {
                    duration: MOVE_UP_TIME,
                    complete: function () {
                        self.view.on('remove-mobile', resetStyle, cellsBelow);
                        self.view.trigger('selection:delete', [cid]);
                        self.currentSelection.swipeCell.remove();
                        self.currentSelection.swipeCell = null;
                        $(self.view).removeClass('unfolded');
                        self.currentSelection.unfolded = self.unfold = false;
                    }
                });
            } else {
                self.view.on('remove-mobile', resetStyle, cellsBelow);
                self.view.trigger('selection:delete', [cid]);
                self.currentSelection.swipeCell.remove();
                self.currentSelection.swipeCell = null;
                $(self.view).removeClass('unfolded');
                self.currentSelection.unfolded = self.unfold = false;
            }
        },

        onSwipeMore: function (e) {
            e.preventDefault();
            var node = $(this.currentSelection).closest(SELECTABLE),
                cid = node.attr('data-cid'),
                self = this;
            // propagate event
            this.view.trigger('selection:more', [cid], $(this.currentSelection.btnMore));
            // wait for popup to open, rest cell afterwards
            _.delay(function () {
                self.resetSwipeCell.call(self.currentSelection, self);
            }, 250);
        },

        isAnyCellUnfolded: function () {
            return !!this.unfold;
        },

        resetSwipeCell: function (selection, a, instant) {
            var self = this;
            try {
                selection.startX = 0;
                selection.startY = 0;
                selection.unfold = false;
                selection.target = null;
                selection.otherUnfolded = false;
                if (!instant) {
                    $(self).velocity({
                        'translateX': [0, a]
                    }, {
                        duration: RESET_CELL_TIME,
                        complete: function () {
                            $(self).removeAttr('style');
                            $(self).removeClass('unfolded');
                            if (self.swipeCell) self.swipeCell.remove();
                            self.swipeCell = null;
                        }
                    });
                } else {
                    $(self).removeAttr('style');
                    $(self).removeClass('unfolded');
                    if (self.swipeCell) self.swipeCell.remove();
                    self.swipeCell = null;
                }
            } catch (e) {
                console.warn('something went wrong during reset', e);
            }
        },

        onTouchStart: function (e) {
            var touches = e.originalEvent.touches[0],
                currentX = touches.pageX, currentY = touches.pageY,
                t = $(this).css('transition', '');
            // var unfold indicates if any node is unfolded
            // var unfolded indicates if currently touched node is unfolded
            this.startX = currentX;
            this.startY = currentY;
            this.distanceX = 0;
            this.unfold = this.remove = this.scrolling = this.isMoving = false;

            // check if this node is already opened
            this.unfolded = t.hasClass('unfolded'); // mark current node as unfolded once
            this.otherUnfolded = t.siblings().hasClass('unfolded'); // is there another node unfolded

            // check if other nodes than the current one are unfolded
            // if so, close other nodes and stop event propagation
            if (!this.unfolded && this.otherUnfolded) {
                e.data.resetSwipeCell.call(e.data.currentSelection, e.data, -LOCKDISTANCE);
            }
        },

        onTouchMove: function (e) {
            var touches = e.originalEvent.touches[0],
                currentX = touches.pageX;
            // return early on multitouch
            if (e.originalEvent.touches.length > 1) return;

            this.distanceX = (this.startX - currentX) * -1; // invert value
            this.scrolling = false;

            // try to swipe to the right at the start
            if (currentX > this.startX && !this.unfolded && this.distanceX <= THRESHOLD_X) {
                return; // left to right is not allowed at the start
            }

            if (e.data.isScrolling) {
                this.scrolling = true;
                return; // return early on a simple scroll
            }

            // special handling for already unfolded cell
            if (this.unfolded) {
                this.distanceX += -190; // add already moved pixels
            }

            if (Math.abs(this.distanceX) > THRESHOLD_X || this.isMoving) {
                e.preventDefault(); // prevent further scrolling
                this.isMoving = true;
                e.data.view.isSwiping = true;
                if (!this.target) {
                    // do expensive jquery select only once
                    this.target = $(e.currentTarget);
                }
                if (!this.swipeCell) {
                    // append swipe action cell once, will be removed afterwards
                    this.swipeCell = $('<div class="swipe-option-cell">').append(
                        this.btnDelete = $('<div class="swipe-button delete">').append($('<i class="fa fa-trash" aria-hidden="true">')),
                        this.btnMore = $('<div class="swipe-button more">').append(this.faBars = $('<i class="fa fa-bars" aria-hidden="true">'))
                    ).css('height', this.target.outerHeight() + 'px');
                    this.target.before(this.swipeCell);
                }
                // translate the moved cell
                if ((this.distanceX + THRESHOLD_X <= 0) || (this.unfolded && this.distanceX <= 0)) {

                    var translation = this.unfolded ? this.distanceX : this.distanceX + THRESHOLD_X;
                    this.target.css({
                        '-webkit-transform': 'translate3d(' + translation + 'px,0,0)',
                        'transform': 'translate3d(' + translation + 'px,0,0)'
                    });
                }
                // if delete threshold is reached, enlarge delete button over whole cell
                if (Math.abs(this.distanceX) >= THRESHOLD_REMOVE && !this.expandDelete) {
                    this.expandDelete = true;
                    this.btnDelete.css('width', '100%');
                    this.btnMore.css('width', 0);
                    this.faBars.css('opacity', 0);

                } else if (this.expandDelete && Math.abs(this.distanceX) <= THRESHOLD_REMOVE) {
                    // remove style
                    this.expandDelete = false;
                    this.btnDelete.css('width', '95px');
                    this.faBars.css('opacity', 1);
                    this.btnMore.removeAttr('style');
                }
            }
        },

        onTouchEnd: function (e) {
            if (this.scrolling) return; // return if simple list scroll

            this.remove = this.unfold = e.data.view.isSwiping = false;
            this.isMoving = false;
            // left to right on closed cells is not allowed, we have to check this in touchmove and touchend
            if ((this.distanceX > 0) && !this.unfolded) {
                // always reset the cell to prevent half-opened cells
                e.data.resetSwipeCell.call(this, e.data, 0, true);
                return;
            }

            // check for tap on unfolded cell
            if (this.unfolded && this.distanceX <= 10) {
                e.data.resetSwipeCell.call(e.data.currentSelection, e.data, this.distanceX === 0 ? -LOCKDISTANCE : this.distanceX);
                return false; // don't do a select after this
            }

            if (this.otherUnfolded && Math.abs(this.distanceX) <= 10) {
                // other cell is opened, handle this as cancel action
                return false;
            }
            if (Math.abs(this.distanceX) >= THRESHOLD_STICK) {
                // unfold automatically and stay at a position
                this.unfold = true;
            }

            if (this.expandDelete) {
                // remove cell after this threshold
                this.remove = true;
                this.unfold = false;
            }

            cell = $(this); // save for later animation

            if (this.unfold) {
                this.expandDelete = false;

                cell.velocity({
                    translateX: [-LOCKDISTANCE, this.distanceX]
                }, {
                    duration: UNFOLD_TIME,
                    complete: function () {
                        cell.addClass('unfolded');
                    }
                });

                e.data.unfold = true;
                e.data.currentSelection = this; // save this for later use
            } else if (this.remove) {
                var self = this,
                    theView = e.data.view,
                    resetStyle = function () {
                        this.removeAttr('style');
                        // reset velocitie's transfrom cache manually
                        _(this).each(function (listItem) {
                            var vel = $(listItem).data('velocity');
                            if (vel) vel.transformCache = {};
                        });
                        theView.off('remove-mobile', resetStyle);
                    };

                $(this).velocity({
                    translateX: ['-100%', this.distanceX]
                }, {
                    duration: UNFOLD_TIME_FULL,
                    complete: function () {
                        self.btnMore.remove();
                        self.startX = self.startY = 0;
                        cell.data('velocity').transformCache = {};

                        var cellsBelow = $(self).nextAll();

                        if (cellsBelow.length > 0) {
                            cellsBelow.velocity({
                                translateY: CELL_HEIGHT
                            }, {
                                duration: MOVE_UP_TIME,
                                complete: function () {
                                    var node = $(self).closest(SELECTABLE),
                                        cid = node.attr('data-cid');
                                    // bind reset event
                                    theView.on('remove-mobile', resetStyle, cellsBelow);
                                    theView.trigger('selection:delete', [cid]);
                                    self.swipeCell.remove();
                                    self.swipeCell = null;
                                    $(self).removeClass('unfolded');
                                    self.unfolded = self.unfold = false;
                                }
                            });
                        } else {
                            var node = $(self).closest(SELECTABLE),
                                cid = node.attr('data-cid');
                            // bind reset event
                            theView.on('remove-mobile', resetStyle, cellsBelow);
                            theView.trigger('selection:delete', [cid]);
                            self.swipeCell.remove();
                            self.swipeCell = null;
                            $(self).removeClass('unfolded');
                            self.unfolded = self.unfold = false;
                        }
                    }
                });
            } else if (this.distanceX) {
                e.data.resetSwipeCell.call(this, e.data, Math.abs(this.distanceX));
                return false;
            }

            // maybe the deletion will be canceled, keep reference for reverting
            // the transformation
            ox.off('delete:canceled').on('delete:canceled', function () {
                cell.removeAttr('style');
                cell.nextAll().velocity({
                    translateY: -CELL_HEIGHT
                });
            });
        },

        onSwipeLeft: function (e) {
            var node = $(e.currentTarget);
            if (node.hasClass('swipe-left')) return;
            this.resetSwipe(this.getItems());
            this.renderInplaceRemove(node);
            node.addClass('swipe-left');
        },

        onSwipeRight: function (e) {
            this.resetSwipe($(e.currentTarget));
        },

        inplaceRemoveScaffold: $('<div class="swipe-left-content"><i class="fa fa-trash-o" aria-hidden="true"></i></div>'),

        renderInplaceRemove: function (node) {
            node.append(this.inplaceRemoveScaffold.clone());
        },

        onTapRemove: function (e) {
            e.preventDefault();
            // prevent a new select happening on the deleted cell
            e.stopImmediatePropagation();
            var node = $(e.currentTarget).closest(SELECTABLE),
                cid = node.attr('data-cid');
            // propagate event
            this.view.trigger('selection:delete', [cid]);
        },

        onFocus: function () {

            var items = this.getItems(),
                first = items.filter('[tabindex="0"]:first'),
                index = items.index(first);
            // if no item has tabindex '0' index would be -1 which will translate to the last element of the selection in this.focus(index, items)
            index = index < 0 ? 0 : index;
            this.focus(index, items);
        },

        getBehavior: function () {
            return this.behavior;
        }
    };

    var normalBehavior = {

        registerEvents: function () {

            this.view.$el
                .on('mousedown', $.proxy(this.onMousedown, this))
                .on('mouseup', $.proxy(this.onMouseup, this))
                // normal click/keyboard navigation
                .on('keydown', SELECTABLE, $.proxy(this.onKeydown, this))
                .on('mousedown click', SELECTABLE, $.proxy(this.onClick, this))
                // help accessing the list via keyboard if focus is outside
                .on('focus', $.proxy(function () {
                    if (this.view.mousedown) return;
                    this.onFocus();
                }, this))
                .on('click', SELECTABLE, $.proxy(function (e) {
                    if (!this.isMultiple(e)) this.triggerAction(e);
                }, this))
                // double click
                .on('dblclick', SELECTABLE, $.proxy(function (e) {
                    if (e.ctrlKey || e.metaKey) return;
                    this.triggerDouble(e);
                }, this))
                // avoid context menu
                .on('contextmenu', function (e) { e.preventDefault(); });

            if (this.view.options.swipe) {
                if (isTouch && _.device('android || ios') && !isLegacyWebview) {
                    this.view.$el
                        .on('touchstart', SELECTABLE, this, this.onTouchStart)
                        .on('touchmove', SELECTABLE, this, this.onTouchMove)
                        .on('touchend', SELECTABLE, this, this.onTouchEnd)
                        .on('tap', SWIPEDELETE, $.proxy(function (e) {
                            this.onSwipeDelete(e);
                        }, this))
                        .on('tap', SWIPEMORE, $.proxy(function (e) {
                            this.onSwipeMore(e);
                        }, this));
                } else if (isTouch) {
                    this.view.$el
                        .on('swipeleft', SELECTABLE, $.proxy(this.onSwipeLeft, this))
                        .on('swiperight', SELECTABLE, $.proxy(this.onSwipeRight, this))
                        .on('tap', '.swipe-left-content', $.proxy(this.onTapRemove, this));
                }
            }
        }
    };

    var alternativeBehavior = {

        pickSingle: function (node) {
            node.addClass('selected no-checkbox').attr('aria-selected', true);
            // remove select all checkbox;
            this.view.trigger('selection:subset');
        },

        onKeydown: function (e) {
            // spacebar
            if (e.which === 32) {
                e.preventDefault();
                var selection = this.getItems().filter('.selected');
                if (selection.length === 1) {
                    selection.find('.list-item-checkmark').trigger('mousedown');
                } else if (selection.length === 0) {
                    //if the currently focussed element is in our items list we select it
                    selection = $(this.getItems()[this.getItems().index($(document.activeElement))]);
                    selection.find('.list-item-checkmark').trigger('mousedown');
                }
            } else {
                //use standard method
                prototype.onKeydown.call(this, e);
            }
        },

        outOfBounds: function (index, items) {
            if (index < 0) return 0;

            if (index >= items.length) {
                index = items.length - 1;
                // scroll to very bottom if at end of list (to keep a11y support)
                this.view.$el.scrollTop(0xFFFFFF);
            }
            return index;
        },

        onClick: function (e) {
            var previous = this.get(),
                currentTarget = $(e.currentTarget),
                mousedownSelect = (e.type === 'mousedown' && !this.isMultiple(e) && !currentTarget.is('.selected'));

            prototype.onClick.call(this, e, { customEvents: mousedownSelect });
            if (mousedownSelect) {
                this.selectEvents();
            }
            //trigger events (if only checkbox is changed the events are not triggered by normal function)
            if (_.isEqual(previous, this.get()) && e.type === 'mousedown' && this.isMultiple(e)) this.triggerChange(this.getItems(), currentTarget.attr('data-cid'));
        },

        // normal select now triggers selection:action instead of the usual events (item will be shown in detail view and checkbox is not checked)
        selectEvents: function (items) {
            items = items || this.getItems();
            var layout = (this.view.app && this.view.app.props.get('layout')) || 'list';
            //in list layout we need the old events or mails open when they are not supposed to (for example when moving with arrow keys)
            if (layout === 'list') {
                this.triggerChange(items);
            } else {
                var list = this.get(),
                    events = 'selection:change selection:action';

                // to keep correct select all checkbox state
                // if the folder only contains one item, we must check the checkbox status
                if (items && items.length > 0 && items.length === list.length && (items.length !== 1 || !$(items[0]).hasClass('no-checkbox'))) {
                    events += ' selection:all';
                } else {
                    events += ' selection:subset';
                }

                if (list.length > 1) {
                    events += ' selection:multiple';
                }

                this.view.trigger(events, list);
            }
        }
    };

    var simpleBehavior = {

        registerEvents: function () {

            this.view.$el.addClass('focus-indicator');

            this.view.$el
                .on('click', SELECTABLE, $.proxy(this.onClick, this))
                .on('keydown', SELECTABLE, $.proxy(this.onKeydown, this))
                .on('focus', $.proxy(this.onFocus, this))
                .on('mousedown', $.proxy(this.onMousedown, this))
                .on('mouseup', $.proxy(this.onMouseup, this));

            this.view.on('selection:empty', $.proxy(this.onSelectionEmpty, this));
        },

        isMultiple: function () {
            // allow select/deselect via space
            return true;
        },

        isRange: function () {
            return false;
        },

        onSelectionEmpty: function () {
            if (this.getItems().parent().find('li:focus').length > 0) return;
            this._lastposition = -1;
        },

        onFocus: function () {
            // prevent focus on scrollbar mouse clicks: see bug 57293
            if (this.view.mousedown) return;

            var items = this.getItems(),
                first = items.filter('[tabindex="0"]:first'),
                index = items.index(first);

            this.focus(index > -1 ? index : 0, items);
        },

        onClick: function (e) {
            var items = this.getItems(),
                currentTarget = $(e.currentTarget),
                index = items.index(currentTarget);

            this.resetTabIndex(items, items.eq(index));
            this.pick(index, items, e);
            this.triggerChange(items, currentTarget.attr('data-cid'));
            this.setPosition(e);
        },

        onKeydown: function (e) {
            switch (e.which) {

                // enter or space
                case 13:
                case 32:
                    this.onSpace(e);
                    break;

                // cursor up/down
                case 38:
                case 40:
                    this.onCursor(e);
                    break;

                // [Ctrl|Cmd + A] > select all
                case 65:
                case 97:
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.selectAll();
                    }
                    break;

                // [Ctrl|Cmd + D] > Deselect all
                case 68:
                case 100:
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.selectNone();
                        this.focus(0);
                    }
                    break;

                // no default
            }
        },

        onSpace: function (e) {
            // actually same as a click
            this.onClick(e);
            e.preventDefault();
        },

        setPosition: function (e, index) {
            this._lastposition = _.isUndefined(index) ? this.getItems().index($(e.target).closest('li')) || 0 : index;
        },

        getPosition: function (items, index) {
            return this._lastposition > -1 ? this._lastposition : index;
        },

        onCursor: function (e) {
            // get current index
            var items = this.getItems(),
                current = $(document.activeElement),
                index = (items.index(current) || 0),
                cursorDown = e.which === 40;

            // prevent default to avoid unwanted scrolling
            e.preventDefault();
            if (!/^(40|38)$/.test(e.which)) return;

            index += cursorDown ? +1 : -1;
            index = this.outOfBounds(index, items);

            if (this.isRange(e)) {
                // range select includes previous node
                this.setPosition(e);
                return this.pickRange(index, items);
            }

            // simple select includes only current node
            this.triggerChange(items, current.attr('data-cid'));
            this.setPosition(e, index);
            this.focus(index, items);
        }
    };

    var singleBehavior = {

        isMultiple: function () {
            return false;
        },

        onClick: function (e) {
            var currentTarget = $(e.currentTarget);
            this.set([currentTarget.attr('data-cid')]);
        }
    };

    _.extend(Selection.prototype, prototype);

    return Selection;
});
