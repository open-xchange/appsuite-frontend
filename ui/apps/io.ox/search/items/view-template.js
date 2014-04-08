/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/items/view-template',
    ['gettext!io.ox/core',
     'io.ox/core/extensions',
     'io.ox/mail/listview',
     'io.ox/contacts/listview',
     'io.ox/calendar/listview',
     'io.ox/files/listview'
    ], function (gt, ext) {

    'use strict';

    ext.point('io.ox/search/view/window').extend({
        id: 'results',
        index: 400,
        row: '0',
        draw: function (baton) {

            var items = baton.model.get('items'),
                module = baton.model.getModule(),
                row, cell;

        //create containers
            row = $('<div class="row result">').append(
                cell = $('<ul class="col-xs-12 list-unstyled">') //list-view
            );

            // app-specific classes
            if (module === 'mail') cell.addClass('mail-item');

            items.each(function (model) {

                var tmp = $('<li class="item">'),
                    item = model.get('data'),
                    baton = new ext.Baton({ data: item });

                tmp.attr({
                    'data-id': model.get('id'),
                    'data-folder': model.get('folder'),
                    'data-app': model.get('application'),
                });

                switch (module) {
                case 'mail':
                    ext.point('io.ox/mail/listview/item/default').invoke('draw', tmp, baton);
                    break;
                case 'contacts':
                    tmp.addClass('contact-item');
                    ext.point('io.ox/contacts/listview/item').invoke('draw', tmp, baton);
                    break;
                case 'calendar':
                    tmp.addClass('calendar-item');
                    ext.point('io.ox/calendar/listview/item').invoke('draw', tmp, baton);
                    break;
                case 'tasks':
                    tmp.append(
                        $('<div class="line1">').text(item.title),
                        $('<div class="line2">').text(item.folder_id)
                    );
                    break;
                case 'files':
                    tmp.addClass('file-item');
                    ext.point('io.ox/files/listview/item').invoke('draw', tmp, baton);
                    break;
                }
                cell.append(tmp);
            });

            if (items.timestamp && !items.length) {
                cell.append(
                    $('<list class="item">').append(
                        $('<div class="list-item-row">').append(
                            $('<div class="">').text(gt('No items found'))
                        )
                    )
                );
            }

            this.append(row);
        }
    });
});
