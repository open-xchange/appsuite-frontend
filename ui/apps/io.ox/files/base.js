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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 */
 
// TODO: Render Versions

define("io.ox/files/base", ["io.ox/core/extensions"], function (ext) {
    
    var draw = function (file) {
        file.url = ox.ajaxRoot + "/infostore?action=document&id=" + file.id +
            "&folder=" + file.folder_id + "&session=" + ox.session; // TODO: Put this somewhere in the model
        var element = $("<div />").addClass("fileDetails");
        element.append($("<h1/>").text(file.title));
        // Basic Info
        (function () {
            var container = $("<div/>").addClass("basicInfo");
            var line = $("<div/>");
            container.append(line);
            element.append(container);
            
            ext.point("io.ox.files.details.basicInfo").each(function (extension) {
                var count = 0;
                _.each(extension.fields, function (index, field) {
                    var content = null;
                    line.append($("<em/>").text(extension.label(field) + ":")).append(content = $("<span/>"));
                    extension.draw(field, file, content);
                    count++;
                    if (count === 5) {
                        count = 0;
                        line = $("<div/>");
                        container.append(line);
                    }
                });
            });
        }());
        
        // Buttons
        
        (function () {
            var container = $("<div/>").addClass("buttons");
            var line = $("<div/>");
            
            container.append(line);
            element.append(container);
            
            var count = 0;
            ext.point("io.ox.files.details.actions").each(function (extension) {
                var action = function () {
                    extension.action(file);
                };
                line.append($("<a/>").text(extension.label).attr("href", "#").click(action));
                count++;
                if (count === 5) {
                    count = 0;
                    line = $("<div/>");
                    container.append(line);
                }
            });
        }());
        
        
        // Content Preview, if available
        
        (function () {
            if (!file.filename) {
                return;
            }
            var div = $("<div/>").addClass("preview");
            var fileDescription = {
                name: file.filename,
                type: file.file_mimetype,
                size: file.file_size,
                dataURL: file.url
            };
            var rendered = false;
            ext.point("io.ox.files.renderer").each(function (renderer) {
                if (!rendered && renderer.canRender(fileDescription)) {
                    renderer.draw(fileDescription, div);
                    rendered = true;
                }
            });
           
            if (rendered) {
                element.append(div);
            }
        }());
        
        // Render Description
        
        if (file.description) {
            element.append(
                $("<div/>")
                .css({
                    // makes it readable
                    fontFamily: "monospace, 'Courier new'",
                    whiteSpace: "pre-wrap",
                    paddingRight: "2em"
                })
                .text(file.description)
            );
        }
        
        // Render Additional
        
        ext.point("io.ox.files.details.additional").each(function (extension) {
            extension(file, element);
        });
        
        return element;
    };
    
    
    // Basic Info Fields
    
    var bytesToSize = function (bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'], i;
        if (bytes === 0) {
            return 'n/a';
        } else {
            i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
            return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
        }
    };
    
    ext.point("io.ox.files.details.basicInfo").extend({
        id: "size",
        index: 10,
        fields: ["file_size"],
        label: function () {
            return "Size";
        },
        draw: function (field, file, element) {
            element.text(bytesToSize(file.file_size));
        }
    });
    
    ext.point("io.ox.files.details.basicInfo").extend({
        id: "version",
        index: 20,
        fields: ["version"],
        label: function (field) {
            return "Version";
        },
        draw: function (field, file, element) {
            element.text(file.version);
        }
    });
    
    var formatDate = function (timestamp) {
        var d = new Date(timestamp);
        return d.toLocaleString();
    };
    
    ext.point("io.ox.files.details.basicInfo").extend({
        id: "last_modified",
        index: 30,
        fields: ["last_modified"],
        label: function () {
            return "Last Modified";
        },
        draw: function (field, file, element) {
            element.text(formatDate(file.last_modified));
        }
    });
    
    // Basic Actions
    
    ext.point("io.ox.files.details.actions").extend({
        id: "download",
        index: 10,
        label: "Download",
        action: function (file) {
            window.open(file.url + "&content_type=application/octet-stream&content_disposition=attachment", file.title);
        }
    });

    ext.point("io.ox.files.details.actions").extend({
        id: "open",
        index: 20,
        label: "Open",
        action: function (file) {
            window.open(file.url, file.title);
        }
    });

    ext.point("io.ox.files.details.actions").extend({
        id: "send",
        index: 30,
        label: "Send by E-Mail",
        action: function (file) {
            alert("Zzzzzush: " + file.title);
        }
    });
    
        
    // Simple Previews
    
    // .txt
    ext.point("io.ox.files.renderer").extend({
        id: "text",
        canRender: function (fileDescription) {
            return (/\.txt$/).test(fileDescription.name);
        },
        draw: function (fileDescription, div) {
            var textDisplay = $("<textarea/>").attr("rows", "30").attr("cols", "80").attr("readonly", "readonly");
            $.get(fileDescription.dataURL).done(function (text) {
                textDisplay.text(text);
                div.append(textDisplay);
            });
        }
    });
    
    // .png, .jpg, .jpeg, .gif
    ext.point("io.ox.files.renderer").extend({
        id: "images",
        endings: ["png", "jpg", "jpeg", "gif"],
        canRender: function (fileDescription) {
            for (var i = 0, l = this.endings.length; i < l; i++) {
                if (new RegExp("\\." + this.endings[i] + "$", "i").test(fileDescription.name)) {
                    return true;
                }
            }
            return false;
        },
        draw: function (fileDescription, div) {
            div.append(
                $("<img/>")
                .attr("src", fileDescription.dataURL + "&width=400&height=300")
                .css({
                    width: "400px",
                    maxWidth: "100%"
                })
            );
        }
    });
    
    // .mp3 .ogg .wav
    ext.point("io.ox.files.renderer").extend({
        id: "audio",
        endings: ["mp3", "ogg", "wav"],
        canRender: function (fileDescription) {
            for (var i = 0, l = this.endings.length; i < l; i++) {
                if (new RegExp("\\." + this.endings[i] + "$").test(fileDescription.name)) {
                    fileDescription["io.ox.files.detectedEnding"] = this.endings[i];
                    return true;
                }
            }
            return false;
        },
        draw: function (fileDescription, div) {
            // support audio format?
            if (Modernizr.audio[fileDescription["io.ox.files.detectedEnding"]]) {
                $("<audio/>").attr({
                    controls: "controls",
                    src: fileDescription.dataURL
                }).appendTo(div);
            }
        }
    });
    
    return {
        draw: draw
    };
});