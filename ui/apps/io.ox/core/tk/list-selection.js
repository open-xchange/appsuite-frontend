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

define('io.ox/core/tk/list-selection', [], function () {

    'use strict';

    var SELECTABLE = '.selectable', isTouch = _.device('touch');

    function Selection(view) {

        this.view = view;

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
            // double clikc
            .on('dblclick', SELECTABLE, $.proxy(function (e) {
                this.triggerDouble(e);
            }, this))
            // avoid context menu
            .on('contextmenu', function (e) { e.preventDefault(); });

        if (isTouch) {
            this.view.$el
                .on('swipeleft', SELECTABLE, $.proxy(this.onSwipeLeft, this))
                .on('swiperight', SELECTABLE, $.proxy(this.onSwipeRight, this))
                .on('tap', '.swipe-left-content', $.proxy(this.onTapRemove, this));
        }
    }

    _.extend(Selection.prototype, {

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
            nodes.removeClass('selected').attr({ 'aria-selected': false, tabindex: '-1' });
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
            items.filter('.selected').removeClass('selected');
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

            var start, end, node, cursor;

            items = items || this.getItems();
            cursor = this.getPosition(items);

            if (this.isRange(e)) {
                // range select
                var start = Math.min(index, cursor),
                    end = Math.max(index, cursor);
                this.check(items.slice(start, end + 1));
                this.focus(index, items);
            } else {
                // single select
                items.removeClass('precursor');
                node = this.focus(index, items).addClass('precursor');
                if (this.isMultiple(e)) this.toggle(node); else this.check(node);
            }
        },

        // just select one item (no range; no multiple)
        select: function (index, items) {
            items = items || this.getItems();
            if (index >= items.length) return;
            this.resetCheckmark(items);
            this.resetTabIndex(items, items.eq(index));
            this.pick(index, items);
            this.triggerChange(items);
        },

        selectAll: function () {
            var items = this.getItems();
            this.check(items.slice(0, items.length));
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
            this.triggerChange(items);
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
                // prevent ghostlicks
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
            if (!_.isEqual(previous, this.get())) this.triggerChange(items);
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
            e.stopImmediatePropagation(); // prevent a new select happening on the deleted cell
            var node = $(e.currentTarget).closest(SELECTABLE),
                cid = node.attr('data-cid');
            // propagate event
            this.view.trigger('selection:delete', [cid]);
        },

        onFocus: function () {

        }
    });

    return Selection;
});
