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

define('io.ox/backbone/mini-views/timezonepicker', [
    'io.ox/backbone/mini-views/common',
    'settings!io.ox/calendar',
    'settings!io.ox/core',
    'settings!io.ox/core/settingOptions',
    'gettext!io.ox/core'
], function (miniViews, calendarSettings, coreSettings, settingOptions, gt) {

    'use strict';

    function getDisplayName(timezone) {
        var tz = moment.tz(timezone),
            displayName = tz.format('Z ') + tz.zoneAbbr() + ' ' + timezone;

        return displayName.replace(/_/g, ' ');
    }

    var available = settingOptions.get('availableTimeZones'),
        now = moment(),
        timezones = _(moment.tz._zones)
            .chain()
            .filter(function (tz) {
                tz.displayName = getDisplayName(tz.name);
                return !!available[tz.name];
            })
            .sortBy(function (tz) {
                return tz.offset(now) * -1;
            })
            .map(function (tz) {
                return { label: tz.displayName, value: tz.name };
            })
            .value();

    var TimezonePicker = miniViews.SelectView.extend({

        initialize: function (options) {
            options = options || {};
            if (options.showFavorites && calendarSettings.get('favoriteTimezones')) {
                options.favorites = _(calendarSettings.get('favoriteTimezones')).map(function (favorite) {
                    return { label: getDisplayName(favorite), value: favorite };
                });
            }
            options.list = timezones;
            miniViews.SelectView.prototype.initialize.call(this, options);
        },

        renderOptions: function (list, parent) {
            parent.append(_(list).map(function (option) {
                return $('<option>').attr({ value: option.value }).text(option.label);
            }));
        },

        render: function () {
            var self = this;
            this.$el.attr({ name: this.name, tabindex: this.options.tabindex || 1 });
            if (this.id) this.$el.attr({ id: this.id });
            _.defer(function () {
                if (self.options.favorites) {
                    var standard = $('<optgroup>').attr('label', gt('Standard timezone')),
                        favorites = $('<optgroup>').attr('label', gt('Favorites')),
                        all = $('<optgroup>').attr('label', gt('All timezones'));

                    self.renderOptions([{
                        label: getDisplayName(coreSettings.get('timezone')),
                        value: coreSettings.get('timezone')
                    }], standard);
                    self.renderOptions(self.options.favorites, favorites);
                    self.renderOptions(self.options.list, all);

                    self.$el.append(standard, favorites, all);
                } else {
                    self.renderOptions(self.options.list, self.$el);
                }
                self.update();
            });
            return this;
        }
    });

    return TimezonePicker;
});
