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

// DEVELOPMENT IN PROGRESS // SUBJECT TO PERMANENT CHANGE!


ox.ui.tk.Selection = function () {

    this.multiple = true;

    this.selectedItems = {};
    this.observedItems = [];
    this.observedItemsIndex = {};
    this.preselectedItem = null;
    this.auto = true; // allows any form of automatic selection

    this.onChangeCallback = null;
    this.onRenameHandler = $.noop;
    this.clickHandler = $.noop;
    this.contextMenuHandler = null;
    this.lastSelectedItem = null;

    this.statusEnabled = true;
    this.focusIndex = 0;
    this.container = null;

    this.classFocus = "focussed";
    this.classSelected = "selected";

    this.dispatcher = new ox.api.event.Dispatcher();
};

$.extend(ox.ui.tk.Selection.prototype, {
    
    getClass: function() { return "ox.gui.Selection"; },
    
    /** 
     * An abstract item selection
     * @constructs
     */
    construct: function() {
        
        
    },

    setMultiple: function(flag) {
        this.multiple = !!flag;
        return this;
    },

    onChange: function(fn) {
        this.onChangeCallback = fn;
        return this;
    },

    onRename: function(fn) {
        this.onRenameHandler = fn;
        return this;
    },

    triggerChangedEvent: function() {
        if (typeof this.onChangeCallback === "function") {
            this.onChangeCallback(this.getSelectedItems());
        }
    },
    
    observe: function (container) {
        
        this.container = container;
        this.focusIndex = 0;
        this.processNodes();
        
        var contains = function (node, list) {
            var i = 0, $l = list.length;
            for (; i < $l; i++) {
                if (node === list[i]) {
                    return true;
                }
            }
            return false;
        };
        
        // helper
        var self = this;
        var fnClick = function (e) {
            // get original target
            var node = e.originalTarget || e.target, id = undefined, selectable = false;
            var con = this.container, p;
            // due to a Firefox bug, we have to check if node is an ancenster of container
            // "Permission denied to access property * from a non-chrome context..."
            if (contains(node, $("*", con))) {
                // climb up and look for oxID
                try {
                    while (node) {
                        id = ox.util.firstOf(node.oxID, $(node).attr("data-id"));
                        selectable = ox.util.firstOf(node.oxSelectable, true);
                        if (id !== undefined) {
                            break;
                        }
                        p = node.parentNode;
                        node = p != con ? p : null;
                    }
                }
                catch (e) {
                }
            }
            // found the id?
            if (id !== undefined) {
                // default actions
                var click = function (option) {
                    if (option === "quiet") {
                        self.clickQuiet(id, e.ctrlKey, e.shiftKey);
                    } else if (option === "force") {
                        self.clickQuiet(id, e.ctrlKey, e.shiftKey);
                        self.triggerChangedEvent();
                    } else {
                        self.click(id, e.ctrlKey, e.shiftKey);
                    }
                };
                var context = function () {
                    if (self.contextMenuHandler !== null) {
                        // delay context menu to popup after typical hide methods
                        setTimeout(function () {
                            self.contextMenuHandler(id, e);
                        }, 10);
                    }
                };
                // extend event
                e.rightClick = e.which === 3 || (e.ctrlKey && ox.browser.MacOS);
                // call click handler
                var result = self.clickHandler({
                    id: id, 
                    event: e,
                    selectable: selectable,
                    click: click,
                    context: context
                });
                // execute default actions?
                if (result !== false) {
                    // left
                    if (selectable === true) {
                        click();
                    }
                    // right
                    if (e.rightClick) {
                        context();
                    }
                }
            } else {
                // auto select first element unless selection exists
                // self.selectOne();
            }
        };
        
        var fnFocus = $.proxy(function(e) {
            if (this.statusEnabled) {
                // use keydown, IE does not react on keypress with cursor keys
                $(document).bind("keydown", $.proxy(this.handleKey, this));
                // show focus
                this.paintFocus();
                this.selectFocus();
            }
        }, this);

        var fnBlur = $.proxy(function(e) {
            $(document).unbind("keydown", this.handleKey);
            // hide focus
            this.paintBlur();
        }, this);
        
        // bind
        $(container)
            .bind("mousedown", fnClick)
            //.bind("focus", fnFocus)
            //.bind("blur", fnBlur)
            // add tab index to receive the focus
            .attr("tabindex", -1); // tab events, but no visual tab
        
        return this;
    },
    
    setNodeFinder: function(fn) {
        this.findNodes = $.proxy(fn, this);
        return this;
    },
    
    findNodes: function() {
        return this.container.childNodes;
    },
    
    update: function() {
        this.processNodes();
    },
    
    /**
     * @private
     */
    processNodes: function() {
        // reset
        this.observedItems = [];
        this.observedItemsIndex = {};
        // loop
        var nodes = this.findNodes(), $l = nodes.length, node, id, foundLastItem = false;
        for (var i = 0; i < $l; i++) {
            node = nodes[i];
            id = ox.util.firstOf(node.oxID, $(node).attr("data-id"));
            // add to observation list
            if (id !== undefined && this.observedItemsIndex[id] === undefined) {
                var index = this.observedItemsIndex[id] = this.observedItems.length;
                this.observedItems.push({
                    "id": id, "node": node
                });
                foundLastItem = !foundLastItem && this.lastSelectedItem === id;
            }
        }
        // update selected items
        for (id in this.selectedItems) {
            if (this.observedItemsIndex[id] === undefined) {
                delete this.selectedItems[id];
            }
        }
        // delete last item?
        if (!foundLastItem) {
            this.lastSelectedItem = null;
        } else {
            this.clickQuiet(this.lastSelectedItem);
        }
        
        // preselection
        if (this.preselectedItem !== null) {
            this.clickQuiet(this.preselectedItem);
            this.preselectedItem = null;
            this.scrollIntoView();
        }
    },
    
    lookUp: function(index, item, cont) {
        cont(this.focusIndex > 0 ? this.focusIndex-1 : this.focusIndex);
    },
    
    lookDown: function(index, item, cont) {
        cont(this.focusIndex < this.numItems()-1 ? this.focusIndex+1 : this.focusIndex);
    },
    
    lookLeft: function(index, item, cont) {
        cont(index);
    },
    
    lookRight: function(index, item, cont) {
        cont(index);
    },
    
    /**
     * @private
     */
    handleKey: function(e) {
        var index = this.focusIndex, item = this.observedItems[index], id = item.id;
        var self = this, cont = function(newIndex, newId) {
            if (newIndex !== null) {
                // use index
                self.processChange(index, newIndex, e);
            } else {
                // use id
                newIndex = self.observedItemsIndex[newId];
                self.processChange(index, newIndex, e);
            }
        };
        switch (e.which) {
        case 37:
            // cursor right
            this.lookLeft(index, id, cont);
            return false;
        case 38:
            // cursor up
            this.lookUp(index, id, cont);
            return false;
        case 39:
            // cursor right
            this.lookRight(index, id, cont);
            return false;
        case 40:
            // cursor down
            this.lookDown(index, id, cont);
            return false;
        case 16:
            /* no break */
        case 32:
            // space/enter = select
            item = this.observedItems[this.focusIndex];
            if (item) {
                this.click(item.id, e.ctrlKey, e.shiftKey);
            }
            return false;
        case 113:
            // F2 / rename
            item = this.observedItems[this.focusIndex];
            if (item) {
                this.onRenameHandler(item.id, item);
            }
            return false;
        }
    },
    
    disable: function () {
        if (this.statusEnabled === true) {
            this.statusEnabled = false;
            $(document).unbind("keydown", this.handleKey);
            for (var id in this.selectedItems) {
                this.deselect(id);
            }
        }
    },
    
    enable: function () {
        if (this.statusEnabled === false) {
            this.statusEnabled = true;
            if (this.lastSelectedItem !== null) {
                this.clickQuiet(this.lastSelectedItem, true);
            }
            $(this.container).focus();
        }
    },
    
    /**
     * @private
     */
    processChange: function(oldFocusIndex, newFocusIndex, e) {
        if (oldFocusIndex != newFocusIndex && newFocusIndex !== undefined) {
            // remove old focus
            this.paintBlur();
            // set new focus
            this.focusIndex = newFocusIndex;
            // paint new focus
            this.paintFocus();
            if (!e.ctrlKey) {
                this.selectFocus();
            }
        }
    },
    
    paintBlur: function() {
        var item = this.observedItems[this.focusIndex], self = this;
        if (item) {
            $(item.node).removeClass(this.classFocus);
        }
    },
    
    paintFocus: function() {
        var item = this.observedItems[this.focusIndex];
        if (item) {
            $(item.node).addClass(this.classFocus).intoViewport(this.container);
        }
    },
    
    selectFocus: function() {
        var item = this.observedItems[this.focusIndex];
        if (item) {
            
            this.click(item.id);
        }
    },
    
    selectOne: function () {
        if (this.numSelected() === 0) {
            var item = this.observedItems[0];
            if (item) {
                this.click(item.id);
            }
        }
    },
    
    clickQuiet: function(id, multiple, range) {
        this.click(id, multiple, range, true);
    },
    
    click: function(id, multiple, range, noEvent) {
        if (this.observedItemsIndex[id] !== undefined) {
            // get previous selection length
            var pre = { l: this.numSelected(), item: this.lastSelectedItem };
            // multiple?
            if (!this.multiple || !multiple) {
                // clear selection
                this.clear();
            }
            // update focus
            var self = this, updateFocus = function () {
                // remove old focus
                self.paintBlur();
                // set focus index
                self.focusIndex = self.observedItemsIndex[id];
                // paint new focus
                self.paintFocus();
            };
            // range?
            if (range && this.lastSelectedItem) {
                // select range
                this.selectRange(this.lastSelectedItem, id);
                updateFocus();
            } else {
                // add single item to selection
                this.toggle(id);
                if (this.lastSelectedItem !== id) {
                    updateFocus();
                    // remember last item
                    this.lastSelectedItem = id;
                }
            }
            // get current selection length
            var post = { l: this.numSelected(), item: id };
            // trigger event?
            if (noEvent !== true && (pre.l != post.l || pre.item != post.item)) {
                this.triggerChangedEvent();
            }
        }
    },

    selectRange: function(lastId, newId) {
        // get indexes
        var fromIndex = this.observedItemsIndex[lastId];
        var toIndex = this.observedItemsIndex[newId];
        // swap?
        if (fromIndex > toIndex) {
          var tmp = fromIndex; fromIndex = toIndex; toIndex = tmp;
        }
        // loop
        for (var i = fromIndex; i <= toIndex; i++) {
            var item = this.observedItems[i];
            this.select(item.id);
        }
    },
    
    getItemById: function (id) {
        var index = this.observedItemsIndex[id];
        return this.observedItems[index];
    },
    
    scrollIntoView: function () {
        var items = this.getSelectedItems();
        if (items.length > 0) {
            $(items[0].node).intoViewport(this.container); //.scrollIntoView(true); // top align
            if (ox.browser.IE) {
                // fix IE7 issue
                window.scrollTo(0,0);
            }
        }
    },

    preselect: function (id) {
        this.preselectedItem = id;
    },
    
    select: function (id) {
        // is not selected?
        if (!this.isSelected(id)) {
            // get item
            var item = this.getItemById(id);
            if (item !== undefined) {
                // select
                this.selectedItems[id] = item;
                this.selectedItems[id].selectionId = id;
                var node = $(item.node).addClass(this.classSelected);
                this.dispatcher.trigger("selected", { id: id, item: item, node: node });
            }
        }
    },

    deselect: function (id) {
        // is selected?
        if (this.isSelected(id)) {
            delete this.selectedItems[id];
            var item = this.getItemById(id);
            if (item) {
                // deselect
                var node = $(item.node).removeClass(this.classSelected);
                this.dispatcher.trigger("deselected", { id: id, item: item, node: node });
            }
        }
    },

    isSelected: function(id) {
        return this.selectedItems[id] !== undefined;
    },

    toggle: function(id) {
        if (this.isSelected(id)) {
            this.deselect(id);
        } else {
            this.select(id);
        }
    },
    
    clear: function (quiet) {
        // deselect items
        for (var id in this.selectedItems) {
            this.deselect(id);
        }
        // trigger event
        if (quiet !== true) {
            this.triggerChangedEvent();
        }
    },

    numItems: function() {
        return this.observedItems.length;
    },
    
    numSelected: function() {
        var count = 0;
        for (var id in this.selectedItems) { count++; }
        return count;
    },

    getSelectedItems: function() {
        var list = [];
        for (var id in this.selectedItems) {
            list.push(this.selectedItems[id]);
        }
        return list;
    },

    getSelection: function() {
        var list = [];
        for (var id in this.selectedItems) {
            list.push(id);
        }
        return list;
    },
    
    override: function(name, fn) {
        if ($.isFunction(fn)) {
            this[name] = fn;
        }
        return this;
    },
    
    setClickHandler: function (handler) {
        this.clickHandler = handler;
    },
    
    setContextMenuHandler: function (handler) {
        this.contextMenuHandler = handler;
    },
    
    triggerContextMenu: function (id, e) {
        var self = this;
        if (self.contextMenuHandler !== null) {
            setTimeout(function () {
                self.contextMenuHandler(id, e);
            }, 10);
        }
    }
});