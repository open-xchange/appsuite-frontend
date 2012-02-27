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

define("io.ox/files/actions", ["io.ox/core/extensions"], function (ext) {

    "use strict";

    // actions

    ext.point("io.ox/files/actions/upload").extend({
        id: "upload",
        action: function (app) {
            var lastUploaded = null;
            require(["io.ox/files/views/create"], function (create) {
                create.show({
                    uploadedFile: function (data) {
                        app.invalidateFolder(data);
                    }
                });
            });
        }
    });

    ext.point("io.ox/files/actions/download").extend({
        id: "download",
        action: function (file) {
            window.open(file.url + "&content_type=application/octet-stream" +
                    "&content_disposition=attachment", file.title);
        }
    });

    ext.point("io.ox/files/actions/open").extend({
        id: "open",
        action: function (file) {
            window.open(file.url, file.title);
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
                    .addButton("delete", "Shut up and delete it!")
                    .show()
                    .done(function (action) {
                        if (action === "delete") {
                            api.remove(data);
                        }
                    });
            });
        }
    });

    // links

    ext.point("io.ox/files/links/toolbar").extend(new ext.Link({
        index: 100,
        id: "upload",
        label: "Upload",
        ref: "io.ox/files/actions/upload"
    }));

    ext.point("io.ox/files/links/inline").extend(new ext.Link({
        id: "open",
        index: 100,
        label: "Open",
        ref: "io.ox/files/actions/open"
    }));

    ext.point("io.ox/files/links/inline").extend(new ext.Link({
        id: "download",
        index: 200,
        label: "Download",
        ref: "io.ox/files/actions/download"
    }));

    ext.point("io.ox/files/links/inline").extend(new ext.Link({
        id: "send",
        index: 300,
        label: "Send by E-Mail",
        ref: "io.ox/files/actions/send"
    }));

    ext.point("io.ox/files/links/inline").extend(new ext.Link({
        id: "delete",
        index: 400,
        label: "Delete",
        ref: "io.ox/files/actions/delete",
        special: "danger"
    }));
    
    // version links
    
    ext.point("io.ox/files/versions/links/inline").extend(new ext.Link({
        id: "open",
        index: 100,
        label: "Open",
        ref: "io.ox/files/actions/open"
    }));

    ext.point("io.ox/files//versions/links/inline").extend(new ext.Link({
        id: "download",
        index: 200,
        label: "Download",
        ref: "io.ox/files/actions/download"
    }));

    ext.point("io.ox/files/versions/links/inline").extend(new ext.Link({
        id: "send",
        index: 300,
        label: "Send by E-Mail",
        ref: "io.ox/files/actions/send"
    }));

    ext.point("io.ox/files/versions/links/inline").extend(new ext.Link({
        id: "delete",
        index: 400,
        label: "Delete",
        ref: "io.ox/files/actions/delete",
        special: "danger"
    }));

});