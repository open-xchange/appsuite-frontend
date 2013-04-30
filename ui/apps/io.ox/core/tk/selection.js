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

define('io.ox/core/tk/selection',
    ['io.ox/core/event',
     'io.ox/core/extensions',
     'io.ox/core/notifications',
     'gettext!io.ox/core'], function (Events, ext, notifications, gt) {

    'use strict';

    function joinTextNodes(nodes, delimiter) {
        nodes = nodes.map(function () { return $.trim($(this).text()); });
        return $.makeArray(nodes).join(delimiter || '');
    }

    function defaultMessage(items) {
        var title = joinTextNodes(this.find('.selected .drag-title'), ', ');
        return title || gt.format(gt.ngettext('1 item', '%1$d items', items.length), items.length);
    }

    var Selection = function (container, options) {

        options = _.extend({
            draggable: false,
            dragMessage: defaultMessage,
            dragCssClass: undefined,
            dragType: '',
            dropzone: false,
            dropzoneSelector: '.selectable',
            dropType: ''
        }, options);

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
            clickHandler,
            mouseupHandler,
            mousedownHandler,
            update,
            clear,
            isSelected,
            select,
            deselect,
            toggle,
            isCheckbox,
            isMultiple,
            isRange,
            isDragged,
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

        isCheckbox = function (e) {
            var closest = $(e.target).closest(editableSelector),
                isEditable = editable && closest.length;
            return isEditable;
        };

        isMultiple = function (e) {
            return multiple && e && (e.metaKey || e.ctrlKey);
        };

        isRange = function (e) {
            return e && e.shiftKey && multiple;
        };

        isDragged = function (e) {
            return $(e.currentTarget).hasClass('dnd-over');
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
                var item = observedItems[0];
                clear();
                apply(item.data, e);
                self.trigger('select:first', item.data);
            }
        };

        selectPrevious = function (e) {
            if (bHasIndex) {
                var index = getIndex(last) - 1, item;
                if (index >= 0) {
                    item = observedItems[index];
                    clear();
                    apply(item.data, e);
                    self.trigger('select:previous', item.data);
                }
            }
        };

        selectLast = function (e) {
            if (bHasIndex && observedItems.length) {
                var index = observedItems.length - 1,
                    item = observedItems[index];
                clear();
                apply(item.data, e);
                self.trigger('select:last', item.data);
            }
        };

        selectNext = function (e) {
            if (bHasIndex) {
                var index = getIndex(last) + 1, item;
                if (index < observedItems.length) {
                    item = observedItems[index];
                    clear();
                    apply(item.data, e);
                    self.trigger('select:next', item.data);
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

        clickHandler = function (e) {
            var node, key, id;
            if (!e.isDefaultPrevented()) {
                node = $(this);
                key = node.attr('data-obj-id');
                id = bHasIndex ? (observedItems[getIndex(key)] || {}).data : key;
                // checkbox click?
                if (id !== undefined && isCheckbox(e)) {
                    apply(id, e);
                }
            }
        };

        mousedownHandler = function (e) {
            var node, key, id;
            // we check for isDefaultPrevented because elements inside .selectable
            // might also react on mousedown/click, e.g. folder tree open/close toggle
            if (!e.isDefaultPrevented()) {
                node = $(this);
                key = node.attr('data-obj-id');
                id = bHasIndex ? (observedItems[getIndex(key)] || {}).data : key;
                // exists?
                if (id !== undefined && !isCheckbox(e)) {
                    // explicit multiple?
                    if (isMultiple(e)) {
                        apply(id, e);
                        return;
                    }
                    // selected?
                    if (isSelected(id)) {
                        // but one of many?
                        if (hasMultiple()) {
                            node.addClass('pending-select');
                        }
                    } else {
                        clear();
                        apply(id, e);
                    }
                }
            }
        };

        mouseupHandler = function (e) {
            var node, key, id;
            if (!e.isDefaultPrevented()) {
                node = $(this);
                key = node.attr('data-obj-id');
                id = bHasIndex ? (observedItems[getIndex(key)] || {}).data : key;
                // exists?
                if (id !== undefined) {
                    if (node.hasClass('pending-select')) {
                        clear();
                        apply(id, e);
                    }
                }
            }
            // remove helper classes
            container.find('.pending-select').removeClass('pending-select');
        };

        getIndex = function (id) {
            return bHasIndex ? observedItemsIndex[self.serialize(id)] : -1;
        };

        getNode = function (id) {
            // Why we do the replacement regex stuff: Bug #24543
            return $('.selectable[data-obj-id="' + self.serialize(id).replace(/\\\./, '\\\\.') + '"]', container);
        };

        isSelected = function (id) {
            return selectedItems[self.serialize(id)] !== undefined;
        };

        select = function (id, silent) {
            if (id) {
                var key = self.serialize(id);
                getNode(key)
                    .addClass(self.classSelected)
                    .find('input.reflect-selection')
                    .attr('checked', 'checked').end()
                    .intoViewport(container);
                selectedItems[key] = id;
                last = id;
                lastIndex = getIndex(id);
                if (prev === empty) {
                    prev = id;
                    lastValidIndex = lastIndex;
                }
                if (silent !== true) {
                    self.trigger('select', key);
                }
            }
        };

        deselect = function (id) {
            var key = self.serialize(id);
            delete selectedItems[key];
            getNode(key)
                .removeClass(self.classSelected)
                .find('input.reflect-selection').removeAttr('checked');
            self.trigger('deselect', key);
        };

        toggle = function (id) {
            if (isSelected(id)) {
                deselect(id);
            } else {
                select(id);
            }
        };

        update = function () {
            // get nodes
            var nodes = $('.selectable', container),
                i = 0, $i = nodes.length, node = null;
            for (; i < $i; i++) {
                node = nodes.eq(i);
                // is selected?
                if (isSelected(node.attr('data-obj-id'))) {
                    $('input.reflect-selection', node).attr('checked', 'checked');
                    node.addClass(self.classSelected);
                } else {
                    $('input.reflect-selection', node).removeAttr('checked');
                    node.removeClass(self.classSelected);
                }
            }
        };

        clear = function () {
            // clear hash
            selectedItems = {};
            // clear nodes
            container.find('.selectable.' + self.classSelected).removeClass(self.classSelected);
            container.find('.selectable input.reflect-selection').removeAttr('checked');
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
            observedItems = new Array(all.length);
            observedItemsIndex = {};
            last = prev = empty;
            // build index
            var i = 0, $i = all.length, data, cid, reselected = false, index = lastIndex;
            for (; i < $i; i++) {
                data = all[i];
                cid = self.serialize(data);
                observedItems[i] = { data: data, cid: cid };
                observedItemsIndex[cid] = i;
            }
            // restore selection. check if each item exists
            for (i = 0, $i = tmp.length; i < $i; i++) {
                cid = self.serialize(tmp[i]);
                if (observedItemsIndex[cid] !== undefined) {
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
                insert = [],
                // check for conflict, i.e. at least one item is already on the list
                conflict = _(list).reduce(function (memo, obj) {
                    var cid = self.serialize(obj);
                    insert.push({ data: obj, cid: cid });
                    return memo || (cid in observedItemsIndex);
                }, false);
            // no conflict?
            if (!conflict) {
                // insert into list
                observedItems.splice.apply(observedItems, [pos, 0].concat(insert));
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
            _(observedItems).each(function (item, i) {
                observedItemsIndex[item.cid] = i;
            });
        };

        /**
         * Update
         */
        this.update = function () {
            update();
            return this;
        };

        this.debug = function () {
            console.debug('selection', {
                selected: selectedItems,
                observed: observedItems,
                index: observedItemsIndex
            });
        };

        this.clearIndex = function () {
            observedItems = [];
            observedItemsIndex = {};
            return this;
        };

        this.addToIndex = function (obj) {
            var cid = this.serialize(obj);
            if (observedItemsIndex[cid] === undefined) {
                observedItemsIndex[cid] = observedItems.length;
                observedItems.push({ data: obj, cid: cid });
            }
            return this;
        };

        this.removeFromIndex = function (list) {
            var hash = {}, index = 0;
            // build hash of CIDs to delete
            _([].concat(list)).each(function (obj) {
                hash[self.serialize(obj)] = true;
            });
            // reset index
            observedItemsIndex = {};
            // rebuild list
            observedItems = _(observedItems).filter(function (item) {
                var cid = item.cid;
                if (cid in hash) {
                    return false;
                } else {
                    observedItemsIndex[cid] = index++;
                    return true;
                }
            });
        };

        this.hasIndex = function (flag) {
            bHasIndex = !!flag;
            return this;
        };

        this.getObservedItems = function () {
            return observedItemsIndex;
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
        this.clear = function (silent) {
            // internal clear
            clear();
            // trigger event
            if (silent !== true) {
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
         * Deselect item
         */
        this.deselect = function (id) {
            deselect(id);
            changed();
            return this;
        };

        /**
         * Set selection
         */
        this.set = function (list, silent) {
            // previous
            var previous = this.get(), current;
            // clear
            clear();
            // loop
            _(_.isArray(list) ? list : [list]).each(function (elem) {
                var item;
                if (typeof elem === 'string' && bHasIndex && (item = observedItems[getIndex(elem)]) !== undefined) {
                    select(item.data);
                } else {
                    select(elem);
                }
            });
            // reset last index
            lastIndex = -1;
            // event?
            if (!_.isEqual(previous, this.get()) && silent !== true) {
                changed();
            }
            return this;
        };

        this.equals = function (list) {
            return _.isEqual(list, this.get());
        };

        this.selectRange = function (a, b) {

            var tmp, i, item;

            if (bHasIndex) {
                // get indexes
                a = getIndex(a);
                b = getIndex(b);
                // swap?
                if (a > b) {
                    tmp = a;
                    a = b;
                    b = tmp;
                }
                // loop
                for (i = a; i <= b; i++) {
                    // get id
                    item = observedItems[i];
                    // select first & last one via "normal" select
                    if (i === a || i === b) {
                        select(item.data);
                    } else {
                        // fast & simple
                        selectedItems[item.cid] = item.data;
                    }
                }
                // fast update - just updates existing nodes instead of looking for thousands
                this.update();
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
                _(observedItems).each(function (item) {
                    select(item.data, true);
                });
                changed();
            }
        };

        this.resetLastIndex = function () {
            lastValidIndex = -1;
        };

        this.setLastIndex = function (obj) {
            prev = obj;
            lastValidIndex = getIndex(obj);
            return this;
        };

        this.selectLastIndex = function () {
            if (lastValidIndex !== -1) {
                var item = observedItems[lastValidIndex] || _.last(observedItems);
                if (item !== undefined) {
                    this.select(item.data);
                }
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
            var list = [].concat(ids);
            return !!list.length && _(list).inject(function (memo, id) {
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
            container.off('mousedown mouseup contextmenu');
            selectedItems = observedItems = observedItemsIndex = last = null;
        };

        // bind general click handler
        container.on('contextmenu', function (e) { e.preventDefault(); })
            .on('mousedown', '.selectable', mousedownHandler)
            .on('mouseup', '.selectable', mouseupHandler)
            .on('click', '.selectable', clickHandler);

        /*
        * DND
        */
        (function () {

            var data,
                source,
                helper = null,
                fast,
                expandTimer,
                deltaLeft = 15,
                deltaTop = 15,
                // move helper
                px = 0, py = 0, x = 0, y = 0,
                abs = Math.abs;

            function move(e) {
                // use fast access
                x = e.pageX + deltaLeft;
                y = e.pageY + deltaTop;
                if (abs(px - x) >= 5 || abs(py - y) >= 5) {
                    fast.left = x + 'px';
                    fast.top = y + 'px';
                    px = x;
                    py = y;
                }
            }

            function firstMove() {
                // trigger DOM event
                container.trigger('selection:dragstart');
            }

            function over() {
                var self = this,
                ft = $(this).closest('.foldertree-container'),
                node = ft[0],
                interval,
                scrollSpeed = 0,
                yMax,
                RANGE = 3 * $(this).height(), // Height of the sensitive area in px. (2 nodes high)
                MAX = 1, // Maximal scrolling speed in px/ms.
                scale = MAX / RANGE,
                nodeOffsetTop = 0;

                $(this).addClass('dnd-over');

                if ($(this).hasClass('expandable')) {
                    clearTimeout(expandTimer);
                    expandTimer = setTimeout(function () {
                        $(self).find('.folder-arrow').trigger('mousedown');
                    }, 1500);
                }

                function canScroll() {
                    var scrollTop = node.scrollTop;
                    return scrollSpeed < 0 && scrollTop > 0 ||
                           scrollSpeed > 0 && scrollTop < yMax;
                }

                // The speed is specified in px/ms. A range of 1 to 10 results
                // in a speed of 100 to 1000 px/s.
                function scroll() {
                    if (canScroll()) {
                        var t0 = new Date().getTime(), y0 = node.scrollTop;
                        if (interval !== undefined) clearInterval(interval);
                        interval = setInterval(function () {
                            if (canScroll()) {
                                var dt = new Date().getTime() - t0,
                                y = y0 + scrollSpeed * dt;
                                if (y < 0) y = 0;
                                else if (y > yMax) y = yMax;
                                else {
                                    node.scrollTop = y;
                                    return;
                                }
                            }
                            clearInterval(interval);
                            interval = undefined;
                        }, 10);
                    } else {
                        if (interval !== undefined) clearInterval(interval);
                        interval = undefined;
                    }
                }

                $(node).on('mousemove.dnd', function (e) {
                    if (helper === null) return;
                    if (!nodeOffsetTop) { nodeOffsetTop = $(node).offset().top; }
                    var y = e.pageY - nodeOffsetTop;
                    yMax = node.scrollHeight - node.clientHeight;

                    if (y < RANGE) {
                        scrollSpeed = (y - RANGE) * scale;
                    } else if (node.clientHeight - y < RANGE) {
                        scrollSpeed = (RANGE - node.clientHeight + y) * scale;
                    } else {
                        scrollSpeed = 0;
                    }
                    scroll();
                }).on('mouseleave.dnd', function (e) {
                    scrollSpeed = 0;
                    scroll();
                    $(node).off('mousemove.dnd mouseleave.dnd');
                });
            }

            function out() {
                clearTimeout(expandTimer);
                $(this).removeClass('dnd-over');
            }

            function drag(e) {
                // unbind
                $(document).off('mousemove.dnd', drag);
                // create helper
                helper = $('<div class="drag-helper">').append(
                    $('<span class="badge badge-important">').text(data.length),
                    $('<span>').text(options.dragMessage.call(container, data, source))
                );
                // get fast access
                fast = helper[0].style;
                // initial move
                px = py = x = y = 0;
                move(e);
                // replace in DOM
                helper.appendTo(document.body);
                // bind
                $(document).on('mousemove.dnd', move)
                    .one('mousemove.dnd', firstMove)
                    .on('mouseover.dnd', '.selectable', over)
                    .on('mouseout.dnd', '.selectable', out);
            }

            function remove() {
                if (helper !== null) {
                    helper.remove();
                    helper = fast = null;
                }
            }

            function stop() {
                // unbind handlers
                $(document).off('mousemove.dnd mouseup.dnd mouseover.dnd mouseout.dnd');
                $('.dropzone').each(function () {
                    var node = $(this), selector = node.attr('data-dropzones');
                    (selector ? node.find(selector) : node).off('mouseup.dnd');
                });
                $('.dnd-over').removeClass('dnd-over');
                // trigger DOM event
                container.trigger('selection:dragstop');
                // revert?
                if (helper !== null) {
                    remove();
                }
            }

            function drop(e) {
                clearTimeout(expandTimer);
                var target = $(this).attr('data-obj-id') || $(this).attr('data-cid'),
                    baton = new ext.Baton({ data: data, dragType: options.dragType, dropzone: this, target: target });
                $(this).trigger('selection:drop', [baton]);
            }

            function resist(e) {
                var deltaX = Math.abs(e.pageX - e.data.x),
                    deltaY = Math.abs(e.pageY - e.data.y);
                if (deltaX > 15 || deltaY > 15) {
                    $(document).off('mousemove.dnd').on('mousemove.dnd', drag);
                }
            }

            function start(e) {
                source = $(this);
                data = self.unique(self.unfold());
                // bind events
                $('.dropzone').each(function () {
                    var node = $(this), selector = node.attr('data-dropzones');
                    (selector ? node.find(selector) : node).on('mouseup.dnd', drop);
                });
                $(document)
                    .on('mousemove.dnd', { x: e.pageX, y: e.pageY }, resist)
                    .on('mouseup.dnd', stop);
                // prevent text selection
                e.preventDefault();
            }

            // drag & drop
            if (!Modernizr.touch) {
                // draggable?
                if (options.draggable) {
                    container.on('mousedown.dnd', '.selectable', start);
                }
                // dropzone?
                if (options.dropzone) {
                    container.addClass('dropzone')
                        .attr('data-dropzones', options.dropzoneSelector)
                        .on('drop', function (e, baton) {
                            baton.dropType = options.dropType;
                            self.trigger('selection:drop', baton);
                        });
                }
            }

        }());
    };

    Selection.extend = function (obj, node, options) {
        // extend object
        return (obj.selection = new Selection(node, options || {}));
    };

    return Selection;

});
