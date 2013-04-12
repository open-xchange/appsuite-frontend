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
     "io.ox/calendar/util",
     "gettext!plugins/portal",
     'settings!io.ox/calendar',
     'io.ox/core/strings',
     'io.ox/calendar/api'
    ], function (ext, date, util, gt, settings, strings, api) {

    'use strict';

    //this should be in our date library. And it could probably be done much nicer, e.g. using two lists
    // var printTimespan = function (timestamp1, timestamp2) {
    //     var delta = Math.abs(timestamp1 - timestamp2);
    //     var past = (timestamp1 - timestamp2) < 0;
    //     var unit = past ? gt("Started %s milliseconds ago:") : gt("In %s milliseconds:");

    //     if (delta / 1000 > 1) {
    //         delta = delta / 1000;
    //         var unit = past ? gt("Started %s seconds ago:") : gt("In %s seconds:");
    //     }
    //     if (delta / 60 > 1) {
    //         delta = delta / 60;
    //         var unit = past ? gt("Started %s minutes ago:") : gt("In %s minutes:");
    //     }
    //     if (delta / 60 > 1) {
    //         delta = delta / 60;
    //         var unit = past ? gt("Started %s hours ago:") : gt("In %s hours:");
    //     }
    //     if (delta / 24 > 1) {
    //         delta = delta / 24;
    //         var unit = past ? gt("Started %s days ago:") : gt("In %s days:");
    //     }
    //     if (delta / 7 > 1) {
    //         delta = delta / 7;
    //         var unit = past ? gt("Started %s weeks ago:") : gt("In %s weeks:");
    //     }
    //     return unit.replace("%s", Math.round(delta));
    // };

    ext.point("io.ox/portal/widget/calendar").extend({

        title: gt('Appointments'),

        action: function (baton) {
            ox.launch('io.ox/calendar/main', { perspective: 'list' });
        },

        load: function (baton) {
            return api.getAll().pipe(function (ids) {
                return api.getList(ids.slice(0, 14)).done(function (data) {
                    baton.data = data;
                });
            });
        },

        preview: function (baton) {

            var appointments = baton.data,
                $content = $('<div class="content">'),
                showDeclined = settings.get('showDeclinedAppointments', false);

            if (appointments.length === 0) {
                $content.append(
                    $('<div class="line">')
                    .text(gt("You don't have any appointments in the near future."))
                );
            } else {
                _(appointments).each(function (nextApp) {

                    var declined = util.getConfirmationStatus(nextApp) === 2,
                        start = new date.Local(nextApp.start_date),
                        timespan = util.getSmartDate(nextApp.start_date, true) + (nextApp.full_time ? '' : ' ' + start.format(date.TIME));

                    if (showDeclined || !declined) {
                        $content.append(
                            $('<div class="item">')
                            .css('text-decoration', declined ? 'line-through' : 'none')
                            .data('item', nextApp)
                            .append(
                                $('<span class="normal accent">').text(timespan), $.txt(' '),
                                $('<span class="bold">').text(nextApp.title || ''), $.txt(' '),
                                $('<span class="gray">').text(nextApp.location || '')
                            )
                        );
                    }
                });
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

    ext.point('io.ox/portal/widget/calendar/settings').extend({
        title: gt('Appointments'),
        type: 'calendar',
        editable: false,
        unique: true
    });

});
