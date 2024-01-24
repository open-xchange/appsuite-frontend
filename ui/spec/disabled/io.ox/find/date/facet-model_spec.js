/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define([
    'io.ox/find/date/facet-model'
], function (DateModel) {

    'use strict';

    function initialize() {
        var data = {
            'cid': 'date.custom',
            'id': 'date.custom',
            'style': 'custom',
            'name': 'Date',
            'flags': [
                'tokenfield'
            ],
            'values': [{
                'id': 'custom',
                'facet': 'date.custom',
                'item': {
                    'name': 'fr',
                    'detail': 'as date'
                },
                'value': 'fr',
                'options': []
            }]
        };
        this.facet = new DateModel(data);
        this.value = this.facet.getValue();
        this.match = this.value.get('date-match');
        return $.Deferred().resolve();
    }

    describe('Find\u0027s date facet:', function () {

        beforeEach(function (done) {
            this.initialized = (this.initialized || initialize.call(this)).done(done);
        });

        it('custom models are used', function () {
            it('for facet', function () {
                expect(this.facet.type).to.equal('facetDate');
            });
            it('for value', function () {
                expect(this.facet.type).to.equal('valueDate');
            });
        });

        describe('invalid input leads to', function () {
            it('an empty value list', function () {
                this.facet.update([{
                    'id': 'custom',
                    'facet': 'date.custom',
                    'item': {
                        'name': 'some invalid date string',
                        'detail': 'as date'
                    },
                    'value': 'some invalid date string',
                    'options': []
                }]);
                expect(this.facet.get('values').models).to.be.empty;
            });
        });

        describe('valid input leads to', function () {
            beforeEach(function () {
                this.facet.update([{
                    'id': 'custom',
                    'facet': 'date.custom',
                    'item': {
                        'name': 'ju',
                        'detail': 'as date'
                    },
                    'value': 'ju',
                    'options': []
                }]);
            });

            it('at least one value', function () {
                expect(this.facet.get('values').models).to.have.length.above(0);
            });

            describe('with an match', function () {
                it('that is defined', function () {
                    expect(this.match).to.be.an('object');
                });
                it('that has an valid start/end date', function () {
                    expect(this.match.start.isValid()).to.be.true;
                    expect(this.match.end.isValid()).to.be.true;
                });
            });
        });
    });
});
