/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/help/hints', ['io.ox/core/tk/dialogs'], function (dialogs) {

    'use strict';

    // A hint consists of a short teaser text and, optionally, a longer explanation
    // Therefore, options include:
    // 'teaser': A mandatory short text to describe what this hint is about
    // 'explanation': A longer explanation
    // TODO: Allow explanations to be whole node structures with nice pictures and all...
    function Hint(options) {

        var $hintNode = $('<span/>').addClass('hint');
        $hintNode.append($('<span>').text(options.teaser + ' '));

        if (options.explanation) {
            var $explanationLink = $('<a/>').text('What\'s that?');
            var pane = new dialogs.SlidingPane().text(options.explanation).addButton('okay', 'Got it!').relativeTo($explanationLink);

            var toggleExplanation = function () {
                pane.toggle();
                // Prevent default
                return false;
            };

            $explanationLink.click(toggleExplanation);
            $hintNode.click(toggleExplanation);
            $hintNode.append($explanationLink);
        }

        this.node = $hintNode;
    }

    return {
        createHint: function (options) {
            return new Hint(options).node;
        }
    };
});
