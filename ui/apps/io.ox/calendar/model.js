/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/model',
      ['io.ox/core/tk/model'], function (Model) {
    'use strict';

    var appointmentScheme = new Model.Schema({
        'title': {format: 'string'},
        'location': {format: 'string'},
        'start_date': {format: 'datetime'},
        'end_date': {format: 'datetime'},
        'note': {format: 'string'},
        'alarm': {format: 'number'},
        'recurrence_position': {format: 'number'},
        'recurrence_data_position': {format: 'date'},
        'recurrence_type': {format: 'number'},
        'change_exceptions': {format: 'array'},
        'delete_execptions': {format: 'array'},
        'days': {format: 'number'},
        'day_in_month': {format: 'number'},
        'month': {format: 'number'},
        'interval': {format: 'number'},
        'until': {format: 'date'},
        'notification': {format: 'boolean'},
        'participants': {format: 'array'},
        'users': {format: 'array'},
        'occurrences': {format: 'number'},
        'uid': {format: 'string'},
        'organizer': {format: 'string'},
        'sequence': {format: 'number'},
        'organizerId': {format: 'number'},
        'principal': {format: 'string'},
        'principalId': {format: 'number'}
    });

    var participantScheme = new Model.Schema({
        'id': {format: 'number'},
        'type': {format: 'number'},
        'mail': {format: 'string'}
    });

    var userParticipantScheme = new Model.Schema({
        'id': {format: 'number'},
        'display_name': {format: 'string'},
        'confirmation': {format: 'number'},
        'confirmmessage': {format: 'string'}
    });

    var confirmingParticipantSchema = new Model.Schema({
        'type': {format: 'number'},
        'mail': {format: 'string'},
        'display_name': {format: 'string'},
        'status': {format: 'number'},
        'confirmmessage': {format: 'string'}
    });

    return Model.extend({schema: appointmentScheme});


});
