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
    ["io.ox/core/extensions"], function (ext) {

    "use strict";

    var Renderer = {
        point: ext.point("io.ox/preview/engine")

        getByExtension: function (fileExtension) {
            this.point.chain().find(function (ext) {
                var endings = ext.metadata("endings");
                endings = _.isArray(endings) ? endings : [endings];
                return _(endings).contains(fileExtension)
            });
        }
    };

    // register image typed renderer
    Renderer.point.extend({
        id: "image",
        endings: ["png", "jpg", "jpeg", "gif"],
        draw: function (file, node) {
            this.append(
                $("<img>", { src: file.dataURL + "&width=400&height=300", alt: 'Preview' })
                .css({
                    width: "400px",
                    maxWidth: "100%"
                })
            );
        }
    });

    // register audio typed renderer
    if (Modernizr.audio) {
        Renderer.point.extend({
            id: "audio",
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
        });
    }
    
    /*
    // if available register office typed renderer
    if (ox.serverConfig.previewMimeTypes) {
        Renderer.point.extend({
            id: "office",
            endings: (function () {
                var endings = [];
                $.each(ox.serverConfig.previewMimeTypes, function (id, ct) {
                    endings.push(id);
                });
                return endings;
            }()),
            canRender: function (file) {
                return util.FileTypesMap.previewSupported(file.name);
            },
            draw: function (file, node) {
                $.get(file.dataURL + "&format=preview").done(function (html) {
                    node.css({ border: "1px dotted silver", padding: "10px" }).append(html);
                });
//                node.append($("<iframe/>").css({ width: "100%", height: "100%"}).attr({ src: file.dataURL + "&format=preview_filtered" }));
            }
        });
    } */

    Renderer.point.extend({
        id: "text",
        endings: [ "txt", "js" ],
        draw: function (file) {
            if (this.canRender(file)) {
                $.ajax({ url: file.dataURL, dataType: "html" }).done(function (txt) {
                    this.css({ border: "1px dotted silver", padding: "10px", whiteSpace: "pre-wrap" }).text(txt);
                });
            }
        }
    });

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
            
        }())
        

        if (this.file.name) {
            // get matching renderer
            this.renderer = Renderer.getByExtension(util.FileTypesMap.getFileType(this.file.name));
        }
    };

    Preview.prototype = {

        getContentType: function () {
            return this.ContentType;
        },

        getRenderer: function () {
            return this.renderer;
        },

        supportsPreview: function () {
            if (this.renderer !== null) {
                return this.renderer.canRender(this.file);
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

    return Preview;

});