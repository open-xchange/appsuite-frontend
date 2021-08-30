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

define('io.ox/mail/mailfilter/settings/register', [
    'io.ox/core/extensions',
    'gettext!io.ox/mail'
], function (ext, gt) {

    'use strict';

    ext.point('io.ox/settings/pane/main/io.ox/mail').extend({
        id: 'io.ox/mailfilter',
        title: gt('Filter Rules'),
        ref: 'io.ox/mailfilter',
        loadSettingPane: false,
        index: 300
    });

    ext.point('io.ox/mailfilter/settings/detail').extend({
        index: 100,
        draw: function (baton) {
            var $node = this,
                $container = $('<div class="io-ox-mailfilter-settings">');

            $node.append($container);

            ox.load(['io.ox/mail/mailfilter/settings/filter']).done(function (filters) {
                filters.editMailfilter($container, baton).fail(function (error) {
                    var msg;
                    if (error.code === 'MAIL_FILTER-0015') {
                        msg = gt('Unable to load mail filter rules settings.');
                    }
                    $container.append(
                        $.fail(msg || gt('Couldn\'t load your mail filter rules.'), function () {
                            filters.editMailfilter($node).done(function () {
                                $container.find('[data-action="discard"]').hide();
                            });
                        })
                    );
                });
            });

        }

    });
});
