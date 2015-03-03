/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/model',
    ['io.ox/core/date',
     'io.ox/tasks/api',
     'io.ox/backbone/modelFactory',
     'io.ox/backbone/validation',
     'io.ox/core/extensions',
     'io.ox/participants/model',
     'gettext!io.ox/tasks'
    ], function (date, api, ModelFactory, Validations, ext, pModel, gt) {

    'use strict';

    var defaults = {
            title: '',
            status: 1,
            percent_completed: 0,
            folder_id: api.getDefaultFolder(),
            recurrence_type: 0,
            private_flag: false,
            //set always (OX6 does this too)
            notification: true
        },
        factory = new ModelFactory({
            ref: 'io.ox/tasks/model',
            api: api,
            model: {
                defaults: defaults,
                getParticipants: function () {
                    if (this._participants) {
                        return this._participants;
                    }
                    var self = this,
                        resetListUpdate = false,
                        changeParticipantsUpdate = false,
                        participants = this._participants = new pModel.Participants(this.get('participants'));
                    participants.invoke('fetch');

                    function resetList() {
                        if (changeParticipantsUpdate) {
                            return;
                        }
                        resetListUpdate = true;
                        self.set('participants', participants.getAPIData());
                        resetListUpdate = false;
                    }

                    participants.on('add remove reset', resetList);

                    this.on('change:participants', function () {
                        if (resetListUpdate) {
                            return;
                        }
                        changeParticipantsUpdate = true;
                        participants.reset(self.get('participants'));
                        participants.invoke('fetch');
                        changeParticipantsUpdate = false;
                    });

                    return participants;
                },
                // special functions for datepicker
                getDate: function (attr) {
                    var time = this.get.apply(this, arguments);
                    if (time && _.indexOf(['start_date', 'end_date'], attr) >= 0) {
                        time = date.Local.utc(time);
                    }
                    return time;
                },
                setDate: function (attr, time) {
                    if (time && _.indexOf(['start_date', 'end_date'], attr) >= 0) {
                        arguments[1] = date.Local.localTime(time);
                   }
                    return this.set.apply(this, arguments);
                }
            }
        });

    Validations.validationFor('io.ox/tasks/model', {
        start_date: {format: 'date'},
        end_date: {format: 'date'},
        alarm: {format: 'date'},
        title: {format: 'string'},
        note: {format: 'string'},
        companies: {format: 'string'},
        billing_information: {format: 'string'},
        trip_meter: {format: 'string'},
        currency: {format: 'string'},
        status: {format: 'number'},
        percent_completed: {format: 'number'},
        number_of_attachments: {format: 'number'},
        //floats with , or . as separator
        actual_costs: {format: 'anyFloat'},
        //floats with , or . as separator
        target_costs: {format: 'anyFloat'},
        actual_duration: {format: 'number'},
        target_duration: {format: 'number'},
        private_flag: { format: 'boolean'}
    });

    ext.point('io.ox/tasks/model/validation').extend({
        id: 'start-date-before-end-date',
        validate: function (attributes) {
            //start_date = end_date is valid
            if (attributes.start_date && attributes.end_date && attributes.end_date < attributes.start_date) {
                this.add('end_date', gt('The start date must be before the due date.'));
            }
        }
    });

    var MAX = 9999999999.99;

    ext.point('io.ox/tasks/model/validation').extend({
        id: 'Actual-costs-out-of-limits',
        validate: function (attributes) {
            if (attributes.actual_costs && (attributes.actual_costs < -MAX || attributes.actual_costs > MAX)) {
                this.add('actual_costs', gt('Costs must be between -%1$d and %1$d.', MAX, MAX));
            }
        }
    });
    ext.point('io.ox/tasks/model/validation').extend({
        id: 'target-costs-out-of-limits',
        validate: function (attributes) {
            if (attributes.target_costs && (attributes.target_costs < -MAX || attributes.target_costs > MAX)) {
                this.add('target_costs', gt('Costs must be between -%1$d and %1$d.', MAX, MAX));
            }
        }
    });

    ext.point('io.ox/tasks/model/validation').extend({
        id: 'more than 2 decimal places',
        validate: function (attributes) {
            var tCosts = String(attributes.target_costs),
                aCosts = String(attributes.actual_costs);

            if (tCosts && (tCosts.substr(tCosts.indexOf('.')).length > 3 || tCosts.substr(tCosts.indexOf(',')).length > 3)) {
                this.add('target_costs', gt('Costs must only have two decimal places.'));
            }
            if (aCosts && (aCosts.substr(aCosts.indexOf('.')).length > 3 || aCosts.substr(aCosts.indexOf(',')).length > 3)) {
                this.add('actual_costs', gt('Costs must only have two decimal places.'));
            }
        }
    });

    ext.point('io.ox/tasks/model/validation').extend({
        id: 'progress-not-between-0-and-100',
        validate: function (attributes) {
            if (attributes.percent_completed && (attributes.percent_completed < 0 || attributes.percent_completed > 100)) {
                this.add('percent_completed', gt('Progress must be a valid number between 0 and 100'));
            }
        }
    });

    ext.point('io.ox/tasks/model/validation').extend({
        id: 'recurrence-needs-start-date',
        validate: function (attributes) {
            //0 is a valid number so check precisely
            if (attributes.recurrence_type && (attributes.start_date === undefined || attributes.start_date === null)) {
                this.add('start_date', gt('Recurring tasks need a valid start date.'));
            }
        }
    });

    ext.point('io.ox/tasks/model/validation').extend({
        id: 'recurrence-needs-end-date',
        validate: function (attributes) {
            //0 is a valid number so check precisely
            if (attributes.recurrence_type && (attributes.end_date === undefined || attributes.end_date === null)) {
                this.add('end_date', gt('Recurring tasks need a valid due date.'));
            }
        }
    });

    return {
        defaults: defaults,
        factory: factory,
        task: factory.model,
        tasks: factory.collection
    };
});
