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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'io.ox/calendar/month/perspective',
    'io.ox/core/moment'
], function (perspective, moment) {
    'use strict';

    describe('Calendar month view perspective', function () {

        it('should render Oct 2017 correctly (de_DE)', function () {
            // disable loading appointments
            var stub = sinon.stub(perspective, 'updateWeeks').returns($.when());

            var $el = perspective.pane = $('<div>');
            perspective.lastWeek = moment('20171001');
            perspective.drawWeeks({});
            expect($el.find('.cw:first').text(), 'First week').to.equal('KW 39');
            expect($el.find('.first.day').toArray().map(function (el) { return el.id; }), 'first days rendered element ids').to.contain('2017-10-1').and.to.contain('2017-11-1');

            expect($el.find('table.month:first .week:last .day').toArray().map(function (el) { return el.id.slice(5, 7); }), 'Last week of October does not contain November days').not.to.contain('11');
            expect($el.find('table.month:first .week:nth-child(2) .day').toArray().map(function (el) { return el.id.slice(8, 10); }), 'Second week of October in present').to.contain('2').and.to.contain('8');
            expect($el.find('table.month:last .week:first .day').toArray().map(function (el) { return el.id.slice(5, 7); }), 'First week of November does not contain October days').not.to.contain('10');

            stub.restore();
        });

        it('should render Oct 2017 correctly (en_US)', function () {
            // special in en_US
            moment.locale('en_US');
            // disable loading appointments
            var stub = sinon.stub(perspective, 'updateWeeks').returns($.when());

            var $el = perspective.pane = $('<div>');
            perspective.lastWeek = moment('20171001');
            perspective.drawWeeks({});
            expect($el.find('.cw:first').text(), 'First week').to.equal('KW 40');
            expect($el.find('.first.day').toArray().map(function (el) { return el.id; }), 'first days rendered element ids').to.contain('2017-10-1').and.to.contain('2017-11-1');

            expect($el.find('table.month:first .week:last .day').toArray().map(function (el) { return el.id.slice(5, 7); }), 'Last week of October does not contain November days').not.to.contain('11');
            expect($el.find('table.month:last .week:first .day').toArray().map(function (el) { return el.id.slice(5, 7); }), 'First week of November does not contain October days').not.to.contain('10');

            stub.restore();
            moment.locale('de_DE');
        });
    });
});
