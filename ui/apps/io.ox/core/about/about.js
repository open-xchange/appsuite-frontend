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

define('io.ox/core/about/about', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/core/capabilities',
    'gettext!io.ox/core'
], function (ext, ModalDialog, cap, gt) {

    'use strict';

    ext.point('io.ox/core/about').extend({
        render: function () {
            var data = ox.serverConfig || {};
            var revision = 'revision' in data ? data.revision : ('Rev' + ox.revision),
                copyright = String(data.copyright || '').replace(/\(c\)/i, '\u00A9');

            this.$title.append(_.device('!touch') && cap.has('eggs') ?
                $('<span class="pull-right" style="color: rgba(0, 0, 0, 0.3); cursor: pointer;">').html('&pi;').on('click', { popup: this }, click) : []);

            this.$body.addClass('user-select-text').append(
                $('<p>').append(
                    $.txt(gt('UI version')), $.txt(': '), $('<b>').text(data.version + ' ' + revision), $('<br>'),
                    $.txt(gt('Server version')), $.txt(': '), $('<b>').text(data.serverVersion)
                ),
                // contact data can use HTML
                $('<p>').html(data.contact || ''),
                $('<p>').text(copyright)
            );
        }
    });

    function click(e) {
        require(['io.ox/core/about/c64'], function (run) { e.data.popup.close(); run(); });
    }

    return {
        show: function () {
            var data = ox.serverConfig || {};

            new ModalDialog({ title: data.productName, previousFocus: $('#io-ox-topbar-help-dropdown-icon > a'), point: 'io.ox/core/about' })
                .addButton({ label: gt('Close'), action: 'cancel' })
                .open();
        }
    };
});
