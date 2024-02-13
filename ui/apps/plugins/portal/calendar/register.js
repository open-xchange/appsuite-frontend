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

define('plugins/portal/calendar/register', [
    'io.ox/core/extensions',
    'io.ox/calendar/api',
    'io.ox/core/folder/api',
    'io.ox/calendar/util',
    'gettext!plugins/portal',
    'settings!io.ox/calendar',
    'less!io.ox/calendar/style'
], function (ext, api, folderAPI, util, gt, settings) {

    'use strict';

    var EventsView = Backbone.View.extend({

        tagName: 'ul',

        className: 'content list-unstyled',

        initialize: function () {
            this.listenTo(this.collection, 'add remove change', this.render);
        },

        render: function () {
            var numOfItems = _.device('smartphone') ? 5 : 10;
            this.$el.empty();
            this.collection
                .chain()
                .filter(function (model) {
                    // use endDate instead of startDate so current appointments are shown too
                    return model.getTimestamp('endDate') > _.now();
                })
                .first(numOfItems)
                .each(function (model) {
                    var declined = util.getConfirmationStatus(model) === 'DECLINED';
                    if (declined && !settings.get('showDeclinedAppointments', false)) return;

                    // show in user's timezone
                    var start = model.getMoment('startDate').tz(moment().tz()),
                        end = model.getMoment('endDate').tz(moment().tz()),
                        date = start.calendar(null, { sameDay: '[' + gt('Today') + ']', nextDay: '[' + gt('Tomorrow') + ']', nextWeek: 'dddd', sameElse: 'L' }),
                        startTime = start.format('LT'),
                        endTime = end.format('LT'),
                        isAllday = util.isAllday(model);
                    this.$el.append(
                        $('<li class="item" tabindex="0">')
                        .addClass(declined ? 'declined' : '')
                        .data('item', model)
                        .append(
                            $('<div class="clearfix">').append(
                                $('<div class="pull-right">').text(date),
                                $('<div class="bold ellipsis summary">').text(model.get('summary') || '')
                            ),
                            $('<div class="clearfix second-row">').css('margin-top', '-2px').append(
                                $('<div class="accent pull-right">').text(
                                    isAllday ? gt('All day') : startTime + ' - ' + endTime
                                ),
                                $('<div class="gray ellipsis location">').text(model.get('location') || '')
                            )
                        )
                    );
                }, this)
                .value();

            return this;
        }

    });

    function getRequestParams() {

        return {
            start: moment().startOf('day').valueOf(),
            end: moment().startOf('day').add(1, 'month').valueOf()
        };
    }

    function reload(baton) {
        require(['io.ox/portal/main'], function (portal) {
            // force refresh
            baton.collection.expired = true;
            portal.getApp().refreshWidget(baton.model, 0);
        });
    }

    ext.point('io.ox/portal/widget/calendar').extend({

        title: gt('Appointments'),

        initialize: function (baton) {
            baton.collection = api.getCollection(getRequestParams());
            api.on('refresh.all update create delete move', function () { reload(baton); });
        },

        load: function (baton) {
            var def = new $.Deferred();

            baton.collection.sync();
            baton.collection
                .once('load', function () {
                    def.resolve();
                    this.off('load:fail');
                })
                .once('load:fail', function (error) {
                    def.reject(error);
                    this.off('load');
                });

            return def;
        },

        summary: function (baton) {
            if (this.find('.summary').length) return;

            this.addClass('with-summary show-summary');
            var sum = $('<div>').addClass('summary'),
                model = baton.collection && baton.collection.first();

            if (!model) {
                sum.text(gt('You don\'t have any appointments in the near future.'));
            } else {
                util.getEvenSmarterDate(model, true);
                sum.append(
                    $('<span class="normal accent">').text(util.getEvenSmarterDate(model, true)), $.txt('\u00A0'),
                    $('<span class="bold">').text(model.get('summary') || ''), $.txt('\u00A0'),
                    $('<span class="gray">').text(model.get('location') || '')
                );

                this.on('tap', 'h2', function (e) {
                    $(e.delegateTarget).toggleClass('show-summary');
                });
            }

            this.append(sum);
        },

        preview: function (baton) {
            // use endDate instead of startDate so current appointments are shown too
            var collection = baton.collection.filter(function (model) { return model.getTimestamp('endDate') > _.now(); });

            if (collection.length === 0) {
                this.append(
                    $('<ul class="content list-unstyled">').append(
                        $('<li class="line">')
                        .text(gt('You don\'t have any appointments in the near future.'))
                    )
                );
            } else {
                this.append(new EventsView({
                    collection: baton.collection
                }).render().$el);
            }
        },

        draw: function (baton) {
            var popup = this.busy();
            require(['io.ox/calendar/view-detail'], function (view) {
                // model might contain only list request data yet. So get full appointment data
                api.get(baton.item).then(function (model) {
                    popup.idle().append(view.draw(model.toJSON(), { deeplink: true }));
                }, function (error) {
                    popup.close();
                    require(['io.ox/core/yell'], function (yell) {
                        yell(error);
                    });
                });
            });
        },

        post: function (ext) {
            var self = this;
            api.on('refresh.all', function () {
                ext.load().done(_.bind(ext.draw, self));
            });
        }
    });

    ext.point('io.ox/portal/widget/calendar/settings').extend({
        title: gt('Appointments'),
        type: 'calendar',
        editable: false,
        unique: true
    });

});
