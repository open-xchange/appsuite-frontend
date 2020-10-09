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

    function handleFilesUpload(updatedTreeArr, rootFolder, app) {
        var sortedByFolderObj = {};

        // link all files in the tree with their folder id
        updatedTreeArr.forEach(function (treelayer, layerIndex) {
            treelayer.forEach(function (item) {
                if (!item.isFile || item.preventFileUpload) { return; }
                var itemFolderId;
                if (layerIndex === 0) { // is root
                    itemFolderId = rootFolder;
                } else {
                    var parentFolderOfItem = updatedTreeArr[layerIndex - 1].find(function (parent) { return parent.isFile === false && item.parentPath === parent.path; });
                    itemFolderId = parentFolderOfItem.id;
                }

                if (!sortedByFolderObj[itemFolderId]) { sortedByFolderObj[itemFolderId] = []; }
                sortedByFolderObj[itemFolderId].push(item.file);
            });
        });

        // push files folderwise to upload queue
        _.each(sortedByFolderObj, function (files, folderId) {
            fileUpload.setWindowNode(app.getWindowNode());

            // fill the upload queue before the upload starts to have the right number of files at start
            // note: compared to 'offer', 'fillQueue' does no validation, this one in 'fileFolderUpload.upload'
            fileUpload.create.fillQueue(files, { folder: folderId, uploadfolderInfo: { folderName: '', foldersLeft: '' } });
        });
        // start the upload with the filled queue
        fileUpload.create.queueChanged();
    }

    function createTreeObj(fileObjArray) {
        // a tree from fileObjArray
        var tree = {};
        var dirExistCheck = function (info, targetArr) {
            if (info.isFile) { return false; }
            return targetArr.find(function (item) {
                return item.isFile === false && info.isFile === false && item.path === info.path && item.parentIndex === info.parentIndex;
            });
        };

        fileObjArray.forEach(function (obj) {
            var fp = obj.fullPath;

            if (fp[0] === '/') {
                fp = fp.substring(1);
            }

            var fpSplit = fp.split('/');
            fpSplit.forEach(function (dir, index) { // go though each path segment
                var isFile = obj.isEmptyFolder ? false : !fpSplit[(index + 1)];
                var info = {
                    isFile: isFile,
                    parentIndex: index === 0 ? null : (index - 1),
                    parentName: index === 0 ? null : fpSplit[(index - 1)],
                    name: fpSplit[index],
                    index: index,
                    id: null,
                    file: isFile ? obj.file : null,
                    path: _.first(fpSplit, index + 1).join('/'),
                    parentPath: index === 0 ? null : _.first(fpSplit, index).join('/'),
                    preventFileUpload: obj.preventFileUpload
                };
                if (tree[index.toString()]) {
                    if (!dirExistCheck(info, tree[index.toString()])) {
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

    // Iterate through tree object and create the folders
    function initiateDirCreation(tree, folder, module) {
        var treeArr = Object.values(tree);
        var folderReady = $.Deferred();
        var updatedTreeArr = [];
        var getParentFolderId = function (info, updatedTreeArr) {
            if (info.parentIndex === null) {
                return folder;
            }

            var parentGroup = updatedTreeArr[info.parentIndex];
            if (!parentGroup) { return folder; }

            var parent = parentGroup.find(function (parentItem) { // find parent info item
                return parentItem.isFile === false && parentItem.path === info.parentPath;
            });

            if (parent) {
                return parent.id;
            }

            return folder;
        };

        var moveFromTreeArrToUpdatedTreeArr = function () {
            var itemArr = treeArr.shift();
            var newItemArr = [];

            var triggerCreate = function () {
                var item = itemArr.shift();
                // FILE
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
                // FOLDER
                    folderApi.create(getParentFolderId(item, updatedTreeArr), { title: $.trim(item.name), module: module })
                        .then(
                            function (data) {
                                item.id = data.id; // update with real folder id
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

    /**
    * Creates a folder structure and uploads all containing files after that.
    *
    * Pitfalls:
    * - The file picker and drag & drop provide different data structures.
    *   Make sure to normalize the 'fullPath' to the drag&drop behavior.
    *   Consider single file upload and folder upload via filepicker.
    *
    * @param fileObjArray
    *   An object with the following structure:
    *        file: {}|fileObject (empty object for folders, for 'fileObject' see https://developer.mozilla.org/en-US/docs/Web/API/File)
    *        fullPath: String (a valid path must be set, also for file upload, compare to https://wicg.github.io/entries-api/#api-entry)
    *        preventFileUpload: true|false (whether the file should be uploaded later)
    *        isEmptyFolder: true|false
    *
    * @param app
    *  The used app.
    */
    fileFolderUpload.upload = function (fileObjArray, app) {
        var folder = app.folder.get();
        var model = folderApi.pool.getModel(folder);
        var module = model.attributes.module;

        var allFilesToUpload = _.filter(
            _.map(fileObjArray, function (item) { return item.preventFileUpload ? false : _.pick(item, 'file').file; }),
            function (item) { return item !== false; }
        );

        fileUpload.create.validateFiles(allFilesToUpload, { folder: folder })
            .then(function () { return initiateDirCreation(createTreeObj(fileObjArray), folder, module); })
            .then(function (updatedTreeArr) { handleFilesUpload(updatedTreeArr, folder, app); });

    };

    return fileFolderUpload;

});
