/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/print', [
    'io.ox/core/print',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'settings!io.ox/contacts',
    'gettext!io.ox/contacts'
], function (print, api, util, settings, gt) {

    'use strict';

    function getWhere(data) {
        return _([data.department, data.city_business]).compact().join(', ');
    }

    function getPhone(data, index) {
        return _([data.telephone_business1, data.telephone_business2, data.telephone_company, data.telephone_home1, data.telephone_home2]).compact()[index] || '';
    }

    function getCellPhone(data, index) {
        return _([data.cellular_telephone1, data.cellular_telephone2]).compact()[index] || '';
    }

    function getEmail(data, index) {
        return _([data.email1, data.email2, data.email3]).compact()[index] || data.mail || '';
    }

    function getDistributionList(data) {
        if (!data.mark_as_distributionlist) return '';
        var list = _(data.distribution_list || []), hash = {};
        return _(list)
        .chain()
        .compact()
        .filter(function (member) {
            if (hash[member.mail]) {
                return false;
            }
            return (hash[member.mail] = true);
        })
        .map(function (member) {
            return (member.display_name ? ' "' + member.display_name + '"' : ' ') + '\u0020<' + member.mail + '>';
        }).value();
    }

    function process(data, index, options) {
        return {
            original: data,
            name: util.getFullName(data) || '-',
            sort_name: util.getSortName(data),
            where: getWhere(data),
            phone1: getPhone(data, 0),
            phone2: getPhone(data, 1),
            cellphone1: getCellPhone(data, 0),
            cellphone2: getCellPhone(data, 1),
            email1: getEmail(data, 0),
            email2: getEmail(data, 1),
            email3: getEmail(data, 2),
            isDistributionList: api.looksLikeDistributionList(data),
            distributionList: getDistributionList(data),
            thumbIndex: options.thumbIndex
        };
    }

    function createThumbIndex() {
        var current = '', fn;
        fn = function (name) {
            name = String(name).substr(0, 1).toUpperCase();
            if (name === current) {
                return false;
            }
            current = name;
            return true;
        };
        fn.get = function () {
            return current;
        };
        return fn;
    }

    return {

        open: function (selection, win) {

            var listType = settings.get('features/printList', 'phone');

            var options = {
                get: function (obj) {
                    return api.get(obj);
                },

                title: selection.length === 1 ? selection[0].display_name : undefined,

                i18n: {
                    phonelist: gt('Phone list'),
                    name: gt('Name') + ', ' + gt('Department') + ', ' + gt('City'),
                    phone: gt('Phone'),
                    cellphone: gt('Cell phone'),
                    email: gt('Email'),
                    filtered: function (n) {
                        return gt.format(gt.ngettext(
                            'Note: One contact is not shown due to missing phone numbers',
                            'Note: %1$d contacts are not shown due to missing phone numbers',
                            n
                        ), n);
                    },
                    notPrinted: gt('This note will not be printed')
                },

                process: process,
                selection: selection,
                selector: listType === 'phone' ? '.phonelist' : '.contacts',
                sortBy: 'sort_name',
                window: win,

                thumbIndex: createThumbIndex()
            };

            if (listType === 'phone') {
                options.filter = function (o) {
                    // ignore distribution lists plus
                    // contacts should have at least one phone number to appear on a phone list
                    return !o.mark_as_distributionlist && !!(o.phone1 || o.phone2 || o.cellphone1 || o.cellphone2);
                };
            }

            print.smart(options);
        }
    };
});
