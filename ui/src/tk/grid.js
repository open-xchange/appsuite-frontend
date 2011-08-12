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


/*jslint bitwise: false, nomen: false, onevar: false, plusplus: false, regexp: false, white: true, browser: true, devel: true, evil: true, forin: true, undef: true, eqeqeq: true, immed: true */

/*global $, ox, require */

ox.ui.tk.VGrid = function (target) {

    /**
     * Private Template class
     * @returns {Template}
     */
    function Template() {

        var template = [],
            tagName = "div",
            rowTemplate = $("<" + tagName + "/>")
                .addClass("vgrid-cell").css("top", "-1000px");

        this.add = function (obj) {
            if (obj && obj.build) {
                template.push(obj);
            }
        };

        var getHeight = function (node) {
            node.css("visibility", "hidden").show()
                .appendTo(document.body);
            var height = Math.max(1, node.outerHeight(true));
            node.remove();
            return height;
        };

        this.getHeight = function () {
            return getHeight(this.getClone().node);
        };

        var emptySet = function () {
            return $();
        };

        this.getClone = function () {
            var i = 0, $i = template.length, tmpl,
                row = {
                    node: rowTemplate.clone(),
                    fields: {},
                    set: []
                };
            for (; i < $i; i++) {
                tmpl = template[i];
                $.extend(row.fields, tmpl.build.call(row.node) || {});
                row.set.push(tmpl.set || $.noop);
            }
            // clean up template to avoid typical mistakes
            row.node.add(row.node.find("div, span, p, td")).each(function () {
                var node = $(this);
                if (node.children().length === 0) {
                    if (node.text() === "") {
                        node.text("\u00a0");
                    }
                }
            });
            row.node.find("img").each(function () {
                if (this.style.width === "" || this.style.height === "") {
                    console.warn("Image has no width/height. Set to (0, 0):", this);
                    this.style.width = this.style.height = "0px";
                }
            });
            // add update
            row.update = function (data, index) {
                // loop over setters
                var i = 0, $i = row.set.length;
                for (; i < $i; i++) {
                    row.set[i].call(row.node, data, row.fields, index);
                }
                // set id for selection
                row.node.get(0).oxID = String(data);
            };
            return row;
        };
    }

    // target node
    var node = $(target).empty().bind("selectstart", false),
        // inner container
        container = $("<div/>").appendTo(node),
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
        numVisible = 0,
        numRows = 0,
        numLabels = 0,
        // data index (contains ALL ids)
        all = [],
        // labels
        labels = $(),
        labelIndexes = {},
        // bounds of currently visible area
        bounds = { top: 0, bottom: 0 },
        // multiplier defines how much detailed data is loaded
        mult = 4,
        // reference for private functions
        self = this;

    // selection
    this.selection = new ox.ui.tk.Selection().observe(container.get(0));

    var paintLabels = function () {
        // remove existing labels
        labels.remove();
        labels = $();
        // loop
        var index = "", i = 0, clone = null;
        for (index in labelIndexes) {
            // draw
            clone = label.getClone();
            labels = labels.add(clone.node.css({
                top: i * labelHeight + index * itemHeight + "px"
            }).appendTo(container));
            clone.update(all[index], index);
            i++;
        }
        clone = null;
    };

    var getLabels = function () {
        // reset
        labelIndexes = {};
        numLabels = 0;
        // loop
        var i = 0, $i = all.length;
        for (; i < $i; i++) {
            if (self.grepLabel(i, all[i]) === true) {
                labelIndexes[i] = true;
                numLabels++;
            }
        }
    };

    var paint = function (offset, cont) {
        // keep positive
        offset = Math.max(0, offset);
        // get items
        self.fetch(all.slice(offset, offset + numRows), function (data) {
            // vars
            var i, $i, shift = 0, j = "", row,
                classSelected = self.selection.classSelected;
            // get shift (top down)
            for (j in labelIndexes) {
                if (offset > j) {
                    shift++;
                }
            }
            // loop
            for (i = 0, $i = data.length; i < $i; i++) {
                // shift?
                if (labelIndexes[offset + i]) {
                    shift++;
                }
                row = pool[i];
                row.update(data[i], offset + i);
                row.node.css("top", shift * labelHeight + (offset + i) * itemHeight + "px")
                    .removeClass(classSelected);
            }
            if ($i < numRows) {
                for (; i < numRows; i++) {
                    pool[i].node.css("top", "-1000px")
                        .removeClass(classSelected);
                    delete pool[i].node.get(0).oxID;
                }
            }
            // update selection
            self.selection.update();
            // remember bounds
            bounds.top = offset;
            bounds.bottom = offset + numRows - numVisible;
            // continue
            ox.util.call(cont);
        });
    };

    var resize = function () {
        // get num of rows
        numVisible = Math.max(1, ((node.height() / itemHeight) >> 0) + 2);
        numRows = numVisible * mult;
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

    var loadAll = function (cont) {
        // get all items
        self.all(function (list) {
            if (ox.util.isArray(list)) {
                // store
                all = list;
                // get labels
                getLabels();
                paintLabels();
                // adjust container height
                container.css({
                    height: (numLabels * labelHeight + all.length * itemHeight) + "px"
                });
                // paint items
                var offset = getIndex(node.scrollTop()) - (numRows - numVisible);
                paint(offset, cont);
            } else {
                console.warn("VGrid.all(cont) must provide an array!");
            }
        });
    };

    var init = function (cont) {
        // get sizes
        itemHeight = template.getHeight();
        labelHeight = label.getHeight();
        // resize
        resize();
        // load all IDs
        loadAll(cont);
    };

    var getIndex = function (top) {
        var i = 0, $i = all.length, y = 0;
        for (; i < $i && y < top; i++) {
            if (labelIndexes[i]) {
                y += labelHeight;
            }
            y += itemHeight;
        }
        return i;
    };

    var fnScroll = function (e) {
        var top = node.scrollTop(),
            index = getIndex(top);
        // checks bounds
        if (index >= bounds.bottom) {
            // below bottom
            paint(index);
        } else if (index < bounds.top) {
            // above top
            paint(index - (numRows - numVisible));
        }
    };

    this.all = function (cont) {
        ox.util.call(cont, []);
    };

    this.fetch = function (ids, cont) {
        ox.util.call(cont, ids);
    };

    this.addTemplate = function (obj) {
        template.add(obj);
    };

    this.addLabel = function (obj) {
        label.add(obj);
    };
    
    this.grepLabel = function (data) {
        return false;
    };

    this.paint = function (cont) {
        node.unbind("scroll").bind("scroll", fnScroll);
        init(cont);
    };

    this.refresh = function (cont) {
        loadAll(cont);
    };
};