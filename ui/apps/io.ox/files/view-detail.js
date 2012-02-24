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
     "io.ox/files/actions",
     "io.ox/files/api"], function (ext, i18n, actions, filesAPI) {

    "use strict";

    var draw = function (file) {

        file.documentUrl = ox.apiRoot + "/infostore?action=document&id=" + file.id +
            "&folder=" + file.folder_id + "&session=" + ox.session; // TODO: Put this somewhere in the model

        var $element = $("<div>").addClass("file-details view");
        
        ext.point("io.ox/files/details").each(function (extension) {
            var $row = $("<div>").addClass("row-fluid");
            if (extension.isEnabled && !extension.isEnabled(file)) {
                return;
            }
            extension.draw.call($row, file);
            $row.appendTo($element);
        });
        return $element;
    };
    
    
    // Details Extensions
    // Title
    ext.point("io.ox/files/details").extend({
        id: "title",
        index: 10,
        draw: function (file) {
            this.append($("<div>").addClass("title clear-title").text(file.title));
        }
    });
    
    
    // Basic Info Table
    ext.point("io.ox/files/details").extend({
        id: "basicInfo",
        index: 20,
        draw: function (file) {
            
            this.addClass("basicInfo");
            var $line = $("<div>");
            this.append($line);
            
            ext.point("io.ox/files/details/basicInfo").each(function (extension) {
                var count = 0;
                _.each(extension.fields, function (index, field) {
                    var content = null;
                    $line.append($("<em>").text(extension.label(field) + ":")).append(content = $("<span>"));
                    extension.draw(field, file, content);
                    count++;
                    if (count === 5) {
                        count = 0;
                        $line = $("<div>");
                        this.append($line);
                    }
                });
            });
        }
    });
    

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
        draw: function (field, file, $element) {
            $element.text(bytesToSize(file.file_size));
        }
    });

    ext.point("io.ox/files/details/basicInfo").extend({
        id: "version",
        index: 20,
        fields: ["version"],
        label: function (field) {
            return "Version";
        },
        draw: function (field, file, $element) {
            $element.text(file.version);
        }
    });

    ext.point("io.ox/files/details/basicInfo").extend({
        id: "last_modified",
        index: 30,
        fields: ["last_modified"],
        label: function () {
            return "Last Modified";
        },
        draw: function (field, file, $element) {
            $element.text(i18n.date("fulldatetime", file.last_modified));
        }
    });

    // Basic Actions

    ext.point('io.ox/files/details').extend(new ext.InlineLinks({
        index: 30,
        id: 'inline-links',
        ref: 'io.ox/files/links/inline'
    }));
    
    // Preview
    
    ext.point("io.ox/files/details").extend({
        id: "preview",
        index: 40,
        isEnabled: function (file) {
            return !!file.filename;
        },
        draw: function (file) {
            this.addClass("preview");
            var fileDescription = {
                name: file.filename,
                mimetype: file.file_mimetype,
                size: file.file_size,
                dataURL: file.documentUrl
            };
            
            ext.point("io.ox/files/details/preview").invoke("draw", this, [ fileDescription, this ]);
        }
    });

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
    
    // Description
    
    ext.point("io.ox/files/details").extend({
        id: "description",
        index: 50,
        isEnabled: function (file) {
            return !!file.description;
        },
        draw: function (file) {
            this.addClass("description");
            this.append(
                $("<div>")
                .css({
                    // makes it readable
                    fontFamily: "monospace, 'Courier new'",
                    whiteSpace: "pre-wrap",
                    paddingRight: "2em",
                    marginBottom: "2em"
                })
                .text(file.description));
        }
    });
    
    // Version List
    
    ext.point("io.ox/files/details").extend({
        id: "versions",
        isEnabled: function (file) {
            return file.current_version;
        },
        draw: function (file) {
            var $link = $("<a>", {
                href: '#'
            }).appendTo(this),
            $mainContent = $("<div />"),
            $versionTable = $("<table/>");
            
            $mainContent.append("No versions");
            
            // first let's deal with the link
            $link.text("Show all versions").on("click", function () {
                this.empty().append($mainContent);
                return false;
            });
            
            $versionTable.append($("<tr>")
                .append("<th>").text("Version")
                .append("<th>").text("File Name")
                .append("<th>").text("Created By")
                .append("<th>").text("Comment")
            ).addClass("table");
            
            // Then let's fetch all versions and update link and table accordingly
            filesAPI.versions(file.id, {
                columns: "705,702,709,2"
            }).done(function (allVersions) {
                $mainContent.clear().append($versionTable);
                _(allVersions).each(function (version) {
                    $versionTable.append($("<tr>")
                        .append("<th>").text(version.version)
                        .append("<th>").text(version.filename)
                        .append("<th>").text(version.creaetd_by)
                        .append("<th>").text(version.version_comment)
                    );
                });
            });
        }
    });
    
    // Upload Field
    
    ext.point("io.ox/files/details").extend({
        id: 70,
        isEnabled: function (file) {
            return file.current_version;
        },
        draw: function (file) {
            var $node = $("<div>").addClass("span4 well").appendTo(this);
            
            var $input = $("<input>", {
                type: "file"
            }).appendTo($node);
            $node.append("<br>");
            $("<button/>").appendTo($node).text("Upload new version").addClass("btn").on("click", function () {
                _($input[0].files).each(function (fileData) {
                    filesAPI.uploadNewVersion({
                        file: fileData,
                        id: file.id,
                        folder: file.folder,
                        timestamp: file.last_modified
                    }).done(function (data) {
                        // TODO: Redraw Everything
                    });
                });
                
                return false;
            });
        }
    });
    
    

    return {
        draw: draw
    };
});