/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/actions', [
    'io.ox/files/api',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/capabilities',
    'io.ox/files/util',
    'io.ox/core/folder/api',
    'gettext!io.ox/files'
], function (api, ext, links, capabilities, util, folderAPI, gt) {

    'use strict';

    var Action = links.Action;

    // actions
    new Action('io.ox/files/actions/upload', {
        requires: function (e) {
            return e.baton.app.folder.getData().then(function (data) {
                //hide for virtual folders (other files root, public files root)
                var virtual = _.contains(['14', '15'], data.id);
                //no new files in trash folders
                return folderAPI.can('create', data) && !virtual && !folderAPI.is('trash', data);
            });
        },
        action: function (baton) {
            $('<input type="file" name="file" capture="camera" multiple>')
            .on('change', function (e) {
                var app = baton.app;
                require(['io.ox/files/upload/main'], function (fileUpload) {
                    e.preventDefault();

                    var list = [];
                    _(e.target.files).each(function (file) {
                        list.push(_.extend(file, { group: 'file' }));
                    });
                    fileUpload.setWindowNode(app.getWindowNode());
                    fileUpload.create.offer(list, { folder: app.folder.get() });
                });
            })
            .trigger('click');
        }
    });

    // editor
    if (window.Blob) {

        new Action('io.ox/files/actions/editor', {
            requires: function (e) {
                return util.conditionChain(
                    e.collection.has('one'),
                    (/\.(txt|js|css|md|tmpl|html?)$/i).test(e.context.filename),
                    (e.baton.openedBy !== 'io.ox/mail/compose'),
                    util.isFolderType('!trash', e.baton)
                );
            },
            action: function (baton) {
                if (ox.ui.App.reuse('io.ox/editor:edit.' + _.cid(baton.data))) return;
                ox.launch('io.ox/editor/main', { folder: baton.data.folder_id, id: baton.data.id });
            }
        });

        new Action('io.ox/files/actions/editor-new', {
            requires: function (e) {
                return util.conditionChain(
                    (e.baton.openedBy !== 'io.ox/mail/compose'),
                    util.isFolderType('!trash', e.baton)
                );
            },
            action: function (baton) {
                ox.launch('io.ox/editor/main').done(function () {
                    this.create({ folder: baton.app.folder.get() });
                });
            }
        });
    }

    new Action('io.ox/files/actions/download', {
        requires: function (e) {
            // no file-system, no download
            if (_.device('ios')) return false;
            if (e.collection.has('multiple')) return true;
            // 'description only' items
            return !_.isEmpty(e.baton.data.filename) || e.baton.data.file_size > 0;
        },
        multiple: function (list) {
            ox.load(['io.ox/files/actions/download']).done(function (action) {
                action(list);
            });
        }
    });

    new Action('io.ox/files/actions/downloadversion', {
        requires: function (e) {
            // no file-system, no download
            if (_.device('ios')) return false;
            if (e.collection.has('multiple')) return true;
            // 'description only' items
            return !_.isEmpty(e.baton.data.filename) || e.baton.data.file_size > 0;
        },
        multiple: function (list) {
            // loop over list, get full file object and trigger downloads
            require(['io.ox/core/download'], function (download) {
                _(list).each(function (o) {
                    download.file(o);
                });
            });
        }
    });

    new Action('io.ox/files/actions/open', {
        requires: function (e) {
            if (e.collection.has('multiple')) return false;
            if (e.collection.has('folders')) return false;
            // 'description only' items
            return !_.isEmpty(e.baton.data.filename) || e.baton.data.file_size > 0;
        },
        multiple: function (list) {
            _(list).each(function (file) {
                window.open(api.getUrl(file, 'open'));
            });
        }
    });

    new Action('io.ox/files/actions/sendlink', {
        capabilities: 'webmail !alone',
        requires: function (e) {
            return util.conditionChain(
                _.device('!smartphone'),
                !_.isEmpty(e.baton.data),
                e.collection.has('some', 'items'),
                e.baton.openedBy !== 'io.ox/mail/compose',
                util.isFolderType('!trash', e.baton)
            );
        },
        multiple: function (list) {
            ox.load(['io.ox/files/actions/sendlink']).done(function (action) {
                action(list);
            });
        }
    });

    new Action('io.ox/files/actions/send', {
        capabilities: 'webmail',
        requires: function (e) {
            var list = _.getArray(e.context);
            return util.conditionChain(
                _.device('!smartphone'),
                !_.isEmpty(e.baton.data),
                e.collection.has('some', 'items'),
                e.baton.openedBy !== 'io.ox/mail/compose',
                _(list).reduce(function (memo, obj) {
                    return memo || obj.file_size > 0;
                }, false),
                util.isFolderType('!trash', e.baton)
            );
        },
        multiple: function (array) {
            api.getList(array).done(function (list) {
                var filtered_list = _.filter(list, function (o) { return o.file_size !== 0; });
                if (filtered_list.length === 0) return;
                ox.registry.call('mail-compose', 'compose', { infostore_ids: filtered_list });
            });
        }
    });

    new Action('io.ox/files/actions/showlink', {
        capabilities: '!alone',
        requires: function (e) {
            return util.conditionChain(
                _.device('!smartphone'),
                !_.isEmpty(e.baton.data),
                e.collection.has('some', 'items'),
                util.isFolderType('!trash', e.baton)
            );
        },
        multiple: function (list) {
            ox.load(['io.ox/files/actions/showlink']).done(function (action) {
                action(list);
            });
        }
    });

    new Action('io.ox/files/actions/delete', {
        requires: function (e) {
            // hide in mail compose preview
            return (e.collection.has('some', 'delete') || e.collection.has('some', 'delete:folder', 'folders')) && util.hasStatus('!lockedByOthers', e) && (e.baton.openedBy !== 'io.ox/mail/compose');
        },
        multiple: function (list, baton) {
            ox.load(['io.ox/files/actions/delete']).done(function (action) {
                if (!baton.models) {
                    api.pool.add(list);
                    baton.models = api.pool.resolve(list);
                }
                action(baton.models);
            });
        }
    });

    new Action('io.ox/files/actions/viewer', {
        requires: function (e) {
            return e.collection.has('some', 'items');
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/viewer']).done(function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/files/actions/lock', {
        capabilities: '!alone',
        requires: function (e) {
            return _.device('!smartphone') &&
                !_.isEmpty(e.baton.data) &&
                e.collection.has('some', 'modify', 'items') &&
                // hide in mail compose preview
                (e.baton.openedBy !== 'io.ox/mail/compose') &&
                util.hasStatus('!locked', e);
        },
        multiple: function (list) {
            ox.load(['io.ox/files/actions/lock-unlock']).done(function (action) {
                action.lock(list);
            });
        }
    });

    new Action('io.ox/files/actions/unlock', {
        capabilities: '!alone',
        requires: function (e) {
            return _.device('!smartphone') &&
                !_.isEmpty(e.baton.data) &&
                e.collection.has('some', 'modify', 'items') &&
                // hide in mail compose preview
                (e.baton.openedBy !== 'io.ox/mail/compose') &&
                util.hasStatus('lockedByMe', e);
        },
        multiple: function (list) {
            ox.load(['io.ox/files/actions/lock-unlock']).done(function (action) {
                action.unlock(list);
            });
        }
    });

    new Action('io.ox/files/actions/add-to-portal', {
        capabilities: 'portal',
        requires: function (e) {
            return util.conditionChain(
                e.collection.has('one', 'items'),
                !_.isEmpty(e.baton.data),
                util.isFolderType('!trash', e.baton)
            );
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/add-to-portal']).done(function (action) {
                action(baton.data);
            });
        }
    });

    new Action('io.ox/files/actions/rename', {
        requires: function (e) {
            // hide in mail compose preview
            return e.collection.has('one', 'modify', 'items') && util.hasStatus('!lockedByOthers', e) && (e.baton.openedBy !== 'io.ox/mail/compose');
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/rename']).done(function (action) {
                action(baton.data);
            });
        }
    });

    new Action('io.ox/files/actions/edit-description', {
        requires: function (e) {
            // hide in mail compose preview
            return e.collection.has('one', 'modify', 'items') && util.hasStatus('!lockedByOthers', e) && (e.baton.openedBy !== 'io.ox/mail/compose');
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/edit-description']).done(function (action) {
                action(baton.data);
            });
        }
    });

    function moveAndCopy(type, label, success) {
        new Action('io.ox/files/actions/' + type, {
            id: type,
            requires:  function (e) {
                return e.collection.has('some', 'items') &&
                        (e.baton.openedBy !== 'io.ox/mail/compose') &&
                        (type === 'move' ? e.collection.has('delete') &&
                        util.hasStatus('!lockedByOthers', e) : e.collection.has('read'));
            },
            multiple: function (list, baton) {
                ox.load(['io.ox/files/actions/move-copy']).done(function (action) {
                    var options = {
                        type: type,
                        label: label,
                        success: success
                    };
                    action(list, baton, options);
                });
            }
        });
    }

    moveAndCopy('move', gt('Move'), { single: gt('File has been moved'), multiple: gt('Files have been moved') });
    moveAndCopy('copy', gt('Copy'), { single: gt('File has been copied'), multiple: gt('Files have been copied') });

    // folder based actions
    new Action('io.ox/files/icons/share', {
        capabilities: 'publication',
        requires: 'some',
        action: function (baton) {
            ox.load(['io.ox/files/actions/share']).done(function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/files/icons/slideshow', {
        requires: function () {
            // must be solved differently
            return false;
            // return _(e.baton.allIds).reduce(function (memo, obj) {
            //     return memo || (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
            // }, false);
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/slideshow']).done(function (action) {
                action({
                    baton: baton
                });
            });
        }
    });

    new Action('io.ox/files/icons/audioplayer', {
        requires: function (e) {
            if (_.device('android')) return false;
            return util.checkMedia('audio', e);
        },
        action: function (baton) {
            ox.load(['io.ox/files/mediaplayer']).done(function (mediaplayer) {
                mediaplayer.init({
                    baton: baton,
                    videoSupport: false
                });
            });
        }
    });

    new Action('io.ox/files/icons/videoplayer', {
        requires: function (e) {
            if (_.device('android')) return false;
            return util.checkMedia('video', e);
        },
        action: function (baton) {
            ox.load(['io.ox/files/mediaplayer']).done(function (mediaplayer) {
                mediaplayer.init({
                    baton: baton,
                    videoSupport: true
                });
            });
        }
    });

    // version specific actions

    new Action('io.ox/files/versions/actions/makeCurrent', {
        requires: function (e) {
            // hide in mail compose preview
            return e.collection.has('one', 'items') && !e.context.current_version && (e.baton.openedBy !== 'io.ox/mail/compose');
        },
        action: function (baton) {
            api.versions.setCurrent(baton.data);
        }
    });

    new Action('io.ox/files/versions/actions/delete', {
        requires: function (e) {
            // hide in mail compose preview
            return e.collection.has('one', 'items') && e.baton.openedBy !== 'io.ox/mail/compose';
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/versions-delete']).done(function (action) {
                action(baton.data);
            });
        }
    });

    //
    // Add new folder
    //

    new Action('io.ox/files/actions/add-folder', {
        requires: function (e) {
            var model = folderAPI.pool.getModel(e.baton.app.folder.get());
            return folderAPI.can('create:folder', model.toJSON());
        },
        action: function (baton) {
            var id = baton.app.folder.get(), model = folderAPI.pool.getModel(id);
            ox.load(['io.ox/core/folder/actions/add']).done(function (add) {
                add(id, { module: model.get('module') });
            });
        }
    });

    // guidance
    new Action('io.ox/files/actions/guidance', {
        action: function (baton) {
            require(['io.ox/files/guidance/main'], function (guidance) {
                guidance.sidePopup(baton.app, baton.e);
            });
        }
    });

    new Action('io.ox/files/actions/guidance-reload', {
        action: function (baton) {
            require(['io.ox/files/guidance/main'], function (guidance) {
                guidance.reloadPopup(baton.app, baton.e);
            });
        }
    });

    // 'new' dropdown
    new links.ActionLink('io.ox/files/links/toolbar/default', {
        index: 100,
        id: 'upload',
        label: gt('Add local file'),
        ref: 'io.ox/files/actions/upload'
    });

    new links.ActionLink('io.ox/files/links/toolbar/default', {
        index: 200,
        id: 'note',
        label:
            //#. Please translate like "take a note", "Notiz" in German, for example.
            //#. more like "to notice" than "to notify".
            gt('Add note'),
        ref: 'io.ox/files/actions/editor-new'
    });

    new links.ActionLink('io.ox/files/links/toolbar/default', {
        index: 300,
        id: 'add-folder',
        label: gt('Add new folder'),
        ref: 'io.ox/files/actions/add-folder'
    });

    // INLINE (used in detail view / portal)
    var index = 100;

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'open',
        index: index += 100,
        prio: 'hi',
        mobile: 'hi',
        label: gt('Open'),
        ref: 'io.ox/files/actions/open'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'editor',
        index: index += 100,
        prio: 'hi',
        mobile: 'lo',
        label: gt('Edit'),
        ref: 'io.ox/files/actions/editor'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'download',
        index: index += 100,
        prio: 'hi',
        mobile: 'lo',
        label: gt('Download'),
        ref: 'io.ox/files/actions/download'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'delete',
        index: index += 100,
        prio: 'hi',
        mobile: 'lo',
        label: gt('Delete'),
        ref: 'io.ox/files/actions/delete'
    }));

    // low

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'send',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Send by mail'),
        ref: 'io.ox/files/actions/send',
        section: 'share'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'sendlink',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Send as internal link'),
        ref: 'io.ox/files/actions/sendlink',
        section: 'share'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'showlink',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Show internal link'),
        ref: 'io.ox/files/actions/showlink',
        section: 'share'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'add-to-portal',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Add to portal'),
        ref: 'io.ox/files/actions/add-to-portal',
        section: 'share'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'rename',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Rename'),
        ref: 'io.ox/files/actions/rename',
        section: 'edit'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'edit-description',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Edit description'),
        ref: 'io.ox/files/actions/edit-description',
        section: 'edit'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'move',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Move'),
        ref: 'io.ox/files/actions/move',
        section: 'file-op'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'copy',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Copy'),
        ref: 'io.ox/files/actions/copy',
        section: 'file-op'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'lock',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Lock'),
        ref: 'io.ox/files/actions/lock',
        section: 'file-op'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'unlock',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Unlock'),
        ref: 'io.ox/files/actions/unlock',
        section: 'file-op'
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
        ref: 'io.ox/files/actions/downloadversion'
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
        label: gt('Drop here to upload a <b class="dndignore">new file</b>'),
        multiple: function (files, app) {
            require(['io.ox/files/upload/main'], function (fileUpload) {
                fileUpload.create.offer(files, { folder: app.folder.get() });
            });
        }
    });

    ext.point('io.ox/files/dnd/actions').extend({
        id: 'newVersion',
        index: 20,
        isEnabled: function (app) {
            return !!app.currentFile;
        },
        label: function (app) {
            if (app.currentFile.filename || app.currentFile.title) {
                return gt(
                    //#. %1$s is the filename or title of the file
                    'Drop here to upload a <b class="dndignore">new version</b> of "%1$s"',
                    String(app.currentFile.filename || app.currentFile.title).replace(/</g, '&lt;')
                );
            } else {
                return gt('Drop here to upload a <b class="dndignore">new version</b>');
            }
        },
        action: function (file, app) {
            require(['io.ox/files/upload/main'], function (fileUpload) {
                fileUpload.update.offer(file, { folder: app.folder.get() });
            });
        }
    });
});
