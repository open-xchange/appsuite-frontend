/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/actions/follow-up', function () {

    'use strict';

    return function (data) {

        // reduce data
        data = _(data).pick(
            'alarm color_label folder_id full_time location note participants private_flag shown_as title'.split(' ')
        );

        // use ox.launch to have an indicator for slow connections
        ox.load(['io.ox/calendar/edit/main']).done(function (edit) {
            edit.getApp().launch().done(function () {
                this.create(data);
                this.model.toSync = data;
            });
        });
    };
});
