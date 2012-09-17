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

define("io.ox/files/actions",
    ["io.ox/files/api",
     "io.ox/core/extensions",
     "io.ox/core/extPatterns/links",
     "gettext!io.ox/files/files"], function (api, ext, links, gt) {

    'use strict';

    var Action = links.Action, Link = links.XLink, Button = links.Button, Dropdown = links.Dropdown, ButtonGroup = links.ButtonGroup;

    // actions

	new Action('io.ox/files/actions/switch-to-list-view', {
        requires: true,
        action: function (app) {
            require(['io.ox/files/list/perspective'], function (perspective) {
                perspective.show(app);
            });
        }
    });

    new Action('io.ox/files/actions/switch-to-icon-view', {
        requires: true,
        action: function (app) {
            require(['io.ox/files/icons/perspective'], function (perspective) {
                perspective.show(app);
            });
        }
    });

    new Action('io.ox/files/actions/upload', {
        id: 'upload',
        requires: 'create',
        action: function (app) {
            require(['io.ox/files/views/create'], function (create) {
                create.show(app, {
                    uploadedFile: function (data) {
                        app.invalidateFolder(data);
                    }
                });
            });
        }
    });

    new Action('io.ox/files/actions/share', {
        id: 'share',
        action: function (app) {
            require(['io.ox/publications/wizard'], function (wizard) {
                wizard.oneClickAdd(app.folder.get());
            });
        }
    });

    // editor
    new Action('io.ox/files/actions/editor', {
        id: 'editor',
        requires: function (e) {
            return e.collection.has('one') && (/\.(txt|js|md)$/i).test(e.context.data.filename);
        },
        action: function (data) {
            ox.launch('io.ox/editor/main').done(function () {
                this.load(data);
            });
        }
    });

    new Action('io.ox/files/actions/editor-new', {
        id: 'editor-new',
        action: function (app) {
            ox.launch('io.ox/editor/main').done(function () {
                this.create({ folder: app.folder.get() });
            });
        }
    });

    new Action('io.ox/files/actions/fullscreen', {
        id: 'fullscreen',
        action: function (app) {
            require(['io.ox/files/bigscreen'], function () {
                if (app.currentFile.file_mimetype.match(/^image\/[gif|png|jpe?g|gmp]/i)) {
                    var src = api.getUrl(app.currentFile, 'open');
                    $('#tmp').append($('<img>', { src: src })).show();
                    if (this.BigScreen.enabled) {
                        this.BigScreen.request($('#tmp').get(0));
                    }
                    this.BigScreen.onexit = function () {
                        $('#tmp').empty().hide();
                    };
                }
            });
        }
    });

    new Action('io.ox/files/actions/download', {
        id: 'download',
        requires: 'some',
        action: function (list) {
            // loop over list, get full file object and trigger downloads
            _(list).each(function (o) {
                api.get(o).done(function (file) {
                    if (o.version) {
                        file = _.extend({}, file, { version: o.version });
                    }
                    window.open(api.getUrl(file, 'download'));
                });
            });
        }
    });

    new Action('io.ox/files/actions/edit', {
        id: 'edit',
        requires: 'one modify',
        action: function (file, context) {
            context.view.edit();
        }
    });

    new Action('io.ox/files/actions/open', {
        id: 'open',
        requires: 'some',
        multiple: function (list) {
            // loop over list, get full file object and open new window
            _(list).each(function (o) {
                api.get(o).done(function (file) {
                    if (o.version) {
                        file = _.extend({}, file, { version: o.version });
                    }
                    window.open(api.getUrl(file, 'open'), file.title || 'file');
                });
            });
        }
    });

    new Action('io.ox/files/actions/send', {
        id: 'send',
        requires: 'some',
        multiple: function (list) {
            require(['io.ox/mail/write/main'], function (m) {
                api.getList(list).done(function (list) {
                    m.getApp().launch().done(function () {
                        this.compose({ infostore_ids: list });
                    });
                });
            });
        }
    });

    new Action('io.ox/files/actions/delete', {
        id: 'delete',
        requires: 'some',
        multiple: function (list) {
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                new dialogs.ModalDialog()
                    .text(gt("Are you really sure about your decision? Are you aware of all consequences you have to live with?"))
                    .addPrimaryButton("delete", gt("Shut up and delete it!"))
                    .addButton("cancel", gt("No, rather not"))
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            api.remove(list);
                        }
                    });
            });
        }
    });

    // edit mode actions
    ext.point("io.ox/files/actions/edit/save").extend({
        id: "save",
        action: function (file, context) {
            var updatedFile = context.view.getModifiedFile();
            context.view.endEdit();
            api.update(updatedFile).done();
        }
    });

    ext.point("io.ox/files/actions/edit/cancel").extend({
        id: "cancel",
        action: function (file, context) {
            context.view.endEdit();
        }
    });


    // version specific actions

    new Action('io.ox/files/versions/actions/makeCurrent', {
        id: 'makeCurrent',
        action: function (data) {
            api.update({
                id: data.id,
                last_modified: data.last_modified,
                version: data.version
            });
        }
    });

    new Action('io.ox/files/versions/actions/delete', {
        id: 'delete',
        action: function (data) {
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                new dialogs.ModalDialog()
                    .text(gt("Are you really sure about your decision? Are you aware of all consequences you have to live with?"))
                    .addPrimaryButton("delete", gt("Shut up and delete it!"))
                    .addButton("cancel", gt("No, rather not"))
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            api.detach(data);
                        }
                    });
            });
        }
    });

    ext.point('io.ox/files/links/toolbar').extend(new links.Button({
        index: 100,
        id: "upload",
        label: gt("Upload"),
        cssClasses: 'btn btn-primary',
        ref: "io.ox/files/actions/upload"
    }));

    ext.point('io.ox/files/links/toolbar').extend(new links.Button({
        index: 200,
        id: "share",
        label: gt("Share"),
        cssClasses: 'btn btn-primary',
        ref: "io.ox/files/actions/share"
    }));

    ext.point('io.ox/files/links/toolbar').extend(new links.Button({
        index: 300,
        id: "editor-new",
        label: gt("Pad!"),
        cssClasses: 'btn btn-primary',
        ref: "io.ox/files/actions/editor-new"
    }));

    ext.point('io.ox/files/links/toolbar').extend(new links.Button({
        index: 350,
        id: "fullscreen",
        label: 'Fullscreen',
        cssClasses: 'btn btn-primary',
        ref: "io.ox/files/actions/fullscreen"
    }));

    // links
	new ButtonGroup('io.ox/files/links/toolbar', {
        id: 'view',
        index: 400,
        label: gt('View')
    });

    ext.point('io.ox/files/links/toolbar/view').extend(new links.Button({
        id: 'list',
        index: 100,
        label: gt('List'),
        cssClasses: 'active',
        groupButton: true,
        ref: 'io.ox/files/actions/switch-to-list-view'
    }));

    ext.point('io.ox/files/links/toolbar/view').extend(new links.Button({
        id: 'icon',
        index: 200,
        label: gt('Icons'),
        groupButton: true,
        ref: 'io.ox/files/actions/switch-to-icon-view'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: "editor",
        index: 40,
        prio: 'hi',
        label: gt("Edit document"),
        ref: "io.ox/files/actions/editor"
    }));

    ext.point("io.ox/files/links/inline").extend(new links.Link({
        id: "edit",
        index: 50,
        label: gt("Edit"),
        ref: "io.ox/files/actions/edit"
    }));

    ext.point("io.ox/files/links/inline").extend(new links.Link({
        id: "open",
        index: 100,
        prio: 'hi',
        label: gt("Open"),
        ref: "io.ox/files/actions/open"
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'download',
        index: 200,
        prio: 'hi',
        label: gt("Download"),
        ref: "io.ox/files/actions/download"
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'send',
        index: 300,
        label: gt("Send by email"),
        ref: "io.ox/files/actions/send"
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'delete',
        index: 400,
        prio: 'hi',
        label: gt("Delete"),
        ref: "io.ox/files/actions/delete"
    }));

    // edit links

    ext.point("io.ox/files/links/edit/inline").extend(new links.Button({
        id: "cancel",
        index: 100,
        label: gt("Cancel"),
        ref: "io.ox/files/actions/edit/cancel",
        cssClasses: "btn",
        tabIndex: 40
    }));

    ext.point("io.ox/files/links/edit/inline").extend(new links.Button({
        id: "save",
        index: 100000,
        label: gt("Save"),
        ref: "io.ox/files/actions/edit/save",
        cssClasses: "btn btn-primary",
        tabIndex: 30
    }));


    // version links


    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'open',
        index: 100,
        label: gt("Open"),
        ref: "io.ox/files/actions/open"
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'download',
        index: 200,
        label: gt("Download"),
        ref: "io.ox/files/actions/download"
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'makeCurrent',
        index: 250,
        label: gt("Make this the current version"),
        ref: "io.ox/files/versions/actions/makeCurrent",
        isEnabled: function (file) {
            return !file.current_version;
        }
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'delete',
        index: 300,
        label: gt("Delete version"),
        ref: "io.ox/files/versions/actions/delete",
        special: "danger"
    }));

    // Drag and Drop

    ext.point('io.ox/files/dnd/actions').extend({
        id: 'create',
        index: 10,
        label: gt("Drop here to upload a <b>new file</b>"),
        action: function (file, app) {
            app.queues.create.offer(file);
        }
    });

    ext.point('io.ox/files/dnd/actions').extend({
        id: 'newVersion',
        index: 20,
        isEnabled: function (app) {
            return !!app.currentFile;
        },
        label: function (app) {
            if (app.currentFile.title) {
                return gt(
                    //#. %1$s is the title of the file
                    'Drop here to upload a <b>new version</b> of "%1$s"',
                    String(app.currentFile.title).replace(/</g, '&lt;')
                );
            } else {
                return gt('Drop here to upload a <b>new version</b>');
            }
        },
        action: function (file, app) {
            app.queues.update.offer(file);
        }
    });

    // Keyboard Shotcuts

    ext.point("io.ox/files/shortcuts").extend({
        id: "cancel",
        shortcut: "esc",
        ref: "io.ox/files/actions/edit/cancel"
    });

    ext.point("io.ox/files/shortcuts").extend({
        id: "edit",
        shortcut: "ctrl+enter",
        ref: "io.ox/files/actions/edit"
    });

});
