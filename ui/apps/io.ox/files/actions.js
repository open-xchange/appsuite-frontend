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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/files/actions", ["io.ox/core/extensions", "io.ox/core/extPatterns/links"], function (ext, links) {

    "use strict";

    // actions

    ext.point("io.ox/files/actions/upload").extend({
        id: "upload",
        requires: function (e) {
            return e.collection.has('create');
        },
        action: function (app) {
            var lastUploaded = null;
            require(["io.ox/files/views/create"], function (create) {
                create.show({
                    uploadedFile: function (data) {
                        app.invalidateFolder(data);
                    },
                    folder: app.folder.get()
                });
            });
        }
    });

    ext.point("io.ox/files/actions/share").extend({
        id: "share",
        action: function (app) {
            require(['io.ox/publications/wizard'], function (wizard) {
                wizard.oneClickAdd(app.folder.get());
            });
        }
    });

    ext.point("io.ox/files/actions/download").extend({
        id: "download",
        action: function (file) {
            window.open(file.documentUrl + "&content_type=application/octet-stream" +
                    "&content_disposition=attachment", file.title);
        }
    });
    
    ext.point("io.ox/files/actions/edit").extend({
        id: "upload",
        requires: function (e) {
            return true; //e.collection.has('modify');
        },
        action: function (context) {
            context.detailView.edit();
        }
    });

    ext.point("io.ox/files/actions/open").extend({
        id: "open",
        action: function (file) {
            window.open(file.documentUrl, file.title);
        }
    });

    ext.point("io.ox/files/actions/send").extend({
        id: "send",
        action: function (file) {
            alert("Zzzzzush: " + file.title);
        }
    });

    ext.point("io.ox/files/actions/delete").extend({
        id: "delete",
        action: function (data) {
            require(["io.ox/files/api", "io.ox/core/tk/dialogs"], function (api, dialogs) {
                new dialogs.ModalDialog()
                    .text("Are you really sure about your decision? Are you aware of all consequences you have to live with?")
                    .addButton("cancel", "No, rather not")
                    .addButton("delete", "Shut up and delete it!", undefined, { classes: 'btn-primary' })
                    .show()
                    .done(function (action) {
                        if (action === "delete") {
                            api.remove(data);
                        }
                    });
            });
        }
    });
    
    // edit mode actions
    ext.point("io.ox/files/actions/edit/save").extend({
        id: "save",
        action: function (context) {
            require(["io.ox/files/api"], function (api) {
                var updatedFile = context.detailView.getModifiedFile();
                api.update(updatedFile).done();
                context.detailView.endEdit();
            });
        }
    });
    
    ext.point("io.ox/files/actions/edit/cancel").extend({
        id: "cancel",
        action: function (context) {
            context.detailView.endEdit();
        }
    });
    
    
    // version specific actions

    ext.point("io.ox/files/versions/actions/makeCurrent").extend({
        id: "makeCurrent",
        action: function (data) {
            require(["io.ox/files/api"], function (api) {
                api.update({
                    id: data.id,
                    last_modified: data.last_modified,
                    version: data.version
                });
            });
        }
    });

    ext.point("io.ox/files/versions/actions/delete").extend({
        id: "delete",
        action: function (data) {
            require(["io.ox/files/api", "io.ox/core/tk/dialogs"], function (api, dialogs) {
                new dialogs.ModalDialog()
                    .text("Are you really sure about your decision? Are you aware of all consequences you have to live with?")
                    .addButton("cancel", "No, rather not")
                    .addButton("delete", "Shut up and delete it!", undefined, { classes: 'btn-primary' })
                    .show()
                    .done(function (action) {
                        if (action === "delete") {
                            api.detach(data);
                        }
                    });
            });
        }
    });


    // links

    ext.point("io.ox/files/links/toolbar").extend(new links.Link({
        index: 100,
        id: "upload",
        label: "Upload",
        ref: "io.ox/files/actions/upload"
    }));

    ext.point("io.ox/files/links/toolbar").extend(new links.Link({
        index: 200,
        id: "share",
        label: "Share",
        ref: "io.ox/files/actions/share"
    }));
    
    ext.point("io.ox/files/links/inline").extend(new links.Link({
        id: "edit",
        index: 50,
        label: "Edit",
        ref: "io.ox/files/actions/edit"
    }));
    
    ext.point("io.ox/files/links/inline").extend(new links.Link({
        id: "open",
        index: 100,
        label: "Open",
        ref: "io.ox/files/actions/open"
    }));

    ext.point("io.ox/files/links/inline").extend(new links.Link({
        id: "download",
        index: 200,
        label: "Download",
        ref: "io.ox/files/actions/download"
    }));

    ext.point("io.ox/files/links/inline").extend(new links.Link({
        id: "send",
        index: 300,
        label: "Send by E-Mail",
        ref: "io.ox/files/actions/send"
    }));

    ext.point("io.ox/files/links/inline").extend(new links.Link({
        id: "delete",
        index: 400,
        label: "Delete",
        ref: "io.ox/files/actions/delete"
    }));
    
    // edit links
    
    ext.point("io.ox/files/links/edit/inline").extend(new links.Button({
        id: "save",
        index: 100,
        label: "Save",
        ref: "io.ox/files/actions/edit/save",
        cssClasses: "btn btn-primary"
    }));

    ext.point("io.ox/files/links/edit/inline").extend(new links.Button({
        id: "cancel",
        index: 200,
        label: "Cancel",
        ref: "io.ox/files/actions/edit/cancel",
        cssClasses: "btn"
    }));

    // version links


    ext.point("io.ox/files/versions/links/inline").extend(new links.Link({
        id: "open",
        index: 100,
        label: "Open",
        ref: "io.ox/files/actions/open"
    }));

    ext.point("io.ox/files/versions/links/inline").extend(new links.Link({
        id: "download",
        index: 200,
        label: "Download",
        ref: "io.ox/files/actions/download"
    }));

    ext.point("io.ox/files/versions/links/inline").extend(new links.Link({
        id: "makeCurrent",
        index: 250,
        label: "Make this the current version",
        ref: "io.ox/files/versions/actions/makeCurrent",
        isEnabled: function (file) {
            return !file.current_version;
        }
    }));

    ext.point("io.ox/files/versions/links/inline").extend(new links.Link({
        id: "delete",
        index: 300,
        label: "Delete version",
        ref: "io.ox/files/versions/actions/delete",
        special: "danger"
    }));
    
    // Drag and Drop
    
    ext.point("io.ox/files/dnd/actions").extend({
        id: "create",
        index: 10,
        label: "Drop here to upload a new file",
        action: function (file, app) {
            app.queues.create.offer(file);
        }
    });
    
    ext.point("io.ox/files/dnd/actions").extend({
        id: "newVersion",
        index: 20,
        isEnabled: function (app) {
            return !!app.currentFile;
        },
        label: function (app) {
            if (app.currentFile.title) {
                return "Drop here to upload a new version of '" + app.currentFile.title + "'";
            } else {
                return "Drop here to upload a new version";
            }
        },
        action: function (file, app) {
            app.queues.update.offer(file);
        }
    });

});