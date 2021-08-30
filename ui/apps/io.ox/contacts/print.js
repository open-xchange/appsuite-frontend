/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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

    var printContacts = {

        getOptions: function (selection, win) {
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
                        return gt.ngettext(
                            'Note: %1$d contact is not shown due to missing phone numbers',
                            'Note: %1$d contacts are not shown due to missing phone numbers',
                            n, n
                        );
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

            return options;
        },

        open: function (selection, win) {
            print.smart(printContacts.getOptions(selection, win));
        }
    };

    return printContacts;
});
