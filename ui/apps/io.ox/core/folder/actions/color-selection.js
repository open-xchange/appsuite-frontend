/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/color-selection', [
    'io.ox/core/notifications',
    'io.ox/core/folder/api'
], function (notifications, api) {

    'use strict';

    return function (baton, color_label) {
        var folder = baton.data,
            elem = baton.elem,
            meta = _(folder.meta || {}).extend({ color_label: color_label });

        // update folder
        api.update(folder.id, { meta: meta }).then(
            function success() {

                //toggle active class
                elem.siblings('.active').removeClass('active').attr('aria-checked', false).end().addClass('active').attr('aria-checked', true);

                // update all appointments without color
                $('[data-folder="' + folder.id + '"]').each(function () {
                    this.className = this.className.replace(/color-label-\d{1,2}/, 'color-label-' + color_label);
                });

                //update color in folder view
                $('li[data-id="' + folder.id + '"] .color-label').each(function () {
                    this.className = this.className.replace(/color-label-\d{1,2}/, 'color-label-' + color_label);
                });
            },
            notifications.yell
        );
    };
});
