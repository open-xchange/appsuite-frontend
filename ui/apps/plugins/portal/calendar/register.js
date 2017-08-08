/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/calendar/register', [
    'io.ox/core/extensions',
    'io.ox/calendar/chronos-api',
    'io.ox/core/folder/api',
    'io.ox/calendar/util',
    'gettext!plugins/portal',
    'settings!io.ox/chronos'
], function (ext, api, folderAPI, util, gt, settings) {

    'use strict';

    ext.point('io.ox/portal/widget/calendar').extend({

        title: gt('Appointments'),

        initialize: function (baton) {
            api.on('update create delete', function () {
                //refresh portal
                require(['io.ox/portal/main'], function (portal) {
                    var portalApp = portal.getApp(),
                        portalModel = portalApp.getWidgetCollection()._byId[baton.model.id];
                    if (portalModel) {
                        portalApp.refreshWidget(portalModel, 0);
                    }
                });

            });
        },

        load: function (baton) {
            // TODO remove folder from call as soon as the API supports it
            return api.getAll({ folder: 'cal://0/' + folderAPI.getDefaultFolder('calendar') }).then(function (models) {
                var numOfItems = _.device('smartphone') ? 5 : 10;
                baton.data = models.slice(0, numOfItems);
                return baton.data;
            });
        },

        summary: function (baton) {
            if (this.find('.summary').length) return;

            this.addClass('with-summary show-summary');

            var sum = $('<div>').addClass('summary');

            if (baton.data.length === 0) {
                sum.text(gt('You don\'t have any appointments in the near future.'));
            } else {
                var model = _(baton.data).first();

                sum.append(
                    $('<span class="normal accent">').text(util.getSmartDate(model, true)), $.txt('\u00A0'),
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
            var models = baton.data,
                $content = $('<ul class="content list-unstyled">');

            if (models.length === 0) {
                $content.append(
                    $('<li class="line">')
                    .text(gt('You don\'t have any appointments in the near future.'))
                );
            } else {
                _(models).each(function (model) {
                    var declined = util.getConfirmationStatus(model) === 'DECLINED';
                    if (settings.get('showDeclinedAppointments', false) || !declined) {
                        var timespan = util.getSmartDate(model, true);

                        $content.append(
                            $('<li class="item" tabindex="0">')
                            .css('text-decoration', declined ? 'line-through' : 'none')
                            .data('item', model)
                            .append(
                                $('<span class="normal accent">').text(timespan), $.txt('\u00A0'),
                                $('<span class="bold">').text(model.get('summary') || ''), $.txt('\u00A0'),
                                $('<span class="gray">').text(model.get('location') || '')
                            )
                        );
                    }
                });
            }

            this.append($content);
        },

        draw: function (baton) {
            var popup = this.busy();
            require(['io.ox/calendar/view-detail'], function (view) {
                var model = baton.item;
                popup.idle().append(view.draw(model, { deeplink: true }));
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
