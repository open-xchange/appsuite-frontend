/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/calendar/register',
    ['io.ox/core/extensions',
     'io.ox/core/date',
     'io.ox/calendar/util',
     'gettext!plugins/portal',
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

    ext.point('io.ox/portal/widget/calendar').extend({

        title: gt('Appointments'),

        initialize: function () {
            api.on('update create delete', function () {
                require(['io.ox/portal/main'], function (portal) {//refresh portal
                    var portalApp = portal.getApp(),
                        portalModel = portalApp.getWidgetCollection()._byId.calendar_0;
                    if (portalModel) {
                        portalApp.refreshWidget(portalModel, 0);
                    }
                });

            });
        },

        action: function () {
            ox.launch('io.ox/calendar/main', { perspective: 'list' });
        },

        load: function (baton) {

            var numOfItems = _.device('small') ? 5 : 10;

            return api.getAll().pipe(function (ids) {
                return api.getList(ids.slice(0, numOfItems)).done(function (data) {
                    baton.data = data;
                });
            });
        },

        preview: function (baton) {

            var appointments = baton.data,
                $content = $('<ul class="content list-unstyled">'),
                showDeclined = settings.get('showDeclinedAppointments', false);

            if (appointments.length === 0) {
                $content.append(
                    $('<div class="line">')
                    .text(gt('You don\'t have any appointments in the near future.'))
                );
            } else {
                _(appointments).each(function (nextApp) {

                    var declined = util.getConfirmationStatus(nextApp) === 2,
                        start = new date.Local(nextApp.start_date),
                        timespan = util.getSmartDate(nextApp, true);

                    if (!nextApp.full_time) {
                        timespan += ' ' + start.format(date.TIME);
                    }

                    if (showDeclined || !declined) {
                        $content.append(
                            $('<li class="item" tabindex="1">')
                            .css('text-decoration', declined ? 'line-through' : 'none')
                            .data('item', nextApp)
                            .append(
                                $('<span class="normal accent">').text(_.noI18n(timespan)), $.txt(gt.noI18n('\u00A0')),
                                $('<span class="bold">').text(_.noI18n(nextApp.title || '')), $.txt(gt.noI18n('\u00A0')),
                                $('<span class="gray">').text(_.noI18n(nextApp.location || ''))
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
            require(['io.ox/calendar/api'], function (api) {
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
