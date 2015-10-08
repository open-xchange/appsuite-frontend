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

define('plugins/portal/contacts/register', [
    'io.ox/core/extensions',
    'io.ox/contacts/api',
    'io.ox/portal/widgets'
], function (ext, api, portalWidgets) {

    'use strict';

    ext.point('io.ox/portal/widget/stickycontact').extend({

        // helps at reverse lookup
        type: 'contacts',

        load: function (baton) {
            var props = baton.model.get('props') || {};
            return api.get({ folder: props.folder_id, id: props.id }).then(function (data) {
                baton.data = data;
            }, function (e) {
                return e.code === 'CON-0125' ? 'remove' : e;
            });
        },

        preview: function (baton) {
            api.on('delete', function (event, element) {
                if (element.id === baton.data.id && element.folder_id === baton.data.folder_id) {
                    var widgetCol = portalWidgets.getCollection();
                    widgetCol.remove(baton.model);
                }
            });

            var list = baton.data.distribution_list || [], content = $('<ul class="content pointer list-unstyled">');

            _(list).each(function (obj) {
                content.append(
                    $('<li class="paragraph">').append(
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
