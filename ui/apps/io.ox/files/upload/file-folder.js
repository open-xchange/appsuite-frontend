/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Siddhartha Chowdhury  <siddhartha.chowdhury@open-xchange.com>
 * @author Jonas Regier <jonas.regier@open-xchange.com>
 */

define('io.ox/files/upload/file-folder', [
    'io.ox/files/upload/main',
    'io.ox/files/api',
    'io.ox/core/folder/api'
], function (fileUpload, filesApi, folderApi) {

    'use strict';

    var fileFolderUpload = {};

    fileFolderUpload.upload = function (fileObjArray, app) {
        var folder = app.folder.get();
        var model = folderApi.pool.getModel(folder);
        var module = model.attributes.module;

        // ------------- Files creation [START] ------------
        function handleFilesUpload(updatedTreeArr, fileObjArray) {
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
                    var files = dirAndFilesObj[dirId];

                    if (files && files.length > 0) {
                        fileUpload.setWindowNode(app.getWindowNode());

                        fileUpload.create.offer(files, { folder: dirId });
                        // make sure every error and sucess from 'fileUpload.create.offer' triggers a stop
                        filesApi.once('stop:upload', function () {
                            // don't continue when the upload is not completed, because
                            // this means there is probably an upload problem (i.e. quota, error)
                            var uploadFinished = fileUpload.getTotalProgress() === 1;
                            if (uploadFinished) { triggerFileUpload(); }

                        });
                    } else { // without files in the folder try the next folder
                        triggerFileUpload();
                    }
                }
            };

            triggerFileUpload();
        }

        // ------------- Folders creation [START] ------------

        function createTreeObj(fileObjArray) {
            // a tree from fileObjArray
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

            // At this point the "tree" object holds the information about all files, their parent and respective
            // directory tree hierarchy
            return tree;
        }
        // Now iterate through tree object and create the folders
        function initiateDirCreation(tree) {
            var treeArr = Object.values(tree);
            var folderReady = $.Deferred();
            var updatedTreeArr = [];
            var getParentFolderId = function (info, updatedTreeArr) {
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
                                folderReady.resolve(updatedTreeArr);
                            }
                        }
                    } else {

                        folderApi.create(getParentFolderId(item, updatedTreeArr), { title: $.trim(item.name), module: module })
                            .then(
                                function (data) {
                                    item.id = data.id;
                                    newItemArr.push(item);

                                    if (itemArr.length !== 0) {
                                        triggerCreate();
                                    } else {
                                        updatedTreeArr.push(newItemArr);
                                        if (treeArr.length !== 0) {
                                            moveFromTreeArrToUpdatedTreeArr();
                                        } else {
                                            folderReady.resolve(updatedTreeArr);
                                            // Folders are all created
                                        }
                                    }
                                },
                                function (err) {
                                    return require(['io.ox/core/notifications']).then(function (notifications) {
                                        notifications.yell(err);
                                    });
                                }
                            );
                    }
                };

                if (itemArr && itemArr[0]) {
                    triggerCreate();
                }
            };

            if (treeArr && treeArr[0]) {
                moveFromTreeArrToUpdatedTreeArr();
            }

            return folderReady;
        }

        var newFiles = _.map(fileObjArray, function (item) { return _.pick(item, 'file').file; });

        fileUpload.create.validateFiles(newFiles, { folder: folder })
            .then(function () { return initiateDirCreation(createTreeObj(fileObjArray)); })
            .then(function (updatedTreeArr) { handleFilesUpload(updatedTreeArr, fileObjArray); });

    };

    return fileFolderUpload;

});
