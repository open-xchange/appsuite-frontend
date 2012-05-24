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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/calendar/edit/extensions',
      ['io.ox/core/extensions'], function (ext) {

    'use strict';

    // just init the default extensions
    return {
        init: function () {
            ext.point('io.ox/calendar/edit/section').extend({
                id: 'newawesomesection',
                index: 104, // after header
                draw: function (options) {
                    this.append(
                        $('<div class="control-group">' +
                          '<label class="control-label" for="prependedInput">Enter Twitter-Handle for this Event</label>' +
                          '<div class="controls">' +
                          '<div class="input-prepend">' +
                          '<span class="add-on">@</span><input class="span2" id="prependedInput" size="16" type="text">' +
                          '</div>' +
                          '<p class="help-block">Heres some help text</p>' +
                          '</div>' +
                          '</div>'
                          )
                    );
                    return this;
                }
            });
        }
    };
});
