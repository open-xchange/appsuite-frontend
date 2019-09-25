/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
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
