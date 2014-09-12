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
define([
    'io.ox/emoji/main',
    'settings!io.ox/mail/emoji'
], function (emoji, settings) {
    'use strict';

    describe('Emoji support', function () {
        beforeEach(function () {
            settings.set('availableCollections', 'unified');
            settings.set('userCollection', 'unified');
        });

        describe('can convert different encodings', function () {
            var testIcons = {
                japan_carrier: '\ud83d\ude09', // winking face - available in all collections
                softbank: '\ud83d\ude37', // face with medical mask - only available in unified and softbank
                unified: '\ud83d\udcb3' // 'credit card - only available in unified
            };

            it('should provide a converterFor generator method', function () {
                expect(emoji.converterFor).to.be.a('function');
            });

            it('should return undefined for unknown conversions', function () {
                expect(emoji.converterFor({ from: 'someThingStupid', to: 'nothing' })).not.to.exist;
            });

            it('should return a conversion method', function () {
                expect(emoji.converterFor({ from: 'unified', to: 'unified' })).to.be.a('function');
            });

            describe('unified -> pua', function () {
                var convert = emoji.converterFor({ from: 'unified', to: 'pua' });

                it('should provide a converter', function () {
                    expect(convert).to.be.a('function');
                });

                it('should convert from unicode6 encoding to pua', function () {
                    expect(convert('\u2600')).to.equal('\ue04a');
                });

                it('should fall back to unified if no PUA encoding available', function () {
                    expect(convert(testIcons.unified)).to.equal(testIcons.unified);
                });

                it('should leave non-emoji characters intact in text format', function () {
                    expect(convert('> \u2600')).to.equal('> \ue04a');
                });

                it('should leave embedded HTML intact', function () {
                    //TODO: converting <img src="test.png" /> will be converted to <img src="test.png">
                    //this is because of jQuery doing to much magic, may be this can break stuff :\
                    expect(convert('<img src="test.png">\u2600')).to.equal('<img src="test.png">\ue04a');
                });

                it('should leave "<" or ">" characters embedded in text intact', function () {
                    var testStr = 'On Tuesday "Some Body" <somebody@example.com> wrote:';
                    expect(convert(testStr)).to.equal(testStr);
                });

                it('should also convert on emoji enabled devices', function () {
                    var stub = sinon.stub(_, 'device');
                    stub.withArgs('emoji').returns(true);

                    expect(convert('> \u2600')).to.equal('> \ue04a');
                    stub.restore();
                });

                describe('convert image tags to PUA encoding', function () {
                    it('should convert black sun with rays', function () {
                        var text = emoji.unifiedToImageTag('\u2600');

                        expect(emoji.imageTagsToPUA(text)).to.equal('\ue04a');
                    });

                    it('should fall back to unified if no PUA encoding available', function () {
                        var text = emoji.unifiedToImageTag(testIcons.unified);

                        expect(emoji.imageTagsToPUA(text)).to.equal(testIcons.unified);
                    });
                });
            });

            describe('shift_jis -> unified', function () {
                it('should provide a jisToUnified method', function () {
                    expect(emoji.jisToUnified).to.be.a('function');
                });

                it('should convert from shift_jis encoding to unified', function () {
                    expect(emoji.jisToUnified('\uf98b')).to.equal('\u2600');
                });
            });

            describe('all -> unified', function () {
                var convert = emoji.converterFor({ from: 'all', to: 'unified' });

                it('should convert all known encodings to unified', function () {
                    var text = 'softbank: \ue04a; shift_jis: \uf98b; unified: \u2600';
                    expect(convert(text)).to.equal('softbank: \u2600; shift_jis: \u2600; unified: \u2600');
                });

                it('should not fail with undefined parameter', function () {
                    expect(convert()).to.equal('');
                });
            });
            // everything else should be tested by emoji lib
        });
    });
});
