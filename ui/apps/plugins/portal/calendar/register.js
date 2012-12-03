/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define("plugins/portal/calendar/register",
    ["io.ox/core/extensions",
     "io.ox/core/date",
     "gettext!plugins/portal",
     'io.ox/core/strings',
     'io.ox/calendar/api'
    ], function (ext, date, gt, strings, api) {

    'use strict';

    //this should be in our date library. And it could probably be done much nicer, e.g. using two lists
    var printTimespan = function (timestamp1, timestamp2) {
        var delta = Math.abs(timestamp1 - timestamp2);
        var past = (timestamp1 - timestamp2) < 0;
        var unit = past ? gt("Started %s milliseconds ago:") : gt("In %s milliseconds:");

        if (delta / 1000 > 1) {
            delta = delta / 1000;
            var unit = past ? gt("Started %s seconds ago:") : gt("In %s seconds:");
        }
        if (delta / 60 > 1) {
            delta = delta / 60;
            var unit = past ? gt("Started %s minutes ago:") : gt("In %s minutes:");
        }
        if (delta / 60 > 1) {
            delta = delta / 60;
            var unit = past ? gt("Started %s hours ago:") : gt("In %s hours:");
        }
        if (delta / 24 > 1) {
            delta = delta / 24;
            var unit = past ? gt("Started %s days ago:") : gt("In %s days:");
        }
        if (delta / 7 > 1) {
            delta = delta / 7;
            var unit = past ? gt("Started %s weeks ago:") : gt("In %s weeks:");
        }
        return unit.replace("%s", Math.round(delta));
    };

    ext.point("io.ox/portal/widget/calendar").extend({

        title: gt('Appointments'),

        action: function (baton) {
            ox.launch('io.ox/calendar/main', { perspective: 'list' });
        },

        load: function (baton) {
            return api.getAll().pipe(function (ids) {
                return api.getList(ids.slice(0, 10)).done(function (data) {
                    baton.data = data;
                });
            });
        },

        preview: function (baton) {

            var startSpan = new date.Local(),
                endSpan = startSpan + (24 * 60 * 60 * 1000),

                appointments = _(baton.data).filter(function (app) {
                    return app.start_date > endSpan || app.end_date < startSpan;
                }),

                $content = $('<div class="content">');

            if (appointments.length > 0) {
                _(appointments).each(function (nextApp) {
                    var deltaT = printTimespan(nextApp.start_date, new Date().getTime()),
                        start = new date.Local(nextApp.start_date), end = new date.Local(nextApp.end_date),
                        timespan = start.formatInterval(end, date.DATE);
                    $content.append(
                        $('<div class="item">')
                        .data('item', nextApp)
                        .append(
                            $('<span class="normal accent">').text(timespan), $.txt(' '),
                            $('<span class="bold">').text(nextApp.title || ''), $.txt(' '),
                            $('<span class="gray">').text(nextApp.location || '')
                        )
                    );
                });
            } else {
                $content.append(
                    $('<div class="item">')
                    .text(gt("You don't have any appointments in the near future."))
                );
            }

            this.append($content);
        },

        draw: function (baton) {
            var popup = this.busy();
            require(['io.ox/calendar/view-detail', 'io.ox/calendar/api'], function (view, api) {
                var obj = api.reduce(baton.item);
                api.get(obj).done(function (data) {
                    popup.idle().append(view.draw(data));
                });
            });
        },

        post: function (ext) {
            var self = this;
            require(["io.ox/calendar/api"], function (api) {
                api.on('refresh.all', function () {
                    ext.load().done(_.bind(ext.draw, self));
                });
            });
        }
    });
});
