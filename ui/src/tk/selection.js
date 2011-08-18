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

(function () {
    
    ox.ui.tk.Selection = function () {

        this.classFocus = "focussed";
        this.classSelected = "selected";

        // add dispatcher
        ox.api.event.Dispatcher.extend(this);

        var self = this,
            multiple = true,
            container = $(),
            selectedItems = {},
            observedItems = [],
            observedItemsIndex = {},
            last = {},
            prev = {},
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
            fnKey;
        
        isMultiple = function (e) {
            return multiple && e.metaKey;
        };
        
        isRange = function (e) {
            return e.shiftKey;
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

        // key handler
        fnKey = function (e) {
            var index;
            switch (e.which) {
                case 38:
                    // cursor up
                    index = (getIndex(last) || 0) - 1;
                    if (index >= 0) {
                        clear();
                        apply(observedItems[index], e);
                    }
                    e.preventDefault();
                    break;
                case 40:
                    // cursor down
                    index = (getIndex(last) || 0) + 1;
                    if (index < observedItems.length) {
                        clear();
                        apply(observedItems[index], e);
                    }
                    e.preventDefault();
                    break;
            }
        };

        // click handler
        click = function (e) {
            // get node
            var node = $(this),
                // get key
                key = node.attr("data-ox-id"),
                // get id
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
            getNode(key).addClass(self.classSelected)
                .intoViewport(container);
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
        this.init = function (all, node) {
            // clear list
            container = node;
            observedItems = all;
            observedItemsIndex = {};
            // build index
            var i = 0, $i = all.length;
            for (; i < $i; i++) {
                observedItemsIndex[self.serialize(all[i])] = i;
            }
            // keyboard support (use keydown, IE does not react on keypress with cursor keys)
            $(document).unbind("keydown", fnKey).bind("keydown", fnKey);
        };
        
        /**
         * Update
         */
        this.update = function () {
            // get nodes
            var nodes = container.find(".selectable");
            // loop
            var i = 0, tmp = null, node = null;
            for (; tmp = nodes[i]; i++) {
                node = $(tmp);
                // bind click
                node.unbind("click").bind("click", click);
                // is selected?
                if (isSelected(node.attr("data-ox-id"))) {
                    node.addClass(self.classSelected);
                }
            }
        };

        /**
         * Set multiple mode
         */
        this.setMultiple = function (flag) {
            multiple = !!flag;
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
            clear();
            // trigger event
            if (quiet !== true) {
                this.trigger("change", []);
            }
        };

        /**
         * Select item
         */
        this.select = function (id) {
            select(id);
            this.trigger("change", this.get());
        };
        
        /**
         * Set selection
         */
        this.set = function (list) {
            // clear
            clear();
            // get array
            list = ox.util.isArray(list) ? list : [list];
            // loop
            var i = 0, $i = list.length;
            for (; i < $i; i++) {
                select(list[i]);
            }
            // event
            this.trigger("change", list);
        };
        
        this.selectRange = function (a, b) {
            // get indexes
            a = getIndex(a);
            b = getIndex(b);
            // swap?
            if (a > b) {
                var tmp = a; a = b; b = tmp;
            }
            // loop
            for (; a <= b; a++) {
                select(observedItems[a]);
            }
            // event
            this.trigger("change", this.get());
        };
        
        this.selectFirst = function () {
            if (observedItems.length) {
                select(observedItems[0]);
                this.trigger("change", this.get());
            }
        };
        
        /**
         * Is selected?
         */
        this.isSelected = function (id) {
            return isSelected(id);
        };
    };

    ox.ui.tk.Selection.extend = function (obj) {
        // extend object
        obj.selection = new ox.ui.tk.Selection();
    };

//    return;
//    $.extend(ox.ui.tk.Selection.prototype, {
//        
//        setMultiple: function (flag) {
//            this.multiple = !!flag;
//            return this;
//        },
//        
//        setItems: function (items) {
//            this.observedItems = items;
//        },
//        
//        observe: function (container) {
//            
//            this.container = container;
//            this.focusIndex = 0;
//            this.processNodes();
//            
//            var contains = function (node, list) {
//                var i = 0, $l = list.length;
//                for (; i < $l; i++) {
//                    if (node === list[i]) {
//                        return true;
//                    }
//                }
//                return false;
//            };
//            
//            // helper
//            var self = this;
//            var fnClick = function (e) {
//                // get original target
//                var node = e.originalTarget || e.target, id = undefined, selectable = false;
//                var con = this.container, p;
//                // due to a Firefox bug, we have to check if node is an ancestor of container
//                // "Permission denied to access property * from a non-chrome context..."
//                if (contains(node, $("*", con))) {
//                    // climb up and look for oxID
//                    try {
//                        while (node) {
//                            id = ox.util.firstOf(node.oxID, $(node).attr("data-id"));
//                            selectable = ox.util.firstOf(node.prop("ox-selectable"), true);
//                            if (id !== undefined) {
//                                break;
//                            }
//                            p = node.parentNode;
//                            node = p != con ? p : null;
//                        }
//                    }
//                    catch (e) {
//                        // pssst
//                    }
//                }
//                // found the id?
//                if (id !== undefined) {
//                    // default actions
//                    var click = function (option) {
//                        if (option === "quiet") {
//                            self.clickQuiet(id, e.ctrlKey, e.shiftKey);
//                        } else if (option === "force") {
//                            self.clickQuiet(id, e.ctrlKey, e.shiftKey);
//                            self.triggerChangedEvent();
//                        } else {
//                            self.click(id, e.ctrlKey, e.shiftKey);
//                        }
//                    };
//                    var context = function () {
//                        if (self.contextMenuHandler !== null) {
//                            // delay context menu to popup after typical hide methods
//                            setTimeout(function () {
//                                self.contextMenuHandler(id, e);
//                            }, 10);
//                        }
//                    };
//                    // extend event
//                    e.rightClick = e.which === 3 || (e.ctrlKey && ox.browser.MacOS);
//                    // call click handler
//                    var result = self.clickHandler({
//                        id: id, 
//                        event: e,
//                        selectable: selectable,
//                        click: click,
//                        context: context
//                    });
//                    // execute default actions?
//                    if (result !== false) {
//                        // left
//                        if (selectable === true) {
//                            click();
//                        }
//                        // right
//                        if (e.rightClick) {
//                            context();
//                        }
//                    }
//                } else {
//                    // auto select first element unless selection exists
//                    // self.selectOne();
//                }
//            };
//            
//            var fnFocus = $.proxy(function(e) {
//                if (this.statusEnabled) {
//                    // use keydown, IE does not react on keypress with cursor keys
//                    $(document).bind("keydown", $.proxy(this.handleKey, this));
//                    // show focus
//                    this.paintFocus();
//                    this.selectFocus();
//                }
//            }, this);
//    
//            var fnBlur = $.proxy(function(e) {
//                $(document).unbind("keydown", this.handleKey);
//                // hide focus
//                this.paintBlur();
//            }, this);
//            
//            // bind
//            $(container)
//                .bind("mousedown", fnClick)
//                .bind("focus", fnFocus)
//                .bind("blur", fnBlur)
//                // add tab index to receive the focus
//                .attr("tabindex", -1); // tab events, but no visual tab
//            
//            return this;
//        },
//        
//        setNodeFinder: function(fn) {
//            this.findNodes = $.proxy(fn, this);
//            return this;
//        },
//        
//        findNodes: function() {
//            return this.container.childNodes;
//        },
//        
//        update: function() {
//            this.processNodes();
//        },
//        
//        /**
//         * @private
//         */
//        processNodes: function() {
//            // reset
//            this.observedItems = [];
//            this.observedItemsIndex = {};
//            // loop
//            var nodes = this.findNodes(), $l = nodes.length, node, id = "", foundLastItem = false;
//            for (var i = 0; i < $l; i++) {
//                node = $(nodes[i]);
//                id = ox.util.firstOf(node.prop("ox-id"), node.attr("data-ox-id"));
//                // add to observation list
//                if (id !== undefined && this.observedItemsIndex[id] === undefined) {
//                    this.observedItems.push({
//                        "id": id, "node": nodes[i]
//                    });
//                    foundLastItem = !foundLastItem && this.lastSelectedItem === id;
//                }
//            }
//            // update selected items
//            for (id in this.selectedItems) {
//                if (this.observedItemsIndex[id] === undefined) {
//                    delete this.selectedItems[id];
//                }
//            }
//            // delete last item?
//            if (!foundLastItem) {
//                this.lastSelectedItem = null;
//            } else {
//                this.clickQuiet(this.lastSelectedItem);
//            }
//            
//            // preselection
//            if (this.preselectedItem !== null) {
//                this.clickQuiet(this.preselectedItem);
//                this.preselectedItem = null;
//                this.scrollIntoView();
//            }
//        },
//        
//        lookUp: function(index, item, cont) {
//            cont(this.focusIndex > 0 ? this.focusIndex-1 : this.focusIndex);
//        },
//        
//        lookDown: function(index, item, cont) {
//            cont(this.focusIndex < this.numItems()-1 ? this.focusIndex+1 : this.focusIndex);
//        },
//        
//        lookLeft: function(index, item, cont) {
//            cont(index);
//        },
//        
//        lookRight: function(index, item, cont) {
//            cont(index);
//        },
//        
//        /**
//         * @private
//         */
//        handleKey: function(e) {
//            var index = this.focusIndex, item = this.observedItems[index], id = item.id;
//            var self = this, cont = function(newIndex, newId) {
//                if (newIndex !== null) {
//                    // use index
//                    self.processChange(index, newIndex, e);
//                } else {
//                    // use id
//                    newIndex = self.observedItemsIndex[newId];
//                    self.processChange(index, newIndex, e);
//                }
//            };
//            switch (e.which) {
//            case 37:
//                // cursor right
//                this.lookLeft(index, id, cont);
//                return false;
//            case 38:
//                // cursor up
//                this.lookUp(index, id, cont);
//                return false;
//            case 39:
//                // cursor right
//                this.lookRight(index, id, cont);
//                return false;
//            case 40:
//                // cursor down
//                this.lookDown(index, id, cont);
//                return false;
//            case 16:
//                /* no break */
//            case 32:
//                // space/enter = select
//                item = this.observedItems[this.focusIndex];
//                if (item) {
//                    this.click(item.id, e.ctrlKey, e.shiftKey);
//                }
//                return false;
//            case 113:
//                // F2 / rename
//                item = this.observedItems[this.focusIndex];
//                if (item) {
//                    this.onRenameHandler(item.id, item);
//                }
//                return false;
//            }
//        },
//        
//        disable: function () {
//            if (this.statusEnabled === true) {
//                this.statusEnabled = false;
//                $(document).unbind("keydown", this.handleKey);
//                for (var id in this.selectedItems) {
//                    this.deselect(id);
//                }
//            }
//        },
//        
//        enable: function () {
//            if (this.statusEnabled === false) {
//                this.statusEnabled = true;
//                if (this.lastSelectedItem !== null) {
//                    this.clickQuiet(this.lastSelectedItem, true);
//                }
//                $(this.container).focus();
//            }
//        },
//        
//        /**
//         * @private
//         */
//        processChange: function(oldFocusIndex, newFocusIndex, e) {
//            if (oldFocusIndex != newFocusIndex && newFocusIndex !== undefined) {
//                // remove old focus
//                this.paintBlur();
//                // set new focus
//                this.focusIndex = newFocusIndex;
//                // paint new focus
//                this.paintFocus();
//                if (!e.ctrlKey) {
//                    this.selectFocus();
//                }
//            }
//        },
//        
//        paintBlur: function() {
//            var item = this.observedItems[this.focusIndex], self = this;
//            if (item) {
//                $(item.node).removeClass(this.classFocus);
//            }
//        },
//        
//        paintFocus: function() {
//            var item = this.observedItems[this.focusIndex];
//            if (item) {
//                $(item.node).addClass(this.classFocus).intoViewport(this.container);
//            }
//        },
//        
//        selectFocus: function() {
//            var item = this.observedItems[this.focusIndex];
//            if (item) {
//                
//                this.click(item.id);
//            }
//        },
//        
//        selectOne: function () {
//            if (this.numSelected() === 0) {
//                var item = this.observedItems[0];
//                if (item) {
//                    this.click(item.id);
//                }
//            }
//        },
//        
//        clickQuiet: function(id, multiple, range) {
//            this.click(id, multiple, range, true);
//        },
//        
//        click: function(id, multiple, range, noEvent) {
//            if (this.observedItemsIndex[id] !== undefined) {
//                // get previous selection length
//                var pre = { l: this.numSelected(), item: this.lastSelectedItem };
//                // multiple?
//                if (!this.multiple || !multiple) {
//                    // clear selection
//                    this.clear();
//                }
//                // update focus
//                var self = this, updateFocus = function () {
//                    // remove old focus
//                    self.paintBlur();
//                    // set focus index
//                    self.focusIndex = self.observedItemsIndex[id];
//                    // paint new focus
//                    self.paintFocus();
//                };
//                // range?
//                if (range && this.lastSelectedItem) {
//                    // select range
//                    this.selectRange(this.lastSelectedItem, id);
//                    updateFocus();
//                } else {
//                    // add single item to selection
//                    this.toggle(id);
//                    if (this.lastSelectedItem !== id) {
//                        updateFocus();
//                        // remember last item
//                        this.lastSelectedItem = id;
//                    }
//                }
//                // get current selection length
//                var post = { l: this.numSelected(), item: id };
//                // trigger event?
//                if (noEvent !== true && (pre.l != post.l || pre.item != post.item)) {
//                    this.triggerChangedEvent();
//                }
//            }
//        },
//    
//        selectRange: function(lastId, newId) {
//            // get indexes
//            var fromIndex = this.observedItemsIndex[lastId];
//            var toIndex = this.observedItemsIndex[newId];
//            // swap?
//            if (fromIndex > toIndex) {
//              var tmp = fromIndex; fromIndex = toIndex; toIndex = tmp;
//            }
//            // loop
//            for (var i = fromIndex; i <= toIndex; i++) {
//                var item = this.observedItems[i];
//                this.select(item.id);
//            }
//        },
//        
//        getItemById: function (id) {
//            var index = this.observedItemsIndex[id];
//            return this.observedItems[index];
//        },
//        
//        scrollIntoView: function () {
//            var items = this.getSelectedItems();
//            if (items.length > 0) {
//                $(items[0].node).intoViewport(this.container); //.scrollIntoView(true); // top align
//                if (ox.browser.IE) {
//                    // fix IE7 issue
//                    window.scrollTo(0,0);
//                }
//            }
//        },
//    
//        preselect: function (id) {
//            this.preselectedItem = id;
//        },
//        
//        select: function (id) {
//            // is not selected?
//            if (!this.isSelected(id)) {
//                // get item
//                var item = this.getItemById(id);
//                if (item !== undefined) {
//                    // select
//                    this.selectedItems[id] = item;
//                    this.selectedItems[id].selectionId = id;
//                    var node = $(item.node).addClass(this.classSelected);
//                    this.dispatcher.trigger("selected", { id: id, item: item, node: node });
//                }
//            }
//        },
//    
//        deselect: function (id) {
//            // is selected?
//            if (this.isSelected(id)) {
//                delete this.selectedItems[id];
//                var item = this.getItemById(id);
//                if (item) {
//                    // deselect
//                    var node = $(item.node).removeClass(this.classSelected);
//                    this.dispatcher.trigger("deselected", { id: id, item: item, node: node });
//                }
//            }
//        },
//    
//        isSelected: function(id) {
//            return this.selectedItems[id] !== undefined;
//        },
//    
//        toggle: function(id) {
//            if (this.isSelected(id)) {
//                this.deselect(id);
//            } else {
//                this.select(id);
//            }
//        },
//        
//        clear: function (quiet) {
//            // deselect items
//            for (var id in this.selectedItems) {
//                this.deselect(id);
//            }
//            // trigger event
//            if (quiet !== true) {
//                this.triggerChangedEvent();
//            }
//        },
//    
//        numItems: function() {
//            return this.observedItems.length;
//        },
//        
//        numSelected: function() {
//            var count = 0;
//            for (var id in this.selectedItems) { count++; }
//            return count;
//        },
//    
//        getSelectedItems: function() {
//            var list = [];
//            for (var id in this.selectedItems) {
//                list.push(this.selectedItems[id]);
//            }
//            return list;
//        },
//    
//        getSelection: function() {
//            var list = [];
//            for (var id in this.selectedItems) {
//                list.push(id);
//            }
//            return list;
//        },
//        
//        override: function(name, fn) {
//            if ($.isFunction(fn)) {
//                this[name] = fn;
//            }
//            return this;
//        },
//        
//        setClickHandler: function (handler) {
//            this.clickHandler = handler;
//        },
//        
//        setContextMenuHandler: function (handler) {
//            this.contextMenuHandler = handler;
//        },
//        
//        triggerContextMenu: function (id, e) {
//            var self = this;
//            if (self.contextMenuHandler !== null) {
//                setTimeout(function () {
//                    self.contextMenuHandler(id, e);
//                }, 10);
//            }
//        }
//    });
    
})();