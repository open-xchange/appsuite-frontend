/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define(['io.ox/backbone/validation'], function (validation) {

    'use strict';

    describe('Backbone validations', function () {

        describe('validating the "any float" format', function () {
            it('should accept 123,45', function () {
                expect(validation.formats.anyFloat('123.45'), 'validating 123.45').to.be.true;
                expect(validation.formats.anyFloat('123,45'), 'validating 123,45').to.be.true;
            });
            it('should accept 100,00 as well as 100.00', function () {
                expect(validation.formats.anyFloat('100.00'), 'validating 100.00').to.be.true;
                expect(validation.formats.anyFloat('100,00'), 'validating 100,00').to.be.true;
            });
            it('should reject no-number,3', function () {
                expect(validation.formats.anyFloat('no-number,3')).to.equal('Bitte geben Sie eine gültige Zahl ein.');
            });
        });

    });
});
