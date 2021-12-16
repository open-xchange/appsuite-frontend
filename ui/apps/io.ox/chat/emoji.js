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

define('io.ox/chat/emoji', [
    'text!io.ox/chat/emoji.json'
], function (emojiSet) {

    'use strict';

    emojiSet = JSON.parse(emojiSet);

    var regexList = {
        smile: /:-?\)/g, // :-)
        open_mouth: /:o/gi, // :o
        scream: /:-o/gi, // :-o
        smirk: /[:;]-?]/g, // :-]
        grinning: /[:;]-?d/gi, // :-D
        stuck_out_tongue_closed_eyes: /x-d/gi, // X-D
        stuck_out_tongue_winking_eye: /[:;]-?p/gi, // ;-p
        rage: /:-?[[@]/g, // :-[ / :-@
        frowning: /:-?\(/g, // :-(
        sob: /:['’]-?\(|:&#x27;\(/g, // :'-(
        kissing_heart: /:-?\*/g, // :-*
        wink: /;-?\)/g, // ;-)
        pensive: /:-?\//g, // :-/
        confounded: /:-?s/gi, // :-s
        flushed: /:-?\|/g, // :-|
        relaxed: /:-?\$/g, // :-$
        mask: /:-x/gi, // :-x
        heart: /<3|&lt;3/g, // <3
        broken_heart: /<\/3|&lt;&#x2F;3/g, // </3
        thumbsup: /:\+1:/g, // :+1:
        thumbsdown: /:-1:/g // :-1:
    };

    return function (str) {
        // replace all emojis within :...:
        str = str.replace(/:([a-z0-9A-Z_-]+):/g, function (x) {
            var name = x.slice(1, -1),
                icon = emojiSet[name];
            if (icon) return icon;
            return x;
        });

        // apply regex list and replace simple emojis
        str = _(regexList).reduce(function (memo, regex, key) {
            return memo.replace(regex, emojiSet[key]);
        }, str);

        return str;
    };

});
