/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/files/upload/main', [
    'io.ox/files/legacy_api',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (api, notifications, gt) {

    'use strict';

    var self = {},
        limits = [
            {
                limit: 1000,
                singular: function (t) {
                    return gt('%1$s second', t);
                }, plural: function (t) {
                    return gt('%1$s seconds', t);
                }
            },
            {
                limit: 60,
                singular: function (t) {
                    return gt('%1$s minute', t);
                }, plural: function (t) {
                    return gt('%1$s minutes', t);
                }
            },
            {
                limit: 60,
                singular: function (t) {
                    return gt('%1$s hour', t);
                }, plural: function (t) {
                    return gt('%1$s hours', t);
                }
            },
            {
                limit: 24,
                singular: function (t) {
                    return gt('%1$s day', t);
                }, plural: function (t) {
                    return gt('%1$s days', t);
                }
            },
            {
                limit: 7,
                singular: function (t) {
                    return gt('%1$s week', t);
                }, plural: function (t) {
                    return gt('%1$s weeks', t);
                }
            }
        ],
        totalProgress = 0,
        totalSize = 0, //accumulated size of all files
        currentSize = 0, //number of bytes, which are currently uploaded
        startTime, // time stamp, when the first file started uploading
        UploadFile = Backbone.Model.extend({
            defaults: {
                file: null,
                progress: 0,
                request: null,
                loaded: 0,
                abort: false
            }
        }),
        UploadCollection = Backbone.Collection.extend({
            model: UploadFile
        }),
        uploadCollection = new UploadCollection();

    self.changed = function (item, position, files) {
        var uploadFiles = files.slice(uploadCollection.length, files.length)
            .map(function (fileContainer) {
                return new UploadFile({ file: fileContainer.file, progress: 0 });
            });

        //setup initial time, if uploadCollection was empty
        if (uploadCollection.length === 0) {
            startTime = new Date().getTime();
        }
        uploadCollection.add(uploadFiles);

        //update the total size for time estimation
        totalSize = 0;
        uploadCollection.each(function (model) {
            totalSize += model.get('file').size;
        });
    };

    self.progress = function (item, position, files) {
        var model = uploadCollection.at(position),
            request = api.uploadFile(
                _.extend({ file: item.file }, item.options)
            )
            .progress(function (e) {
                // update progress
                var sub = e.loaded / e.total;

                if (model) {
                    var loaded = model.get('loaded');
                    model.set({ progress: sub,  loaded: e.loaded });

                    currentSize += e.loaded - loaded;
                }

                totalProgress = (position + sub) / files.length;

                //update uploaded size for time estimation
                uploadCollection.trigger('progress', {
                    progress: self.getTotalProgress(),
                    estimatedTime: self.getEstimatedTime()
                });
            })
            .fail(function (e) {
                model.set({ abort: true });
                remove(position, model);

                if (e && e.data && e.data.custom && e.error !== '0 abort') {
                    notifications.yell(e.data.custom.type, e.data.custom.text);
                }
            });

        uploadCollection.at(position).set({ request: request });

        return request;
    };

    self.stop = function () {
        api.trigger('refresh.all');
        totalProgress = 0;
        currentSize = 0;
        uploadCollection.reset();
    };

    self.getTotalProgress = function () {
        return totalProgress;
    };

    self.getEstimatedTime = function () {
        var time = new Date().getTime() - startTime,
            progress = Math.min(1, currentSize / totalSize),
            estimation = time / progress - time || 0,
            counter = 0;

        do {
            estimation = Math.round(estimation / limits[counter].limit);
            counter++;
        } while (counter < limits.length && limits[counter].limit < estimation);

        return (estimation == 1 ? limits[counter - 1].singular(estimation) : limits[counter - 1].plural(estimation)) || 0;
    };

    self.abort = function (index) {
        var model = uploadCollection.at(index),
            request = model.get('request');

        if (model !== undefined) {
            if (request === null) {
                //remove the model from the list
                model.set({ abort: true });
                remove(index, model);
            } else if (request.state() === 'pending') {
                //abort the upload process
                request.abort();
            }
        }
    };

    function remove(index, model) {
        currentSize -= model.get('loaded');
        totalSize -= model.get('file').size;
        uploadCollection.remove(model);
    }

    self.collection = uploadCollection;

    return self;
});
