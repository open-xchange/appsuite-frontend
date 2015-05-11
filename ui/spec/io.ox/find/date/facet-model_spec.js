/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define([
    'io.ox/find/date/facet-model'
], function (DateModel) {

    'use strict';

    function initialize  () {
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
