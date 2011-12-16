/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/util',
        ['gettext!io.ox/contacts/contacts', 'io.ox/core/tk/selection'
         ], function (gt, sel) {

    'use strict';

    return {

        getImage: function (obj) {
            return obj.image1_url ?
                obj.image1_url
                    .replace(/^https?\:\/\/[^\/]+/i, '')
                    .replace(/\/ajax/, ox.apiRoot) :
                ox.base + '/apps/themes/default/dummypicture.png';
        },

        getFullName: function (obj) {
            // vanity fix
            function fix(field) {
                return (/^(dr\.|prof\.|prof\. dr\.)$/i).test(field) ? field : '';
            }
            // combine title, last_name, and first_name
            return obj.last_name && obj.first_name ?
                $.trim(fix(obj.title) + ' ' + obj.last_name + ', ' + obj.first_name) :
                (obj.display_name || '').replace(/"|'/g, '');
        },

        createDisplayName: function (obj) {
            if (!obj.first_name) {
                obj.first_name = 'undefined';
            }
            if (!obj.last_name) {
                obj.last_name = 'undefined';
            }
            obj.display_name = obj.first_name + ',' + obj.last_name;
            return obj.display_name;
        },

        getDisplayName: function (obj) {
            // combine last_name, and first_name
            return obj.last_name && obj.first_name ?
                obj.last_name + ', ' + obj.first_name :
                (obj.display_name || '').replace(/"|'/g, '');
        },

        getMail: function (obj) {
            // get the first mail address
            return obj.email1 || obj.email2 || obj.email3 || '';
        },

        getJob: function (obj) {
            // combine position and company
            return obj.position && obj.company ?
                obj.position + ', ' + obj.company :
                obj.position || obj.company || '';
        },

        createEditPage: function (obj) {
            require(['io.ox/contacts/edit/main'], function (u) {
                u.getApp(obj).launch();
            });
        }
    };
});
