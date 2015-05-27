/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/settings/timezones/favorite-view', [
    'io.ox/backbone/mini-views/timezonepicker',
    'settings!io.ox/core',
    'gettext!io.ox/calendar'
], function (TimezonePicker, coreSettings, gt) {

    'use strict';

    var FavoriteViewModel = Backbone.Model.extend({
            defaults: {
                timezone: coreSettings.get('timezone')
            }
        }),
        model = new FavoriteViewModel();

    var FavoriteView = Backbone.View.extend({

        tagName: 'div',

        className: 'expertmode favorite-view',

        events: {
            'click button': 'addFavorite',
            'click a[data-action="delete"]': 'removeFavorite'
        },

        initialize: function () {
            this.node = $('<ul class="list-unstyled list-group settings-list">');
        },

        drawFavorites: function () {
            this.node.empty().append(
                _(this.model.get('favoriteTimezones')).map(function (timezone) {
                    var tz = moment.tz(timezone);

                    return $('<li class="widget-settings-view">').append(
                        $('<span class="pull-left">').append(
                            $('<span class="offset">').text(tz.format('Z')),
                            $('<span class="timezone-abbr">').text(tz.zoneAbbr()),
                            $.txt(timezone.replace(/_/g, ' '))
                        ),
                        $('<div class="widget-controls">').append(
                            $('<a class="remove" href="#" tabindex="1" role="button" data-action="delete" aria-label="remove">')
                            .attr({
                                'data-id': timezone,
                                'title': timezone
                            })
                            .append($('<i class="fa fa-trash-o">'))
                        )
                    );
                })
            );
        },

        render: function () {
            this.$el.append(
                $('<div class="form-group">').append(
                    $('<div class="row">').append(
                        $('<div class="col-sm-4">').append(
                            new TimezonePicker({
                                name: 'timezone',
                                model: model,
                                className: 'form-control'
                            }).render().$el
                        ),
                        $('<div class="col-sm-8">').append(
                            $('<button type="button" class="btn btn-primary" tabindex="1">').text(gt('Add timezone'))
                        )
                    )
                ),
                $('<div class="form-group">').append(
                    this.node
                )
            );

            this.drawFavorites();

            return this;
        },

        addFavorite: function () {
            var list = _.clone(this.model.get('favoriteTimezones')) || [];

            if (list.indexOf(model.get('timezone')) >= 0) {
                require(['io.ox/core/notifications'], function (notifications) {
                    notifications.yell('error', gt('The selected timezone is already a favorite.'));
                });

                return;
            }

            list.push(model.get('timezone'));
            list = _(list)
                .chain()
                .map(function (name) { return moment.tz(name); })
                .sortBy(function (tz) {
                    return tz.utcOffset();
                })
                .map(function (tz) {
                    return tz.tz();
                })
                .value();
            this.model.set('favoriteTimezones', list);
            this.drawFavorites();
        },

        removeFavorite: function (e) {
            var value = $(e.currentTarget).attr('data-id'),
                list = _.clone(this.model.get('favoriteTimezones'));

            list = _(list).without(value);
            this.model.set('favoriteTimezones', list);
            this.model.set('renderTimezones', _.intersection(list, this.model.get('renderTimezones', [])));
            this.drawFavorites();
        }

    });

    return FavoriteView;
});
