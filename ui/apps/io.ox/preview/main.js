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
    ["io.ox/preview/util"], function (util) {

    "use strict";

    var Renderer = {

        // a map file ending <-> renderer id
        map: {},

        // available render engines
        engines: [],

        register: function (Engine) {
            var Self = this;
            $.each(Engine.endings, function (index, element) {
                Self.map[element] = Engine.id;
            });
            this.engines.push(Engine);
            return true;
        },

        get: function (id) {
            for (var i = 0; i < this.engines.length; i++) {
                var Engine = this.engines[i];
                if (Engine.id === id) {
                    return Engine;
                }
            }
            return null;
        },

        getByFileType: function (fileType) {
            return this.get(this.map[fileType]) || null;
        }
    };

    // register image typed renderer
    Renderer.register({
        id: "image",
        endings: ["png", "jpg", "jpeg", "gif"],
        canRender: function (file) {
            return $.inArray(util.FileTypesMap.getFileType(file.name), this.endings) !== -1;
        },
        paint: function (file, node) {
            node.append(
                $("<img/>")
                .attr("src", file.dataURL + "&width=400&height=300")
                .css({
                    width: "400px",
                    maxWidth: "100%"
                })
            );
        }
    });

    // register audio typed renderer
    if (Modernizr.audio) {
        Renderer.register({
            id: "audio",
            endings: (function () {
                var endings = [];
                $.each(Modernizr.audio, function (id, elem) {
                    endings.push(id);
                });
                return endings;
            }()),
            canRender: function (file) {
                return $.inArray(util.FileTypesMap.getFileType(file.name), this.endings) !== -1;
            },
            paint: function (file, node) {
                if (this.canRender(file)) {
                    $("<audio/>").attr({
                        controls: "controls",
                        src: file.dataURL
                    }).appendTo(node);
                }
            }
        });
    }

    // if available register office typed renderer
    if (ox.serverConfig.previewMimeTypes) {
        Renderer.register({
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
            paint: function (file, node) {
                $.get(file.dataURL + "&format=preview").done(function (html) {
                    node.css({ border: "1px dotted silver", padding: "10px" }).append(html);
                });
//                node.append($("<iframe/>").css({ width: "100%", height: "100%"}).attr({ src: file.dataURL + "&format=preview_filtered" }));
            }
        });
    }

    Renderer.register({
        id: "text",
        endings: [ "txt", "js" ],
        canRender: function (file) {
            return $.inArray(util.FileTypesMap.getFileType(file.name), this.endings) !== -1;
        },
        paint: function (file, node) {
            if (this.canRender(file)) {
                $.ajax({ url: file.dataURL, dataType: "html" }).done(function (txt) {
                    node.css({ border: "1px dotted silver", padding: "10px", whiteSpace: "pre-wrap" }).text(txt);
                });
            }
        }
    });

    var Preview = function (file) {

        this.file = file;
        this.Renderer = null;

        if (this.file.file_mimetype) {
            this.file.mimetype = this.file.file_mimetype;
        } else if (!this.file.mimetype) {
            this.file.mimetype = "application/octet-stream";
        }

        if (this.file.filename) {
            this.file.name = this.file.filename;
        }

        if (this.file.name) {
            // get matching renderer
            this.Renderer = Renderer.getByFileType(util.FileTypesMap.getFileType(this.file.name));
        }

        this.ContentType = new util.ContentType(this.file.mimetype);
    };

    Preview.prototype = {

        getContentType: function () {
            return this.ContentType;
        },

        getRenderer: function () {
            return this.Renderer;
        },

        supportsPreview: function () {
            if (this.Renderer !== null) {
                return this.Renderer.canRender(this.file);
            } else {
                return false;
            }
        },

        appendTo: function (node) {
            if (this.supportsPreview()) {
                this.Renderer.paint(this.file, node);
            }
        }
    };

//    var ct = new util.ContentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document; charset="UTF-8"; name="My testing document.docx";');
//    console.debug(ct, ct.getBaseType(), ct.getSubType(), ct.getPrimaryType(), ct.getParameterList(), ct.previewSupported());
//
//    var ftm = util.FileTypesMap;
//    console.debug(ftm, ftm.getContentType('My testing document.docx'), ftm.getFileType('My testing document.docx'), ftm.previewSupported('My testing document.docx'));

    return Preview;

});