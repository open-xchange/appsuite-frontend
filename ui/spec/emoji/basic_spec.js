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

            this.emoji = emoji.getInstance();
        });

        describe('using basic API', function () {
            it('should get CSS for unicode emoji', function () {
                expect(this.emoji.cssFor('\u2600')).toBe('emoji-unified emoji2600');
            });

            it('should not provide any CSS for unknown unicode', function () {
                expect(this.emoji.cssFor('\u2599')).not.toBeDefined();
            });

            it('should provide information for unicode emoji', function () {
                var info = this.emoji.iconInfo('\u2600');
                expect(typeof info).toBe('object');
                expect(info.desc).toBe('black sun with rays');
                expect(info.category).toBe('Nature');
                expect(info.unicode).toBe('\u2600');
                expect(info.css).toBe('emoji-unified emoji2600');
            });

            it('should provide dummy information for unknown unicodes', function () {
                expect(this.emoji.iconInfo('\u2599')).not.toBeDefined();
            });

            it('should convert unified unicode emoji to image tag', function () {
                var imgTag = emoji.unifiedToImageTag('\u2600'),
                    text = emoji.unifiedToImageTag('On Tuesday "Some Body" <somebody@example.com> wrote: \u2600'),
                    test = 'On Tuesday "Some Body" <somebody@example.com> wrote: ' +
                           '<img src="apps/themes/login/1x1.gif" class="emoji-unified emoji2600" ' +
                           'data-emoji-unicode="\u2600">';

                expect($(imgTag).attr('data-emoji-unicode')).toBe('\u2600');
                //leave text between <> as is!
                expect(text).toBe(test);
            });

            describe('should convert more than one emoji icon to image tag', function () {
                beforeEach(function () {
                    settings.set('defaultCollection', 'unified');
                    this.imgTag = emoji.unifiedToImageTag('\u2600 \u2601');
                    this.expected = '<img src="apps/themes/login/1x1.gif" class="emoji-unified emoji2600" ' +
                                    'data-emoji-unicode="\u2600"> <img src="apps/themes/login/1x1.gif" ' +
                                    'class="emoji-unified emoji2601" data-emoji-unicode="\u2601">';
                });

                it('with default collection', function () {
                    expect(this.imgTag).toBe(this.expected);
                });

                it('with overrideUserCollection setting enabled', function () {
                    settings.set('overrideUserCollection', true);
                    this.imgTag = emoji.unifiedToImageTag('\u2600 \u2601');

                    expect(this.imgTag).toBe(this.expected);
                });
            });

            it('should convert special image tags to unified emoji unicode', function () {
                var imgTag = emoji.unifiedToImageTag('\u2600');

                expect(emoji.imageTagsToUnified(imgTag)).toBe('\u2600');
            });
        });

        describe('handles different unicode encoding lengths', function () {
            it('should support plain 2-byte UTF8 emojis', function () {
                var description = this.emoji.iconInfo('\u2600').desc,
                    imgTag = emoji.unifiedToImageTag('\u2600');

                expect(description).toBe('black sun with rays');
                expect($(imgTag).attr('data-emoji-unicode')).toBe('\u2600');
            });

            it('should support plain 3-byte UTF8 emojis', function () {
                var description = this.emoji.iconInfo('1\u20e3').desc,
                    imgTag = emoji.unifiedToImageTag('1\u20e3');

                expect(description).toBe('keycap 1');
                expect($(imgTag).attr('data-emoji-unicode')).toBe('1\u20e3');
            });

            it('should support plain 4-byte UTF8 emojis', function () {
                var description = this.emoji.iconInfo('\ud83d\udca9').desc,
                    imgTag = emoji.unifiedToImageTag('\ud83d\udca9');

                expect(description).toBe('pile of poo');
                expect($(imgTag).attr('data-emoji-unicode')).toBe('\ud83d\udca9');
            });

            it('should support plain 8-byte UTF8 emojis', function () {
                var description = this.emoji.iconInfo('\ud83c\uddef\ud83c\uddf5').desc,
                    imgTag = emoji.unifiedToImageTag('\ud83c\uddef\ud83c\uddf5');

                expect(description).toBe('regional indicator symbol letters jp');
                expect($(imgTag).attr('data-emoji-unicode')).toBe('\ud83c\uddef\ud83c\uddf5');
            });
        });
    });
});
