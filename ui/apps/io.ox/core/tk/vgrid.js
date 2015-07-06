/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/vgrid', [
    'io.ox/core/extensions',
    'io.ox/core/tk/selection',
    'io.ox/core/event',
    'gettext!io.ox/core'
], function (ext, Selection, Events, gt) {

    'use strict';

    var DONE = $.when();

    /**
     * Template class
     * @returns {Template }
     */
    function Template(o) {

        // default options
        o = _.extend({
            tagName: 'div',
            defaultClassName: 'vgrid-cell',
            //container to draw templates for height measuring
            //normally the the actual vgrid container is used(so css styles are applied correct)
            tempDrawContainer: document.body
        }, o);

        var template = [],

            getHeight = function (node) {
                node.css('visibility', 'hidden').show()
                    .appendTo(o.tempDrawContainer);
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
            if (isEmpty) {
                return 0;
            } else {
                // not sure if template ever contains more than one element
                if (template[0].getHeight) {
                    return template[0].getHeight();
                } else {
                    return getHeight(this.getClone().node);
                }
            }

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

        Row.prototype.update = function (data, index, id, prev, grid) {
            // loop over setters
            var i = 0, setters = this.set, $i = setters.length, rets = [];
            for (; i < $i; i++) {
                rets.push(setters[i].call(this.node, data, this.fields, index, prev, grid) || DONE);
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
            row.node.add(row.node.find('div, span, p, td')).not('.ignoreheight').each(function () {
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

    var CHUNK_SIZE = 200,
        CHUNK_GRID = 40;

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

    var onResize = function (e) {
        e.preventDefault();
        var left = $(this).closest('.leftside'),
            right = left.siblings('.rightside'),
            base = e.pageX - left.width(),
            limitX = $(document).width() - 250;
        $(document).on({
            'mousemove.resize': function (e) {
                var width = Math.max(250, Math.min(e.pageX, limitX) - base);
                left.css('width', width);
                right.css('left', width);
            },
            'mouseup.resize': function () {
                $(this).off('mousemove.resize mouseup.resize');
            }
        });
    };

    var VGrid = function (target, options) {

        options = _.extend({
            simple: true,
            editable: true,
            multiple: true,
            draggable: true,
            dragType: '',
            selectFirst: true,
            toolbarPlacement: 'top',
            secondToolbar: false,
            swipeLeftHandler: false,
            swipeRightHandler: false,
            selectSmart: true,
            containerLabel: gt('Multiselect')
        }, options || {});

        if (options.settings) {
            // never show selectboxes on startup on mobile.
            // Selectmode on mobile intercepts cell actions
            options.editable = _.device('smartphone') ? false : options.settings.get('vgrid/editable', true);
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
            // inner container / added role="presentation" because screen reader runs amok
            scrollpane = $('<div class="abs vgrid-scrollpane">').appendTo(node),
            ariaAttributesContainer = function () {
                var obj = {};
                if (options.multiple) obj['aria-multiselectable'] = 'true';
                obj['aria-label'] = options.containerLabel;
                return obj;
            },
            container = $('<div class="vgrid-scrollpane-container f6-target" role="listbox">').attr(ariaAttributesContainer()).css({ position: 'relative', top: '0px' }).appendTo(scrollpane),
            // mobile select mode
            mobileSelectMode = false,
            // bottom toolbar
            ignoreCheckbox = false,

            fnToggleCheckbox = function (e) {
                if (ignoreCheckbox) return;
                var grid = e.data.grid, checked = $(this).prop('checked');
                if (checked) {
                    grid.selection.selectAll();
                    // Bugfix 38498
                    _.defer(function () { container.focus(); });
                    updateSelectAll(grid.selection.get());
                } else {
                    grid.selection.clear();
                    if (_.device('smartphone')) {
                        self.selection.trigger('_m_change', []);
                    }
                }
            },

            updateSelectAll = function (list) {
                //list can be larger if threads are expanded in the grid
                var check = (list.length >= 1) && (list.length >= all.length);

                ignoreCheckbox = true;
                node.find('.select-all input').prop('checked', check);
                ignoreCheckbox = false;
            },

            fnToggleEditable = function (e) {
                e.preventDefault();
                var grid = e.data.grid;
                grid.setEditable(!grid.getEditable());

                if (_.device('smartphone')) {
                    // set selectmode On/Off
                    mobileSelectMode = !mobileSelectMode;
                    self.selection.setMobileSelectMode(mobileSelectMode);
                    // clear selection and trigger mobile change on selection
                    // to remove changed toolbar
                    grid.selection.clear();
                    self.selection.trigger('_m_change', []);
                }
            },

            topbar = $('<div>').addClass('vgrid-toolbar generic-toolbar ' + (options.toolbarPlacement === 'top' ? 'bottom border-top' : 'top border-bottom'))
                .appendTo(node),
            toolbar = $('<div>').addClass('vgrid-toolbar generic-toolbar ' + (options.toolbarPlacement === 'top' ? 'top border-bottom' : 'bottom border-top'))
                .attr({
                    role: 'toolbar',
                    //#. toolbar with 'select all' and 'sort by'
                    'aria-label': gt('Item list options')
                })
                .append(
                    // show checkbox
                    options.showCheckbox === false ?
                        [] :
                        $('<label class="select-all">')
                            .append(
                                $('<input type="checkbox" value="true" tabindex="1">').attr('title', gt('Select all'))
                            )
                            .on('change', 'input', { grid: this }, fnToggleCheckbox),
                    // show toggle
                    options.showToggle === false ?
                        [] :
                        $('<a>', { href: '#', tabindex: 1, role: 'button', 'aria-label': gt('Toggle checkboxes') })
                            .addClass('select-all-toggle')
                            .append($('<i class="fa fa-th-list">'))
                            .on('click', { grid: this }, fnToggleEditable)
                )
                .prependTo(node),
            // item template
            template = new Template({ tempDrawContainer: container }),
            // label template
            label = new Template({ tempDrawContainer: container }),
            // item pool
            pool = [],
            // heights
            itemHeight = 0,
            labelHeight = 0,
            // counters
            numVisible = 0,
            numRows = 0,
            numLabels = 0,
            // current mode
            currentMode = 'all',
            // default all & list request
            loadIds = {
                all: function () {
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
            // Backbone prop Model
            props = new Backbone.Model({ editable: options.editable || false }),
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
            preSelection,

            loader = new ChunkLoader(function (subset) {
                var load = loadData[currentMode] || loadData.all;
                return load.call(self, subset);
            });

        // model events
        props.on('change', function (model) {
            var changed = model.changedAttributes(),
                key = _.keys(changed)[0],
                value = _.values(changed)[0];
            // be compatible to old school events without backbone
            self.trigger('beforechange:prop', key, model.previousAttributes()[key], value);
            self.trigger('beforechange:prop:' + key, model.previousAttributes()[key], value);
            self.trigger('change:prop', key, value, model.previousAttributes()[key]);
            self.trigger('change:prop:' + key, value, model.previousAttributes()[key]);
            responsiveChange = true;
        });

        // make resizalbe (unless touch device)
        if (!_.device('touch')) {
            node.append(
                $('<div class="resizebar">').on('mousedown', onResize)
            );
        }

        // add label class
        this.multiselectId = _.uniqueId('multi-selection-message-');
        template.node.addClass('selectable').attr('aria-describedby', this.multiselectId);
        label.node.addClass('vgrid-label').attr({ 'aria-hidden': 'true' });

        // fix mobile safari bug (all content other than position=static is cut off)
        if (_.device('iOS && Safari')) {
            container.css('webkitTransform', 'translate3d(0, 0, 0)');
        }

        // IE focus fix for bug 31617.
        // "The focus event does not bubble in Internet Explorer"
        // http://api.jquery.com/focus/
        if (_.device('IE')) {
            container.on('click', function () {
                var top = scrollpane.scrollTop();
                container.focus();
                scrollpane.scrollTop(top);
            });
        }

        // add event hub
        Events.extend(this);

        // selection
        Selection.extend(this, scrollpane, { draggable: options.draggable, dragType: options.dragType });

        // swipe delegate
        if (_.device('touch')) {
            if (options.swipeLeftHandler) {
                $(target).on('swipeleft', '.selectable', function (e) {
                    if (currentMode !== 'search' && !mobileSelectMode) {
                        var node = $(this),
                            key = node.attr('data-obj-id');

                        options.swipeLeftHandler(e, key, node);
                    }
                });
            }
            if (options.swipeRightHandler) {
                $(target).on('swiperight', '.selectable', function (e) {
                    if (currentMode !== 'search' && !mobileSelectMode) {
                        var node = $(this),
                            key = node.attr('data-obj-id');
                        options.swipeRightHandler(e, key, node);
                    }
                });
            }
        }
        // due to performance reasons we don't scrol but jump
        scrollToLabel = function (index, silent) {
            var obj = labels.list[index];
            if (obj !== undefined) {
                scrollpane.scrollTop(obj.top);
                if (silent !== true) {
                    // use select instead of set to udpate lastIndex internally
                    self.selection.set(all[obj.pos]).setLastIndex(all[obj.pos]);
                }
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
                defs = defs.concat(clone.update(all[obj.pos], obj.pos, '', all[obj.pos - 1] || {}, self));
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
                var i, obj, node, top,
                    //isVisible is only needed in for loop; visible selectors are slow, avoid them if possible
                    isVisible = $i > 0 ? container.show().is(':visible') : undefined,
                    height;
                for (i = 0; i < $i; i++) {
                    obj = labels.list[i];
                    obj.top = cumulatedLabelHeight + obj.pos * itemHeight;
                    node = labels.nodes.eq(i);
                    node.css({ top: obj.top + 'px' });
                    height = (isVisible && node.outerHeight(true)) || labelHeight;
                    cumulatedLabelHeight += (obj.height = height);
                }
                // add tail?
                if (options.tail) {
                    tail = options.tail.call(self, all.slice()) || $();
                    top = all.length * itemHeight + cumulatedLabelHeight;
                    container.append(tail.css({ top: top + 'px' }));
                    cumulatedLabelHeight += tail.outerHeight(true);
                }
                node = clone = defs = null;
                return cumulatedLabelHeight;
            });
        };

        cloneRow = (function () {

            var createCheckbox = function () {
                    var fields = {};
                    this.prepend(
                        fields.div = $('<div class="vgrid-cell-checkbox">').append(
                            fields.label = $('<label>').append(
                                fields.input = $('<input type="checkbox" class="reflect-selection" aria-hidden="true">').attr('tabindex', -1)
                            )
                        )
                    );
                    return { checkbox: fields };
                };

            return function (template) {
                // get clone
                return template.getClone(function () {
                    // add checkbox for edit mode
                    if (!options.checkboxDisabled) {
                        return createCheckbox.call(this);
                    }
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

                    row.node.attr({ role: 'option', 'aria-posinset': offset + i + 1 });
                    node = row.node[0];
                    node.className = defaultClassName + ' ' + ((offset + i) % 2 ? 'odd' : 'even');
                    // update fields
                    row.update(data[i], offset + i, self.selection.serialize(data[i]), data[i - 1] || {}, self);
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

            function fail(offset) {
                // continue with dummy chunk
                cont({ data: new Array(numRows), offset: offset, length: numRows });
            }

            return function (offset) {

                if (!initialized) {
                    return;
                }

                // keep positive
                offset = Math.max(offset >> 0, 0);
                if (offset === currentOffset) {
                    return DONE;
                } else {
                    currentOffset = offset;
                }

                // get all items
                return loader.load(offset, all).then(
                    function (chunk) {
                        if (chunk && chunk.data) {
                            cont(chunk);

                            if (preSelection) {
                                // select element which has been set as preselected
                                self.selection.set(preSelection);
                                preSelection = undefined;
                            }
                        }
                        // no fail handling here otherweise we get empty blocks
                        // just because of scrolling
                    },
                    function () {
                        // real failure
                        fail(offset);
                    }
                );
            };

        }());

        resize = function () {
            // get num of rows
            numVisible = Math.max(1, ((node.height() / itemHeight) >> 0) + 2);
            numRows = CHUNK_SIZE;
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

            // store
            all = list;
            currentOffset = null;
            // initialize selection
            self.selection.init(all);
            // labels
            initLabels();

            // empty?
            scrollpane.find('.io-ox-center').remove().end();
            if (list.length === 0 && loaded) {
                detachPool();
                self.selection.trigger('change', []);
                scrollpane.append(
                    $.fail(emptyMessage ?
                        emptyMessage(self.getMode()) :
                        //#. list is empty / no items
                        gt.pgettext('vgrid', 'Empty')
                    )
                );
            }

            // trigger event
            if (!quiet) {
                self.trigger('change:ids', all);
            }

            // get proper offset
            var top, index, offset;
            top = scrollpane.scrollTop();
            index = getIndex(top);
            offset = index - (numVisible >> 1);

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
                ids = _(ids).map(deserialize);
                var selectionChanged = !self.selection.equals(ids), cid, index;
                if (selectionChanged && !self.selection.getMobileSelectMode()) {
                    // set
                    self.selection.set(ids);
                }
                if (selectionChanged || changed) {
                    // scroll to first selected item
                    cid = _(ids).first();
                    index = self.selection.getIndex(cid) || 0;
                    if (!isVisible(index)) {
                        // not at the very top
                        setIndex(index - 2);
                    }
                }
            }

            function autoSelectAllowed() {
                return $(document).width() > 700;
            }

            return function updateSelection(changed) {

                if (!all.length) {
                    self.selection.clear();
                    return;
                }

                var list = self.selection.get();
                var ids = list.length ? _(list).map(self.selection.serialize) : getIds();

                if (ids.length) {
                    if (self.selection.contains(ids)) {
                        // if ids are given and still part of the selection
                        // we can restore that state
                        //console.debug('case #1 restoreHashSelection()', ids);
                        restoreHashSelection(ids, changed);
                        return;
                    } else {
                        _.url.hash('id', null);
                    }
                }

                if (autoSelectAllowed()) {
                    var i = self.select();
                    if (_.isNumber(i)) {
                        // select by index
                        //console.debug('case #2 select() >> index', i);
                        self.selection.set(all[i]);
                        if (!isVisible(i)) {
                            // not at the very top
                            setIndex(i - 2);
                        }
                    } else if (_.isArray(i)) {
                        // select by object (cid)
                        //console.debug('case #3 select() >> object (cid)', i);
                        if (self.selection.contains(i)) {
                            self.selection.set(i);
                        } else {
                            self.selection.clear();
                        }
                    } else if (options.selectFirst) {
                        //console.debug('case #4 select() >> first', i);
                        self.selection.selectFirst();
                    } else {
                        self.selection.clear();
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
                            var hasChanged = !_.isEqual(all, list);
                            updateSelection(hasChanged);
                            // global event
                            ox.trigger('grid:stop', _.clone(props.toJSON()), list);
                        });
                } else {
                    console.warn('VGrid.all() must provide an array!');
                    return $.Deferred().reject();
                }
            }

            return function () {
                // global event
                ox.trigger('grid:start', _.clone(props.toJSON()));
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
            currentOffset = null;
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
                // reset select-all checkbox
                updateSelectAll(list);
                // prevent to long URLs
                var id = _(list.length > 50 ? list.slice(0, 1) : list).map(function (obj) {
                    return self.selection.serialize(obj);
                }).join(',');
                _.url.hash('id', id !== '' ? id : null);
                // propagate DOM-based select event?
                if (list.length >= 1) {
                    node.trigger('select', [list]);
                }
            })
            .on('select:first', function () {
                setIndex(0);
            })
            .on('select:last', function () {
                setIndex(all.length - 1);
            });

        // public methods

        this.setApp = function (app) {
            this.app = app;
            return this.app;
        };

        this.getApp = function () {
            return this.app;
        };

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

        /*
         * Set an element as preselected. Use this to select an element what will be added to
         * the VGrid with the next list/all request. After drawing, this element will be selected.
         */
        this.setPreSelection = function (data) {
            preSelection = data;
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

        this.repaint = _.mythrottle(function () {
            var offset = currentOffset || 0;
            currentOffset = null;
            // reset loader
            loader.reset();
            // cannot hand over deferred due to debounce;
            // don't remove debouce cause repaint is likely wired with APIs' refresh.list
            // which may be called many times in a row
            paint(offset);
        }, 100);

        this.clear = function () {
            return apply([], true);
        };

        this.refresh = function (force) {
            // load all (if painted before)
            return !firstRun ? loadAll() : (force === true ? this.paint() : DONE);
        };

        this.pending = function () {
            responsiveChange = true;
            this.busy();
            return this;
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

        this.scrollToLabelText = function (e, silent) {
            // get via text index
            var text = e.data ? e.data.text : e,
                index = labels.textIndex[text];
            if (index !== undefined) {
                scrollToLabel(index, silent);
            }
        };

        this.scrollTop = function () {
            return scrollpane.scrollTop();
        };

        this.keyboard = function (flag) {
            this.selection.keyboard(scrollpane, flag);
        };

        this.getToolbar = function () {
            return toolbar;
        };

        this.getTopbar = function () {
            return topbar;
        };

        this.getEditable = function () {
            return this.prop('editable');
        };
        this.getMobileSelectMode = function () {
            return mobileSelectMode;
        };

        this.setEditable = function (flag) {
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

        this.props = props;

        this.prop = function (key, value) {
            if (key !== undefined) {
                if (value !== undefined) {
                    var previous = props.get(key);
                    if (value !== previous) {

                        this.trigger('beforechange:prop', key, value, previous);
                        this.trigger('beforechange:prop:' + key, value, previous);
                        props.set(key, value, { silent: true });
                        this.trigger('change:prop', key, value, previous);
                        this.trigger('change:prop:' + key, value, previous);
                        responsiveChange = true;
                    }
                    return this;
                } else {
                    return props.get(key);
                }
            } else {
                return props.toJSON();
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
            // return shallow copy
            return all.slice();
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
            // no need to update if not yet initialized
            if (!initialized) return;
            init();
            this.repaint();
        };

        this.getToolbar = function () {
            return toolbar;
        };

        this.showToolbar = function (state) {
            if (state === true) {
                toolbar.show();
            } else {
                toolbar.hide();
            }
        };

        this.showTopbar = function (state) {
            if (state === true) {
                topbar.show();
                node.addClass(options.toolbarPlacement === 'top' ? 'top-toolbar' : 'bottom-toolbar');
            } else {
                topbar.hide();
                node.removeClass('top-toolbar bottom-toolbar');
            }
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
        }

        // process some options on toolbars
        if (options.toolbarPlacement !== 'none') {
            node.addClass(options.toolbarPlacement === 'top' ? 'top-toolbar' : 'bottom-toolbar');
            if (options.secondToolbar && _.device('!smartphone')) {
                node.addClass(options.toolbarPlacement === 'top' ? 'bottom-toolbar' : 'top-toolbar');
            }
        }

        if (options.hideTopbar) {
            this.showTopbar(false);
        }

        if (options.hideToolbar) {
            this.showToolbar(false);
        }

        this.on('change:prop:folder', function (e, value, previous) {
            // reset chunk loader
            loader.reset();
            if (previous !== undefined) {
                this.scrollTop(0);
                self.selection.resetLastIndex();
            }
        });

        this.on('change:mode', function () {
            // reset chunk loader
            loader.reset();
            // reset selection
            this.scrollTop(0);
            self.selection.clear();
            self.selection.resetLastIndex();
        });

        container.on('focus', function () {
            if (!options.multiple && options.selectSmart) {
                self.selection.selectSmart();
            }
        });

        // default implementation if hash cannot be mapped
        // returns index
        this.select = (function () {

            var hash = {};

            // restore persistent settings
            if (options.settings) {
                _(options.settings.get('vgrid/previous', {})).each(function (cid, folder) {
                    hash[folder] = [_.cid(cid)];
                });
            }

            self.selection.on('change', function (e, list) {
                var folder = self.prop('folder');
                if (options.settings && list.length <= 1) {
                    // we only store the current selection if its length is max 1
                    options.settings.set(['vgrid', 'previous', folder], _.cid(list[0])).save();
                    // always store in fluent hash
                    hash[folder] = list;
                }
            });

            self.on('beforechange:prop:folder', function (e, value, previous) {
                if (previous !== undefined) {
                    hash[previous] = self.selection.get();
                }
            });

            self.selection.on('clear', function () {
                var folder = self.prop('folder');
                delete hash[folder];
            });

            return function () {
                var folder = self.prop('folder');
                return (currentMode === 'all' && hash[folder]) || null;
            };
        }());

        this.focus = function () {
            container.focus();
        };
    };

    // make Template accessible
    VGrid.Template = Template;

    return VGrid;
});
