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

    ext.point('io.ox/search/view/items').extend({
        id: 'results',
        index: 100,
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
            var dep = [config.dependencies[module]].concat('less!io.ox/search/items/style');
            require(dep, function () {
                //ignore last element when greater than 'size' (only used to determine if more results exists)
                var last = items.length > baton.model.get('size') ? items.length - baton.model.get('extra') : items.length;

                items.each(function (model, current) {

                    //do not show last item
                    if (last !== current) {
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
                    }
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

    function draw(baton, detail, api) {
        var popup = this.busy();
        require([detail, api], function (view, api) {
            //render data with available data
            popup.idle().append(view.draw(baton.data));
            api.get(baton.data).then(function (data) {
                //render again with get response if needed
                if (!_.isEqual(baton.data, data)) {
                    popup.empty().append(view.draw(data));
                }
            });
        });
    }

    //register sidepanel details views
    ext.point('io.ox/search/view/items').extend({
        id: 'sidepanel',
        index: 200,
        row: '0',
        draw: function () {

            ext.point('io.ox/search/items/calendar').extend({
                draw: function (baton) {
                    draw.call(this, baton, 'io.ox/calendar/view-detail', 'io.ox/calendar/api');
                }
            });

            ext.point('io.ox/search/items/contacts').extend({
                draw: function (baton) {
                    draw.call(this, baton, 'io.ox/contacts/view-detail', 'io.ox/contacts/api');
                }
            });

            ext.point('io.ox/search/items/tasks').extend({
                draw: function (baton) {
                    draw.call(this, baton, 'io.ox/tasks/view-detail', 'io.ox/tasks/api');
                }
            });

            ext.point('io.ox/search/items/files').extend({
                draw: function (baton) {
                    draw.call(this, baton, 'io.ox/files/fluid/view-detail', 'io.ox/files/api');
                }
            });

            //special for mail
            ext.point('io.ox/search/items/mail').extend({
                draw: function (baton) {
                    var popup = this.busy();
                    require(['io.ox/mail/detail/view', 'io.ox/mail/api'], function (detail, api) {
                        //render data with available data
                        var view = new detail.View({ data: baton.data });
                        popup.idle().append(
                            view.render().expand().$el.addClass('no-padding')
                        );
                        api.get(baton.data).then(function (data) {
                            //render again with get response
                            if (!_.isEqual(baton.data, data)) {
                                var view = new detail.View({ data: data });
                                popup.idle().empty().append(
                                    view.render().expand().$el.addClass('no-padding')
                                );
                            }
                        });
                    });
                }
            });

        }
    });

});
