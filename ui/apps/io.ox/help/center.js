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
    'io.ox/help/data',
    'less!io.ox/help/style.css'
], function (ext) {
    
    'use strict';
    
    var center = { active: false },
        origPopovers = {};
    
    center.toggle = function () {
        this.active = !this.active;
        if (this.active) {
            blockOtherContent();
            enableHelpHandlers();
        } else {
            unblockOtherContent();
            disableHelpHandlers();
        }
    };
    
    var blockOtherContent = function () {
        //TODO overlay funktion rausfinden, wird bei D&D benutzt.
        console.log("Blocked other content");
    };
    
    var getHelp = function (id) {
        ext.point('io.ox/help/data').each(function (helper) {
            if (helper.has(id)) {
                return helper.get(id);
            }
        });
    };

    var enableHelpHandlers = function () {
        var allReferenceElements = $('[data-ref]');
        
        console.log("Help handlers enabled");

        _(allReferenceElements).each(function (elem) {
            var $elem = $(elem),
                datRef = $elem.attr('data-ref'),
                text = getHelp(datRef);

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
        var allReferenceElements = $('[data-ref]');
        
        _(allReferenceElements).each(function (elem) {
            $(elem).popover('disable').popover('hide').removeClass('help-highlight');
        });
        
        console.log("Help handlers disabled");
    };
    
    return center;
    
});