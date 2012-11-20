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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/files/list/view-detail",
    ["io.ox/core/extensions",
     "io.ox/core/extPatterns/links",
     "io.ox/core/extPatterns/layouts",
     "io.ox/core/tk/keys",
     "io.ox/core/date",
     "io.ox/core/event",
     "io.ox/files/actions",
     "io.ox/files/api",
     "io.ox/preview/main",
     "io.ox/core/tk/upload",
     "io.ox/core/api/user",
     "io.ox/core/api/folder",
     "gettext!io.ox/files"], function (ext, links, layouts, KeyListener, date, Event, actions, filesAPI, preview, upload, userAPI, folderAPI, gt) {

    "use strict";

    var draw;

    var createRedraw = function (node) {
        return function (e, data) {
            node.replaceWith(draw(data).element);
        };
    };

    draw = function (file) {

        var self,
            mode = 'display',
            $element = $.createViewContainer(file, filesAPI),
            sections = new layouts.Sections({
                ref: "io.ox/files/details/sections"
            }),
            eventHub = new Event({});

        $element.on('redraw', createRedraw($element))
            .addClass('file-details view');

        var blacklisted = {
            "refresh.list": true
        };

        self = {
            element: $element,
            file: file,
            trigger: function (type, evt) {
                if (blacklisted[type]) {
                    return;
                }
                var self = this;
                if (evt && evt.id && evt.id === file.id && type !== "delete") {
                    filesAPI.get({ id: evt.id, folder: evt.folder_id }).done(function (file) {
                        self.file = file;
                        sections.trigger($element, type, file);
                    });
                }
            },
            registerInlineEdit: function ($node) {
                var self = this;
                $node.on("dblclick", function (e) {
                    if (_(["a", "button", "input", "textarea"]).include(e.srcElement.tagName.toLowerCase())) {
                        return;
                    }
                    self.toggleEdit();
                });
            },
            toggleEdit: function () {
                if (mode === 'edit') {
                    // Trigger Save
                    ext.point("io.ox/files/actions/edit/save").invoke("action", self, self.getModifiedFile(), {view: self, data: self.getModifiedFile()});
                } else {
                    self.edit();
                }
            },
            on: eventHub.on,
            off: eventHub.off,
            edit: function () {
                if (mode === 'edit') {
                    return;
                }
                eventHub.trigger('edit');
                mode = 'edit';
                sections.each(function (sublayout, $sectionNode) {
                    var hideSection = true;
                    sublayout.each(function (extension, $node) {
                        if (extension.edit) {
                            hideSection = false;
                            extension.edit.call($node, file, {data: file, view: self});
                        } else {
                            if (extension.deactivate) {
                                hideSection = false;
                                extension.deactivate.call($node, file, {data: file, view: self});
                            } else {
                                // Dim the extension, poor mans 'deactivate'
                                if ($node) {
                                    $node.css({opacity: "0.5" });
                                }
                            }
                        }
                    });

                    if (hideSection) {
                        $sectionNode.fadeOut();
                        $sectionNode.data("io-ox-files-hidden", true);
                    }

                });
            },
            endEdit: function () {
                if (mode === 'display') {
                    return;
                }
                eventHub.trigger('endEdit');

                mode = 'display';
                sections.each(function (sublayout, $sectionNode) {
                    sublayout.each(function (extension, $node) {
                        if (extension.endEdit) {
                            extension.endEdit.call($node, file, {data: file, view: self});
                        } else {
                            if (extension.activate) {
                                extension.activate.call($node, file, {data: file, view: self});
                            } else {
                                // Activate the extension
                                if ($node) {
                                    $node.css({opacity: "" });
                                }
                            }
                        }
                    });

                    if ($sectionNode.data("io-ox-files-hidden")) {
                        $sectionNode.fadeIn();
                        $sectionNode.data("io-ox-files-hidde", false);
                    }
                });
            },
            getModifiedFile: function () {
                sections.each(function (sublayout, $sectionNode) {
                    sublayout.each(function (extension, $node) {
                        if (extension.process) {
                            extension.process.call($node, file, {data: file, view: self});
                        }
                    });
                });
                return file;
            },
            destroy: function () {
                sections.destroy();
                $element.empty();
                $element = null;
            }
        };

        sections.draw.call($element, file, self);

        return self;
    };

    // Let's define the standard sections
    ext.point("io.ox/files/details/sections").extend({
        id: "header",
        layout: "Grid",
        index: 100
    });

    ext.point("io.ox/files/details/sections").extend({
        id: "content",
        layout: "Grid",
        index: 200
    });

    ext.point("io.ox/files/details/sections").extend({
        id: "upload",
        title: gt("Upload a new version"),
        layout: "Grid",
        index: 300
    });

    ext.point("io.ox/files/details/sections").extend({
        id: "versions",
        title: gt("Versions"),
        layout: "Grid",
        index: 400,
        isEnabled: function (file) {
            // show versions if there is more than one - even if version #1 is marked as current
            return file.number_of_versions > 1 || (file.current_version && file.version > 1);
        }
    });

//    ext.point("io.ox/files/details/sections").extend({
//        id: "folder",
//        layout: "Grid",
//        index: 500
//    });
//
//    ext.point("io.ox/files/details/sections/folder").extend({
//        id: 'folder',
//        draw: function (file) {
//            this.append(folderAPI.getBreadcrump(file.folder_id));
//        }
//    });

    // Fill up the sections


    // Details Extensions
    // Title
    ext.point("io.ox/files/details/sections/header").extend({
        id: "title",
        index: 10,
        draw: function (file) {
            this.append(
                $("<div>").addClass("title clear-title").text(gt.noI18n(file.title || file.filename || '\u00A0'))
            );
        },
        edit: function (file, context) {
            var size = this.find(".title").height(),
                keyListener = new KeyListener(this).include();
            if (size < 30) {
                size = 30;
            }
            this.find(".title").empty().append(
                $('<input>', { type: 'text', name: 'title' })
                .addClass('editing')
                .attr({placeholder: gt("Title"), tabIndex: 10})
                .val(file.title));

            this.find("input").focus();

            keyListener.on("enter", function () {
                context.view.toggleEdit();
            });
            this.data("keyListener", keyListener);
        },
        endEdit: function (file) {
            this.find(".title").empty().text(gt.noI18n(file.title || file.filename || '\u00A0'));
            this.data("keyListener").remove();
            this.data("keyListener", null);
        },
        process: function (file) {
            file.title = this.find("input").val();
        },
        on: {
            update: function (file) {
                this.empty();
                this.append(
                    $("<div>").addClass("title clear-title").text(gt.noI18n(file.title || file.filename || '\u00A0'))
                );
            }
        }
    });


    // Basic Info Table
    ext.point("io.ox/files/details/sections/header").extend({
        id: "basicInfo",
        index: 20,
        draw: function (file) {
            this.addClass("basicInfo");
            var $line = $("<div>");
            this.append($line);

            ext.point("io.ox/files/details/sections/header/basicInfo").each(function (extension) {
                var count = 0;
                _.each(extension.fields, function (index, field) {
                    var content = null;
                    $line.append(
                        $("<em>").text(extension.label(field)),
                        content = $('<span>'),
                        $.txt(gt.noI18n('\u00A0 '))
                    );
                    extension.draw(field, file, content);
                    count++;
                    if (count === 5) {
                        count = 0;
                        $line = $("<div>");
                        this.append($line);
                    }
                });
            });
        },
        on: {
            update: function (file, extension) {
                this.empty();
                extension.draw.call(this, file);
            }
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

    ext.point("io.ox/files/details/sections/header/basicInfo").extend({
        id: "filename",
        index: 100,
        fields: ["filename"],
        label: function () {
            return gt("File name:");
        },
        draw: function (field, file, $element) {
            $element.text(gt.noI18n(file.filename) || gt('N/A'));
        }
    });

    ext.point("io.ox/files/details/sections/header/basicInfo").extend({
        id: "size",
        index: 200,
        fields: ["file_size"],
        label: function () {
            return gt("Size:");
        },
        draw: function (field, file, $element) {
            $element.text(gt.noI18n(bytesToSize(file.file_size)));
        }
    });

    // version number is boring
//    ext.point("io.ox/files/details/sections/header/basicInfo").extend({
//        id: "version",
//        index: 300,
//        fields: ["version"],
//        label: function (field) {
//            return gt("Version:");
//        },
//        draw: function (field, file, $element) {
//            $element.text(file.version);
//        }
//    });

    ext.point("io.ox/files/details/sections/header/basicInfo").extend({
        id: "last_modified",
        index: 400,
        fields: ["last_modified"],
        label: function () {
            return gt("Last Modified:");
        },
        draw: function (field, file, $element) {
            var d = new date.Local(date.Local.utc(file.last_modified));
            $element.append(
                userAPI.getLink(file.created_by),
                $.txt(gt.noI18n(' \u2013 ' + d.format(date.FULL_DATE))) // 2013 = ndash
            );
        }
    });

    // Basic Actions
    (function () {
        var regularLinks = new links.InlineLinks({
            ref: 'io.ox/files/links/inline'
        });

        var editLinks = new links.InlineLinks({
            ref: 'io.ox/files/links/edit/inline'
        });

        ext.point('io.ox/files/details/sections/header').extend({
            index: 30,
            id: 'inline-links',
            orientation: 'right',
            draw: function (file, detailView, extension) {
                regularLinks.draw.call(this, {
                    data: file,
                    view: detailView,
                    folder_id: file.folder_id // collection needs this to work!
                });
            },
            edit: function (file, context) {
                this.empty();
                editLinks.draw.call(this, {
                    data: file,
                    view: context.view,
                    folder_id: file.folder_id // collection needs this to work!
                });

            },
            endEdit: function (file, context) {
                this.empty();
                regularLinks.draw.call(this, {
                    data: file,
                    view: context.view,
                    folder_id: file.folder_id // collection needs this to work!
                });
            }
        });

    }());



    // Content Section
    // Preview
    ext.point("io.ox/files/details/sections/content").extend(new preview.Extension({
        id: "preview",
        index: 10,
        dim: {
            span: 6
        },
        parseArguments: function (file) {
            if (!file.filename) {
                return null;
            }

            return {
                name: file.filename,
                mimetype: file.file_mimetype,
                size: file.file_size,
                dataURL: filesAPI.getUrl(file, 'bare'),
                version: file.version,
                id: file.id
            };
        },
        on: {
            update: function (file, extension) {
                this.empty();
                console.log('Sind wir hier?', file);
                extension.draw.call(this, file, extension);
            }
        }
    }));

    // Description

    ext.point("io.ox/files/details/sections/content").extend({
        id: "description",
        index: 20,
        dim: {
            span: 6
        },
        isEnabled: function (file) {
            return true;
        },
        draw: function (file) {
            this.append(
                $("<div>")
                .css({
                    // makes it readable
                    fontFamily: "monospace, 'Courier new'",
                    whiteSpace: "pre-wrap",
                    paddingRight: "2em"
                }).addClass("description")
                .text(gt.noI18n(file.description || ''))
            );
        },
        edit: function (file, context) {
            var height = this.parent().innerHeight(),
                keyListener = new KeyListener(this).include();
            if (height < 220) {
                height = 220;
            }
            this.empty().append($("<textarea>").css({resize: 'none', width: "100%", height: height + "px", boxSizing: "border-box"}).attr({placeholder: gt("Description"), tabIndex: 20}).val(file.description));
            keyListener.on("shift+enter", function (evt) {
                context.view.toggleEdit();
            });
            this.data("keyListener", keyListener);

        },
        endEdit: function (file) {
            this.empty().append(
                $("<div>")
                .css({
                    // makes it readable
                    fontFamily: "monospace, 'Courier new'",
                    whiteSpace: "pre-wrap",
                    paddingRight: "2em"
                }).addClass("description")
                .text(gt.noI18n(file.description || ''))
            );
            this.data("keyListener").remove();
            this.data("keyListener", null);

        },
        process: function (file) {
            file.description = this.find("textarea").val();
        },
        on: {
            update: function (file, extension) {
                this.empty();
                extension.draw.call(this, file, extension);
            }
        }
    });


    // Upload Field

    ext.point("io.ox/files/details/sections/upload").extend({
        id: "form",
        index: 10,
        dim: {
            span: 12
        },
        draw: function (file) {
            var self = this;
            var $node = $("<form>").appendTo(this);
            var $input = $("<input>", {
                type: "file"
            });

            var $button = $("<button>").text(gt("Upload"))
            .addClass("btn btn-primary")
            .attr({
                'disabled': 'disabled',
                'data-action': 'upload'
            })
            .on("click", function () {
                _($input[0].files).each(function (fileData) {
                    $button.addClass("disabled").text(gt("Uploading..."));
                    $commentArea.addClass("disabled");
                    $input.addClass("disabled");
                    filesAPI.uploadNewVersion({
                        file: fileData,
                        id: file.id,
                        folder: file.folder,
                        timestamp: file.last_modified,
                        json: {version_comment: $commentArea.val()}
                    }).done(function (data) {
                        $button.removeClass("disabled").text(gt("Upload new version"));
                        $commentArea.removeClass("disabled");
                        $input.removeClass("disabled");
                        $comment.hide();
                        $commentArea.val("");
                    });
                });

                return false;
            });

            $node.append(
                $input, $button
            );

            var $comment = $("<div>").addClass("row-fluid").hide().appendTo($node);
            $comment.append($("<label>").text(gt("Version Comment:")));
            var $commentArea = $('<textarea rows="5">').css({ resize: 'none', width: "100%" }).appendTo($comment);

            $input.on("change", function () {
                $button.removeAttr('disabled');
                $comment.show();
                $commentArea.focus();
            });

            new KeyListener($comment).on("shift+enter", function (evt) {
                evt.preventDefault();
                evt.stopImmediatePropagation();
                $button.click();
            }).include();
        }
    });

    // Version List

    var versionSorter = function (version1, version2) {
        if (version1.version === version2.version) {
            return 0;
        }
        if (version1.current_version) {
            return -1;
        }
        if (version2.current_version) {
            return 1;
        }
        return version2.version - version1.version;
    };

    ext.point("io.ox/files/details/sections/versions").extend({
        id: "table",
        index: 10,
        isEnabled: function (file) {
            // this check appears twice - this one seems to have no effect. Happy debugging!
            return file.number_of_versions > 1 || (file.current_version && file.version > 1);
        },
        draw: function (file, detailView, allVersions) {
            var self = this,
                $link = $("<a>", {
                    href: '#'
                }).appendTo(this),
                $mainContent = $("<div>").addClass("versions");

            function drawAllVersions(allVersions) {
                $mainContent.empty();
                _.chain(allVersions).sort(versionSorter).each(function (version) {
                    var $entryRow = $("<div>")
                            .addClass("row-fluid version " + (version.current_version ? 'current' : ''))
                            .append(
                                $("<div>").addClass("span1").append(
                                    $("<span>").text(gt.noI18n(version.version)).addClass("versionLabel")
                                )
                            ),
                        $detailsPane = $("<div>").addClass("span11").appendTo($entryRow);
                    new layouts.Grid({ref: "io.ox/files/details/versions/details"}).draw.call($detailsPane, version);
                    $mainContent.append($entryRow);
                });
                self.empty().append($mainContent);
            }

            // Then let's fetch all versions and update the table accordingly
            if (!allVersions) {
                filesAPI.versions({
                    id: file.id
                }).done(drawAllVersions);
            } else {
                drawAllVersions(allVersions);
            }
        },

        on: {
            update: function (file, extension) {
                var self = this;
                filesAPI.versions({
                    id: file.id
                }).done(function (allVersions) {
                    self.empty();
                    extension.draw.call(self, file, null, allVersions);
                });
            }
        }
    });

    // Extensions for the version detail table

    ext.point("io.ox/files/details/versions/details").extend({
        index: 10,
        id: "filename",
        dim: {
            span: 4
        },
        draw: function (version) {
            new links.DropdownLinks({
                label: version.filename,
                ref: "io.ox/files/versions/links/inline"
            }).draw.call(this, version);
        }
    });

    ext.point("io.ox/files/details/versions/details").extend({
        index: 20,
        id: "size",
        dim: {
            span: 4
        },
        draw: function (version) {
            this.text(gt.noI18n(bytesToSize(version.file_size))).css({textAlign: "right"});
        }
    });

    ext.point("io.ox/files/details/versions/details").extend({
        index: 30,
        id: "created_by",
        dim: {
            span: 4,
            orientation: 'right'
        },
        draw: function (version) {
            this.append($("<span>").append(userAPI.getLink(version.created_by)).addClass("pull-right"));
        }
    });

    ext.point("io.ox/files/details/versions/details").extend({
        index: 40,
        id: "comment",
        dim: {
            span: 8
        },
        draw: function (version) {
            this.addClass('version-comment').text(gt.noI18n(version.version_comment || '\u00A0'));
        }
    });

    ext.point("io.ox/files/details/versions/details").extend({
        index: 50,
        id: "creation_date",
        dim: {
            span: 4,
            orientation: 'right'
        },
        draw: function (version) {
            var d = new date.Local(date.Local.utc(version.creation_date));
            this.append($("<span>").text(gt.noI18n(d.format(date.DATE_TIME)))
                                   .addClass("pull-right"));
        }
    });

    return {
        draw: draw
    };
});
