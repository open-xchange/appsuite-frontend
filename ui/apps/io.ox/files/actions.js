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
     'io.ox/office/tk/config',
     "gettext!io.ox/files"], function (api, ext, links, OfficeConfig, gt) {

    'use strict';

    var Action = links.Action,
        ActionGroup = links.ActionGroup,
        ActionLink = links.ActionLink,

        POINT = 'io.ox/files';

    // actions

	new Action('io.ox/files/actions/switch-to-list-view', {
        requires: true,
        action: function (baton) {
            require(['io.ox/files/list/perspective'], function (perspective) {
                perspective.show(baton.app, { perspective: 'list' });
            });
        }
    });

    new Action('io.ox/files/actions/switch-to-icon-view', {
        requires: true,
        action: function (baton) {
            require(['io.ox/files/icons/perspective'], function (perspective) {
                perspective.show(baton.app, { perspective: 'icons' });
            });
        }
    });

    new Action('io.ox/files/actions/upload', {
        id: 'upload',
        requires: 'create',
        action: function (baton) {
            require(['io.ox/files/views/create'], function (create) {
                create.show(baton.app, {
                    uploadedFile: function (data) {
                        baton.app.invalidateFolder(data);
                    }
                });
            });
        }
    });

    new Action('io.ox/files/actions/share', {
        id: 'share',
        action: function (baton) {
            require(['io.ox/publications/wizard'], function (wizard) {
                wizard.oneClickAdd(baton.app.folder.get());
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
        action: function (baton) {
            ox.launch('io.ox/editor/main').done(function () {
                this.create({ folder: baton.app.folder.get() });
            });
        }
    });

    new Action('io.ox/files/actions/office/newdocument', {
        id: 'officenew',
        action: function (baton) {
            ox.launch('io.ox/office/editor/main', { file: 'new', folder_id: baton.app.folder.get() });
        }
    });

    new Action('io.ox/files/actions/office/editor', {
        id: 'officeeditor',
        requires: function (e) {
            var pattern = OfficeConfig.isODFSupported() ? /\.(odt|docx)$/i : /\.(docx)$/i;
            return e.collection.has('one') && pattern.test(e.context.data.filename);
        },
        action: function (data) {
            ox.launch('io.ox/office/editor/main', { file: data.data });
        }
    });

    new Action('io.ox/files/actions/office/view', {
        id: 'officepreview',
        requires: function (e) {
            return e.collection.has('one') && /\.(doc|docx|odt|xls|xlsx|odc|ppt|pptx|odp|odg)$/i.test(e.context.data.filename);
        },
        action: function (data) {
            ox.launch('io.ox/office/preview/main', { file: data.data }).done(function () {
                this.load();
            });
        }
    });

    new Action('io.ox/files/actions/download', {
        id: 'download',
        requires: 'some',
        multiple: function (list) {
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
        action: function (baton) {
            baton.view.edit();
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
            var question = gt.ngettext(
                    'Do you really want to delete this file?',
                    'Do you really want to delete these files?',
                    list.length
            );

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                new dialogs.ModalDialog()
                    .text(question)
                    .addPrimaryButton("delete", gt('Delete'))
                    .addButton("cancel", gt('Cancel'))
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
        action: function (baton) {
            console.log("Bla", arguments);
            var updatedFile = baton.view.getModifiedFile();
            baton.view.endEdit();
            api.update(updatedFile);
        }
    });

    ext.point("io.ox/files/actions/edit/cancel").extend({
        id: "cancel",
        action: function (baton) {
            baton.view.endEdit();
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
                // get proper question
                var question;
                if (_.isArray(data) && data.length > 1) {
                    question = gt('Do you really want to delete these files?');
                } else {
                    question = gt('Do you really want to delete this file?');
                }
                // ask
                new dialogs.ModalDialog()
                    .text(question)
                    .addPrimaryButton("delete", gt("Delete"))
                    .addButton("cancel", gt("Cancel"))
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            api.detach(data);
                        }
                    });
            });
        }
    });

    // groups

    new ActionGroup(POINT + '/links/toolbar', {
        id: 'default',
        index: 100,
        icon: function () {
            return $('<i class="icon-pencil">');
        }
    });

    new ActionLink(POINT + '/links/toolbar/default', {
        index: 100,
        id: "upload",
        label: gt("Upload new file"),
        ref: POINT + '/actions/upload'
    });

    new ActionLink(POINT + '/links/toolbar/default', {
        index: 200,
        id: "officenew",
        label: gt("New office document"),
        ref: "io.ox/files/actions/office/newdocument"
    });

    new ActionLink(POINT + '/links/toolbar/default', {
        index: 300,
        id: "share",
        label: gt("Share current folder"),
        ref: "io.ox/files/actions/share"
    });

    // VIEWS

    new ActionGroup(POINT + '/links/toolbar', {
        id: 'view',
        index: 150,
        label: gt('View'),
        icon: function () {
            return $('<i class="icon-eye-open">');
        }
    });

    new ActionLink(POINT + '/links/toolbar/view', {
        id: 'icons',
        index: 100,
        label: gt('Icons'),
        ref: 'io.ox/files/actions/switch-to-icon-view'
    });

    new ActionLink(POINT + '/links/toolbar/view', {
        id: 'list',
        index: 200,
        label: gt('List'),
        ref: 'io.ox/files/actions/switch-to-list-view'
    });

    // INLINE

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

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: "officeeditor",
        index: 60,
        prio: 'hi',
        label: gt("Change"),
        ref: "io.ox/files/actions/office/editor"
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: "officepreview",
        index: 65,
        prio: 'hi',
        label: gt("View"),
        ref: "io.ox/files/actions/office/view"
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
        label: gt("Discard"),
        ref: "io.ox/files/actions/edit/cancel",
        cssClasses: "btn",
        tabIndex: 30,
        tagtype: 'button',
        css: {
            marginRight: '10px'
        }
    }));

    ext.point("io.ox/files/links/edit/inline").extend(new links.Button({
        id: "save",
        index: 100000,
        label: gt("Save"),
        ref: "io.ox/files/actions/edit/save",
        cssClasses: "btn btn-primary",
        tabIndex: 40,
        tagtype: 'button'
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
        multiple: function (files, app) {
            app.queues.create.offer(files);
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

    // Iconview Inline Links

    new Action('io.ox/files/icons/slideshow', {
        requires: function (e) {
            return _(e.context.allIds).reduce(function (memo, obj) {
                return memo || (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
            }, false);
        },
        action: function (e) {
            var baton = e.baton;
            require(['io.ox/files/carousel'], function (carousel) {
                carousel.init({
                    fullScreen: false,
                    list: e.allIds,
                    app: baton.app,
                    attachmentMode: false
                });
            });
        }
    });

    new Action('io.ox/files/icons/slideshow-fullscreen', {
        requires: function (e) {
            return _(e.context.allIds).reduce(function (memo, obj) {
                return memo || (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
            }, false);
        },
        action: function (e) {
            var baton = e.baton;
            BigScreen.request(baton.app.getWindow().nodes.outer.get(0));
            require(['io.ox/files/carousel'], function (carousel) {
                carousel.init({
                    fullScreen: true,
                    list: e.allIds,
                    app: baton.app,
                    attachmentMode: false
                });
            });
        }
    });

    new Action('io.ox/files/icons/audioplayer', {
        requires: function (e) {
            return _(e.context.allIds).reduce(function (memo, obj) {
                return memo || (/\.(mp3|m4a|m4b|wma|wav|ogg)$/i).test(obj.filename);
            }, false);
        },
        action: function (e) {
            var baton = e.baton;
            require(['io.ox/files/mediaplayer'], function (mediaplayer) {
                mediaplayer.init({
                    list: e.allIds,
                    app: baton.app,
                    videoSupport: false
                });
            });
        }
    });

    new Action('io.ox/files/icons/videoplayer', {
        requires: function (e) {
            var pattern = '\\.(mp4|m4v|mov|avi|wmv|mpe?g|ogv|webm|3gp)';
            if (_.browser.Chrome) pattern = '\\.(mp4|m4v|avi|wmv|mpe?g|ogv|webm)';
            return _(e.context.allIds).reduce(function (memo, obj) {
                return memo || (new RegExp(pattern, 'i')).test(obj.filename);
            }, false);
        },
        action: function (e) {
            var baton = e.baton;
            require(['io.ox/files/mediaplayer'], function (mediaplayer) {
                mediaplayer.init({
                    list: e.allIds,
                    app: baton.app,
                    videoSupport: true
                });
            });
        }
    });

    ext.point('io.ox/files/icons/actions').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links',
        ref: 'io.ox/files/icons/inline'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'slideshow',
        label: gt('View Slideshow'),
        ref: 'io.ox/files/icons/slideshow'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        index: 200,
        prio: 'hi',
        cssClasses: 'io-ox-action-link fullscreen',
        id: 'slideshow-fullscreen',
        label: gt('Fullscreen'),
        ref: 'io.ox/files/icons/slideshow-fullscreen'
    }));


    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        index: 300,
        id: 'mediaplayer-audio',
        label: gt('Play audio files'),
        ref: 'io.ox/files/icons/audioplayer'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        index: 400,
        id: 'mediaplayer-video',
        label: gt('Play video files'),
        ref: 'io.ox/files/icons/videoplayer'
    }));


});
