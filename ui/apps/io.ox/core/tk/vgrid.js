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

define('io.ox/core/tk/vgrid', ['io.ox/core/tk/selection', 'io.ox/core/event'], function (Selection, event) {

    'use strict';

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

        Row.prototype.update = function (data, index, id) {
            // loop over setters
            var i = 0, setters = this.set, $i = setters.length;
            for (; i < $i; i++) {
                setters[i].call(this.node, data, this.fields, index);
            }
            // set composite id?
            if (id !== undefined) {
                this.node.attr('data-obj-id', id);
            }
            return this;
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
            // first run
            firstRun = true,
            // inner container
            scrollpane = $('<div>').addClass('abs vgrid-scrollpane').appendTo(node),
            container = $('<div>').css({ position: 'relative', top: '0px' }).appendTo(scrollpane),
            // bottom toolbar
            fnToggleEditable = function (e) {
                    var grid = e.data.grid;
                    e.preventDefault();
                    grid.setEditable(!grid.getEditable());
                },
            toolbar = $('<div>').addClass('vgrid-toolbar')
                .append(
                    $('<a>', { href: '#' }).addClass('action-link').text('Edit')
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
            // multiplier defines how much detailed data is loaded
            mult = 1.5,
            // properties
            props = {},
            // shortcut
            isArray = _.isArray,
            // pending fetch
            pending = false,
            // edit mode
            editable = false,
            // private methods
            scrollToLabel,
            hScrollToLabel,
            paintLabels,
            processLabels,
            cloneRow,
            paint,
            resize,
            loadAll,
            init,
            getIndex,
            fnScroll;

        // add label class
        template.node.addClass('selectable');
        label.node.addClass('vgrid-label');

        // add dispatcher
        event.Dispatcher.extend(this);

        // selection
        Selection.extend(this, node);

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
            var i = 0, $i = labels.list.length, clone = null, obj, text = '';
            for (; i < $i; i++) {
                // get
                obj = labels.list[i];
                // draw
                clone = label.getClone();
                clone.update(all[obj.pos], obj.pos);
                text = clone.node.text();
                // meta data
                obj.top = i * labelHeight + obj.pos * itemHeight;
                obj.text = text;
                labels.index[obj.pos] = i;
                labels.textIndex[text] = i;
                // add node
                labels.nodes = labels.nodes.add(
                    clone.node.css({
                        top: obj.top + 'px'
                    })
                    .addClass('vgrid-label')
                    .data('label-index', i)
                );
                clone.node.appendTo(container);
            }
            clone = null;
        };

        cloneRow = function (template) {
            // get clone
            var clone = template.getClone();
            // add checkbox for edit mode
            clone.node.prepend(
                $('<div>').addClass('vgrid-cell-checkbox')
                .append(
                    $('<input>', { type: 'checkbox' }).addClass('reflect-selection')
                )
            );
            return clone;
        };

        cloneRow = (function () {

            var check = $('<div>')
                .addClass('vgrid-cell-checkbox')
                .append(
                    $('<input>', { type: 'checkbox' })
                    .addClass('reflect-selection')
                );

            return function (template) {
                // get clone
                var clone = template.getClone();
                // add checkbox for edit mode
                clone.node.prepend(check.clone());
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

            // keep positive
            offset = Math.max(0, offset);

            // pending?
            var def;
            if (pending) {
                // enqueue latest paint
                def = $.Deferred();
                pending = [offset, def];
                return def;
            } else {
                pending = true;
            }

            // continuation
            var cont = function (data) {

                // pending?
                if (isArray(pending)) {
                    // process latest paint
                    offset = pending[0];
                    def = pending[1];
                    pending = false;
                    paint(offset).done(def.resolve);
                    return;
                } else {
                    pending = false;
                }

                // vars
                var i, $i, shift = 0, j = '', row,
                    defaultClassName = template.getDefaultClassName(),
                    tmp = new Array(data.length),
                    node, clone;

                // get shift (top down)
                for (j in labels.index) {
                    if (offset > j) {
                        shift++;
                    }
                }

                // loop
                for (i = 0, $i = data.length; i < $i; i++) {
                    // shift?
                    if (labels.index[offset + i] !== undefined) {
                        shift++;
                    }
                    // no data? (happens if list request fails)
                    if (!data[i]) {
                        pool[i] = clone = cloneRow(template);
                    }
                    row = pool[i];
                    row.appendTo(container);
                    // reset class name
                    node = row.node[0];
                    node.className = defaultClassName + ' ' + ((offset + i) % 2 ? 'odd' : 'even');
                    if (data[i]) {
                        // update fields
                        row.update(data[i], offset + i, self.selection.serialize(data[i]));
                    }
                    node.style.top = shift * labelHeight + (offset + i) * itemHeight + 'px';
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
                bounds.bottom = offset + numRows - numVisible;
            };

            // get item

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

        loadAll = function () {

            function apply(list) {
                // changed?
                if (list.length !== all.length || !_.isEqual(all, list)) {
                    // store
                    all = list;
                    // initialize selection
                    self.selection.init(all);
                    // adjust container height and hide it
                    container.css({
                        height: (numLabels * labelHeight + all.length * itemHeight) + 'px'
                    });
                    // process labels
                    processLabels();
                    paintLabels();
                }
                // trigger event
                self.trigger('ids-loaded');
                // paint items
                var offset = getIndex(node.scrollTop()) - (numRows - numVisible);
                return paint(offset);
            }

            if (all.length === 0) {
                // be busy
                container.css({ visibility: 'hidden' }).parent().busy();
            }

            function handleFail() {
                // clear grid
                apply([]);
                // inform user
                container.hide().parent().idle().append(
                    $.fail('Connection lost.', function () {
                        container.show();
                        loadAll();
                    })
                );
            }

            // get all IDs
            var load = loadIds[currentMode] || loadIds.all,
                def = $.Deferred();

            load.call(self)
                .done(function (list) {
                    if (isArray(list)) {
                        apply(list)
                            .always(function () {
                                // stop being busy
                                container.css({ visibility: '' }).parent().idle();
                            })
                            .done(function () {
                                // select first or previous selection
                                self.selection.selectSmart();
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
            // load all IDs
            return loadAll();
        };

        getIndex = function (top) {
            var i = 0, $i = all.length, y = 0;
            for (; i < $i && y < top; i++) {
                if (labels.index[i] !== undefined) {
                    y += labelHeight;
                }
                y += itemHeight;
            }
            return i;
        };

        fnScroll = function () {
            var top = scrollpane.scrollTop(),
                index = getIndex(top);
            // checks bounds
            if (index >= bounds.bottom - 2) {
                // below bottom
                paint(index - (numVisible / 2 >> 0));
            } else if (index < bounds.top + 2 && bounds.top !== 0) {
                // above top
                paint(index - numVisible);
            }
        };

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

        this.repaint = function () {
            var offset = getIndex(node.scrollTop()) - (numRows - numVisible);
            return paint(offset);
        };

        this.refresh = function () {
            // load all (if painted before)
            return firstRun ? $.when : loadAll();
        };

        this.getMode = function () {
            return currentMode;
        };

        this.setMode = function (mode) {
            // we don't check for currentModule but always refresh
            // otherwise subsequent search queries are impossible
            // if this function gets called too often, fix it elsewhere
            currentMode = mode;
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

        this.prop = function (key, value) {
            if (value !== undefined) {
                props[key] = value;
            } else {
                return props[key];
            }
        };
    };

    // make Template accessible
    VGrid.Template = Template;

    return VGrid;
});
