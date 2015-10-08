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

define('io.ox/help/center', [
    'io.ox/core/extensions',
    'io.ox/help/core_doc',
    'gettext!io.ox/help',
    'less!io.ox/help/style'
], function (ext, core_doc, gt) {
    //TODO Launcher refactoren, hier hin
    'use strict';

    var center = { active: false };

    var isVisible = function (elem) {
        var $elem = $(elem);
        var rectPos = elem.getBoundingClientRect();
        var result = 0;

        if ($elem.width() === 0 || $elem.height() === 0) {
            return false;
        }

        if (elem === document.elementFromPoint(rectPos.left, rectPos.top)) {
            result++;
        }
        if (elem === document.elementFromPoint(rectPos.left, rectPos.bottom - 1)) {
            result++;
        }
        if (elem === document.elementFromPoint(rectPos.right - 1, rectPos.top)) {
            result++;
        }
        if (elem === document.elementFromPoint(rectPos.right - 1, rectPos.bottom - 1)) {
            result++;
        }

        if (result === 4) {
            result = 'visible';
        } else if (result === 0) {
            result = 'hidden';
        } else {
            result = 'partially visible';
        }
        return result === 'visible';
    };

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
        var $wall = $('<div class="io-ox-help-blacksheepwall"/>');

        //highlight things with help texts
        _($saveThese).each(function (elem) {
            var $elem = $(elem);
            var offset = $elem.offset();
            var dataRef = $elem.attr('data-ref');
            if (isVisible(elem)) {
                var helpText = getHelpText(dataRef);
                $('<div>').css({
                    position: 'absolute',
                    top: offset.top,
                    left: offset.left,
                    width: $elem.width(),
                    height: $elem.height(),
                    paddingLeft: $elem.css('paddingLeft'),
                    paddingRight: $elem.css('paddingRight'),
                    paddingTop: $elem.css('paddingTop'),
                    paddingBottom: $elem.css('paddingBottom'),
                    marginLeft: $elem.css('marginLeft'),
                    marginRight: $elem.css('marginRight'),
                    marginTop: $elem.css('marginTop'),
                    marginBottom: $elem.css('marginBottom')
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
                .appendTo($wall);
            }
        });

        //add cancel button
        console.log('Check help button:', $helpButton);
        $('<i class="fa fa-times-circle icon-white" id="io-ox-help-off">')
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
            $(this).popover('disable').popover('hide');
            disableHelp();
            center.active = false;
        })
        .appendTo($wall);
        $wall.appendTo($body);
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
