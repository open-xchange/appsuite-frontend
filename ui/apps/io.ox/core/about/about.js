/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/about/about', ['io.ox/core/extensions', 'io.ox/core/tk/dialogs', 'gettext!io.ox/core'], function (ext, dialogs, gt) {

    'use strict';

    ext.point('io.ox/core/about').extend({
        draw: function (data) {
            var revision = 'revision' in data ? data.revision : ('Rev' + ox.revision);
            this.addClass('user-select-text').append(
                $('<h4>').text(gt.noI18n(data.productName)),
                $('<p>').append(
                    $('<span>').text('UI version:'), $.txt(' '), $('<b>').text(data.version + ' ' + revision), $('<br>'),
                    $('<span>').text('Server version:'), $.txt(' '), $('<b>').text(data.serverVersion)
                ),
                $('<p>').text(gt('Contact: %1$s', data.contact)),
                $('<p>').text(gt.noI18n(data.copyright))
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
            new dialogs.ModalDialog()
                .build(function () {
                    this.getHeader().append(
                        $('<h4>').append(
                            _.device('!touch') ?
                                $('<span class="pull-right" style="color: rgba(0, 0, 0, 0.3); cursor: pointer;">').html('&pi;')
                                .on('click', { popup: this }, click) : [],
                            $.txt(gt('About'))
                        )
                    );
                    ext.point('io.ox/core/about').invoke('draw', this.getContentNode(), ox.serverConfig || {});
                })
                .addPrimaryButton("cancel", gt('Close'))
                .show();
        }
    };
});
