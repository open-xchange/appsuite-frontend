/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2012 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/selection', [
    'io.ox/core/event',
    'io.ox/core/extensions',
    'io.ox/core/collection',
    'io.ox/core/notifications',
    'gettext!io.ox/core',
    'io.ox/core/tk/draghelper'
], function (Events, ext, Collection, notifications, gt) {

    'use strict';

    function joinTextNodes(nodes, delimiter) {
        nodes = nodes.map(function () {
            return $.trim($(this).attr('title') || $(this).text());
        });
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
            dropType: '',
            scrollpane: container,
            focus: '[tabindex]',
            tabFix: 1,
            markable: false
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
            dblClickHandler,
            mouseupHandler,
            mousedownHandler,
            touchHandler,
            update,
            clear,
            isSelected,
            fastSelect,
            select,
            selectOnly,
            deselect,
            toggle,
            isSelectable,
            isCheckbox,
            isMultiple,
            isRange,
            getIndex,
            getNode,
            selectFirst,
            selectPrevious,
            selectLast,
            selectNext,
            // marker mode
            mark,
            fastMark,
            clearMarks,
            isMarker = $.noop,
            // trick for smooth updates
            lastIndex = -1,
            lastValidIndex = 0,
            fnKey,
            hasMultiple,
            mobileSelectMode;

        isSelectable = function (e) {
            return !$(e.target).hasClass('not-selectable');
        };

        isCheckbox = function (e) {
            var closest = $(e.target).closest(editableSelector);
            return editable && closest.length;
        };

        isMultiple = function (e) {
            return multiple && e && (e.metaKey || e.ctrlKey);
        };

        isRange = function (e) {
            return e && e.shiftKey && multiple;
        };

        // TODO: unused
        // isDragged = function (e) {
        //     return $(e.currentTarget).hasClass('dnd-over');
        // };

        hasMultiple = function () {
            return _.isArray(selectedItems) && selectedItems.length > 1;
        };

        changed = function () {
            var list = self.get();
            self.trigger('change', list);
            if (list.length === 0) {
                self.trigger('empty');
            }
        };
        // mobile action, used on smartphone instead of "changed"
        selectOnly = function () {
            var list = self.get();
            self.trigger('_m_change', list);
            if (list.length === 0) {
                self.trigger('empty');
            }
        };
        // apply selection
        apply = function (id, e, touchstart) {
            // range?
            if (isRange(e)) {
                // range selection
                self.selectRange(prev, id);
                // remember
                last = id;
            } else {
                // single selection
                if (isMarker(e)) {
                    mark(id);
                } else {
                    toggle(id);
                }
                // remember
                last = prev = id;
                lastValidIndex = getIndex(id);
            }
            if (!touchstart) {
                // event
                changed();
            } else if (isCheckbox(e) || mobileSelectMode) {
                // check if select mode
                // check if checkbox tap
                // else call apply again without touchstart
                e.preventDefault();
                selectOnly();
            } else {
                apply(id, e);
            }
        };

        selectFirst = function (e) {
            if (bHasIndex && observedItems.length) {
                var item = observedItems[0];
                clear(e);
                apply(item.data, e);
                self.trigger('select:first', item.data);
            }
        };

        selectPrevious = function (e) {
            if (bHasIndex) {
                var index = getIndex(last) - 1, item;
                if (index >= 0) {
                    item = observedItems[index];
                    clear(e);
                    apply(item.data, e);
                    self.trigger('select:previous', item.data);
                }
            }
        };

        selectLast = function (e) {
            if (bHasIndex && observedItems.length) {
                var index = observedItems.length - 1,
                    item = observedItems[index];
                clear(e);
                apply(item.data, e);
                self.trigger('select:last', item.data);
            }
        };

        selectNext = function (e) {
            if (bHasIndex) {
                var index = getIndex(last) + 1, item;
                if (index < observedItems.length) {
                    item = observedItems[index];
                    clear(e);
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
                    e.preventDefault();
                    if ($(e.target).hasClass('folder-options-badge dropdown-opened')) return;
                    // cursor up
                    if (e.metaKey || e.ctrlKey) {
                        selectFirst(e);
                    } else {
                        selectPrevious(e);
                    }
                    break;
                case 32:
                    // last is the current selected/focussed
                    if (options.markable) {
                        e.preventDefault();
                        toggle(last);
                    }
                    break;
                case 40:
                    e.preventDefault();
                    if ($(e.target).hasClass('folder-options-badge dropdown-opened')) return;
                    // cursor down
                    if (e.metaKey || e.crtlKey) {
                        selectLast(e);
                    } else {
                        selectNext(e);
                    }
                    break;
                case 9:
                    if (options.markable) {
                        clearMarks();
                    }
                    break;
                // [Del], [Backspace] or [fn+Backspace] (MacOS) > delete item
                case 8:
                case 46:
                    e.preventDefault();
                    self.trigger('selection:delete', self.get());
                    break;
                // no default
            }
        };

        clickHandler = function (e) {
            var node, key, id;
            if (!e.isDefaultPrevented()) {
                node = $(this);
                key = node.attr('data-obj-id');
                id = bHasIndex ? (observedItems[getIndex(key)] || {}).data : key;
                // checkbox click?
                if (id !== undefined && isCheckbox(e) && isSelectable(e)) {
                    apply(id, e);
                }
            }
        };

        dblClickHandler = function (e) {
            var node, key;
            if (!e.isDefaultPrevented()) {
                node = $(this);
                key = node.attr('data-obj-id');
                self.trigger('selection:doubleclick', key);
            }
        };

        mousedownHandler = function (e) {
            var node, key, id, handleMouseDown;
            // we check for isDefaultPrevented because elements inside .selectable
            // might also react on mousedown/click, e.g. folder tree open/close toggle
            if (!e.isDefaultPrevented()) {
                node = $(this);
                key = node.attr('data-obj-id');
                id = bHasIndex ? (observedItems[getIndex(key)] || {}).data : key;
                handleMouseDown = function () {
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
                };
                if (_.device('!smartphone')) {
                    // adding timeouts to avoid strange effect that occurs across different browsers.
                    // if we do too much inside these event handlers, the mousedown and mouseup events
                    // do not trigger a click. this still happens if timeout interval if too short,
                    // for example, 10 msecs. (see Bug 27794 - Sorting menu remains open)
                    setTimeout(handleMouseDown, 50);
                } else {
                    //no timeouts on smartphones otherwise mobile toolbars are drawn with no or previous selection see bug 34488
                    handleMouseDown();
                }
            }
        };

        mouseupHandler = function (e) {
            var node, key, id, handleMouseUp;
            if (!e.isDefaultPrevented()) {
                node = $(this);
                key = node.attr('data-obj-id');
                id = bHasIndex ? (observedItems[getIndex(key)] || {}).data : key;
                handleMouseUp = function () {
                    // exists?
                    if (id !== undefined) {
                        if (node.hasClass('pending-select') && isSelectable(e)) {
                            clear();
                            apply(id, e);
                        }
                    }
                    // remove helper classes
                    container.find('.pending-select').removeClass('pending-select');
                };
                if (_.device('!smartphone')) {
                    // see above (mousedownHandler)
                    setTimeout(handleMouseUp, 50);
                } else {
                    // see above (mousedownHandler)
                    handleMouseUp();
                }
            }
        };

        touchHandler = function (e) {
            var node, key, id;
            if (!e.isDefaultPrevented()) {
                node = $(this);
                key = node.attr('data-obj-id');
                id = bHasIndex ? (observedItems[getIndex(key)] || {}).data : key;

                // check if the touchstart was triggerd from a inline button or folder tree
                if (mobileSelectMode) {
                    apply(id, e, true);
                }
            }
        };

        getIndex = function (id) {
            return bHasIndex ? observedItemsIndex[self.serialize(id)] : -1;
        };

        getNode = function (id) {
            // Why we do the replacement regex stuff: Bug #24543 / #26915
            return $('.selectable[data-obj-id="' + self.serialize(id).replace(/\\\./g, '\\\\.') + '"]', container);
        };

        isSelected = function (id) {
            return selectedItems[self.serialize(id)] !== undefined;
        };

        fastSelect = function (id, node) {
            var key = self.serialize(id);
            selectedItems[key] = id;
            var $node = (node || getNode(key));
            // set focus?
            if (container.has(document.activeElement).length && options.tabFix !== false) $node.focus();
            return $node
                .addClass(self.classSelected)
                .attr({
                    'aria-selected': 'true',
                    'tabindex': options.tabFix !== false ? options.tabFix : null
                })
                .find('input.reflect-selection')
                .prop('checked', true)
                .end();
        };

        select = function (id, silent) {
            if (id) {
                fastSelect(id).intoViewport(options.scrollpane);
                last = id;
                lastIndex = getIndex(id);
                if (prev === empty) {
                    prev = id;
                    lastValidIndex = lastIndex;
                }
                if (silent !== true) {
                    self.trigger('select', self.serialize(id));
                }
            }
        };

        deselect = function (id) {
            var key = self.serialize(id);
            delete selectedItems[key];
            getNode(key)
                .removeClass(self.classSelected)
                .attr({
                    'aria-selected': 'false',
                    tabindex: options.tabFix !== false ? -1 : null
                })
                .find('input.reflect-selection').prop('checked', false);
            self.trigger('deselect', key);
        };

        toggle = function (id) {
            if (isSelected(id)) {
                deselect(id);
            } else {
                select(id);
            }
        };

        update = function (updateIndex) {
            if (container.is(':hidden')) return;

            updateIndex = updateIndex || false;
            if (updateIndex) self.clearIndex();

            // get nodes
            var nodes = $('.selectable:visible', container),
                i = 0, node = null;

            // clear
            nodes.removeClass(self.classSelected).find('input.reflect-selection').prop('checked', false);

            for (; i < nodes.length; i++) {

                node = nodes.eq(i);
                // is selected?
                var objID = node.attr('data-obj-id');
                if (updateIndex) {
                    self.addToIndex(objID);
                }
                if (isSelected(objID)) {
                    $('input.reflect-selection', node).prop('checked', true);
                    node.addClass(self.classSelected);
                }
            }
        };

        clear = function () {
            // clear hash
            selectedItems = {};
            // clear nodes
            container.find('.selectable.' + self.classSelected).removeClass(self.classSelected).attr({
                'aria-selected': 'false',
                'tabindex': options.tabFix !== false ? -1 : null
            });
            container.find('.selectable input.reflect-selection').prop('checked', false);
        };

        // mark option block
        if (options.markable) {
            var clearOrginal = clear, markedItem;

            this.classMarked = 'marked';

            // overwrite
            isMarker = function (e) {
                return multiple && e && (e.which === 38 || e.which === 40);
            };
            // clear wrapper
            clear = function (e) {
                // clear mark
                clearMarks();
                if (isMarker(e)) return;
                // call orignale clear
                clearOrginal(e);
            };
            fastMark = function (id, node) {
                var key = self.serialize(id);
                markedItem = id;
                var $node = (node || getNode(key));
                // set focus?
                if (container.has(document.activeElement).length && options.tabFix !== false) $node.focus();
                var guid = $node.attr('id') || _.uniqueId('option-');

                return $node
                        .addClass(self.classMarked)
                        .attr({
                            'tabindex': options.tabFix !== false ? options.tabFix : null,
                            id: guid
                        })
                        // apply a11y
                        // TODO: when descent attribute was set voiceover doesn't notifies user about changed selection when using 'select with space'
                        .parent('[role="listbox"]')
                        .attr('aria-activedescendant', guid)
                        .end();
            };
            mark = function (id, silent) {
                if (id) {
                    fastMark(id).intoViewport(options.scrollpane);
                    last = id;
                    lastIndex = getIndex(id);
                    if (prev === empty) {
                        prev = id;
                        lastValidIndex = lastIndex;
                    }
                    if (silent !== true) {
                        self.trigger('mark', self.serialize(id));
                    }
                }
            };
            clearMarks = function () {
                if (markedItem) {
                    var key = self.serialize(markedItem);
                    markedItem = undefined;
                    getNode(key)
                        .removeClass(self.classMarked)
                        .attr({
                            tabindex: options.tabFix !== false ? -1 : null
                        })
                        .parent('[role="listbox"]')
                        .removeAttr('aria-activedescendant');
                    markedItem = undefined;
                }
            };
        }

        /**
         * Serialize object to get a flat key
         */
        this.serialize = function (obj) {
            if (typeof obj === 'object') {
                return (obj.folder_id !== undefined) ? _.cid(obj) : obj.id;
            }
            return obj;
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
            var tmp = this.get(),
                hash = _.clone(selectedItems);

            // clear list
            clear();
            observedItems = new Array(all.length);
            observedItemsIndex = {};
            last = prev = empty;

            // reset index but ignore 'empty runs'
            if (all.length > 0) lastIndex = -1;

            // build index
            var i = 0, $i = all.length, data, cid, updateLast = true;
            for (; i < $i; i++) {
                data = all[i];
                cid = this.serialize(data);
                observedItems[i] = { data: data, cid: cid };
                observedItemsIndex[cid] = i;
                if (cid in hash && updateLast) {
                    lastValidIndex = lastIndex = i;
                    last = cid;
                    updateLast = false;
                }
            }

            $('.selectable', container).each(function () {
                var node = $(this),
                    cid = node.attr('data-obj-id');
                if (cid in hash) {
                    $('input.reflect-selection', node).prop('checked', true);
                    node.addClass(self.classSelected).attr({
                        'aria-selected': 'true',
                        'tabindex': options.tabFix !== false ? options.tabFix : null
                    });
                    if (options.tabFix !== false) {
                        node.focus();
                    }
                } else {
                    $('input.reflect-selection', node).prop('checked', false);
                    node.removeClass(self.classSelected).attr({
                        'aria-selected': 'false',
                        'tabindex': options.tabFix !== false ? -1 : null
                    });
                }
            });

            selectedItems = hash;

            // fire event?
            if (!_.isEqual(tmp, this.get())) changed();
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

        this.updateIndex = function () {
            update(true);
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
                if (cid in hash) return false;
                observedItemsIndex[cid] = index++;
                return true;
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
            var previous = this.get(),
                self = this,
                hash = {},
                updateLast = true;

            // clear
            clear();

            // reset last index
            lastIndex = -1;

            $('.selectable', container).each(function () {
                var node = $(this), cid = node.attr('data-obj-id');
                hash[cid] = node;
            });

            _(!list || _.isArray(list) ? list : [list]).each(function (elem, index) {
                var cid = self.serialize(elem), item, node;
                // existing node?
                if (cid in hash) {
                    if (typeof elem === 'string' && bHasIndex && (item = observedItems[getIndex(elem)]) !== undefined) {
                        node = fastSelect(item.data, hash[cid]);
                    } else {
                        node = fastSelect(elem, hash[cid]);
                    }
                    // put first item into viewport
                    if (index === 0) node.intoViewport(options.scrollpane);
                } else {
                    selectedItems[cid] = elem;
                }
                // update last / lastIndex
                if (updateLast) {
                    lastIndex = getIndex(cid);
                    last = cid;
                    updateLast = false;
                }
            });

            hash = null;

            // event?
            if (!_.isEqual(previous, this.get()) && silent !== true) changed();

            return this;
        };

        this.equals = function (list) {
            return _.isEqual(list, this.get());
        };

        this.selectRange = function (a, b) {

            var i, item, reverse;

            if (bHasIndex) {
                // get indexes
                a = getIndex(a);
                b = getIndex(b);
                reverse = a > b;
                // loop while keeping direction (see Bug 29047)
                for (i = a; reverse ? i >= b : i <= b; reverse ? i-- : i++) {
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
                // _(observedItems).each(function (item) {
                var i = 0, $i = observedItems.length, item;
                for (; i < $i; i++) {
                    item = observedItems[i];
                    if (i === 0 || i === ($i - 1)) {
                        select(item.data, true);
                    } else {
                        // fast & simple
                        selectedItems[item.cid] = item.data;
                    }
                }
                this.update();
                if (mobileSelectMode) {
                    selectOnly();
                } else {
                    changed();
                }
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

        this.selectIndex = function () {
            var item = observedItems[lastValidIndex];
            if (item !== undefined) {
                this.select(item.data);
            }
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
            return _.isEmpty(selectedItems);
        };

        this.contains = function (ids) {
            var list = [].concat(ids);
            return !!list.length && _(list).inject(function (memo, id) {
                id = _.isObject(id) ? self.serialize(id) : id;
                return memo && id in observedItemsIndex;
            }, true);
        };

        this.getLastIndex = function () {
            return lastValidIndex;
        };

        /**
         * Keyboard support
         */
        this.keyboard = function (con, flag) {
            // keyboard support (use keydown! IE does not react on keypress with cursor keys)
            $(con)[flag ? 'on' : 'off']('keydown', fnKey);
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
            } else if (mobileSelectMode) {
                selectOnly();
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

        this.setMobileSelectMode = function (state) {
            mobileSelectMode = state;
        };

        this.getMobileSelectMode = function () {
            return mobileSelectMode;
        };

        // bind general click handler
        container.on('contextmenu', function (e) { e.preventDefault(); })
            .on('mousedown', '.selectable', mousedownHandler)
            .on('mouseup', '.selectable', mouseupHandler)
            .on('click', '.selectable', clickHandler)
            .on('dblclick', '.selectable', dblClickHandler)
            .on('tap', '.selectable', touchHandler)
            .on('focus', '.selectable', function () {
                container.addClass('has-focus');
            })
            .on('blur', '.selectable', function () {
                _.delay(function () {
                    if (container.find(':focus').length === 0) {
                        container.removeClass('has-focus');
                    }
                }, 10);
            });

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

            function toggle() {
                this.trigger('click');
            }

            function over(e) {

                // avoid handling bubbling events
                if (e.isDefaultPrevented()) return;

                e.preventDefault();
                var arrow = $(this).find('.folder-arrow');

                // css hover doesn't work!
                $(this).addClass('dnd-over');

                if (arrow.length) {
                    clearTimeout(expandTimer);
                    expandTimer = setTimeout(toggle.bind(arrow), 1500);
                }
            }

            function out() {
                clearTimeout(expandTimer);
                $(this).removeClass('dnd-over');
            }

            //
            // Auto-Scroll
            //

            var scroll = (function () {

                var y = 0, timer = null;

                return {
                    move: function (e) {
                        y = e.pageY - $(this).offset().top;
                    },
                    out: function () {
                        clearInterval(timer);
                        timer = null;
                    },
                    over: function () {
                        if (timer) return;
                        var height = this.clientHeight;
                        timer = setInterval(function () {
                            var threshold = Math.round(y / height * 10) - 5,
                                sign = threshold < 0 ? -1 : +1,
                                abs = Math.abs(threshold);
                            if (abs > 2) this.scrollTop += sign * (abs - 2) * 2;
                        }.bind(this), 5);
                    }
                };

            }());

            function drag(e) {
                // unbind
                $(document).off('mousemove.dnd', drag);
                // create helper
                helper = $('<div class="drag-helper">');
                ext.point('io.ox/core/tk/draghelper').invoke('draw', helper,
                    new ext.Baton({
                        container: container,
                        data: data,
                        source: source,
                        dragMessage: options.dragMessage
                    }));
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
                    .on('mouseover.dnd', '.folder-tree', scroll.over)
                    .on('mouseout.dnd', '.folder-tree', scroll.out)
                    .on('mousemove.dnd', '.folder-tree', scroll.move)
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
                // stop auto-scroll
                scroll.out();
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
                // avoid multiple events on parent tree nodes
                if (e.isDefaultPrevented()) return;
                e.preventDefault();
                // process drop
                clearTimeout(expandTimer);
                var target = $(this).attr('data-obj-id') || $(this).attr('data-cid') || $(this).attr('data-id'),
                    baton = new ext.Baton({ data: data, dragType: options.dragType, dropzone: this, target: target });
                $(this).trigger('selection:drop', [baton]);
            }

            function resist(e) {
                var deltaX = Math.abs(e.pageX - e.data.x),
                    deltaY = Math.abs(e.pageY - e.data.y);
                if (deltaX > 15 || deltaY > 15) {
                    // get data now
                    data = self.unique(self.unfold());
                    // empty?
                    if (data.length === 0) {
                        var cid = source.attr('data-obj-id');
                        data = cid ? [_.cid(cid)] : [];
                    }
                    // check permissions - need 'delete' access for a move
                    var collection = new Collection(data);
                    collection.getProperties();
                    if (collection.isResolved() && !collection.has('delete')) {
                        $(document).off('mousemove.dnd mouseup.dnd');
                    } else {
                        // bind events
                        $('.dropzone').each(function () {
                            var node = $(this), selector = node.attr('data-dropzones');
                            (selector ? node.find(selector) : node).on('mouseup.dnd', drop);
                        });
                        $(document).off('mousemove.dnd').on('mousemove.dnd', drag);
                    }
                }
            }

            function start(e) {
                e.preventDefault();
                // remember source now
                source = $(this);
                // bind new events
                $(document)
                    .on('mousemove.dnd', { x: e.pageX, y: e.pageY }, resist)
                    .on('mouseup.dnd', stop);
                // prevent text selection and kills the focus
                if (!_.browser.IE) {
                    // Not needed in IE - See #27981
                    var selectable = $(e.target).closest(options.focus);
                    (options.focus && selectable.length ? selectable : container).focus();
                }
            }

            // drag & drop
            if (_.device('!touch')) {
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
