/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/chat/formatting', ['io.ox/chat/data'], function (data) {

    'use strict';

    // for the moment we require white-space before bold/italic/strikethrough
    var regBold = /(^|\s)\*(.+?)\*/g;
    var regItalic = /(^|\s)_(.+?)_/g;
    var regStrikethrough = /(^|\s)~(.+?)~/g;
    var regInlineCode = /(^|\s)&#x60;(.+?)&#x60;/g;
    // [^] is a substitute for . with the s flag (dotall). This makes eslint and IE11 happy
    var regMultilineCode = new RegExp('(^|\\s)&#x60;&#x60;&#x60;([^]+?)&#x60;&#x60;&#x60;', 'g');
    var regURL = /(https?:\/\/\S+)/g;
    var regBlockquote = /(((^|\n)&gt;( [^\n]+| *))+)/g;
    var regMention = /(^|\s)@(\w+)/g;
    var regEmoticon = /(^|\s)(((:|;)-?(\(|\)|D|\|))|&lt;3|\(y\))/g;
    var regShortcode = /(^|\s):(\w+):/g;
    var regHyperino = /^Hyperino$/i;

    var regOnlyEmoji, regEmojiReplace, regEmoji;
    if (_.device('IE')) {
        // regex that doesn't match anything
        regOnlyEmoji = new RegExp('a^');
        regEmojiReplace = new RegExp('a^');
        regEmoji = new RegExp('a^');
    } else {
        // Using unicode properties seems to catch more (and needs less code)
        // support: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Browser_compatibility
        // Chrome:64 (2018); Edge:79 (2020); Firefox:78 (2020); Safari:11.1 (2018); IE:--
        // regex is written as a function due to (falsy) eslint (would report invalid regex)
        regOnlyEmoji = new RegExp('^(\\p{Emoji_Presentation}|\u200D){1,9}$', 'u');
        regEmojiReplace = new RegExp('((\\p{Emoji_Presentation}|\u200D)+)', 'ug');
        regEmoji = new RegExp('\\p{Emoji_Presentation}', 'u');
    }

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

    function apply(str) {
        var result = { original: str };
        result.content = _.escape(str)
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
            .replace(regMultilineCode, '$1<pre class="code">$2</pre>')
            .replace(regInlineCode, '$1<code>$2</code>')
            .replace(regURL, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(regHyperino, '<div class="hyperino">HYPERINO</div>')
            .replace(regBlockquote, replaceBlockquote)
            .trim();
        return result;
    }

    function replaceBlockquote(all, quote) {
        return '<blockquote>' + quote.replace(/\n&gt;\s/g, '\n').trim() + '</blockquote>';
    }

    function mapReplace(all, whiteSpace, hit) {
        return whiteSpace + (this[hit] || all);
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
                var user = data.users.getMyself();
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
