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
        describe('with fallback collections', function () {
            beforeEach(function () {
                settings.set('availableCollections', 'unified,softbank,japan_carrier');
                settings.set('userCollection', 'unified');

                this.emoji = emoji.getInstance();
            });

            it('should get CSS for unicode emoji', function () {
                expect(this.emoji.cssFor('\u2600')).toBe('emoji-unified emoji2600');
            });
        });
    });
});
