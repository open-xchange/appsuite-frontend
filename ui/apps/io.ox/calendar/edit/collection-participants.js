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

define('io.ox/calendar/edit/collection-participants',
      ['io.ox/calendar/edit/model-participant'], function (ParticipantModel) {
    'use strict';

    var ParticipantsCollection = Backbone.Collection.extend({
        model: ParticipantModel
    });

    return ParticipantsCollection;

});

