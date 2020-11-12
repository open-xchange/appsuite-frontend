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

define('io.ox/chat/formatting', [], function () {

    // for the moment we require white-space before bold/italic/strikethrough
    var regBold = /(^|\s)\*(.+?)\*/g;
    var regItalic = /(^|\s)_(.+?)_/g;
    var regStrikethrough = /(^|\s)~(.+?)~/g;
    var regURL = /(https?:\/\/\S+)/g;

    return {
        apply: function (str) {
            return _.escape(str)
                .replace(regBold, '$1<b>$2</b>')
                .replace(regItalic, '$1<em>$2</em>')
                .replace(regStrikethrough, '$1<del>$2</del>')
                .replace(regURL, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        }
    };
});
