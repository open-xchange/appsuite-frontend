/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/about/about', [
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/core/capabilities',
    'gettext!io.ox/core'
], function (ext, dialogs, cap, gt) {

    'use strict';

    ext.point('io.ox/core/about').extend({
        draw: function (data) {

            var revision = 'revision' in data ? data.revision : ('Rev' + ox.revision),
                copyright = String(data.copyright || '').replace(/\(c\)/i, '\u00A9');

            this.addClass('user-select-text').append(
                $('<p>').append(
                    $.txt(gt('UI version')), $.txt(': '), $('<b>').text(data.version + ' ' + revision), $('<br>'),
                    $.txt(gt('Server version')), $.txt(': '), $('<b>').text(data.serverVersion)
                ),
                // contact data can use HTML
                $('<p>').html(data.contact || ''),
                $('<p>').text(gt.noI18n(copyright))
            );
        }
    });

    function click(e) {
        require(['io.ox/core/about/c64'], function (run) {
            e.data.popup.close();
            run();
        });
    }

    return {

        show: function () {

            var data = ox.serverConfig || {};

            new dialogs.ModalDialog()
                .build(function () {
                    this.getHeader().append(
                        $('<h4>').append(
                            _.device('!touch') && cap.has('eggs') ?
                                $('<span class="pull-right" style="color: rgba(0, 0, 0, 0.3); cursor: pointer;">').html('&pi;')
                                .on('click', { popup: this }, click) : [],
                            $.txt(gt.noI18n(data.productName))
                        )
                    );
                    ext.point('io.ox/core/about').invoke('draw', this.getContentNode(), data);
                })
                .addPrimaryButton('cancel', gt('Close'))
                .show();
        }
    };
});
