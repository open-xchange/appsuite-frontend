/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/calendar/settings/timezones/favorite-view', [
    'io.ox/backbone/mini-views/timezonepicker',
    'settings!io.ox/core',
    'gettext!io.ox/calendar',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/backbone/mini-views/listutils'
], function (TimezonePicker, coreSettings, gt, ModalDialog, ListView, listutils) {

    'use strict';

    var FavoriteTimezone = Backbone.Model.extend({
            initialize: function () {
                this.onChangeTimezone();
                this.on('change:timezone', this.onChangeTimezone.bind(this));
            },
            defaults: {
                timezone: coreSettings.get('timezone')
            },
            onChangeTimezone: function () {
                this.tz = moment.tz(this.get('timezone'));
                this.set('utcOffset', this.tz.utcOffset());
                this.set('title', this.get('timezone').replace(/_/g, ' '));
                this.set('id', this.cid);
            }
        }),
        FavoriteCollection = Backbone.Collection.extend({
            model: FavoriteTimezone,
            comparator: 'utcOffset'
        });

    var FavoriteView = Backbone.View.extend({

        tagName: 'div',

        className: 'favorite-view',

        events: {
            'click button': 'openDialog',
            'click a[data-action="delete"]': 'removeFavorite'
        },

        initialize: function () {
            this.collection = new FavoriteCollection(_(this.model.get('favoriteTimezones')).map(function (tz) {
                return { timezone: tz };
            }));

            this.listenTo(this.collection, 'add remove', this.sync.bind(this));

            this.listView = new ListView({
                tagName: 'ul',
                collection: this.collection,
                childOptions: {
                    customize: function (model) {
                        this.$('.list-item-title').before(
                            $('<span class="offset">').text(model.tz.format('Z')),
                            $('<span class="timezone-abbr">').text(model.tz.zoneAbbr())
                        );
                        this.$('.list-item-controls').append(
                            listutils.controlsDelete()
                        );
                    }
                }
            });
        },

        render: function () {
            this.$el.append(
                $('<div class="form-group buttons">').append(
                    $('<button type="button" class="btn btn-primary">').append(
                        $('<i class="fa fa-plus" aria-hidden="true">'), $.txt(gt('Add timezone'))
                    )
                ),
                $('<div class="form-group">').append(
                    this.listView.render().$el
                )
            );

            return this;
        },

        openDialog: function () {
            var self = this,
                model = new FavoriteTimezone();
            new ModalDialog({ title: gt('Select favorite timezone') })
                .addCancelButton()
                .addButton({ label: gt('Add'), action: 'add' })
                .build(function () {
                    this.$body.append(
                        $('<label for="settings-timezone">').text(gt('Time zone')),
                        new TimezonePicker({
                            id: 'settings-timezone',
                            name: 'timezone',
                            model: model,
                            className: 'form-control'
                        }).render().$el
                    );
                })
                .on('add', function () {
                    var sameTimezone = self.collection.findWhere({ timezone: model.get('timezone') });
                    if (sameTimezone) {
                        require(['io.ox/core/notifications'], function (notifications) {
                            notifications.yell('error', gt('The selected timezone is already a favorite.'));
                        });
                        return;
                    }
                    self.collection.add(model);
                })
                .open();
        },

        removeFavorite: function (e) {
            var id = $(e.currentTarget).closest('li').attr('data-id');
            this.collection.remove(id);
            e.preventDefault();
        },

        sync: function () {
            var list = this.collection.pluck('timezone');
            this.model.set('favoriteTimezones', list);
            // make sure, that a timezone which is deleted is not rendered in the week view as timezone label anymore
            this.model.set('renderTimezones', _.intersection(list, this.model.get('renderTimezones', [])));
            this.model.save();
        }

    });

    return FavoriteView;
});
