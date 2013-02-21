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

define('io.ox/contacts/util', [], function () {

    'use strict';

    return {

        getImage: function (obj, options) {
            if (obj.mark_as_distributionlist) {
                return ox.base + '/apps/themes/default/dummypicture_group.xpng';
            } else if (obj.image1_url) {
                return obj.image1_url
                    .replace(/^https?\:\/\/[^\/]+/i, '')
                    .replace(/\/ajax/, ox.apiRoot) + (options ? '&' + $.param(options) : '');
            } else {
                return ox.base + '/apps/themes/default/dummypicture.png';
            }

        },

        getFullName: function (obj) {
            // vanity fix
            function fix(field) {
                return (/^(dr\.?|prof\.?)/i).test(field) ? field : '';
            }
            // combine title, last_name, and first_name
            if (obj.last_name && obj.first_name) {
                return $.trim(fix(obj.title) + ' ' + obj.last_name + ', ' + obj.first_name);
            }
            // use existing display name?
            if (obj.display_name) {
                return String(obj.display_name).replace(/"|'/g, '');
            }
            // fallback
            return obj.last_name || obj.first_name || '';
        },

        getDisplayName: function (obj) {
            // use existing display name?
            if (obj.display_name) {
                return String(obj.display_name).replace(/"|'/g, '');
            }
            // combine last_name, and first_name
            if (obj.last_name && obj.first_name) {
                return obj.last_name + ', ' + obj.first_name;
            }
            // fallback
            return obj.last_name || obj.first_name || '';
        },

        getMail: function (obj) {
            // get the first mail address
            return (obj.email1 || obj.email2 || obj.email3 || '').toLowerCase();
        },

        getDescription: function (obj) {
            // try some combinations
            var list = _([obj.company, obj.department, obj.position, obj.city_business, obj.city_home]).compact();
            return list.length ? list.join(', ') : (obj.email1 || '');
        },

        getJob: function (obj) {
            // combine position and company
            return obj.position && obj.company ?
                obj.position + ', ' + obj.company :
                obj.position || obj.company || '';
        },

        nameSort: function (a, b) {
            var nameA, nameB;
            if (a.display_name === undefined) {
                nameA = a.mail;
            } else {
                nameA = a.display_name.toLowerCase();
            }

            if (b.display_name === undefined) {
                nameB = b.mail;
            } else {
                nameB = b.display_name.toLowerCase();
            }

            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0;
        },

        calcMailField: function (contact, selectedMail) {
            var field, mail;
            mail = [contact.email1, contact.email2, contact.email3];
            _.each(mail, function (val, key) {
                if (selectedMail === val) {
                    field = key + 1;
                }
            });
            return field;
        }
    };
});
