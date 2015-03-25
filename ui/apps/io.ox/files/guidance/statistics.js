/**
* @author Richard Petersen
*/

define('io.ox/files/guidance/statistics', [
    'io.ox/core/strings',
    'io.ox/core/folder/api',
    'io.ox/core/folder/breadcrumb',
    'io.ox/files/legacy_api',
    'gettext!io.ox/files',
    'io.ox/core/capabilities',
    'static/3rd.party/Chart.js/Chart.js'
], function (strings, folderAPI, getBreadcrumb, api, gt, capabilities) {

    'use strict';

    var COLUMNS = '1,3,5,20,23,700,702,703,704,705,707',
        WIDTH = _.device('smartphone') ? 280 : 500,
        HEIGHT = _.device('smartphone') ? 150 : 200,
        EXTENSION_KEYWORDS = {
            //images
            'jpg':  'Images',
            'jpeg': 'Images',
            'png':  'Images',
            'gif':  'Images',
            'tif':  'Images',
            'tiff': 'Images',
            'bmp':  'Images',

            //audio
            'mp3':  'Audio',
            'ogg':  'Audio',
            'opus': 'Audio',
            'aac':  'Audio',
            'm4a':  'Audio',
            'm4b':  'Audio',
            'wav':  'Audio',

            //video
            'avi':  'Video',
            'mp4':  'Video',
            'm4v':  'Video',
            'ogv':  'Video',
            'ogm':  'Video',
            'webm': 'Video',
            'mov':  'Video',
            'mpeg': 'Video',

            //Documents
            'odt':  'Documents',
            'odm':  'Documents',
            'ott':  'Documents',
            'oth':  'Documents',
            'doc':  'Documents',
            'dot':  'Documents',
            'docx': 'Documents',
            'dotx': 'Documents',
            'dotm': 'Documents',

            //books
            'epub': 'Books',
            'mobi': 'Books',

            //Spreadsheet
            'csv':  'Spreadsheets',
            'ods':  'Spreadsheets',
            'ots':  'Spreadsheets',
            'xlsx': 'Spreadsheets',
            'xlsm': 'Spreadsheets',
            'xltx': 'Spreadsheets',
            'xltm': 'Spreadsheets',
            'xls':  'Spreadsheets',
            'xlb':  'Spreadsheets',
            'xlt':  'Spreadsheets',

            //Presentation
            'odp':  'Presentations',
            'otp':  'Presentations',
            'pptx': 'Presentations',
            'pptm': 'Presentations',
            'ppsx': 'Presentations',
            'potx': 'Presentations',
            'potm': 'Presentations',
            'ppt':  'Presentations',
            'pps':  'Presentations',

            //Pdf
            'pdf': 'Pdf',

            //Archive
            'zip': 'Archive',
            'tar': 'Archive',
            'gz':  'Archive',
            'rar': 'Archive',
            '7z':  'Archive',
            'bz2': 'Archive',

            //comic books
            'cbz': 'Comics',
            'cbr': 'Comics',
            'cb7': 'Comics',
            'cbt': 'Comics',
            'cba': 'Comics',

            //Web development
            'html': 'Web',
            'css':  'Web',
            'js':   'Web',

            //Plain text
            'txt': 'Plain Text',
            '':    'Plain Text'
        };

    function createCanvas() {

        // attribute notation does not work! don't know why. maybe retina whatever.
        return $('<canvas width="' + WIDTH + '" height="' + HEIGHT + '" style="width:' + WIDTH + 'px; height:' + HEIGHT + 'px;"></canvas>');
    }

    function getExtension(filename) {
        var index = filename.lastIndexOf('.');

        if (index < 0) {
            return '';
        }

        return filename.substring(index + 1, filename.length);
    }

    //returns a string which returns the type of the file depending on the mime_type
    function getFileType(filename) {
        var ext = getExtension(filename).toLowerCase();

        return EXTENSION_KEYWORDS[ext] || 'Other';
    }

    //returns all subfolders recursively of the folder
    function getAllSubFolders(folder, recursionDepth) {
        recursionDepth = recursionDepth || 0;

        if (recursionDepth === 3) {
            return [];
        } else {
            return folderAPI.list(folder.id).then(function (subfolders) {
                return $.when.apply($,
                    _(subfolders).map(function (subFolder) {
                        return getAllSubFolders(subFolder, recursionDepth + 1);
                    })
                )
                .then(function () {
                    return _([folder].concat(_(arguments).toArray())).flatten();
                });
            });
        }
    }

    //this is used to cache the information of files to not reload on every request
    var fetch = (function () {
        //hash of deffered objects
        var hash = {};

        return function (options, reload) {
            //create id of options
            var cid = JSON.stringify(options);

            if (reload !== undefined && reload) {
                hash = {};
                return null;
            }

            //do not load files, when cid is already in hash
            if (!hash[cid] || hash[cid].state() === 'rejected') {
                hash[cid] = api.getAll({ folder: options.folder, columns: COLUMNS }, false);
            }

            //return deferred promise
            return hash[cid].promise();
        };

    }());

    //appends quota to node, if disk space is limited.
    function storageQuota(node, baton) {
        if (baton.quota.infostoreQuota < 0) {
            node.idle().empty();
        } else {
            getAllSubFolders(baton.folder).done(function () {
                node.append($('<h2>').text(gt('Capacity')));

                node.idle();

                node.append($('<div class="progress" style="width: ' + WIDTH + 'px;" >').append(
                    $('<div class="progress-bar" style="width: ' + ((baton.quota.infostoreUsage / baton.quota.infostoreQuota) * 100) + '%;">')
                        .text(((baton.quota.infostoreUsage / baton.quota.infostoreQuota) * 100).toFixed(2) + ' %')
                ));

                if (capabilities.has('gab')) {
                    node.append(
                        $('<div style="width: ' + WIDTH + 'px;">').text(
                            //#. %1$s used disk space
                            //#. %2$s total disk space
                            //#. %3$s free disk space
                            gt('Your capacity is shared with all members of your group. Your group is currently using %1$s of its %2$s available disk space. The amount of free space is %3$s. ',
                                gt.format('%1$s', strings.fileSize(baton.quota.infostoreUsage)),
                                gt.format('%1$s', strings.fileSize(baton.quota.infostoreQuota)),
                                gt.format('%1$s', strings.fileSize(baton.quota.infostoreQuota - baton.quota.infostoreUsage))
                            )
                        )
                    );
                } else {
                    node.append(
                        $('<div style="width: ' + WIDTH + 'px;">').text(
                            //#. %1$s used disk space
                            //#. %2$s total disk space
                            //#. %3$s free disk space
                            gt('You are currently using %1$s of your %2$s available disk space. You have %3$s left. ',
                                gt.format('%1$s\u00A0', strings.fileSize(baton.quota.infostoreUsage)),
                                gt.format('%1$s\u00A0', strings.fileSize(baton.quota.infostoreQuota)),
                                gt.format('%1$s\u00A0', strings.fileSize(baton.quota.infostoreQuota - baton.quota.infostoreUsage))
                            )
                        )
                    );
                }
            });
        }
    }

    //appends canvas to the node, containing information about the sizes of the folders.
    function folderSize(node, baton) {
        getAllSubFolders(baton.folder).done(function (list) {
            var canvas = createCanvas(),
                folders = {};

            node.append($('<h2>').text(gt('Top 10 folder size')));

            $.when.apply($,
                _(list).filter(function (listItem) {
                    return folderAPI.can('read', listItem);
                })
                .map(function (listItem) {
                    listItem.folder_size = 0;
                    folders[listItem.id] = listItem;
                    return fetch({ folder: listItem.id });
                })
            )
            .then(function success() {
                var files = _(_(arguments).toArray()).flatten(),
                    data,
                    chart,
                    ctx,
                    options,
                    scale = 1,
                    scaledData;

                if (files.length > 0) {
                    _(files).each(function (file) {
                        var id = file.folder_id;

                        folders[id].folder_size = folders[id].folder_size + file.file_size;
                    });

                    data = _(_(folders)
                        .sortBy(function (folder) { return -folder.folder_size; }))
                        .first(10);

                    while (_(data).first().folder_size / scale > 1024) {
                        scale *= 1024;
                    }

                    scaledData = _(data).map(function (obj) { return obj.folder_size / scale; });

                    chart = {
                        labels: '1 2 3 4 5 6 7 8 9 10'.split(' '),
                        datasets: [{
                            fillColor: 'rgba(0, 136, 204, 0.15)',
                            strokeColor: 'rgba(0, 136, 204, 0.80)',
                            data: scaledData
                        }]
                    };

                    node.idle();

                    ctx = canvas.get(0).getContext('2d');
                    new window.Chart(ctx).Bar(chart, {});

                    options = {
                        handler: function (id) {
                            baton.app.folder.set(id);
                            baton.dialog.close();
                        },
                        exclude: ['9'],
                        subfolder: false,
                        last: false
                    };

                    node.append(
                        canvas,
                        $('<ol>').append(
                            _(data).map(function (folder) {
                                return $('<li>').append(getBreadcrumb(folder.id, options),
                                    $('<span>').text(' ' + gt.format('%1$s\u00A0 ', strings.fileSize(folder.folder_size))));
                            })
                        )
                    );

                    node.append(
                        $('<div style="width: ' + WIDTH + 'px;">').text(
                            //#. %1$s name of the current folder
                            gt('These statistics only include folders, which have a depth less than four in the folder structure from the folder \"%1$s\".',
                                baton.folder.title)
                        )
                    );
                } else {
                    node.idle().empty();
                }
            },
            function fail() {
                node.idle().empty();
            });
        });
    }

    //appends canvas to node, containing information about the used file types in percent.
    function fileType(node, baton) {
        getAllSubFolders(baton.folder).done(function (list) {
            var canvas = createCanvas();

            node.append($('<h2>').text(gt('Top 10 file types')), canvas);

            $.when.apply($,
                _(list).filter(function (listItem) {
                    return folderAPI.can('read', listItem);
                })
                .map(function (listItem) {
                    return fetch({ folder: listItem.id });
                })
            )
            .then(function success() {
                var files = _(_(arguments).toArray()).flatten(),
                    fileTypes = {},
                    data,
                    scaledData,
                    scale = 1,
                    chart,
                    ctx;

                if (files.length > 0) {
                    _(files).each(function (file) {
                        var id = getFileType(String(file.filename));

                        fileTypes[id] = (fileTypes[id] || 0) + file.file_size;
                    });

                    data = _(fileTypes).chain()
                        .pairs()
                        .sortBy(function (obj) { return -obj[1]; })
                        .first(10)
                        .value();

                    while (_(data).first()[1] / scale > 1024) {
                        scale *= 1024;
                    }

                    scaledData = _(data).map(function (obj) { return obj[1] / scale; });

                    //create chart with data, labels and colors.
                    chart = {
                        labels: '1 2 3 4 5 6 7 8 9 10'.split(' '),
                        datasets: [{
                            fillColor: 'rgba(0, 136, 204, 0.15)',
                            strokeColor: 'rgba(0, 136, 204, 0.80)',
                            data: scaledData
                        }]
                    };

                    node.idle();

                    //append data as chart to the canvas
                    ctx = canvas.get(0).getContext('2d');
                    new window.Chart(ctx).Bar(chart, {});

                    node.append(
                        $('<ol>').append(
                            _(data).map(function (obj) {
                                return $('<li>').append(
                                    $('<span>').text(obj[0] + ' - ' + gt.format('%1$s\u00A0 ', strings.fileSize(obj[1])))
                                );
                            })
                        )
                    );
                    node.append(
                        $('<div style="width: ' + WIDTH + 'px;">').text(
                            //#. %1$s name of the current folder
                            gt('These statistics only include folders, which have a depth less than four in the folder structure from the folder \"%1$s\".',
                                baton.folder.title)
                        )
                    );
                } else {
                    node.idle().empty();

                    //remove the reload button
                    $('a[data-action=guidance_files_reload]').remove();
                }
            },
            function fail() {
                node.idle().empty();
            });
        });
    }

    //clears the cached files.
    function clearCache() {
        fetch({}, true);
    }

    return { storageQuota: storageQuota,
        folderSize: folderSize,
        fileType: fileType,
        clearCache: clearCache
    };
});
