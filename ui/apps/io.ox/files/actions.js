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
    'gettext!io.ox/files',
    'settings!io.ox/files'
], function (api, ext, links, capabilities, util, folderAPI, gt, settings) {

    'use strict';

    var Action = links.Action;

    // actions
    new Action('io.ox/files/actions/upload', {
        requires: function (e) {
            return e.baton.app.folder.getData().then(function (data) {
                //  hide for virtual folders (other files root, public files root)
                var virtual = _.contains(['14', '15'], data.id);
                // no new files in trash folders
                return folderAPI.can('create', data) && !virtual && !folderAPI.is('trash', data);
            });
        },
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

    new Action('io.ox/files/actions/layout-tile', {
        require: true,
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'fluid:tile');
        }
    });

    new Action('io.ox/files/actions/layout-icon', {
        require: true,
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'fluid:icon');
        }
    });

    new Action('io.ox/files/actions/layout-list', {
        require: true,
        action: function (baton) {
            ox.ui.Perspective.show(baton.app, 'fluid:list');
        }
    });

    new Action('io.ox/files/actions/videoplayer', {
        requires: function (e) {
            if (_.device('android')) return false;
            if (e.collection.has('none')) return false;
            return util.checkMedia('video', e);
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
                _.device('!small'),
                !_.isEmpty(e.baton.data),
                e.collection.has('some'),
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
                _.device('!small'),
                !_.isEmpty(e.baton.data),
                e.collection.has('some'),
                e.baton.openedBy !== 'io.ox/mail/compose',
                _(list).reduce(function (memo, obj) {
                    return memo || obj.file_size > 0;
                }, false),
                util.isFolderType('!trash', e.baton)
            );
        },
        multiple: function (list) {
            api.getList(list).done(function (list) {
                var filtered_list = _.filter(list, function (o) { return o.file_size !== 0; });
                if (filtered_list.length > 0) {
                    ox.registry.call('mail-compose', 'compose', { infostore_ids: filtered_list });
                }
            });
        }
    });

    new Action('io.ox/files/actions/showlink', {
        capabilities: '!alone',
        requires: function (e) {
            return util.conditionChain(
                _.device('!small'),
                !_.isEmpty(e.baton.data),
                e.collection.has('some'),
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
            return e.collection.has('some') && e.collection.has('delete') && util.hasStatus('!lockedByOthers', e) && (e.baton.openedBy !== 'io.ox/mail/compose');
        },
        multiple: function (list) {
            ox.load(['io.ox/files/actions/delete']).done(function (action) {
                action(list);
            });
        }
    });

    new Action('io.ox/files/actions/lock', {
        capabilities: '!alone',
        requires: function (e) {
            return _.device('!small') &&
                !_.isEmpty(e.baton.data) &&
                e.collection.has('some') &&
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
            return _.device('!small') &&
                !_.isEmpty(e.baton.data) &&
                e.collection.has('some') &&
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

    new Action('io.ox/files/actions/rename', {
        requires: function (e) {
            // hide in mail compose preview
            return e.collection.has('one') && util.hasStatus('!lockedByOthers', e) && (e.baton.openedBy !== 'io.ox/mail/compose');
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
            return e.collection.has('one') && util.hasStatus('!lockedByOthers', e) && (e.baton.openedBy !== 'io.ox/mail/compose');
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
                return e.collection.has('some') &&
                        (e.baton.openedBy !== 'io.ox/mail/compose') &&
                        (type === 'move' ? e.collection.has('delete') &&
                        util.hasStatus('!lockedByOthers', e) : e.collection.has('read'));
            },
            multiple: function (list, baton) {
                require(['io.ox/core/folder/actions/move'], function (move) {
                    move.item({
                        api: api,
                        button: label,
                        list: list,
                        module: 'infostore',
                        root: '9',
                        settings: settings,
                        success: success,
                        target: baton.target,
                        title: label,
                        type: type
                    });
                });
            }
        });
    }

    moveAndCopy('move', gt('Move'), { single: gt('File has been moved'), multiple: gt('Files have been moved') });
    moveAndCopy('copy', gt('Copy'), { single: gt('File has been copied'), multiple: gt('Files have been copied') });

    new Action('io.ox/files/actions/add-to-portal', {
        capabilities: 'portal',
        requires: function (e) {
            return util.conditionChain(
                e.collection.has('one'),
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

    // version specific actions

    new Action('io.ox/files/versions/actions/makeCurrent', {
        requires: function (e) {
            // hide in mail compose preview
            return e.collection.has('one') && !e.context.current_version && (e.baton.openedBy !== 'io.ox/mail/compose');
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
        requires: function (e) {
            // hide in mail compose preview
            return e.collection.has('one') && e.baton.openedBy !== 'io.ox/mail/compose';

        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/versions-delete']).done(function (action) {
                action(baton.data);
            });
        }
    });

    // Guidance
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

    // INLINE
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
        label: gt('Rename'),
        mobile: 'lo',
        ref: 'io.ox/files/actions/rename',
        section: 'edit'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'edit-description',
        index: index += 100,
        label: gt('Edit description'),
        mobile: 'lo',
        ref: 'io.ox/files/actions/edit-description',
        section: 'edit'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'move',
        index: index += 100,
        label: gt('Move'),
        prio: 'lo',
        mobile: 'lo',
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
        label: gt('Unlock'),
        ref: 'io.ox/files/actions/unlock',
        section: 'file-op'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        index: index += 100,
        id: 'mediaplayer-audio',
        label: gt('Play audio files'),
        ref: 'io.ox/files/actions/audioplayer',
        section: 'media'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        index: index += 100,
        id: 'mediaplayer-video',
        label: gt('Play video files'),
        ref: 'io.ox/files/actions/videoplayer',
        section: 'media'
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
            app.queues.create.offer(files, { folder: app.folder.get() });
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
            app.queues.update.offer(file, { folder: app.folder.get() });
        }
    });

    // new share action
    new Action('io.ox/files/icons/share', {
        capabilities: 'publication',
        requires: 'some',
        action: function (baton) {
            ox.load(['io.ox/files/actions/share']).done(function (action) {
                var list = [].concat(baton.data);
                action(list);
            });
        }
    });

    new Action('io.ox/files/icons/slideshow', {
        requires: function (e) {
            return _(e.baton.allIds).reduce(function (memo, obj) {
                return memo || (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
            }, false);
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

    ext.point('io.ox/files/icons/actions').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links',
        dropdown: true,
        ref: 'io.ox/files/icons/inline'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'upload',
        label: gt('Upload new file'),
        ref: 'io.ox/files/actions/upload',
        cssClasses: 'io-ox-action-link btn btn-primary'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        index: 200,
        prio: 'hi',
        mobile: 'lo',
        id: 'share',
        label: gt('Share selected files'),
        ref: 'io.ox/files/icons/share'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        index: 300,
        prio: 'hi',
        mobile: 'lo',
        id: 'slideshow',
        label: gt('View Slideshow'),
        ref: 'io.ox/files/icons/slideshow'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        index: 500,
        id: 'mediaplayer-audio',
        label: gt('Play audio files'),
        ref: 'io.ox/files/icons/audioplayer'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        index: 500,
        id: 'mediaplayer-video',
        label: gt('Play video files'),
        ref: 'io.ox/files/icons/videoplayer'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        id: 'download',
        index: 600,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Download'),
        ref: 'io.ox/files/actions/download'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        id: 'delete',
        index: 700,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Delete'),
        ref: 'io.ox/files/actions/delete'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        id: 'send',
        index: 800,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Send by mail'),
        ref: 'io.ox/files/actions/send',
        section: 'share'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        id: 'sendlink',
        index: 900,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Send as internal link'),
        ref: 'io.ox/files/actions/sendlink',
        section: 'share'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        id: 'showlink',
        index: 1000,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Show internal link'),
        ref: 'io.ox/files/actions/showlink',
        section: 'share'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        id: 'add-to-portal',
        index: 1100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Add to portal'),
        ref: 'io.ox/files/actions/add-to-portal',
        section: 'share'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        id: 'move',
        index: 1200,
        label: gt('Move'),
        prio: 'lo',
        mobile: 'lo',
        ref: 'io.ox/files/actions/move',
        section: 'file-op'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        id: 'copy',
        index: 1300,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Copy'),
        ref: 'io.ox/files/actions/copy',
        section: 'file-op'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        id: 'lock',
        index: 1400,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Lock'),
        ref: 'io.ox/files/actions/lock',
        section: 'file-op'
    }));

    ext.point('io.ox/files/icons/inline').extend(new links.Link({
        id: 'unlock',
        index: 1500,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Unlock'),
        ref: 'io.ox/files/actions/unlock',
        section: 'file-op'
    }));

    // rightside
    ext.point('io.ox/files/icons/actions-right').extend(new links.InlineButtonGroup({
        index: 100,
        id: 'inline-links',
        ref: 'io.ox/files/icons/inline-right'
    }));

    ext.point('io.ox/files/icons/inline-right').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'layout-list',
        ref: 'io.ox/files/actions/layout-list',
        title: gt('List'),
        icon: 'fa fa-align-justify',
        cssClasses: 'io-ox-action-link btn layout'
    }));

    ext.point('io.ox/files/icons/inline-right').extend(new links.Link({
        index: 200,
        prio: 'hi',
        id: 'layout-icon',
        ref: 'io.ox/files/actions/layout-icon',
        title: gt('Icons'),
        icon: 'fa fa-th',
        cssClasses: 'io-ox-action-link btn layout'
    }));

    ext.point('io.ox/files/icons/inline-right').extend(new links.Link({
        index: 300,
        prio: 'hi',
        id: 'layout-tile',
        ref: 'io.ox/files/actions/layout-tile',
        title: gt('Tile'),
        icon: 'fa fa-th-large',
        cssClasses: 'io-ox-action-link btn layout'
    }));

});
