/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/core/extPatterns/dnd", ["io.ox/core/extensions", "io.ox/core/tk/upload"], function (ext, upload) {

    "use strict";

    var UploadZone = function () {
        var dropZone, point, included = false, args = $.makeArray(arguments), options = args.shift();

        point = ext.point(options.ref);

        function handleDrop(event, extensionId, file, action) {
            var newArgs = [file];
            _(args).each(function (arg) {
                newArgs.push(arg);
            });
            if (action.extension && action.extension.action) {
                action.extension.action.apply(action.extension, newArgs);
            }
        }

        function handleMultiDrop(e, action, files) {
            if (action.extension && action.extension.multiple) {
                action.extension.multiple.apply(action.extension, [files].concat(args));
            }
        }

        function initDropZone() {
            var actions = [];

            if (included) {
                dropZone.remove();
            }

            if (dropZone) {
                dropZone.off("drop", handleDrop);
            }

            point.each(function (ext) {
                if (ext.isEnabled && ! ext.isEnabled.apply(ext, args)) {
                    return;
                }

                actions.push({
                    id: ext.id,
                    label: ext.metadata("label", args),
                    extension: ext
                });
            });

            dropZone = upload.dnd.createDropZone({
                type: 'multiple',
                actions: actions
            });

            dropZone.on("drop", handleDrop);
            dropZone.on("drop-multiple", handleMultiDrop);

            if (included) {
                dropZone.include();
            }
        }

        initDropZone();

        point.on("extended", initDropZone);

        this.update = function () {
            initDropZone();
        };

        this.include = function () {
            dropZone.include();
            included = true;
        };

        this.remove = function () {
            dropZone.remove();
            included = false;
        };
    };


    return {
        UploadZone: UploadZone
    };
});
