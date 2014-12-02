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

define('io.ox/files/actions',
    ['io.ox/files/api',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/core/extPatterns/actions',
     'io.ox/core/capabilities',
     'io.ox/core/notifications',
     'io.ox/core/util',
     'io.ox/core/folder/api',
     'gettext!io.ox/files',
     'settings!io.ox/files'
    ], function (api, ext, links, actionPerformer, capabilities, notifications, util, folderAPI, gt, settings) {

    'use strict';

    var Action = links.Action,
        ActionGroup = links.ActionGroup,
        ActionLink = links.ActionLink,
        POINT = 'io.ox/files';

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

    new Action('io.ox/files/actions/publish', {
        capabilities: 'publication',
        requires: function (e) {
            var check = function (data) {
                    data = data || {};
                    return e.collection.has('one') && !_.isEmpty(e.baton.data.filename) && !folderAPI.is('trash', data);
                };
            if (e.baton.app){
                return e.baton.app.folder.getData().then(check);
            } else if (e.baton.data.folder_id) {
                //no app given, maybe the item itself has a folder
                return folderAPI.get(e.baton.data.folder_id).then(check);
            } else {
                //continue without foldercheck
                return check();
            }
        },
        action: function (baton) {
            require(['io.ox/core/pubsub/publications'], function (publications) {
                publications.buildPublishDialog(baton);
            });
        }
    });

    new Action('io.ox/files/actions/videoplayer', {
        requires: function (e) {
            if (_.device('android')) return false;
            if (e.collection.has('none')) return false;
            return checkMedia(e, 'video');
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
                var check = function (data) {
                        data = data || {};
                        return e.collection.has('one') &&
                            (/\.(txt|js|css|md|tmpl|html|csv?)$/i).test(e.context.filename) &&
                            (e.baton.openedBy !== 'io.ox/mail/write') &&
                            !folderAPI.is('trash', data);
                    };
                if (e.baton.app){
                    return e.baton.app.folder.getData().then(check);
                } else if (e.baton.data.folder_id) {
                    //no app given, maybe the item itself has a folder
                    return folderAPI.get(e.baton.data.folder_id).then(check);
                } else {
                    //continue without folderche    ck
                    return check();
                }
            },
            action: function (baton) {
                if (ox.ui.App.reuse('io.ox/editor:edit.' + _.cid(baton.data))) return;
                ox.launch('io.ox/editor/main', { folder: baton.data.folder_id, id: baton.data.id });
            }
        });

        new Action('io.ox/files/actions/editor-new', {
            requires: function (e) {
                var check = function (data) {
                        data = data || {};
                        return e.baton.openedBy !== 'io.ox/mail/write' && !folderAPI.is('trash', data);
                    };
                if (e.baton.app){
                    return e.baton.app.folder.getData().then(check);
                } else if (e.baton.data.folder_id) {
                    //no app given, maybe the item itself has a folder
                    return folderAPI.get(e.baton.data.folder_id).then(check);
                } else {
                    //continue without foldercheck
                    return check();
                }
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
            // loop over list, get full file object and trigger downloads
            var filtered = filterUnsupported(list);
            if (filtered.length === 1) {
                var o = _.first(filtered);
                require(['io.ox/core/download'], function (download) {
                    download.file(o);
                });
            } else if (filtered.length > 1) {
                require(['io.ox/core/download'], function (download) {
                    download.files(filtered);
                });
            }
            // 'description only' items
            if (filtered.length === 0 || list.length !== filtered.length) {
                notifications.yell('info', gt('Items without a file can not be downloaded.'));
            }
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
            var check = function (data) {
                    data = data || {};
                    return _.device('!small') &&
                        !_.isEmpty(e.baton.data) &&
                        e.collection.has('some') &&
                        e.baton.openedBy !== 'io.ox/mail/write' &&
                        !folderAPI.is('trash', data);
                };
            if (e.baton.app){
                return e.baton.app.folder.getData().then(check);
            } else if (e.baton.data.folder_id) {
                //no app given, maybe the item itself has a folder
                return folderAPI.get(e.baton.data.folder_id).then(check);
            } else {
                //continue without foldercheck
                return check();
            }
        },
        multiple: function (list) {
            api.getList(list).done(function (list) {
                //generate text and html content
                var html = [], text = [];
                _(list).each(function (file) {
                    var url = ox.abs + ox.root + '/#!&app=io.ox/files&folder=' + file.folder_id + '&id=' + _.cid(file);
                    var label = gt('File: %1$s', file.filename || file.title);
                    html.push(_.escape(label) + '<br>' + gt('Direct link: %1$s', '<a data-mce-href="' + url + '" href="' + url + '">' + url + '</a>'));
                    text.push(label + '\n' + gt('Direct link: %1$s', url));
                });
                ox.registry.call('mail-compose', 'compose', { attachments: { 'text': [{ content: text.join('\n\n') }], 'html': [{ content: html.join('<br>') }] } });
            });
        }
    });

    new Action('io.ox/files/actions/send', {
        capabilities: 'webmail',
        requires: function (e) {
            var check = function (data) {
                    data = data || {};
                    var list = _.getArray(e.context);
                    return _.device('!small') &&
                        !_.isEmpty(e.baton.data) &&
                        e.collection.has('some') &&
                        e.baton.openedBy !== 'io.ox/mail/write' &&
                        !folderAPI.is('trash', data) &&
                        _(list).reduce(function (memo, obj) {
                            return memo || obj.file_size > 0;
                        }, false);
                };
            if (e.baton.app){
                return e.baton.app.folder.getData().then(check);
            } else if (e.baton.data.folder_id) {
                //no app given, maybe the item itself has a folder
                return folderAPI.get(e.baton.data.folder_id).then(check);
            } else {
                //continue without foldercheck
                return check();
            }
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
            var check = function (data) {
                    data = data || {};
                    return _.device('!small') &&
                        !_.isEmpty(e.baton.data) &&
                        e.collection.has('some') &&
                        !folderAPI.is('trash', data);
                };
            if (e.baton.app){
                return e.baton.app.folder.getData().then(check);
            } else if (e.baton.data.folder_id) {
                //no app given, maybe the item itself has a folder
                return folderAPI.get(e.baton.data.folder_id).then(check);
            } else {
                //continue without foldercheck
                return check();
            }
        },
        multiple: function (list) {

            api.getList(list).done(function (list) {

                // create dialog
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog({ width: 500 })
                        .build(function () {
                            // header
                            this.header($('<h4>').text(gt('Direct link')));
                            // content
                            this.getContentNode().addClass('user-select-text max-height-200').append(

                                _(list).map(function (file) {

                                    var url = ox.abs + ox.root +
                                        '/#!&app=io.ox/files' +
                                        '&folder=' + encodeURIComponent(file.folder_id) +
                                        '&id=' + encodeURIComponent(file.folder_id) + '.' + encodeURIComponent(file.id);

                                    return $('<p>').append(
                                        $('<div>').text(file.filename || file.title || ''),
                                        $('<div>').append(
                                            $('<a class="direct-link" target="_blank" tabindex="1">')
                                            .attr('href', url)
                                            .html(util.breakableHTML(url))
                                        )
                                    );
                                })
                            );
                        })
                        .addPrimaryButton('cancel', gt('Close'), 'cancel', {'tabIndex': '1'})
                        .show(function () {
                            this.find('a.direct-link').focus();
                        });
                });
            });
        }
    });

    new Action('io.ox/files/actions/delete', {
        requires: function (e) {
            //hide in mail write preview
            return e.collection.has('some') && e.collection.has('delete') && isUnLocked(e) && (e.baton.openedBy !== 'io.ox/mail/write');
        },
        multiple: function (list) {

            var question = gt.ngettext(
                    'Do you really want to delete this file?',
                    'Do you really want to delete these files?',
                    list.length
            ),
            responseSuccess = gt.ngettext(
                    'This file has been deleted',
                    'These files have been deleted',
                    list.length
            ),
            responseFail = gt.ngettext(
                    'This file has not been deleted',
                    'These files have not been deleted',
                    list.length
            ),
            responseFailLocked = gt.ngettext(
                    'This file has not been deleted, as it is locked by its owner.',
                    'These files have not been deleted, as they are locked by their owner.',
                    list.length
            );

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                new dialogs.ModalDialog()
                    .text(question)
                    .addPrimaryButton('delete', gt('Delete'), 'delete', {'tabIndex': '1'})
                    .addButton('cancel', gt('Cancel'), 'cancel', {'tabIndex': '1'})
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            api.remove(list).done(function () {
                                api.propagate('delete', list[0]);
                                notifications.yell('success', responseSuccess);
                            }).fail(function (e) {
                                if (e && e.code && e.code === 'IFO-0415') {
                                    notifications.yell('error', responseFailLocked);
                                } else {
                                    notifications.yell('error', responseFail + '\n' + e.error);
                                }
                                api.trigger('refresh:all');
                            });
                        }
                    });
            });
        }
    });

    var isUnLocked = function (e) {
        var list = _.getArray(e.context);
        return _(list).reduce(function (memo, obj) {
            return memo || !api.tracker.isLockedByOthers(obj);
        }, false);
    };

    new Action('io.ox/files/actions/lock', {
        capabilities: '!alone',
        requires: function (e) {
            var list = _.getArray(e.context);
            return _.device('!small') &&
                !_.isEmpty(e.baton.data) &&
                e.collection.has('some') &&
                // hide in mail write preview
                (e.baton.openedBy !== 'io.ox/mail/write') &&
                _(list).reduce(function (memo, obj) {
                    return memo || !api.tracker.isLocked(obj);
                }, false);
        },
        multiple: function (list) {

            var responseSuccess = gt.ngettext(
                    'This file has been locked',
                    'These files have been locked',
                    list.length
            ),
            responseFail = gt.ngettext(
                    'This file has not been locked',
                    'These files have not been locked',
                    list.length
            );

            api.lock(list).done(function () {
                notifications.yell('success', responseSuccess);
            }).fail(function () {
                notifications.yell('error', responseFail);
            });
        }
    });

    new Action('io.ox/files/actions/unlock', {
        capabilities: '!alone',
        requires: function (e) {
            var list = _.getArray(e.context);
            return _.device('!small') &&
                e.collection.has('some') &&
                // hide in mail write preview
                (e.baton.openedBy !== 'io.ox/mail/write') &&
                _(list).reduce(function (memo, obj) {
                    return memo || api.tracker.isLockedByMe(obj);
                }, false);
        },
        multiple: function (list) {

            var responseSuccess = gt.ngettext(
                    'This file has been unlocked',
                    'These files have been unlocked',
                    list.length
            ),
            responseFail = gt.ngettext(
                    'This file has not been unlocked',
                    'These files have not been unlocked',
                    list.length
            );

            api.unlock(list).done(function () {
                notifications.yell('success', responseSuccess);
            }).fail(function () {
                notifications.yell('error', responseFail);
            });
        }
    });

    new Action('io.ox/files/actions/rename', {
        requires: function (e) {
            //hide in mail write preview
            return e.collection.has('one') && isUnLocked(e) && (e.baton.openedBy !== 'io.ox/mail/write');
        },
        action: function (baton) {

            require(['io.ox/core/tk/dialogs', 'io.ox/files/util', 'io.ox/core/notifications'], function (dialogs, util, notifications) {

                var filename = baton.data.filename || baton.data.title;

                /**
                 * @return {promise}
                 */
                function fnRename(name) {

                    var update = {
                            id: baton.data.id,
                            folder_id: baton.data.folder_id
                        };

                    // 'title only' entries
                    if (!baton.data.filename && baton.data.title) {
                        update.title = name;
                    } else {
                        update.filename = name;
                    }

                    return api.update(update).fail(notifications.yell);
                }

                /**
                 * user have to confirm if name doesn't contains a file extension
                 * @return {promise}
                 */
                function process($input) {

                    var name = $.trim($input.val()), invalid = false;

                    // check for valid filename
                    ext.point('io.ox/core/filename')
                        .invoke('validate', null, name, 'file')
                        .find(function (result) {
                            if (result !== true) {
                                notifications.yell('warning', result);
                                return (invalid = true);
                            }
                        });

                    if (invalid) return $.Deferred().reject();

                    return util.confirmDialog(name, filename)
                        .then(
                            function yes() {
                                return fnRename(name);
                            },
                            function no() {
                                setTimeout(function () { $input.focus(); }, 0);
                            }
                        );
                }

                new dialogs.ModalDialog({ enter: 'rename', async: true })
                    .header(
                        $('<h4>').text(gt('Rename'))
                    )
                    .append(
                        $('<input type="text" name="name" class="form-control" tabindex="1">')
                    )
                    .addPrimaryButton('rename', gt('Rename'), 'rename', {'tabIndex': '1'})
                    .addButton('cancel', gt('Cancel'),  'cancel', {'tabIndex': '1'})
                    .on('rename', function () {
                        var $input = this.getContentNode().find('input[name="name"]');
                        process($input).then(this.close, this.idle);
                    })
                    .show(function () {
                        var $input = this.find('input[name="name"]').focus().val(filename);
                        $input.get()[0].setSelectionRange(0, $input.val().lastIndexOf('.'));
                    });
            });
        }
    });

    new Action('io.ox/files/actions/edit-description', {
        requires: function (e) {
            //hide in mail write preview
            return e.collection.has('one') && isUnLocked(e) && (e.baton.openedBy !== 'io.ox/mail/write');
        },
        action: function (baton) {
            require(['io.ox/core/tk/dialogs', 'io.ox/core/tk/keys'], function (dialogs, KeyListener) {
                var keys = new KeyListener($input),
                    dialog = new dialogs.ModalDialog(),
                    $input = $('<textarea rows="10" class="form-control" tabindex="1"></textarea>')
                            .val(baton.data.description),
                    $form = $('<form>')
                            .css('margin', '0 0 0 0')
                            .append(
                                $input
                            );

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

                dialog
                .header($('<h4>').text(gt('Description')))
                .append(
                    $form
                )
                .addPrimaryButton('save', gt('Save'), 'save', {'tabIndex': '1'})
                .addButton('cancel', gt('Cancel'), 'cancel', {'tabIndex': '1'})
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

    function moveAndCopy(type, label, success) {
        new Action('io.ox/files/actions/' + type, {
            id: type,
            requires:  function (e) {
                return e.collection.has('some') && (e.baton.openedBy !== 'io.ox/mail/write') && (type === 'move' ? e.collection.has('delete') && isUnLocked(e) : e.collection.has('read'));
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
            var check = function (data) {
                    data = data || {};
                    return e.collection.has('one') && !_.isEmpty(e.baton.data) && !folderAPI.is('trash', data);
                };
            if (e.baton.app){
                return e.baton.app.folder.getData().then(check);
            } else if (e.baton.data.folder_id) {
                //no app given, maybe the item itself has a folder
                return folderAPI.get(e.baton.data.folder_id).then(check);
            } else {
                //continue without foldercheck
                return check();
            }
        },
        action: function (baton) {
            require(['io.ox/portal/widgets'], function (widgets) {
                widgets.add('stickyfile', {
                    plugin: 'files',
                    props: {
                        id: baton.data.id,
                        folder_id: baton.data.folder_id,
                        title: baton.data.filename || baton.data.title
                    }
                });
                notifications.yell('success', gt('This file has been added to the portal'));
            });
        }
    });

    // version specific actions

    new Action('io.ox/files/versions/actions/makeCurrent', {
        requires: function (e) {
            //hide in mail write preview
            return !e.context.current_version && (e.baton.openedBy !== 'io.ox/mail/write');
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
            //hide in mail write preview
            return e.baton.openedBy !== 'io.ox/mail/write';
        },
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
                    .addPrimaryButton('delete', gt('Delete'), 'delete', {'tabIndex': '1'})
                    .addButton('cancel', gt('Cancel'), 'cancel', {'tabIndex': '1'})
                    .show()
                    .done(function (action) {
                        if (action === 'delete') {
                            api.detach(data);
                        }
                    });
            });
        }
    });

    //guidance

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

    // groups

    new ActionGroup(POINT + '/links/toolbar', {
        id: 'default',
        index: 100,
        icon: function () {
            return $('<i class="fa fa-plus accent-color">');
        }
    });

    new ActionLink(POINT + '/links/toolbar/default', {
        index: 100,
        id: 'upload',
        label: gt('Upload new file'),
        ref: POINT + '/actions/upload'
    });

    new ActionLink(POINT + '/links/toolbar/default', {
        index: 200,
        id: 'note',
        label:
            //#. Please translate like "take a note", "Notiz" in German, for example.
            //#. more like "to notice" than "to notify".
            gt('Add note'),
        ref: POINT + '/actions/editor-new'
    });

    // VIEWS

    new ActionGroup(POINT + '/links/toolbar', {
        id: 'view',
        index: 400,
        icon: function () {
            return $('<i class="fa fa-eye">').attr('aria-label', gt('Change View'));
        }
    });

    new ActionLink(POINT + '/links/toolbar/view', {
        id: 'list',
        index: 100,
        label: gt('List'),
        ref: 'io.ox/files/actions/layout-list'
    });

    new ActionLink(POINT + '/links/toolbar/view', {
        id: 'icon',
        index: 200,
        label: gt('Icons'),
        ref: 'io.ox/files/actions/layout-icon'
    });

    new ActionLink(POINT + '/links/toolbar/view', {
        id: 'tile',
        index: 300,
        label: gt('Tile'),
        ref: 'io.ox/files/actions/layout-tile'
    });

    //guidance

    new links.ActionGroup(POINT + '/links/toolbar', {
        id: 'guidance',
        index: 500,
        icon: function () {
            return $('<i class="fa fa-question-circle">');
        }
    });

    new links.ActionLink(POINT + '/links/toolbar/guidance', {
        label: gt('Guidance'),
        ref: POINT + '/actions/guidance'
    });

    // PUBLISH

    // disabled until we have full pub/sub support
    // new ActionGroup(POINT + '/links/toolbar', {
    //     id: 'publish',
    //     index: 150,
    //     label: gt('Publish'),
    //     icon: function () {
    //         return $('<i class="fa fa-rss">');
    //     }
    // });

    // new ActionLink(POINT + '/links/toolbar/publish', {
    //     id: 'publish',
    //     label: gt('Publish current folder'),
    //     ref: 'io.ox/files/actions/publish'
    // });

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
        id: 'publish',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Share this file'),
        ref: 'io.ox/files/actions/publish',
        section: 'share'
    }));

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

    // Iconview Inline Links

    new Action('io.ox/files/icons/share', {
        capabilities: 'publication',
        requires: function (e) {
            var check = function (data) {
                data = data || {};
                return folderAPI.can('publish', data) && !folderAPI.is('trash', data);
            };
            if (e.baton.app){
                return e.baton.app.folder.getData().then(check);
            } else if (e.baton.data.folder_id) {
                //no app given, maybe the item itself has a folder
                return folderAPI.get(e.baton.data.folder_id).then(check);
            } else {
                //continue without foldercheck
                return check();
            }
        },
        action: function (baton) {
            require(['io.ox/core/pubsub/publications'], function (publications) {
                baton.app.folder.getData().then(function (data) {
                    baton = ext.Baton({ data: data });
                    publications.buildPublishDialog(baton);
                });
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
            require(['io.ox/files/carousel'], function (carousel) {
                carousel.init({
                    fullScreen: false,
                    baton: baton,
                    attachmentMode: false,
                    //tries to start with first displayable item in the current selection
                    useSelectionAsStart: true
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
                    attachmentMode: false,
                    //tries to start with first displayable item in the current selection
                    useSelectionAsStart: true
                });
            });
        }
    });

    /**
     * filters 'description only files'
     * @param  {object|array} list or single item
     * @return {deferred} resolves as array
     */
    function filterUnsupported(list) {
        return _(list).filter(function (obj) {
            return !_.isEmpty(obj.filename) || obj.file_size > 0;
        });
    }

    function checkMedia(e, type) {

        if (!e.collection.has('some') && !settings.get(type + 'Enabled')) {
            return false;
        }

        var list = _.copy(e.baton.allIds, true),
            incompleteHash = {},
            incompleteItems = [],
            def = $.Deferred(),
            index, folder;

        if (_.isUndefined(e.baton.allIds)) {
            e.baton.allIds = e.baton.data;
            list = [e.baton.allIds];
        }

        // avoid runtime errors
        if (!_.isArray(list)) return false;

        //identify incomplete items
        _(list).each(function (item) {
            if (_.isUndefined(item.filename)) {
                // collect all incomplete items grouped by folder ID
                incompleteHash[item.folder_id] = (incompleteHash[item.folder_id] || []).concat(item);
                // all incomplete items
                incompleteItems.push(item);
                index = list.indexOf(item);
                if (index !== -1) {
                    list.splice(index, 1);
                }
            }
        });

        //complement data from server/cache
        folder = Object.keys(incompleteHash);
        if (folder.length === 1) {
            // get only this folder
            def = api.getAll({ folder: folder[0] });
        } else if (folder.length > 1) {
            // multiple folder -> use getList
            def = api.getList(incompleteItems).then(function (data) {
                return list.concat(data);
            });
        } else {
            // nothing to do
            def.resolve(list);
        }

        return def.then(function (data) {
            //update baton
            e.baton.allIds = data;
            return _(data).reduce(function (memo, obj) {
                return memo || !!(obj && api.checkMediaFile(type, obj.filename));
            }, false);
        });
    }

    new Action('io.ox/files/icons/audioplayer', {
        requires: function (e) {
            if (_.device('android')) return false;
            return checkMedia(e, 'audio');
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
            if (_.device('android')) return false;
            return checkMedia(e, 'video');
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
        label: gt('Share this folder'),
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

    //rightside
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
