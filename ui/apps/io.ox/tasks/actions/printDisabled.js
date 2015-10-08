/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
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
