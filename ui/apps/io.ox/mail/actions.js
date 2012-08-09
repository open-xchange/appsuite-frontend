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

define('io.ox/mail/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'gettext!io.ox/mail/mail',
     'io.ox/core/config'], function (ext, links, api, util, gt, config) {

    'use strict';


    var defaultDraftFolder = config.get('modules.mail.defaultFolder.drafts'),
        Action = links.Action;


    // actions

    new Action('io.ox/mail/actions/reader', {
        id: 'reader',
        action: function (app) {
            app.toggleLamp();
        }
    });

    new Action('io.ox/mail/actions/compose', {
        id: 'compose',
        action: function (app) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.compose({ folder_id: app.folder.get() });
                });
            });
        }
    });

    new Action('io.ox/mail/actions/delete', {
        id: 'delete',
        requires: 'toplevel some delete',
        multiple: function (list) {
            api.remove(list);
        }
    });

    new Action('io.ox/mail/actions/reply-all', {
        id: 'reply-all',
        requires: function (e) {
            // other recipients that me?
            return e.collection.has('toplevel', 'one') &&
                util.hasOtherRecipients(e.context) && e.context.folder_id !== defaultDraftFolder;
        },
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.replyall(data);
                });
            });
        }
    });

    new Action('io.ox/mail/actions/reply', {
        id: 'reply',
        requires: function (e) {
            return e.collection.has('toplevel', 'one') && e.context.folder_id !== defaultDraftFolder;
        },
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.reply(data);
                });
            });
        }
    });

    new Action('io.ox/mail/actions/forward', {
        id: 'forward',
        requires: function (e) {
            return e.collection.has('toplevel', 'some');
        },
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.forward(data);
                });
            });
        }
    });

    new Action('io.ox/mail/actions/edit', {
        id: 'edit',
        requires: function (e) {
            return e.collection.has('toplevel', 'one') && e.context.folder_id === defaultDraftFolder;
        },
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    var self = this;
                    this.compose(data).done(function () {
                        self.setMsgRef(data.folder_id + '/' + data.id);
                        self.markClean();
                    });
                });
            });
        }
    });

    new Action('io.ox/mail/actions/source', {
        id: 'source',
        requires: 'toplevel one',
        action: function (data) {
            var getSource = api.getSource(data), textarea;
            require(["io.ox/core/tk/dialogs"], function (dialogs) {
                new dialogs.ModalDialog({ easyOut: true, width: 700 })
                    .addPrimaryButton("close", gt("Close"))
                    .header(
                        $('<h3>').text(gt('Mail source') + ': ' + (data.subject || ''))
                    )
                    .append(
                        textarea = $('<textarea>', { rows: 15, readonly: 'readonly' })
                        .css({ width: '100%', boxSizing: 'border-box', visibility: 'hidden' })
                        .addClass('input-xlarge')
                        .on('keydown', function (e) {
                            if (e.which !== 27) {
                                e.stopPropagation();
                            }
                        })
                    )
                    .show(function () {
                        var self = this.busy();
                        getSource.done(function (src) {
                            textarea.val(src || '').css({ visibility: '',  cursor: 'default' });
                            textarea = getSource = null;
                            self.idle();
                        });
                    });
            });
        }
    });

    new Action('io.ox/mail/actions/move', {
        id: 'move',
        requires: 'toplevel some',
        multiple: function (mail) {
            var self = this;
            require(["io.ox/core/tk/dialogs", "io.ox/core/tk/folderviews"], function (dialogs, views) {
                var dialog = new dialogs.ModalDialog({ easyOut: true })
                    .header($('<h3>').text('Move'))
                    .addPrimaryButton("ok", gt("OK"))
                    .addButton("cancel", gt("Cancel"));
                dialog.getBody().css('maxHeight', '250px');
                var item = _(mail).first(),
                    tree = new views.FolderTree(dialog.getBody(), { type: 'mail' });
                tree.paint();
                dialog.show(function () {
                    tree.selection.set(item.folder_id || item.folder);
                })
                .done(function (action) {
                    if (action === 'ok') {
                        var selectedFolder = tree.selection.get();
                        if (selectedFolder.length === 1) {
                            // move action
                            api.move(mail, selectedFolder[0].id);
                        }
                    }
                    tree.destroy();
                    tree = dialog = null;
                });
            });
        }
    });

    new Action('io.ox/mail/actions/copy', {
        id: 'copy',
        requires: 'toplevel some',
        multiple: function (mail) {
            require(["io.ox/core/tk/dialogs", "io.ox/core/tk/folderviews"], function (dialogs, views) {
                var dialog = new dialogs.ModalDialog({ easyOut: true })
                    .header($('<h3>').text('Copy'))
                    .addPrimaryButton("ok", gt("OK"))
                    .addButton("cancel", gt("Cancel"));
                dialog.getBody().css('maxHeight', '250px');
                var item = _(mail).first(),
                    tree = new views.FolderTree(dialog.getBody(), { type: 'mail' });
                tree.paint();
                dialog.show(function () {
                    tree.selection.set({ id: item.folder_id || item.folder });
                })
                .done(function (action) {
                    if (action === 'ok') {
                        var selectedFolder = tree.selection.get();
                        if (selectedFolder.length === 1) {
                            // move action
                            api.copy(mail, selectedFolder[0].id);
                        }
                    }
                    tree.destroy();
                    tree = dialog = null;
                });
            });
        }
    });

    new Action('io.ox/mail/actions/markunread', {
        id: 'markunread',
        requires: function (e) {
            return api.getList(e.context).pipe(function (list) {
                var bool = e.collection.has('toplevel') &&
                    _(list).reduce(function (memo, data) {
                        return memo && (data && (data.flags & api.FLAGS.SEEN) === api.FLAGS.SEEN);
                    }, true);
                return bool;
            });
        },
        multiple: function (list) {
            api.markUnread(list);
        }
    });

    new Action('io.ox/mail/actions/markread', {
        id: 'markread',
        requires: function (e) {
            return api.getList(e.context).pipe(function (list) {
                var bool = e.collection.has('toplevel') &&
                    _(list).reduce(function (memo, data) {
                        return memo || (data && (data.flags & api.FLAGS.SEEN) === 0);
                    }, false);
                return bool;
            });
        },
        multiple: function (list) {
            api.markRead(list);
        }
    });

    new Action('io.ox/mail/actions/preview-attachment', {
        id: 'preview',
        requires: function (e) {
            return require(['io.ox/preview/main'])
                .pipe(function (p) {
                    var list = _.getArray(e.context);
                    // is at least one attachment supported?
                    return e.collection.has('some') && _(list).reduce(function (memo, obj) {
                        return memo || new p.Preview({
                            filename: obj.filename,
                            mimetype: obj.content_type
                        })
                        .supportsPreview();
                    }, false);
                });
        },
        multiple: function (list) {
            // open side popup
            var e = $.Event();
            e.target = this;
            require(['io.ox/core/tk/dialogs', 'io.ox/preview/main'], function (dialogs, p) {
                new dialogs.SidePopup().show(e, function (popup) {
                    _(list).each(function (data, i) {
                        var pre = new p.Preview({
                            data: data,
                            filename: data.filename,
                            mimetype: data.content_type,
                            dataURL: api.getUrl(data, 'view')
                        }, {
                            width: popup.parent().width(),
                            height: 'auto'
                        });
                        if (pre.supportsPreview()) {
                            popup.append(
                                $('<h4>').addClass('mail-attachment-preview').text(data.filename)
                            );
                            pre.appendTo(popup);
                            popup.append($('<div>').text('\u00A0'));
                        }
                    });
                });
            });
        }
    });

    new Action('io.ox/mail/actions/open-attachment', {
        id: 'open',
        requires: 'some',
        multiple: function (list) {
            _(list).each(function (data) {
                var url = api.getUrl(data, 'view');
                window.open(url);
            });
        }
    });

    new Action('io.ox/mail/actions/download-attachment', {
        id: 'download',
        requires: 'some',
        multiple: function (list) {
            var url;
            if (list.length === 1) {
                // download single attachment
                url = api.getUrl(_(list).first(), 'download');
            } else {
                // download zip file
                url = api.getUrl(list, 'zip');
            }
            window.open(url);
        }
    });

    new Action('io.ox/mail/actions/save-attachment', {
        id: 'save',
        requires: 'some',
        multiple: function (list) {
            api.saveAttachments(list).done(function (data) {
                // TODO: add confirmation
                console.log('Yep, saved!', data);
            });
        }
    });

    new Action('io.ox/mail/actions/save', {
        id: 'saveEML',
        requires: 'some',
        multiple: function (data) {
            window.open(api.getUrl(data, 'eml'));
        }
    });

    // toolbar

    ext.point('io.ox/mail/links/toolbar').extend(new links.Link({
        index: 100,
        id: 'compose',
        label: gt('Compose new mail'),
        ref: 'io.ox/mail/actions/compose'
    }));

    // TODO: reactivate or remove!
