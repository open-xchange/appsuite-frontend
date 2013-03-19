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

define('io.ox/contacts/util', ['gettext!io.ox/contacts'], function (gt) {

    'use strict';

    /**
     * Creates a result for get*Format functions which consists of a single
     * value.
     * @param {number} index The 1-based index of the value.
     * @param {String} value The value to return.
     * @type { format: string, params: [string] }
     * @result A result object for getFullNameFormat or getMailFormat.
     */
    function single(index, value) {
        var params = new Array(index);
        params[index - 1] = _.noI18n(value);
        return { format: _.noI18n('%' + index + '$s'), params: params };
    }
    
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

        // variant of getFullName without title, all lowercase
        getSortName: function (obj) {
            obj = _.extend({}, obj);
            obj.title = '';
            return this.getFullName(obj).toLowerCase();
        },
        
        /**
         * Computes the format of a displayed full name.
         * @param obj {Object} A contact object.
         * @type {
         *     format: string,
         *     params: [first_name, last_name, title, display_name]
         * }
         * @returns An object with a format
         * string and an array of replacements which can be used e.g. as
         * parameters to gettext.format to obtain the full name.
         */
        getFullNameFormat: function (obj) {
            // vanity fix
            function fix(field) {
                return (/^(dr\.?|prof\.?)/i).test(field) ? field : '';
            }
            // combine title, last_name, and first_name
            if (obj.last_name && obj.first_name) {
                var title = fix(obj.title);
                return title ? {
                    format:
                        //#. Name with title
                        //#. %1$s is the first name
                        //#. %2$s is the last name
                        //#. %3$s is the title
                        gt('%3$s %2$s, %1$s'),
                    params: [_.noI18n(obj.first_name), _.noI18n(obj.last_name),
                             _.noI18n(title)]
                } : {
                    format:
                        //#. Name without title
                        //#. %1$s is the first name
                        //#. %2$s is the last name
                        gt('%2$s, %1$s'),
                    params: [_.noI18n(obj.first_name), _.noI18n(obj.last_name)]
                };
            }
            
            // use existing display name?
            if (obj.display_name) {
                return single(4, String(obj.display_name).replace(/"|'/g, ''));
            }
            // fallback
            if (obj.last_name) return single(2, obj.last_name);
            if (obj.first_name) return single(1, obj.first_name);
            return { format: _.noI18n(''), params: [] };
        },
        
        getFullName: function (obj) {
            var fmt = this.getFullNameFormat(obj);
            return gt.format(fmt.format, fmt.params);
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

        /**
         * compute the format of a full name in mail context
         *
         * In mail context (and may be others), the full name is formated a
         * little different than in address book.
         *
         * @param obj {Object} a contact object with at least the attributes
         *      related to the name set
         *
         * @returns An object with a format
         * string and an array of replacements which can be used e.g. as
         * parameters to gettext.format to obtain the full name.
         */
        getMailFullNameFormat: function (obj) {
            //combine first name and last name
            if (obj.last_name && obj.first_name) {
                return {
                    //#. %1$s is the first name
                    //#. %2$s is the last name
                    format: gt('%1$s %2$s'),
                    params: [_.noI18n(obj.first_name), _.noI18n(obj.last_name)]
                };
            }

            // use existing display name?
            if (obj.display_name) {
                return single(4, String(obj.display_name).replace(/"|'/g, ''));
            }
            // fallback
            if (obj.last_name) { return single(2, obj.last_name); }
            if (obj.first_name) { return single(1, obj.first_name); }
            return { format: _.noI18n(''), params: [] };
        },

        getMailFullName: function (obj) {
            var fmt = this.getMailFullNameFormat(obj);
            return gt.format(fmt.format, fmt.params);
        },

        /**
         * Returns the mail as a format object similar to getFullnameFormat.
         * @param obj {Object} A contact object.
         * @type {
         *     format: string,
         *     params: [email1, email2, email3]
         * }
         * @returns An object with a format
         * string and an array of replacements which can be used e.g. as
         * parameters to gettext.format to obtain the full name.
         */
        getMailFormat: function (obj) {
            if (obj.email1) return single(1, obj.email1);
            if (obj.email2) return single(2, obj.email2);
            if (obj.email3) return single(3, obj.email3);
            return { format: _.noI18n(''), params: [] };
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
