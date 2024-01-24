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
    'io.ox/core/extensions'
], function (ext) {
    describe.skip('Core: appcontrol extensions', function () {

        beforeEach(function () {
            $('body').append($('<div id="io-ox-appcontrol">'));
        });
        afterEach(function () {
            $('#io-ox-appcontrol').remove();
            $('#io-ox-launchgrid-overlay').remove();
        });
        describe('right area', function () {
            const point = ext.point('io.ox/core/appcontrol/right');
            let extensions;

            beforeEach(function () {
                // store state
                extensions = point.all();
            });

            afterEach(function () {
                while (point.all().length > 0) point.all().pop();
                extensions.forEach((e) => point.all().push(e));
            });

            it('should call the draw function of an extension', function () {
                const spy = sinon.spy();
                point.extend({
                    id: 'test',
                    draw: spy
                });
                ext.point('io.ox/core/appcontrol').invoke('draw');
                expect(spy.calledOnce, 'draw called once').to.be.true;
            });

            it('should draw a parent element for the extension point', function () {
                ext.point('io.ox/core/appcontrol').invoke('draw');
                const launchers = $('#io-ox-appcontrol').find('#io-ox-toprightbar .taskbar');
                expect(launchers.length, 'toprightbar element found').to.equal(1);
            });

            describe('default extensions', function () {
                it('should draw a notification bubble', function () {
                    ext.point('io.ox/core/appcontrol').invoke('draw');
                    expect($('#io-ox-toprightbar .taskbar .notifications-icon').length, 'number of notification elements in toprightbar').to.equal(1);
                });

                it('should draw a refresh indicator button', function () {
                    ext.point('io.ox/core/appcontrol').invoke('draw');
                    expect($('#io-ox-toprightbar .taskbar .fa-refresh').length, 'number of refresh elements in toprightbar').to.equal(1);
                });
            });

            describe('Drowpdown menu drawing', function () {
                const point = ext.point('io.ox/core/appcontrol/right/account');

                beforeEach(function () {
                    // store state
                    extensions = point.all();
                });

                afterEach(function () {
                    while (point.all().length > 0) point.all().pop();
                    extensions.forEach((e) => point.all().push(e));
                });

                it('should call extend function with dropdown scope', function () {
                    const spy = sinon.spy();
                    point.extend({
                        id: 'test',
                        extend: spy //function () { spy(this); }
                    });

                    ext.point('io.ox/core/appcontrol').invoke('draw');
                    console.log($('#io-ox-appcontrol'));

                    expect(spy.calledOnce, 'extend called once').to.be.true;
                });
            });
        });
    });
});
