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

define([
    'io.ox/backbone/views/recurrence-view',
    'io.ox/calendar/model'
], function (RecurrenceView, models) {

    'use strict';

    describe('Recurrence view', function () {

        var model,
            view;

        beforeEach(function () {
            model = new Backbone.Model();
            view = new RecurrenceView({
                model: model
            }).render();
        });

        it('set recurrence_type on checkbox toggle', function () {
            expect(model.get('recurrence_type')).to.be.undefined;
            // simulate click event for phantom
            view.$('input[type="checkbox"]').prop('checked', true).trigger('change');
            expect(model.get('recurrence_type')).to.equal(2);
            expect(model.get('interval')).to.equal(1);
        });

        it('resets all model values on checkbox unset', function () {
            var checkbox = view.$('input[type="checkbox"]').prop('checked', true);
            // does not really make sense to have occurrences and until, but we need to check here, if all fields get emptied
            model.set({
                recurrence_type: 4,
                days: 16,
                month: 2,
                day_in_month: 5,
                interval: 1,
                occurrences: 7,
                until: 12398123
            });
            // simulate click event for phantom
            checkbox.prop('checked', false).trigger('change');

            expect(model.get('recurrence_type')).to.equal(0);
            expect(model.has('days')).to.be.false;
            expect(model.has('month')).to.be.false;
            expect(model.has('day_in_month')).to.be.false;
            expect(model.has('interval')).to.be.false;
            expect(model.has('occurrences')).to.be.false;
            expect(model.has('until')).to.be.false;
        });

        describe('changes recurrence on start-date change', function () {

            it('adjusts until date to be endless (daily)', function () {
                var start = 1481720709550,
                    day = 24 * 60 * 60 * 1000;

                model.set({
                    recurrence_type: 1,
                    start_date: start,
                    until: start + day
                });

                expect(model.get('until')).to.equal(start + day);

                // add two days to the start date
                model.set('start_date', model.get('start_date') + 2 * day);

                expect(model.get('until')).to.be.undefined;
            });

            it('adjusts until date to be endless (weekly)', function () {
                var start = 1481720709550,
                    day = 24 * 60 * 60 * 1000;

                model.set({
                    recurrence_type: 2,
                    start_date: start,
                    until: start + day
                });

                expect(model.get('until')).to.equal(start + day);

                // add two days to the start date
                model.set('start_date', model.get('start_date') + 2 * day);

                expect(model.get('until')).to.be.undefined;
            });

            it('changes selected days on start date change', function () {
                var day = 24 * 60 * 60 * 1000;

                model.set('start_date', 1481720709550); // 12/14/2016
                model.set({
                    recurrence_type: 2,
                    days: 1 << 3 // wednesday
                });

                expect(model.get('days')).to.equal(1 << 3);

                model.set('start_date', model.get('start_date') + day);

                expect(model.get('days')).to.equal(1 << 4); // thursday
            });

            it('change date on start date change', function () {
                var day = 24 * 60 * 60 * 1000;

                model.set('start_date', 1481720709550); // 12/14/2016
                model.set({
                    recurrence_type: 3,
                    day_in_month: 14
                });

                expect(model.get('day_in_month')).to.equal(14);

                model.set('start_date', model.get('start_date') + day);

                expect(model.get('day_in_month')).to.equal(15);
            });

            it('change month on start date change', function () {
                var month = 31 * 24 * 60 * 60 * 1000;

                model.set({
                    recurrence_type: 4,
                    start_date: 1481720709550, // 12/14/2016
                    day_in_month: 14,
                    month: 11
                });

                expect(model.get('month')).to.equal(11);

                model.set('start_date', model.get('start_date') + month);

                expect(model.get('month')).to.equal(0);
            });

        });

        describe('use "rrule" as recurrence pattern', function () {

            it('parses a daily rrule', function () {
                model = new models.Model({
                    rrule: 'FREQ=DAILY;INTERVAL=2',
                    startDate: { value: '20161214T010000', tzid: 'Europe/Berlin' }
                });
                view = new RecurrenceView({
                    model: model
                }).render();

                view.model.get('recurrence_type').should.to.equal(1);
                expect(view.model.get('interval')).to.equal(2);
            });

            it('parses a weekly rrule', function () {
                model = new models.Model({
                    rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
                    startDate: { value: '20161214T010000', tzid: 'Europe/Berlin' }
                });
                view = new RecurrenceView({
                    model: model
                }).render();

                view.model.get('recurrence_type').should.to.equal(2);
                expect(view.model.get('interval')).to.equal(1);
                expect(view.model.get('days')).to.equal(62);
            });

            it('parses a monthly rrule by date', function () {
                model = new models.Model({
                    rrule: 'FREQ=MONTHLY;BYMONTHDAY=3;COUNT=10',
                    startDate: { value: '20161214T010000', tzid: 'Europe/Berlin' }
                });
                view = new RecurrenceView({
                    model: model
                }).render();

                view.model.get('recurrence_type').should.to.equal(3);
                expect(view.model.get('interval')).to.equal(1);
                expect(view.model.get('day_in_month')).to.equal(3);
                expect(view.model.get('occurrences')).to.equal(10);
            });

            it('parses a monthly rrule by weekday', function () {
                model = new models.Model({
                    rrule: 'FREQ=MONTHLY;BYDAY=MO;BYSETPOS=1',
                    startDate: { value: '20161214T010000', tzid: 'Europe/Berlin' }
                });
                view = new RecurrenceView({
                    model: model
                }).render();

                view.model.get('recurrence_type').should.to.equal(3);
                expect(view.model.get('interval')).to.equal(1);
                expect(view.model.get('day_in_month')).to.equal(1);
                expect(view.model.get('days')).to.equal(2);
            });

            it('parses a yearly rrule by date', function () {
                model = new models.Model({
                    rrule: 'FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=3;UNTIL=20181003T235959Z',
                    startDate: { value: '20161214T010000', tzid: 'Europe/Berlin' }
                });
                view = new RecurrenceView({
                    model: model
                }).render();

                view.model.get('recurrence_type').should.to.equal(4);
                expect(view.model.get('interval')).to.equal(1);
                expect(view.model.get('day_in_month')).to.equal(3);
                expect(view.model.get('month')).to.equal(6);
                expect(view.model.get('until')).to.equal(1538607599000);
            });

            it('parses a monthly rrule by weekday', function () {
                model = new models.Model({
                    rrule: 'FREQ=YEARLY;BYMONTH=7;BYDAY=MO;BYSETPOS=1',
                    startDate: { value: '20161214T010000', tzid: 'Europe/Berlin' }
                });
                view = new RecurrenceView({
                    model: model
                }).render();

                view.model.get('recurrence_type').should.to.equal(4);
                expect(view.model.get('interval')).to.equal(1);
                expect(view.model.get('day_in_month')).to.equal(1);
                expect(view.model.get('days')).to.equal(2);
                expect(view.model.get('month')).to.equal(6);
            });

        });

        describe('change rrule of original model on mapping model changes', function () {

            beforeEach(function () {
                model = new models.Model({
                    rrule: 'FREQ=DAILY',
                    startDate: { value: '20161214T140500', tzid: 'Europe/Berlin' } // Wednesday, December 14, 2016 2:05 PM
                });
                view = new RecurrenceView({
                    model: model
                }).render();
            });

            it('for daily / weekly recurrences', function () {
                view.model.set('interval', 10);
                model.get('rrule').should.equal('FREQ=DAILY;INTERVAL=10');

                view.model.set({ 'recurrence_type': 2, days: 8 }); // weekly recurrence
                model.get('rrule').should.equal('FREQ=WEEKLY;BYDAY=WE;INTERVAL=10');

                view.model.set('days', 62); // set days to all week days
                model.get('rrule').should.equal('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;INTERVAL=10');

                view.model.set('recurrence_type', 1); // daily recurrence
                model.get('rrule').should.equal('FREQ=DAILY;INTERVAL=10');
            });

            it('for monthly recurrences', function () {
                view.model.set({ 'recurrence_type': 3, day_in_month: 14 }); // monthly recurrence by date
                model.get('rrule').should.equal('FREQ=MONTHLY;BYMONTHDAY=14');

                view.model.set({ day_in_month: 2, days: 8 });
                model.get('rrule').should.equal('FREQ=MONTHLY;BYDAY=WE;BYSETPOS=2');
            });

            it('for yearly recurrences', function () {
                view.model.set({ 'recurrence_type': 4, day_in_month: 14, month: 11 }); // yearly recurrence by date
                model.get('rrule').should.equal('FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=14');

                view.model.set({ day_in_month: 2, days: 8, month: 11 });
                model.get('rrule').should.equal('FREQ=YEARLY;BYMONTH=12;BYDAY=WE;BYSETPOS=2');
            });

            it('for recurrence endings', function () {
                view.model.set('until', 1482584709550); // Saturday, December 24, 2016 2:05 PM
                model.get('rrule').should.equal('FREQ=DAILY;UNTIL=20161224T235959Z');

                view.model.unset('until');
                view.model.set('occurrences', 10);
                model.get('rrule').should.equal('FREQ=DAILY;COUNT=10');
            });

        });

    });

});
