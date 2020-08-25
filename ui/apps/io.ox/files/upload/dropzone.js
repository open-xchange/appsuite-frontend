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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/files/upload/dropzone', [
    'io.ox/core/extensions',
    'io.ox/core/dropzone',
    'io.ox/core/folder/api',
    'io.ox/files/upload/main',
    'io.ox/files/api',
    'gettext!io.ox/files'
], function (ext, dropzone, api, fileUpload, filesApi, gt) {

    'use strict';

    ext.point('io.ox/files/dropzone').extend({
        id: 'default',
        index: 100,
        getDropZones: function (baton) {
            var app = baton.app,
                zone = new dropzone.Inplace({
                    caption: gt('Drop files here to upload')
                });

            zone.on({
                'show': function () {
                    app.listView.$el.stop().hide();
                },
                'hide': function () {
                    app.listView.$el.fadeIn('fast');
                },
                'drop': function (fileObjArray) {
                    var folder = app.folder.get();

                    // ------------- Files creation [START] ------------
                    var handleFilesUpload = function (updatedTreeArr, fileObjArray) {
                        var dirAndFilesObj = {};
                        dirAndFilesObj[folder] = [];

                        fileObjArray.forEach(function (entryObj) {
                            if (!entryObj.preventFileUpload) {
                                var file = entryObj.file;
                                var fullPath = entryObj.fullPath;

                                if (fullPath[0] === '/') {
                                    fullPath = fullPath.substring(1);
                                }

                                var pathSplit = fullPath.split('/');
                                pathSplit.pop();
                                var parentName = pathSplit.length > 0 ? pathSplit[(pathSplit.length - 1)] : null;
                                var parentIndex = parentName ? (pathSplit.length - 1) : null;

                                if (parentIndex === null) {
                                    dirAndFilesObj[folder].push(file);
                                } else {
                                    updatedTreeArr[parentIndex].forEach(function (entry) {
                                        if (!entry.isFile && entry.name === parentName) {

                                            if (!dirAndFilesObj[entry.id]) {
                                                dirAndFilesObj[entry.id] = [];
                                            }

                                            dirAndFilesObj[entry.id].push(file);
                                        }
                                    });
                                }
                            }
                        });

                        var folderIdArr = Object.keys(dirAndFilesObj);
                        var triggerFileUpload = function () {
                            if (folderIdArr.length > 0) {
                                var dirId = folderIdArr.shift();

                                if (dirAndFilesObj[dirId]) {
                                    var files = dirAndFilesObj[dirId];
                                    fileUpload.setWindowNode(app.getWindowNode());
                                    fileUpload.create.offer(files, { folder: dirId });

                                    filesApi.on('stop:upload', function () {
                                        triggerFileUpload();
                                    });
                                }
                            }
                        };

                        triggerFileUpload();
                    };

                    // ------------- Folders creation [START] ------------
                    var model = api.pool.getModel(folder);
                    var module = model.attributes.module;
                    var folderReady = new $.Deferred();

                    // Prepare tree object to create the required directories
                    var tree = {};
                    var isDirExist = function (index, info) {
                        var targetArr = tree[index.toString()];
                        return targetArr.find(function (item) {
                            return (item.name === info.name && item.parentIndex === info.parentIndex && item.isFile === info.isFile);
                        });
                    };

                    fileObjArray.forEach(function (obj) {
                        var fp = obj.fullPath;

                        if (fp[0] === '/') {
                            fp = fp.substring(1);
                        }

                        var fpSplit = fp.split('/');
                        fpSplit.forEach(function (dir, index) {

                            var info = {
                                isFile: !fpSplit[(index + 1)],
                                parentIndex: index === 0 ? null : (index - 1),
                                parentName: index === 0 ? null : fpSplit[(index - 1)],
                                name: fpSplit[index],
                                index: index,
                                id: null
                            };

                            if (tree[index.toString()]) {
                                if (!isDirExist(index, info)) {
                                    tree[index.toString()].push(info);
                                }
                            } else {
                                tree[index.toString()] = [info];
                            }
                        });
                    });

                    // At this  point the "tree" object holds the information about all files, their parent and respective
                    // directory tree hierarchy

                    // Now iterate through tree object and punch in the folders
                    var treeArr = Object.values(tree);
                    var updatedTreeArr = [];

                    var getParentFolderId = function (info) {
                        if (info.parentIndex === null) {
                            return folder;
                        }

                        var group = updatedTreeArr[info.parentIndex];
                        if (!group) { return folder; }

                        var item = group.find(function (item) {
                            return item.name === info.parentName && item.isFile === false;
                        });

                        if (item) {
                            return item.id;
                        }

                        return folder;
                    };

                    var initiateDirCreation = function () {
                        var moveFromTreeArrToUpdatedTreeArr = function () {
                            var itemArr = treeArr.shift();
                            var newItemArr = [];

                            var triggerCreate = function () {
                                var item = itemArr.shift();

                                if (item.isFile) {
                                    newItemArr.push(item);

                                    if (itemArr.length !== 0) {
                                        triggerCreate();
                                    } else {
                                        updatedTreeArr.push(newItemArr);
                                        if (treeArr.length !== 0) {
                                            moveFromTreeArrToUpdatedTreeArr();
                                        } else {
                                            // Folders are all created
                                            folderReady.resolve();
                                        }
                                    }
                                } else {

                                    api.create(getParentFolderId(item), { title: $.trim(item.name), module: module })
                                        .then(function (data) {
                                            item.id = data.id;
                                            newItemArr.push(item);

                                            if (itemArr.length !== 0) {
                                                triggerCreate();
                                            } else {
                                                updatedTreeArr.push(newItemArr);
                                                if (treeArr.length !== 0) {
                                                    moveFromTreeArrToUpdatedTreeArr();
                                                } else {
                                                    folderReady.resolve();
                                                    // Folders are all created
                                                }
                                            }
                                        });
                                }
                            };

                            if (itemArr && itemArr[0]) {
                                triggerCreate();
                            }
                        };

                        if (treeArr && treeArr[0]) {
                            moveFromTreeArrToUpdatedTreeArr();
                        }
                    };

                    initiateDirCreation();

                    folderReady.then(function () {
                        handleFilesUpload(updatedTreeArr, fileObjArray);
                    });
                }
            });

            baton.dropZones.push(zone);
        }
    });

    ext.point('io.ox/files/mediator').extend({
        id: 'files-dropzone',
        index: 1000000000000,
        setup: function (app) {

            // desktop only
            if (!_.device('desktop')) return;

            var baton = new ext.Baton({
                app: app,
                dropZones: []
            });
            ext.point('io.ox/files/dropzone').invoke('getDropZones', this, baton);

            var size = 100 / baton.dropZones.length;
            app.getWindowNode().find('.list-view-control').append(
                baton.dropZones.map(function (zone, index) {
                    // check folder grants first
                    if (!_.isFunction(zone.isEnabled)) {
                        zone.isEnabled = function () {
                            var id = app.folder.get();
                            var model = api.pool.getModel(id);
                            var isTrash = model ? api.is('trash', model.toJSON()) : false;

                            if (isTrash) {
                                return false;
                            }

                            return model.can('create');

                        };
                    }

                    return zone.render().$el
                        .addClass('abs')
                        .css({
                            top: index * size + '%',
                            height: size + '%'
                        });
                })
            );
        }
    });
});
