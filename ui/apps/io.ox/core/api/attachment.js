/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define("io.ox/core/api/attachment", ["io.ox/core/http",
                                     "io.ox/core/event",
                                     'io.ox/core/config'], function (http, Events, config) {
    "use strict";
    
    var api = {
        //gets all attachments for a specific object, for exsample a task
        getAll: function (options) {
            
            return http.GET({
                module: "attachment",
                params: {
                    action: "all",
                    module: options.module,
                    attached: options.id,
                    folder: options.folder || options.folder_id,
                    columns: "1,800,801,802,803,804,805"
                }
            }).pipe(function (data) {//fix for backend bug folder should not be 0
                for (var i = 0; i < data.length; i++) {
                    data[i].folder = options.folder || options.folder_id;
                }
                return _(data).reject(function (attachment) { return attachment.rtf_flag; }); // Filter out outlook-special attachments
            });
        },
        
        //removes attachments. data contains attachment ids
        remove: function (options, data) {
            var self = this;
            return http.PUT({
                module: "attachment",
                params: {
                    action: "detach",
                    module: options.module,
                    attached: options.id,
                    folder: options.folder || options.folder_id
                },
                data: data
            }).done(function () {
                self.trigger("detach", {
                    module: options.module,
                    id: options.id,
                    folder: options.folder || options.folder_id
                });
            });
        },
        
        create: function (options, data) {
            var self = this;
            var params = {action: "attach"},
                json = {module: options.module,
                        attached: options.id,
                        folder: options.folder || options.folder_id},
                formData = new FormData();
            
            data = data || [];
            data = _.isArray(data) ? data : [data];
            for (var i = 0; i < data.length; i++) {
                formData.append("json_" + i, JSON.stringify(json));
                formData.append("file_" + i, data[i]);
            }
            return http.UPLOAD({
                module: "attachment",
                params: params,
                data: formData,
                fixPost: true
            }).done(function () {
                self.trigger('attach', {
                    module: options.module,
                    id: options.id,
                    folder: options.folder || options.folder_id
                });
            });
        },
        
        //builds URL to download/preview File
        getUrl: function (data, mode) {
            
            var url = ox.apiRoot + '/attachment';
            // inject filename for more convenient file downloads
            url += (data.filename ? '/' + encodeURIComponent(data.filename) : '') + '?' +
                $.param({
                    session: ox.session,//needs to be added manually
                    action: 'document',
                    folder: data.folder,
                    id: data.id,
                    module: data.module,
                    attached: data.attached
                });
            switch (mode) {
            case 'view':
            case 'open':
                return url + '&delivery=view';
            case 'download':
                return url + '&delivery=download';
            default:
                return url;
            }
        },
        
        save: function (data, target) {
            //multiple does not work, because module overides module in params. So we need to do it one by one
            // be robust
            target = target || config.get('folder.infostore');
            
            http.PUT({
                module: 'infostore',
                params: {
                    action: 'saveAs',
                    folder: data.folder,
                    module: data.module,
                    attached: data.attached,
                    attachment: data.id
                },
                data: { folder_id: target, description: 'Saved task attachment' },
                appendColumns: false
            }).done(function () {
                require(['io.ox/files/api'], function (fileAPI) {
                    fileAPI.caches.all.grepRemove(target + '\t');
                    fileAPI.trigger('refresh.all');
                });
            });
        }
        
    };
    
    Events.extend(api);

    return api;
});
