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
     'io.ox/core/extensions'], function (gt, ext) {

    'use strict';

    var config = {
            dependencies: {},
            points: {},
            classes: {},
        };

    ext.point('io.ox/search/main/items').extend({
        id: 'dependencies',
        config: function (config) {
            var defaults = {
                mail: 'io.ox/mail/listview',
                tasks: 'io.ox/tasks/listview',
                contacts: 'io.ox/contacts/listview',
                calendar: 'io.ox/calendar/listview',
                files: 'io.ox/files/listview'
            };
            $.extend(config.dependencies, defaults);
        }
    });

    ext.point('io.ox/search/main/items').extend({
        id: 'points',
        config: function (config) {
            var defaults = {
                mail: 'io.ox/mail/listview/item/default',
                tasks: 'io.ox/tasks/listview/item',
                contacts: 'io.ox/contacts/listview/item',
                calendar: 'io.ox/calendar/listview/item',
                files: 'io.ox/files/listview/item'
            };
            $.extend(config.points, defaults);
        }
    });

    ext.point('io.ox/search/main/items').extend({
        id: 'classes',
        config: function (config) {
            var defaults = {
                tasks: 'task-item',
                contacts: 'contact-item',
                calendar: 'calendar-item',
                files: 'file-item'
            };
            $.extend(config.classes, defaults);
        }
    });

    //fetch config
    ext.point('io.ox/search/main/items').invoke('config', $, config);

    ext.point('io.ox/search/view/window').extend({
        id: 'results',
        index: 400,
        row: '0',
        draw: function (baton) {

            var self = this,
                items = baton.model.get('items'),
                module = baton.model.getModule(),
                nodes = [],
                row, cell;

            //create containers
            row = $('<div class="row result">').append(
                cell = $('<ul class="col-xs-12 list-unstyled">') //list-view
            );


            //require list view extensions points
            require([config.dependencies[module]], function () {

                items.each(function (model) {

                    var node = $('<li class="item">'),
                        item = model.get('data'),
                        baton = new ext.Baton({ data: item });

                    node.attr({
                        'data-id': model.get('id'),
                        'data-folder': model.get('folder'),
                        'data-app': model.get('application'),
                    });

                    //add app specific classes
                    if (module === 'mail') cell.addClass('mail-item');
                    node.addClass(config.classes[module] || '');

                    //draw item
                    ext.point(config.points[module]).invoke('draw', node, baton);
                    nodes.push(node);
                });

                //empty result
                if (items.timestamp && !items.length) {
                    nodes.push(
                        $('<list class="item">').append(
                            $('<div class="list-item-row">').append(
                                $('<div class="">').text(gt('No items found'))
                            )
                        )
                    );
                }

                //append to dom
                cell.append(nodes);

            });
            self.append(row);
        }
    });
});
