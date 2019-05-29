/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/month/extensions', [
    'io.ox/core/extensions',
    'io.ox/calendar/util'
], function (ext, util) {

    'use strict';

    ext.point('io.ox/calendar/month/view/appointment').extend({
        id: 'start-time',
        index: 100,
        draw: function (baton) {
            var contentContainer = this.children('.appointment-content'),
                titleContainer = contentContainer.children('.title-container');
            titleContainer.replaceWith(titleContainer.children());
            var model = baton.model;
            if (util.isAllday(model)) return;
            var start = moment.max(baton.startDate.clone(), model.getMoment('startDate'));
            contentContainer.prepend($('<span class="start">').text(start.tz(moment().tz()).format('LT')));
        }
    });

});
