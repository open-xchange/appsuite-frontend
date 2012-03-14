define("io.ox/core/extPatterns/layouts", ["io.ox/core/extensions"], function (ext) {
    "use strict";
    
    var that = {};
    
    function invokeEventHandler($node, extension, type, args) {
        if (extension.on && extension.on[type]) {
            if (extension.isEnabled && !extension.isEnabled.apply(extension, args)) {
                if ($node) {
                    $node.empty();
                    return 'remove';
                }
                return 'done';
            }
            if ($node) {
                extension.on[type].apply($node, _([args, extension]).flatten());
                return 'done';
            } else {
                return 'draw';
            }
        }
        return 'done';
    }
    
    var Flow = function (options) {
        var self = this,
            point = ext.point(options.ref),
            nodes = {};
            
        
        self.draw = function () {
            var args = $.makeArray(arguments),
            $node = this;
            
            point.each(function (extension) {
                var $div = $("<div>").addClass("row-fluid").appendTo($node);
                extension.draw.apply($div, args);
                nodes[extension.id] = $div;
            });
            
        };
        
        self.trigger = function () {
            var args = $.makeArray(arguments),
                $node = args.shift(),
                type = args.shift();
            
            var reflow = false;
            point.each(function (extension) {
                if (reflow) {
                    return;
                }
                var result = invokeEventHandler(nodes[extension.id], extension, type, args);
                reflow = reflow || result === 'draw' || result === 'remove';
            });
            if (reflow) {
                $node.empty();
                self.draw.apply($node, args);
            }
        };
        
        self.each = function (fn) {
            point.each(function (extension) {
                fn(extension, nodes[extension.id]);
            });
        };
        
        self.destroy = function () {
            nodes = null;
        };
    };
    that.Flow = Flow;
    
    var Sections = function (options) {
        var self = this,
            point = ext.point(options.ref),
            sublayouts = {},
            nodes = {};
        
        self.draw = function () {
            var args = $.makeArray(arguments),
                $node = this;
            point.each(function (sectionDef) {
                if (sectionDef.isEnabled && !sectionDef.isEnabled.apply(sectionDef, args)) {
                    return;
                }
                var $sectionNode = $("<div>").addClass("io-ox-section").appendTo($node);
                nodes[sectionDef.id] = $sectionNode;
                
                var title = sectionDef.metadata("title", args);
                if (title) {
                    $sectionNode.append($("<div>").addClass("io-ox-sectionTitle").text(title));
                }
                if (sectionDef.draw) {
                    sectionDef.draw.apply($sectionNode, args);
                    return;
                }
                // Invoke Sublayout
                var layout = sectionDef.metadata("layout", args) || 'Flow';
                var layoutName, layoutOptions;
                
                if (_.isString(layout) || _.isArray(layout)) {
                    layoutName = layout;
                    layoutOptions = {ref: options.ref + "/" + sectionDef.id};
                } else if (_.isObject(layout)) {
                    layoutName = layout.name;
                    layoutOptions = _(layout.options || {}).clone().defaults({ref: options.ref + "/" + sectionDef.id});
                }
                
                // Draw
                if (_.isString(layoutName)) {
                    sublayouts[sectionDef.id] = new that[layoutName](layoutOptions);
                    sublayouts[sectionDef.id].draw.apply($sectionNode, args);
                } else if (_.isArray(layoutName)) {
                    require([layout.shift()], function (Loaded) {
                        var name = layout.shift();
                        if (name) {
                            sublayouts[sectionDef.id] = new Loaded[name](layoutOptions);
                        } else {
                            sublayouts[sectionDef.id] = new Loaded(layoutOptions);
                        }
                        sublayouts[sectionDef.id].draw.apply($sectionNode, args);
                    });
                    return;
                }
                
            });
        };
        
        self.each = function (fn) {
            _(sublayouts).each(function (sublayout, sectionId) {
                fn(sublayout, nodes[sectionId]);
            });
        };
        
        self.trigger = function () {
            var args = $.makeArray(arguments),
                $node = args.shift(),
                type = args.shift();
            _(sublayouts).each(function (layout, sectionId) {
                if (layout.trigger) {
                    layout.trigger.apply(layout, _([nodes[sectionId], type, args]).flatten()); // TODO: Rethink _.flatten, destroys regularly passed arrays
                }
            });
        };
        
        self.destroy = function () {
            _(sublayouts).invoke("destroy");
            sublayouts = nodes = null;
        };
        
    };
    
    
    that.Sections = Sections;
    
    var Grid = function (options) {
        var self = this,
            point = ext.point(options.ref),
            nodes = {};
        
        self.draw = function () {
            var args = $.makeArray(arguments),
                $node = this,
                $currentRow,
                slotsLeft = 0,
                stack,
                keep,
                extension,
                dimensions;
            
            function br() {
                $currentRow = $("<div>").addClass("row-fluid").appendTo($node);
                slotsLeft = 12;
            }
            
            function copyKeep() {
                while (keep.length !== 0) {
                    stack.push(keep.pop());
                }
            }
            
            function fits(extension, dim) {
                return slotsLeft >= dim.span;
            }
            
            function drawTiles(extension, dim) {
                var tileSize = slotsLeft - dim.span;
                if (dim.orientation === 'right' && tileSize > 0) {
                    $("<div>").addClass("tile span" + tileSize).append("&nbsp;").appendTo($currentRow);
                    slotsLeft = slotsLeft - tileSize;
                }
            }
            
            function drawExtension(extension, dim) {
                var $tile = $("<div>").addClass("span" + dim.span).appendTo($currentRow);
                nodes[extension.id] = $tile;
                extension.draw.apply($tile, args);
                slotsLeft = slotsLeft - dim.span;
            }
            
            stack = [];
            point.each(function (ext) {
                stack.push(ext);
            });
            
            while (stack.length !== 0) {
                if (slotsLeft === 0) {
                    br();
                }
                keep = [];
                extension = stack.shift();
                if (extension.isEnabled && !extension.isEnabled.apply(extension, args)) {
                    continue;
                }
                dimensions = extension.metadata("dim", args) || {span: 12};
                if (!dimensions.span) {
                    dimensions.span = 12;
                }
                if (dimensions.span > 12 || dimensions.span < 1) {
                    dimensions.span = 12;
                }
                
                while (stack.length !== 0 && !fits(extension, dimensions)) {
                    keep.push(extension);
                    extension = stack.shift();
                    dimensions = extension.metadata("dim", args) || {span: 12};
                }
                if (!fits(extension, dimensions)) {
                    br();
                }
                drawTiles(extension, dimensions);
                drawExtension(extension, dimensions);
                if (dimensions.forceBreak) {
                    br();
                }
                copyKeep();
            }
        };
        
        self.trigger = function () {
            var args = $.makeArray(arguments),
                $node = args.shift(),
                type = args.shift();
            
            var reflow = false;
            point.each(function (extension) {
                if (reflow) {
                    return;
                }
                var result = invokeEventHandler(nodes[extension.id], extension, type, args);
                reflow = reflow || result === 'draw' || result === 'remove';
            });
            if (reflow) {
                $node.empty();
                self.draw.apply($node, args);
            }
        };
        
        self.each = function (fn) {
            point.each(function (extension) {
                fn(extension, nodes[extension.id]);
            });
        };
        
        
        self.destroy = function () {
            nodes = null;
        };
        
    };
    
    that.Grid = Grid;
    
    return that;
});