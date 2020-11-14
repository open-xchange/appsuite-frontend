/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/formatting', ['io.ox/chat/data'], function (data) {

    'use strict';

    // for the moment we require white-space before bold/italic/strikethrough
    var regBold = /(^|\s)\*(.+?)\*/g;
    var regItalic = /(^|\s)_(.+?)_/g;
    var regStrikethrough = /(^|\s)~(.+?)~/g;
    var regURL = /(https?:\/\/\S+)/g;
    var regBlockquote = /((\n&gt;( [^\n]+| *))+)/g;
    var regEmoticon = /(^|\s)(((:|;)-?(\(|\)|D|\|))|&lt;3|\(y\))/g;
    var regShortcode = /(^|\s):(\w+):/g;

    var emoticons = {
        ':-)': '🙂',
        ':)':  '🙂',
        ';-)': '😉',
        ':-D': '😀',
        ':D':  '😀',
        ':-(': '🙁',
        ':(':  '🙁',
        ':-|': '😐',
        '&lt;3':  '❤️',
        '(y)': '👍'
    };

    var shortcodes = {
        grin: '😁',
        joy: '😂',
        smile: '🙂',
        poop: '💩',
        thumbs_up: '👍'
    };

    // Using unicode properties seems to catch more (and needs less code)
    // support: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Browser_compatibility
    // Chrome:64 (2018); Edge:79 (2020); Firefox:78 (2020); Safari:11.1 (2018); IE:--
    // regex is written as a function due to (falsy) eslint (would report invalid regex)
    var regOnlyEmoji = new RegExp('^(\\p{Emoji_Presentation}|\u200D){1,9}$', 'u');
    var regEmojiReplace = new RegExp('(\\p{Emoji_Presentation}|\u200D)+', 'ug');
    var regEmoji = new RegExp('\\p{Emoji_Presentation}', 'u');

    // mentions
    var regMention = /(^|\s)@(\w+)/g;


    function apply(str) {
        var result = { original: str };
        result.content = _.escape('\n' + str)
            .replace(regEmoticon, mapReplace.bind(emoticons))
            .replace(regShortcode, mapReplace.bind(shortcodes));
        // emoji flags
        result.containsEmoji = regEmoji.test(result.content);
        result.onlyEmoji = result.containsEmoji && regOnlyEmoji.test(result.content);
        // continue
        result.content = result.content
            .replace(regEmojiReplace, '<span class="emoji">$1</span>')
            .replace(regMention, replaceMention)
            .replace(regBold, '$1<b>$2</b>')
            .replace(regItalic, '$1<em>$2</em>')
            .replace(regStrikethrough, '$1<del>$2</del>')
            .replace(regURL, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(regBlockquote, replaceBlockquote)
            .trim();
        return result;
    }

    function replaceBlockquote(all, quote) {
        return '<blockquote>' + quote.replace(/\n&gt;\s/g, '\n').trim() + '</blockquote>';
    }

    function mapReplace(all, whiteSpace, hit) {
        return whiteSpace + (this[hit] || hit);
    }

    function onlyEmoji(str) {
        return regOnlyEmoji.test(str);
    }

    function containsEmoji(str) {
        return regEmoji.test(str);
    }

    function replaceMention(all, whiteSpace, mention) {
        var className = 'mention' + (isMentioningMe(mention) ? ' me' : '');
        return whiteSpace + '<span class="' + className + '">@' + mention.toLowerCase() + '</span>';
    }

    var isMentioningMe = (function () {

        var me = '';
        var getRegMention = _.memoize(function (mention) {
            return new RegExp('\\b' + _.escapeRegExp(mention), 'i');
        });

        return function (mention) {
            if (!me) {
                var user = data.users.getByMail(data.user.email);
                me = ['nickname', 'first_name', 'last_name']
                    .map(function (field) { return user.get(field); })
                    .filter(Boolean)
                    .join(' ');
            }
            return me.search(getRegMention(mention)) > -1;
        };
    }());

    return {
        apply: apply,
        onlyEmoji: onlyEmoji,
        containsEmoji: containsEmoji,
        isMentioningMe: isMentioningMe
    };
});
