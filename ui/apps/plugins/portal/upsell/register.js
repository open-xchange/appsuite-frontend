/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('plugins/portal/upsell/register', [
    'io.ox/core/extensions',
    'gettext!plugins/portal',
    'io.ox/core/upsell',
    'settings!io.ox/core'
], function (ext, gt, upsell, settings) {

    'use strict';

    var id = 'portal-widget',
        options = _.extend({
            title: gt('Upgrade your account'),
            requires: 'active_sync || caldav || carddav',
            removable: false,
            icon: settings.get('upsell/defaultIcon', 'fa-star')
        }, settings.get('features/upsell/' + id), settings.get('features/upsell/' + id + '/i18n/' + ox.language));

    function trigger(e) {
        // do not trigger when clicked on close
        if ($(e.target).closest('.disable-widget').length > 0) return;

        upsell.trigger({
            type: 'custom',
            id: id,
            missing: upsell.missing(options.requires)
        });
    }

    ext.point('io.ox/portal/widget/upsell').extend({

        title: options.title,

        preview: function () {
            if (options.imageURL) {
                this.addClass('photo-stream').append(
                    $('<div class="content" tabindex="0" role="button">')
                        .css('backgroundImage', 'url(' + options.imageURL + ')')
                );
            } else {
                this.append(
                    $('<div class="content centered" style="cursor: pointer; padding-top: 3em;">').append(
                        $('<h2>').append(
                            $.txt(options.title + ' '),
                            _(options.icon.split(/ /)).map(function (icon) {
                                return $('<i class="fa">').addClass(icon);
                            })
                        )
                    )
                );
            }

            this.off('click', trigger);
            this.on('click', trigger);

            if (!options.removable) {
                $('.disable-widget', this).remove();
            }
        }
    });
});
