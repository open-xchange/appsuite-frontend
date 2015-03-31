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

define('plugins/portal/upsell/register', [
    'io.ox/core/extensions',
    'gettext!plugins/portal'
], function (ext, gt) {

    'use strict';

    var title = gt('Upgrade to premium');

    ext.point('io.ox/portal/widget/upsell').extend({

        title: title,

        preview: function () {

            this.addClass('hide-title').append(
                $('<div class="content centered" style="cursor: pointer; padding-top: 3em;">').append(
                    $('<h2>').append(
                        $.txt(title + ' '),
                        $('<i class="fa fa-star">')
                    ),
                    $('<div>').text(gt('Click here for free trial.'))
                )
                .on('click', function () {
                    ox.trigger('upsell:upgrade', {
                        type: 'widget',
                        id: 'io.ox/portal/widget/upsell',
                        missing: ''
                    });
                })
            );
        }
    });
});
