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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/settings/timezones/pane', [
    'settings!io.ox/calendar',
    'gettext!io.ox/calendar',
    'io.ox/core/extensions',
    'io.ox/calendar/settings/timezones/favorite-view',
    'less!io.ox/calendar/settings/timezones/style.less'
], function (settings, gt, ext, FavoriteView) {

    'use strict';

    var POINT = 'io.ox/calendar/timezones/settings/detail';

    ext.point('io.ox/settings/pane/main/io.ox/calendar').extend({
        id: 'io.ox/timezones',
        title: gt('Favorite timezones'),
        ref: 'io.ox/calendar/timezones',
        loadSettingPane: false,
        index: 100,
        lazySaveSettings: true
    });

    ext.point(POINT).extend({
        index: 100,
        id: 'timezone-calendarsettings',
        draw: function () {
            var self = this,
                pane = $('<div class="io-ox-calendar-settings">');
            self.append($('<div>').addClass('section').append(pane));
            ext.point(POINT + '/pane').invoke('draw', pane);
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(
                $('<h1>').text(gt.pgettext('app', 'Favorite timezones'))
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'favorite-timezone',
        draw: function () {
            this.append(
                new FavoriteView({ model: settings }).render().$el
            );
        }
    });
});
