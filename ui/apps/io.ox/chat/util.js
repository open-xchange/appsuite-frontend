/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/chat/util', ['gettext!io.ox/chat'], function (gt) {

    'use strict';

    var classNames = {
        'application/pdf': 'pdf',
        'image/svg': 'svg',
        'application/zip': 'zip',
        'text/plain': 'txt',

        // images
        'image/jpeg': 'image',
        'image/gif': 'image',
        'image/bmp': 'image',
        'image/png': 'image',

        // documents
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.template': 'doc',
        'application/msword': 'doc',

        // excel
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.template': 'xls',
        'application/vnd.ms-excel': 'xls',

        // ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.slideshow': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.template': 'ppt',
        'application/vnd.ms-powerpoint': 'ppt'
    };

    var fileTypeNames = {
        'application/pdf': 'PDF',
        'image/svg': 'SVG',
        'application/zip': 'ZIP',
        'text/plain': gt('Text file'),

        // images
        'image/jpeg': 'JPEG',
        'image/gif': 'GIF',
        'image/bmp': 'BMP',
        'image/png': 'PNG',

        // documents
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': gt('Text document'),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.template': gt('Text document'),
        'application/msword': gt('Text document'),

        // excel
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': gt('Excel document'),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.template': gt('Excel document'),
        'application/vnd.ms-excel': 'Excel document',

        // ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': gt('Presentation'),
        'application/vnd.openxmlformats-officedocument.presentationml.slideshow': gt('Presentation'),
        'application/vnd.openxmlformats-officedocument.presentationml.template': gt('Presentation'),
        'application/vnd.ms-powerpoint': gt('Presentation')
    };

    var util = {

        getDeliveryStateClass: function (deliveryState) {
            if (!deliveryState) return '';
            if (deliveryState.state) return deliveryState.state;
            var members = Object.keys(deliveryState);
            return members.reduce(function (memo, email) {
                var state = deliveryState[email].state;
                if (!state) return '';
                if (state === 'server' && memo !== '') return 'server';
                if (state === 'received' && memo === 'seen') return 'received';
                return memo;
            }, 'seen');
        },

        getClassFromMimetype: function (mimetype) {
            return classNames[mimetype] || 'file';
        },

        getFileTypeName: function (mimetype, fileName) {
            var name = fileTypeNames[mimetype];
            if (name) return name;

            name = fileName.split('.').length > 1 && fileName.split('.').pop().toUpperCase();
            return name || gt('File');
        },

        renderFile: function (file) {
            if (!file) return;
            return [
                $('<i class="fa icon" aria-hidden="true">').addClass(util.getClassFromMimetype(file.mimetype)),
                $('<span class="name">').text(file.name)
            ];
        },

        strings: {
            compare: function (a, b) {
                if (a.length < b.length) return -1;
                if (a.length > b.length) return 1;
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            },
            greaterThan: function (a, b) {
                return util.strings.compare(a, b) > 0;
            }
        },

        isFile: function (obj) {
            if (obj instanceof File) return true;
            if (typeof obj.name === 'string' && obj.type) return true;
            return false;
        },

        makeFormData: function (attr) {
            var formData = new FormData();

            _.each(attr, function (value, key) {
                if (_.isUndefined(value)) return;

                if (_.isArray(value)) {
                    value.forEach(function (val, index) {
                        formData.append(key + '[' + index + ']', val);
                    });
                    return;
                }

                if (_.isObject(value) && !util.isFile(value)) {
                    value = JSON.stringify(value);
                }

                formData.append(key, value);
            });

            return formData;
        }

    };

    return util;

});
