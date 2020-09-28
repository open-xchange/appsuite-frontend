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

define('io.ox/chat/util', [], function () {

    'use strict';

    var classNames = {
        'application/pdf': 'pdf',
        'image/svg': 'svg',
        'application/zip': 'zip',

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
            return classNames[mimetype];
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
