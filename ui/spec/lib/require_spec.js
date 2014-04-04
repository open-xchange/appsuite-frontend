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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(function () {
    describe('require static files', function () {
        it('should fetch static files via backend', function (done) {
            var def = require(['apps/file/doesnt/exist.js']);

            def.fail(function (err) {
                expect(err.requireType).to.equal('define');
                expect(err.message).to.equal('Could not read \'file/doesnt/exist.js\'');
                done();
            }).done(done);
        });

        describe('with fixture plugin', function () {
            it('should load JSON data as objects', function (done) {
                require(['fixture!test/data.json'], function (data) {
                    expect(data.test).to.equal('bar');
                    done();
                });
            });

            it('should load require modules', function (done) {
                require(['fixture!test/module.js'], function (data) {
                    expect(data.someMethod).to.be.a('function');
                    done();
                });
            });
        });
    });
});
