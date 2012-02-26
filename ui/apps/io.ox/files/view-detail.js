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

define("io.ox/files/view-detail",
    ["io.ox/core/extensions",
     "io.ox/core/i18n",
     "io.ox/files/actions"], function (ext, i18n) {

    "use strict";

    var draw = function (file) {

        file.url = ox.apiRoot + "/infostore?action=document&id=" + file.id +
            "&folder=" + file.folder_id + "&session=" + ox.session; // TODO: Put this somewhere in the model

        // container & title
        var element = $("<div>").addClass("file-details view")
            .append($("<div>").addClass("title clear-title").text(file.title));

        // Basic Info
        (function () {
            var container = $("<div>").addClass("basicInfo");
            var line = $("<div>");
            container.append(line);
            element.append(container);

            ext.point("io.ox/files/details/basicInfo").each(function (extension) {
                var count = 0;
                _.each(extension.fields, function (index, field) {
                    var content = null;
                    line.append($("<em>").text(extension.label(field) + ":")).append(content = $("<span>"));
                    extension.draw(field, file, content);
                    count++;
                    if (count === 5) {
                        count = 0;
                        line = $("<div>");
                        container.append(line);
                    }
                });
            });

            ext.point("io.ox/files/details").invoke("draw", line, file);
        }());

        // Content Preview, if available

        (function () {
            if (!file.filename) {
                return;
            }
            var node = $("<div>").addClass("preview");
            element.append(node);
            var fileDescription = {
                name: file.filename,
                mimetype: file.file_mimetype,
                size: file.file_size,
                dataURL: file.url
            };

            ext.point("io.ox/files/details/preview").invoke("draw", node, [ fileDescription, node ]);
        }());

        // Render Description

        if (file.description) {
            element.append(
                $("<div>")
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

        ext.point("io.ox/files/details/additional").each(function (extension) {
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

    ext.point("io.ox/files/details/basicInfo").extend({
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

    ext.point("io.ox/files/details/basicInfo").extend({
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

    ext.point("io.ox/files/details/basicInfo").extend({
        id: "last_modified",
        index: 30,
        fields: ["last_modified"],
        label: function () {
            return "Last Modified";
        },
        draw: function (field, file, element) {
            element.text(i18n.date("fulldatetime", file.last_modified));
        }
    });

    // Basic Actions

    ext.point('io.ox/files/details').extend(new ext.InlineLinks({
        index: 40,
        id: 'inline-links',
        ref: 'io.ox/files/links/inline'
    }));

    ext.point("io.ox/files/details/preview").extend({
        id: "preview",
        draw: function (file, node) {
            require(["io.ox/preview/main"], function (Preview) {
                var prev = new Preview(file);
                if (prev.supportsPreview()) {
                    prev.appendTo(node);
                    node.show();
                }
            });
        }
    });

    return {
        draw: draw
    };
});