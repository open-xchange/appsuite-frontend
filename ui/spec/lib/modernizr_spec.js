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
    describe('identifies supported features', function () {
        it('should return a boolean for touch feature', function () {
            expect(Modernizr.touch).toBeBoolean();
        });
        it('should return a boolean for localstorage feature detect', function () {
            //expect(Modernizr.localstorage).toBeBoolean();
            expect(Modernizr.localstorage).toBeBoolean();
        });
        it('should return a boolean for indexeddb feature detect', function () {
            expect(Modernizr.indexeddb).toBeBoolean();
        });
        it('should return a boolean for csstransforms3d feature detect', function () {
            expect(Modernizr.csstransforms3d).toBeBoolean();
        });
        it('should return a boolean for inputtypes.number feature detect', function () {
            expect(Modernizr.inputtypes.number).toBeBoolean();
        });
        it('should return a boolean for draganddrop feature detect', function () {
            expect(Modernizr.draganddrop).toBeBoolean();
        });
        it('should return a boolean for filereader feature detect', function () {
            expect(Modernizr.filereader).toBeBoolean();
        });
        it('should return a boolean for draganddrop feature detect', function () {
            expect(Modernizr.draganddrop).toBeBoolean();
        });
        it('should return a boolean for backgroundsize feature detect', function () {
            expect(Modernizr.backgroundsize).toBeBoolean();
        });
        it('should return a boolean for canvas feature detect', function () {
            expect(Modernizr.canvas).toBeBoolean();
        });
        it('should return "", "maybe" or "probably" for mp3 audio feature', function () {
            expect(Modernizr.audio.mp3).toBeModernizrString();
        });
        it('should return a boolean for applicationcache feature detect', function () {
            expect(Modernizr.applicationcache).toBeBoolean();
        });
        it('should return a boolean for websqldatabase feature detect', function () {
            expect(Modernizr.websqldatabase).toBeBoolean();
        });
        it('should return a mediaquery function', function () {
            expect(Modernizr.mq).toBeFunction();
        });
    });
});
