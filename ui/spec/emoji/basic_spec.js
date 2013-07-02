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
        describe('using basic API', function () {
            beforeEach(function () {
                settings.set('availableCollections', 'unified');
                settings.set('userCollection', 'unified');

                this.emoji = emoji.getInstance();
            });

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
        });
    });
});
