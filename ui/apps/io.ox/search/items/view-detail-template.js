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

    function draw(baton, detail, api) {
        var popup = this.busy();
        require([detail, api], function (view, api) {
            //render data with available data
            popup.idle().append(view.draw(baton.data));
            api.get(baton.data).then(function (data) {
                //render again with get response if needed
                if (!_.isEqual(baton.data, data)) {
                    popup.empty().append(view.draw(data));
                }
            });
        });
    }

    //register sidepanel details views
    ext.point('io.ox/search/view/window').extend({
        id: 'sidepanel',
        index: 400,
        row: '0',
        draw: function () {

            ext.point('io.ox/search/items/calendar').extend({
                draw: function (baton) {
                    draw.call(this, baton, 'io.ox/calendar/view-detail', 'io.ox/calendar/api');
                }
            });

            ext.point('io.ox/search/items/contacts').extend({
                draw: function (baton) {
                    draw.call(this, baton, 'io.ox/contacts/view-detail', 'io.ox/contacts/api');
                }
            });

            ext.point('io.ox/search/items/tasks').extend({
                draw: function (baton) {
                    draw.call(this, baton, 'io.ox/tasks/view-detail', 'io.ox/tasks/api');
                }
            });

            ext.point('io.ox/search/items/files').extend({
                draw: function (baton) {
                    draw.call(this, baton, 'io.ox/files/fluid/view-detail', 'io.ox/files/api');
                }
            });

            //special for mail
            ext.point('io.ox/search/items/mail').extend({
                draw: function (baton) {
                    var popup = this.busy();
                    require(['io.ox/mail/detail/view', 'io.ox/mail/api'], function (detail, api) {
                        //render data with available data
                        var view = new detail.View({ data: baton.data });
                        popup.idle().append(
                            view.render().expand().$el.addClass('no-padding')
                        );
                        api.get(baton.data).then(function (data) {
                            //render again with get response
                            if (!_.isEqual(baton.data, data)) {
                                var view = new detail.View({ data: data });
                                popup.idle().empty().append(
                                    view.render().expand().$el.addClass('no-padding')
                                );
                            }
                        });
                    });
                }
            });

        }
    });

});
