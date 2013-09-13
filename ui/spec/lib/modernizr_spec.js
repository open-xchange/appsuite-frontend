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
    describe('modernizr.js identifies supported features', function () {
        it('should return a boolean for touch feature detection', function () {
            expect(Modernizr.touch).toBeBoolean();
        });
        it('should return a boolean for localstorage feature detection', function () {
            //expect(Modernizr.localstorage).toBeBoolean();
            expect(Modernizr.localstorage).toBeBoolean();
        });
        it('should return a boolean for indexeddb feature detection', function () {
            expect(Modernizr.indexeddb).toBeBoolean();
        });
        it('should return a boolean for csstransforms3d feature detection', function () {
            expect(Modernizr.csstransforms3d).toBeBoolean();
        });
        it('should return a boolean for inputtypes.number feature detection', function () {
            expect(Modernizr.inputtypes.number).toBeBoolean();
        });
        it('should return a boolean for draganddrop feature detection', function () {
            expect(Modernizr.draganddrop).toBeBoolean();
        });
        it('should return a boolean for filereader feature detection', function () {
            expect(Modernizr.filereader).toBeBoolean();
        });
        it('should return a boolean for draganddrop feature detection', function () {
            expect(Modernizr.draganddrop).toBeBoolean();
        });
        it('should return a boolean for backgroundsize feature detection', function () {
            expect(Modernizr.backgroundsize).toBeBoolean();
        });
        it('should return a boolean for canvas feature detection', function () {
            expect(Modernizr.canvas).toBeBoolean();
        });
        it('should return "", "maybe" or "probably" for mp3 audio feature detection', function () {
            expect(Modernizr.audio.mp3).toBeModernizrString();
        });
        it('should return a boolean for applicationcache feature detection', function () {
            expect(Modernizr.applicationcache).toBeBoolean();
        });
        it('should return a boolean for websqldatabase feature detection', function () {
            expect(Modernizr.websqldatabase).toBeBoolean();
        });
        it('should provide a mediaquery function', function () {
            expect(Modernizr.mq).toBeFunction();
        });
    });
});
