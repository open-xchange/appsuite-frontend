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

define('io.ox/mail/statistics', [
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/mail',
    'static/3rd.party/Chart.min.js'
], function (api, accountAPI, ext, ModalDialog, gt, Chart) {

    'use strict';

    var INDEX = 100;

    ext.point('io.ox/mail/statistics').extend({
        id: 'folder-statistic-from',
        index: INDEX += 100,
        draw: function (baton) {
            var node = $('<section>').busy();
            baton.statistics.sender(node, { folder: baton.folder });
            this.append(node);
        }
    });

    ext.point('io.ox/mail/statistics').extend({
        id: 'folder-statistic-weekday',
        index: INDEX += 100,
        draw: function (baton) {
            var node = $('<section>').busy();
            baton.statistics.weekday(node, { folder: baton.folder });
            this.append(node);
        }
    });

    ext.point('io.ox/mail/statistics').extend({
        id: 'folder-statistic-hour',
        index: INDEX += 100,
        draw: function (baton) {
            var node = $('<section>').busy();
            baton.statistics.hour(node, { folder: baton.folder });
            this.append(node);
        }
    });

    var COLUMNS = '603,604,610,661',
        WIDTH = _.device('smartphone') ? 280 : 500,
        HEIGHT = _.device('smartphone') ? 150 : 200;

    function createCanvas() {
        return $('<canvas>').attr({ width: WIDTH, height: HEIGHT }).css({ width: WIDTH, height: HEIGHT });
    }

    function createLineChart(canvas, data) {
        var ctx = canvas.get(0).getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                legend: { display: false },
                tooltips: { enabled: false },
                elements: {
                    line: {
                        backgroundColor: 'rgba(0, 136, 204, 0.15)',
                        borderColor: 'rgba(0, 136, 204, 0.80)',
                        borderWidth: 2
                    },
                    point: {
                        backgroundColor: 'rgba(0, 136, 204, 1)',
                        borderColor: '#fff',
                        radius: 4
                    }
                }
            }
        });
    }

    var fetch = (function () {
        // hash of deferred objects
        var hash = {};

        return function (options) {
            var cid = JSON.stringify(options);

            if (!hash[cid] || hash[cid].state() === 'rejected') {
                hash[cid] = api.getAll({ folder: options.folder, columns: COLUMNS }, false);
            }

            return hash[cid].promise();
        };

    }());

    return {
        sender: function (node, options) {
            var canvas = createCanvas(),
                isSent = accountAPI.is('sent', options.folder);

            node.append(
                $('<h2>').text(
                    isSent ? gt('Top 10 you sent mail to') : gt('Top 10 you got mail from')
                ),
                canvas
            );

            fetch({ folder: options.folder, columns: COLUMNS }).then(
                function success(data) {

                    var who = {}, attr = isSent ? 'to' : 'from';

                    _(data).each(function (obj) {
                        var mail = String((obj[attr] && obj[attr][0] && obj[attr][0][1]) || '').toLowerCase();
                        who[mail] = (who[mail] || 0) + 1;
                    });

                    data = _(who).chain()
                        .pairs()
                        .sortBy(function (obj) { return -obj[1]; })
                        // as we want the highest numbers
                        .first(10)
                        .value();

                    node.idle();

                    createLineChart(canvas, {
                        labels: '1 2 3 4 5 6 7 8 9 10'.split(' '),
                        datasets: [{ data: _(data).pluck(1) }]
                    });

                    node.append(
                        $('<ol>').append(
                            _(data).map(function (obj) {
                                return $('<li>').append(
                                    $('<a href="#" class="halo-link">')
                                    .data({ email1: obj[0], side: 'right' }).text(obj[0] + ' (' + obj[1] + ')')
                                );
                            })
                        )
                    );
                },
                function fail() {
                    node.idle().empty();
                }
            );
        },

        weekday: function (node, options) {
            var canvas = createCanvas();

            node.append(
                $('<h2>').text(gt('Mails per week-day (%)')),
                canvas
            );

            fetch({ folder: options.folder, columns: COLUMNS }).then(
                function success(data) {
                    var days = [0, 0, 0, 0, 0, 0, 0],
                        //get localized dates
                        weekdays = moment.weekdaysMin(),
                        dow = moment.localeData().firstDayOfWeek();

                    //adjust weekstart
                    weekdays = weekdays.slice(dow, weekdays.length).concat(weekdays.slice(0, dow));

                    _(data).each(function (obj) {
                        var day = moment(obj.date).day();
                        days[day]++;
                    });

                    days = _(days).map(function (sum) {
                        return Math.round(sum / data.length * 100);
                    });
                    //adjust weekstart
                    days = days.slice(dow, days.length).concat(days.slice(0, dow));

                    node.idle();

                    createLineChart(canvas, { labels: weekdays, datasets: [{ data: days }] });
                },
                function fail() {
                    node.idle().empty();
                }
            );
        },

        hour: function (node, options) {
            var canvas = createCanvas();

            node.append(
                $('<h2>').text(gt('Mails per hour (%)')),
                canvas
            );

            fetch({ folder: options.folder, columns: COLUMNS }).then(
                function success(data) {

                    var hours = _.times(24, function () { return 0; });

                    _(data).each(function (obj) {
                        var h = moment(obj.date).hours();
                        hours[h]++;
                    });

                    hours = _(hours).map(function (sum) {
                        return Math.round(sum / data.length * 100);
                    });

                    node.idle();

                    createLineChart(canvas, {
                        labels: '0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23'.split(' '),
                        datasets: [{ data: hours }]
                    });
                },
                function fail() {
                    node.idle().empty();
                }
            );
        },

        open: function (app) {
            var statistics = this;

            new ModalDialog({ top: 60, width: 600, center: false, maximize: true })
                .build(function () {
                    var self = this,
                        node = this.$body.addClass('statistics');
                    app.folder.getData().done(function (data) {
                        var baton = ext.Baton({ data: data, app: app, folder: app.folder.get(), statistics: statistics });
                        self.$title.text(gt('Statistics') + ' - ' + baton.data.title);
                        ext.point('io.ox/mail/statistics').invoke('draw', node, baton);
                    });
                })
                .addButton({ label: gt('Close'), action: 'cancel' })
                .open();
        }
    };
});
