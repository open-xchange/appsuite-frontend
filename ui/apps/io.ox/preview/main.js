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
 * @author Stefan Preuss <stefan.preuss@open-xchange.com>
 */

define("io.ox/preview/main",
    ["io.ox/core/extensions", "gettext!io.ox/preview/preview"], function (ext, gt) {

    "use strict";
    
    var supportsDragOut = Modernizr.draganddrop && _.browser.Chrome;
    var dragOutHandler = $.noop;
    var clickHandler = $.noop;
    
    if (supportsDragOut) {
        dragOutHandler = function ($node, desc) {
            $node.on('dragstart', function (e) {
                e.originalEvent.dataTransfer.setData('DownloadURL',  ox.abs + desc.dataURL + "&delivery=download");
            });
        };
        clickHandler = function ($node, desc) {
            return $('<a>', { href: desc.dataURL + "&delivery=view", target: '_blank', draggable: true })
            .attr('data-downloadurl', desc.mimetype + ':' + desc.name + ':' + ox.abs + desc.dataURL + "&delivery=download")
            .append($node);
        };
    } else {
        clickHandler = function ($node, desc) {
            return $('<a>', { href: desc.dataURL + "&delivery=view", target: '_blank'}).append($node);
        };
        
    }
    
    
    
    var Renderer = {
        point: ext.point("io.ox/preview/engine"),

        getByExtension: function (fileExtension) {
            return this.point.chain().find(function (ext) {
                var endings = ext.metadata("endings");
                endings = _.isArray(endings) ? endings : [endings];
                return _(endings).contains(fileExtension);
            }).value();
        }
    };
    
    var Engine = function (options) {
        _.extend(this, options);
        if (!options.omitDragoutAndClick) {
            this.draw = function (file) {
                var $node = $("<div>");
                options.draw.apply($node, arguments);
                $node = clickHandler($node, file);
                dragOutHandler($node, file);
                
                if (supportsDragOut) {
                    $node.attr('title', gt('Click to open. Drag to your desktop to download.'));
                } else {
                    $node.attr("title", gt("Click to open."));
                }
                
                this.append($node);
            };
        }
    };

    // register image typed renderer
    Renderer.point.extend(new Engine({
        id: "image",
        index: 10,
        endings: ["png", "jpg", "jpeg", "gif"],
        draw: function (file) {
            this.append(
                $("<img>", { src: file.dataURL + "&width=400&height=400&scaleType=contain&delivery=view", alt: 'Preview' })
            );
        }
    }));

    // register audio typed renderer
    if (Modernizr.audio) {
        Renderer.point.extend(new Engine({
            id: "audio",
            index: 10,
            endings: (function () {
                var endings = [];
                $.each(Modernizr.audio, function (id, elem) {
                    endings.push(id);
                });
                return endings;
            }()),
            draw: function (file) {
                $("<audio/>").attr({
                    controls: "controls",
                    src: file.dataURL
                }).appendTo(this);
            }
        }));
    }
    
    
    // if available register office typed renderer
    if (ox.serverConfig.previewExtensions) {
        Renderer.point.extend(new Engine({
            id: "office",
            index: 10,
            endings: ox.serverConfig.previewExtensions,
            draw: function (file) {
                this.append(
                    $("<img>", { src: file.dataURL + "&format=preview_image&width=400", alt: 'Preview' })
                        .css({
                            width: "400px",
                            maxWidth: "100%"
                        })
                );
            }
        }));
    }

    Renderer.point.extend(new Engine({
        id: "text",
        index: 10,
        endings: [ "txt", "js" ],
        draw: function (file) {
            $.ajax({ url: file.dataURL, dataType: "html" }).done(function (txt) {
                this.css({ border: "1px dotted silver", padding: "10px", whiteSpace: "pre-wrap" }).text(txt);
            });
        }
    }));

    var Preview = function (file) {
        var self = this;
        this.file = file;
        this.renderer = null;

        if (this.file.file_mimetype) {
            this.file.mimetype = this.file.file_mimetype;
        } else if (!this.file.mimetype) {
            this.file.mimetype = "application/octet-stream";
        }

        if (this.file.filename) {
            this.file.name = this.file.filename;
        }
        
        this.extension =  (function () {
            var extension = self.file.name.match(/\.([a-z0-9]{2,})$/i);
            if (extension.length > 0) {
                return String(extension[1]).toLowerCase();
            }
            return "";
        }());
        

        if (this.file.name) {
            // get matching renderer
            this.renderer = Renderer.getByExtension(this.extension);
        }
    };

    Preview.prototype = {

        getRenderer: function () {
            return this.renderer;
        },

        supportsPreview: function () {
            if (this.renderer) {
                if (this.renderer.canRender) {
                    return this.renderer.canRender(this.file);
                }
                return true;
            } else {
                return false;
            }
        },

        appendTo: function (node) {
            if (this.supportsPreview()) {
                this.renderer.invoke("draw", node, this.file);
            }
        }
    };
    
    function Extension(options) {
        _.extend(this, options);
        
        var self = this;
        
        if (!this.isEnabled) {
            this.isEnabled = function (fileDescription) {
                if (options.parseArguments) {
                    fileDescription = options.parseArguments.apply(self, arguments);
                }
                if (!fileDescription) {
                    return false;
                }
                var prev = new Preview(fileDescription);
                return prev.supportsPreview();
            };
        }
        
        if (!this.draw) {
            this.draw = function (fileDescription) {
                if (options.parseArguments) {
                    fileDescription = options.parseArguments.apply(self, arguments);
                }
                if (!fileDescription) {
                    return false;
                }
                var prev = new Preview(fileDescription);
                prev.appendTo(this);
            };
        }
    }

    return {
        Preview: Preview,
        Engine: Engine,
        Extension: Extension
    };

});