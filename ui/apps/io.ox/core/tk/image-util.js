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

define('io.ox/core/tk/image-util', [
    'io.ox/contacts/widgets/exif'
], function (exifread) {

    function onMessage(e) {
        try {
            self[e.data.name](e.data.args, function (error, result) {
                if (error) return self.postMessage({ id: e.data.id, error: error });
                self.postMessage({ id: e.data.id, result: result });
            });
        } catch (error) {
            self.postMessage({ id: e.data.id, error: error.toString() });
        }
    }

    function PromiseWorker(obj) {
        var URL = window.URL || window.webkitURL,
            args = _(obj).map(function (value, key) {
                var content = value.toString(),
                    name = value.name || (content.match(/^function\s*([^\s(]+)/) || [])[1];
                if (!name || name === key) return 'var ' + key + ' = ' + content;
                return 'var ' + key + ' = ' + name + ' = ' + content;
            }),
            script = args.join('\n') + '\n' + 'self.onmessage = ' + onMessage.toString(),
            blob;

        try {
            blob = new Blob([script], { type: 'application/javascript' });
        } catch (e) {
            // fallback to BlobBuilder, especially for mobile browsers
            window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
            blob = new window.BlobBuilder();
            blob.append(script);
            blob = blob.getBlob();
        }
        this.promises = {};
        this.worker = new Worker(URL.createObjectURL(blob));
        this.worker.addEventListener('message', function (e) {
            var data = e.data,
                id = data.id;
            if (!this.promises[id]) return;
            if (data.error) this.promises[id].reject(data.error);
            else this.promises[id].resolve(data.result);
            delete this.promises[id];
        }.bind(this));
    }

    _.extend(PromiseWorker.prototype, {
        invoke: function (name, args) {
            var id = _.uniqueId();
            this.promises[id] = new $.Deferred();
            this.worker.postMessage({ id: id, name: name, args: args });
            return this.promises[id].promise();
        }
    });

    return {

        PromiseWorker: PromiseWorker,

        getImageFromFile: (function () {

            function readFile(file, callback) {
                var fileReader = new FileReader();
                fileReader.onload = function () {
                    callback(null, fileReader.result);
                };
                fileReader.onerror = callback;
                fileReader.readAsDataURL(file);
            }

            function getImageFallback(fileReaderResult, callback) {
                var img = new Image();
                img.onload = function () {
                    callback(null, img);
                };
                img.onerror = callback;
                img.src = fileReaderResult;
            }

            function getImage(file, callback) {
                self.createImageBitmap(file).then(function (img) {
                    callback(null, img);
                }, function (error) {
                    callback(error);
                });
            }

            var worker = new PromiseWorker({ getImage: getImage, readFile: readFile }),
                cache = [];

            return function getImageFromFile(file, opt) {
                opt = _.extend({ exif: false }, opt);
                var promise = _(cache).find(function (obj) {
                    if (obj.file !== file) return;
                    if (opt.exif && !obj.exif) return;
                    return true;
                });

                // early exit if image is in cache
                if (promise) return promise.promise;

                if (!opt.exif && self.createImageBitmap) {
                    promise = worker.invoke('getImage', file);
                } else {
                    var exif;
                    promise = worker.invoke('readFile', file).then(function (result) {
                        if (opt.exif) exif = exifread.getOrientation(result);

                        if (self.createImageBitmap) return worker.invoke('getImage', file);

                        var def = new $.Deferred();
                        getImageFallback(result, function (error, size) {
                            if (error) def.reject(error);
                            def.resolve(size);
                        });
                        return def;
                    }).then(function (img) {
                        if (exif) img.exif = exif;
                        return img;
                    });
                }

                // store in cache for 10 seconds
                var obj = { file: file, exif: opt.exif, promise: promise };
                _.delay(function () {
                    cache = _(cache).without(obj);
                }, 10000);
                cache.push(obj);

                return promise;
            };

        }())

    };

});
