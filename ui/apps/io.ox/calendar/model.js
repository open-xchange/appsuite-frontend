/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define("io.ox/calendar/model",
    ['io.ox/calendar/api',
     'io.ox/backbone/modelFactory',
     'io.ox/core/extensions',
     'gettext!io.ox/calendar'], function (api, ModelFactory, ext, gt) {

    "use strict";

    var factory = new ModelFactory({
        ref: 'io.ox/calendar/model',
        api: api,
        model: {
            // TODO: Add convenience methods for participant handling
            // TODO: Add convenience methods for recurrence handling
            // TODO: Add convenience methods for turning full day appointments into regular appointments and back
        }
    });

    ext.point("io.ox/calendar/model/validation").extend({
        id: 'start-date-before-end-date',
        validate: function (attributes) {
            if (attributes.start_date && attributes.end_date && attributes.end_date < attributes.start_date) {
                this.add('start_date', gt("The start date must be before the end date."));
                this.add('end_date', gt("The start date must be before the end date."));
            }
        }
    });

    return {
        factory: factory,
        Appointment: factory.model,
        Appointments: factory.collection
    };


});