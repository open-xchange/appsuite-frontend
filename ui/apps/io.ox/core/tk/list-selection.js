/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/list-selection', ['settings!io.ox/core'], function (settings) {

    'use strict';

    var SELECTABLE = '.selectable',
        SWIPEDELETE = '.swipe-button.delete',
        SWIPEMORE = '.swipe-button.more',
        isTouch = _.device('touch'),
        behavior = settings.get('selectionMode', 'normal'),
        // mobile stuff
        THRESHOLD_X = 5, // touchmove threshold for mobiles in PX
        THRESHOLD_STICK = 40, // threshold in percent
        THRESHOLD_REMOVE = 75, //percentage
        hasRaf = !!window.requestAnimationFrame,
        // animation support
        amplitude = 0,
        timeConstant = 125,
        timestamp,
        movetarget,
        cell,
        velocity = 0,
        sX,
        cX;

    // animate function using requestAnimationFrame to be smooth
    var animate = function (cb) {
        function frame () {
            // do animation, aka. move the cell to the left
            var elapsed, delta, c;
            elapsed = Date.now() - timestamp; // simple tweak
            delta = amplitude * Math.exp(-elapsed / timeConstant);
            if (delta > 0.5 || delta < -0.5) {
                // delta decreases over time, this is the deceleration
                if (delta < 35 || delta > -35) {
                    delta = delta * -1; // bounce
                }
                c = (-movetarget + delta);
                cell.css('-webkit-transform', 'translate3d(' + c + 'px, 0, 0)');
                window.requestAnimationFrame(frame); // to understand recursion you must understand recursion
            } else {
                cell.css('-webkit-transform', 'translate3d(' + -movetarget + 'px, 0, 0)');
                cb();
            }
        }
        window.requestAnimationFrame(frame);
    };

    // animation is called after a cell was swiped outside the viewport, aka. delted
    function animateUp(cellsBelow, cb) {

        var height = 0, decrease = 10;

        function frame() {
            if (height >= 63) {
                cellsBelow.css('-webkit-transform', 'translate3d(0, -63px,0)');
                cb();
            } else {
                /*
                important note
                The browser can only animate a few properties really cheap, these are;
                    transform: translate
                    transform: scale
                    transform: rotate
                    opacity
                All other properties will cause multiple reflows and recalcuations which will drop
                the animation performance even if we use requestAnimationFrame
                After testing a lot the conclusion is: It's faster to translate ALL cells below the current cell up (Y-axis)
                than just animating the height of the current cell down from 63px to 0px to get the desired effect.
                */

                height += decrease;
                cellsBelow.css('-webkit-transform', 'translate3d(0,-' + height + 'px,0)');
                window.requestAnimationFrame(frame);
            }
        }
        // request our first frame
        window.requestAnimationFrame(frame);
    }

    // track speed during touchmove and (re-)calculate the current velocity
    // based on the distance the cell is moved between two concurrent tracking calls
    var track = function () {
        var now, elapsed, delta;
        now = Date.now();
        elapsed = now - timestamp; // time ellapsed since last track
        timestamp = now;
        delta = sX - cX; // distance dragged
        velocity = 1000 * delta / (1 + elapsed); // real velocity
        //velocity = 0.8 * v + 0.2 * velocity; // moving-average-filtered velocity to erase large variations in velocity
    };

    function Selection(view) {

        this.view = view;
        this.behavior = behavior;
        this.view.$el
            // normal click/keybard navigation
            .on('keydown', SELECTABLE, $.proxy(this.onKeydown, this))
            .on(isTouch ? 'tap' : 'mousedown click', SELECTABLE, $.proxy(this.onClick, this))
            // help accessing the list via keyboard if focus is outside
            .on('focus', $.proxy(function () {
                var items = this.getItems(),
                    first = items.filter('[tabindex="1"]'),
                    index = items.index(first),
                    selectedItems = this.get();
                if (selectedItems.length <= 1) {
                    if (index > -1) this.select(index); else this.select(0);
                } else {
                    this.focus(index, items);
                }
            }, this))
            .on(isTouch ? 'tap' : 'click', SELECTABLE, $.proxy(function (e) {
                if (!this.isMultiple(e)) this.triggerAction(e);
            }, this))
            // double click
            .on('dblclick', SELECTABLE, $.proxy(function (e) {
                this.triggerDouble(e);
            }, this))
            // avoid context menu
            .on('contextmenu', function (e) { e.preventDefault(); });

        if (isTouch && hasRaf) {
            this.view.$el
                .on('touchstart', SELECTABLE, this, this.onTouchStart)
                .on('touchmove', SELECTABLE, this, this.onTouchMove)
                .on('touchend', SELECTABLE, this, this.onTouchEnd)
                .on('tap', SWIPEDELETE,  $.proxy(function (e) {
                    this.onSwipeDelete(e);
                }, this))
                .on('tap', SWIPEMORE,  $.proxy(function (e) {
                    this.onSwipeMore(e);
                }, this));
        } else if (isTouch && !hasRaf) {
            this.view.$el
                .on('swipeleft', SELECTABLE, $.proxy(this.onSwipeLeft, this))
                .on('swiperight', SELECTABLE, $.proxy(this.onSwipeRight, this))
                .on('tap', '.swipe-left-content', $.proxy(this.onTapRemove, this));
        }
    }

    var prototype = {

        // returns array of composite keys (strings)
        get: function () {
            // don't return jQuery's result directly, because it doesn't return a "normal" array (tests might fail)
            return _(this.view.$el.find(SELECTABLE + '.selected')).map(function (node) {
                return $(node).attr('data-cid');
            });
        },

        getItems: function () {
            return this.view.$el.find(SELECTABLE);
        },

        getNode: function (cid) {
            this.getItems().filter('[data-cid="' + cid + '"]');
        },

        getPosition: function (items) {
            items = items || this.getItems();
            return items.index(items.filter('.precursor'));
        },

        check: function (nodes) {
            nodes.addClass('selected').attr('aria-selected', true);
        },

        uncheck: function (nodes) {
            nodes.removeClass('selected no-checkbox').attr({ 'aria-selected': false, tabindex: '-1' });
        },

        toggle: function (node) {
            if (node.hasClass('selected')) this.uncheck(node); else this.check(node);
        },

        set: function (list) {

            if (!_.isArray(list)) return;

            var items = this.getItems(), hash = {}, self = this, lastIndex = -1;

            this.clear();

            // convert array to hash, then loop over all DOM nodes once (faster)
            _(list).each(function (item) {
                var cid = typeof item === 'string' ? item : _.cid(item);
                hash[cid] = true;
            });

            items.each(function (index) {
                var node = $(this), cid = node.attr('data-cid');
                if (cid in hash) {
                    self.check(node);
                    lastIndex = index;
                }
            });

            if (lastIndex > -1) {
                items.eq(lastIndex).attr('tabindex', '1');
            }
        },

        triggerAction: function (e) {
            var cid = $(e.currentTarget).attr('data-cid');
            this.view.trigger('selection:action', [cid]);
        },

        triggerDouble: function (e) {
            var cid = $(e.currentTarget).attr('data-cid');
            this.view.trigger('selection:doubleclick', [cid]);
        },

        triggerChange: function (items) {
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
            // all vs subset
            if (items.length > 0 && items.length === list.length) {
                events += ' selection:all';
            } else {
                events += ' selection:subset';
            }
            this.view.trigger(events, list);
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
            return e && $(e.target).is('.list-item-checkmark, .fa.fa-checkmark');
        },

        isMultiple: function (e) {
            return e && (e.metaKey || e.ctrlKey || this.isCheckmark(e));
        },

        resetTabIndex: function (items, skip) {
            items = items.filter('[tabindex="1"]');
            items.not(skip).attr('tabindex', '-1');
        },

        resetCheckmark: function (items) {
            items.filter('.selected').removeClass('selected no-checkbox');
            // collect garbage: remove preserved items when selection changes
            _.defer(function () {
                items.filter('.preserved').not('.selected').fadeOut('fast', function () { $(this).remove(); });
            });
        },

        // resets all (usually one) items with swipe-left class
        // return true if an item had to be reset
        resetSwipe: function (items) {
            var nodes = items.filter('.swipe-left');
            nodes.removeClass('swipe-left').find('.swipe-left-content').remove();
            return !!nodes.length;
        },

        focus: function (index, items) {
            items = items || this.getItems();
            var node = items.eq(index).attr('tabindex', '1').focus();
            // workaround for chrome's CSS bug:
            // styles of "selected" class are not applied if focus triggers scrolling.
            // idea taken from http://forrst.com/posts/jQuery_redraw-BGv
            if (_.device('chrome')) node.hide(0, function () { $(this).show(); });
            return node;
        },

        pick: function (index, items, e) {

            var node;

            items = items || this.getItems();

            if (this.isRange(e)) {
                //range select
                this.pickRange(index, items);
            } else {
                // single select
                items.removeClass('precursor');
                node = this.focus(index, items).addClass('precursor');
                if (this.isMultiple(e)) this.pickMultiple(node, items); else this.pickSingle(node);
            }
        },

        pickRange: function (index, items) {
            var cursor = this.getPosition(items),
                start = Math.min(index, cursor),
                end = Math.max(index, cursor);
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
        select: function (index, items) {
            items = items || this.getItems();
            if (index >= items.length) return;
            this.resetCheckmark(items);
            this.resetTabIndex(items, items.eq(index));
            this.pick(index, items);
            this.selectEvents(items);
        },

        //events triggered by selection function
        selectEvents: function (items) {
            this.triggerChange(items);
        },

        selectAll: function (items) {
            items = items || this.getItems();
            var slice = items.slice(0, items.length);
            slice.removeClass('no-checkbox');
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
            this.view.trigger('selection:action', this.get());
        },

        previous: function () {
            this.move(-1);
        },

        next: function () {
            this.move(1);
        },

        // to anticipate a removal of multiple items
        dodge: function () {

            var items = this.getItems(),
                selected = items.filter('.selected'),
                length = selected.length,
                first = items.index(selected.first()),
                apply = this.select.bind(this);

            // All: if all items are selected we dodge by clearing the entire selection
            if (items.length === length) return this.clear();

            // Tail: if there's no room inbetween or after the selection we move up
            if ((first + length) === items.length) return apply(first - 1, items);

            // iterate over list
            items.slice(first).each(function (index) {
                if (!$(this).hasClass('selected')) {
                    apply(first + index, items);
                    return false;
                }
            });
        },

        onCursorUpDown: function (e) {

            var items = this.getItems(),
                current = $(document.activeElement),
                index = (items.index(current) || 0) + (e.which === 38 ? -1 : +1);

            if (index < 0) return;
            // scroll to very bottom if at end of list (to keep a11y support)
            if (index >= items.length) return this.view.$el.scrollTop(0xFFFFFF);

            // prevent default to avoid unwanted scrolling
            e.preventDefault();

            // jump to top/bottom OR range select / single select
            index = this.isMultiple(e) ? (e.which === 38 ? 0 : -1) : index;

            this.resetTabIndex(items, items.eq(index));
            this.resetCheckmark(items);
            this.pick(index, items, e);
            //alternative selection mode needs this, has no effect in default mode
            if ( this.isMultiple(e) || this.isRange(e)) {
                this.triggerChange(items);
            } else {
                this.selectEvents(items);
            }
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
            case 13:
                this.triggerAction(e);
                break;

            // [Ctrl|Cmd + A] > select all
            case 65:
            case 97:
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.selectAll();
                }
                break;

            // [Del], [Backspace] or [fn+Backspace] (MacOS) > delete item
            case 8:
            case 46:
                e.preventDefault();
                this.view.trigger('selection:delete', this.get());
                break;

            // cursor up/down
            case 38:
            case 40:
                this.onCursorUpDown(e);
                break;

            // page up/down
            case 33:
            case 34:
                this.onPageUpDown(e);
                break;
            }
        },

        onClick: function (e) {
            if (e.type === 'tap') {
                // prevent ghostclicks
                e.preventDefault();
                e.stopPropagation();
            }
            // consider mousedown only if unselected and not in multiple-mode
            if (e.type === 'mousedown' && !this.isMultiple(e) && $(e.currentTarget).is('.selected')) return;
            // ignore clicks in multiple-mode
            if (e.type === 'click' && this.isMultiple(e) && !isTouch) return;

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
            //always trigger in multiple mode (sometimes only checkbox is changed)
            if (!_.isEqual(previous, this.get())) this.triggerChange(items);
        },

        onSwipeDelete: function (e) {
            e.preventDefault();
            var node = $(this.currentSelection).closest(SELECTABLE),
                cid = node.attr('data-cid'),
                cellsBelow = node.nextAll(),
                self = this;
            // animate cell and delete mail afterwards
            animateUp(cellsBelow, function () {
                self.view.trigger('selection:delete', [cid]);
                node.closest('.swipe-option-cell').remove();
                cellsBelow.removeAttr('style');
            });
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
                self.resetSwipeCell.call(self.currentSelection);
            }, 250);
        },

        resetSwipeCell: function (a) {
            try {
                this.startX = 0;
                this.startY = 0;
                this.unfold = false;
                this.target = null;

                this.t0 = 0;
                this.otherUnfolded = false;
                movetarget = 0;
                velocity = 1;
                amplitude = a || 200;
                timestamp = Date.now();
                // do animation
                animate(function () {
                    $(self).removeAttr('style');
                    $(self).removeClass('unfolded');
                    self.swipeCell.remove();
                    self.swipeCell = null;
                });

            } catch (e) {
                console.warn('something went wrong during reset', e);
            }
        },

        onTouchStart: function (e) {
            var touches = e.originalEvent.touches[0],
                currentX = touches.pageX, currentY = touches.pageY,
                t = $(this).css('transition','');

            // var unfold indicates if any node is unfolded
            // var unfolded indicates if currently touched node is unfolded
            this.startX = sX = currentX;
            this.startY = currentY;
            this.distanceX = 0;
            this.unfold = this.remove = this.scrolling = false;
            this.t0 = new Date().getTime();
            this.cellWidth = t.outerWidth(); // for later use

            // check if this node is already opened
            this.unfolded = t.hasClass('unfolded'); // mark current node as unfolded once
            this.otherUnfolded = t.siblings().hasClass('unfolded'); // is there another node unfolded

            // check if other nodes than the current one are unfolded
            // if so, close other nodes and stop event propagation
            if (!this.unfolded && this.otherUnfolded) {
                e.data.resetSwipeCell.call(e.data.currentSelection);
            }

            // reset values for momentum calculation
            velocity = amplitude = 0;
            timestamp = Date.now();
            track(); // calculate momentum
        },

        onTouchMove: function (e) {

            var touches = e.originalEvent.touches[0],
                currentX = touches.pageX,
                width = 100 / this.cellWidth;

            cX = currentX;

            this.distanceX = (this.startX - currentX) * -1; // invert value

            if (currentX > this.startX && !this.unfolded) return; // left to right is not allowed

            if (e.data.isScrolling) {
                this.scrolling = true;
                return; // return early on a simple scroll
            }

            // special handling for already unfolded cell
            if (this.unfolded) {
                this.distanceX += -190; // add already moved pixels
            }

            if (Math.abs(this.distanceX) > THRESHOLD_X) {
                e.preventDefault(); // prevent further scrolling

                if (!this.target) {
                    // do expensive jquery select only once
                    this.target = $(e.currentTarget);
                }
                if (!this.swipeCell) {
                    // append swipe action cell once, will be removed afterwards
                    this.swipeCell = $('<div class="swipe-option-cell">').append(
                        this.btnDelete = $('<div class="swipe-button delete">').append($('<i class="fa fa-trash">')),
                        this.btnMore = $('<div class="swipe-button more">').append($('<i class="fa fa-bars">'))
                    ).css('height', this.target.outerHeight() + 'px');
                    this.target.before(this.swipeCell);
                }
                // translate the moved cell
                if (this.distanceX < 0) this.target.css('-webkit-transform', 'translate3d(' + this.distanceX + 'px, 0, 0)');

                // if delete threshold is reached, enlarge delete button over whole cell
                if (Math.abs(width * this.distanceX) >= THRESHOLD_REMOVE) {
                    this.expandDelete = true;
                    this.btnMore.hide();
                    this.btnDelete.css('transition', 'width 100ms');
                    this.btnDelete.css('width', '100%');
                } else if (this.expandDelete) {
                    // remove style
                    this.btnMore.removeAttr('style');
                    this.btnDelete.removeAttr('style');
                    this.expandDelete = false;
                }
            }
        },

        onTouchEnd: function (e) {
            if (this.scrolling) return; // return if simple list scroll
            var distanceX = this.distanceX,
                width = 100 / this.cellWidth,
                distanceXAbs = Math.abs(width * distanceX);

            this.remove = this.unfold = false;

            if ((distanceX > 0) && !this.unfolded) return; // left to right is not allowed

            // check for tap on unfolded cell
            if (this.unfolded && this.distanceX <= 10) {
                e.data.resetSwipeCell.call(e.data.currentSelection);
                return false; // don't do a select after this
            }

            if (this.otherUnfolded && Math.abs(this.distanceX) <= 10) {
                // other cell is opened, handle this as cancel action
                return false;
            }

            if (distanceXAbs >= THRESHOLD_STICK) {
                // unfold automatically and stay at a position
                this.unfold = true;
            }

            if (this.expandDelete) {
                // remove cell after this threshold
                this.remove = true;
                this.unfold = false;
            }

            cell = $(this); // save for later animation
            track(); // caluclate velocity and amplitude
            timestamp = Date.now(); // reset timestamp

            // only do this if velocity is higher than 25. Values might be changed
            if ((velocity > 25 || velocity < -25) && !this.expandDelete) {
                if (velocity > 800) velocity = 800; // ceil velocity
                amplitude = 0.1 * velocity; // modify threshold, add a virtual "weight"
                movetarget = Math.round(-distanceX + amplitude); // calculate endposition of movement
                if (movetarget >= 190) {
                    movetarget = 190; // ceil endposition
                    animate();
                    $(this).addClass('unfolded');
                    this.unfold = true;
                } else if (movetarget <= 190 && movetarget >= 30) {
                    movetarget = 190;
                    velocity = 1;
                    amplitude = 500;
                    $(this).addClass('unfolded');
                    this.unfold = true;
                    animate();
                }
            }

            if (this.unfold) {

                this.btnMore.removeAttr('style');
                this.btnDelete.removeAttr('style');
                this.expandDelete = false;

                $(this).addClass('unfolded');

                e.data.unfold = true;
                e.data.currentSelection = this; // save this for later use
            } else if (this.remove) {
                // remove
                $(this).css('transition', '-webkit-transform 100ms');
                $(this).css('-webkit-transform', 'translate3d(-100%, 0, 0)');
                this.btnMore.remove();
                var self = this;
                // delay start with 100ms to wait for other transition to finish
                setTimeout(function () {
                    // reset touchcoords
                    self.startX = 0;
                    self.startY = 0;
                    var cellsBelow = $(self).nextAll();

                    animateUp(cellsBelow, function () {
                        var node = $(self).closest(SELECTABLE),
                            cid = node.attr('data-cid');
                        // propagate event
                        e.data.view.trigger('selection:delete', [cid]);
                        self.swipeCell.remove();
                        self.swipeCell = null;
                        cellsBelow.removeAttr('style');
                        $(self).removeAttr('style');
                        $(self).removeClass('unfolded');
                        self.unfolded = false;
                    });
                }, 110);
            } else if (distanceX) {
                e.data.resetSwipeCell.call(this, Math.abs(distanceX));
                return false;
            }
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

        inplaceRemoveScaffold: $('<div class="swipe-left-content"><i class="fa fa-trash-o"/></div>'),

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

        },
        getBehavior: function () {
            return this.behavior;
        }
    };

    var alternativeBehavior = {

        pickSingle: function (node) {
            node.addClass('selected no-checkbox').attr('aria-selected', true);
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

        onClick: function (e) {
            var previous = this.get();
            prototype.onClick.call(this, e);
            //trigger events (if only checkbox is changed the events are not triggered by normal function)
            if (_.isEqual(previous, this.get()) && e.type === 'mousedown' && this.isMultiple(e)) this.triggerChange(this.getItems());
        },

        // normal select now triggers selection:action instead of the usual events (item will be shown in detail view and checkbox is not checked)
        selectEvents: function (items) {
            var layout = this.view.app.props.get('layout') || 'list';
            //in list layout we need the old events or mails open when they are not supposed to (for example when moving with arrow keys)
            if (layout === 'list') {
                this.triggerChange(items);
            } else {
                this.view.trigger('selection:change selection:action', this.get());
            }
        }
    };

    _.extend(Selection.prototype, prototype);

    if (behavior === 'alternative') {
        _.extend(Selection.prototype, alternativeBehavior);
    }

    return Selection;
});
