/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/actions',
    ['io.ox/files/api',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/core/capabilities',
     'io.ox/core/notifications',
     'gettext!io.ox/files',
     'settings!io.ox/files'], function (api, ext, links, capabilities, notifications, gt, settings) {

    'use strict';

    var Action = links.Action,
        ActionGroup = links.ActionGroup,
        ActionLink = links.ActionLink,
        POINT = 'io.ox/files';

    // actions

	new Action('io.ox/files/actions/switch-to-list-view', {
        requires: true,
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'list');
        }
    });

    new Action('io.ox/files/actions/switch-to-icon-view', {
        requires: true,
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'icons');
        }
    });

    new Action('io.ox/files/actions/upload', {
        requires: 'create',
        action: function (baton) {
            require(['io.ox/files/views/create'], function (create) {
                create.show(baton.app, {
                    uploadedFile: function (data) {
                        if ('invalidateFolder' in baton.app) {
                            baton.app.invalidateFolder(data);
                        }
                    }
                });
            });
        }
    });

    new Action('io.ox/files/actions/publish', {
        requires: function () {
            // DISABLED, since for no given full PUB/SUB support
            return false;
        },
        action: function (baton) {
            require(['io.ox/publications/wizard'], function (wizard) {
                wizard.oneClickAdd(baton.app.folder.get());
            });
        }
    });

    // editor
    new Action('io.ox/files/actions/editor', {
        requires: function (e) {
            return e.collection.has('one') && (/\.(txt|js|md)$/i).test(e.context.filename);
        },
        action: function (baton) {
            ox.launch('io.ox/editor/main').done(function () {
                this.load(baton.data);
            });
        }
    });

    new Action('io.ox/files/actions/editor-new', {
        action: function (baton) {
            ox.launch('io.ox/editor/main').done(function () {
                this.create({ folder: baton.app.folder.get() });
            });
        }
    });

    new Action('io.ox/files/actions/download', {
        requires: 'some',
        multiple: function (list) {
            // loop over list, get full file object and trigger downloads
            _(list).each(function (o) {
                api.get(o).done(function (file) {
                    if (o.version) {
                        file = _.extend({}, file, { version: o.version });
                    }
                    window.location.assign(api.getUrl(file, 'download'));
                });
            });
        }
    });

