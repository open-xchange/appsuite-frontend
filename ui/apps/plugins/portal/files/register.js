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

define('plugins/portal/files/register',
    ['io.ox/core/extensions',
     'io.ox/files/api',
     'gettext!plugins/portal'], function (ext, api, gt) {

    'use strict';

    ext.point('io.ox/portal/widget/stickyfile').extend({

        load: function (baton) {
            var props = baton.model.get('props') || {};
            return api.get({ folder: props.folder_id, id: props.id }).done(function (data) {
                baton.data = data;
            });
        },

        preview: function (baton) {

            if ((/(png|jpe?g|gif|bmp)$/i).test(baton.data.filename)) {
                var options = { width: 300, height: 300, scaleType: 'cover' };
                var url = (api.getUrl(baton.data, 'view') + '&' + $.param(options)).replace(/([\(\)])/g, '\\$1');
                this.addClass('photo-stream').append(
                    $('<div class="content pointer">').css('backgroundImage', 'url(' + url + ')')
                );
            } else {
                this.append(
                    $('<div class="content pointer">')
                );
            }
        },

        draw: function (baton) {
            var popup = this.busy();
            require(['io.ox/files/list/view-detail'], function (view) {
                var obj = api.reduce(baton.data);
                api.get(obj).done(function (data) {
                    popup.idle().append(view.draw(data));
                });
            });
        }
    });
});
