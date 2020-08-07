/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
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
