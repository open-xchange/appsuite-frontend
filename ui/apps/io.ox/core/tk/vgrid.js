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

define('io.ox/core/tk/vgrid',
    ['io.ox/core/tk/selection',
     'io.ox/core/event',
     'gettext!io.ox/core'
    ], function (Selection, Events, gt) {

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

        this.getClone = function (prebuild) {
            var i = 0, $i = template.length, tmpl,
                row = new Row(this.node.clone());
            // pre build
            if (prebuild) {
                _.extend(row.fields, prebuild.call(row.node) || {});
            }
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
                    node.text(_.noI18n('\u00A0'));
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

    var CHUNK_SIZE = 100,
        CHUNK_GRID = 20;

    var ChunkLoader = function (listRequest) {

        var instance = null;

        function Instance() {

            var current = -1;

            this.load = function (offset, all) {
                // round offset
                offset = (offset && Math.max(0, Math.floor(offset / CHUNK_GRID) * CHUNK_GRID)) || 0;
                // nothing to do?
                if (all.length === 0 || offset === current) return $.Deferred().resolve(null);
                // mark as current
                current = offset;
                // fetch data
                return listRequest(all.slice(offset, offset + CHUNK_SIZE)).then(function (data) {
                    // only return data if still current offset
                    try {
                        return current === offset ? { data: data, offset: offset, length: data.length } : null;
                    } finally {
                        data = all = null;
                    }
                });
            };

            this.reset = function () {
                current = -1;
            };
        }

        this.load = function () {
            return instance.load.apply(instance, arguments);
        };

        this.reset = function () {
            if (instance) instance.reset();
            instance = new Instance();
        };

        this.reset();
    };

    var VGrid = function (target, options) {

        options = _.extend({
            simple: true,
            editable: true,
            multiple: true,
            draggable: true,
            dragType: '',
            selectFirst: true
        }, options || {});

        if (options.settings) {
            options.editable = options.settings.get('vgrid/editable', true);
        }

        // mobile
        if (_.device('small')) {
            // override options, no toggles and no multiple selection for the moment
            options.showToggle = false;
            options.multiple = false;
        }

        // target node
        var node = $(target).empty().addClass('vgrid'),
            // reference for private functions
            self = this,
            // states
            initialized = false,
            loaded = false,
            responsiveChange = true,
            firstRun = true,
            // inner container
            scrollpane = $('<div>').addClass('abs vgrid-scrollpane').appendTo(node),
            container = $('<div>').css({ position: 'relative', top: '0px' }).appendTo(scrollpane),
            // bottom toolbar
            fnToggleEditable = function (e) {
                    e.preventDefault();
                    var grid = e.data.grid;
                    grid.setEditable(!grid.getEditable());
                },
            fnShowAll = function (e) {
                    var grid = e.data.grid;
                    if ($(this).prop('checked')) {
                        grid.selection.selectAll();
                    } else {
                        grid.selection.selectFirst();
                    }
                },
            toolbar = $('<div>').addClass('vgrid-toolbar')
                .append(
                    // select all
                    options.showSelectAll === true ?
                        $('<input type="checkbox">')
                        .css({ 'float': 'left', 'margin-right': '13px' })
                        .on('change', { grid: this }, fnShowAll) :
                        $(),
                    // show toggle
                    options.showToggle === false ?
                        $() :
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
            // optional tail cell
            tail = $(),
            // bounds of currently visible area
            bounds = { top: 0, bottom: 0 },
            // multiplier defines how much detailed data is loaded (must be >= 2)
            // touch devices (esp. ipad) need higher multiplier due to momentum scrolling
            mult = Modernizr.touch ? 6 : 3,
            // properties
            props = { editable: options.editable || false },
            // shortcut
            isArray = _.isArray,
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
            deserialize,
            emptyMessage,

            loader = new ChunkLoader(function (subset) {
                var load = loadData[currentMode] || loadData.all;
                return load.call(self, subset);
            });

            // __chunkLoader = new ChunkedLoader({
            //     all: function () {
            //         return all;
            //     },
            //     fetch: function (subset, options) {
            //         var load = loadData[options.mode] || loadData.all;
            //         return load.call(self, subset);
            //     },
            //     MAX_CHUNK: options.maxChunkSize || 200,
            //     MIN_CHUNK: options.minChunkSize || 50
            // });

        // add label class
        template.node.addClass('selectable');
        label.node.addClass('vgrid-label');

        // fix mobile safari bug (all content other than position=static is cut off)
        if (_.device('iOS && Safari')) {
            container.css('webkitTransform', 'translate3d(0, 0, 0)');
        }

        // add event hub
        Events.extend(this);

        // selection
        Selection.extend(this, scrollpane, { draggable: options.draggable, dragType: options.dragType });

        // due to performance reasons we don't scrol but jump
        scrollToLabel = function (index) {
            var obj = labels.list[index];
            if (obj !== undefined) {
                scrollpane.scrollTop(obj.top);
                self.selection.set(all[obj.pos]);
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
                defs = defs.concat(clone.update(all[obj.pos], obj.pos, '', all[obj.pos - 1] || {}));
                text = clone.node.text();
                // convert Umlauts
                text = text.replace(/[ÄÀÁÂÃÄÅ]/g, 'A')
                    .replace(/[ÖÒÓÔÕÖ]/g, 'O')
                    .replace(/[ÜÙÚÛÜ]/g, 'U');
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
                    obj.top = cumulatedLabelHeight + obj.pos * itemHeight;
                    node = labels.nodes.eq(i);
                    node.css({ top: obj.top + 'px' });
                    cumulatedLabelHeight += (obj.height = node.outerHeight(true) || labelHeight);
                }
                // add tail?
                if (options.tail) {
                    tail = options.tail.call(self, all.slice()) || $();
                    tail.css({ top: ($i === 0 ? all.length * itemHeight : cumulatedLabelHeight) + 'px' })
                        .appendTo(container);
                    cumulatedLabelHeight += tail.outerHeight(true);
                }
                node = clone = defs = null;
                return cumulatedLabelHeight;
            });
        };

        cloneRow = (function () {

            var guid = 0,
                createCheckbox = function () {
                    var id = 'grid_cb_' + (guid++), fields = {};
                    this.prepend(
                        fields.div = $('<div class="vgrid-cell-checkbox">').append(
                            fields.label = $('<label>').append(
                                fields.input = $('<input type="checkbox" class="reflect-selection">')
                            )
                        )
                    );
                    return { checkbox: fields };
                };

            return function (template) {
                // get clone
                return template.getClone(function () {
                    // add checkbox for edit mode
                    return createCheckbox.call(this);
                });
            };
        }());

        processLabels = function () {
            // remove existing labels
            labels.nodes.remove();
            tail.remove();
            // reset
            labels = {
                nodes: $(),
                list: [],
                index: {},
                textIndex: {}
            };
            numLabels = 0;
            // loop
            var i = 0, $i = all.length + 1, current = '', tmp = '';
            for (; i < $i; i++) {
                tmp = self.requiresLabel(i, all[i], current, $i);
                if (tmp !== false) {
                    labels.list.push({ top: 0, text: '', pos: i });
                    numLabels++;
                    current = tmp;
                }
            }
        };

        function detachPoolItem(index, defaultClassName) {
            pool[index].detach();
            pool[index].node[0].className = defaultClassName || template.getDefaultClassName();
        }

        function detachPool() {
            var i = 0, $i = pool.length, defaultClassName = template.getDefaultClassName();
            for (; i < $i; i++) {
                detachPoolItem(i, defaultClassName);
            }
        }

        paint = (function () {

            // calling this via LFO, so that we always get the latest data
            function cont(chunk) {
                // vars
                var data = chunk.data, offset = chunk.offset,
                    i, $i, shift = 0, j = '', row,
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

                // remove undefined data
                for (i = 0, $i = data.length; i < $i;) {
                    if (!data[i]) {
                        data.splice(i, 1);
                        $i--;
                    } else {
                        i++;
                    }
                }

                // loop
                for (i = 0, $i = data.length; i < $i; i++) {
                    // shift?
                    index = labels.index[offset + i];
                    if (index !== undefined) {
                        shift += labels.list[index].height || labelHeight;
                    }
                    row = pool[i];
                    row.appendTo(container);
                    // reset class name
                    node = row.node[0];
                    node.className = defaultClassName + ' ' + ((offset + i) % 2 ? 'odd' : 'even');
                    // update fields
                    row.update(data[i], offset + i, self.selection.serialize(data[i]), data[i - 1] || {});
                    node.style.top = shift + (offset + i) * itemHeight + 'px';
                    tmp[i] = row.node;
                }

                // any nodes left to clear?
                if ($i < numRows) {
                    for (; i < numRows; i++) {
                        detachPoolItem(i, defaultClassName);
                    }
                }

                // update selection (just to get css classes back)
                self.selection.update();
                tmp = null;

                // remember bounds
                bounds.top = offset;
                bounds.bottom = offset + chunk.length;
            }

            return function (offset) {

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

                // get all items
                return loader.load(offset, all)
                    .done(function (chunk) {
                        if (chunk !== null) cont(chunk);
                    })
                    .fail(function () {
                        // continue with dummy array
                        cont(new Array(numRows));
                    });

                // var lfo = _.lfo(cont, offset);
                // return chunkLoader.load(offset, numRows, { mode: currentMode })
                //     .done(lfo)
                //     .fail(function () {
                //         // continue with dummy array
                //         lfo(new Array(numRows));
                //     });
            };

        }());

        resize = function () {
            // get num of rows
            numVisible = Math.max(1, ((node.height() / itemHeight) >> 0) + 2);
            numRows = CHUNK_SIZE; //Math.max(numVisible * mult >> 0, minRows);
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
            // empty?
            scrollpane.find('.io-ox-center').remove().end();
            if (list.length === 0 && loaded) {
                detachPool();
                scrollpane.append(
                    $.fail(emptyMessage ? emptyMessage(self.getMode()) : gt('Empty'))
                );
            }
            // trigger event
            if (!quiet) {
                self.trigger('change:ids', all);
            }
            // get proper offset
            var top, index, offset;
            if (currentOffset !== null) {
                offset = currentOffset;
            } else {
                top = scrollpane.scrollTop();
                index = getIndex(top);
                offset = index - (numVisible >> 1);
            }
            return paint(offset);
        }

        // might be overwritten
        deserialize = function (cid) {
            return _.cid(cid);
        };

        var updateSelection = (function () {

            function getIds() {
                var id = _.url.hash('id');
                return id !== undefined ? id.split(/,/) : [];
            }

            function restoreHashSelection(ids, changed) {
                // convert ids to objects first - avoids problems with
                // non-existing items that cannot be resolved in selections
                // console.debug('case #1:', ids);
                ids = _(ids).map(deserialize);
                var selectionChanged = !self.selection.equals(ids), cid, index;
                if (selectionChanged) {
                    // set
                    self.selection.set(ids);
                }
                if (selectionChanged || changed) {
                    // scroll to first selected item
                    cid = _(ids).first();
                    index = self.selection.getIndex(cid) || 0;
                    if (!isVisible(index)) {
                        setIndex(index - 2); // not at the very top
                    }
                }
            }

            function autoSelectAllowed() {
                return $(document).width() > 700;
            }

            return function updateSelection(changed) {

                if (!all.length) return;

                var ids = getIds();

                if (ids.length) {
                    if (self.selection.contains(ids)) {
                        // if ids are given and still part of the selection
                        // we can restore that state
                        restoreHashSelection(ids, changed);
                        return;
                    } else {
                        self.selection.clear();
                    }
                }

                if (autoSelectAllowed()) {
                    var i = self.select();
                    if (_.isNumber(i)) {
                        // select by index
                        self.selection.set(all[i]);
                        if (!isVisible(i)) {
                            setIndex(i - 2); // not at the very top
                        }
                    }
                    else if (_.isArray(i)) {
                        // select by object (cid)
                        self.selection.set(i);
                    }
                    else if (options.selectFirst) {
                        self.selection.selectFirst();
                    }
                }
            };

        }());

        loadAll = (function () {

            function fail(list) {
                // is detailed error message enabled
                list = list.categories === 'PERMISSION_DENIED' ? list : {};
                list = isArray(list) ? _.first(list) : list;
                // clear grid
                apply([]);
                // inform user
                container.hide().parent().idle()
                    .find('.io-ox-fail').parent().remove().end().end()
                    .append(
                        $.fail(list.error || gt('Could not load this list'), function () {
                            container.show();
                            loadAll();
                        })
                    );
            }

            function success(list) {

                // mark as loaded
                loaded = true;
                responsiveChange = false;

                // always reset loader since header data (e.g. flags) might have changed
                loader.reset();

                if (isArray(list)) {
                    return apply(list)
                        .always(function () {
                            self.idle();
                        })
                        .done(function () {
                            var changed = !_.isEqual(all, list);
                            updateSelection(list.length !== all.length || changed);
                        });
                } else {
                    console.warn('VGrid.all() must provide an array!');
                    return $.Deferred().reject();
                }
            }

            return function () {
                // get all IDs
                if (responsiveChange || all.length === 0) self.busy();
                var load = loadIds[currentMode] || loadIds.all;
                return load.call(self).then(_.lfo(success), _.lfo(fail));
            };
        }());

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
        }, 50);

        // selection events
        this.selection
            .on('change', function (e, list) {
                // prevent to long URLs
                var MAXSELECTIONSAVE = 50,
                    id = _(list.slice(0, MAXSELECTIONSAVE)).map(function (obj) {
                        return self.selection.serialize(obj);
                    }).join(',');
                _.url.hash('id', id !== '' ? id : null);
                // propagate DOM-based select event?
                if (list.length >= 1) {
                    node.trigger('select', list);
                }
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

        this.updateSettings = function (type, value) {
            if (options.settings) {
                options.settings.set('vgrid/' + type, value).save();
            }
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

        this.busy = function () {
            // remove error messages & hide container
            scrollpane.find('.io-ox-center').remove();
            container.css({ visibility: 'hidden' }).parent().busy();
            return this;
        };

        this.idle = function () {
            _.defer(function () { container.show().css({ visibility: '' }).parent().idle(); });
            return this;
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

        this.repaint = _.debounce(function () {
            var offset = currentOffset || 0;
            currentOffset = null;
            // reset loader
            loader.reset();
            // cannot hand over deferred due to debounce;
            // don't remove debouce cause repaint is likely wired with APIs' refresh.list
            // which may be called many times in a row
            paint(offset);
        }, 100, true);

        this.clear = function () {
            return apply([], true);
        };

        this.refresh = function (force) {
            // load all (if painted before)
            return !firstRun ? loadAll() : (force === true ? this.paint() : DONE);
        };

        this.getMode = function () {
            return currentMode;
        };

        this.setMode = function (mode) {
            // we don't check for currentModule but always refresh
            // otherwise subsequent search queries are impossible
            // if this function gets called too often, fix it elsewhere
            var previous = currentMode;
            currentMode = mode;
            _.url.hash('id', null);
            responsiveChange = true;
            this.trigger('change:mode', currentMode, previous);
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
            return this.prop('editable');
        };

        this.setEditable = function (flag, selector) {
            if (options.multiple === true) {
                if (flag) {
                    node.addClass('editable');
                    this.selection.setEditable(true, options.simple ? '.vgrid-cell-checkbox' : '.vgrid-cell');
                } else {
                    node.removeClass('editable');
                    this.selection.setEditable(false);
                }
                this.prop('editable', flag);
                this.updateSettings('editable', flag);
            }
        };

        this.setMultiple = function (flag) {
            console.warn('deprecated', flag);
        };

        this.option = function (key, value) {
            if (key !== undefined) {
                if (value !== undefined) {
                    var previous = options[key];
                    if (value !== previous) {
                        this.trigger('beforechange:option', key, value, previous);
                        this.trigger('beforechange:option:' + key, value, previous);
                        options[key] = value;
                        this.trigger('change:option', key, value, previous);
                        this.trigger('change:option:' + key, value, previous);
                        responsiveChange = true;
                    }
                    return this;
                } else {
                    return options[key];
                }
            } else {
                return options;
            }
        };

        this.prop = function (key, value) {
            if (key !== undefined) {
                if (value !== undefined) {
                    var previous = props[key];
                    if (value !== previous) {
                        this.trigger('beforechange:prop', key, value, previous);
                        this.trigger('beforechange:prop:' + key, value, previous);
                        props[key] = value;
                        this.trigger('change:prop', key, value, previous);
                        this.trigger('change:prop:' + key, value, previous);
                        responsiveChange = true;
                    }
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
                deserialize = fn;
            }
        };

        this.getIds = function () {
            return all.slice(); // return shallow copy
        };

        this.isVisible = isVisible;
        this.setIndex = setIndex;
        this.getIndex = getIndex;

        this.setEmptyMessage = function (fn) {
            emptyMessage = fn;
        };

        this.updateTemplates = function () {
            _(pool).each(function (node) {
                node.detach();
            });
            pool = [];
            init();
            this.repaint();
        };

        // apply options
        if (options.multiple) {
            if (options.editable) {
                this.setEditable(true);
            }
            this.selection.setMultiple(true);
            toolbar.show();
        } else {
            this.selection.setMultiple(false);
            //toolbar.detach(); // makes no sense to disable because the toolbar is used for sorting, too
        }

        if (options.toolbarPlacement !== 'none') {
            node.addClass(options.toolbarPlacement === 'top' ? 'top-toolbar' : 'bottom-toolbar');
        }

        this.on('change:prop:folder', function (e, value, previous) {
            // reset chunk loader
            loader.reset();
            if (previous !== undefined) {
                this.scrollTop(0);
                self.selection.resetLastIndex();
            }
        });

        this.on('change:mode', function (e, value, previous) {
            // reset chunk loader
            loader.reset();
            // reset selection
            this.scrollTop(0);
            self.selection.clear();
            self.selection.resetLastIndex();
        });

        // default implementation if hash cannot be mapped
        // returns index
        this.select = (function () {

            var hash = {};

            self.on('beforechange:prop:folder', function (e, value, previous) {
                if (previous !== undefined) {
                    hash[previous] = self.selection.get();
                }
            });

            return function () {
                var folder = self.prop('folder');
                //console.log('this.select', folder, hash[folder] || null, 'hash', hash);
                return (currentMode === 'all' && hash[folder]) || null;
            };
        }());
    };

    // make Template accessible
    VGrid.Template = Template;

    return VGrid;
});
