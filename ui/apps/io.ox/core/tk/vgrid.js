/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/vgrid', ['io.ox/core/tk/selection', 'io.ox/core/event'], function (Selection, Events) {

    'use strict';

    var DONE = $.when();

    /**
     * Template class
     * @returns {Template}
     */
    function Template(options) {

        var template = [],

            // default options
            o = _.extend({
                tagName: 'div',
                defaultClassName: 'vgrid-cell'
            }),

            getHeight = function (node) {
                node.css('visibility', 'hidden').show()
                    .appendTo(document.body);
                var height = Math.max(1, node.outerHeight(true));
                node.remove();
                return height;
            },

            isEmpty = true;

        this.node = $('<' + o.tagName + '>')
            .addClass(o.defaultClassName);

        this.add = function (obj) {
            if (obj && obj.build) {
                template.push(obj);
                isEmpty = false;
            }
        };

        this.isEmpty = function () {
            return isEmpty;
        };

        this.getHeight = function () {
            return isEmpty ? 0 : getHeight(this.getClone().node);
        };

        this.getDefaultClassName = function () {
            return o.defaultClassName;
        };

        // internal class
        function Row(node) {
            this.node = node;
            this.fields = {};
            this.set = [];
            this.detached = true;
        }

        Row.prototype.update = function (data, index, id, prev) {
            // loop over setters
            var i = 0, setters = this.set, $i = setters.length, rets = [];
            for (; i < $i; i++) {
                rets.push(setters[i].call(this.node, data, this.fields, index, prev) || DONE);
            }
            // set composite id?
            if (id !== undefined) {
                this.node.attr('data-obj-id', id);
            }
            return rets;
        };

        Row.prototype.appendTo = function (target) {
            if (this.detached) {
                this.node.appendTo(target);
                this.detached = false;
            }
            return this;
        };

        Row.prototype.detach = function () {
            this.node.detach();
            this.node.removeAttr('data-obj-id');
            this.detached = true;
            return this;
        };

        this.getClone = function () {
            var i = 0, $i = template.length, tmpl,
                row = new Row(this.node.clone());
            // build
            for (; i < $i; i++) {
                tmpl = template[i];
                _.extend(row.fields, tmpl.build.call(row.node) || {});
                row.set.push(tmpl.set || $.noop);
            }
            // clean up template to avoid typical mistakes - once!
            row.node.add(row.node.find('div, span, p, td')).each(function () {
                var node = $(this);
                if (node.children().length === 0 && node.text() === '') {
                    node.text('\u00A0');
                }
            });
            row.node.find('img').each(function () {
                if (this.style.width === '' || this.style.height === '') {
                    console.error('Image has no width/height. Set to (0, 0):', this);
                    this.style.width = this.style.height = '0px';
                }
            });
            // remember class name
            o.defaultClassName = row.node[0].className;
            // return row
            return row;
        };
    }

    var VGrid = function (target) {

        // target node
        var node = $(target).empty().addClass('vgrid'),
            // reference for private functions
            self = this,
            // states
            initialized = false,
            firstRun = true,
            firstAutoSelect = true,
            paused = false,
            // inner container
            scrollpane = $('<div>').addClass('abs vgrid-scrollpane').appendTo(node),
            container = $('<div>').css({ position: 'relative', top: '0px' }).appendTo(scrollpane),
            // bottom toolbar
            fnToggleEditable = function (e) {
                    e.preventDefault();
                    var grid = e.data.grid;
                    grid.setEditable(!grid.getEditable());
                },
            toolbar = $('<div>').addClass('vgrid-toolbar')
                .append(
                    $('<a>', { href: '#' })
                    .css('float', 'left')
                    .append($('<i class="icon-th-list">'))
                    .on('click', { grid: this }, fnToggleEditable)
                )
                .appendTo(node),
            // item template
            template = new Template(),
            // label template
            label = new Template(),
            // item pool
            pool = [],
            // heights
            itemHeight = 0,
            labelHeight = 0,
            // counters
            minRows = 20,
            numVisible = 0,
            numRows = 0,
            numLabels = 0,
            // current mode
            currentMode = 'all',
            // default all & list request
            loadIds = {
                all: function (con) {
                    return $.Deferred().resolve([]);
                }
            },
            loadData = {
                all: function (ids) {
                    return $.Deferred().resolve(ids);
                }
            },
            // data index (contains ALL ids)
            all = [],
            // labels
            labels = { nodes: $() },
            // bounds of currently visible area
            bounds = { top: 0, bottom: 0 },
            // multiplier defines how much detailed data is loaded (must be >= 2)
            // touch devices (esp. ipad) need higher multiplier due to momentum scrolling
            mult = Modernizr.touch ? 6 : 3,
            // properties
            props = {},
            // shortcut
            isArray = _.isArray,
            // edit mode
            editable = false,
            // private methods
            scrollToLabel,
            hScrollToLabel,
            paintLabels,
            processLabels,
            cloneRow,
            currentOffset = null,
            paint,
            resize,
            loadAll,
            init,
            isVisible,
            setIndex,
            getIndex,
            fnScroll,
            desirealize;

        // add label class
        template.node.addClass('selectable');
        label.node.addClass('vgrid-label');

        // fix mobile safari bug (all content other than position=static is cut off)
        if (Modernizr.touch) {
            container.css('webkitTransform', 'translate3d(0, 0, 0)');
        }

        // add event hub
        Events.extend(this);

        // selection
        Selection.extend(this, scrollpane);

        scrollToLabel = function (index) {
            var obj = labels.list[index];
            if (obj !== undefined) {
                scrollpane
                    .stop()
                    .animate({
                        scrollTop: obj.top
                    }, 250, function () {
                        self.selection.set(all[obj.pos]);
                        obj = null;
                    });
            }
        };

        hScrollToLabel = function (e) {
            var index = $(this).data('label-index') || 0,
                inc = e.type === 'dblclick' ? 1 : 0;
            scrollToLabel(index + inc);
        };

        paintLabels = function () {
            // loop
            var i = 0, $i = labels.list.length, clone = null,
                obj, cumulatedLabelHeight = 0, text = '', defs = [];
            for (; i < $i; i++) {
                // get
                obj = labels.list[i];
                // draw
                clone = label.getClone();
                clone.node.addClass('vgrid-label').data('label-index', i);
                defs.concat(clone.update(all[obj.pos], obj.pos, '', all[obj.pos - 1] || {}));
                text = clone.node.text();
                // add node
                labels.nodes = labels.nodes.add(clone.node.appendTo(container));
                // meta data
                obj.text = text;
                labels.index[obj.pos] = i;
                labels.textIndex[text] = i;
            }
            // reloop to get proper height
            return $.when.apply($, defs).pipe(function () {
                var i, obj, node;
                for (i = 0; i < $i; i++) {
                    obj = labels.list[i];
                    node = labels.nodes.eq(i);
                    obj.top = cumulatedLabelHeight + obj.pos * itemHeight;
                    node.css({ top: obj.top + 'px' });
                    cumulatedLabelHeight += (obj.height = node.outerHeight(true) || labelHeight);
                }
                node = clone = defs = null;
                return cumulatedLabelHeight;
            });
        };

        cloneRow = (function () {

            var guid = 0,
                createCheckbox = function () {
                    var id = 'grid_cb_' + (guid++);
                    return $('<div>')
                        .addClass('vgrid-cell-checkbox')
                        .append(
                            $('<label>', { 'for': id })
                            .append(
                                $('<input>', { type: 'checkbox', id: id }).addClass('reflect-selection')
                            )
                        );
                };

            return function (template) {
                // get clone
                var clone = template.getClone();
                // add checkbox for edit mode
                clone.node.prepend(createCheckbox());
                return clone;
            };
        }());

        processLabels = function () {
            // remove existing labels
            labels.nodes.remove();
            // reset
            labels = {
                nodes: $(),
                list: [],
                index: {},
                textIndex: {}
            };
            numLabels = 0;
            // loop
            var i = 0, $i = all.length, current, tmp = '';
            for (; i < $i; i++) {
                tmp = self.requiresLabel(i, all[i], current);
                if (tmp !== false) {
                    labels.list.push({ top: 0, text: '', pos: i });
                    numLabels++;
                    current = tmp;
                }
            }
        };

        paint = function (offset) {

            if (!initialized) {
                return;
            }

            // keep positive
            offset = Math.max(offset, 0);

            if (offset === currentOffset) {
                return DONE;
            } else {
                currentOffset = offset;
            }

            // pending?
            var def;
            if (paint.pending) {
                // enqueue latest paint
                paint.pending = [offset, (def = $.Deferred())];
                return def;
            } else {
                paint.pending = true;
            }

            // continuation
            var cont = function (data) {

                // pending?
                if (isArray(paint.pending)) {
                    // process latest paint
                    offset = paint.pending[0];
                    def = paint.pending[1];
                    paint.pending = false;
                    //currentOffset = offset;
                    paint(offset).done(def.resolve);
                    return;
                } else {
                    paint.pending = false;
                }

                // vars
                var i, $i, shift = 0, j = '', row,
                    defaultClassName = template.getDefaultClassName(),
                    tmp = new Array(data.length),
                    node, index;

                // get shift (top down)
                for (j in labels.index) {
                    if (offset > j) {
                        index = labels.index[j];
                        shift += labels.list[index].height || labelHeight;
                    }
                }

                // loop
                for (i = 0, $i = data.length; i < $i; i++) {
                    // shift?
                    index = labels.index[offset + i];
                    if (index !== undefined) {
                        shift += labels.list[index].height || labelHeight;
                    }
                    // no data? (happens if list request fails)
                    if (!data[i]) {
                        pool[i] = cloneRow(template);
                    }
                    row = pool[i];
                    row.appendTo(container);
                    // reset class name
                    node = row.node[0];
                    node.className = defaultClassName + ' ' + ((offset + i) % 2 ? 'odd' : 'even');
                    if (data[i]) {
                        // update fields
                        row.update(data[i], offset + i, self.selection.serialize(data[i]), data[i - 1] || {});
                    }
                    node.style.top = shift + (offset + i) * itemHeight + 'px';
                    tmp[i] = row.node;
                }

                // any nodes left to clear?
                if ($i < numRows) {
                    for (; i < numRows; i++) {
                        pool[i].detach();
                        pool[i].node[0].className = defaultClassName;
                    }
                }

                // update selection
                self.selection.update();
                tmp = null;

                // remember bounds
                bounds.top = offset;
                bounds.bottom = offset + numRows;
            };

            // get all items
            var load = loadData[currentMode] || loadData.all,
                subset = all.slice(offset, offset + numRows);

            return load.call(self, subset)
                .done(cont)
                .fail(function () {
                    // continue with dummy array
                    cont(new Array(subset.length));
                });
        };

        resize = function () {
            // get num of rows
            numVisible = Math.max(1, ((node.height() / itemHeight) >> 0) + 2);
            numRows = Math.max(numVisible * mult >> 0, minRows);
            // prepare pool
            var  i = 0, clone, frag = document.createDocumentFragment();
            for (; i < numRows; i++) {
                if (i >= pool.length) {
                    // get clone
                    clone = cloneRow(template);
                    frag.appendChild(clone.node[0]);
                    // add to pool
                    pool.push(clone);
                } else {
                    // (re)add to container
                    frag.appendChild(pool[i].node[0]);
                }
            }
            // detach remaining templates
            for (; i < pool.length; i++) {
                pool[i].node.detach();
            }
            // add fragment to container
            container[0].appendChild(frag);
            frag = null;
        };

        function initLabels() {
            // process labels first (determines numLabels), then set height
            processLabels();
            return paintLabels().done(function (cumulatedLabelHeight) {
                container.css({
                    height: (cumulatedLabelHeight + all.length * itemHeight) + 'px'
                });
            });
        }

        function apply(list, quiet) {
            // changed?
            if (list.length !== all.length || !_.isEqual(all, list)) {
                // store
                all = list;
                currentOffset = null;
                // initialize selection
                self.selection.init(all);
                // labels
                initLabels();
            }
            // trigger event
            if (!quiet) {
                self.trigger('ids-loaded change:ids', all);
            }
            // paint items
            var offset = currentOffset || (getIndex(node.scrollTop()) - (numRows - numVisible));
            return paint(offset);
        }


        desirealize = function (cid) {
            var c = cid.split(/\./);
            return { folder_id: c[0], id: c[1], recurrence_position: c[2] };
        };

        loadAll = function () {

            if (paused) {
                return $.when();
            }

            if (all.length === 0) {
                // be busy
                container.css({ visibility: 'hidden' }).parent().busy();
            }

            function handleFail() {
                // clear grid
                apply([]);
                // inform user
                container.hide().parent().idle()
                    .find('.io-ox-fail').parent().remove().end().end()
                    .append(
                        $.fail('Could not load content.', function () {
                            container.show();
                            loadAll();
                        })
                    );
            }

            // get all IDs
            var load = loadIds[currentMode] || loadIds.all,
                def = $.Deferred(),
                changed;

            load.call(self)
                .done(function (list) {
                    if (isArray(list)) {
                        changed = list.length !== all.length || !_.isEqual(all, list);
                        apply(list)
                            .always(function () {
                                // stop being busy
                                container.css({ visibility: '' }).parent().idle();
                            })
                            .done(function () {
                                // use url?
                                if (_.url.hash('id') !== undefined) {
                                    var ids = _.url.hash('id').split(/,/), cid, index, selectionChanged;
                                    // convert ids to objects first - avoids problems with
                                    // non-existing items that cannot be resolved in selections
                                    ids = _(ids).map(desirealize);
                                    selectionChanged = !self.selection.equals(ids);
                                    if (selectionChanged) {
                                        // set
                                        self.selection.set(ids);
                                        firstAutoSelect = false;
                                    }
                                    //changed = true;
                                    //console.log('selectionChanged', selectionChanged, 'changed', changed);
                                    if (selectionChanged || changed) {
                                        // scroll to first selected item
                                        cid = _(ids).first();
                                        index = self.selection.getIndex(cid) || 0;
                                        if (!isVisible(index)) {
                                            setIndex(index - 2); // not at the very top
                                        }
                                    }
                                } else if (firstAutoSelect) {
                                    // select first or previous selection
                                    self.selection.selectSmart();
                                    firstAutoSelect = false;
                                }
                            })
                            .done(def.resolve)
                            .fail(def.reject);
                    } else {
                        console.warn('VGrid.all() must provide an array!');
                        def.fail(def.reject);
                    }
                })
                .fail(handleFail);

            return def;
        };

        init = function () {
            // get sizes
            itemHeight = template.getHeight();
            labelHeight = label.getHeight();
            // resize
            resize();
            initialized = true;
            // load all IDs
            return loadAll();
        };

        // is index visible?
        isVisible = function (index) {
            var top = scrollpane.scrollTop(),
                height = scrollpane.height();
            return index >= getIndex(top) && index < (getIndex(top + height) - 1);
        };

        // set scrollTop via index
        setIndex = function (index) {
            var i = 0, $i = Math.min(Math.max(0, index), all.length), j = 0, y = 0, label;
            for (; i < $i; i++) {
                label = labels.list[j];
                if (label && label.pos === i) {
                    y += label.height || labelHeight;
                    j++;
                }
                y += itemHeight;
            }
            scrollpane.scrollTop(y);
        };

        // get index via scrollTop
        getIndex = function (top) {
            var i = 0, $i = all.length, j = 0, y = 0, label;
            for (; i < $i && y < top; i++) {
                label = labels.list[j];
                if (label && label.pos === i) {
                    y += label.height || labelHeight;
                    j++;
                }
                y += itemHeight;
            }
            return i;
        };

        fnScroll = _.throttle(function () {
            if (paint.pending === false) {
                var top = scrollpane.scrollTop(),
                    index = getIndex(top);
                // checks bounds
                if (index >= bounds.bottom - numVisible - 2) {
                    // below bottom (scroll down)
                    paint(index - (numVisible >> 1));
                } else if (index < bounds.top + 2 && bounds.top !== 0) {
                    // above top (scroll up)
                    paint(index - numVisible * 1.5, 'above');
                }
            }
        }, 100);

        // selection events
        this.selection
            .on('change', function (e, list) {
                var id = _(list).map(function (obj) {
                        return self.selection.serialize(obj);
                    }).join(',');
                _.url.hash('id', id !== '' ? id : null);
            })
            .on('select:first', function () {
                setIndex(0);
            })
            .on('select:last', function () {
                setIndex(all.length - 1);
            });


        // public methods

        this.setAllRequest = function (mode, fn) {
            // parameter shift?
            if (_.isFunction(mode)) {
                fn = mode;
                mode = 'all';
            }
            loadIds[mode] = fn;
        };

        this.setListRequest = function (mode, fn) {
            // parameter shift?
            if (_.isFunction(mode)) {
                fn = mode;
                mode = 'all';
            }
            loadData[mode] = fn;
        };

        this.addTemplate = function (obj) {
            template.add(obj);
        };

        this.addLabelTemplate = function (obj) {
            label.add(obj);
        };

        this.requiresLabel = function (/* data */) {
            return false;
        };

        this.paint = function () {
            if (firstRun) {
                scrollpane.on('selectstart', false)
                    .on('scroll', fnScroll)
                    .on('click dblclick', '.vgrid-label', hScrollToLabel);
                firstRun = false;
            }
            return init();
        };

        this.repaintLabels = function () {
            return initLabels();
        };

        this.repaint = function () {
            var offset = currentOffset || 0;
            currentOffset = null;
            return paint(offset);
        };

        this.clear = function () {
            return paused ? $.when() : apply([], true);
        };

        this.refresh = function () {
            // load all (if painted before)
            return firstRun ? DONE : loadAll();
        };

        this.getMode = function () {
            return currentMode;
        };

        this.setMode = function (mode) {
            // we don't check for currentModule but always refresh
            // otherwise subsequent search queries are impossible
            // if this function gets called too often, fix it elsewhere
            currentMode = mode;
            _.url.hash('id', null);
            firstAutoSelect = true;
            return this.refresh();
        };

        this.getId = function (data) {
            // default id
            return { folder_id: data.folder_id, id: data.id };
        };

        this.getData = function (index) {
            return index !== undefined ? all[index] : all;
        };

        this.contains = function (data) {
            var sel = this.selection, id = sel.serialize(data), i = 0, $i = (all || []).length;
            for (; i < $i; i++) {
                if (id === sel.serialize(all[i])) {
                    return true;
                }
            }
            return false;
        };

        this.getLabels = function () {
            return labels;
        };

        this.scrollToLabelText = function (e) {
            // get via text index
            var text = e.data ? e.data.text : e,
                index = labels.textIndex[text];
            if (index !== undefined) {
                scrollToLabel(index);
            }
        };

        this.scrollTop = function () {
            return scrollpane.scrollTop();
        };

        this.keyboard = function (flag) {
            this.selection.keyboard(flag);
        };

        this.getToolbar = function () {
            return toolbar;
        };

        this.getEditable = function () {
            return editable;
        };

        this.setEditable = function (flag) {
            if (flag) {
                node.addClass('editable');
                this.selection.setEditable(true);
                editable = true;
            } else {
                node.removeClass('editable');
                this.selection.setEditable(false);
                editable = false;
            }
        };

        this.setMultiple = function (flag) {
            this.selection.setMultiple(flag);
            toolbar[flag ? 'show' : 'detach']();
        };

        this.prop = function (key, value) {
            if (key !== undefined) {
                if (value !== undefined) {
                    props[key] = value;
                    this.trigger('change:prop', key, value);
                    this.trigger('change:prop:' + key, value);
                    return this;
                } else {
                    return props[key];
                }
            } else {
                return props;
            }
        };

        this.scrollTop = function (t) {
            return t !== undefined ? scrollpane.scrollTop(t) : scrollpane.scrollTop();
        };

        this.getContainer = function () {
            return container;
        };

        this.setDeserialize = function (fn) {
            if (_.isFunction(fn)) {
                desirealize = fn;
            }
        };

        this.pause = function () {
            paused = true;
            return self;
        };

        this.resume = function () {
            paused = false;
            return self;
        };

        this.isVisible = isVisible;
        this.setIndex = setIndex;
        this.getIndex = getIndex;
    };

    // make Template accessible
    VGrid.Template = Template;

    return VGrid;
});
