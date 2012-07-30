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
    'io.ox/core/extensions',
    'io.ox/help/core_doc',
    'gettext!io.ox/help',
    'less!io.ox/help/style.css'
], function (ext, core_doc, gt) {
    //TODO Launcher refactoren, hier hin
    'use strict';
    
    var center = { active: false },
        origPopovers = {};
    
    center.toggle = function () {
        this.active = !this.active;
        if (this.active) {
            enableHelp();
        } else {
            disableHelp();
        }
    };
    
    var enableHelp = function () {
        var $body = $('body');
        var $helpButton = $body.find('#io-ox-help-on');
        var $saveThese = $(_($('[data-ref]')).filter(function (elem) {
            var $elem = $(elem);
            var dataRef = $elem.attr('data-ref');
            return getHelpText(dataRef) !== undefined;
        }));
        
        //blackout everything
        $body.append($('<div class="io-ox-help-blacksheepwall"/>'));
        
        //highlight things with help texts
        _($saveThese).each(function (elem) {
            var $elem = $(elem);
            var offset = $elem.offset();
            var dataRef = $elem.attr('data-ref');
            console.log("Sizes for %s: width %s/%s, height %s/%s, padding = %s %s %s %s, margin = %s %s %s %s",
                dataRef,
                $elem.outerWidth(),
                $elem.width(),
                $elem.outerHeight(),
                $elem.height(),
                $elem.css("paddingTop"),
                $elem.css("paddingRight"),
                $elem.css("paddingBottom"),
                $elem.css("paddingLeft"),
                $elem.css("marginTop"),
                $elem.css("marginRight"),
                $elem.css("marginBottom"),
                $elem.css("marginLeft"));
            if (! ($elem.width() === 0 || $elem.height() === 0 || (offset.left === 0 && offset.top === 0))) {
                var helpText = getHelpText(dataRef);
                $("<div>").css({
                    position: 'absolute',
                    top: offset.top,
                    left: offset.left,
                    width: $elem.width(),
                    height: $elem.height(),
                    paddingLeft: $elem.css("paddingLeft"),
                    paddingRight: $elem.css("paddingRight"),
                    paddingTop: $elem.css("paddingTop"),
                    paddingBottom: $elem.css("paddingBottom"),
                    marginLeft: $elem.css("marginLeft"),
                    marginRight: $elem.css("marginRight"),
                    marginTop: $elem.css("marginTop"),
                    marginBottom: $elem.css("marginBottom")
                })
                .text($elem.text())
                .addClass('io-ox-help-highlight')
                .popover({
                    title: gt('Help'),
                    content: helpText,
                    html: true,
                    placement: function (tip, element) {
                        var off = $(element).offset(),
                            width = $('body').width() / 2;
                        return off.left > width ? 'left' : 'right';
                    }
                })
                .appendTo($body);
            }
        });
        
        //add cancel button
        console.log("Check help button:", $helpButton);
        $('<i class="icon-remove-circle icon-white" id="io-ox-help-off">')
        .css({
            position: 'absolute',
            top: $helpButton.offset().top,
            left: $helpButton.offset().left,
            width: $helpButton.outerWidth(),
            height: $helpButton.outerHeight()
        })
        .popover({
            content: gt('Click here to quit the help center'),
            html: true,
            placement: 'left'
        })
        .click(function () {
            $(this).popover('disable').popover("hide");
            disableHelp();
            center.active = false;
        })
        .appendTo($body);
    };
    
    var getHelpText = function (id) {
        var help;
        ext.point('io.ox/help/helper').each(function (helper) {
            if (helper.has(id)) {
                help = helper.get(id);
                return;
            }
        });
        return help;
    };
    
    var disableHelp = function () {
        $('.io-ox-help-blacksheepwall').detach();
        $('.io-ox-help-highlight').detach();
        $('#io-ox-help-off').detach();
    };
    
    
    return center;
    
});