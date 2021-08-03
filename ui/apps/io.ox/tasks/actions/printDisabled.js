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

define('io.ox/tasks/actions/printDisabled', [
    'gettext!io.ox/tasks'
], function (gt) {

    'use strict';

    return {
        multiple: function (list) {
            if (list.length === 1) {
                print.open('tasks', list[0], { template: 'infostore://12496', id: list[0].id, folder: list[0].folder_id || list[0].folder }).print();
            } else if (list.length > 1) {
                ox.load(['io.ox/core/http']).done(function (http) {
                    var win = print.openURL();
                    win.document.title = gt('Print tasks');
                    http.PUT({
                        module: 'tasks',
                        params: {
                            action: 'list',
                            template: 'infostore://12500',
                            format: 'template',
                            columns: '200,201,202,203,220,300,301,302,303,305,307,308,309,312,313,314,315,221,226',
                            timezone: 'UTC'
                        },
                        data: http.simplify(list)
                    }).done(function (result) {
                        var content = $('<div>').append(result),
                            head = $('<div>').append(content.find('style')),
                            body = $('<div>').append(content.find('.print-tasklist'));
                        win.document.write(head.html() + body.html());
                        win.print();
                    });
                });

            }
        }
    };
});
