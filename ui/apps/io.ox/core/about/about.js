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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
