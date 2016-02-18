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
define(['io.ox/files/mediasupport'], function (ms) {
    var expect = chai.expect;

    describe('Files mediasupport util', function () {

        describe('has some methods', function () {
            it('that always use same return type', function () {
                expect(ms.hasSupport(undefined)).to.be.a('boolean');
                expect(ms.checkFile(undefined)).to.be.a('boolean');
                expect(ms.supportedExtensionsArray(undefined)).to.be.an('array');
                expect(ms.supportedExtensions(undefined)).to.be.a('string');
            });
            it('that ignore audio support for android stock browser', function () {
                //fake browser and device
                var browser = $.extend({}, _.browser);
                _.browser = {
                    chrome: 18
                };
                sinon.stub(_, 'device', function () {
                    return 'android';
                });
                //test
                expect(ms.hasSupport('audio')).to.be.false;
                //restore
                _.device.restore();
                _.browser = browser;
            });
        });

    });
});
