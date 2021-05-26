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

define('io.ox/core/extPatterns/dnd', [
    'io.ox/core/extensions',
    'io.ox/core/tk/upload'
], function (ext, upload) {

    'use strict';

    // wrapper to create full size DropZones and DropHandlers via ext points
    var UploadZone = function (options) {

        var args = $.makeArray(arguments).slice(1),
            point = ext.point(options.ref),
            included = false,
            dropZone;

        function handleDrop(event, extensionId, file, action) {
            if (!action.extension || !action.extension.action) return;
            action.extension.action.apply(action.extension, [file].concat(args));
        }

        function handleMultiDrop(e, action, files) {
            if (!action.extension || !action.extension.multiple) return;
            action.extension.multiple.apply(action.extension, [files].concat(args));
        }

        function initDropZone() {
            var actions = [];

            if (included && dropZone) dropZone.remove();

            if (dropZone) {
                dropZone.off('drop', handleDrop);
                dropZone.off('drop', handleMultiDrop);
            }

            point.each(function (ext) {
                if (ext.isEnabled && !ext.isEnabled.apply(ext, args)) return;

                actions.push({
                    id: ext.id,
                    label: ext.metadata('label', args),
                    extension: ext
                });
            });

            dropZone = upload.dnd.createDropZone({
                type: 'multiple',
                actions: actions
            });

            if (dropZone && _.isFunction(dropZone.on)) {
                // temp. fix: avoids strange opera runtime error
                dropZone.on('drop', handleDrop);
                dropZone.on('drop-multiple', handleMultiDrop);
            }

            if (included && dropZone.include) dropZone.include();
        }

        initDropZone();

        point.on('extended', initDropZone);

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
