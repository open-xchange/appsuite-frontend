/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/print',
    ['io.ox/core/print',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'gettext!io.ox/contacts'], function (print, api, util, gt) {

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

    function process(data) {
        return {
            name: util.getFullName(data),
            sort_name: util.getSortName(data),
            where: getWhere(data),
            phone1: getPhone(data, 0),
            phone2: getPhone(data, 1),
            cellphone1: getCellPhone(data, 0),
            cellphone2: getCellPhone(data, 1)
        };
    }

    return {

        open: function (selection, win) {

            print.smart({

                get: function (obj) {
                    return api.get(obj);
                },

                i18n: {
                    phonelist: gt('Phone list'),
                    name: gt('Name') + ', ' + gt('Department') + ', ' + gt('City'),
                    phone: gt('Phone'),
                    cellphone: gt('Cell phone')
                },

                file: 'print.html',
                filter: function (o) {
                    // should have at least one phone number to appear on a phone list
                    return !!(o.phone1 || o.phone2 || o.cellphone1 || o.cellphone2);
                },
                process: process,
                selection: selection,
                selector: '.phonelist',
                sortBy: 'sort_name',
                window: win
            });
        }
    };
});
