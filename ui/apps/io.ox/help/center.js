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

define("io.ox/help/center", ['io.ox/core/extensions', 'io.ox/help/core_doc', 'less!io.ox/help/style.css'], function (ext, core_doc) {
    
    'use strict';
    
    var center = { active: false },
        origPopovers = {};
    
    center.toggle = function () {
        this.active = !this.active;
        if (this.active) {
            enableHelpHandlers();
            blockOtherContent();
        } else {
            unblockOtherContent();
            disableHelpHandlers();
        }
    };
    
    var blockOtherContent = function () {
        var $saveThese = $('.io-ox-help-item');
        
        console.log("Blocked content");
    };
    
    var getHelp = function (id) {
        var help;
        ext.point('io.ox/help/helper').each(function (helper) {
            if (helper.has(id)) {
                help = helper.get(id);
                return;
            }
        });
        return help;
    };
    
    var enableHelpHandlers = function () {
        var allReferenceElements = $('[data-ref]');

        _(allReferenceElements).each(function (elem) {
            var $elem = $(elem),
                datRef = $elem.attr('data-ref');

            if ($elem.hasClass('io-ox-help-item')) {
                $elem.popover('enable');
            } else {
                var helpText = getHelp(datRef);
                $elem.popover({
                    title: datRef,
                    content: helpText,
                    html: true,
                    placement: function (tip, element) {
                        var off = $(element).offset(),
                            width = $('body').width() / 2;
                        return off.left > width ? 'left' : 'right';
                    }
                })
                .addClass('io-ox-help-item');
            }
            $elem.addClass('io-ox-help-highlight')
                 .append($('<i class="icon-info-sign io-ox-help-icon">'));
        });
    };
    
    var unblockOtherContent = function () {
        console.log("Unblocking other content");
    };
    
    var disableHelpHandlers = function () {
        var allReferenceElements = $('.io-ox-help-item');
        _(allReferenceElements).each(function (elem) {
            $(elem)
            .popover('disable')
            .popover('hide')
            .removeClass('io-ox-help-highlight');
        });

        $(".io-ox-help-icon").remove();
        console.log("Help handlers disabled");
    };
    
    return center;
    
});