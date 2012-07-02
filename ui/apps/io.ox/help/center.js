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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define("io.ox/help/center", [
    'less!io.ox/help/style.css'
], function () {
    
    'use strict';
    
    var center = { active: false },
        help = {},
        origPopovers = {};
    
    center.toggle = function () {
        this.active = !this.active;
        if (this.active) {
            loadHelpTexts();
            blockOtherContent();
            enableHelpHandlers();
        } else {
            unblockOtherContent();
            disableHelpHandlers();
        }
    };
    
    var loadHelpTexts = function () {
        help = {
            'io.ox/mail/actions/reply': "Allows you to reply to the sender of a message, not to every recipient. We might change this behaviour randomly to make your life more awkward.",
            'io.ox/mail/actions/markunread': "Mark an e-mail as unread. Will be displayed as bold, but won't bother you as 'unread' message any more.",
            'io.ox/mail/actions/move': "Move mail to a different folder. We highly recommend the trash bin to store important data. That's what all the cool kids do (e.g. Outlook) and that's why we actually sync the trash bin!"
        };
        console.log("Help texts loaded");
    };
    
    var blockOtherContent = function () {
        //TODO overlay funktion rausfinden, wird bei D&D benutzt.
        console.log("Blocked other content");
    };
    
    var enableHelpHandlers = function () {
        var allReferenceElements = $('[data-ref]');
        
        console.log("Help handlers enabled");

        _(allReferenceElements).each(function (elem) {
            var $elem = $(elem),
                datRef = $elem.attr('data-ref'),
                text = help[datRef];

            if (text) {
                origPopovers[datRef] = $elem.popover;
                $elem.popover({
                    title: datRef,
                    content: text,
                    placement: function (tip, element) {
                        var off = $(element).offset(),
                            width = $('body').width() / 2;
                        return off.left > width ? 'left' : 'right';
                    }
                }).addClass('help-highlight');
            }
        });
    };
    
    var unblockOtherContent = function () {
        console.log("Unblocking other content");
    };
    
    var disableHelpHandlers = function () {
        var refs = _(help).keys(),
            allReferenceElements = $('[data-ref]');
        
        _(allReferenceElements).each(function (elem) {
            $(elem).popover('disable').popover('hide').removeClass('help-highlight');
        });
        
        console.log("Help handlers disabled");
        
        _(refs).each(function (ref) {
            var $elem = $('[data-ref="' + ref + '"]');
            $elem.popover = origPopovers[ref];
            console.log("Disabling " + ref, $elem);
        });
    };
    
    
    
    return center;
    
});