/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/files/api', [
    'io.ox/core/http',
    'io.ox/core/extensions',
    'io.ox/core/api/factory',
    'io.ox/core/folder/api',
    'settings!io.ox/core',
    'io.ox/core/cache',
    'io.ox/files/mediasupport',
    'settings!io.ox/files',
    'gettext!io.ox/files',
    'io.ox/filter/files'
], function (http, ext, apiFactory, folderAPI, coreConfig, cache, mediasupport, settings, gt) {

    'use strict';

    var tracker = (function () {

        var fileLocks = {},
        explicitFileLocks = {};

        var getCID = function (param) {
            return _.isString(param) ? param : _.cid(param);
        };

        var self = {

            // check if file is locked
            isLocked: function (obj) {
                var cid = getCID(obj);
                return fileLocks[cid] > _.now();
            },

            // check if file is explicitly locked by other user (modified_by + locked_until)
            isLockedByOthers: function (obj) {
                var cid = getCID(obj);
                return explicitFileLocks[cid] > _.now();
            },

            isLockedByMe: function (obj) {
                var cid = getCID(obj);
                return self.isLocked(cid) && !self.isLockedByOthers(cid);
            },

            /**
             * returns local date time string of lock expiry if expiry is sometime in the next week
             * @param  {object} file
             * @return { string|false }
             */
            getLockTime: function (obj) {
                if (moment(obj.locked_until).isBefore(moment().add(1, 'week'))) {
                    return moment(obj.locked_until).format('l LT');
                } else {
                    return false;
                }
            },

            /**
             * add file to tracker
             * @param {object} obj
             * @return { object} tracker
             */
            addFile: function (obj) {
                if (obj.locked_until === 0) return self;
                var cid = getCID(obj);
                fileLocks[cid] = obj.locked_until;
                if (obj.modified_by !== ox.user_id) {
                    explicitFileLocks[cid] = obj.locked_until;
                }
                return self;
            },

            /**
             * wrapper to add/remove file; resolves inconsistencies
             * @param {object} obj
             * @return { object} tracker
             */
            updateFile: function (obj) {
                obj = _.isObject(obj) ? obj : {};

                var cid = getCID(obj),
                    inconsistent = obj.locked_until !== (fileLocks[cid] ? fileLocks[cid] : 0);
                if (inconsistent) {
                    if (obj.locked_until) {
                        self.addFile(obj);
                    } else {
                        self.removeFile(cid);
                    }
                }
                return self;
            },

            /**
             * remove file from tracker
             * @param {object|string} obj/cid
             * @return { object} tracker
             */
            removeFile: function (obj) {
                var cid = getCID(obj);
                delete fileLocks[cid];
                delete explicitFileLocks[cid];
                return self;
            },

            /**
             * clear tracker and clear timeouts (chainable)
             * @return { object} tracker
             */
            clear: function () {
                fileLocks = {};
                explicitFileLocks = {};
                return self;
            }
        };

        return self;

    }());

    var mime_types = {
        // images
        'jpg':  'image/jpeg',
        'jpeg': 'image/jpeg',
        'png':  'image/png',
        'gif':  'image/gif',
        'tif':  'image/tiff',
        'tiff': 'image/tiff',
        'bmp':  'image/bmp',
        // audio
        'mp3':  'audio/mpeg',
        'ogg':  'audio/ogg',
        'opus': 'audio/ogg',
        'aac':  'audio/aac',
        'm4a':  'audio/mp4',
        'm4b':  'audio/mp4',
        'wav':  'audio/wav',
        // video
        'mp4':  'video/mp4',
        'm4v':  'video/mp4',
        'ogv':  'video/ogg',
        'ogm':  'video/ogg',
        'webm': 'video/webm',
        // CSV
        'csv': 'text/csv',
        // open office
        'odc': 'application/vnd.oasis.opendocument.chart',
        'odb': 'application/vnd.oasis.opendocument.database',
        'odf': 'application/vnd.oasis.opendocument.formula',
        'odg': 'application/vnd.oasis.opendocument.graphics',
        'otg': 'application/vnd.oasis.opendocument.graphics-template',
        'odi': 'application/vnd.oasis.opendocument.image',
        'odp': 'application/vnd.oasis.opendocument.presentation',
        'otp': 'application/vnd.oasis.opendocument.presentation-template',
        'ods': 'application/vnd.oasis.opendocument.spreadsheet',
        'ots': 'application/vnd.oasis.opendocument.spreadsheet-template',
        'odt': 'application/vnd.oasis.opendocument.text',
        'odm': 'application/vnd.oasis.opendocument.text-master',
        'ott': 'application/vnd.oasis.opendocument.text-template',
        'oth': 'application/vnd.oasis.opendocument.text-web',
        // pdf
        'pdf': 'application/pdf',
        // microsoft office
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xlsm': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
        'xltm': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'pptm': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
        'potx': 'application/vnd.openxmlformats-officedocument.presentationml.template',
        'potm': 'application/vnd.openxmlformats-officedocument.presentationml.template',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'docm': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        'dotm': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        'doc': 'application/msword',
        'dot': 'application/msword',
        'xls': 'application/vnd.ms-excel',
        'xlb': 'application/vnd.ms-excel',
        'xlt': 'application/vnd.ms-excel',
        'ppt': 'application/vnd.ms-powerpoint',
        'pps': 'application/vnd.ms-powerpoint'
    };

    var translate_mime = {
        'application/vnd.ms-word': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/mp3': 'audio/mpeg'
    };

    var regFixContentType = /^application\/(force-download|binary|x-download|octet-stream|vnd|vnd.ms-word.document.12|odt|x-pdf)$/i;

    var fixContentType = function (data) {
        if (data) {
            if (regFixContentType.test(data.file_mimetype)) {
                var ext = _((data.filename || '').split('.')).last().toLowerCase();
                if (ext in mime_types) {
                    data.file_mimetype = mime_types[ext];
                }
            } else if (translate_mime[data.file_mimetype]) {
                data.file_mimetype = translate_mime[data.file_mimetype];
            }
        }
        return data;
    };

    var allColumns = '20,23,1,5,700,702,703,704,705,707,3';

    var processFiles = function (data) {
        return _(data).filter(function (file) {
            return ext.point('io.ox/files/filter').filter(function (p) {
                return p.invoke('isEnabled', this, file) !== false;
            })
            .map(function (p) {
                return p.invoke('isVisible', this, file);
            })
            .reduce(function (acc, isVisible) {
                return acc && isVisible;
            }, true);
        });
    };

    // generate basic API
    var api = apiFactory({
        module: 'files',
        requests: {
            all: {
                action: 'all',
                folder: coreConfig.get('folder/infostore'),
                columns: allColumns,
                extendColumns: 'io.ox/files/api/all',
                sort: '702',
                order: 'asc'
            },
            list: {
                action: 'list',
                columns: '20,23,1,5,700,702,703,704,707,3',
                extendColumns: 'io.ox/files/api/list'
            },
            get: {
                action: 'get'
            },
            search: {
                action: 'search',
                // should be the same as all-request
                columns: allColumns,
                extendColumns: 'io.ox/files/api/all',
                sort: '702',
                order: 'asc',
                omitFolder: true,
                getData: function (query) {
                    return { pattern: query };
                }
            }
        },
        pipe: {
            all: function (data) {
                data = processFiles(data);
                _(data).each(function (obj) {
                    fixContentType(obj);
                    // remove from cache if get cache is outdated
                    api.caches.get.dedust(obj, 'last_modified');
                    api.caches.versions.remove(String(obj.id));
                    // this can be solved smarter once backend send correct
                    // number_of_version in 'all' requests; always zero now
                    // make sure "meta" is object
                    if (obj.meta === null) obj.meta = {};
                });
                return data;
            },
            allPost: function (data) {
                data = processFiles(data);
                _(data).each(function (obj) {
                    api.tracker.updateFile(obj);
                });
                return data;
            },
            list: function (data) {
                data = processFiles(data);
                _(data).each(function (obj) {
                    fixContentType(obj);
                });
                return data;
            },
            listPost: function (data) {
                data = processFiles(data);
                _(data).each(function (obj) {
                    if (obj) api.tracker.updateFile(obj);
                });
                return data;
            },
            get: function (data) {
                api.tracker.updateFile(data);
                return fixContentType(data);
            },
            search: function (data) {
                data = processFiles(data);
                _(data).each(function (obj) {
                    fixContentType(obj);
                    api.tracker.updateFile(obj);
                });
                return data;
            }
        },
        //special function for list requests that fall back to a get request (only one item in the array)
        simplify: function (options) {
            //add version parameter again so you don't get the current version all the time
            options.simplified.version = options.original.version;
            return options.simplified;
        }
    });

    // publish tracker
    api.tracker = tracker;

    // deprecated/unused? (31f5a4a, b856ca5)
    // api.getUpdates = function (options) {
    //     var params = {
    //         action: 'updates',
    //         columns: '20,23,1,700,702,703,706',
    //         folder: options.folder,
    //         timestamp: options.timestamp,
    //         ignore: 'deleted'
    //         /*sort: '700',
    //         order: 'asc'*/
    //     };
    //     return http.GET({
    //         module: 'files',
    //         params: params
    //     });
    // };

    api.caches.versions = new cache.SimpleCache('files-versions');

    /**
     * map error codes and text phrases for user feedback
     * @param  {event} e
     * @return { event }
     */
    var failedUpload = function (e) {
        e.data = e.data || {};
        //customized error messages
        if (e && e.code && (e.code === 'UPL-0005' || e.code === 'IFO-1700')) {
            e.data.custom = {
                type: 'error',
                text: /*#, dynamic*/gt(e.error, e.error_params[0], e.error_params[1])
            };
        } else if (e && e.code && e.code === 'IFO-0100' && e.problematic && e.problematic[0] && e.problematic[0].id === 700) {
            e.data.custom = {
                type: 'error',
                text: gt('The provided filename exceeds the allowed length.')
            };
        } else if (e && e.code && e.code === 'FLS-0024') {
            e.data.custom = {
                type: 'error',
                text: gt('The allowed quota is reached.')
            };
        } else {
            e.data.custom = {
                type: 'error',
                text: gt('This file could not be uploaded.') +
                    // add native error message unless generic "0 An unknown error occurred"
                    (!/^0 /.test(e.error) ? '\n' + e.error : '')
            };
        }
        return e;
    };

    /**
     * returns an error object in case arguments/properties are missing
     * @param  {object}           obj
     * @param  {string|array}     property keys
     * @param  {object}           options
     * @return { undefined|object }
     */
    var missing = function (obj, keys, options) {
        var opt, empty = [], undef = [], response, missing;
        //preparation
        obj = obj || {};
        keys = [].concat(keys.split(','));
        opt = $.extend({ type: 'undefined' }, options);
        //idenfity undefined/empty
        _.each(keys, function (key) {
            if (!(key in obj)) {
                undef.push(key);
            } else if (_.isEmpty(obj[key])) {
                empty.push(key);
            }
        });
        //consider option
        missing = opt.type === 'undefined' ? undef : undef.concat(empty);
        //set response
        if (missing.length) {
            response = failedUpload({
                categories: 'ERROR',
                error: opt.message || gt('Please specify these missing variables: ') + missing
            });
        }
        return response;
    };

    /**
     * upload a new file and store it
     * @param  {object} options
     *         'folder' - The folder ID to upload the file to. This is optional and defaults to the standard files folder
     *         'json' - The complete file object. This is optional and defaults to an empty object with just the folder_id set.
     *         'file' - the file object to upload
     * @fires  api#create.file
     * @return { deferred }
     */
    api.uploadFile = function (options) {

        // alright, let's simulate a multipart formdata form
        options = $.extend({
            folder: coreConfig.get('folder/infostore')
        }, options || {});

        function fixOptions() {
            if (!_.isObject(options.json) || _.isEmpty(options.json)) {
                options.json = {};
            }
            if (!options.json.folder_id) {
                options.json.folder_id = options.folder;
            }
            if (options.description) {
                options.json.description = options.description;
            }
        }

        function success(data) {
            // clear folder cache
            var fid = String(options.json.folder_id);
            return api.propagate('new', { folder_id: fid }, true).then(function () {
                api.trigger('create.file');
                return { folder_id: fid, id: parseInt(data.data, 10) };
            });
        }

        if ('FormData' in window) {

            var formData = new FormData(),
                uploadRequest,
                def;

            if ('filename' in options) {
                formData.append('file', options.file, options.filename);
            } else if ('file' in options) {
                formData.append('file', options.file);
            }

            fixOptions();
            formData.append('json', JSON.stringify(options.json));

            uploadRequest = http.UPLOAD({
                module: 'files',
                params: { action: 'new', filename: options.filename },
                data: formData,
                fixPost: true
            });

            //append abort function to returning object
            def =  uploadRequest.then(success, failedUpload);
            def.abort = uploadRequest.abort;

            return def;
        } else {

            // good old form post
            fixOptions();
            if (options.form) {
                options.form.off('submit');
            }
            return http.FORM({
                form: options.form,
                data: options.json
            }).pipe(success, failedUpload);
        }
    };

    /**
     * upload a new version of a file
     * @param  {object} options
     *         'folder' - The folder ID to upload the file to. This is optional and defaults to the standard files folder
     *         'json' - The complete file object. This is optional and defaults to an empty object with just the folder_id set.
     *         'file' - the file object to upload
     * @fires  api#create.file
     * @return { deferred }
     */
    api.uploadNewVersion = function (options) {
        // Alright, let's simulate a multipart formdata form
        options = $.extend({
            folder: coreConfig.get('folder/infostore')
        }, options || {});

        var formData = new FormData();
        if ('filename' in options) {
            formData.append('file', options.file, options.filename);
        } else {
            formData.append('file', options.file);
        }

        if (options.json && !$.isEmptyObject(options.json)) {
            if (!options.json.folder_id) {
                options.json.folder_id = options.folder;
            }
        } else {
            options.json = { folder_id: options.folder };
        }
        formData.append('json', JSON.stringify(options.json));

        //missing arguments / argument properties
        var error = missing(options, 'file,id,json');
        if (error) return $.Deferred().reject(error).promise();

        return http.UPLOAD({
            module: 'files',
            params: {
                action: 'update',
                extendedResponse: true,
                filename: options.filename,
                id: options.id,
                timestamp: _.now()
            },
            data: formData,
            // TODO: temp. backend fix
            fixPost: true
        })
        .then(
            function success(response) {
                var id = options.json.id || options.id,
                    folder_id = String(options.json.folder_id),
                    file = { folder_id: folder_id, id: id };
                return handleExtendedResponse(file, response, options);
            },
            failedUpload
        );
    };

    /**
     * upload a new version of a file (IE Version)
     * @param  {object} options
     *         'folder' - The folder ID to upload the file to. This is optional and defaults to the standard files folder
     *         'json' - The complete file object. This is optional and defaults to an empty object with just the folder_id set.
     *         'file' - the file object to upload
     * @fires  api#create.version
     * @return { deferred }
     */
    api.uploadNewVersionOldSchool = function (options) {
        // Alright, let's simulate a multipart formdata form
        options = $.extend({
            folder: coreConfig.get('folder/infostore')
        }, options || {});

        //missing arguments / argument properties
        var error = missing(options, 'form,file,json,id');
        if (error) return $.Deferred().reject(error).promise();

        var formData = options.form,
            deferred = $.Deferred();

        if (options.json && !$.isEmptyObject(options.json)) {
            if (!options.json.folder_id) {
                options.json.folder_id = options.folder;
            }
        } else {
            options.json = { folder_id: options.folder };
        }
        formData.append($('<input>',  { 'type': 'hidden', 'name': 'json', 'value': JSON.stringify(options.json) }));

        var tmpName = 'iframe_' + _.now(),
        frame = $('<iframe>',  { 'name': tmpName, 'id': tmpName, 'height': 1, 'width': 1 });
        $('#tmp').append(frame);

        window.callback_update = function (response) {
            var id = options.json.id || options.id,
                folder_id = String(options.json.folder_id),
                file = { folder_id: folder_id, id: id };
            $('#' + tmpName).remove();
            deferred[(response && response.error ? 'reject' : 'resolve')](response);
            window.callback_update = null;
            handleExtendedResponse(file, response);
        };

        formData.attr({
            method: 'post',
            enctype: 'multipart/form-data',
            action: ox.apiRoot + '/files?action=update&extendedResponse=true&id=' + options.id + '&timestamp=' + options.timestamp + '&session=' + ox.session,
            target: tmpName
        });
        formData.submit();
        return deferred.promise();
    };

    function handleExtendedResponse(file, response, options) {
        // extended response?
        if (_.isObject(response) && response.data !== true) {
            var data = response.data || response;
            // id has changed?
            if (data.id !== file.id) {
                data.former_id = file.id;
                api.trigger('change:id', data, data.former_id);
                return api.propagate('rename', data);
            }
        }
        options = options || {};
        return api.propagate('change', file, options.silent);
    }

    /**
     * updates file
     * @param  {object} file
     * @param  {boolean} makeCurrent (special handling for mark as current version) [optional]
     * @fires  api#create.file (object)
     * @return { deferred }
     */
    api.update = function (file, makeCurrent) {

        var updateData = file;

        if (makeCurrent) {
            //if there is only version, the request works.
            //if the other fields are present theres a backend error
            updateData = { version: file.version };
        }

        //missing arguments / argument properties
        var error = missing(file, 'id');
        if (error) return $.Deferred().reject(error).promise();

        return http.PUT({
            module: 'files',
            params: {
                action: 'update',
                extendedResponse: true,
                id: file.id,
                timestamp: _.then()
            },
            data: updateData,
            appendColumns: false
        })
        .then(function (response) {
            return handleExtendedResponse(file, response);
        });
    };

    /**
     * update caches and fire events (if not suppressed)
     * @param  {string} type ('change', 'new', 'delete')
     * @param  {file} obj
     * @param  {boolean} silent (no events will be fired) [optional]
     * @param  {boolean} noRefreshAll (refresh.all will not be triggered) [optional]
     * @fires  api#update
     * @fires  api#update: + cid
     * @fires  api#refresh.all
     * @return { promise }
     *
     * TODO: api.propagate should be changed to be able to process arrays
     */
    api.propagate = function (type, obj, silent, noRefreshAll) {

        var id, former_id, fid, all, list, get, versions, caches = api.caches, ready = $.when();

        if (type && _.isObject(obj)) {

            fid = String(obj.folder_id || obj.folder);
            id = String(obj.id);
            former_id = String(obj.former_id);
            obj = { folder_id: fid, id: id };

            if (/^(new|change|rename|delete)$/.test(type) && fid) {
                // if we have a new file or an existing file was deleted, we have to clear the proper folder cache.
                all = caches.all.grepRemove(fid + api.DELIM);
            } else {
                all = ready;
            }

            if (/^(change|rename|delete)$/.test(type) && fid && id) {
                // just changing a file does not affect the file list.
                // However, in case of a change or delete, we have to remove the file from item caches
                list = caches.list.remove(obj);
                get = caches.get.remove(obj);
                versions = caches.versions.remove(id);
            } else {
                list = get = versions = ready;
            }

            return $.when(all, list, get, versions).pipe(function () {
                if (!silent) {
                    if (type === 'change') {
                        return api.get(obj).done(function (data) {
                            api.trigger('update update:' + _.ecid(data), data);
                            if (!noRefreshAll) api.trigger('refresh.all');
                        });
                    } else if (type === 'rename') {
                        return api.get(obj).done(function (data) {
                            var cid = encodeURIComponent(_.cid({ folder_id: data.folder_id, id: former_id }));
                            data.former_id = former_id;
                            api.trigger('update:' + cid, data);
                            if (!noRefreshAll) api.trigger('refresh.all');
                        });
                    } else {
                        if (!noRefreshAll) api.trigger('refresh.all');
                    }
                }
                folderAPI.reload(fid);
                return ready;
            });
        } else {
            return ready;
        }
    };

    /**
     * returns versions
     * @param  {object} options
     * @param  {string} options.id
     * @return { deferred }
     */
    api.versions = function (options) {
        options = _.extend({ action: 'versions', timezone: 'utc' }, options);

        //missing arguments / argument properties
        var error = missing(options, 'id');
        if (error) return $.Deferred().reject(error).promise();

        var id = String(options.id);
        return api.caches.versions.get(id).pipe(function (data) {
            if (data !== null) {
                return data;
            } else {
                return http.GET({
                    module: 'files',
                    params: options,
                    appendColumns: true
                })
                .then(function (data) {
                    return $.when(api.caches.versions.add(id, data)).then(function () {
                        return data;
                    });
                });
            }
        });
    };

    /**
     * returns url
     * @param  {object} file
     * @param  {string} mode
     * @param  {string} options
     * @return { string} url
     */
    api.getUrl = function (file, mode, options) {
        options = $.extend({ scaletype: 'contain' }, options || {});
        var url = ox.apiRoot + '/files',
            // basic URL
            query = '?action=document&folder=' + file.folder_id + '&id=' + file.id +
                (file.version !== undefined && options.version !== false ? '&version=' + file.version : ''),
            // file name
            name = (file.filename ? '/' + encodeURIComponent(file.filename) : ''),
            // scaling options
            thumbnail = 'thumbnailWidth' in options && 'thumbnailHeight' in options ?
                '&scaleType=' + options.scaletype + '&width=' + options.thumbnailWidth + '&height=' + options.thumbnailHeight : '',
            // avoid having identical URLs across contexts (rather edge case)
            userContext = '&' + $.param({
                context: [String(ox.user_id), '_', String(ox.context_id)].join()
            }),
            // inject cache buster based on last_modified; needed for "revisionless save"
            // the content might change without creating a new version (which would be part of the URL)
            buster = file.last_modified ? '&' + file.last_modified : '';

        query += userContext + buster;

        switch (mode) {
        case 'open':
        case 'view':
            return url + name + query + '&delivery=view';
        case 'play':
            return url + query + '&delivery=view';
        case 'download':
            return (file.meta && file.meta.downloadUrl) || url + name + query + '&delivery=download';
        case 'thumbnail':
            return (file.meta && file.meta.thumbnailUrl) || url + query + '&delivery=view' + thumbnail + (file.file_mimetype ? '&content_type=' + file.file_mimetype : '');
        case 'preview':
            return (file.meta && file.meta.previewUrl) || url + query + '&delivery=view' + thumbnail + '&format=preview_image&content_type=image/jpeg';
        case 'cover':
            return ox.apiRoot + '/image/file/mp3Cover?' + 'folder=' + file.folder_id + '&id=' + file.id + thumbnail + '&content_type=image/jpeg' + userContext;
        case 'zip':
            return url + '?' + $.param({
                action: 'zipdocuments',
                body: JSON.stringify(_.map(file, function (o) { return { id: o.id, folder_id: o.folder_id }; })),
                // required here!
                session: ox.session
            }) + userContext;
        default:
            return url + query;
        }
    };

    /**
     * removes version
     * @param  {object} version (file version object)
     * @fires  api#delete.version (version)
     * @return { deferred }
     */
    api.detach = function (version) {
        //missing arguments / argument properties
        var error = missing(version, 'id,folder_id,version');
        if (error) return $.Deferred().reject(error).promise();

        return http.PUT({
            module: 'files',
            params: {
                action: 'detach',
                id: version.id,
                folder: version.folder_id,
                timestamp: _.now()
            },
            data: [version.version],
            appendColumns: false
        })
        .pipe(function () {
            return api.propagate('change', { folder_id: version.folder_id, id: version.id });
        })
        .done(function () {
            api.trigger('delete.version', version);
        });
    };

    var copymove = function (list, action, targetFolderId) {
        //object to store errors inside the multiple
        var errors = [];
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        // pause http layer
        http.pause();
        // process all updates
        _(list).map(function (o) {
            return http.PUT({
                module: 'files',
                params: {
                    action: action || 'update',
                    extendedResponse: true,
                    id: o.id,
                    folder: o.folder_id || o.folder,
                    // mandatory for 'update'
                    timestamp: o.timestamp || _.then()
                },
                data: { folder_id: targetFolderId },
                appendColumns: false
            }).then(function (response) {
                return handleExtendedResponse(o, response, { silent: true });
            }, function (errorObj) {
                errors.push(errorObj);
            });
        });
        // resume & trigger refresh
        return http.resume()
            .pipe(function () {
                return $.when.apply($,
                    _(list).map(function (o) {
                        return $.when(
                            api.caches.all.grepRemove(targetFolderId + api.DELIM),
                            api.caches.all.grepRemove(o.folder_id + api.DELIM),
                            api.caches.list.remove({ id: o.id, folder: o.folder_id })
                        );
                    })
                );
            }).then(function () {
                //return errors inside multiple
                return errors;
            })
            .done(function () {
                api.trigger('refresh.all');
            });
    };

    /**
     * move files to a folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @return { deferred }
     */
    api.move = function (list, targetFolderId) {
        return copymove(list, 'update', targetFolderId);
    };

    /**
     * copy files to a folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @return { deferred }
     */
    api.copy = function (list, targetFolderId) {
        return copymove(list, 'copy', targetFolderId);
    };

    /**
     * file playable in current browser
     * @param  {string} type ('audio', 'video')
     * @param  {string} filename
     * @return { boolean }
     */
    api.checkMediaFile = function (type, filename) {
        return mediasupport.checkFile(type, filename);
    };

    var lockToggle = function (list, action) {
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        // pause http layer
        http.pause();
        // process all updates
        _(list).map(function (o) {
            return http.PUT({
                module: 'files',
                params: {
                    action: action,
                    id: o.id,
                    folder: o.folder_id || o.folder,
                    timezone: 'UTC'
                    // Use 10s diff for debugging purposes
                    // diff: 10000
                },
                appendColumns: false
            });
        });

        // resume & trigger refresh
        return http.resume().then(function () {
            if (action === 'lock') {
                // lock
                return api.getList(list, false).then(function (list) {
                    return _(list).map(function (obj, index) {
                        // addFile is done by getList
                        var isNotLast = index < list.length - 1;
                        // last one triggers refresh.all
                        return api.propagate('change', obj, false, isNotLast);
                    });
                });
            } else {
                // unlock
                return _(list).map(function (obj, index) {
                    // removeFile is done by propagate's get
                    var isNotLast = index < list.length - 1;
                    // last one triggers refresh.all
                    return api.propagate('change', obj, false, isNotLast);
                });
            }
        });
    };

    /**
     * unlocks files
     * @param  {array} list
     * @return { deferred }
     */
    api.unlock = function (list) {
        return lockToggle(list, 'unlock');
    };

    /**
     * locks files
     * @param  {array} list
     * @return { deferred }
     */
    api.lock = function (list) {
        return lockToggle(list, 'lock');
    };

    //
    // Respond to folder API
    //
    folderAPI.on({
        'clear': function (e, id) {
            api.caches.all.grepRemove(id + api.DELIM).done(function () {
                api.trigger('refresh.all');
            });
        },
        'remove:infostore': function (e, id) {
            var id = settings.get('folder/trash');
            if (id) folderAPI.list(id, { cache: false });
        }
    });

    //
    // Download zipped content of a folder
    //

    api.zip = function (id) {
        return require(['io.ox/core/download']).then(function (download) {
            download.url(
                ox.apiRoot + '/files?' + $.param({ action: 'zipfolder', folder: id, recursive: true, session: ox.session })
            );
        });
    };

    return api;

});
