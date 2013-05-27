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

define('plugins/portal/contacts/register',
    ['io.ox/core/extensions',
     'io.ox/contacts/api',
     'gettext!plugins/portal'], function (ext, api, gt) {

    'use strict';

    ext.point('io.ox/portal/widget/stickycontact').extend({

        // helps at reverse lookup
        type: 'contacts',

        load: function (baton) {
            var props = baton.model.get('props') || {};
            return api.get({ folder: props.folder_id, id: props.id }).done(function (data) {
                baton.data = data;
            });
        },

        preview: function (baton) {

            var list = baton.data.distribution_list || [], content = $('<div class="content pointer">');

            _(list).each(function (obj) {
                content.append(
                    $('<div class="paragraph">').append(
                        $('<div class="bold">').text(obj.display_name),
                        $('<div class="accent">').text(obj.mail)
                    )
                );
            });

            this.append(content);
        },

        draw: function (baton) {
            var popup = this.busy();
            require(['io.ox/contacts/view-detail'], function (view) {
                var obj = api.reduce(baton.data);
                api.get(obj).done(function (data) {
                    popup.idle().append(view.draw(data));
                });
            });
        }
    });
});