/*
    new Action('io.ox/files/actions/open', {
        id: 'office',
        // we just need to be called before 'default'
        before: 'default',
        // pick items you want to take care of (actually this function is called by underscore's "filter")
        filter: function (obj) {
            return (/\.docx$/i).test(obj.filename);
        },
        action: function (baton) {
            // baton.tracker shows items that are not yet picked
            // if this list is empty, no more actions are called
            console.log('Do something!', baton);
            // this is also possible to avoid the 'default' action:
            // baton.preventDefault();
            // however, that does not help us because all other files
            // should still be opened by the default handler
        }
    });
*/

    new Action('io.ox/files/actions/open', {
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

    new Action('io.ox/files/actions/sendlink', {
        requires: function (e) {
            return e.collection.has('some') && capabilities.has('webmail');
        },
        multiple: function (list) {
            require(['io.ox/mail/write/main'], function (m) {
                api.getList(list).done(function (list) {
                    m.getApp().launch().done(function () {
                        var content  = _(list).map(function (file) {
                            var url = location.protocol + '//' + location.host + ox.root + '/#!&app=io.ox/files&perspective=list&folder=' + file.folder_id + '&id=' + _.cid(file);
                            return gt('File: %1$s', file.title || file.filename) + '\n' + gt('Direct link: %1$s', url);
                        });
                        this.compose({ attachments: [{ content: content.join('\n\n') }] });
                    });
                });
            });
        }
    });

    new Action('io.ox/files/actions/send', {
        requires: function (e) {
            return e.collection.has('some') && capabilities.has('webmail') && ox.uploadsEnabled;
        },
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

    new Action('io.ox/files/actions/showlink', {
        requires: function (e) {
            return e.collection.has('some') && capabilities.has('webmail');
        },
        multiple: function (list) {
            api.getList(list).done(function (list) {
                var calcWidth,
                    container = $('<div>').css('display', 'inline-block'),
                    content  = _(list).map(function (file) {
                    var url = location.protocol + '//' + location.host + ox.root + '/#!&app=io.ox/files&perspective=list&folder=' + file.folder_id + '&id=' + _.cid(file);
                    return {'name': gt('File: %1$s', file.title || file.filename), 'link': gt('Direct link: %1$s', url), 'cleanlink': url};
                });

                if (window.clipboardData) {

                    _(content).each(function (item) {
                        var copyButton = $('<a>').attr('href', '#').addClass('btn').text(gt('copy to clipboard'));
                        copyButton.on('click', function () {
                            window.clipboardData.setData('Text', item.cleanlink);
                        });

                        container.append($('<p>').append($('<div>').text(item.name), $('<div>').text(item.link + ' ').append(copyButton)));
                    });
                } else {
                    _(content).each(function (item) {
                        container.append($('<p>').append($('<div>').text(item.name), $('<div>').text(item.link)));
                    });
                }

                // to get the width of the container
                $('body').append(container);
                calcWidth = container.width();
                calcWidth = calcWidth + 30;

                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog({width: calcWidth, addclass: 'dialogreselect'})
                        .append(container)
                        .addButton('cancel', gt('Cancel'))
                        .show();
                });
            });
        }
    });

    new Action('io.ox/files/actions/delete', {
        requires: 'some',
        multiple: function (list) {
            var question = gt.ngettext(
                    'Do you really want to delete this file?',
                    'Do you really want to delete these files?',
                    list.length
            ),
            responseSuccces = gt.ngettext(
                    'This file has been deleted',
                    'These files have been deleted',
                    list.length
            ),
            responseFail = gt.ngettext(
                    'This file has not been deleted',
                    'These files have not been deleted',
                    list.length
            );

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                new dialogs.ModalDialog()
                    .text(question)
                    .addPrimaryButton('delete', gt('Delete'))
                    .addButton('cancel', gt('Cancel'))
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            api.remove(list).done(function () {
                                notifications.yell('success', responseSuccces);
                            }).fail(function () {
                                notifications.yell('error', responseFail);
                            });
                        }
                    });
            });
        }
    });

    new Action('io.ox/files/actions/rename', {
        requires: 'one',
        action: function (baton) {
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var $input = $('<input type="text" name="name">');
                var dialog = null;

                function fnRename() {
                    var name = $input.val();
                    var update = {
                        id: baton.data.id,
                        folder_id: baton.data.folder_id,
                        title: name
                    };
                    if (baton.data.filename) {
                        update.filename = name;
                    }

                    return api.update(update).fail(require('io.ox/core/notifications').yell);
                }


                $input.val(baton.data.title || baton.data.filename);
                var $form = $('<form>').append(
                    $('<label for="name">').append($('<b>').text(gt('Name'))),
                    $input
                );

                $form.on('submit', function (e) {
                    e.preventDefault();
                    dialog.busy();
                    fnRename().done(function () {
                        dialog.close();
                    });
                });


                dialog = new dialogs.ModalDialog({easyOut: true}).append(
                    $form
                )
                .addPrimaryButton('rename', gt('Rename'))
                .addButton('cancel', gt('Cancel'));

                dialog.show(function () {
                    $input.select();
                })
                .done(function (action) {
                    if (action === 'rename') {
                        fnRename();
                    }
                });
            });
        }
    });

    new Action('io.ox/files/actions/edit-description', {
        requires: 'one',
        action: function (baton) {
            require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/keys'], function (dialogs, KeyListener) {
                var $input = $('<textarea rows="10"></textarea>').css({width: '507px'});
                $input.val(baton.data.description);
                var $form = $('<form>').append(
                    $('<label for="name">').append($('<b>').text(gt('Description'))),
                    $input
                );
                var dialog = null;

                var keys = new KeyListener($input);

                function fnSave() {

                    var description = $input.val();
                    var update = {
                        id: baton.data.id,
                        folder_id: baton.data.folder_id,
                        description: description
                    };

                    return api.update(update).fail(require('io.ox/core/notifications').yell);
                }

                keys.on('shift+enter', function () {
                    dialog.busy();
                    fnSave().done(function () {
                        dialog.close();
                    });
                });

                dialog = new dialogs.ModalDialog();

                dialog.append(
                    $form
                )
                .addPrimaryButton('save', gt('Save'))
                .addButton('cancel', gt('Cancel'))
                .show(function () {
                    $input.select();
                    keys.include();
                })
                .done(function (action) {
                    if (action === 'save') {
                        fnSave();
                    }
                });
            });
        }
    });


    var copyMove = function (type, apiAction, title) {
        return function (list) {
            require(['io.ox/files/api', 'io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (api, dialogs, views) {
                var dialog = new dialogs.ModalDialog({ easyOut: true })
                    .header($('<h3>').text(title))
                    .addPrimaryButton('ok', title)
                    .addButton('cancel', gt('Cancel'));
                dialog.getBody().css('height', '250px');
                var item = _(list).first(),
                    tree = new views.FolderTree(dialog.getBody(), { type: type, rootFolderId: '9', skipRoot: true });
                tree.paint();
                dialog.show(function () {
                    tree.selection.set({ id: item.folder_id || item.folder });
                })
                .done(function (action) {
                    if (action === 'ok') {
                        var selectedFolder = tree.selection.get();
                        if (selectedFolder.length === 1) {
                            // move action
                            api[apiAction](list, selectedFolder[0]).fail(require('io.ox/core/notifications').yell);
                        }
                    }
                    tree.destroy();
                    tree = dialog = null;
                });
            });
        };
    };

    new Action('io.ox/files/actions/move', {
        id: 'move',
        requires: 'some delete',
        multiple: copyMove('infostore', 'move', gt('Move'))
    });

    new Action('io.ox/files/actions/copy', {
        id: 'copy',
        requires: 'some read',
        multiple: copyMove('infostore', 'copy', gt('Copy'))
    });

    new Action('io.ox/files/actions/add-to-portal', {
        require: function (e) {
            return e.collection.has('one') && capabilities.has('!disablePortal');
        },
        action: function (baton) {
            require(['io.ox/portal/widgets'], function (widgets) {
                widgets.add('stickyfile', 'files', {
                    id: baton.data.id,
                    folder_id: baton.data.folder_id,
                    title: baton.data.filename || baton.data.title
                });
                notifications.yell('success', gt('This file has been added to the portal'));
            });
        }
    });

    // version specific actions

    new Action('io.ox/files/versions/actions/makeCurrent', {
        requires: function (e) {
            return !e.context.current_version;
        },
        action: function (baton) {
            var data = baton.data;
            api.update({
                id: data.id,
                last_modified: data.last_modified,
                version: data.version
            }, true);
        }
    });

    new Action('io.ox/files/versions/actions/delete', {
        action: function (baton) {
            var data = baton.data;
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                // get proper question
                var question = gt.ngettext(
                        'Do you really want to delete this file?',
                        'Do you really want to delete these files?',
                        _.isArray(data) ? data.length : 1
                );
                // ask
                new dialogs.ModalDialog()
                    .text(question)
                    .addPrimaryButton('delete', gt('Delete'))
                    .addButton('cancel', gt('Cancel'))
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
            return $('<i class="icon-plus accent-color">');
        }
    });

    new ActionLink(POINT + '/links/toolbar/default', {
        index: 100,
        id: 'upload',
        label: gt('Upload new file'),
        ref: POINT + '/actions/upload'
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

    // PUBLISH

    // disabled until we have full pub/sub support
    // new ActionGroup(POINT + '/links/toolbar', {
    //     id: 'publish',
    //     index: 150,
    //     label: gt('Publish'),
    //     icon: function () {
    //         return $('<i class="icon-rss">');
    //     }
    // });

    // new ActionLink(POINT + '/links/toolbar/publish', {
    //     id: 'publish',
    //     label: gt('Publish current folder'),
    //     ref: 'io.ox/files/actions/publish'
    // });

    // INLINE

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'editor',
        index: 40,
        prio: 'hi',
        label: gt('Edit'),
        ref: 'io.ox/files/actions/editor'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'open',
        index: 100,
        prio: 'hi',
        label: gt('Open'),
        ref: 'io.ox/files/actions/open'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'download',
        index: 200,
        prio: 'hi',
        label: gt('Download'),
        ref: 'io.ox/files/actions/download'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'sendlink',
        index: 300,
        label: gt('Send as link'),
        ref: 'io.ox/files/actions/sendlink'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'send',
        index: 400,
        label: gt('Send by mail'),
        ref: 'io.ox/files/actions/send'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'showlink',
        index: 400,
        label: gt('Show link'),
        ref: 'io.ox/files/actions/showlink'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'rename',
        index: 500,
        label: gt('Rename'),
        ref: 'io.ox/files/actions/rename'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'edit-description',
        index: 550,
        label: gt('Edit description'),
        ref: 'io.ox/files/actions/edit-description'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'move',
        index: 600,
        label: gt('Move'),
        ref: 'io.ox/files/actions/move'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'copy',
        index: 700,
        label: gt('Copy'),
        ref: 'io.ox/files/actions/copy'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'delete',
        index: 800,
        prio: 'hi',
        label: gt('Delete'),
        ref: 'io.ox/files/actions/delete'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'add-to-portal',
        index: 900,
        prio: 'lo',
        label: gt('Add to portal'),
        ref: 'io.ox/files/actions/add-to-portal'
    }));

    // version links


    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'open',
        index: 100,
        label: gt('Open'),
        ref: 'io.ox/files/actions/open'
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'download',
        index: 200,
        label: gt('Download'),
        ref: 'io.ox/files/actions/download'
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'makeCurrent',
        index: 250,
        label: gt('Make this the current version'),
        ref: 'io.ox/files/versions/actions/makeCurrent'
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'delete',
        index: 300,
        label: gt('Delete version'),
        ref: 'io.ox/files/versions/actions/delete',
        special: 'danger'
    }));

    // Drag and Drop

    ext.point('io.ox/files/dnd/actions').extend({
        id: 'create',
        index: 10,
        label: gt('Drop here to upload a <b>new file</b>'),
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

    // Iconview Inline Links

    new Action('io.ox/files/icons/slideshow', {
        requires: function (e) {
            return _(e.baton.allIds).reduce(function (memo, obj) {
                return memo || (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
            }, false);
        },
        action: function (baton) {
            require(['io.ox/files/carousel'], function (carousel) {
                carousel.init({
                    fullScreen: false,
                    baton: baton,
                    attachmentMode: false
                });
            });
        }
    });

    new Action('io.ox/files/icons/slideshow-fullscreen', {
        requires: function (e) {
            return BigScreen.enabled && _(e.baton.allIds).reduce(function (memo, obj) {
                return memo || (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
            }, false);
        },
        action: function (baton) {
            BigScreen.request($('.io-ox-files-main .carousel')[0]);
            require(['io.ox/files/carousel'], function (carousel) {
                carousel.init({
                    fullScreen: true,
                    baton: baton,
                    attachmentMode: false
                });
            });
        }
    });

    new Action('io.ox/files/icons/audioplayer', {
        requires: function (e) {
            return _(e.baton.allIds).reduce(function (memo, obj) {
                return memo || (/\.(mp3|m4a|m4b|wma|wav|ogg)$/i).test(obj.filename) && settings.get('audioEnabled');
            }, false);
        },
        action: function (baton) {
            require(['io.ox/files/mediaplayer'], function (mediaplayer) {
                mediaplayer.init({
                    baton: baton,
                    videoSupport: false
                });
            });
        }
    });

    new Action('io.ox/files/icons/videoplayer', {
        requires: function (e) {
            var pattern = '\\.(mp4|m4v|mov|avi|wmv|mpe?g|ogv|webm|3gp)';
            if (_.browser.Chrome) pattern = '\\.(mp4|m4v|avi|wmv|mpe?g|ogv|webm)';
            return _(e.baton.allIds).reduce(function (memo, obj) {
                return memo || (new RegExp(pattern, 'i')).test(obj.filename) && settings.get('videoEnabled');
            }, false);
        },
        action: function (baton) {
            require(['io.ox/files/mediaplayer'], function (mediaplayer) {
                mediaplayer.init({
                    baton: baton,
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
