/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2009 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @ignore
 */

define("io.ox/core/tk/selection", ["io.ox/core/event"], function (event) {
    
    "use strict";
    
    var Selection = function (container) {

        this.classFocus = "focussed";
        this.classSelected = "selected";

        // add dispatcher
        event.Dispatcher.extend(this);

        var self = this,
            multiple = true,
            selectedItems = {},
            observedItems = [],
            observedItemsIndex = {},
            last = {},
            prev = {},
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
            fnKey;
        
        isMultiple = function (e) {
            return multiple && (e && e.metaKey);
        };
        
        isRange = function (e) {
            return e && e.shiftKey;
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
            self.trigger("change", self.get());
        };
        
        selectPrevious = function (e) {
            var index = (getIndex(last) || 0) - 1;
            if (index >= 0) {
                clear();
                apply(observedItems[index], e);
            }
        };
        
        selectNext = function (e) {
            var index = (getIndex(last) || 0) + 1;
            if (index < observedItems.length) {
                clear();
                apply(observedItems[index], e);
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
            var node = $(this),
                key = node.attr("data-ox-id"),
                id = observedItems[getIndex(key)];
            // exists?
            if (id !== undefined) {
                // clear?
                if (!isMultiple(e)) {
                    if (self.serialize(id) !== self.serialize(last)) {
                        clear();
                        apply(id, e);
                    }
                } else {
                    // apply
                    apply(id, e);
                }
            }
        };
        
        getIndex = function (id) {
            return observedItemsIndex[self.serialize(id)];
        };
        
        getNode = function (id) {
            return container.find(".selectable[data-ox-id='" + self.serialize(id) + "']");
        };
        
        isSelected = function (id) {
            return selectedItems[self.serialize(id)] !== undefined;
        };
        
        select = function (id) {
            var key = self.serialize(id);
            selectedItems[key] = id;
            getNode(key).addClass(self.classSelected).intoViewport(container);
            last = id;
        };
        
        deselect = function (id) {
            var key = self.serialize(id);
            delete selectedItems[key];
            getNode(key).removeClass(self.classSelected);
        };
        
        toggle = function (id) {
            if (isSelected(id)) {
                deselect(id);
            } else {
                select(id);
            }
        };
        
        clear = function () {
            var id = "";
            for (id in selectedItems) {
                deselect(id);
            }
        };
        
        /**
         * Serialize object to get a flat key
         */
        this.serialize = function (obj) {
            return typeof obj === "object" ? obj.folder_id + "." + obj.id : obj;
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
            // event
            self.trigger("change", self.get());
            return this;
        };
        
        /**
         * Update
         */
        this.update = function () {
            // get nodes
            var nodes = container.find(".selectable"),
                i = 0, $i = nodes.length, node = null;
            for (; i < $i; i++) {
                node = $(nodes[i]);
                // is selected?
                if (isSelected(node.attr("data-ox-id"))) {
                    node.addClass(self.classSelected);
                }
            }
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
         * Get selection
         */
        this.get = function () {
            var list = [], id = "";
            for (id in selectedItems) {
                list.push(selectedItems[id]);
            }
            return list;
        };

        /**
         * Clear selection
         */
        this.clear = function (quiet) {
            // internal clear
            clear();
            // trigger event
            if (quiet !== true) {
                this.trigger("change", []);
            }
            return this;
        };

        /**
         * Select item
         */
        this.select = function (id) {
            select(id);
            this.trigger("change", this.get());
            return this;
        };
        
        /**
         * Set selection
         */
        this.set = function (list) {
            // clear
            clear();
            // get array
            list = _.isArray(list) ? list : [list];
            // loop
            var i = 0, $i = list.length;
            for (; i < $i; i++) {
                select(list[i]);
            }
            // event
            this.trigger("change", list);
            return this;
        };
        
        this.selectRange = function (a, b) {
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
            this.trigger("change", this.get());
            return this;
        };
        
        this.selectFirst = function () {
            if (observedItems.length) {
                clear();
                select(observedItems[0]);
                this.trigger("change", this.get());
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
            $(document)[flag ? "on" : "off"]("keydown", fnKey);
            return this;
        };
        
        // bind general click handler
        container.on("click", ".selectable", click);
    };

    Selection.extend = function (obj, node) {
        // extend object
        obj.selection = new Selection(node);
    };
    
    return Selection;

});