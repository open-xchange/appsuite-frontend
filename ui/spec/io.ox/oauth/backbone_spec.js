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
define(['io.ox/oauth/backbone'], function (OAuth) {

    describe('OAuth', function () {
        describe('Account Model', function () {
            var Model = OAuth.Account.Model;

            it('should be a Backbone Model', function () {
                var m = new Model();
                expect(m).to.exist;
            });

            it('should have a way to query enabled scopes', function () {
                var m = new Model({
                    enabledScopes: ['drive', 'mail']
                });
                expect(m.hasScope).to.be.a('function');
                expect(m.hasScope('drive')).to.be.true;
                expect(m.hasScope('mail')).to.be.true;
                expect(m.hasScope('not existing')).to.be.false;
            });
        });
    });
});
