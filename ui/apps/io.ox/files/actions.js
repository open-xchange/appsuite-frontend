/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */
/* global blankshield */
define('io.ox/files/actions', [
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/core/api/user',
    'io.ox/files/share/api',
    'io.ox/files/util',
    'io.ox/core/api/filestorage',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/capabilities',
    'io.ox/files/actions/download',
    'settings!io.ox/files',
    'settings!io.ox/core',
    'gettext!io.ox/files',
    'io.ox/core/yell'
], function (folderAPI, api, userAPI, shareAPI, util, filestorageApi, ext, links, capabilities, download, settings, coreSettings, gt, yell) {

    'use strict';

    var Action = links.Action,
        COMMENTS = settings.get('features/comments', true),
        // used by text editor
        allowedFileExtensions = ['csv', 'txt', 'js', 'css', 'md', 'tmpl', 'html'];

    if (capabilities.has('guard')) {
        allowedFileExtensions.push('pgp');
    }

    function isTrash(baton) {
        var model,
            folderId;
        if (baton.app) {
            folderId = baton.app.folder.get();
        } else if (baton.data) {
            folderId = baton.data.folder_id;
        }
        model = folderAPI.pool.getModel(folderId);
        return model ? folderAPI.is('trash', model.toJSON()) : false;
    }

    /**
     * Removes items from listView and selects a file
     *
     * @param {ListView} listView
     *  Object of the current listView
     *
     * @param {(FileDescriptor|FolderDescriptor)[]} models
     *  a mixed set of model descriptors
     */
    function removeFromList(listView, models) {
        var cids = _.map(models, function (model) { return model.folder_id ? _.cid(model) : 'folder.' + model.id; }),
            selection = listView.selection,
            items2remove = selection.getItems().filter('.selected');

        if (_.intersection(cids, selection.get()).length) {
            // set the direction for dodge function
            selection.getPosition();
            // change selection
            selection.dodge();
            // remove all DOM elements of previous selection
            _.each(items2remove, function (item) {
                item.remove();
            });
        }
    }

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
            var elem = $(baton.e.target),
                input;

            // remove old input-tags resulting from 'add local file' -> 'cancel'
            elem.siblings('input').remove();

            elem.after(
                input = $('<input type="file" name="file" multiple>')
                .css('display', 'none')
                .on('change', function (e) {
                    var app = baton.app;
                    require(['io.ox/files/upload/main'], function (fileUpload) {
                        e.preventDefault();

                        var list = [];
                        _(e.target.files).each(function (file) {
                            list.push(_.extend(file, { group: 'file' }));
                        });
                        var options = _.extend({ folder: app.folder.get() }, baton.file_options);
                        fileUpload.setWindowNode(app.getWindowNode());
                        fileUpload.create.offer(list, options);
                    });
                    input.remove();
                })
            );

            input.trigger('click');
        }
    });

    // editor
    if (window.Blob) {

        new Action('io.ox/files/actions/editor', {
            requires: function (e) {
                if (isTrash(e.baton)) return false;
                return api.versions.getCurrentState(e.baton.data).then(function (currentVersion) {
                    var model = _.first(e.baton.models);
                    var isEncrypted = model && model.isEncrypted();
                    var encryptionPart = isEncrypted ? '\\.pgp' : '';
                    // the pgp extension is added separately to the regex, remove it from the file extension list
                    var fileExtensions = _.without(allowedFileExtensions, 'pgp');
                    // build regex from list, pgp is added if guard is available
                    var regex = new RegExp('\\.(' + fileExtensions.join('|') + '?)' + encryptionPart + '$', 'i');

                    return util.conditionChain(
                        currentVersion,
                        e.collection.has('one', 'modify'),
                        !util.hasStatus('lockedByOthers', e),
                        regex.test(e.context.filename),
                        (e.baton.openedBy !== 'io.ox/mail/compose'),
                        util.isFolderType('!trash', e.baton)
                    );
                });
            },
            action: function (baton) {
                var launch = function (params) {
                    if (ox.ui.App.reuse('io.ox/editor:edit.' + _.cid(baton.data))) {
                        // if this was opened from the viewer, close it now
                        if (baton.context && baton.context.viewerEvents) {
                            baton.context.viewerEvents.trigger('viewer:close');
                        }
                        return;
                    }
                    ox.launch('io.ox/editor/main', { folder: baton.data.folder_id, id: baton.data.id, params: _.extend({ allowedFileExtensions: allowedFileExtensions }, params) }).done(function () {
                        // if this was opened from the viewer, close it now
                        if (baton.context && baton.context.viewerEvents) {
                            baton.context.viewerEvents.trigger('viewer:close');
                        }
                    });
                };

                // Check if Guard file.  If so, do auth then call with parameters
                // do not use endsWith because of IE11
                if (((baton.data.meta && baton.data.meta.Encrypted) || baton.data.filename.toLowerCase().lastIndexOf('.pgp') === baton.data.filename.length - 4) && capabilities.has('guard')) {
                    require(['io.ox/guard/auth/authorizer'], function (guardAuth) {
                        guardAuth.authorize().then(function (auth) {
                            var params = {
                                cryptoAction: 'Decrypt',
                                cryptoAuth: auth,
                                session: ox.session
                            };
                            launch(params);
                        });
                    });
                    return;
                }

                launch();
            }
        });

        new Action('io.ox/files/actions/editor-new', {
            requires: function (e) {
                return e.baton.app.folder.getData().then(function (data) {
                    //hide for virtual folders (other files root, public files root)
                    var virtual = _.contains(['14', '15'], data.id);

                    //no new files in trash folders
                    if (folderAPI.is('trash', data)) return false;
                    // no new files in virtual folders
                    if (virtual) return false;
                    // no new files in mail attachments
                    if (e.baton.openedBy === 'io.ox/mail/compose') return false;

                    return folderAPI.can('create', data);
                });
            },
            action: function (baton) {
                ox.launch('io.ox/editor/main').done(function () {
                    this.create({ folder: baton.app.folder.get(), params: { allowedFileExtensions: allowedFileExtensions } });
                });
            }
        });
    }

    new Action('io.ox/files/actions/download', {
        requires: function (e) {
            // no download for oldeer ios devices
            if (_.device('ios') && _.device('ios < 11')) return false;

            function isValid(file) {
                // locally added but not yet uploaded,   'description only' items
                return ((file.group !== 'localFile') && (!_.isEmpty(file.filename) || file.file_size > 0));
            }

            if (e.collection.has('multiple')) {
                var result = true;
                _.each(e.baton.data, function (obj) {
                    if (!isValid(obj)) {
                        result = false;
                    }
                });
                return result;
            } else if (_(e.baton.data).has('internal_userid')) {
                // check if this is a contact not a file, happens when contact is send as vcard
                return false;
            }

            return isValid(e.baton.data);
        },
        multiple: function (list) {
            download(list);
        }
    });

    new Action('io.ox/files/actions/download-folder', {
        requires: function (e) {
            if (_.device('ios') && _.device('ios < 11')) return false;
            // single folders only
            if (!e.collection.has('one', 'folders')) return false;
            //disable for external storages
            return !filestorageApi.isExternal(e.baton.data);
        },
        action: function (baton) {
            require(['io.ox/files/api'], function (api) {
                api.zip(baton.data.id);
            });
        }
    });

    new Action('io.ox/files/actions/downloadversion', {
        requires: function (e) {
            // no file-system, no download
            if (_.device('ios') && _.device('ios < 11')) return false;
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

    new Action('io.ox/files/actions/permissions', {
        requires: function (e) {
            if (_.device('smartphone')) return false;
            if (!e.collection.has('one')) return false;
            // get proper id
            var id = e.collection.has('folders') ? e.baton.data.id : e.baton.data.folder_id;
            return folderAPI.pool.getModel(id).isShareable();
        },
        action: function (baton) {
            require(['io.ox/files/share/permissions'], function (controller) {
                var model = baton.models[0];
                if (model.isFile()) {
                    controller.showFilePermissions(baton.data);
                } else {
                    controller.showFolderPermissions(baton.data.id);
                }
            });
        }
    });

    new Action('io.ox/files/actions/open', {
        requires: function (e) {
            if (e.collection.has('multiple')) return false;
            if (e.collection.has('folders')) return false;
            // check if this is a contact not a file, happens when contact is send as vcard
            if (_(e.baton.data).has('internal_userid')) return false;
            // locally added but not yet uploaded
            if (e.baton.data.group === 'localFile') { return false; }
            // no 'open' menu entry for office documents, PDF and plain text
            if (api.isOffice(e.baton.data)) return false;
            if (api.isPDF(e.baton.data)) return false;
            if (api.isText(e.baton.data)) return false;
            // 'description only' items
            return !_.isEmpty(e.baton.data.filename) || e.baton.data.file_size > 0;
        },
        multiple: function (list) {
            _(list).each(function (file) {
                blankshield.open(api.getUrl(file, 'open'));
            });
        }
    });

    new Action('io.ox/files/actions/send', {
        capabilities: 'webmail',
        requires: function (e) {
            if (!capabilities.has(this.capabilities)) { return; }

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
                ox.registry.call('mail-compose', 'open', {
                    attachments: filtered_list.map(function (file) {
                        return {
                            origin: 'drive',
                            id: file.id,
                            folder_id: file.folder_id
                        };
                    })
                });
            });
        }
    });

    new Action('io.ox/files/actions/delete', {
        requires: function (e) {
            // hide in mail compose preview
            if (e.baton.openedBy === 'io.ox/mail/compose') return false;
            // not in standalone mode
            if (e.context.standalone) return false;
            return e.collection.has('some', 'delete') && util.hasStatus('!lockedByOthers', e);
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
            if (e.collection.has('guard') && !capabilities.has('guard')) return false;
            return e.collection.has('some', 'items');
        },
        action: function (baton) {
            ox.load(['io.ox/core/viewer/main']).done(function (Viewer) {
                var viewer = new Viewer(),
                    selection = [].concat(baton.data);

                if (selection.length > 1) {
                    // only show selected files - the first one is automatically selected
                    viewer.launch({ files: selection });
                } else {
                    viewer.launch({ selection: _(selection).first(), files: baton.collection.models });
                }
            });
        }
    });

    //drive action for double-click or enter in files
    new Action('io.ox/files/actions/default', {
        action: function (baton) {
            require(['io.ox/core/extPatterns/actions']).done(function (actions) {
                actions.invoke('io.ox/files/actions/viewer', null, baton);
            });
        }
    });

    new Action('io.ox/files/actions/lock', {
        capabilities: '!alone',
        requires: function (e) {
            if (isTrash(e.baton)) return false;
            var preCondition = _.device('!smartphone') &&
                !_.isEmpty(e.baton.data) &&
                e.collection.has('some', 'modify', 'items') &&
                // hide in mail compose preview
                (e.baton.openedBy !== 'io.ox/mail/compose') &&
                util.hasStatus('!locked', e);

            // only test the second condition when files are selected, so 'some' and 'items' must be checked in the preCondition
            return preCondition && folderAPI.get(_.first(e.baton.models).get('folder_id')).then(function (fileModel) { return !folderAPI.isExternalFileStorage(fileModel); });
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
            if (isTrash(e.baton)) return false;
            var preCondition = _.device('!smartphone') &&
                !_.isEmpty(e.baton.data) &&
                e.collection.has('some', 'modify', 'items') &&
                // hide in mail compose preview
                (e.baton.openedBy !== 'io.ox/mail/compose') &&
                util.hasStatus('locked', e) &&
                // locked or created by me
                (util.hasStatus('lockedByMe', e) || util.hasStatus('createdByMe', e));

            // only test the second condition when files are selected, so 'some' and 'items' must be checked in the preCondition
            return preCondition && folderAPI.get(_.first(e.baton.models).get('folder_id')).then(function (fileModel) { return !folderAPI.isExternalFileStorage(fileModel); });
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
                // check if this is a contact not a file, happens when contact is send as vcard
                !_(e.baton.data).has('internal_userid'),
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

    function hasObjectWritePermissions(data) {
        if (_.isArray(data)) data = _(data).first();
        if (!_.isObject(data)) return false;
        var array = data.object_permissions || data['com.openexchange.share.extendedObjectPermissions'],
            myself = _(array).findWhere({ entity: ox.user_id });

        // check if there is a permission for a group, the user is a member of
        // use max permissions available
        if ((!myself || (myself && myself.bits < 2)) && _(array).findWhere({ group: true })) {
            var def = $.Deferred();

            userAPI.get().done(function (userData) {
                myself = _(array).findWhere({ entity: _(_.pluck(array, 'entity')).intersection(userData.groups)[0] });
                def.resolve(!!(myself && (myself.bits >= 2)));
            }).fail(function () { def.reject(); });

            return def;

        }

        return !!(myself && (myself.bits >= 2));
    }

    new Action('io.ox/files/actions/rename', {
        requires: function (e) {
            if (isTrash(e.baton)) return false;
            // one?
            if (!e.collection.has('one')) return false;
            if (util.hasStatus('lockedByOthers', e)) return false;
            // hide in mail compose preview
            if (e.baton.openedBy === 'io.ox/mail/compose') return false;
            // case 1: folder?
            if (e.collection.has('folders')) {
                return e.collection.has('rename:folder');
            }
            // case 2: file
            // access on folder?
            if (e.collection.has('modify')) return true;
            // check object permission
            return hasObjectWritePermissions(e.baton.data);
        },
        action: function (baton) {
            // if this is a folder use the folder rename action
            if (baton.data.folder_id === 'folder') {
                ox.load(['io.ox/core/folder/actions/rename']).done(function (action) {
                    action(baton.data.id);
                });
            } else {
                // files use the file rename action
                ox.load(['io.ox/files/actions/rename']).done(function (action) {
                    action(baton.data);
                });
            }
        }
    });

    new Action('io.ox/files/actions/save-as-pdf', {
        capabilities: 'document_preview', // document converter.
        requires: function (e) {
            if (isTrash(e.baton)) return false;
            // one?
            if (e.baton.favorite) return false;
            if (!e.collection.has('one')) return false;

            // hide in mail compose preview
            if (e.baton.openedBy === 'io.ox/mail/compose') return false;

            // is folder?
            if (e.collection.has('folders')) return false;

            // bug 54493: no "Save as PDF" for anonymous guests (same solution as in bug 42621)
            if (capabilities.has('guest && anonymous')) return false;

            var model = e.baton.models[0];
            //    isAccessWrite = folderAPI.can('create', folderAPI.pool.models[model.get('folder_id')].toJSON());
            //
            //if (!isAccessWrite(e)) return false;

            // preferred variant over >> return (model.isFile() && !model.isPDF()); <<
            return (model.isFile() && (model.isOffice() || model.isText()));
        },
        action: function (baton) {
            // files use the file rename action
            ox.load(['io.ox/files/actions/save-as-pdf']).done(function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/files/actions/edit-description', {
        requires: function (e) {
            if (isTrash(e.baton)) return false;
            if (!e.collection.has('one', 'items')) return false;
            if (util.hasStatus('lockedByOthers', e)) return false;
            // hide in mail compose preview
            if (e.baton.openedBy === 'io.ox/mail/compose') return false;
            if (!(folderAPI.pool.getModel(e.baton.data.folder_id || e.baton.data[0].folder_id).supports('extended_metadata'))) return false;
            // access on folder?
            if (e.collection.has('modify')) return true;
            // check object permission
            return hasObjectWritePermissions(e.baton.data);
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/edit-description']).done(function (action) {
                // initially the description in not in the reduced data in the pool that is used here, get the fileModel
                api.get(baton.data).done(function (fileModel) {
                    action(fileModel);
                });
            });
        }
    });

    new Action('io.ox/files/actions/upload-new-version', {
        requires: function (e) {
            // hide in mail compose preview and only when file backend supports version comments
            return e.collection.has('one', 'modify', 'items') && util.hasStatus('!lockedByOthers', e) && (e.baton.openedBy !== 'io.ox/mail/compose') && COMMENTS &&
                   folderAPI.pool.getModel(e.baton.data.folder_id || e.baton.data[0].folder_id) && folderAPI.pool.getModel(e.baton.data.folder_id || e.baton.data[0].folder_id).can('add:version');
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/upload-new-version']).done(function (action) {
                action(baton.data);
            });
        }
    });

    // Action to restore a list of files and folders
    new Action('io.ox/files/actions/restore', {
        requires: function (e) {
            if (!e.context) return false;

            if (!_.isArray(e.context)) e.context = [e.context];

            if (!e.context.length) return false;

            var result = true;
            _.each(e.context, function (element) {
                // folderId where the item is located
                var folderId = element.folder_id;
                if ((/^folder\./).test(e.context[0].cid)) {
                    // the folderId is the id of the parent folder if the item is a folder
                    var folderModel = folderAPI.pool.getModel(e.context[0].id);
                    folderId = folderModel.get('folder_id');
                }

                // is an item is not located in the trash, disable the action
                if (String(settings.get('folder/trash')) !== folderId) {
                    result = false;
                }
            });

            return result;
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/restore']).done(function (action) {
                if (!_.isArray(baton.data)) baton.data = [baton.data];
                var models = [];
                _.each(baton.data, function (element) {
                    var model = new api.Model(element);
                    var key = baton.app.listView.getCompositeKey(model);

                    // the file model of files and folders
                    var convertedModel = api.resolve([key], false);
                    if (convertedModel.length) models.push(convertedModel[0]);
                });

                action(models);
            });
        }
    });

    function moveAndCopy(type, label, success) {
        new Action('io.ox/files/actions/' + type, {
            requires:  function (e) {
                if (!e.collection.has('some')) return false;
                if (e.baton.openedBy === 'io.ox/mail/compose') return false;
                if (type === 'move' && e.baton.favorite) return false;
                if (util.hasStatus('lockedByOthers', e)) return false;
                // anonymous guests just have one folder so no valid target folder (see bug 42621)
                if (capabilities.has('guest && anonymous')) return false;
                // copy
                if (type === 'copy') return e.collection.has('some', 'items', 'read');
                // move
                return e.collection.has('delete');
            },
            multiple: function (list, baton) {
                ox.load(['io.ox/files/actions/move-copy']).done(function (action) {
                    var options = {
                        type: type,
                        fullResponse: true,
                        label: label,
                        success: success,
                        successCallback: function (response, apiInput) {
                            // see file/api.js transfer(): in case of an error the callback returns a string
                            if (!_.isString(response)) {
                                var conflicts = { warnings: [] },
                                    itemsLeft = [];

                                if (!_.isArray(response)) {
                                    response = [response];
                                }
                                // find possible conflicts with filestorages and offer a dialog with ignore warnings option see(Bug 39039)
                                _.each(response, function (error) {
                                    // check the error structure to prevent a nested error object
                                    var errorResponse = _.isString(error.error) ? error : error.error;

                                    if (errorResponse) {

                                        var errorCausedByFolder = errorResponse.code === 'FLD-1038';
                                        var errorCausedByFile = errorResponse.code.indexOf('FILE_STORAGE') === 0;
                                        var warningsInErrorResponse = _.isArray(errorResponse.warnings) ? errorResponse.warnings : [errorResponse.warnings];

                                        if (errorResponse.categories === 'CONFLICT' && (errorCausedByFile || errorCausedByFolder)) {

                                            // -> populate error title for the dialog
                                            if (!conflicts.title) {
                                                conflicts.title = errorResponse.error;
                                            }

                                            // -> populate 'itemsLeft' for folder that will be moved after pressed on ignore conflict
                                            if (errorCausedByFolder && type === 'move' && !_(itemsLeft).findWhere({ id: errorResponse.error_params[1] })) {
                                                itemsLeft.push(_(list).findWhere({ id: errorResponse.error_params[1] }));
                                            }

                                            // -> populate 'itemsLeft' list for files that will be moved after pressed on ignore conflict
                                            // note: when a folder is moved and the conflict happens for files in this folder, don't move these files but only the folder
                                            if (!errorCausedByFolder && type === 'move' && warningsInErrorResponse) {
                                                _.each(warningsInErrorResponse, function (warning) {
                                                    if (!_(itemsLeft).findWhere({ id: warning.error_params[3] })) {
                                                        itemsLeft.push(_(list).findWhere({ id: warning.error_params[3] }));
                                                    }
                                                });
                                            }

                                            // -> populate shown warnings for the dialog
                                            if (warningsInErrorResponse) {
                                                _.each(warningsInErrorResponse, function (warning) {
                                                    conflicts.warnings.push(warning.error);
                                                });
                                            }

                                            // unfortunately move and copy responses do nt have the same structure
                                            if (type === 'copy') {
                                                itemsLeft.push(_(list).findWhere({ id: errorResponse.error_params[1] }));
                                            }
                                        }
                                    }
                                });

                                if (conflicts.title && itemsLeft.length) {
                                    require(['io.ox/core/tk/filestorageUtil'], function (filestorageUtil) {
                                        filestorageUtil.displayConflicts(conflicts, {
                                            callbackIgnoreConflicts: function () {
                                                // if folderpicker is used baton.target is undefined (that's why the folderpicker is needed), use the previous apiInput to get the correct folder
                                                api[type](itemsLeft, baton.target || apiInput.target, true)
                                                .always(function (response) {

                                                    // see file/api.js transfer(): in case of an error the callback returns a string
                                                    // important: only errors must be checked, conflicts can't happen here, since the
                                                    // ignoreConflicts flag is 'true' at api.move
                                                    var error = _.isString(response);

                                                    if (error) {
                                                        require(['io.ox/core/yell'], function (yell) {
                                                            yell('error', response);
                                                            api.trigger('reload:listview');
                                                        });

                                                    } else {
                                                        //no error, must be success
                                                        require(['io.ox/core/yell'], function (yell) {
                                                            yell('success', list.length > 1 ? success.multiple : success.single);
                                                        });
                                                    }

                                                });
                                            },
                                            callbackCancel: function () {
                                                // note: drag&drop and actions via menu use a different baton, see b53498
                                                var folder_id = _.isArray(baton.data) ? baton.data[0].folder_id : baton.data.folder_id;
                                                if (folder_id) {
                                                    folderAPI.reload(folder_id);
                                                    // bug 53498: refresh the list to display the not moved elements again after a failed move,
                                                    // when it's working without this sometimes, it's due to a side effect from pagination
                                                    api.trigger('reload:listview');
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    //no error, must be success
                                    require(['io.ox/core/yell'], function (yell) {
                                        yell('success', list.length > 1 ? success.multiple : success.single);
                                    });
                                }
                            } else {
                                require(['io.ox/core/yell'], function (yell) {
                                    yell('error', response);
                                    // bug 53498: refresh the list to display the not moved elements again after a failed move,
                                    // when it's working without this sometimes, it's due to a side effect from pagination
                                    api.trigger('reload:listview');
                                });
                            }
                        }
                    };
                    action(list, baton, options);
                });
            }
        });
    }

    moveAndCopy('move', gt('Move'), { single: gt('File has been moved'), multiple: gt('Files have been moved') });
    moveAndCopy('copy', gt('Copy'), { single: gt('File has been copied'), multiple: gt('Files have been copied') });

    /**
     * Checks if the collection inside an event is shareable
     * @param {Event} e
     *  Event to check the collection
     * @param {String} type
     *  Type of the sharing to check ("invite" or "link")
     * @returns {boolean}
     *  Whether the elements inside the collection are shareable
     */
    function isShareable(e, type) {
        var id, folderModel;

        // not possible for multi-selection
        if (e.collection.has('multiple')) return false;
        // check if this is a contact not a file, happens when contact is send as vcard
        if (e.baton.data && _(e.baton.data).has('internal_userid')) return false;
        // get folder id
        if (e.collection.has('one')) {

            // -> from the folder tree we get an array, in the list an obj so normalize
            var dataObj = _.isArray(e.baton.data) ? e.baton.data[0] : e.baton.data;
            id = e.collection.has('folders') ? dataObj.id : dataObj.folder_id;

        } else if (e.baton.app) {
            // use current folder
            id = e.baton.app.folder.get();
        }

        if (!id) return false;
        // general capability and folder check
        folderModel = folderAPI.pool.getModel(id);
        if (!folderModel.isShareable()) return false;
        if (folderModel.is('trash')) return false;
        return type === 'invite' ? folderModel.supportsInviteGuests() : true;
    }

    new Action('io.ox/files/dropdown/share', {
        requires: function (e) {
            // usually this dropdown was always true and only removed in case the child actions are disabled.
            // but this introduced jumping icons in the toolbar, therefore we check the dropdown/share too now to prevent this.
            // note for the next one who is working in this area: a more elegant solution would be to wait until
            // the child action from this dropdown are checked or something similar, so that we don't need
            // to check it twice like now.
            return isShareable(e, 'link') || isShareable(e, 'invite');
        },
        action: $.noop
    });

    // Action for the editShare Dialog. Detects if the link or invitiation dialog is opened.
    new Action('io.ox/files/actions/editShare', {
        requires: function (e) {
            if (!e.baton.app || !e.baton.app.mysharesListView || !e.baton.app.mysharesListView.$el) return false;
            // we must check the real selection because in myShares we could have two items for one model
            if (e.baton.app.mysharesListView.selection.get().length !== 1) return false;
            return true;
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/share']).done(function (action) {
                var models = _.isArray(baton.models) ? baton.models : [baton.models],
                    shareType, elem;
                if (models && models.length) {
                    elem = baton.app.mysharesListView.$el.find('.list-item.selected');
                    if (elem.length) {
                        shareType = elem.attr('data-share-type');
                        if (shareType === 'invited-people') {
                            action.invite(models);
                        } else if (shareType === 'public-link') {
                            action.link(models);
                        }
                    }
                }
            });
        }
    });

    // folder based actions
    new Action('io.ox/files/actions/invite', {
        capabilities: 'invite_guests',
        requires: function (e) {
            if (e.baton.models.length > 1) return false;
            return isShareable(e, 'invite');
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/share']).done(function (action) {
                if (baton.models && baton.models.length) {
                    // share selected file
                    action.invite(baton.models);
                } else {
                    // share current folder
                    // convert folder model into file model
                    var id = baton.app.folder.get(),
                        model = new api.Model(folderAPI.pool.getModel(id).toJSON());
                    action.invite([model]);
                }
            });
        }
    });

    new Action('io.ox/files/actions/getalink', {
        capabilities: 'share_links',
        requires: function (e) {
            if (e.baton.models.length > 1) return false;
            return isShareable(e, 'link');
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/share']).done(function (action) {
                if (baton.models && baton.models.length) {
                    action.link(baton.models);
                } else {
                    // share current folder
                    // convert folder model into file model
                    var id = baton.app.folder.get(),
                        model = new api.Model(folderAPI.pool.getModel(id).toJSON());
                    action.link([model]);
                }
            });
        }
    });

    // Action to revoke the sharing of the files.
    new Action('io.ox/files/share/revoke', {
        requires: function (e) {
            if (!e.baton.app || !e.baton.app.mysharesListView || !e.baton.app.mysharesListView.$el) return false;
            // we must check the real selection because in myShares we could have two items for one model
            if (e.baton.app.mysharesListView.selection.get().length !== 1) return false;
            return true;
        },
        action: _.throttle(function (baton) {
            require(['io.ox/files/share/permissions', 'io.ox/files/share/api'], function (permissions, shareApi) {

                var models = _.isArray(baton.models) ? baton.models : [baton.models];
                if (models && models.length) {
                    var model = _.first(models),
                        elem = baton.app.mysharesListView.$el.find('.list-item.selected'),
                        shareType = elem.attr('data-share-type'),
                        shareModel = new shareApi.Model(model.isFile() ? model.pick('id', 'folder_id') : model.pick('id')),
                        folderId = model.get('folder_id') || model.get('id'),
                        options = { module: 'infostore', folder: folderId },
                        permissionsToKeep,
                        fileModel, folderModel,
                        newPermissionList, newExtendedPermissionList,
                        ids = _.map(baton.models, function (model) { return model.toJSON(); });

                    removeFromList(baton.app.mysharesListView, ids);

                    // do nothing when the item is removed from DOM, because the type is (unfortunately) determined by DOM attributes
                    // revoking an sharing link while the DOM does not exist would remove permissions for example as shareType is undefined
                    if (shareType === undefined) { return; }

                    shareModel.loadExtendedPermissions().done(function () {

                        if (shareType === 'public-link') {
                            var def;

                            if (model.isFile()) {
                                options.item = model.get('id');
                                // workaround: do not cache, we need the most recent data from the server to prevent old timestamps
                                def = api.get(_.pick(model.toJSON(), 'id', 'folder_id'), { cache: false }).then(function (fileModel) {
                                    // use this as a timestamp for files for deleteLink, never use system time!
                                    return fileModel.sequence_number;
                                });
                            } else {
                                // workaround: do not cache, we need the most recent data from the server to prevent old timestamps
                                def = folderAPI.get(model.get('id'), { cache: false }).then(function (folderDesc) {
                                    // use this as a timestamp for deleteLink, never use system time!
                                    return folderDesc.last_modified_utc;
                                });
                            }

                            def.done(function (changeTimestamp) {
                                shareAPI.deleteLink(options, changeTimestamp)
                                .done(function () {
                                    yell('success', gt('Revoked access.'));
                                    shareModel.destroy.bind(shareModel);
                                })
                                .fail(function (error) {
                                    // current 'dirty' workaround: the error below appears when the link does not exist anymore on the server and when the user revoke it,
                                    // the user should not see this error, so we can just refresh the view and refresh all data to be sync again
                                    if (error.categories === 'ERROR' && error.code === 'SHR-0023') {
                                        ox.trigger('refresh^');
                                    } else {
                                        yell(error);
                                    }
                                });
                            });

                        } else {
                            shareModel.reload().done(function () {
                                permissionsToKeep = shareModel.getPermissions().filter(function (item) {
                                    if (item.type === 'anonymous' || ox.user_id === item.entity) {
                                        return true;
                                    }
                                    return false;
                                });

                                shareModel.setPermissions(permissionsToKeep);

                                if (model.isFolder()) {
                                    folderAPI.get(model.get('id')).done(function (folderDesc) {
                                        folderModel = new folderAPI.FolderModel(folderDesc);
                                        newPermissionList = folderModel.get('permissions').filter(function (item) {
                                            return !!_.where(permissionsToKeep, { entity: item.entity }).length;
                                        });
                                        folderAPI
                                            .update(folderModel.get('id'), { permissions: newPermissionList })
                                            .done(function () {
                                                yell('success', gt('Revoked access.'));
                                            })
                                            .fail(function (error) {
                                                yell(error);
                                            });
                                    });
                                } else {
                                    api.get(_.pick(model.toJSON(), 'id', 'folder_id')).done(function (fileDesc) {
                                        fileModel = new api.Model(fileDesc);
                                        newPermissionList = fileModel.get('object_permissions').filter(function (item) {
                                            return !!_.where(permissionsToKeep, { entity: item.entity }).length;
                                        });
                                        newExtendedPermissionList = fileModel.get('com.openexchange.share.extendedObjectPermissions').filter(function (item) {
                                            return !!_.where(permissionsToKeep, { entity: item.entity }).length;
                                        });
                                        api
                                            .update(fileDesc, {
                                                object_permissions: newPermissionList,
                                                'com.openexchange.share.extendedObjectPermissions': newExtendedPermissionList
                                            }, { silent: true })
                                            .done(function () {
                                                fileModel.destroy.bind(fileModel);
                                                yell('success', gt('Revoked access.'));
                                            })
                                            .fail(function (error) {
                                                yell(error);
                                            });
                                    });
                                }
                            });
                        }
                    })
                    .fail(function (error) {
                        yell(error);
                    });
                }
            });
        }, 600)
    });

    // version specific actions

    new Action('io.ox/files/versions/actions/makeCurrent', {
        requires: function (e) {
            // hide in mail compose preview
            return e.collection.has('one', 'items', 'modify') && !e.context.current_version && (e.baton.openedBy !== 'io.ox/mail/compose');
        },
        action: function (baton) {
            api.versions.setCurrent(baton.data);
        }
    });

    new Action('io.ox/files/versions/actions/deletePreviousVersions', {
        requires: function (e) {
            // hide in mail compose preview
            if (!e.collection.has('one', 'items', 'modify')) return false;
            if (e.baton.latestVersion) return false;
            if (e.baton.openedBy === 'io.ox/mail/compose') return false;
            return true;
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/delete-previous-versions']).done(function (action) {
                action(baton.data);
            });
        }
    });

    new Action('io.ox/files/versions/actions/delete', {
        requires: function (e) {
            // hide in mail compose preview
            return e.collection.has('one', 'items', 'delete') && e.baton.openedBy !== 'io.ox/mail/compose';
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
            return folderAPI.can('create:folder', model.toJSON()) && !folderAPI.is('trash', model.toJSON());
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

    new Action('io.ox/files/premium/actions/synchronize', {
        capabilities: 'boxcom || google || microsoftgraph',
        requires: function () {
            // use client onboarding here, since it is a setting and not a capability
            return capabilities.has('client-onboarding');
        },
        action: function () {
            require(['io.ox/onboarding/clients/wizard'], function (wizard) {
                wizard.run();
            });
        }
    });

    // Action to switch to the folder of a file
    new Action('io.ox/files/actions/show-in-folder', {
        requires: function (e) {
            if (_.device('smartphone')) return false;
            if (!e.collection.has('one')) return false;
            if (!e.baton.favorite && !e.baton.share && !e.baton.portal) return false;

            // get proper id
            var id = e.collection.has('folders') ? e.baton.data.id : e.baton.data.folder_id;
            var model = folderAPI.pool.getModel(id);
            return !!model;
        },
        action: function (baton) {
            var app = baton.app,
                model = baton.models[0],
                attr = model.attributes,
                folder_id = model.isFile() ? attr.folder_id : attr.id,
                listView = app.listView,
                mysharesListView = app.mysharesListView,
                myfavoritesListView = app.myfavoritesListView,
                cid = app.listView.getCompositeKey(model),

                // refresh the view and select file even if the folder is already selected
                alwaysChange = baton.alwaysChange;

            function select() {
                if (mysharesListView) {
                    mysharesListView.off('listview:shown', select);
                } else if (myfavoritesListView) {
                    myfavoritesListView.off('listview:shown', select);
                } else {
                    listView.off('listview:shown', select);
                }

                listView.off('collection:rendered', select);
                listView.selection.set([cid], true);

                var element = app.listView.selection.getNode(cid);
                listView.selection.selectAll(element);
            }

            if (mysharesListView && mysharesListView.$el.is(':visible')) {
                mysharesListView.on('listview:shown', select);
            } else if (myfavoritesListView && myfavoritesListView.$el.is(':visible')) {
                myfavoritesListView.on('listview:shown', select);
            } else {
                listView.on('listview:shown', select);
                listView.on('listview:reset', select);
            }

            if (alwaysChange && app.folder.get() === folder_id) {
                select();
            } else {
                app.folder.set(folder_id);
            }
        }
    });

    // Action to add files/folders to favorites
    new Action('io.ox/files/favorites/add', {
        requires: function (e) {
            if (isTrash(e.baton)) return false;
            if (capabilities.has('guest && anonymous')) return false;

            var favorites = coreSettings.get('favorites/infostore', []);
            var favoriteFiles = coreSettings.get('favoriteFiles/infostore', []);

            var allFavorites = favorites;
            _.each(favoriteFiles, function (file) {
                allFavorites.push(file.id);
            });

            if (Array.isArray(allFavorites)) {
                if (!Array.isArray(e.context)) {
                    e.context = [e.context];
                }

                if (!e.context.length) {
                    e.context.push({ id: e.baton.app.folder.get(), folder_id: 'folder' });
                }

                // returns false if one file/folder of the selection is in favorites or a 'local file' (see below)
                var result =  _.some(e.context, function (element) {
                    // check that we don't have a local file (upload file in mailcompose, view the file -> we have a local file)
                    if (element.group === 'localFile') {
                        return true;
                    }

                    var isFavorite = _.find(favorites, function (elemId) {
                        if (elemId === element.id) {
                            return true;
                        }
                    });
                    return folderAPI.is('trash', element) || isFavorite;
                });

                return !result;
            }
            return true;
        },
        multiple: function (list, baton) {
            if (!Array.isArray(list) || !list.length) {
                if (baton.app) {
                    var model = folderAPI.pool.getModel(baton.app.folder.get());
                    list = [model.toJSON()];
                }
            }
            ox.load(['io.ox/files/actions/favorites']).done(function (action) {
                action.add(list);
            });
        }
    });

    // Action to remove files/folders to favorites
    new Action('io.ox/files/favorites/remove', {
        requires: function (e) {
            if (capabilities.has('guest && anonymous')) return false;
            var favorites = coreSettings.get('favorites/infostore', []);
            var favoriteFiles = coreSettings.get('favoriteFiles/infostore', []);

            var allFavorites = favorites;
            _.each(favoriteFiles, function (file) {
                allFavorites.push(file.id);
            });

            if (Array.isArray(allFavorites)) {
                if (!Array.isArray(e.context)) {
                    e.context = [e.context];
                }

                if (!e.context.length) {
                    e.context.push({ id: e.baton.app.folder.get(), folder_id: 'folder' });
                }

                // returns true if one file/folder of the selection is in favorites
                var result =  _.some(e.context, function (element) {
                    var isFavorite = _.find(favorites, function (elemId) {
                        if (elemId === element.id) {
                            return true;
                        }
                    });
                    return isFavorite;
                });
                return result;
            }
            return false;
        },
        multiple: function (list, baton) {
            if (!Array.isArray(list) || !list.length) {
                if (baton.app) {
                    var model = folderAPI.pool.getModel(baton.app.folder.get());
                    list = [model.toJSON()];
                }
            }
            ox.load(['io.ox/files/actions/favorites']).done(function (action) {
                removeFromList(baton.app.myFavoriteListView, list);
                action.remove(list);
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

    // share dropdown
    new links.ActionLink('io.ox/files/links/toolbar/share', {
        index: 100,
        id: 'invite',
        label: gt('Invite people'),
        //#. sharing: a guest user will be created for the owner of that email address
        description: gt('Every recipient gets an individual link. Guests can also create and change files.'),
        ref: 'io.ox/files/actions/invite'
    });

    new links.ActionLink('io.ox/files/links/toolbar/share', {
        index: 200,
        id: 'getalink',
        label: gt('Create sharing link'),
        //#. sharing: a link will be created
        description: gt('Everybody gets the same link. The link just allows to view the file or folder.'),
        ref: 'io.ox/files/actions/getalink'
    });

    // INLINE (only used by mobile toolbar atm)
    var index = 100;

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'openviewer',
        index: index += 100,
        prio: 'hi',
        mobile: 'hi',
        label: gt('View'),
        ref: 'io.ox/files/actions/viewer'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'editor',
        index: index += 100,
        prio: 'hi',
        mobile: 'lo',
        label: gt('Edit'),
        ref: 'io.ox/files/actions/editor'
    }));

    // add another link for the viewer
    ext.point('io.ox/core/viewer/toolbar/links/drive').extend(new links.Link({
        id: 'editor',
        index: 110,
        prio: 'hi',
        mobile: 'lo',
        label: gt('Edit'),
        ref: 'io.ox/files/actions/editor',
        customize: function () {
            this.attr('role', 'button');
        }
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
        id: 'download-folder',
        prio: 'hi',
        mobile: 'lo',
        label: gt('Download'),
        ref: 'io.ox/files/actions/download-folder'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'delete',
        index: index += 100,
        prio: 'hi',
        mobile: 'lo',
        label: gt('Delete'),
        ref: 'io.ox/files/actions/delete'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'favorite-add',
        index: index += 100,
        prio: 'hi',
        mobile: 'lo',
        label: gt('Add to favorites'),
        ref: 'io.ox/files/favorites/add'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'favorite-remove',
        index: index += 100,
        prio: 'hi',
        mobile: 'lo',
        label: gt('Remove from favorites'),
        ref: 'io.ox/files/favorites/remove'
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
        id: 'add-to-portal',
        index: index += 100,
        prio: 'lo',
        mobile: 'none',
        label: gt('Add to portal'),
        ref: 'io.ox/files/actions/add-to-portal',
        section: 'share'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'invite',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Invite people'),
        ref: 'io.ox/files/actions/invite',
        section: 'share'
    }));

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'getalink',
        index: index += 100,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Create sharing link'),
        ref: 'io.ox/files/actions/getalink',
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

    //ext.point('io.ox/files/links/inline').extend(new links.Link({
    //    id: 'save-as-pdf',
    //    index: index += 100,
    //    prio: 'lo',
    //    mobile: 'lo',
    //    label: gt('Save as PDF'),
    //    ref: 'io.ox/files/actions/save-as-pdf',
    //    section: 'save-as'
    //}));

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
        prio: 'lo',
        mobile: 'lo',
        label: gt('Open'),
        ref: 'io.ox/files/actions/open'
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'editor',
        index: 150,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Edit'),
        section: 'edit',
        ref: 'io.ox/files/actions/editor'
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'download',
        index: 200,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Download'),
        ref: 'io.ox/files/actions/downloadversion'
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'makeCurrent',
        index: 250,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Make this the current version'),
        ref: 'io.ox/files/versions/actions/makeCurrent'
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'delete',
        index: 300,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Delete version'),
        section: 'delete',
        ref: 'io.ox/files/versions/actions/delete',
        special: 'danger'
    }));

    ext.point('io.ox/files/versions/links/inline').extend(new links.Link({
        id: 'deletePreviousVersions',
        index: 310,
        prio: 'lo',
        mobile: 'lo',
        label: gt('Delete all previous versions'),
        section: 'delete',
        ref: 'io.ox/files/versions/actions/deletePreviousVersions'
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
            }
            return gt('Drop here to upload a <b class="dndignore">new version</b>');
        },
        action: function (file, app) {
            require(['io.ox/files/upload/main'], function (fileUpload) {
                fileUpload.update.offer(file, { folder: app.folder.get() });
            });
        }
    });

    ext.point('io.ox/files/folderview/premium-area').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-premium-links',
        ref: 'io.ox/files/links/premium-links',
        classes: 'list-unstyled'
    }));

    ext.point('io.ox/files/links/premium-links').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'share-files',
        label: gt('Share your folders'),
        ref: 'io.ox/files/premium/actions/synchronize'
    }));
});
