/**
 *
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
 *
 */

define("io.ox/core/tk/vgrid", ["io.ox/core/tk/selection", "io.ox/core/event"], function (Selection, event) {

    "use strict";
    
    /**
     * Template class
     * @returns {Template}
     */
    function Template(options) {

        var template = [],
            
            // default options
            o = _.extend({
                tagName: "div",
                defaultClassName: "vgrid-cell"
            }),
            
            getHeight = function (node) {
                node.css("visibility", "hidden").show()
                    .appendTo(document.body);
                var height = Math.max(1, node.outerHeight(true));
                node.remove();
                return height;
            };
        
        this.node = $("<" + o.tagName + ">").addClass(o.defaultClassName);

        this.add = function (obj) {
            if (obj && obj.build) {
                template.push(obj);
            }
        };

        this.getHeight = function () {
            return getHeight(this.getClone().node);
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
                this.node.attr("data-ox-id", id);
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
            this.node.removeAttr("data-ox-id");
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
            // clean up template to avoid typical mistakes
            row.node.add(row.node.find("div, span, p, td")).each(function () {
                var node = $(this);
                if (node.children().length === 0) {
                    if (node.text() === "") {
                        node.text("\u00A0");
                    }
                }
            });
            row.node.find("img").each(function () {
                if (this.style.width === "" || this.style.height === "") {
                    console.warn("Image has no width/height. Set to (0, 0):", this);
                    this.style.width = this.style.height = "0px";
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
        var node = $(target).empty().addClass("vgrid").bind("selectstart", false),
            // inner container
            container = $("<div>").css({ position: "relative", top: "0px" }).appendTo(node),
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
            minRows = 100,
            numVisible = 0,
            numRows = 0,
            numLabels = 0,
            // current mode
            currentMode = "all",
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
            mult = 3,
            // reference for private functions
            self = this,
            // shortcut
            isArray = _.isArray,
            // pending fetch
            pending = false,
            // private methods
            scrollToLabel,
            paintLabels,
            processLabels,
            paint,
            resize,
            loadAll,
            init,
            getIndex,
            fnScroll;
    
        // add label class
        template.node.addClass("selectable");
        label.node.addClass("vgrid-label");
        
        // add dispatcher
        event.Dispatcher.extend(this);
        
        // selection
        Selection.extend(this, node);
        
        scrollToLabel = function (e) {
            var obj = labels.list[e.data || e];
            if (obj !== undefined) {
                node.stop().animate({
                    scrollTop: obj.top
                }, 250);
            }
        };
        
        paintLabels = function () {
            // loop
            var i = 0, $i = labels.list.length, clone = null, obj, text = "";
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
                        top: obj.top + "px"
                    })
                    .addClass("vgrid-label")
                    .bind("click", i, scrollToLabel)
                    .bind("dblclick", i + 1, scrollToLabel)
                );
                clone.node.appendTo(container);
            }
            clone = null;
        };
        
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
            var i = 0, $i = all.length, current, tmp = "";
            for (; i < $i; i++) {
                tmp = self.requiresLabel(i, all[i], current);
                if (tmp !== false) {
                    labels.list.push({ top: 0, text: "", pos: i });
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
                var i, $i, shift = 0, j = "", row,
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
                        pool[i] = clone = template.getClone();
                    }
                    row = pool[i];
                    row.appendTo(container);
                    // reset class name
                    node = row.node[0];
                    node.className = defaultClassName + " " + ((offset + i) % 2 ? "odd" : "even");
                    if (data[i]) {
                        // update fields
                        row.update(data[i], offset + i, self.selection.serialize(data[i]));
                    }
                    node.style.top = shift * labelHeight + (offset + i) * itemHeight + "px";
                    tmp[i] = row.node;
                }
                
                // any nodes left to clear?
                if ($i < numRows) {
                    for (; i < numRows; i++) {
                        pool[i].detach();
                        pool[i].node[0].className = defaultClassName;
                        //node.style.top = "-1000px";
                        //node.removeAttribute("data-ox-id");
                        node.className = defaultClassName;
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
            
            return load(subset)
                .done(cont)
                .fail(function () {
                    // continue with dummy array
                    cont(new Array(subset.length));
                });
        };
        
        resize = function () {
            // get num of rows
            numVisible = Math.max(1, ((node.height() / itemHeight) >> 0) + 2);
            numRows = Math.max(numVisible * mult, minRows);
            // prepare pool
            var  i = 0, clone;
            for (; i < numRows; i++) {
                if (i >= pool.length) {
                    // get clone
                    clone = template.getClone();
                    clone.node.appendTo(container);
                    // add to pool
                    pool.push(clone);
                } else {
                    // (re)add to container
                    pool[i].node.appendTo(container);
                }
            }
            // detach remaining templates
            for (; i < pool.length; i++) {
                pool[i].node.detach();
            }
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
                        height: (numLabels * labelHeight + all.length * itemHeight) + "px"
                    });
                    // process labels
                    processLabels();
                    paintLabels();
                }
                // trigger event
                self.trigger("ids-loaded");
                // paint items
                var offset = getIndex(node.scrollTop()) - (numRows - numVisible);
                return paint(offset);
            }
            
            if (all.length === 0) {
                // be busy
                container.css({ visibility: "hidden" }).parent().busy();
            }
            
            function handleFail() {
                // clear grid
                apply([]);
                // inform user
                container.hide().parent().idle().append(
                    $.fail("Connection lost.", function () {
                        container.show();
                        loadAll();
                    })
                );
            }
            
            // get all IDs
            var load = loadIds[currentMode] || loadIds.all,
                def = $.Deferred();
            
            load()
                .done(function (list) {
                    if (isArray(list)) {
                        apply(list)
                            .always(function () {
                                // stop being busy
                                container.css({ visibility: "" }).parent().idle();
                            })
                            .done(function () {
                                // select first or previous selection
                                self.selection.selectSmart();
                            })
                            .done(def.resolve)
                            .fail(def.reject);
                    } else {
                        console.warn("VGrid.all() must provide an array!");
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
            var top = node.scrollTop(),
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
                mode = "all";
            }
            loadIds[mode] = fn;
        };
        
        this.setListRequest = function (mode, fn) {
            // parameter shift?
            if (_.isFunction(mode)) {
                fn = mode;
                mode = "all";
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
            node.unbind("scroll").bind("scroll", fnScroll);
            return init();
        };
        
        this.repaint = function () {
            var offset = getIndex(node.scrollTop()) - (numRows - numVisible);
            return paint(offset);
        };
        
        this.refresh = function () {
            // load all
            return loadAll();
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
        
        this.getLabels = function () {
            return labels;
        };
        
        this.scrollToLabelText = function (e) {
            // get via text index
            var obj = labels.textIndex[e.data || e];
            if (obj !== undefined) {
                scrollToLabel(obj);
            }
        };
        
        this.scrollTop = function () {
            return node.scrollTop();
        };
        
        this.keyboard = function (flag) {
            this.selection.keyboard(flag);
        };
    };
    
    // make Template accessible
    VGrid.Template = Template;
    
    return VGrid;
});