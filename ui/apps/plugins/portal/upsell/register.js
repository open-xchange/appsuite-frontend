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
            icon: settings.get('upsell/defaultIcon', 'fa-lock')
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
                    $('<div class="content" tabindex="1" role="button">')
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

            this.on('click', trigger);

            if (!options.removable) {
                $('.disable-widget', this).remove();
            }
        }
    });

    ext.point('io.ox/portal/widget/upsell/settings').extend({
        title: gt('Upgrade your account'),
        type: 'upsell',
        editable: false,
        color: 'gray',
        inverse: true
    });
});
