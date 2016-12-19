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
    'gettext!io.ox/calendar/edit/main'
], function (RecurrenceView, gt) {

    'use strict';

    describe('Recurrence view', function () {

        var model,
            view,
            firstDayOfWeek = moment.localeData().firstDayOfWeek();

        beforeEach(function () {
            model = new Backbone.Model();
            view = new RecurrenceView({
                model: model
            }).render();
        });

        describe('shows correct recurrence strings', function () {

            it('has daily appointment', function () {
                model.set({
                    'recurrence_type': 1,
                    interval: 1
                });

                expect(view.$('.recurrence-summary').text()).to.equal(gt('Every day.'));
            });

            it('has appointment every two days', function () {
                model.set({
                    recurrence_type: 1,
                    interval: 5
                });

                expect(view.$('.recurrence-summary').text()).to.equal(gt('Every %1$s days.', 5));
            });

            it('has weekly appointment on single day', function () {
                model.set({
                    recurrence_type: 2,
                    interval: 1,
                    days: 16 << firstDayOfWeek // bitmask 00010000
                });

                expect(view.$('.recurrence-summary').text()).to.equal(gt('Every %1$s.', moment().weekday(4).format('dddd')));
            });

            it('has weekly appointment on multiple days', function () {
                model.set({
                    recurrence_type: 2,
                    interval: 1,
                    days: 42 << firstDayOfWeek // bitmask 00101010
                });

                expect(view.$('.recurrence-summary').text()).to.equal(gt('Every %1$s.', [
                    moment().weekday(1).format('dddd'),
                    moment().weekday(3).format('dddd'),
                    moment().weekday(5).format('dddd')
                ].join(gt(', '))));
            });

            it('has monthly appointment on month day', function () {
                model.set({
                    recurrence_type: 3,
                    interval: 1,
                    day_in_month: 25
                });

                expect(view.$('.recurrence-summary').text()).to.equal(gt('Every month on day %1$s.', 25));
            });

            it('has every 17 month appointment on month day', function () {
                model.set({
                    recurrence_type: 3,
                    interval: 17,
                    day_in_month: 25
                });

                expect(view.$('.recurrence-summary').text()).to.equal(gt('Every %1$s months on day %2$s.', 17, 25));
            });

            it('has monthly appointment every second tuesday', function () {
                model.set({
                    recurrence_type: 3,
                    interval: 1,
                    day_in_month: 2,
                    days: 4 << firstDayOfWeek // bitmask 00000100
                });

                expect(view.$('.recurrence-summary').text()).to.equal(gt('Every month on the %1$s %2$s.', gt('second'), moment().weekday(2).format('dddd')));
            });

            it('has appointment every 15 months on the third wednesday', function () {
                model.set({
                    recurrence_type: 3,
                    interval: 15,
                    day_in_month: 3,
                    days: 8 << firstDayOfWeek // bitmask 00001000
                });

                expect(view.$('.recurrence-summary').text()).to.equal(gt('Every %1$s months on the %2$s %3$s.', 15, gt('third'), moment().weekday(3).format('dddd')));
            });

            it('has yearly appointment on month day', function () {
                model.set({
                    recurrence_type: 4,
                    interval: 1,
                    day_in_month: 13,
                    month: 8
                });

                expect(view.$('.recurrence-summary').text()).to.equal(gt('Every year in %1$s on day %2$s.', moment().month(8).format('MMMM'), 13));
            });

            it('has yearly appointment on first friday in november', function () {
                model.set({
                    recurrence_type: 4,
                    interval: 1,
                    day_in_month: 1,
                    month: 10,
                    days: 32 << firstDayOfWeek // bitmask 00100000
                });

                expect(view.$('.recurrence-summary').text()).to.equal(gt(
                    'Every year on the %1$s %2$s in %3$s.',
                    gt('first'),
                    moment().weekday(5).format('dddd'),
                    moment().month(10).format('MMMM')
                ));
            });

        });

        describe('has correct string when recurrence ends', function () {

            it('has single occurence repeat string', function () {
                model.set({
                    recurrence_type: 3,
                    occurrences: 1
                });

                expect(view.$('.ends-summary').text()).to.equal(gt('The series ends after one occurrence.'));
            });

            it('has multiple occurence repeat string', function () {
                model.set({
                    recurrence_type: 3,
                    occurrences: 13
                });

                expect(view.$('.ends-summary').text()).to.equal(gt('The series ends after %1$s occurrences.', 13));
            });

            it('has a date when the appointment ends', function () {
                model.set({
                    recurrence_type: 3,
                    until: 1481720709550
                });

                expect(view.$('.ends-summary').text()).to.equal(gt('The series ends on %1$s.', moment(1481720709550).format('l')));
            });

        });

        it('set recurrence_type on checkbox toggle', function () {
            expect(model.get('recurrence_type')).to.be.undefined;
            // simulate click event for phantom
            view.$('input[type="checkbox"]').prop('checked', true).trigger('change');
            expect(model.get('recurrence_type')).to.equal(1);
            expect(model.get('interval')).to.equal(1);
        });

        it('resets all model values on checkbox unset', function () {
            var checkbox = view.$('input[type="checkbox"]').prop('checked', true);
            // does not really make sense to have occurences and until, but we need to check here, if all fields get emptied
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

            it('adjusts until date to be after start date (daily)', function () {
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

                expect(model.get('until')).to.equal(start + 3 * day);
            });

            it('adjusts until date to be after start date (weekly)', function () {
                var start = 1481720709550,
                    day = 24 * 60 * 60 * 1000,
                    week = 7 * day;

                model.set({
                    recurrence_type: 2,
                    start_date: start,
                    until: start + day
                });

                expect(model.get('until')).to.equal(start + day);

                // add two days to the start date
                model.set('start_date', model.get('start_date') + 2 * day);

                expect(model.get('until')).to.equal(start + 2 * day + week);
            });

            it('changes selected days on start date change', function () {
                var day = 24 * 60 * 60 * 1000;

                model.set({
                    recurrence_type: 2,
                    start_date: 1481720709550, // 12/14/2016
                    days: 1 << 3 // wednesday
                });

                expect(model.get('days')).to.equal(1 << 3);

                model.set('start_date', model.get('start_date') + day);

                expect(model.get('days')).to.equal(1 << 4); // thursday
            });

            it('change date on start date change', function () {
                var day = 24 * 60 * 60 * 1000;

                model.set({
                    recurrence_type: 3,
                    start_date: 1481720709550, // 12/14/2016
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

    });

});
