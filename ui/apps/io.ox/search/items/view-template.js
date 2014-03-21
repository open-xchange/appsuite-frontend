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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/items/view-template',
    ['gettext!io.ox/core',
     'io.ox/core/extensions',
     'io.ox/search/items/register'
    ], function (gt, ext) {

    'use strict';

    ext.point('io.ox/search/view/window').extend({
        id: 'results',
        index: 400,
        row: '0',
        draw: function (baton) {
            var node = $('<div class="col-lg-12 result">'),
                data = baton.model.get('items');

            data.each(function (model) {
                var tmp = $('<div class="item">'),
                    item = model.get('data');

                tmp.attr({
                    'data-id': model.get('id'),
                    'data-folder': model.get('folder'),
                    'data-app': model.get('application'),
                });

                switch (baton.model.getModule()) {
                case 'mail':
                    tmp.append(
                        $('<div class="line1">').text(item.from[0][0] || item.from[0][1]),
                        $('<div class="line1">').text('(' + item.id + ') ' + item.subject)
                    );
                    break;
                case 'contacts':
                    tmp.append(
                        $('<div class="line1">').text('(' + item.id + ') ' + item.display_name),
                        $('<div class="line1">').text(item.email1)
                    );
                    break;
                case 'tasks':
                    tmp.append(
                        $('<div class="line1">').text('(' + item.id + ') ' + item.title),
                        $('<div class="line1">').text('folder: ' + item.folder_id)
                    );
                    break;
                case 'infostore':
                    tmp.append(
                        $('<div class="line1">').text('please define in search/view-template.js'),
                        $('<div class="line1">').text('')
                    );
                    break;
                case 'calendar':
                    tmp.append(
                        $('<div class="line1">').text('(' + item.id + ') ' + item.title),
                        $('<div class="line1">').text('folder: ' + item.folder_id)
                    );
                    break;
                }
                node.append(tmp);

            });

            if (!data.length) {
                node.append(
                    $('<div class="item">').append(
                        $('<div class="line1">').text('No results')
                    )
                );
            }
            this.append(node);
        }
    });

    //just used to clean up the view class
    return null;
});
