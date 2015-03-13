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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/statistics', [
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/mail',
    'static/3rd.party/Chart.js/Chart.js'
], function (api, accountAPI, ext, dialogs, gt) {

    'use strict';

    var INDEX = 100;

    ext.point('io.ox/mail/statistics').extend({
        id: 'foldername',
        index: INDEX += 100,
        draw: function (baton) {
            this.append(
                $('<h1 class="folder-name">').text(baton.data.title)
            );
        }
    });

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

    var COLUMNS = '603,604,610',
        WIDTH = _.device('smartphone') ? 280 : 500,
        HEIGHT = _.device('smartphone') ? 150 : 200;

    function createCanvas() {

        // attribute notation does not work! don't know why. maybe retina whatever.
        return $('<canvas width="' + WIDTH + '" height="' + HEIGHT + '" style="width:' + WIDTH + 'px; height:' + HEIGHT + 'px;"></canvas>');
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

                    var chart = {
                        labels: '1 2 3 4 5 6 7 8 9 10'.split(' '),
                        datasets: [{
                            fillColor: 'rgba(0, 136, 204, 0.15)',
                            strokeColor: 'rgba(0, 136, 204, 0.80)',
                            pointColor: 'rgba(0, 136, 204, 1)',
                            pointStrokeColor: '#fff',
                            data: _(data).pluck(1)
                        }]
                    };

                    node.idle();

                    var ctx = canvas.get(0).getContext('2d');
                    new window.Chart(ctx).Line(chart, {});

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
                        var day = moment(obj.received_date).day();
                        days[day]++;
                    });

                    days = _(days).map(function (sum) {
                        return Math.round(sum / data.length * 100);
                    });
                    //adjust weekstart
                    days = days.slice(dow, days.length).concat(days.slice(0, dow));

                    var chart = {
                        labels: weekdays,
                        datasets: [{
                            fillColor: 'rgba(0, 136, 204, 0.15)',
                            strokeColor: 'rgba(0, 136, 204, 0.80)',
                            pointColor: 'rgba(0, 136, 204, 1)',
                            pointStrokeColor: '#fff',
                            data: days
                        }]
                    };

                    node.idle();

                    var ctx = canvas.get(0).getContext('2d');
                    new window.Chart(ctx).Line(chart, {});
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
                        var h = moment(obj.received_date).hours();
                        hours[h]++;
                    });

                    hours = _(hours).map(function (sum) {
                        return Math.round(sum / data.length * 100);
                    });

                    var chart = {
                        labels: '0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23'.split(' '),
                        datasets: [{
                            fillColor: 'rgba(0, 136, 204, 0.15)',
                            strokeColor: 'rgba(0, 136, 204, 0.80)',
                            pointColor: 'rgba(0, 136, 204, 1)',
                            pointStrokeColor: '#fff',
                            data: hours
                        }]
                    };

                    node.idle();

                    var ctx = canvas.get(0).getContext('2d');
                    new window.Chart(ctx).Line(chart, {});
                },
                function fail() {
                    node.idle().empty();
                }
            );
        },

        open: function (app) {

            var statistics = this;

            new dialogs.ModalDialog({
                top: 60,
                width: 600,
                center: false,
                maximize: true
            })
            .build(function () {
                var node = this.getContentNode().addClass('statistics');
                app.folder.getData().done(function (data) {
                    var baton = ext.Baton({ data: data, app: app, folder: app.folder.get(), statistics: statistics });
                    ext.point('io.ox/mail/statistics').invoke('draw', node, baton);
                });
            })
            .addPrimaryButton('cancel', gt('Close'), 'cancel', { 'tabIndex': '1' })
            .show();
        }
    };
});
