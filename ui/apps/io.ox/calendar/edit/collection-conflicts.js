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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/edit/collection-conflicts',
      ['io.ox/calendar/edit/model-conflict'], function (ConflictModel) {

    'use strict';

    var ConflictCollection = Backbone.Collection.extend({
        model: ConflictModel
    });
    return ConflictCollection;

});
