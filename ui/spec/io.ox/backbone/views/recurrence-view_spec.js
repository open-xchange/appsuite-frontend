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
    'io.ox/backbone/views/recurrence-view'
], function (RecurrenceView) {

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
