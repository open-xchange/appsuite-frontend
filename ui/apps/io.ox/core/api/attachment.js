/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/api/attachment', [
    'io.ox/core/http',
    'io.ox/core/event',
    'io.ox/core/util',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (http, Events, util, coreSettings, gt) {

    'use strict';

    var api = {
        /**
         * gets all attachments for a specific object, for example a task
         * @param  {object} options
         * @return { deferred }
         */
        getAll: function (options) {

            return http.GET({
                module: 'attachment',
                params: {
                    action: 'all',
                    module: options.module,
                    attached: options.id,
                    folder: options.folder || options.folder_id,
                    columns: '1,800,801,802,803,804,805'
                }
            }).then(function (data) {
                //fix for backend bug folder should not be 0
                for (var i = 0; i < data.length; i++) {
                    data[i].folder = options.folder || options.folder_id;
                }
                // Filter out outlook-special attachments
                return _(data).reject(function (attachment) { return attachment.rtf_flag; });
            });
        },

        /**
         * removes attachments
         * @param  {object} options
         * @param  {object} data (id properties)
         * @return { deferred }
         */
        remove: function (options, data) {
            var self = this;
            return http.PUT({
                module: 'attachment',
                params: {
                    action: 'detach',
                    module: options.module,
                    attached: options.id,
                    folder: options.folder || options.folder_id
                },
                data: data
            }).done(function () {
                self.trigger('detach', {
                    module: options.module,
                    id: options.id,
                    folder: options.folder || options.folder_id
                });
            });
        },

        /**
         * create attachment
         * @param  {object} options
         * @param  {object} data (attachment)
         * @return { deferred }
         */
        create: function (options, data) {
            var self = this;
            var params = { action: 'attach', force_json_response: true },
                json = {
                    module: options.module,
                    attached: options.id,
                    folder: options.folder || options.folder_id
                },
                formData = new FormData(),
                cid = _.ecid(options);

            data = data || [];
            data = _.isArray(data) ? data : [data];
            for (var i = 0; i < data.length; i++) {
                formData.append('json_' + i, JSON.stringify(json));
                formData.append('file_' + i, data[i]);
            }
            return http.UPLOAD({
                module: 'attachment',
                params: params,
                data: formData,
                fixPost: true
            }).progress(function (e) {
                api.trigger('progress:' + cid, e);
            }).done(function () {
                self.trigger('attach', {
                    module: options.module,
                    id: options.id,
                    folder: options.folder || options.folder_id
                });
            });
        },

        /**
         * create attachment
         * @param  {object} options
         * @param  {object} form
         * @return { deferred }
         */
        createOldWay: function (options, form) {

            var json = {
                    module: options.module,
                    attached: options.id,
                    folder: options.folder || options.folder_id
                },
                uploadCounter = 0,
                self = this,
                deferred = $.Deferred();

            $(':input.add-attachment', form).each(function (index, field) {
                var jqField = $(field);
                if (jqField.attr('type') === 'file') {
                    jqField.attr('name', 'file_' + uploadCounter);
                    $(form).append($('<input>', { 'type': 'hidden', 'name': 'json_' + uploadCounter, 'value': JSON.stringify(json) }));
                    uploadCounter++;
                }
            });

            var tmpName = 'iframe_' + _.now(),
                frame = $('<iframe>', { 'name': tmpName, 'id': tmpName, 'height': 1, 'width': 1 });

            $('#tmp').append(frame);
            window.callback_attach = function (response) {
                $('#' + tmpName).remove();
                self.trigger('attach', {
                    module: options.module,
                    id: options.id,
                    folder: options.folder || options.folder_id
                });
                deferred[(response && response.error ? 'reject' : 'resolve')](response);
                window.callback_attach = null;
                $('#tmp').trigger('attachmentsSaved');
            };

            $(form).attr({
                method: 'post',
                enctype: 'multipart/form-data',
                action: ox.apiRoot + '/attachment?action=attach&session=' + ox.session,
                target: tmpName
            });
            $(form).submit();
            return deferred;
        },

        /**
         * builds URL to download/preview File
         * @param  {object} data
         * @param  {string} mode
         * @param  {object} options
         * @return { string} url
         */
        getUrl: function (data, mode, options) {

            options = options || {};

            var url = '/attachment',
                // scaling options
                scaling = options.width && options.height ? '&scaleType=' + options.scaleType + '&width=' + options.width + '&height=' + options.height : '';

            // inject filename for more convenient file downloads
            url += (data.filename ? '/' + encodeURIComponent(data.filename) : '') + '?' +
                $.param({
                    //needs to be added manually
                    session: ox.session,
                    action: 'document',
                    folder: data.folder,
                    id: data.id || data.managedId,
                    module: data.module,
                    attached: data.attached,
                    source: 'task'
                });
            switch (mode) {
                case 'view':
                case 'open':
                    return util.getShardingRoot(url + '&delivery=view' + scaling);
                case 'download':
                    return ox.apiRoot + url + '&delivery=download';
                default:
                    return util.getShardingRoot(url);
            }
        },

        /**
         * save attachment
         * @param  {object} data
         * @param  {string} target (folder_id)
         * @return { deferred }
         */
        save: function (data, target) {
            //multiple does not work, because module overides module
            //in params. So we need to do it one by one
            // be robust

            var descriptionText = {
                1: gt('Saved appointment attachment'),
                4: gt('Saved task attachment'),
                7: gt('Saved contact attachment')
                // 137: 'Saved Infostore attachment'
            };

            //make sure we have a string or target + api.DELIM results in NaN
            target = (target || coreSettings.get('folder/infostore')).toString();

            return http.PUT({
                module: 'files',
                params: {
                    action: 'saveAs',
                    folder: data.folder,
                    module: data.module,
                    attached: data.attached,
                    attachment: data.id || data.managedId
                },
                data: { folder_id: target, description: descriptionText[data.module] || gt('Saved attachment') },
                appendColumns: false
            })
            .done(function () {
                require(['io.ox/files/api'], function (api) {
                    api.pool.resetFolder(target);
                    api.trigger('add:file');
                });
            });
        }

    };

    Events.extend(api);

    return api;
});
