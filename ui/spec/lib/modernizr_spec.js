/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(function () {
    var expect = chai.expect;
    describe('modernizr.js identifies supported features (non booleans)', function () {
        it('should return "", "maybe" or "probably" for mp3 audio feature detection', function () {
            expect(Modernizr.audio.mp3).to.satisfy(function (val) {
                return !val || val === '' ||  val === 'maybe' ||  val === 'probably';
            });
        });
        it('should provide a mediaquery function', function () {
            expect(Modernizr.mq).to.be.a('function');
        });
    });
    describe('modernizr.js identifies supported features (booleans)', function () {
        it('should return a boolean for touch feature detection', function () {
            expect(Modernizr.touch).to.be.a('boolean');
        });
        it('should return a boolean for localstorage feature detection', function () {
            expect(Modernizr.localstorage).to.be.a('boolean');
        });
        it('should return a boolean for indexeddb feature detection', function () {
            expect(Modernizr.indexeddb).to.be.a('boolean');
        });
        it('should return a boolean for csstransforms3d feature detection', function () {
            expect(Modernizr.csstransforms3d).to.be.a('boolean');
        });
        it('should return a boolean for inputtypes.number feature detection', function () {
            expect(Modernizr.inputtypes.number).to.be.a('boolean');
        });
        it('should return a boolean for draganddrop feature detection', function () {
            expect(Modernizr.draganddrop).to.be.a('boolean');
        });
        it('should return a boolean for filereader feature detection', function () {
            expect(Modernizr.filereader).to.be.a('boolean');
        });
        it('should return a boolean for draganddrop feature detection', function () {
            expect(Modernizr.draganddrop).to.be.a('boolean');
        });
        it('should return a boolean for backgroundsize feature detection', function () {
            expect(Modernizr.backgroundsize).to.be.a('boolean');
        });
        it('should return a boolean for canvas feature detection', function () {
            expect(Modernizr.canvas).to.be.a('boolean');
        });
        it('should return a boolean for applicationcache feature detection', function () {
            expect(Modernizr.applicationcache).to.be.a('boolean');
        });
        it('should return a boolean for websqldatabase feature detection', function () {
            expect(Modernizr.websqldatabase).to.be.a('boolean');
        });
    });
});
