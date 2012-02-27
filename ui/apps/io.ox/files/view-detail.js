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

        var $element = $("<div>").addClass("file-details view container-fluid");
        
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
                /*var prev = new Preview(file);
                if (prev.supportsPreview()) {
                    prev.appendTo(node);
                    node.show();
                }*/
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
                $("<div>").addClass("well span6")
                .css({
                    // makes it readable
                    fontFamily: "monospace, 'Courier new'",
                    whiteSpace: "pre-wrap",
                    paddingRight: "2em",
                    marginBottom: "2em"
                })
                .text(file.description));
            this.append($("<div>").addClass("span6").append("&nbsp;"));
        }
    });
    
    // Version List
    
    ext.point("io.ox/files/details").extend({
        id: "versions",
        isEnabled: function (file) {
            return file.current_version;
        },
        draw: function (file) {
            var self = this;
            var $link = $("<a>", {
                href: '#'
            }).appendTo(this),
            $mainContent = $("<div />").addClass("versions");
            
            $mainContent.append("No versions");
            
            // first let's deal with the link
            $link.text("Show all versions").on("click", function () {
                self.empty().append($mainContent);
                return false;
            });
            
            
            // Then let's fetch all versions and update link and table accordingly
            filesAPI.versions({
                id: file.id
            }).done(function (allVersions) {
                $mainContent.empty().append($("<h4>").text("Versions")).append($("<br/>"));
                _(allVersions).each(function (version) {
                    
                    var $entryRow = $("<div>").addClass("row-fluid version");
                    var $detailsPane = $("<div>");
                    var $currentRow, keepAround, side;
                    
                    $entryRow.append($("<div>").addClass("span1 versionLabel").text(version.version));
                    
                    $detailsPane.addClass("span10").appendTo($entryRow);
                    
                    
                    side = 'left';
                    
                    function invokeExtension(ext) {
                        var effectiveType, $element;
                        
                        effectiveType = ext.type;
                        if (!effectiveType) {
                            effectiveType = side;
                        }
                        if (effectiveType === 'row') {
                            effectiveType = 'left';
                        }
                        if (effectiveType === side) {
                            $element = $("<div>");
                            if (ext.type !== 'row') {
                                $element.addClass("span6");
                            }
                            ext.draw.call($element, version);
                            
                            $element.appendTo($currentRow);

                            if (ext.type === 'right' || ext.type === 'row') {
                                $currentRow = null;
                            }
                            if (ext.type === 'left') {
                                side = 'right';
                            }
                            return true;
                        }
                        return false;
                    }
                    
                    ext.point("io.ox/files/details/versions/details").each(function (ext) {
                        var keepForNextRound = null;
                        if (!$currentRow) {
                            $currentRow = $("<div>").addClass("row-fluid").appendTo($detailsPane);
                            side = 'left';
                        }
                        if (!invokeExtension(ext)) {
                            if (keepAround) {
                                // Draw blank
                                if (side === 'left') {
                                    $currentRow.append($("<div>").addClass("span6"));
                                    side = 'right';
                                    invokeExtension(keepAround);
                                    keepAround = ext;
                                } else {
                                    $currentRow = null;
                                    side = 'left';
                                    keepForNextRound = ext;
                                }
                            } else {
                                keepForNextRound = ext;
                            }
                        }
                        
                        if (!$currentRow) {
                            $currentRow = $("<div>").addClass("row-fluid").appendTo($detailsPane);
                            side = 'left';
                        }
                        
                        if (keepAround) {
                            invokeExtension(keepAround);
                            keepAround = null;
                        }
                        if (keepForNextRound) {
                            keepAround = keepForNextRound;
                        }
                        
                    });
                    
                    if (keepAround) {
                        if (keepAround.type === 'right') {
                            $currentRow.append($("<div>").addClass("span6"));
                            side = 'right';
                            invokeExtension(keepAround);
                        } else {
                            $currentRow = $("<div>").addClass("row-fluid").appendTo($detailsPane);
                            side = 'left';
                            invokeExtension(keepAround);
                        }
                    }
                    
                    $mainContent.append($entryRow);
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
    
    // Extensions for the version detail table
    
    ext.point("io.ox/files/details/versions/details").extend({
        index: 10,
        id: "filename",
        type: 'left',
        draw: function (version) {
            var $link = $("<a>", {href: '#'}).text(version.filename).on("click", function () {
                return false;
            });
            
            this.append($link);
        }
    });

    ext.point("io.ox/files/details/versions/details").extend({
        index: 20,
        id: "created_by",
        type: 'right',
        draw: function (version) {
            this.append($("<span>").text(version.created_by).addClass("pull-right"));
        }
    });
    
    ext.point("io.ox/files/details/versions/details").extend({
        index: 30,
        id: "size",
        type: 'left',
        draw: function (version) {
            this.text(bytesToSize(version.file_size));
        }
    });
    
    ext.point("io.ox/files/details/versions/details").extend({
        index: 40,
        id: "creation_date",
        type: 'right',
        draw: function (version) {
            this.append($("<span>").text(version.creation_date).addClass("pull-right"));
        }
    });
    
    ext.point("io.ox/files/details/versions/details").extend({
        index: 50,
        id: "comment",
        type: 'row',
        draw: function (version) {
            this.text("Lorem Ipsum dolor sic amet...").css({
                marginTop: "4px",
                fontFamily: "monospace, 'Courier new'",
                whiteSpace: "pre-wrap"
            });
        }
    });
    
    ext.point("io.ox/files/details/versions/details").extend(new ext.InlineLinks({
        index: 60,
        id: 'inline-links',
        type: 'row',
        ref: 'io.ox/files/versions/links/inline'
    }));
    

    return {
        draw: draw
    };
});