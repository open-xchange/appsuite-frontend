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
            selectPrevious,
            selectNext,
            fnKey,
            hasMultiple;

        isMultiple = function (e) {
            return editable || (multiple && (e && e.metaKey));
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
            }
            // event
            changed();
        };

        selectPrevious = function (e) {
            var index;
            if (bHasIndex) {
                index = (getIndex(last) || 0) - 1;
                if (index >= 0) {
                    clear();
                    apply(observedItems[index], e);
                }
            }
        };

        selectNext = function (e) {
            var index;
            if (bHasIndex) {
                index = (getIndex(last) || 0) + 1;
                if (index < observedItems.length) {
                    clear();
                    apply(observedItems[index], e);
                }
            }
        };

        // key handler
        fnKey = function (e) {
            switch (e.which) {
            case 38:
                // cursor up
                selectPrevious(e);
                return false;
            case 40:
                // cursor down
                selectNext(e);
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
            return bHasIndex ? observedItemsIndex[self.serialize(id)] : 0;
        };

        getNode = function (id) {
            return container.find('.selectable[data-obj-id="' + self.serialize(id) + '"]');
        };

        isSelected = function (id) {
            return selectedItems[self.serialize(id)] !== undefined;
        };

        select = function (id) {
            var key = self.serialize(id);
            selectedItems[key] = id;
            getNode(key)
                .addClass(self.classSelected)
                .find('input.reflect-selection').attr('checked', 'checked').end()
                .intoViewport(container);
            last = id;
            if (prev === empty) {
                prev = id;
            }
        };

        deselect = function (id) {
            var key = self.serialize(id);
            delete selectedItems[key];
            getNode(key)
                .find('input.reflect-selection').removeAttr('checked').end()
                .removeClass(self.classSelected);
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
            return typeof obj === 'object' ? (obj.folder_id !== undefined) ? obj.folder_id + '.' + obj.id : obj.id : obj;
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
            observedItems = all;
            observedItemsIndex = {};
            last = prev = empty;
            // build index
            var i = 0, $i = all.length, key;
            for (; i < $i; i++) {
                observedItemsIndex[self.serialize(all[i])] = i;
            }
            // restore selection. check if each item exists
            for (i = 0, $i = tmp.length; i < $i; i++) {
                key = self.serialize(tmp[i]);
                if (observedItemsIndex[key] !== undefined) {
                    select(tmp[i]);
                }
            }
            // fire event?
            if (!_.isEqual(tmp, self.get())) {
                changed();
            }
            return this;
        };

        /**
         * Update
         */
        this.update = function () {
            // get nodes
            var nodes = container.find('.selectable'),
                i = 0, $i = nodes.length, node = null;
            for (; i < $i; i++) {
                node = $(nodes[i]);
                // is selected?
                if (isSelected(node.attr('data-obj-id'))) {
                    node
                        .find('input.reflect-selection').attr('checked', 'checked').end()
                        .addClass(self.classSelected);
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
        this.setEditable = function (flag) {
            editable = !!flag;
            last = prev = empty;
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
            // event
            if (quiet !== true) {
                changed();
            }
            return this;
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
            if (bHasIndex && observedItems.length) {
                clear();
                select(observedItems[0]);
                changed();
            }
            return this;
        };

        this.selectSmart = function () {
            if (this.get().length === 0) {
                this.selectFirst();
            }
            return this;
        };

        this.selectNext = selectNext;

        /**
         * Is selected?
         */
        this.isSelected = function (id) {
            return isSelected(id);
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
        this.retrigger = function () {
            changed();
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
