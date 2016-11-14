/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define([
    'io.ox/core/emoji/util',
    'io.ox/emoji/main',
    'settings!io.ox/mail/emoji'
], function (util, emoji, settings) {
    'use strict';

    describe('Emoji util', function () {
        beforeEach(function () {
            settings.set('availableCollections', 'unified');
            settings.set('userCollection', 'unified');
            settings.set('forceEmojiIcons', true);

            this.emoji = emoji.getInstance();
        });
        it('should find and replace unicode characters in content', function () {
            var test1 = '<div></div>',
                test2 = '<div>\u23f0</div>',
                test3 = '<div>\u23f0\u2600</div>',
                test4 = '<div>abc\u23f0 test \u2600123</div>',
                def = $.Deferred().done(function () {
                    expect(util.processEmoji(test1)).to.equal(test1);
                    expect(util.processEmoji(test2)).to.equal('<div><img src="apps/themes/login/1x1.gif" class="emoji emoji-unified emoji23f0" data-emoji-unicode="\u23f0" data-mce-resize="false" alt="\u23f0"></div>');
                    expect(util.processEmoji(test3)).to.equal('<div><img src="apps/themes/login/1x1.gif" class="emoji emoji-unified emoji23f0" data-emoji-unicode="\u23f0" data-mce-resize="false" alt="\u23f0">' +
                                                              '<img src="apps/themes/login/1x1.gif" class="emoji emoji-unified emoji2600" data-emoji-unicode="\u2600" data-mce-resize="false" alt="\u2600"></div>');
                    expect(util.processEmoji(test4)).to.equal('<div>abc<img src="apps/themes/login/1x1.gif" class="emoji emoji-unified emoji23f0" data-emoji-unicode="\u23f0" data-mce-resize="false" alt="\u23f0"> test ' +
                                                              '<img src="apps/themes/login/1x1.gif" class="emoji emoji-unified emoji2600" data-emoji-unicode="\u2600" data-mce-resize="false" alt="\u2600">123</div>');
                });

            // util method has strange behavior. It's sometimes deferred, sometimes not. Call once with emoji to trigger require
            util.processEmoji('<div>\u23f0<div>', function () { def.resolve(); });
            return def;
        });

        it('should ignore unicode characters within tags', function () {
            var test1 = '<div alt="\u23f0"></div>',
                test2 = '<div alt="\u23f0">\u2600</div>',
                test3 = '<div>\u23f0<span alt="\u2600"></div>',
                def = $.Deferred().done(function () {
                    expect(util.processEmoji(test1)).to.equal(test1);
                    expect(util.processEmoji(test2)).to.equal('<div alt="\u23f0"><img src="apps/themes/login/1x1.gif" class="emoji emoji-unified emoji2600" data-emoji-unicode="\u2600" data-mce-resize="false" alt="\u2600"></div>');
                    expect(util.processEmoji(test3)).to.equal('<div><img src="apps/themes/login/1x1.gif" class="emoji emoji-unified emoji23f0" data-emoji-unicode="\u23f0" data-mce-resize="false" alt="\u23f0"><span alt="\u2600"></div>');
                });

            // util method has strange behavior. It's sometimes deferred, sometimes not. Call once with emoji to trigger require
            util.processEmoji('<div>\u23f0<div>', function () { def.resolve(); });
            return def;
        });
    });
});
