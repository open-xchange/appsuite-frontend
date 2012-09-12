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
define("io.ox/calendar/model", ['io.ox/calendar/api', 'io.ox/backbone/modelFactory', 'io.ox/core/extensions'], function (api, ModelFactory, ext) {
    
    var factory = new ModelFactory({
        ref: 'io.ox/calendar/model',
        api: api
    });
    
    ext.point("io.ox/calendar/model/validation").extend({
        id: 'start-date-before-end-date',
        validate: function (attributes) {
            
        }
    });
    
    return {
        factory: factory,
        Appointment: factory.model,
        Appointments: factory.collection
    };
    
    
});