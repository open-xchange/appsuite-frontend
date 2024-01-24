/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/search/items/view-template', [
    'gettext!io.ox/core',
    'io.ox/core/extensions'
], function (gt, ext) {

    'use strict';

    var config = {
        dependencies: {},
        points: {},
        classes: {}
    };

    ext.point('io.ox/search/main/items').extend({
        id: 'dependencies',
        config: function (config) {
            var defaults = {
                mail: ['io.ox/mail/listview', 'io.ox/mail/api'],
                tasks: ['io.ox/tasks/listview', 'io.ox/tasks/api'],
                contacts: ['io.ox/contacts/listview', 'io.ox/contacts/api'],
                calendar: ['io.ox/calendar/listview', 'io.ox/calendar/api'],
                files: ['io.ox/files/listview', 'io.ox/files/api']
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
                mail: 'list-item-content',
                tasks: 'task-item',
                contacts: 'contact-item',
                calendar: 'calendar-item',
                files: 'file-item'
            };
            $.extend(config.classes, defaults);
        }
    });

    // fetch config
    ext.point('io.ox/search/main/items').invoke('config', $, config);

    var refresh = _.debounce(function (e) {
        if (ox.ui.App.getCurrentApp().get('name') === 'io.ox/search') {
            if (e && e.data && e.data.trigger) {
                //jQuery event
                e.data.trigger('needs-refresh');
            } else {
                //backbone event
                this.trigger('needs-refresh');
            }
        }
        // hide sidepanel
        if (e && e.type && (e.type.indexOf('delete') >= 0 || e.type.indexOf('move') >= 0)) {
            $('.io-ox-sidepopup', '#io-ox-windowmanager-pane>.io-ox-search-window').detach();
        }
    }, 100);

    ext.point('io.ox/search/view/items').extend({
        id: 'results',
        index: 100,
        row: '0',
        draw: function (baton) {

            var self = this,
                items = baton.model.get('items'),
                module = baton.model.getModule(),
                events = 'refresh refresh.all refresh.list deleted-mails update delete change move',
                nodes = [],
                row, cell;

            // create containers
            row = $('<div class="row result">').append(
                // list-view
                cell = $('<ul class="col-xs-12 list-unstyled">')
            );

            // require list view extensions points
            var dep = [].concat(config.dependencies[module]).concat('less!io.ox/search/items/style');
            require(dep, function (view, api) {
                // ignore last element when greater than 'size' (only used to determine if more results exists)
                var last = items.length > baton.model.get('size') ? items.length - baton.model.get('extra') : items.length;
                if (api && api._events) {
                    //Backbone event hub
                    api.off(events, refresh);
                    api.on(events, refresh, items);
                } else if (api && api.events) {
                    //jQuery event hub
                    api.off(events, refresh);
                    api.on(events, items, refresh);
                }

                items.each(function (model, current) {

                    // do not show last item
                    if (last !== current) {
                        var node = $('<li class="item">'),
                            item = model.get('data'),
                            baton = new ext.Baton({ data: item });

                        if (api.pool && api.pool.Model) baton.model = new api.pool.Model(item);

                        node.attr({
                            'data-id': model.get('id'),
                            'data-folder': model.get('folder'),
                            'data-app': model.get('application')
                        });

                        // add app specific classes
                        if (module === 'mail') cell.addClass('mail-item');
                        node.addClass(config.classes[module] || '');

                        // draw item
                        ext.point(config.points[module]).invoke('draw', node, baton);
                        nodes.push(node);
                    }
                });

                // empty result
                if (items.timestamp && !items.length) {
                    nodes.push(
                        $('<list class="item">').append(
                            $('<div class="list-item-row">').append(
                                $('<div class="">').text(gt('No items found'))
                            )
                        )
                    );
                }

                // append to dom
                cell.append(nodes);

            });

            var elem = self.find('.row.result');
            if (elem.length) {
                elem.replaceWith(row);
            } else {
                self.append(row);
            }

            self.append(row);
        }
    });

    function draw(baton, detail, api, options) {
        var popup = this.busy();
        require([detail, api], function (view, api) {
            // render data with available data
            popup.idle().append(view.draw(baton.data, options));
            api.get(api.reduce(baton.data)).then(function (data) {
                // render again with get response if needed
                data = data.toJSON ? data.toJSON() : data;
                if (!_.isEqual(baton.data, data)) {
                    popup.empty().append(
                        view.draw(data, options)
                    );
                }
            });
        });
    }

    // register sidepanel details views
    ext.point('io.ox/search/view/items').extend({
        id: 'sidepanel',
        index: 200,
        row: '0',
        draw: function () {

            ext.point('io.ox/search/items/calendar').extend({
                draw: function (baton) {
                    draw.call(this, baton, 'io.ox/calendar/view-detail', 'io.ox/calendar/api', { deeplink: true });
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
                    // workaround: detach sidepopup the dirty way
                    $('.io-ox-sidepopup', '#io-ox-windowmanager-pane>.io-ox-search-window').detach();
                    require(['io.ox/core/viewer/main'], function (Viewer) {
                        var viewer = new Viewer();
                        viewer.launch({ files: [].concat(baton.data) });
                    });
                }
            });

            // special for mail
            ext.point('io.ox/search/items/mail').extend({
                draw: function (baton) {
                    var popup = this.busy();
                    require(['io.ox/mail/detail/view', 'io.ox/mail/api'], function (detail, api) {
                        // render data with available data
                        var view = new detail.View({ data: baton.data });
                        popup.idle().append(
                            view.render().expand().$el.addClass('no-padding')
                        );
                        api.get(api.reduce(baton.data)).then(function (data) {
                            // render again with get response
                            if (!_.isEqual(baton.data, data)) {
                                var view = new detail.View({ data: data }, { deeplink: true });
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
