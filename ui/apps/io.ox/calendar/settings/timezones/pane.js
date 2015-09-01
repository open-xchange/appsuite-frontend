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

define('io.ox/calendar/settings/timezones/pane', [
    'io.ox/calendar/settings/model',
    'gettext!io.ox/calendar',
    'io.ox/core/extensions',
    'io.ox/calendar/settings/timezones/favorite-view',
    'less!io.ox/calendar/settings/timezones/style.less'
], function (model, gt, ext, FavoriteView) {

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
                $('<h1>').text(gt.pgettext('app', 'Favorite timezone'))
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'favorite-timezone',
        draw: function () {
            this.append(
                $('<fieldset>').append(
                    new FavoriteView({ model: model }).render().$el
                )
            );
        }
    });
});
