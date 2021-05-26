/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
