/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'moxiecode/tiny_mce/plugins/emoji/main',
    'settings!io.ox/mail/emoji'
], function (emoji, settings) {
    "use strict";

    describe('Emoji support', function () {
        beforeEach(function () {
            settings.set('availableCollections', 'unified');
            settings.set('userCollection', 'unified');
        });

        describe('can convert different encodings', function () {
            it('should provide a converterFor generator method', function () {
                expect(emoji.converterFor).toBeFunction();
            });

            it('should return undefined for unknown conversions', function () {
                expect(emoji.converterFor({from: 'someThingStupid', to: 'nothing'})).toBeUndefined();
            });

            it('should return a conversion method', function () {
                expect(emoji.converterFor({from: 'unified', to: 'unified'})).toBeFunction();
            });

            describe('unified -> pua', function () {
                beforeEach(function () {
                    this.emoji = emoji.getInstance();
                    this.testIcons = {
                        japan_carrier: '\ud83d\ude09', // winking face - available in all collections
                        softbank: '\ud83d\ude37', // face with medical mask - only available in unified and softbank
                        unified: '\ud83d\udcb3' // 'credit card - only available in unified
                    };
                    this.convert = emoji.converterFor({from: 'unified', to: 'pua'});
                });

                it('should provide a converter', function () {
                    expect(this.convert).toBeFunction();
                });

                it('should convert from unicode6 encoding to pua', function () {
                    expect(this.convert('\u2600')).toBe('\ue04a');
                });

                it('should fall back to unified if no PUA encoding available', function () {
                    expect(this.convert(this.testIcons.unified)).toBe(this.testIcons.unified);
                });

                it('should leave non-emoji characters intact', function () {
                    expect(this.convert('> \u2600')).toBe('> \ue04a');
                });

                it('should leave embedded HTML intact', function () {
                    //TODO: converting <img src="test.png" /> will be converted to <img src="test.png">
                    //this is because of jQuery doing to much magic, may be this can break stuff :\
                    expect(this.convert('<img src="test.png">\u2600')).toEqual('<img src="test.png">\ue04a');
                });

                describe('convert image tags to PUA encoding', function () {
                    it('should convert black sun with rays', function () {
                        var text = emoji.unifiedToImageTag('\u2600');

                        expect(emoji.imageTagsToPUA(text)).toBe('\ue04a');
                    });

                    it('should fall back to unified if no PUA encoding available', function () {
                        var text = emoji.unifiedToImageTag(this.testIcons.unified);

                        expect(emoji.imageTagsToPUA(text)).toBe(this.testIcons.unified);
                    });
                });
            });

            describe('shift_jis -> unified', function () {
                it('should provide a jisToUnified method', function () {
                    expect(emoji.jisToUnified).toBeFunction();
                });

                it('should convert from shift_jis encoding to unified', function () {
                    expect(emoji.jisToUnified('\uf98b')).toBe('\u2600');
                });
            });
            // everything else should be tested by emoji lib
        });
    });
});
