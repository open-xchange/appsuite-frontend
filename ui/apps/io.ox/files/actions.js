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

define('io.ox/files/actions', [
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/core/api/user',
    'io.ox/files/share/api',
    'io.ox/files/util',
    'io.ox/core/api/filestorage',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/capabilities',
    'io.ox/files/actions/download',
    'settings!io.ox/files',
    'settings!io.ox/core',
    'gettext!io.ox/files',
    'io.ox/core/yell'
], function (folderAPI, api, userAPI, shareAPI, util, filestorageApi, ext, actionsUtil, capabilities, download, settings, coreSettings, gt, yell) {

    'use strict';

    var supportsComments = settings.get('features/comments', true),
        // used by text editor
        allowedFileExtensions = ['csv', 'txt', 'js', 'css', 'md', 'tmpl', 'html'];

    if (capabilities.has('guard')) {
        allowedFileExtensions.push('pgp');
    }

    function isTrash(baton) {
        var folderId, model;
        if (baton.app) {
            folderId = baton.app.folder.get();
        } else if (baton.folder_id !== undefined) {
            folderId = baton.folder_id;
        } else if (baton.data) {
            folderId = baton.data.folder_id;
        }
        model = folderAPI.pool.getModel(folderId);
        return model ? folderAPI.is('trash', model.toJSON()) : false;
    }

    function fromMailCompose(baton) {
        return baton.openedBy === 'io.ox/mail/compose';
    }

    function noVersionDeleteSupport(data) {
        return /^(owncloud|webdav|nextcloud)$/.test(data.folder_id.split(':')[0]);
    }

    function isCurrentVersion(baton) {
        // folder tree folder, always current version
        if (!baton.collection.has('some')) return true;
        // drive folder, always current version
        if (baton.collection.has('folders')) return true;
        // single selection
        if (baton.collection.has('one') && baton.first().current_version !== false) return true;
        // multi selection
        if (baton.collection.has('multiple') && baton.array().every(function (file) { return file.current_version !== false; })) return true;
        // default
        return false;
    }

    function isEmpty(baton) {
        return _.isEmpty(baton.data);
    }

    function hasStatus(type, baton) {
        return util.hasStatus(type, baton.array());
    }

    // check if it's not a 'description only' item
    function isFile(data) {
        return !_.isEmpty(data.filename) || data.file_size > 0;
    }

    function isDriveFile(data) {
        // locally added but not yet uploaded, 'description only' items
        if (data.group === 'localFile') return false;
        return isFile(data);
    }

    // check if this is a contact not a file, happens when contact is send as vcard
    function isContact(baton) {
        return _(baton.first()).has('internal_userid');
    }

    function createFilePickerAndUpload(baton, type) {
        var input;

        // yes, better let an error happen when no type is provided to notice it
        if (type === 'folder') { input = $('<input type="file" name="file" multiple directory webkitdirectory mozdirectory>'); }
        if (type === 'file') { input = $('<input type="file" name="file" multiple>'); }

        var elem = $(baton.e.target);

        // remove old input-tags resulting from 'add local file' -> 'cancel'
        elem.siblings('input').remove();

        elem.after(
            input
            .css('display', 'none')
            .on('change', function (e) {
                var app = baton.app;
                var fielList = baton.filter ? baton.filter(e.target.files) : e.target.files;
                var extendedFileList =  _.map(fielList, function (file) {
                    // normalize with drag&drop: for a file upload, the filepicker does not provide a path,
                    // in contrast to the more modern drag & drop behavior were a path is always provided
                    var normalizedPath = file.webkitRelativePath === '' ? String('/' + file.name) : file.webkitRelativePath;
                    return {
                        file: file,
                        fullPath: normalizedPath,
                        preventFileUpload: false
                    };
                });

                require(['io.ox/files/upload/file-folder'], function (fileFolderUpload) {
                    fileFolderUpload.upload(extendedFileList, app);
                });
                input.remove();
            })
        );

        input.trigger('click');
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
        // we might now yet have a reference to listView if the user has never been in favorites
        if (!listView) return;
        var cids = _.map(models, function (model) { return model.folder_id ? _.cid(model) : 'folder.' + model.id; }),
            selection = listView.selection;
        if (!_.intersection(cids, selection.get()).length) return;
        // set the direction for dodge function
        selection.getPosition();
        // save selected items before change the selection (dodge)
        var selectionItems = selection.getItems().filter('.selected');
        // change selection
        selection.dodge();
        // remove all DOM elements of previous selection
        _(selectionItems).invoke('remove');
    }

    var Action = actionsUtil.Action;

    new Action('io.ox/files/actions/upload', {
        folder: 'create',
        matches: function (baton) {
            // hide for virtual folders (other files root, public files root)
            if (_(['14', '15']).contains(baton.folder_id)) return false;
            if (isTrash(baton)) return false;
            return true;
        },
        action: function (baton) {
            createFilePickerAndUpload(baton, 'file');
        }
    });

    new Action('io.ox/files/actions/uploadFolder', {
        folder: 'create',
        matches: function (baton) {
            // hide for virtual folders (other files root, public files root)
            if (_(['14', '15']).contains(baton.folder_id)) return false;
            if (isTrash(baton)) return false;
            return true;
        },
        action: function (baton) {
            createFilePickerAndUpload(baton, 'folder');
        }
    });


    // TODO check action Mario
    new Action('io.ox/files/actions/editor', {
        toggle: !!window.Blob,
        collection: 'one && modify',
        matches: function (baton) {

            if (isTrash(baton)) return false;
            if (fromMailCompose(baton)) return false;
            if (hasStatus('lockedByOthers', baton)) return false;

            var file = baton.first();
            if (!file.folder_id || !file.id) return false;

            var model = _.first(baton.models),
                isEncrypted = model && model.isEncrypted(),
                encryptionPart = isEncrypted ? '\\.pgp' : '',
                // the pgp extension is added separately to the regex, remove it from the file extension list
                fileExtensions = _.without(allowedFileExtensions, 'pgp'),
                // build regex from list, pgp is added if guard is available
                regex = new RegExp('\\.(' + fileExtensions.join('|') + '?)' + encryptionPart + '$', 'i');

            if (!regex.test(file.filename)) return false;

            return api.versions.getCurrentState(file).then(function (currentVersion) {
                return currentVersion;
            });
        },
        action: function (baton) {

            var data = baton.first();

            var launch = function (params) {
                if (ox.ui.App.reuse('io.ox/editor:edit.' + _.cid(data))) {
                    // if this was opened from the viewer, close it now
                    if (baton.context && baton.context.viewerEvents) {
                        baton.context.viewerEvents.trigger('viewer:close');
                    }
                    return;
                }
                ox.launch('io.ox/editor/main', { folder: data.folder_id, id: data.id, params: _.extend({ allowedFileExtensions: allowedFileExtensions }, params) }).done(function () {
                    // if this was opened from the viewer, close it now
                    if (baton.context && baton.context.viewerEvents) {
                        baton.context.viewerEvents.trigger('viewer:close');
                    }
                });
            };

            // Check if Guard file.  If so, do auth then call with parameters
            // do not use endsWith because of IE11
            if (capabilities.has('guard') && ((data.meta && data.meta.Encrypted) || data.filename.toLowerCase().lastIndexOf('.pgp') === data.filename.length - 4)) {
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
    // TODO check action Mario
    new Action('io.ox/files/actions/editor-new', {
        toggle: !!window.Blob,
        folder: 'create',
        matches: function (baton) {
            // hide for virtual folders (other files root, public files root)
            if (_(['14', '15']).contains(baton.folder_id)) return false;
            if (isTrash(baton)) return false;
            // no new files in mail attachments
            if (fromMailCompose(baton)) return false;
            return true;
        },
        action: function (baton) {
            ox.launch('io.ox/editor/main').done(function () {
                this.create({ folder: baton.app.folder.get(), params: { allowedFileExtensions: allowedFileExtensions } });
            });
        }
    });
    // TODO check action Mario
    new Action('io.ox/files/actions/download', {
        // no download for older ios devices
        device: '!ios || ios >= 12',
        collection: 'some',
        matches: function (baton) {
            if (baton.collection.has('multiple')) return baton.array().every(isDriveFile);
            if (isContact(baton)) return false;
            return isDriveFile(baton.first());
        },
        action: function (baton) {
            download(baton.array().map(function (fileDescriptor) {
                var newElem = _.clone(fileDescriptor);
                newElem.version = undefined;
                return newElem;
            }));
        }
    });

    // TODO check action Mario
    new Action('io.ox/files/actions/download-folder', {
        // no download for older ios devices
        device: '!ios || ios >= 12',
        // single folders only
        collection: 'one && folders',
        matches: function (baton) {
            // disable for external storages
            return !filestorageApi.isExternal(baton.first());
        },
        action: function (baton) {
            require(['io.ox/files/api'], function (api) {
                api.zip(baton.first().id);
            });
        }
    });
    // TODO check action Mario
    new Action('io.ox/files/actions/downloadversion', {
        // no download for older ios devices
        device: '!ios || ios >= 12',
        matches: function (baton) {
            if (baton.collection.has('multiple')) return true;
            // 'description only' items
            return isFile(baton.first());
        },
        action: function (baton) {
            // loop over list, get full file object and trigger downloads
            require(['io.ox/core/download'], function (download) {
                _(baton.array()).each(function (o) {
                    download.file(o);
                });
            });
        }
    });
    // TODO check action Jonas
    new Action('io.ox/files/actions/permissions', {
        device: '!smartphone',
        collection: 'one',
        matches: function (baton) {
            // get proper id
            var data = baton.first(),
                id = baton.collection.has('folders') ? data.id : data.folder_id;
            return folderAPI.pool.getModel(id).isShareable();
        },
        action: function (baton) {
            require(['io.ox/files/share/permissions'], function (controller) {
                var model = baton.models[0], data = baton.first();
                if (model.isFile()) {
                    controller.showFilePermissions(data);
                } else {
                    controller.showFolderPermissions(data.id);
                }
            });
        }
    });

    // TODO check action Kristof
    new Action('io.ox/files/actions/send', {
        collection: 'some && items',
        matches: function (baton) {
            if (!capabilities.has('webmail')) return false;
            if (isEmpty(baton)) return false;
            if (fromMailCompose(baton)) return false;
            if (isTrash(baton)) return false;
            if (baton.isViewer && !isCurrentVersion(baton)) return false;
            return baton.array().reduce(function (memo, obj) {
                return memo || obj.file_size > 0;
            }, false);
        },
        action: function (baton) {
            var list = baton.array().filter(function (obj) { return obj.file_size !== 0; });
            if (list.length === 0) return;
            ox.registry.call('mail-compose', 'open', {
                attachments: list.map(function (file) {
                    return { origin: 'drive', id: file.id, folder_id: file.folder_id };
                })
            });
        }
    });
    // // TODO check action Jonas
    new Action('io.ox/files/actions/delete', {
        collection: 'some && delete',
        matches: function (baton) {
            if (fromMailCompose(baton)) return false;
            if (baton.standalone) return false;
            if (hasStatus('lockedByOthers', baton)) return false;
            if (baton.isViewer && !isCurrentVersion(baton)) return false;
            return true;
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/delete']).done(function (action) {
                var list = baton.array();
                if (!baton.models) {
                    api.pool.add(list);
                    baton.models = api.pool.resolve(list);
                }
                action(baton.models);
            });
        }
    });
    // TODO check action Mario
    new Action('io.ox/files/actions/viewer', {
        collection: 'some && items',
        matches: function (baton) {
            var file = baton.first();
            // don't open a new viewer instance within the viewer
            if (baton.isViewer) { return false; }
            // Spreadsheet supports display of current version only
            // versions may not be loaded when the action is not called from versions list, so check current_version for false
            if (file.current_version === false && api.isSpreadsheet(file)) { return false; }
            return !baton.collection.has('guard') || capabilities.has('guard');
        },
        action: function (baton) {
            ox.load(['io.ox/core/viewer/main']).done(function (Viewer) {
                var viewer = new Viewer(), selection = baton.array();
                if (selection.length > 1 || !baton.all) {
                    // only show selected files - the first one is automatically selected
                    // baton.all is not defined when opening from version dropdown
                    viewer.launch({ files: selection });
                } else {
                    viewer.launch({ selection: _(selection).first(), files: baton.all.models });
                }
            });
        }
    });

    // drive action for double-click or enter in files
    // TODO check action Mario
    new Action('io.ox/files/actions/default', {
        action: function (baton) {
            actionsUtil.invoke('io.ox/files/actions/viewer', baton);
        }
    });

    // TODO check action Jonas
    new Action('io.ox/files/actions/lock', {
        capabilities: '!alone',
        device: '!smartphone',
        collection: 'some && modify && items',
        matches: function (baton) {
            if (isTrash(baton)) return false;
            if (fromMailCompose(baton)) return false;
            if (isEmpty(baton)) return false;
            if (!hasStatus('!locked', baton)) return false;
            return lockMatches(baton);
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/lock-unlock']).done(function (action) {
                action.lock(baton.array());
            });
        }
    });
    // TODO check action Jonas
    new Action('io.ox/files/actions/unlock', {
        capabilities: '!alone',
        device: '!smartphone',
        collection: 'some && modify && items',
        matches: function (baton) {
            if (isTrash(baton)) return false;
            if (isEmpty(baton)) return false;
            if (fromMailCompose(baton)) return false;
            if (!hasStatus('locked', baton)) return false;
            if (!hasStatus('lockedByMe', baton) && !hasStatus('createdByMe', baton)) return false;
            return lockMatches(baton);
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/lock-unlock']).done(function (action) {
                action.unlock(baton.array());
            });
        }
    });

    function lockMatches(baton) {
        var folder_id = _.first(baton.models).get('folder_id');
        return folderAPI.get(folder_id).then(function (fileModel) {
            return !folderAPI.isExternalFileStorage(fileModel);
        });
    }

    // TODO check action Kristof
    new Action('io.ox/files/actions/add-to-portal', {
        capabilities: 'portal',
        collection: 'one && items',
        matches: function (baton) {
            if (isEmpty(baton)) return false;
            if (isTrash(baton)) return false;
            if (isContact(baton)) return false;
            if (baton.isViewer && !isCurrentVersion(baton)) return false;
            return true;
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/add-to-portal']).done(function (action) {
                action(baton.first());
            });
        }
    });

    function hasObjectWritePermissions(data) {
        var array = data.object_permissions || data['com.openexchange.share.extendedObjectPermissions'],
            myself = _(array).findWhere({ entity: ox.user_id });
        // check if there is a permission for a group, the user is a member of
        // use max permissions available
        if ((!myself || (myself && myself.bits < 2)) && _(array).findWhere({ group: true })) {
            return userAPI.get().then(
                function (userData) {
                    myself = _(array).findWhere({ entity: _(_.pluck(array, 'entity')).intersection(userData.groups)[0] });
                    return !!(myself && (myself.bits >= 2));
                },
                function () { return false; }
            );
        }
        return $.when(!!(myself && (myself.bits >= 2)));
    }
    // TODO check action Jonas
    new Action('io.ox/files/actions/rename', {
        collection: 'one',
        matches: function (baton) {
            if (isTrash(baton)) return false;
            if (hasStatus('lockedByOthers', baton)) return false;
            if (fromMailCompose(baton)) return false;
            if (baton.isViewer && !isCurrentVersion(baton)) return false;
            // shortcuts
            if (baton.collection.has('folders')) return baton.collection.has('rename:folder');
            if (baton.collection.has('modify')) return true;
            // this is async
            return hasObjectWritePermissions(baton.first());
        },
        action: function (baton) {
            var data = baton.first();
            // if this is a folder use the folder rename action
            if (data.folder_id === 'folder') {
                ox.load(['io.ox/core/folder/actions/rename']).done(function (action) {
                    action(data.id);
                });
            } else {
                // files use the file rename action
                ox.load(['io.ox/files/actions/rename']).done(function (action) {
                    action(data);
                });
            }
        }
    });
    // TODO check action Mario
    new Action('io.ox/files/actions/save-as-pdf', {
        // bug 54493: no "Save as PDF" for anonymous guests (same solution as in bug 42621)
        capabilities: 'document_preview && !guest && !anonymous',
        collection: 'one && items',
        matches: function (baton) {
            if (isTrash(baton)) return false;
            if (baton.originFavorites) return false;
            if (fromMailCompose(baton)) return false;
            var model = baton.models[0];
            // preferred variant over >> return (model.isFile() && !model.isPDF()); <<
            return model.isFile() && (model.isOffice() || model.isText());
        },
        action: function (baton) {
            // files use the file rename action
            ox.load(['io.ox/files/actions/save-as-pdf']).done(function (action) {
                action(baton);
            });
        }
    });
    // TODO check action Jonas
    new Action('io.ox/files/actions/edit-description', {
        collection: 'one && items',
        matches: function (baton) {
            if (isTrash(baton)) return false;
            if (fromMailCompose(baton)) return false;
            if (hasStatus('lockedByOthers', baton)) return false;
            if (!folderAPI.pool.getModel(baton.first().folder_id).supports('extended_metadata')) return false;
            if (baton.isViewer && !isCurrentVersion(baton)) return false;
            if (baton.collection.has('modify')) return true;
            return hasObjectWritePermissions(baton.first());
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/edit-description']).done(function (action) {
                // initially the description in not in the reduced data in the pool that is used here, get the fileModel
                api.get(baton.first()).done(function (fileModel) {
                    action(fileModel);
                });
            });
        }
    });

    // Tested: No
    // TODO check action Mario
    new Action('io.ox/files/actions/upload-new-version', {
        toggle: supportsComments,
        collection: 'one && modify && items',
        matches: function (baton) {
            if (fromMailCompose(baton)) return false;
            if (hasStatus('lockedByOthers', baton)) return false;
            var data = baton.first(),
                model = folderAPI.pool.getModel(data.folder_id);
            return model && model.can('add:version');
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/upload-new-version']).done(function (action) {
                action(baton.first());
            });
        }
    });

    // Action to restore a list of files and folders
    // TODO check action Kristof
    new Action('io.ox/files/actions/restore', {
        collection: 'some',
        matches: function (baton) {
            if (isEmpty(baton)) return false;
            var trashFolderId = String(settings.get('folder/trash'));
            return baton.array().every(function (element) {
                // folderId where the item is located
                var folderId = element.folder_id;
                if ((/^folder\./).test(baton.first().cid)) {
                    // the folderId is the id of the parent folder if the item is a folder
                    var folderModel = folderAPI.pool.getModel(baton.first().id);
                    folderId = folderModel.get('folder_id');
                }
                // is an item is not located in the trash, disable the action
                return trashFolderId === folderId;
            });
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/restore']).done(function (action) {
                var models = [];
                _.each(baton.array(), function (element) {
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
    // TODO check action Jonas
    function moveAndCopy(type, label, success) {
        new Action('io.ox/files/actions/' + type, {
            // anonymous guests just have one folder so no valid target folder (see bug 42621)
            capabilities: '!guest && !anonymous',
            // different collection checks for move and copy
            collection: (type === 'move' ? 'some && delete' : 'some && items && read'),
            matches: function (baton) {
                if (fromMailCompose(baton)) return false;
                if (type === 'move' && baton.originFavorites) return false;
                if (hasStatus('lockedByOthers', baton)) return false;
                return true;
            },
            action: function (baton) {
                ox.load(['io.ox/files/actions/move-copy']).done(function (action) {
                    var list = baton.array();
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
                                                var folder_id = baton.first().folder_id;
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
    function isShareable(type, baton) {
        var id;
        // not possible for multi-selection
        if (baton.collection.has('multiple')) return false;
        if (isContact(baton)) return false;
        if (baton.isViewer && !isCurrentVersion(baton)) return false;
        // get folder id
        if (baton.collection.has('one')) {
            var data = baton.first();
            id = baton.collection.has('folders') ? data.id : data.folder_id;
        } else if (baton.app) {
            // use current folder
            id = baton.app.folder.get();
        }
        if (!id) return false;
        // general capability and folder check
        var model = folderAPI.pool.getModel(id);
        if (!model.isShareable()) return false;
        if (model.is('trash')) return false;
        return type === 'invite' ? model.supportsInviteGuests() : true;
    }

    // Action for the editShare Dialog. Detects if the link or invitiation dialog is opened.
    // TODO check action Kristof
    new Action('io.ox/files/actions/editShare', {
        matches: function (baton) {
            if (!baton.app) return false;
            if (!baton.app.mysharesListView) return false;
            if (!baton.app.mysharesListView.$el) return false;
            // we must check the real selection because in myShares we could have two items for one model
            return baton.app.mysharesListView.selection.get().length === 1;
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
    // TODO check action Kristof
    new Action('io.ox/files/actions/invite', {
        capabilities: 'invite_guests',
        collection: '!multiple',
        matches: function (baton) {
            return isShareable('invite', baton);
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
    // TODO check action Kristof
    new Action('io.ox/files/actions/getalink', {
        capabilities: 'share_links',
        collection: '!multiple',
        matches: function (baton) {
            return isShareable('link', baton);
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
    // TODO check action Kristof
    new Action('io.ox/files/share/revoke', {
        matches: function (baton) {
            if (!baton.app) return false;
            if (!baton.app.mysharesListView) return false;
            if (!baton.app.mysharesListView.$el) return false;
            // we must check the real selection because in myShares we could have two items for one model
            return baton.app.mysharesListView.selection.get().length === 1;
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
    // TODO check action Mario
    new Action('io.ox/files/versions/actions/makeCurrent', {
        collection: 'one && items && modify',
        matches: function (baton) {
            if (fromMailCompose(baton)) return false;
            var data = baton.first();
            if (data.current_version) return false;
            return true;
        },
        action: function (baton) {
            api.versions.setCurrent(baton.first());
        }
    });

    new Action('io.ox/files/versions/actions/deletePreviousVersions', {
        collection: 'one && items && modify',
        matches: function (baton) {
            if (noVersionDeleteSupport(baton.data)) return false;
            if (baton.latestVersion) return false;
            if (fromMailCompose(baton)) return false;
            return true;
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/delete-previous-versions']).done(function (action) {
                action(baton.first());
            });
        }
    });

    // TODO check action Mario
    new Action('io.ox/files/versions/actions/delete', {
        collection: 'one && items && delete',
        matches: function (baton) {
            if (fromMailCompose(baton)) return false;
            if (noVersionDeleteSupport(baton.data)) return false;
            return true;
        },
        action: function (baton) {
            ox.load(['io.ox/files/actions/versions-delete']).done(function (action) {
                action(baton.first());
            });
        }
    });

    // Add new folder
    // TODO check action Jonas
    new Action('io.ox/files/actions/add-folder', {
        matches: function (baton) {
            var model = folderAPI.pool.getModel(baton.app.folder.get());
            return folderAPI.can('create:folder', model.toJSON()) && !folderAPI.is('trash', model.toJSON());
        },
        action: function (baton) {
            var id = baton.app.folder.get(), model = folderAPI.pool.getModel(id);
            ox.load(['io.ox/core/folder/actions/add']).done(function (add) {
                add(id, { module: model.get('module') });
            });
        }
    });

    // Tested: No
    // TODO check action Jonas
    new Action('io.ox/files/premium/actions/synchronize', {
        capabilities: 'boxcom || google || microsoftgraph',
        matches: function () {
            // use client onboarding here, since it is a setting and not a capability
            return capabilities.has('client-onboarding');
        },
        action: function () {
            require(['io.ox/onboarding/clients/wizard'], function (wizard) {
                wizard.run();
            });
        }
    });

    // Tested: No
    // Action to switch to the folder of a file
    // TODO check action Kristof
    new Action('io.ox/files/actions/show-in-folder', {
        device: '!smartphone',
        collection: 'one',
        matches: function (baton) {
            if (!baton.originFavorites && !baton.originMyShares && !baton.portal) return false;
            var data = baton.first(),
                id = baton.collection.has('folders') ? data.id : data.folder_id,
                model = folderAPI.pool.getModel(id);
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
    // TODO check action Kristof
    new Action('io.ox/files/actions/favorites/add', {
        capabilities: '!guest && !anonymous',
        matches: function (baton) {

            if (isTrash(baton)) return false;
            if (baton.originFavorites) return false;
            if (baton.isViewer && !isCurrentVersion(baton)) return false;

            var favoritesFolder = coreSettings.get('favorites/infostore', []),
                favoriteFiles = coreSettings.get('favoriteFiles/infostore', []),
                allFavoriteIds = [].concat(favoritesFolder, _(favoriteFiles).pluck('id'));

            // check whether all selected items can be added to favorites
            var disabled = getSelectionOrTopFolder(baton).some(function (element) {
                // check that we don't have a local file (upload file in mailcompose, view the file -> we have a local file)
                if (element.space) return true;
                if (element.group === 'localFile') return true;
                if (folderAPI.is('trash', element)) return true;
                // virtual folder
                if (element.id === null) return true;
                return _(allFavoriteIds).contains(element.id);
            });

            return !disabled;
        },
        action: function (baton) {
            var list = markFoldersAsFolder(getSelectionOrTopFolder(baton));
            ox.load(['io.ox/files/actions/favorites']).done(function (action) {
                action.add(list);
            });
        }
    });

    function getSelectionOrTopFolder(baton) {
        var list = baton.array();
        if (_.isEmpty(list)) list = [{ id: baton.app.folder.get(), folder_id: 'folder' }];
        return list;
    }

    function markFoldersAsFolder(list) {
        return list.map(function (item) {
            return 'folder_name' in item ? _.extend({}, item, { folder_id: 'folder' }) : item;
        });
    }

    // Action to remove files/folders to favorites
    // TODO check action Kristof
    new Action('io.ox/files/actions/favorites/remove', {
        capabilities: '!guest && !anonymous',
        matches: function (baton) {
            if (baton.isViewer && !isCurrentVersion(baton)) return false;

            var favoritesFolder = coreSettings.get('favorites/infostore', []),
                favoriteFiles = coreSettings.get('favoriteFiles/infostore', []),
                allFavoriteIds = [].concat(favoritesFolder, _(favoriteFiles).pluck('id'));

            // returns true if one file/folder of the selection is in favorites
            return getSelectionOrTopFolder(baton).some(function (element) {
                return _(allFavoriteIds).contains(element.id);
            });
        },
        action: function (baton) {
            var list = markFoldersAsFolder(getSelectionOrTopFolder(baton));
            ox.load(['io.ox/files/actions/favorites']).done(function (action) {
                if (baton.app && baton.app.myFavoriteListView) {
                    removeFromList(baton.app.myFavoriteListView, list);
                }
                action.remove(list);
            });
        }
    });
    // TODO check action Kristof
    new Action('io.ox/files/favorite/back', {
        toggle: _.device('smartphone'),
        matches: function (baton) {
            return baton.originFavorites;
        },
        action: function () {
            $('[data-page-id="io.ox/files/main"]').trigger('myfavorites-folder-back');
        }
    });

    // view menu 'Layout' options' as actions
    new Action('io.ox/files/actions/layout-list', {
        action: function (baton) {
            baton.app.props.set('layout', 'list');
        }
    });

    new Action('io.ox/files/actions/layout-icon', {
        action: function (baton) {
            baton.app.props.set('layout', 'icon');
        }
    });

    new Action('io.ox/files/actions/layout-tile', {
        action: function (baton) {
            baton.app.props.set('layout', 'tile');
        }
    });

    // view menu  'Options' as actions
    new Action('io.ox/files/actions/view-checkboxes', {
        action: function (baton) {
            var value = 'checkboxes';
            var newValue = !baton.app.props.get(value);
            baton.app.props.set(value, newValue);
        }
    });

    new Action('io.ox/files/actions/view-folderview', {
        action: function (baton) {
            var value = 'folderview';
            var newValue = !baton.app.props.get(value);
            baton.app.props.set(value, newValue);
        }
    });

    new Action('io.ox/files/actions/view-details', {
        action: function (baton) {
            var value = 'details';
            var newValue = !baton.app.props.get(value);
            baton.app.props.set(value, newValue);
        }
    });

    // 'new' dropdown
    ext.point('io.ox/files/toolbar/new').extend(
        {
            index: 100,
            id: 'upload',
            title: gt('Upload files'),
            ref: 'io.ox/files/actions/upload',
            section: 'upload'
        },
        {
            index: 105,
            id: 'uploadFolder',
            title: gt('Upload folder'),
            ref: 'io.ox/files/actions/uploadFolder',
            section: 'upload'
        },
        {
            index: 200,
            id: 'note',
            title:
                //#. Please translate like "take a note", "Notiz" in German, for example.
                //#. more like "to notice" than "to notify".
                gt('Add note'),
            ref: 'io.ox/files/actions/editor-new',
            section: 'add'
        },
        {
            index: 300,
            id: 'add-folder',
            title: gt('Add new folder'),
            ref: 'io.ox/files/actions/add-folder',
            section: 'add'
        }
    );

    // share dropdown
    ext.point('io.ox/files/toolbar/share').extend(
        {
            index: 100,
            id: 'invite',
            title: gt('Invite people'),
            //#. sharing: a guest user will be created for the owner of that email address
            caption: gt('Every recipient gets an individual link. Guests can also create and change files.'),
            section: 'invite',
            ref: 'io.ox/files/actions/invite'
        },
        {
            index: 200,
            id: 'getalink',
            title: gt('Create sharing link'),
            //#. sharing: a link will be created
            caption: gt('Everybody gets the same link. The link just allows to view the file or folder.'),
            section: 'link',
            ref: 'io.ox/files/actions/getalink'
        }
    );

    // inline links
    var inlineLinks = [
        {
            id: 'openviewer',
            prio: 'hi',
            mobile: 'hi',
            //#. used as a verb here. label of a button to view files
            title: gt('View'),
            ref: 'io.ox/files/actions/viewer'
        },
        {
            id: 'editor',
            prio: 'hi',
            mobile: 'lo',
            title: gt('Edit'),
            ref: 'io.ox/files/actions/editor'
        },
        {
            id: 'download',
            prio: 'hi',
            mobile: 'hi',
            title: gt('Download'),
            icon: 'fa fa-download',
            ref: 'io.ox/files/actions/download'
        },
        {
            id: 'download-folder',
            prio: 'hi',
            mobile: 'lo',
            title: gt('Download'),
            ref: 'io.ox/files/actions/download-folder'
        },
        {
            id: 'delete',
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa fa-trash-o',
            title: gt('Delete'),
            ref: 'io.ox/files/actions/delete'
        },
        {
            id: 'favorite-add',
            prio: 'hi',
            mobile: 'lo',
            title: gt('Add to favorites'),
            ref: 'io.ox/files/actions/favorites/add'
        },
        {
            id: 'favorite-remove',
            prio: 'hi',
            mobile: 'lo',
            title: gt('Remove from favorites'),
            ref: 'io.ox/files/actions/favorites/remove'
        },
        {
            id: 'add-to-portal',
            prio: 'lo',
            mobile: 'none',
            title: gt('Add to portal'),
            ref: 'io.ox/files/actions/add-to-portal',
            section: 'share'
        },
        {
            id: 'send',
            prio: 'lo',
            mobile: 'hi',
            icon: _.device('smartphone') ? 'fa fa-envelope-o' : '',
            title: gt('Send by email'),
            ref: 'io.ox/files/actions/send',
            section: 'share'
        },
        {
            id: 'invite',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Invite people'),
            ref: 'io.ox/files/actions/invite',
            section: 'share'
        },
        {
            id: 'getalink',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Create sharing link'),
            ref: 'io.ox/files/actions/getalink',
            section: 'share'
        },
        {
            id: 'rename',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Rename'),
            ref: 'io.ox/files/actions/rename',
            section: 'edit'
        },
        {
            id: 'edit-description',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Edit description'),
            ref: 'io.ox/files/actions/edit-description',
            section: 'edit'
        },
        {
            id: 'move',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Move'),
            ref: 'io.ox/files/actions/move',
            section: 'file-op'
        },
        {
            id: 'copy',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Copy'),
            ref: 'io.ox/files/actions/copy',
            section: 'file-op'
        },
        {
            id: 'lock',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Lock'),
            ref: 'io.ox/files/actions/lock',
            section: 'file-op'
        },
        {
            id: 'unlock',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Unlock'),
            ref: 'io.ox/files/actions/unlock',
            section: 'file-op'
        },
        {
            id: 'restore',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Restore'),
            ref: 'io.ox/files/actions/restore',
            section: 'file-op'
        }
    ];

    ext.point('io.ox/files/links/inline').extend(
        inlineLinks.map(function (extension, index) {
            extension.index = 100 + index * 100;
            return extension;
        })
    );

    // version links

    // current version
    ext.point('io.ox/files/versions/links/inline/current').extend(
        {
            id: 'view',
            index: 100,
            prio: 'lo',
            mobile: 'lo',
            //#. used as a verb here. label of a button to view files
            title: gt('View'),
            ref: 'io.ox/files/actions/viewer',
            section: 'view'
        },
        {
            id: 'editor',
            index: 150,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Edit'),
            ref: 'io.ox/files/actions/editor',
            section: 'edit'
        },
        {
            id: 'download',
            index: 200,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Download'),
            ref: 'io.ox/files/actions/downloadversion',
            section: 'edit'
        },
        {
            id: 'delete',
            index: 300,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Delete version'),
            ref: 'io.ox/files/versions/actions/delete',
            section: 'delete'
        },
        {
            id: 'deletePreviousVersions',
            index: 310,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Delete all previous versions'),
            ref: 'io.ox/files/versions/actions/deletePreviousVersions',
            section: 'delete'
        }
    );

    // older versions
    ext.point('io.ox/files/versions/links/inline/older').extend(
        {
            id: 'view',
            index: 100,
            prio: 'lo',
            mobile: 'lo',
            //#. used as a verb here. label of a button to view files
            title: gt('View'),
            ref: 'io.ox/files/actions/viewer',
            section: 'view'
        },
        {
            id: 'download',
            index: 200,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Download'),
            ref: 'io.ox/files/actions/downloadversion',
            section: 'edit'
        },
        {
            id: 'makeCurrent',
            index: 250,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Make this the current version'),
            ref: 'io.ox/files/versions/actions/makeCurrent',
            section: 'edit'
        },
        {
            id: 'delete',
            index: 300,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Delete version'),
            ref: 'io.ox/files/versions/actions/delete',
            section: 'delete'
        },
        {
            id: 'deletePreviousVersions',
            index: 310,
            prio: 'lo',
            mobile: 'lo',
            title: gt('Delete all previous versions'),
            ref: 'io.ox/files/versions/actions/deletePreviousVersions',
            section: 'delete'
        }
    );

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

    ext.point('io.ox/files/folderview/premium-area').extend({
        index: 100,
        id: 'inline-premium-links',
        draw: function (baton) {
            this.append(
                baton.renderActions('io.ox/files/links/premium-links', baton)
            );
        }
    });

    ext.point('io.ox/files/links/premium-links').extend({
        index: 100,
        id: 'share-files',
        action: 'io.ox/files/premium/actions/synchronize',
        title: gt('Share your folders')
    });
});
