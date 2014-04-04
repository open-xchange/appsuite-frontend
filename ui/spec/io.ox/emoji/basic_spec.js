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

            this.emoji = emoji.getInstance();
        });

        describe('using basic API', function () {
            it('should get CSS for unicode emoji', function () {
                expect(this.emoji.cssFor('\u2600')).to.equal('emoji-unified emoji2600');
            });

            it('should not provide any CSS for unknown unicode', function () {
                expect(this.emoji.cssFor('\u2599')).not.to.exist;
            });

            it('should provide information for unicode emoji', function () {
                var info = this.emoji.iconInfo('\u2600');
                expect(typeof info).to.equal('object');
                expect(info.desc).to.equal('black sun with rays');
                expect(info.category).to.equal('Nature');
                expect(info.unicode).to.equal('\u2600');
                expect(info.css).to.equal('emoji-unified emoji2600');
            });

            it('should provide dummy information for unknown unicodes', function () {
                expect(this.emoji.iconInfo('\u2599')).not.to.exist;
            });

            it('should convert unified unicode emoji to image tag', function () {
                var imgTag = emoji.unifiedToImageTag('\u2600'),
                    text = emoji.unifiedToImageTag('On Tuesday "Some Body" <somebody@example.com> wrote: \u2600'),
                    test = 'On Tuesday "Some Body" <somebody@example.com> wrote: ' +
                           '<img src="apps/themes/login/1x1.gif" class="emoji emoji-unified emoji2600" ' +
                           'data-emoji-unicode="\u2600" alt="\u2600">';

                expect($(imgTag).attr('data-emoji-unicode')).to.equal('\u2600');
                //leave text between <> as is!
                expect(text).to.equal(test);
            });

            describe('should convert more than one emoji icon to image tag', function () {
                beforeEach(function () {
                    settings.set('defaultCollection', 'unified');
                    this.imgTag = emoji.unifiedToImageTag('\u2600 \u2601');
                    this.expected = '<img src="apps/themes/login/1x1.gif" class="emoji emoji-unified emoji2600" ' +
                                    'data-emoji-unicode="\u2600" alt="\u2600"> <img src="apps/themes/login/1x1.gif" ' +
                                    'class="emoji emoji-unified emoji2601" data-emoji-unicode="\u2601" alt="\u2601">';
                });

                it('with default collection', function () {
                    expect(this.imgTag).to.equal(this.expected);
                });

                it('with overrideUserCollection setting enabled', function () {
                    settings.set('overrideUserCollection', true);
                    this.imgTag = emoji.unifiedToImageTag('\u2600 \u2601');

                    expect(this.imgTag).to.equal(this.expected);
                });
            });

            it('should convert special image tags to unified emoji unicode', function () {
                var imgTag = emoji.unifiedToImageTag('\u2600');

                expect(emoji.imageTagsToUnified(imgTag)).to.equal('\u2600');
            });
        });

        describe('handles different unicode encoding lengths', function () {
            it('should support plain 2-byte UTF8 emojis', function () {
                var description = this.emoji.iconInfo('\u2600').desc,
                    imgTag = emoji.unifiedToImageTag('\u2600');

                expect(description).to.equal('black sun with rays');
                expect($(imgTag).attr('data-emoji-unicode')).to.equal('\u2600');
            });

            it('should support plain 3-byte UTF8 emojis', function () {
                var description = this.emoji.iconInfo('1\u20e3').desc,
                    imgTag = emoji.unifiedToImageTag('1\u20e3');

                expect(description).to.equal('keycap 1');
                expect($(imgTag).attr('data-emoji-unicode')).to.equal('1\u20e3');
            });

            it('should support plain 4-byte UTF8 emojis', function () {
                var description = this.emoji.iconInfo('\ud83d\udca9').desc,
                    imgTag = emoji.unifiedToImageTag('\ud83d\udca9');

                expect(description).to.equal('pile of poo');
                expect($(imgTag).attr('data-emoji-unicode')).to.equal('\ud83d\udca9');
            });

            it('should support plain 8-byte UTF8 emojis', function () {
                var description = this.emoji.iconInfo('\ud83c\uddef\ud83c\uddf5').desc,
                    imgTag = emoji.unifiedToImageTag('\ud83c\uddef\ud83c\uddf5');

                expect(description).to.equal('regional indicator symbol letters jp');
                expect($(imgTag).attr('data-emoji-unicode')).to.equal('\ud83c\uddef\ud83c\uddf5');
            });
        });
    });
});
