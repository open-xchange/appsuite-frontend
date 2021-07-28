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

define('io.ox/calendar/settings/schedjoules/api', [
    'io.ox/core/folder/api',
    'io.ox/core/http',
    'settings!io.ox/calendar'
], function (folderAPI, http, settings) {

    var api = {

        get: function (obj) {

            return http.GET({
                module: 'chronos/schedjoules',
                params: obj === undefined ? { action: 'browse' } : { action: 'browse', id: obj.id, language: obj.language, country: obj.country }
            });
        },

        getLanguages: function () {
            return http.GET({
                module: 'chronos/schedjoules',
                params: { action: 'languages' }
            });
        },


        getCountries: function (lang) {
            return http.GET({
                module: 'chronos/schedjoules',
                params: { action: 'countries', language: lang }
            });
        },

        subscribeCalendar: function (obj) {
            // use folder api here to trigger events and have models in the pool
            return folderAPI.create('1', {
                module: 'event',
                subscribed: 1,
                title: obj.name,
                'com.openexchange.calendar.provider': 'schedjoules',
                'com.openexchange.calendar.config': {
                    'itemId': obj.itemId,
                    'refreshInterval': 10080,
                    'locale': obj.locale,
                    defaultAlarmDate: settings.get('chronos/defaultAlarmDate', []),
                    defaultAlarmDateTime: settings.get('chronos/defaultAlarmDateTime', [])
                }
            });
        }

    };

    return api;

});
