/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2012 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/selection', ['io.ox/core/event'], function (Events) {

    'use strict';

    var Selection = function (container) {

        this.classFocus = 'focussed';
        this.classSelected = 'selected';

        // add event hub
        Events.extend(this);

        var self = this,
            multiple = true,
            editable = false,
            editableSelector = '.vgrid-cell',
            selectedItems = {},
            bHasIndex = true,
            observedItems = [],
            observedItemsIndex = {},
            empty = {},
            last = empty,
            prev = empty,
            changed,
            apply,
            click,
            clear,
            isSelected,
            select,
            deselect,
            toggle,
            isMultiple,
            isRange,
            getIndex,
            getNode,
            selectFirst,
            selectPrevious,
            selectLast,
            selectNext,
            lastIndex = -1, // trick for smooth updates
            lastValidIndex = 0,
            fnKey,
            hasMultiple;

        isMultiple = function (e) {
            var closest = $(e.target).closest(editableSelector),
                isEditable = editable && closest.length;
            return isEditable || (multiple && e && (e.metaKey || e.ctrlKey));
        };

        isRange = function (e) {
            return e && e.shiftKey && multiple;
        };

        hasMultiple = function () {
            var mult = 0, id;
            for (id in selectedItems) {
                mult++;
                if (mult > 1) {
                    return true;
                }
            }
            return false;
        };

        changed = function () {
            var list = self.get();
            self.trigger('change', list);
            if (list.length === 0) {
                self.trigger('empty');
            }
        };

        // apply selection
        apply = function (id, e) {
            // range?
            if (isRange(e)) {
                // range selection
                self.selectRange(prev, id);
                // remember
                last = id;
            } else {
                // single selection
                toggle(id);
                // remember
                last = prev = id;
                lastValidIndex = getIndex(id);
            }
            // event
            changed();
        };

        selectFirst = function (e) {
            if (bHasIndex && observedItems.length) {
                var obj = observedItems[0];
                clear();
                apply(obj, e);
                self.trigger('select:first', obj);
            }
        };

        selectPrevious = function (e) {
            if (bHasIndex) {
                var index = getIndex(last) - 1, obj;
                if (index >= 0) {
                    obj = observedItems[index];
                    clear();
                    apply(obj, e);
                    self.trigger('select:previous', obj);
                }
            }
        };

        selectLast = function (e) {
            if (bHasIndex && observedItems.length) {
                var index = observedItems.length - 1,
                    obj = observedItems[index];
                clear();
                apply(obj, e);
                self.trigger('select:last', obj);
            }
        };

        selectNext = function (e) {
            if (bHasIndex) {
                var index = getIndex(last) + 1, obj;
                if (index < observedItems.length) {
                    obj = observedItems[index];
                    clear();
                    apply(obj, e);
                    self.trigger('select:next', obj);
                }
            }
        };

        // key handler
        fnKey = function (e) {
            // also trigger keyboard event to internal hub
            self.trigger('keyboard', e, e.which);
            // process event
            switch (e.which) {
            case 38:
                // cursor up
                if (e.metaKey || e.ctrlKey) {
                    selectFirst(e);
                } else {
                    selectPrevious(e);
                }
                return false;
            case 40:
                // cursor down
                if (e.metaKey || e.crtlKey) {
                    selectLast(e);
                } else {
                    selectNext(e);
                }
                return false;
            }
        };

        // click handler
        click = function (e) {
            var key, id;
            if (!e.isDefaultPrevented()) {
                key = $(this).attr('data-obj-id');
                id = bHasIndex ? observedItems[getIndex(key)] : key;
                // exists?
                if (id !== undefined) {
                    // clear?
                    if (!isMultiple(e)) {
                        if (!isSelected(id) || hasMultiple() || self.serialize(id) !== self.serialize(last)) {
                            clear();
                            apply(id, e);
                        }
                    } else {
                        // apply
                        apply(id, e);
                    }
                }
            }
        };

        getIndex = function (id) {
            return bHasIndex ? observedItemsIndex[self.serialize(id)] : -1;
        };

        getNode = function (id) {
            return container.find('.selectable[data-obj-id="' + self.serialize(id) + '"]');
        };

        isSelected = function (id) {
            return selectedItems[self.serialize(id)] !== undefined;
        };

        select = function (id, quiet) {
            if (id) {
                var key = self.serialize(id);
                selectedItems[key] = id;
                getNode(key)
                    .addClass(self.classSelected)
                    .find('input.reflect-selection').attr('checked', 'checked').end()
                    .intoViewport(container);
                last = id;
                lastIndex = getIndex(id);
                if (prev === empty) {
                    prev = id;
                    lastValidIndex = lastIndex;
                }
                if (quiet !== true) {
                    self.trigger('select', key);
                }
            }
        };

        deselect = function (id) {
            var key = self.serialize(id);
            delete selectedItems[key];
            getNode(key)
                .find('input.reflect-selection').removeAttr('checked').end()
                .removeClass(self.classSelected);
            self.trigger('deselect', key);
        };

        toggle = function (id) {
            if (isSelected(id)) {
                deselect(id);
            } else {
                select(id);
            }
        };

        clear = function () {
            var id = '';
            for (id in selectedItems) {
                deselect(id);
            }
        };

        /**
         * Serialize object to get a flat key
         */
        this.serialize = function (obj) {
            return typeof obj === 'object' ? (obj.folder_id !== undefined) ? _.cid(obj) : obj.id : obj;
        };

        this.setSerializer = function (fn) {
            this.serialize = function (obj) {
                return typeof obj === 'object' ? fn(obj) : obj;
            };
        };

        /**
         * Initialize
         */
        this.init = function (all) {
            // store current selection
            var tmp = this.get();
            // clear list
            clear();
            observedItems = all.slice(); // shallow copy! otherwise conflict with insertAt
            observedItemsIndex = {};
            last = prev = empty;
            // build index
            var i = 0, $i = all.length, key, reselected = false, index = lastIndex;
            for (; i < $i; i++) {
                observedItemsIndex[self.serialize(all[i])] = i;
            }
            // restore selection. check if each item exists
            for (i = 0, $i = tmp.length; i < $i; i++) {
                key = self.serialize(tmp[i]);
                if (observedItemsIndex[key] !== undefined) {
                    select(tmp[i]);
                    reselected = true;
                }
            }
            // reset index but ignore 'empty runs'
            if (all.length > 0) {
                lastIndex = -1;
            }
            // fire event?
            if (!_.isEqual(tmp, self.get())) {
                changed();
            }
            return this;
        };

        this.insertAt = function (list, pos) {
            // vars
            var $l = list.length,
                // check for conflict, i.e. at least one item is already on the list
                conflict = _(list).reduce(function (memo, obj) {
                    return memo || (self.serialize(obj) in observedItemsIndex);
                }, false);
            // no conflict?
            if (!conflict) {
                // insert into list
                observedItems.splice.apply(observedItems, [pos, 0].concat(list));
                // shift upper index
                _(observedItemsIndex).each(function (value, key) {
                    if (value >= pos) {
                        observedItemsIndex[key] += $l;
                    }
                });
                // add to index
                _(list).each(function (obj, i) {
                    observedItemsIndex[self.serialize(obj)] = pos + i;
                });
            }
        };

        this.remove = function (list) {
            // loop over index and mark items to remove with null
            _(list).each(function (obj) {
                var cid = self.serialize(obj),
                    index = observedItemsIndex[cid];
                if (index !== undefined) {
                    observedItems.splice(index, 1, null);
                }
            });
            // compact; remove nulled items now
            observedItems = _(observedItems).compact();
            // reset index
            observedItemsIndex = {};
            _(observedItems).each(function (obj, i) {
                observedItemsIndex[self.serialize(obj)] = i;
            });
        };

        /**
         * Update
         */
        this.update = function () {
            // get nodes
            var nodes = container.find('.selectable'),
                i = 0, $i = nodes.length, node = null;
            for (; i < $i; i++) {
                node = nodes.eq(i);
                // is selected?
                if (isSelected(node.attr('data-obj-id'))) {
                    node.find('input.reflect-selection').attr('checked', 'checked').end()
                        .addClass(self.classSelected);
                } else {
                    node.find('input.reflect-selection').removeAttr('checked');
                }
            }
            return this;
        };

        this.clearIndex = function () {
            observedItems = [];
            observedItemsIndex = {};
            return this;
        };

        this.addToIndex = function (obj) {
            var key = this.serialize(obj);
            if (observedItemsIndex[key] === undefined) {
                observedItemsIndex[key] = observedItems.length;
                observedItems.push(obj);
            }
            return this;
        };

        this.hasIndex = function (flag) {
            bHasIndex = !!flag;
            return this;
        };

        /**
         * Set multiple mode
         */
        this.setMultiple = function (flag) {
            multiple = !!flag;
            return this;
        };

        /**
         * Set editable mode
         */
        this.setEditable = function (flag, selector) {
            editable = !!flag;
            editableSelector = selector || '.vgrid-cell';
            last = prev = empty;
            lastIndex = -1;
            return this;
        };

        /**
         * Get selection
         */
        this.get = function () {
            var list = [], id = '';
            for (id in selectedItems) {
                list.push(selectedItems[id]);
            }
            return list;
        };

        this.unique = function (list) {
            list = list || this.get();
            var hash = {};
            return _(list).filter(function (obj) {
                var key = _.isString(obj) ? obj : _.cid(obj);
                return key in hash ? false : (hash[key] = true);
            });
        };

        /**
         * Get complete selection. Useful for threaded mails, for example. Defaults to get().
         */
        this.unfold = this.get;

        /**
         * Clear selection
         */
        this.clear = function (quiet) {
            // internal clear
            clear();
            // trigger event
            if (quiet !== true) {
                self.trigger('clear');
                changed();
            }
            return this;
        };

        /**
         * Select item
         */
        this.select = function (id) {
            select(id);
            changed();
            return this;
        };

        /**
         * Set selection
         */
        this.set = function (list, quiet) {
            // clear
            clear();
            // loop
            _(_.isArray(list) ? list : [list]).each(function (elem) {
                var obj;
                if (typeof elem === 'string' && bHasIndex && (obj = observedItems[getIndex(elem)]) !== undefined) {
                    select(obj);
                } else {
                    select(elem);
                }
            });
            // reset last index
            lastIndex = -1;
            // event
            if (quiet !== true) {
                changed();
            }
            return this;
        };

        this.equals = function (list) {
            return _.isEqual(list, this.get());
        };

        this.selectRange = function (a, b) {
            if (bHasIndex) {
                // get indexes
                a = getIndex(a);
                b = getIndex(b);
                // swap?
                if (a > b) {
                    var tmp = a;
                    a = b;
                    b = tmp;
                }
                // loop
                for (; a <= b; a++) {
                    select(observedItems[a]);
                }
                // event
                changed();
            }
            return this;
        };

        this.selectFirst = function () {
            selectFirst();
            return this;
        };

        this.selectSmart = function () {
            if (this.get().length === 0) {
                this.selectFirst();
            }
            return this;
        };

        this.selectNext = selectNext;

        this.selectAll = function () {
            if (bHasIndex && observedItems.length) {
                _(observedItems).each(function (obj) {
                    select(obj, true);
                });
                changed();
            }
        };

        this.selectLastIndex = function () {
            var item = observedItems[lastValidIndex] || observedItems[0];
            if (item !== undefined) {
                this.select(item);
            }
        };

        /**
         * Is selected?
         */
        this.isSelected = function (id) {
            return isSelected(id);
        };

        this.getIndex = function (obj) {
            return getIndex(obj);
        };

        this.isEmpty = function () {
            for (var id in selectedItems) {
                return false;
            }
            return true;
        };

        this.contains = function (ids) {
            return _([].concat(ids)).inject(function (memo, id) {
                return memo && id in observedItemsIndex;
            }, true);
        };

        this.getLastIndex = function () {
            return lastValidIndex;
        };

        /**
         * Keyboard support
         */
        this.keyboard = function (flag) {
            // keyboard support (use keydown! IE does not react on keypress with cursor keys)
            $(document)[flag ? 'on' : 'off']('keydown', fnKey);
            return this;
        };

        /**
         * Retrigger current selection
         */
        this.retrigger = function (force) {
            if (force) {
                var tmp = this.get();
                this.clear();
                this.set(tmp);
            } else {
                changed();
            }
        };

        this.retriggerUnlessEmpty = function () {
            if (this.get().length) {
                changed();
            }
        };

        this.destroy = function () {
            this.clear();
            this.keyboard(false);
            this.events.destroy();
            container.off('click contextmenu');
            selectedItems = observedItems = observedItemsIndex = last = null;
        };

        // bind general click handler
        container.on('click contextmenu', '.selectable', click);
    };

    Selection.extend = function (obj, node) {
        // extend object
        return (obj.selection = new Selection(node));
    };

    return Selection;

});
