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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 *
 */

define('io.ox/files/api', [
    'io.ox/core/http',
    'io.ox/core/folder/api',
    'io.ox/core/api/user',
    'io.ox/core/api/backbone',
    'io.ox/core/api/collection-pool',
    'io.ox/core/api/collection-loader',
    'io.ox/core/capabilities',
    'io.ox/core/extensions',
    'io.ox/core/api/jobs',
    'io.ox/core/util',
    'io.ox/files/permission-util',
    'io.ox/find/api',
    'settings!io.ox/core',
    'settings!io.ox/files',
    'gettext!io.ox/files'
], function (http, folderAPI, userAPI, backbone, Pool, CollectionLoader, capabilities, ext, jobsAPI, util, pUtil, FindAPI, coreSettings, settings, gt) {

    'use strict';

    var api = {};

    //
    // Backbone Model & Collection for Files
    //

    var regUnusableType = (/^application\/(force-download|binary|x-download|octet-stream|vnd|vnd.ms-word.document.12|odt|x-pdf)$/i);

    // basic model with custom cid
    api.Model = backbone.Model.extend({

        /**
         * Constructor, to initialize the model with mail and PIM attachments,
         * besides Drive model attributes.
         */
        constructor: function (attributes, options) {
            attributes = attributes || {};
            var normalizedAttrs;
            // check if model is initialized with mail, pim or drive model attributes
            if (attributes.space) {
                normalizedAttrs = {
                    filename: attributes.name,
                    file_size: attributes.size,
                    file_mimetype: attributes.mimeType,
                    spaceId: attributes.space,
                    id: attributes.id,
                    origData: attributes,
                    source: 'compose'
                };
            } else if (_.isObject(attributes.mail)) {
                // mail attachment
                normalizedAttrs = {
                    filename: attributes.filename,
                    file_size: attributes.size,
                    file_mimetype: attributes.content_type,
                    id: attributes.id,
                    folder_id: attributes.mail.folder_id || null,
                    origData: attributes,
                    source: 'mail'
                };

            } else if (_.isNumber(attributes.attached) && _.isNumber(attributes.module)) {
                // pim attachment
                normalizedAttrs = {
                    filename: attributes.filename,
                    file_size: attributes.file_size || attributes.size,
                    file_mimetype: attributes.file_mimetype || attributes.fmtType,
                    id: attributes.id || attributes.managedId,
                    folder_id: attributes.folder,
                    module: attributes.module,
                    origData: attributes,
                    source: 'pim'
                };

            } else if (_.isString(attributes.guardUrl) || (attributes.source === 'guardDrive') || (attributes.source === 'guardMail')) {
                normalizedAttrs = attributes;
                // map content_type to file_mimetype for mail attachments
                if (attributes.content_type && !normalizedAttrs.file_mimetype) {
                    normalizedAttrs.file_mimetype = attributes.content_type;
                }

            } else {
                // drive
                normalizedAttrs = attributes;
                normalizedAttrs.source = 'drive';
            }
            // call parent constructor
            backbone.Model.call(this, normalizedAttrs, options);

            this.listenTo(this, 'change:com.openexchange.file.sanitizedFilename', function (m, newName) {
                //maybe update versions if filename is changed
                var versions = this.get('versions');
                if (!versions) return;

                for (var i = 0; i < versions.length; i++) {
                    if (versions[i].version === m.get('version')) {
                        versions[i]['com.openexchange.file.sanitizedFilename'] = newName;
                        break;
                    }
                }
                this.set('versions', versions);
            });
        },

        isFolder: function () {
            return this.has('standard_folder');
        },
        isFile: function () {
            // we cannot check for "filename", because there are files without a file; yep!
            // so we rather check if it's not a folder
            return !this.isFolder() && this.isDriveItem();
        },
        isDriveItem: function () {
            return (this.get('source') === 'drive' || this.get('source') === 'guardDrive');
        },

        isSVG: function (type) {
            return (/^image\/svg/).test(type || this.getMimeType());
        },
        isImage: function (type) {
            return (
                (/^image\//).test(type || this.getMimeType()) &&

                // bypass SVG as they can contain malicious XML
                // See Bug #50748
                !this.isSVG(type)
            );
        },

        isAudio: function (type) {
            return (/^audio\//).test(type || this.getMimeType());
        },
        isVideo: function (type) {
            return (/^video\//).test(type || this.getMimeType());
        },

        isOffice: function (type) {
            return (/^application\/(msword|excel|powerpoint|vnd\.(ms-word|ms-excel|ms-powerpoint|oasis|openxmlformats))/).test(type || this.getMimeType());
        },

        isPDF: function (type) {
            return (/^application\/pdf$/).test(type || this.getMimeType());
        },

        isZIP: function (type) {
            return (/^application\/zip$/).test(type || this.getMimeType());
        },

        isText: function (type) {
            return /^(text\/plain|application\/rtf|text\/rtf)$/.test(type || this.getMimeType());
        },

        isWordprocessing: function (type) {
            return (/^application\/(?:msword|vnd\.(?:ms-word|openxmlformats-officedocument\.wordprocessingml|oasis\.opendocument\.text))/).test(type || this.getMimeType());
        },
        isSpreadsheet: function (type) {
            return (/^application\/(?:excel|vnd\.(?:ms-excel|openxmlformats-officedocument\.spreadsheetml|oasis\.opendocument\.spreadsheet))/).test(type || this.getMimeType());
        },
        isPresentation: function (type) {
            return (/^application\/(?:powerpoint|vnd\.(?:ms-powerpoint|openxmlformats-officedocument\.presentationml|oasis\.opendocument\.presentation))/).test(type || this.getMimeType());
        },

        isPgp: function (type) {
            return (/^application\/pgp(?:-encrypted)*$/).test(type) || this.isGuard();
        },
        isGuard: function () {
            return (/^guard/).test(this.get('source'));
        },

        isEncrypted: function () {
            return (
                this.isPgp() ||
                // check if file has "guard" file extension
                (/\.(grd|grd2|pgp)$/i).test(this.get('filename'))
            );
        },

        isLocked: function () {
            return this.get('locked_until') > _.now();
        },

        isMailAttachment: function () {
            return (this.get('source') === 'mail' || this.get('source') === 'guardMail');
        },

        isComposeAttachment: function () {
            return this.get('source') === 'compose';
        },

        isPIMAttachment: function () {
            return this.get('source') === 'pim';
        },

        isEmptyFile: function () {
            return this.isFile() && !this.get('filename');
        },

        getDisplayName: function () {
            return this.get('com.openexchange.file.sanitizedFilename') || this.get('filename') || this.get('title') || '';
        },

        getExtension: function () {
            var parts = String(this.get('filename') || '').split('.');
            return parts.length === 1 ? '' : parts.pop().toLowerCase();
        },

        getGuardExtension: function () {
            var extension;
            var parts = String(this.get('filename') || '').split('.');

            // If has extension .xyz.pgp, remove the pgp and return extension
            if ((parts.length > 2) && (parts.pop().toLowerCase() === 'pgp')) {
                extension = parts[parts.length - 1].toLowerCase();
            } else {
                extension = '';
            }

            return extension;
        },

        getMimeType: function () {
            // split by ; because this field might contain further unwanted data
            var type = String(this.get('file_mimetype')).toLowerCase().split(';')[0];
            // For Guard files, get the orig mime
            if ((this.get('source') === 'guardDrive') && this.get('meta') && this.get('meta').OrigMime) {
                type = this.get('meta').OrigMime;
            }
            // unusable mime type?
            if (regUnusableType.test(type)) {
                // return mime type based on file extension
                return api.mimeTypes[this.getExtension()] || type;
            }
            // fix mime type?
            if (type === 'audio/mp3') return 'audio/mpeg';
            // otherwise
            return type;
        },

        getGuardMimeType: function () {
            var meta = this.get('meta');
            var origMime = meta && meta.OrigMime;

            // no original mime or unusable mime type?
            if (!origMime || regUnusableType.test(origMime)) {
                // return mime type based on file extension
                origMime = api.mimeTypes[this.getGuardExtension()] || this.getMimeType();
            }

            return origMime;
        },

        getFileType: function () {
            if (this.isFolder && this.isFolder()) {
                return 'folder';
            }
            if (this.getExtension) {
                var extension = this.getExtension();
                for (var type in this.types) {
                    if (this.types[type].test(extension)) return type;
                }
            }
            return false;
        },

        getGuardType: function () {
            var extension = this.getGuardExtension();
            if (extension) {
                for (var type in this.types) {
                    if (this.types[type].test(extension)) { return type; }
                }
            }
            return this.getFileType();
        },

        types: {
            image: (/^(gif|bmp|tif?f|jpe?g|gmp|png|psd|heic?f?)$/),
            audio: (/^(aac|mp3|m4a|m4b|ogg|opus|wav)$/),
            video: (/^(avi|m4v|mp4|ogv|ogm|mov|mpeg|webm|wmv)$/),
            vcf:   (/^(vcf)$/),
            doc:   (/^(docx|docm|dotx|dotm|odt|ott|doc|dot|rtf)$/),
            xls:   (/^(csv|xlsx|xlsm|xltx|xltm|xlam|xls|xlt|xla|xlsb|ods|ots)$/),
            ppt:   (/^(pptx|pptm|potx|potm|ppsx|ppsm|ppam|odp|otp|ppt|pot|pps|ppa|odg|otg)$/),
            pdf:   (/^pdf$/),
            zip:   (/^(zip|tar|gz|rar|7z|bz2)$/),
            txt:   (/^(txt|md)$/),
            guard: (/^(grd|grd2|pgp)$/)
        },

        supportsPreview: function () {
            if (this.isEncrypted()) return false;
            var type = this.getMimeType();
            if (this.isImage(type)) return 'thumbnail';
            if (this.isAudio(type)) return 'cover';
            if (capabilities.has('document_preview') && (this.isPDF(type) || this.isOffice(type) || this.isText(type))) return 'preview';
            return false;
        },

        getUrl: function (type, options) {
            return api.getUrl(this.toJSON(), type, options);
        },

        hasWritePermissions: function () {
            return pUtil.hasObjectWritePermissions(this.toJSON());
        },

        getItemAccountSynchronous: function () {
            var parentFolder = this.isFile ? this.get('folder_id') : this.get('id');
            // for some cases it must be synchronous, so check the
            // use-case if the folder is already available in every case
            var folderModel = folderAPI.pool.models[parentFolder];
            return folderModel.get('account_id');
        },

        isFederatedSharedFolder: function () {
            var folder = this.isFolder ? this.get('id') : null;
            if (!folder) { return false; }
            // for some cases it must be synchronous, so check the
            // use-case if the folder is already available in every case
            var folderModel = folderAPI.pool.models[folder];
            return folderModel && folderModel.is('federated-sharing');
        },

        getAccountDisplayName: function () {
            var folder = this.isFolder ? this.get('id') : null;
            if (!folder) { return false; }
            // for some cases it must be synchronous, so check the
            // use-case if the folder is already available in every case
            var folderModel = folderAPI.pool.models[folder];
            return folderModel && folderModel.getAccountDisplayName();
        }
    });

    // collection using custom models
    api.Collection = backbone.Collection.extend({
        model: api.Model
    });

    //
    // Special Mime Types
    //

    api.mimeTypes = {
        // images
        'jpg':  'image/jpeg',
        'jpeg': 'image/jpeg',
        'png':  'image/png',
        'gif':  'image/gif',
        'tif':  'image/tiff',
        'tiff': 'image/tiff',
        'bmp':  'image/bmp',
        'heic': 'image/heic',
        'heif': 'image/heif',

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
        'wmv':  'video/video/x-ms-wmv',
        // CSV
        'csv':  'text/csv',
        // open office
        'odc':  'application/vnd.oasis.opendocument.chart',
        'odb':  'application/vnd.oasis.opendocument.database',
        'odf':  'application/vnd.oasis.opendocument.formula',
        'odg':  'application/vnd.oasis.opendocument.graphics',
        'otg':  'application/vnd.oasis.opendocument.graphics-template',
        'odi':  'application/vnd.oasis.opendocument.image',
        'odp':  'application/vnd.oasis.opendocument.presentation',
        'otp':  'application/vnd.oasis.opendocument.presentation-template',
        'ods':  'application/vnd.oasis.opendocument.spreadsheet',
        'ots':  'application/vnd.oasis.opendocument.spreadsheet-template',
        'odt':  'application/vnd.oasis.opendocument.text',
        'odm':  'application/vnd.oasis.opendocument.text-master',
        'ott':  'application/vnd.oasis.opendocument.text-template',
        'oth':  'application/vnd.oasis.opendocument.text-web',
        // pdf
        'pdf':  'application/pdf',
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
        'doc':  'application/msword',
        'dot':  'application/msword',
        'xls':  'application/vnd.ms-excel',
        'xlb':  'application/vnd.ms-excel',
        'xlt':  'application/vnd.ms-excel',
        'ppt':  'application/vnd.ms-powerpoint',
        'pot':  'application/vnd.ms-powerpoint',
        'pps':  'application/vnd.ms-powerpoint'
    };

    //
    // Helper functions based on file extension.
    //

    // Returns the file extension, removes pgp from .xyz.pgp if present
    api.getExtension = function (file) {
        var filename = file && (file['com.openexchange.file.sanitizedFilename'] || file.filename || file.title);
        var parts = String(filename || '').split('.');
        var extension;

        // if extension is .xyz.pgp, remove the pgp and return extension
        if ((parts.length > 2) && (parts.pop().toLowerCase() === 'pgp')) {
            extension = parts[parts.length - 1].toLowerCase();
        } else if (parts.length > 1) {
            extension = parts.pop().toLowerCase();
        } else {
            extension = '';
        }

        return extension;
    };

    api.isText = function (file) {
        return api.Model.prototype.types.txt.test(api.getExtension(file));
    };

    api.isPDF = function (file) {
        return api.Model.prototype.types.pdf.test(api.getExtension(file));
    };

    api.isWordprocessing = function (file) {
        return api.Model.prototype.types.doc.test(api.getExtension(file));
    };

    api.isPresentation = function (file) {
        return api.Model.prototype.types.ppt.test(api.getExtension(file));
    };

    api.isSpreadsheet = function (file) {
        return api.Model.prototype.types.xls.test(api.getExtension(file));
    };

    api.isOffice = function (file) {
        return (api.isWordprocessing(file) || api.isPresentation(file) || api.isSpreadsheet(file));
    };

    api.isImage = function (file) {
        return api.Model.prototype.types.image.test(api.getExtension(file));
    };

    api.isAudio = function (file) {
        return api.Model.prototype.types.audio.test(api.getExtension(file));
    };

    api.isVideo = function (file) {
        return api.Model.prototype.types.video.test(api.getExtension(file));
    };

    // get URL to open, download, or preview a file
    // options:
    // - scaleType: contain or cover or auto
    // - height: image height in pixels
    // - width: image widht in pixels
    // - version: true/false. if false no version will be appended
    api.getUrl = function (file, type, options) {

        options = _.extend({ scaleType: 'contain' }, options);

        if (file.space) {
            return ox.apiRoot + '/mail/compose/' + file.space + '/attachments/' + file.id + '?session=' + ox.session;
        }

        var url = '/files',
            folder = encodeURIComponent(file.folder_id),
            id = encodeURIComponent(file.id),
            sessionData = '&user=' + ox.user_id + '&context=' + ox.context_id + '&sequence=' + (file.last_modified || 1),
            version = file.version !== undefined && options.version !== false && options.version !== null ? '&version=' + file.version : '',
            // basic URL
            query = '?action=document&folder=' + folder + '&id=' + id + version + sessionData,
            // file name
            name = file.filename ? '/' + encodeURIComponent(file.filename) : '',
            // scaling options
            scaling = options.width && options.height ? '&scaleType=' + options.scaleType + '&width=' + options.width + '&height=' + options.height : '',
            // avoid having identical URLs across contexts (rather edge case)
            // also inject last_modified if available; needed for "revisionless save"
            // the content might change without creating a new version (which would be part of the URL)
            buster = _([ox.user_id, ox.context_id, file.last_modified]).compact().join('.') || '';

        if (buster) query += '&' + buster;

        if (options.params) query += '&' + _.serialize(options.params);

        switch (type) {
            case 'download':
                url = (file.meta && file.meta.downloadUrl) || url + name + query + '&delivery=download';
                break;
            case 'thumbnail':
                if (options.noSharding) {
                    url = (file.meta && file.meta.thumbnailUrl) || url + query + '&delivery=view' + scaling;
                    break;
                }
                return util.getShardingRoot((file.meta && file.meta.thumbnailUrl) || url + query + '&delivery=view' + scaling);
            case 'preview':
                if (options.noSharding) {
                    url = (file.meta && file.meta.previewUrl) || url + query + '&delivery=view' + scaling + '&format=preview_image&content_type=image/jpeg';
                    break;
                }
                return util.getShardingRoot((file.meta && file.meta.previewUrl) || url + query + '&delivery=view' + scaling + '&format=preview_image&content_type=image/jpeg');
            case 'cover':
                url = '/image/file/mp3Cover?folder=' + folder + '&id=' + id + scaling + sessionData + '&content_type=image/jpeg&' + buster;
                break;
            case 'play':
                url = url + query + '&delivery=view';
                break;
            // open/view
            default:
                url = url + name + query + '&delivery=view';
                break;
        }

        return ox.apiRoot + url;
    };

    //
    // Pool
    //

    var pool = Pool.create('files', { Collection: api.Collection, Model: api.Model });

    // overwrite "add" of this pool instance
    pool.add = _.wrap(pool.add, function (add, cid, data) {
        if (_.isUndefined(data)) { data = cid; cid = 'detail'; }
        var collection = this.get(cid), valid, expired = [];
        data = [].concat(data);

        // find modules that are expired (changed in another browser or by a shared user etc)
        if (cid === 'detail') {
            data.forEach(function (item) {
                valid = !collection.get(_.cid(item)) || (collection.get(_.cid(item)) && collection.get(_.cid(item)).get('last_modified') >= item.last_modified);
                if (valid) {
                    item.expired = false;
                } else {
                    item.expired = true;
                    expired.push(_.cid(item));
                }
            });
        }

        // perform the original add
        var result = add.call(this, cid, data);

        if (expired.length > 0) {
            // trigger event for the expired models, so views can update
            collection.trigger('expired_models', expired);
        }

        return result;
    });

    // guess 23 is "meta"
    // 711 is "number of versions", needed for fixing Bug 52006,
    // number of versions often changes when editing files
    var allColumns = '1,2,3,5,20,23,51,52,108,700,702,703,704,705,707,711,7040';
    var allVersionColumns = http.getAllColumns('files', true);

    var attachmentView = coreSettings.get('folder/mailattachments', {});
    if (!_.isEmpty(attachmentView)) {
        // add 7030 if attachment view is active
        allColumns = allColumns + ',7030';
    } else {
        // remove from version columns
        allVersionColumns = allVersionColumns.replace(',7030', '');
    }

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
        } else if (e.error && e.error === 'abort') {
            return;
        } else {
            e.data.custom = {
                type: 'error',
                text: gt('This file could not be uploaded.') +
                    // add native error message unless generic "0 An unknown error occurred"
                    (!(/^0 /).test(e.error) ? '\n' + e.error : '')
            };
        }
        return e;
    };

    // add event hub
    _.extend(api, Backbone.Events);

    api.pool = pool;

    api.collectionLoader = new CollectionLoader({
        module: 'files',
        getQueryParams: function (params) {
            // Exit early on virtual folders
            if ((/^virtual\//).test(params.folder)) {
                return false;
            }
            return {
                action: 'all',
                folder: params.folder || coreSettings.get('folder/infostore'),
                columns: allColumns,
                sort: params.sort || '702',
                order: params.order || 'asc',
                // tell server to prefetch thumbnails (see bug 39897)
                // default is true; can be set to false
                pregenerate_previews: params.pregenerate_previews !== false,
                timezone: 'utc'
            };
        },
        fetch: function (params) {

            var module = this.module,
                key = module + '/' + _.cacheKey(_.extend({ session: ox.session }, params)),
                rampup = ox.rampup[key],
                noSelect = this.noSelect(params),
                virtual = this.virtual(params),
                self = this;

            if (rampup) {
                delete ox.rampup[key];
                return $.when(rampup);
            }

            if (noSelect) {
                var model = folderAPI.pool.getModel(params.folder);
                if (model.attributes.own_rights === 1) {
                    params.tree = 1;
                    params.parent = params.folder;
                    module = 'folders';
                    params.action = 'list';
                    // use correct columns for folders (causes errors in backend otherwise, UI just get's null values)
                    params.columns = '1,2,3,5,20,23,51,52';
                }
            }
            if (virtual) {
                return $.when(virtual);
            }

            return http.wait().then(function () {
                if (self.mimeTypeFilter) {
                    return self.filterByMimeType(params).then(function (data) {
                        // apply filter
                        if (self.filter) data = _(data).filter(self.filter);
                        // useSlice helps if server request doesn't support "limit"
                        return self.useSlice ? Array.prototype.slice.apply(data, params.limit.split(',')) : data;
                    });
                }
                return $.when(self.httpGet(module, params), ox.manifests.loadPluginsFor('io.ox/files/filter'));
            }).then(function (data) {
                // apply custom filter
                if (_.isFunction(self.filter)) data = _(data).filter(self.filter);
                // apply filter extensions
                data = data.filter(function (file) {
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
                // useSlice helps if server request doesn't support "limit"
                return self.useSlice ? Array.prototype.slice.apply(data, params.limit.split(',')) : data;
            });
        },

        httpGet: function (module, params) {

            if (params.folder === '9') {
                var folders = [];

                // add all folders and favorites for the "Drive" folder list view
                return folderAPI.get('virtual/favorites/infostore').then(function (favoriteFolder) {
                    return folderAPI.list('virtual/favorites/infostore').then(function (favorites) {
                        if (favorites.length) {
                            folders.push(favoriteFolder);
                        }
                        return folderAPI.multipleLists(['virtual/drive/private', 'virtual/drive/public', 'virtual/filestorage']).then(function (driveFolders) {
                            if (!capabilities.has('share_links || invite_guests')) {
                                driveFolders = _.filter(driveFolders, function (folder) {
                                    return folder.id !== 'virtual/myshares';
                                });
                            }
                            folders = folders.concat(driveFolders);
                            switch (String(params.sort)) {
                                // Name
                                case '702':
                                    folders = _(folders).sortBy('title');
                                    break;
                                // Date
                                case '5':
                                    folders = _.sortBy(folders, function (folder) {
                                        return folder.last_modified ? folder.last_modified : 0;
                                    });
                                    break;
                                default:
                                    // do nothing
                            }
                            if (params.order === 'desc') {
                                folders.reverse();
                            }
                            return folders;
                        });
                    });
                });
            }

            // since we don't have a unified API for files and folders
            // we fetch folders first to see how many we get.
            // we always have to do that even if the offset is > 0
            // since the number might have changed.
            // next, we can calculate the proper limit for the files request
            return folderAPI.list(params.folder).then(function (folders) {
                // sort by date client-side
                if (String(params.sort) === '5') {
                    folders = _(folders).sortBy('last_modified');
                }
                if (params.order === 'desc') folders.reverse();
                // get remaining limit for files
                var split = params.limit.split(/,/),
                    start = Number(split[0]),
                    stop = Number(split[1]),
                    // construct new values
                    newStart = start - folders.length,
                    newStop = stop - folders.length,
                    limit = newStart + ',' + newStop;
                // folders exceed upper limit?
                if (folders.length >= stop) return folders.slice(start, stop);
                // fetch files
                return http.GET({ module: module, params: _.extend({}, params, { limit: limit }) }).then(
                    function (files) {
                        // build virual response of folders, placeholders, and files
                        // simple solution to get proper slice
                        var unified = [].concat(
                            folders,
                            // fill up with placeholders
                            new Array(Math.max(0, start - folders.length)),
                            files
                        );

                        var result = unified.slice(start, stop);
                        result.forEach(function (el, index) {
                            result[index] = mergeDetailInPool(el);
                        });
                        return result;
                    },
                    function fail(e) {
                        if (e.code === 'IFO-0400' && e.error_params.length === 0) {
                            // IFO-0400 is missing the folder in the error params -> adding this manually
                            e.error_params.push(params.folder);
                        }
                        api.trigger('error error:' + e.code, e);
                        // this one might fail due to lack of permissions; error are transformed to empty array
                        if (ox.debug) console.warn('files.httpGet', e.error, e);
                        return [];
                    }
                );
            });
        },
        filterByMimeType: function (params) {
            var self = this;
            return folderAPI.get(params.folder).then(function (folder) {
                return folderAPI.list(params.folder).then(function (folders) {
                    // sort by date client-side
                    if (String(params.sort) === '5') {
                        folders = _(folders).sortBy('last_modified');
                    }
                    if (params.order === 'desc') folders.reverse();
                    // get remaining limit for files
                    var split = params.limit.split(/,/),
                        start = Number(split[0]),
                        stop = Number(split[1]);
                    // folders exceed upper limit?
                    if (folders.length >= stop) return folders.slice(start, stop);
                    var opt = {
                        data: {
                            facets: [
                                {
                                    facet: 'folder',
                                    filter: null,
                                    value: params.folder
                                },
                                {
                                    facet: 'account',
                                    filter: null,
                                    value: folder.account_id
                                },
                                {
                                    facet: 'file_type',
                                    filter: {
                                        fields: ['file_extension'],
                                        queries: self.mimeTypeFilter
                                    },
                                    value: self.mimeTypeFilter
                                }
                            ],
                            options: {
                                includeSubfolders: false,
                                sort: params.sort,
                                order: params.order
                            },
                            size: stop,
                            start: start
                        },
                        params: {
                            module: 'files'
                        }
                    };

                    // fetch files
                    return FindAPI.query(opt).then(
                        function (files) {
                            files = files.results;
                            // build virual response of folders, placeholders, and files
                            // simple solution to get proper slice
                            var unified = [].concat(
                                folders,
                                // fill up with placeholders
                                new Array(Math.max(0, start - folders.length)),
                                files
                            );

                            var result = unified.slice(start, stop);
                            result.forEach(function (el, index) {
                                result[index] = mergeDetailInPool(el);
                            });
                            self.addIndex(start, params, result);
                            self.done();
                            return result;
                        },
                        function fail(e) {
                            if (e.code === 'IFO-0400' && e.error_params.length === 0) {
                                // IFO-0400 is missing the folder in the error params -> adding this manually
                                e.error_params.push(params.folder);
                            }
                            api.trigger('error error:' + e.code, e);
                            // this one might fail due to lack of permissions; error are transformed to empty array
                            if (ox.debug) console.warn('files.filter', e.error, e);
                            return [];
                        }
                    );
                });
            });
        },
        // set higher limit; works much faster than mail
        // we pick a number that looks ok for typical columns, so 5 * 6 * 7 = 210
        PRIMARY_PAGE_SIZE: 210,
        SECONDARY_PAGE_SIZE: 210
    });

    api.collectionLoader.noSelect = function (options) {
        // check read access
        var model = folderAPI.pool.getModel(options.folder);
        return !model.can('read');
    };

    api.collectionLoader.each = function (data) {
        api.pool.add('detail', data);
    };

    api.collectionLoader.setMimeTypeFilter = function (mimeTypeFilter) {
        if (_.isEqual(api.collectionLoader.mimeTypeFilter, mimeTypeFilter)) {
            return false;
        }
        api.collectionLoader.mimeTypeFilter = mimeTypeFilter;
        return true;
    };

    // resolve a list of composite keys
    api.resolve = (function () {

        function map(cid) {
            // return either folder or file models
            if ((/^folder\./).test(cid)) {
                // convert folder model to file model
                var data = folderAPI.pool.getModel(cid.substr(7)).toJSON();
                data.folder_id = 'folder';
                return new api.Model(data);
            }
            // return existing file model
            return pool.get('detail').get(cid);
        }

        return function (list, json) {
            var models = _(list).chain().map(map).compact().value();
            return json === false ? models : _(models).invoke('toJSON');
        };

    }());

    // merges assigned data in pool
    // and return the merged result!
    function mergeDetailInPool(data) {
        pool.add('detail', data);
        return pool.get('detail').get(_.cid(data)).toJSON();
    }

    //
    // GET a single file
    //
    api.get = function (file, options) {

        options = _.extend({ cache: true }, options);

        if (options.cache) {
            var model = pool.get('detail').get(_.cid(file));
            // look for an attribute that is not part of the "all" request
            // to determine if we can use a cached model
            if (model && !model.get('expired') && model.has('description')) return $.when(model.toJSON());
        }

        var params = _.extend({
            action: 'get',
            id: file.id,
            folder: file.folder_id || file.folder,
            timezone: 'UTC'
        }, options.params);

        if (options.columns) params.columns = options.columns;

        return http.GET({
            module: 'files',
            params: params
        })
        .then(function (data) {

            // fix for Bug 49472 - 'Edit as new' for mail attachments broken: Mail is empty when resending
            // 'origin' is a temporary entry for mail attachment, we want to keep this info as long as possible
            if (file.origin) { data.origin = _.clone(file.origin); }

            return mergeDetailInPool(data);
        }, function (error) {
            api.trigger('error error:' + error.code, error);
            throw error;
        });
    };

    //
    // GET all files of a folder (for compatibility)
    //
    api.getAll = function (folder, options) {

        options = _.extend({ columns: allColumns }, options);

        return http.GET({
            module: 'files',
            params: _.extend({
                action: 'all',
                columns: options.columns,
                folder: folder,
                timezone: 'UTC'
            }, options.params)
        })
        .then(function (data) {
            pool.add('detail', data);
            return data;
        }, function (error) {
            api.trigger('error error:' + error.code, error);
            throw error;
        });
    };

    //
    // GET multiple files
    //
    api.getList = (function () {

        function has(item) {
            return this.get(_.cid(item));
        }

        function getter(item) {
            return this.get(_.cid(item)).toJSON();
        }

        /**
         * Retrieve a list of models or a list of FileDescriptors. Merge all files into pool.
         *
         * @param {FileDescriptor[]} ids
         *  Items to retrieve
         *
         * Additional Parameters
         * @param {Object} options Parameter Object
         *  @param {Boolean} options.fullModels
         *   Return FileDescriptor or Model List
         *  @param {Boolean} options.cache
         *   Use cache or nocache
         */
        return function (ids, options) {

            var uncached = ids, collection = pool.get('detail');
            options = _.extend({ cache: true }, options);

            // empty?
            if (ids.length === 0) return $.when([]);

            // get uncached items
            if (options.cache) uncached = _(ids).reject(has, collection);

            // all cached?
            if (options.fullModels && uncached.length === 0) return $.when(_(ids).map(has, collection));
            if (uncached.length === 0) return $.when(_(ids).map(getter, collection));

            return http.fixList(uncached, http.PUT({
                module: 'files',
                params: { action: 'list', columns: allColumns, timezone: 'UTC' },
                data: http.simplify(uncached)
            }))
            .then(function (array) {
                // add new items to the pool
                _(array.filter(Boolean)).each(mergeDetailInPool);
                // reconstruct results
                if (options.fullModels) {
                    return _(ids).map(has, collection);
                }
                return _(ids).map(getter, collection);
            });
        };

    }());

    //
    // Lock/unlock files
    //

    var lockToggle = function (list, action) {
        // pause http layer
        http.pause();
        // process all updates
        _(list).each(function (item) {
            http.PUT({
                module: 'files',
                params: {
                    action: action,
                    id: item.id,
                    folder: item.folder_id || item.folder,
                    timezone: 'UTC'
                    // Use 10s diff for debugging purposes
                    // diff: 10000
                },
                appendColumns: false
            });
        });
        // resume & trigger refresh
        return http.resume();
    };

    function updateLockedUntil(list, value) {
        var collection = pool.get('detail');
        list.forEach(function (obj) {
            var model = collection.get(_.cid(obj));
            if (model) model.set('locked_until', value);
        });
    }

    /**
     * unlocks files
     * @param  {array} list
     * @return { deferred }
     */
    api.unlock = function (list) {
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        updateLockedUntil(list, 0);
        return lockToggle(list, 'unlock').done(function () {
            api.propagate('unlock', list);
        });
    };

    /**
     * locks files
     * @param  {array} list
     * @return { deferred }
     */
    api.lock = function (list) {
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        // lock for 60s until server responds with the actual value
        updateLockedUntil(list, _.now() + 60000);
        return lockToggle(list, 'lock').then(function () {
            return api.propagate('lock', list);
        });
    };

    /**
     * deletes all files from a specific folder
     * @param  {string} folder_id
     * @return { deferred }
     */
    api.clear = function (folder_id) {

        pool.getByFolder(folder_id).forEach(function (collection) {
            collection.expired = true;
            collection.reset();
        });

        // new clear
        return http.PUT({
            module: 'folders',
            appendColumns: false,
            params: {
                action: 'clear',
                tree: '1'
            },
            data: [folder_id]
        })
        .done(function () {
            api.propagate('clear', { folder_id: folder_id });
        });
    };

    /**
     * Restore a bunch of fileModels to their originally source.
     *
     * @param {api.Model[]} list
     *  Array of fileModels
     */
    api.restore = function (list) {
        // ensure array
        if (!_.isArray(list)) list = [list];

        // local copy for model data
        var data = [];

        _(list).each(function (model) {
            data.push({ id: model.get('id'), folder: model.get('folder_id') });

            // remove model from collections
            _(api.pool.collections).invoke('remove', model);
            model.set('unread', 0);
        });

        // restore on server
        return http.PUT({
            module: 'infostore',
            params: {
                action: 'restore',
                folder: data[0].id === '1' || /^default\d+/.test(data[0].id) ? 0 : 1
            },
            data: data,
            appendColumns: false
        })
        .done(function (responseArray) {
            var folderId,
                affectedFolders = [];

            _.each(responseArray, function (response) {
                folderId = response.path[0].id;

                if (!_.contains(affectedFolders, folderId)) {
                    affectedFolders.push(folderId);
                }

                api.trigger('refresh:listviews');
            });
        })
        .fail(function () {
            _(list).each(function (model) {
                api.propagate('restore:fail', model.toJSON());
            });
        });
    };

    // Handler to trigger a refresh of the listViews debounced
    var debounceRefreshListViews = _.debounce(function () {
        api.trigger('refresh:listviews');
    }, 0);

    //
    // Respond to folder API
    //
    folderAPI.on({
        'before:clear': function (id) {
            var isTrash = String(settings.get('folder/trash')) === id;
            // clear target folder
            _(pool.getByFolder(id)).each(function (collection) {
                var files = collection.filter(function (model) { return isTrash || model.isFile(); });
                if (collection.length === files.length) {
                    // use reset or listview removes files one by one and scrolls after each one (is very slow and blocks UI if there are many files)
                    collection.reset();
                } else {
                    collection.remove(files);
                }
            });
        },
        'remove:infostore': function () {
            var id = settings.get('folder/trash');
            if (id) {
                folderAPI.list(id, { cache: false });
                _(pool.getByFolder(id)).each(function (collection) {
                    collection.expired = true;
                });
            }
            debounceRefreshListViews();
        },
        // sync with folder API
        'before:remove before:move': function (data) {
            var collection = pool.get('detail'), cid = _.cid(data);
            collection.remove(collection.get(cid));
        },
        'restore': function () {
            api.trigger('refresh:listviews');
        }
    });

    //
    // Delete files
    //

    function prepareRemove(ids) {

        api.trigger('beforedelete', ids);

        var collection = pool.get('detail'),
            models = _(ids).map(function (item) {
                return collection.get(_.cid(item));
            });

        collection.remove(models);
    }

    api.remove = function (ids, hardDelete) {

        prepareRemove(ids);

        return http.wait(
            http.PUT({
                module: 'files',
                params: { action: 'delete', timestamp: _.then(), hardDelete: Boolean(hardDelete) },
                data: http.simplify(ids),
                appendColumns: false
            })
            .done(function () {
                api.propagate('remove:file', ids);
            })
        );
    };

    //
    // Move / Copy
    //

    function move(list, targetFolderId, ignoreWarnings) {

        http.pause();

        var folders = _(list).where({ folder_id: 'folder' }),
            items = _(list).difference(folders);

        // move all files
        if (items && items.length > 0) {
            http.PUT({
                module: 'files',
                params: {
                    action: 'move',
                    folder: targetFolderId,
                    ignoreWarnings: ignoreWarnings,
                    // allow long running jobs
                    allow_enqueue: true
                },
                data: items,
                appendColumns: false
            });
        }

        _(folders).each(function (item) {
            folderAPI.move(item.id, targetFolderId, { ignoreWarnings: ignoreWarnings, enqueue: true });
        });

        return http.resume();
    }

    function copy(list, targetFolderId, ignoreWarnings) {
        http.pause();
        _(list).map(function (item) {
            var params = {
                action: 'copy',
                id: item.id,
                folder: item.folder_id,
                timestamp: item.timestamp || _.then(),
                ignoreWarnings: ignoreWarnings
            };
            if (item.file_options && item.file_options.params) {
                params = _.extend(params, item.file_options.params);
            }
            return http.PUT({
                module: 'files',
                params: params,
                data: { folder_id: targetFolderId },
                appendColumns: false
            });
        });
        // do not consolidate requests, show pending message instead
        return http.resume({ consolidate: 'reject' });
    }

    function transfer(type, list, targetFolderId, ignoreWarnings) {

        var fn = type === 'move' ? move : copy,
            def = $.Deferred(),
            callback = function (response) {

                // this needs refactoring: when moving a folder successful with larger files (long running job)
                // the finished jobs have no 'multiple' response, therefore the input 'result' here is a String
                // (see http.js/processResponse why). When a String is returned in this function, later functions
                // detects that as an error, which is wrong. Therefore prevent that as an intermediate workaround.
                response = _.isString(response) ? [] : response;

                var errorText, i = 0, $i = response ? response.length : 0;
                // look if anything went wrong
                for (; i < $i; i++) {
                    // conflicts are handled separately
                    if (response[i].error && response[i].error.categories !== 'CONFLICT') {
                        errorText = response[i].error.error;
                        break;
                    }
                }
                // propagete move/copy event
                api.propagate(type, list, targetFolderId);

                def.resolve(errorText || response);
            },
            failCallback = function (error) {
                // if a job fails, check if this is a conflict thing, if it is use the successcallback
                if (_.isArray(error)) {
                    for (var i = 0; i < error.length; i++) {
                        if (error[i].error.categories === 'CONFLICT') {
                            callback(error);
                            return;
                        }
                    }
                } else if (error.categories === 'CONFLICT') {
                    callback(error);
                    return;
                }

                def.reject(error);
            };

        http.wait(fn(list, targetFolderId, ignoreWarnings)).then(function (result) {
            if (type === 'move' && result && result.length) {
                result = _(result).map(function (res) {
                    if (res.data && res.data.job) {
                        // long running job. Add to jobs list
                        jobsAPI.addJob({
                            module: 'folders',
                            action: 'update',
                            done: false,
                            showIn: 'infostore',
                            id: res.data.job,
                            successCallback: callback,
                            failCallback: failCallback });
                        return;
                    }
                    return res;
                });
                result = _(result).compact();
                // if all responses in the multiple where long running jobs, we return here. Otherwise we continue with what already finished
                if (result.length === 0) return;
            }
            callback(result);
        }, function (error) {
            def.reject(error);
        });
        return def;
    }

    /**
     * Move files to another folder
     * @param  {array} list of objects { id, folder_id }
     * @param  {string} targetFolderId
     * @param  {boolean} ignoreWarnings
     */
    api.move = function (list, targetFolderId, ignoreWarnings) {
        prepareRemove(list);
        return transfer('move', list, targetFolderId, ignoreWarnings);
    };

    /**
     * Copy files to another folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @param  {boolean} ignoreWarnings
     */
    api.copy = function (list, targetFolderId, ignoreWarnings) {
        return transfer('copy', list, targetFolderId, ignoreWarnings);
    };

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

    //
    // Update file
    // @param {object} file { id, folder_id }
    // @param {object} changes The changes to apply; not sent to server if empty
    //
    api.update = function (file, changes, options) {

        function process(prev, model, response) {
            // success
            if (!(response && response.error)) return;
            // restore old attribute properties
            if (prev && model) model.set(prev);
        }

        if (!_.isObject(changes) || _.isEmpty(changes)) return;

        var model = api.pool.get('detail').get(_.cid(file)),
            prev = {}, keys;
        if (model) {
            model.set(changes);
            // store attribues before set was executed
            keys = Object.keys(model.changedAttributes());
            _.each(keys, function (attr) { prev[attr] = model.previous(attr); });
        }

        // build split data object to support notifications
        options = _.extend({ silent: false }, options);
        var data = { file: changes };

        if (options.notification && !_.isEmpty(options.notification)) {
            data.notification = options.notification;
        }

        return http.PUT({
            module: 'files',
            params: {
                action: 'update',
                id: file.id,
                timestamp: _.then(),
                ignoreWarnings: options.ignoreWarnings,
                extendedResponse: true
            },
            data: data,
            appendColumns: false
        })
        .then(function (response) {
            // if id changes after update (e.g. rename files of some storage systems) update model id
            if (_.isObject(response) && model) {
                model.set('id', response.id);
                file.id = response.id;
                model.set('com.openexchange.file.sanitizedFilename', response['com.openexchange.file.sanitizedFilename']);
                file['com.openexchange.file.sanitizedFilename'] = response['com.openexchange.file.sanitizedFilename'];
            }
        })
        .always(_.lfo(process, prev, model))
        .done(function () {
            if (!options.silent) api.propagate('change:file', file, changes);
        });
    };

    function performUpload(action, options, data) {

        options = _.extend({
            addVersion: true,
            folder: coreSettings.get('folder/infostore'),
            // allow API consumers to override the module (like OX Guard will certainly do)
            module: 'files'
        }, options);

        var params = _.extend({
            action: action,
            // force the response to be json(ish) instead of plain html (fixes some error messages)
            force_json_response: true,
            timestamp: _.then()
        }, options.params);

        if (options.filename) params.filename = options.filename;
        if (options.title) data.title = options.title;
        if (options.preview) data.meta = _.extend({}, data.meta, { note_preview: options.preview });

        if (action === 'new') {
            params.extendedResponse = true;
            params.try_add_version = options.addVersion !== false;
            if (settings.get('uploadHandling') === 'newFile') params.try_add_version = false;
        }

        var formData = new FormData();

        // add data
        formData.append('json', JSON.stringify(data));
        // store folder here for error handling. cannot restore data from formData in Safari or IE
        formData.folder = data.folder_id;

        if ('filename' in options) {
            formData.append('file', options.file, options.filename);
        } else if ('file' in options) {
            formData.append('file', options.file);
        }

        return http.UPLOAD({
            module: options.module,
            params: params,
            data: formData,
            fixPost: true
        })
        .fail(failedUpload);
    }

    /**
     * Upload a new file
     * @param {object} file options
     *     - options.file - a File object (as in Blob)
     *     - options.filename - an optional filename (overrides the name value of options.file)
     *     - options.module - override the module used to upload to (default: 'files')
     *     - options.folder - the id of the folder to upload the file into
     *
     *     - options.description - optional meta data for the file object
     * @returns {object}
     *     - a promise resolving to the created file
     *     - promise can be aborted using promise.abort function
     */
    api.upload = function (options) {

        var folder_id = options.folder_id || options.folder,
            def = performUpload('new', options, {
                folder_id: folder_id,
                description: options.description || ''
            }),
            chain = def.then(function (result) {
                // return id and folder id only
                var data = result.data.file,
                    obj = _(data).pick('id', 'folder_id'),
                    fileTitle = data.title || data.filename;
                // trigger proper event
                if (result.data.save_action === 'new_version') {
                    // new version
                    var model = api.pool.get('detail').get(_.cid(obj));
                    if (model) model.set('id', data.id);
                    if (options.addVersion !== false && result.data.save_action === 'new_version' && settings.get('uploadHandling') === 'announceNewVersion') api.trigger('add:imp_version', fileTitle);
                    return api.propagate('add:version', data);
                }
                // new file
                api.propagate('add:file', obj);
                return data;
            });

        // we need to hand over the abort function to the deferred of the chain.
        // this is necessary, since .then creates a new deferred
        chain.abort = def.abort;

        return chain;
    };

    // File versions

    api.versions = {
        /**
         * Upload new version for a file
         * @param {object} file options
         *     - options.file - a File object (as in Blob)
         *     - options.filename - an optional filename (overrides the name value of options.file)
         *     - options.module - override the module used to upload to (default: 'files')
         *     - options.folder - the id of the folder to upload the file into
         *     - options.id - the id of the file
         *
         *     - options.version_comment - optional meta data for the file object
         * @returns {object}
         *     - a promise resolving to the created file
         *     - promise can be aborted using promise.abort function
         */
        upload: function (options) {
            // TODO: this smells, once you look into api.upload; Martin Fowler would be crying

            var def = performUpload('update', options, {
                    id: options.id,
                    folder_id: options.folder_id || options.folder,
                    version_comment: options.version_comment || ''
                }),
                chain = def.then(function (result) {
                    var id = result.data;
                    // id changed?
                    if (options.id !== id) {
                        var model = api.pool.get('detail').get(_.cid(options));
                        model.set('id', id);
                        return api.propagate('add:version', model.toJSON());
                    }
                    return api.propagate('add:version', options);
                });
            chain.abort = def.abort;
            return chain;
        },

        load: function (file, options) {
            options = _.extend({ cache: true, adjustVersion: false }, options);
            // skip if we don't have a model to add data
            var cid = _.cid(file), model = pool.get('detail').get(cid);
            if (!model) return $.when([]);

            // cache hit?
            if (options.cache && model.has('versions')) return $.when(model.get('versions'));

            return http.GET({
                module: 'files',
                params: {
                    action: 'versions',
                    columns: allVersionColumns,
                    folder: file.folder_id,
                    id: file.id,
                    timezone: 'utc'
                },
                appendColumns: true
            })
            .then(function (data) {
                var attributes = {
                    versions: data,
                    number_of_versions: data.length
                };

                if (model.get('version') === null && options.adjustVersion) {
                    attributes.version = null;
                    _.last(data).version = null;
                }
                model.set(attributes);

                // make sure we always get the same result (just data; not timestamp)
                return data;
            });
        },

        remove: function (file) {

            // update model instantly
            var cid = _.cid(file), model = pool.get('detail').get(cid);
            if (model && _.isArray(model.get('versions'))) {
                model.set('versions', model.get('versions').filter(function (item) {
                    return item.version !== file.version;
                }));
            }

            return http.PUT({
                module: 'files',
                params: {
                    action: 'detach',
                    id: file.id,
                    folder: file.folder_id,
                    timestamp: _.then()
                },
                data: [file.version],
                appendColumns: false
            })
            .then(function () {
                return api.propagate('remove:version', file);
            });
        },

        /**
         * All versions were deleted that are older than the passed version file except the current one.
         * @param {FileDescriptor} file version descriptor
         *
         * @returns {Deferred}
         */
        removePreviousVersions: function (file) {
            function versionSorter(version1, version2) {
                if (version1.current_version) {
                    return -versions.length;
                } else if (version2.current_version) {
                    return versions.length;
                }
                return version2.last_modified - version1.last_modified;
            }

            // update model instantly
            var model = pool.get('detail').get(_.cid(file)),
                versions = model.get('versions'),
                skipNextVersions;

            versions.sort(versionSorter);

            if (model && _.isArray(versions)) {
                model.set('versions', versions.filter(function (item) {
                    if (item.version === file.version) {
                        skipNextVersions = true;
                        return true;
                    }

                    if (item.current_version) return true;
                    if (parseInt(item.version, 10) < parseInt(file.version, 10)) return false;
                    if (skipNextVersions) return false;

                    return true;
                }));
            }

            // send which versions should be removed to the backend
            return http.PUT({
                module: 'files',
                params: {
                    action: 'detach',
                    id: file.id,
                    folder: file.folder_id,
                    timestamp: _.then()
                },
                data: _.difference(versions, model.get('versions')).map(
                    function (version) { return version.version; }
                ),
                appendColumns: false
            })
            .then(function () {
                api.propagate('refresh:file', _.pick(file, 'id', 'folder_id'));
            });
        },

        setCurrent: function (file) {
            // update model
            var model = pool.get('detail').get(_.cid(file));
            if (model && _.isArray(model.get('versions'))) {
                model.set('versions', model.get('versions').map(function (item) {
                    item.current_version = (item.version === file.version);
                    return item;
                }));
            }
            // update server-side
            // if there is only version, the request works.
            // if the other fields are present, we get a backend error
            var changes = { version: file.version };
            return api.update(file, changes).done(function () {
                // the mediator will reload the current collection
                api.propagate('change:version', file);
            });
        },

        /**
         * return a Deferred with bool if current version is true
         *
         * @return {Deferred} with a boolean
         */
        getCurrentState: function (file, options) {

            //workaround for Bug 53002
            if (typeof file.current_version === 'boolean') { return $.when(file.current_version); }

            return api.versions.load(file, options).then(function (versions) {
                var currentVersion = false;
                if (_.isArray(versions)) {
                    // fix for Bug 49895, drive plugin without support for versions
                    if (versions.length) {
                        currentVersion = _.some(versions, function (item) {
                            if (!item.current_version) return false;
                            // DOCS-2454: check the state for Next-/OwnCloud
                            if (item.number_of_versions === -1) return true;
                            return item.version === file.version;
                        });
                    } else {
                        currentVersion = true;
                    }
                }
                return currentVersion;
            });
        }
    };

    //
    // Search
    //
    api.search = function (query, options) {

        options = _.extend({ action: 'search', columns: api.search.columns, sort: '702', order: 'asc', limit: 100 }, options);

        return http.PUT({
            module: 'files',
            params: _(options).pick('action', 'columns', 'sort', 'order', 'limit', 'folder', 'includeSubfolders'),
            data: api.search.getData(query, options)
        })
        .done(function (d) {
            _(d).each(mergeDetailInPool);
        });
    };

    // make extensible
    api.search.columns = allColumns;
    api.search.getData = function (query) {
        return { pattern: query };
    };

    /**
     * Propagate changes beyond pure model updates
     *
     * @param  {string} type
     * @param  {file} obj
     * @param  {file} changes [optional]
     * @return { promise } [if necessary]
     *
     * Usage:
     *   api.propagate('add:file', file);
     *   api.propagate('lock', array);
     *   api.propagate('remove:file', array);
     *   api.propagate('change:file', file, [changes]);
     *   api.propagate('move', array, [targetFolderId]);
     */
    api.propagate = (function () {

        // keep support for old names
        var oldschool = { 'new': 'add:file', 'change': 'change:file', 'update': 'change:file', 'delete': 'remove:file' };

        function reloadVersions(file) {
            http.pause();
            api.get(file, { cache: false });
            api.versions.load(file, { cache: false });
            return http.resume().then(function (response) {
                // explicitly return the file data
                return _.isArray(response) && response.length ? response[0].data : false;
            });
        }

        return function (type, file) {

            // get another copy for array support
            // move, copy, lock, unlock, remove:file handle multiple files at once
            var list = _.isArray(file) ? file : [file];
            folderAPI.isExternalFileStorage(file);
            // reduce attributes
            file = _(file).pick('folder', 'folder_id', 'id', 'version');

            // translate oldschool names
            type = oldschool[type] || type;

            // might help for a while
            if (ox.debug) console.log('files/api.propagate()', type, file, list, arguments[2] || {});

            switch (type) {

                case 'add:file':
                    api.trigger('add:file', file);
                    // file count changed, need to reload folder
                    folderAPI.reload(list);
                    break;

                case 'restore:fail':
                    api.trigger('restore:fail', file);
                    break;

                case 'add:version':
                    // reload versions list
                    return reloadVersions(file).done(function () {
                        // the mediator will reload the current collection
                        api.trigger('add:version', file);
                    });

                case 'refresh:file':
                    return reloadVersions(file).done(function () {
                        api.trigger('add:version', file);
                    });

                case 'change:file':
                    // we trigger both change and update for backwards-compatibility
                    api.trigger('change:file update change:file:' + _.ecid(file) + ' update:' + _.ecid(file));
                    // rename?
                    var changes = arguments[2] || {};
                    if ('title' in changes || 'filename' in changes) api.propagate('rename', file);
                    if ('object_permissions' in changes) api.propagate('permissions', file);
                    if ('description' in changes) api.propagate('description', file);  //Bug 51571
                    break;

                case 'favorite:add':
                    api.trigger('favorite:add', file);
                    break;

                case 'favorite:remove':
                    api.trigger('favorite:remove', file);
                    break;

                case 'change:version':
                    api.trigger('change:version', file);
                    break;

                case 'clear':
                    api.trigger('clear', file.folder_id);
                    folderAPI.reload(file.folder_id);
                    break;

                case 'copy':
                case 'move':
                    // cleanup folder
                    list = _.reject(list, function (item) {
                        return item.folder_id === 'folder';
                    });
                    var targetFolderId = arguments[2];
                    // propagate proper event
                    api.trigger(type, list, targetFolderId);
                    // reload all affected folders (yep, copy would just need the target folder)
                    folderAPI.reload(list, targetFolderId);
                    // mark target folder as expired
                    pool.resetFolder(targetFolderId);
                    break;

                case 'lock':
                    // reload locked files to get proper timestamps
                    return api.getList(list, { cache: false });

                case 'remove:file':
                    // file count changed, need to reload folder
                    folderAPI.reload(list);
                    // mark trash folders as expired
                    var id = settings.get('folder/trash');

                    if (id) {
                        _(pool.getByFolder(id)).each(function (collection) {
                            collection.expired = true;
                        });
                    }
                    api.trigger('remove:file', list);
                    _(list).each(function (obj) {
                        api.trigger('remove:file:' + _.ecid(obj));
                    });
                    break;

                case 'remove:version':
                    // let's reload the version list
                    // since we might have just removed the current version
                    return reloadVersions(file).done(function () {
                        // the mediator will reload the current collection
                        api.trigger('remove:version', file);
                    });

                case 'rename':
                    return folderAPI.get(file.folder_id).then(function (fileModel) {
                        // reload the version if it is an external storage file
                        if (folderAPI.isExternalFileStorage(fileModel)) {
                            return reloadVersions(file).done(function () {
                                api.trigger('rename', _.cid(file));
                            });
                        }
                        api.trigger('rename', _.cid(file));
                    });
                case 'permissions':
                    api.trigger('change:permissions', _.cid(file));
                    break;

                case 'description':  //Bug 51571
                    api.trigger('description', _.cid(file));
                    break;

                case 'unlock':
                    // nothing to do for unlock
                    break;
                // no default
            }
        };

    }());

    api.getDefaultColumns = function (additional) {
        var columns = http.getAllColumns('files');
        return _([].concat(columns, additional)).uniq().sort().join(',');
    };

    return api;

});