//    ext.point('io.ox/mail/links/toolbar').extend(new links.Link({
//        index: 200,
//        id: 'reader',
//        label: gt('Light!'),
//        ref: 'io.ox/mail/actions/reader'
//    }));

    // inline links

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'reply-all',
        label: gt('Reply All'),
        ref: 'io.ox/mail/actions/reply-all'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 200,
        prio: 'hi',
        id: 'reply',
        label: gt('Reply'),
        ref: 'io.ox/mail/actions/reply'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 300,
        prio: 'lo',
        id: 'forward',
        label: gt('Forward'),
        ref: 'io.ox/mail/actions/forward'
    }));

    // edit draft
    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 400,
        prio: 'hi',
        id: 'edit',
        label: gt('Edit'),
        ref: 'io.ox/mail/actions/edit'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 500,
        prio: 'hi',
        id: 'markunread',
        label: gt('Mark Unread'),
        ref: 'io.ox/mail/actions/markunread'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 501,
        prio: 'hi',
        id: 'markread',
        label: gt('Mark read'),
        ref: 'io.ox/mail/actions/markread'
    }));

    // change label

    var colorNames = {
        'NONE':      gt('None'),
        'RED':       gt('Red'),
        'BLUE':      gt('Blue'),
        'GREEN':     gt('Green'),
        'GREY':      gt('Grey'),
        'BROWN':     gt('Brown'),
        'AQUA':      gt('Aqua'),
        'ORANGE':    gt('Orange'),
        'PINK':      gt('Pink'),
        'LIGHTBLUE': gt('Lightblue'),
        'YELLOW':    gt('Yellow')
    };

    function changeLabel(e) {
        return api.update(e.data.data, { color_label: e.data.color, value: true });
    }

    new Action('io.ox/mail/actions/label', {
        id: 'label',
        requires: 'toplevel some',
        multiple: $.noop
    });

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 600,
        prio: 'lo',
        id: 'label',
        ref: 'io.ox/mail/actions/label',
        draw: function (data) {
            this.append(
                $('<span class="dropdown" class="io-ox-inline-links" data-prio="lo">')
                .append(
                    // link
                    $('<a href="#" data-toggle="dropdown">')
                    .text(gt('Label')).append($('<b class="caret">')).dropdown(),
                    // drop down
                    $('<ul class="dropdown-menu">')
                    .append(
                        _(api.COLORS).reduce(function (memo, index, color) {
                            return memo.add($('<li>').append(
                                $('<a>').text(colorNames[color])
                                .on('click', { data: data, color: index }, changeLabel)
                                .addClass(data.color_label === index ? 'active-label' : undefined)
                            ));
                        }, $())
                    )
                )
            );
        }
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 700,
        prio: 'lo',
        id: 'move',
        label: gt('Move'),
        ref: 'io.ox/mail/actions/move'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 800,
        prio: 'lo',
        id: 'copy',
        label: gt('Copy'),
        ref: 'io.ox/mail/actions/copy'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 900,
        prio: 'lo',
        id: 'source',
        label: gt('View Source'),
        ref: 'io.ox/mail/actions/source'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 1000,
        prio: 'hi',
        id: 'delete',
        label: gt('Delete'),
        ref: 'io.ox/mail/actions/delete'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 1100,
        prio: 'lo',
        id: 'saveEML',
        label: gt('Save as EML'),
        ref: 'io.ox/mail/actions/save'
    }));

    // Attachments

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'preview',
        index: 100,
        label: gt('Preview'),
        ref: 'io.ox/mail/actions/preview-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'open',
        index: 200,
        label: gt('Open in new tab'),
        ref: 'io.ox/mail/actions/open-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'download',
        index: 300,
        label: gt('Download'),
        ref: 'io.ox/mail/actions/download-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'save',
        index: 400,
        label: gt('Save in file store'),
        ref: 'io.ox/mail/actions/save-attachment'
    }));

    // DND actions

    ext.point('io.ox/mail/dnd/actions').extend({
        id: 'importEML',
        index: 10,
        label: gt('Drop here to import this mail'),
        action: function (file, app) {
            app.queues.importEML.offer(file);
        }
    });

});
