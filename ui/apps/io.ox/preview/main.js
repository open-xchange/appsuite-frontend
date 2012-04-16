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
    var clickableLink = $.noop;

    if (supportsDragOut) {
        dragOutHandler = function ($node, desc) {
            $node.on('dragstart', function (e) {
                e.originalEvent.dataTransfer.setData('DownloadURL', this.dataset.downloadurl);
            });
        };
        clickableLink = function (desc, clickHandler) {
            var $a = $('<a>', {draggable: true })
            .attr('data-downloadurl', desc.mimetype + ':' + desc.name + ':' + ox.abs + desc.dataURL + "&delivery=download");
            if (clickHandler) {
                $a.attr({}).on("click", clickHandler);
            } else {
                $a.attr({ href: desc.dataURL + "&delivery=view", target: '_blank'});
            }
            return $a;
        };
    } else {
        clickableLink = function (desc) {
            return $('<a>', { href: desc.dataURL + "&delivery=view", target: '_blank'});
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

                var $node;

                if (!options.omitClick) {
                    $node = clickableLink(file);
                    if (supportsDragOut) {
                        $node.attr('title', gt('Click to open. Drag to your desktop to download.'));
                    } else {
                        $node.attr("title", gt("Click to open."));
                    }
                } else {
                    $node = $("<div>");
                }

                options.draw.apply($node, arguments);
                dragOutHandler($node, file);

                this.append($node);
            };
        }
    };

    // register image typed renderer
    Renderer.point.extend(new Engine({
        id: "image",
        index: 10,
        endings: ["png", "jpg", "jpeg", "gif", "bmp"],
        draw: function (file, options) {
            var param = {
                width: options.width || 400,
                height: options.height || 400,
                scaleType: options.scaleType || 'contain',
                delivery: 'view'
            };
            if (options.height === 'auto') {
                delete param.height;
            }
            this.append(
                $("<img>", { src: file.dataURL + "&" + $.param(param), alt: 'Preview' }));
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
                var $a = clickableLink(file, function () {
                    require(["io.ox/preview/officePreview"], function (officePreview) {
                        officePreview.draw(file);
                    });
                });
                $a.append(
                    $("<img>", { src: file.dataURL + "&format=preview_image&width=400&delivery=view", alt: 'Preview' })
                        .css({
                            width: "400px",
                            maxWidth: "100%"
                        }).addClass("io-ox-clickable")
                );
                dragOutHandler($a);
                this.append($a);
            },
            omitDragoutAndClick: true
        }));
    }

    // TODO: remove? duplicate during merge? (see below)
//    Renderer.point.extend(new Engine({
//        id: "text",
//        index: 10,
//        endings: [ "txt", "js" ],
//        draw: function (file) {
//            var $node = this;
//            $.ajax({ url: file.dataURL, dataType: "html" }).done(function (txt) {
//                $node.css({
//                    border: "1px dotted silver",
//                    padding: "10px",
//                    whiteSpace: "pre-wrap"
//                }).text(txt);
//            });
//        },
//        omitClick: true
//    }));


    Renderer.point.extend(new Engine({
        id: "eml",
        endings: ["eml"],
        draw: function (file) {
            require(['io.ox/mail/view-detail'], function (view) {
                var data = file.data.nested_message;
                this.append(view.draw(data));
            });
        }
    }));

    Renderer.point.extend(new Engine({
        id: "text",
        endings: ["txt", "asc", "js", "md"],
        draw: function (file) {
            var node = this;
            $.ajax({ url: file.dataURL, dataType: 'text' }).done(function (text) {
                // plain text preview
                node.css({
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    width: '100%',
                    padding: '13px',
                    border: "1px dotted silver",
                    boxSizing: 'border-box',
                    whiteSpace: 'pre-wrap',
                    MozUserSelect: 'text',
                    webkitUserSelect: 'text',
                    userSelect: 'text',
                    cursor: 'auto'
                })
                .text(text);
            });
        },
        omitClick: true
    }));

    var Preview = function (file, options) {
        var self = this;
        this.file = _.copy(file, true); // work with a copy
        this.options = options || {};

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
                this.renderer.invoke("draw", node, this.file, this.options);
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
                var prev = new Preview(fileDescription, options);
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
                var prev = new Preview(fileDescription, options);
                prev.appendTo(this);
            };
        }
    }

    return {
        Preview: Preview,
        Engine: Engine,
        Extension: Extension,
        protectedMethods: {
            clickableLink: clickableLink,
            dragOutHandler: dragOutHandler
        }
    };
});