/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/items/view-detail-template',
    ['gettext!io.ox/core',
     'io.ox/core/extensions'
    ], function (gt, ext) {

    'use strict';

    ext.point('io.ox/search/view/window').extend({
        id: 'sidepanel',
        index: 400,
        row: '0',
        draw: function () {

            //register sidepanel details views
            ext.point('io.ox/search/items/calendar').extend({
                draw: function (baton) {
                    var popup = this.busy();
                    require(['io.ox/calendar/view-detail'], function (view) {
                        popup.idle().append(view.draw(baton.data));
                    });
                }
            });

            ext.point('io.ox/search/items/contacts').extend({
                draw: function (baton) {
                    var popup = this.busy();
                    require(['io.ox/contacts/view-detail'], function (view) {
                        popup.idle().append(view.draw(baton.data));
                    });
                }
            });

            ext.point('io.ox/search/items/infostore').extend({
                draw: function (baton) {
                    var popup = this.busy();
                    require(['io.ox/files/fluid/view-detail'], function (view) {
                        popup.idle().append(view.draw(baton.data));
                    });
                }
            });

            ext.point('io.ox/search/items/mail').extend({
                draw: function (baton) {
                    var popup = this.busy();
                    require(['io.ox/mail/detail/view'], function (detail) {
                        var view = new detail.View({ data: baton.data });
                        popup.idle().append(view.render().expand().$el.addClass('no-padding'));
                    });
                }
            });

            ext.point('io.ox/search/items/tasks').extend({
                draw: function (baton) {
                    var popup = this.busy();
                    require(['io.ox/tasks/view-detail'], function (view) {
                        popup.idle().append(view.draw(baton.data));
                    });
                }
            });

        }
    });

});
