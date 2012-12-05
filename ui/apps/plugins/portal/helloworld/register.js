/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/portal/helloworld/register',
    ['io.ox/core/extensions',
     'gettext!plugins/portal'], function (ext, gt) {

    'use strict';

    ext.point('io.ox/portal/widget/helloworld').extend({

        title: 'Hello World',

        // if 'action' is implemented the widget title becomes clickable
        action: function (baton) {
            alert('Hello World');
        },

        // called first. You can create instances here and put them into the baton
        initialize: function (baton) {
            console.log('Hello World');
        },

        // called right after initialize. Should return a deferred object when done
        load: function (baton) {
            return $.when();
        },

        // called to draw the preview stuff on the portal. waits for load().
        // usually a widget creates a "content" div
        preview: function (baton) {
            var content = $('<div class="content">').text('Hello World');
            // you could something great here
            this.append(content);
        },

        // this is called to draw content into the side-popup
        // click handlers to the porta are set if - given in css selector pseudo syntax:
        // a) find('.content') has class pointer
        // b) find('.item) has class pointer
        draw: function (baton) {
            this.append(
                $('<h1>').text('Hello World')
            );
        }
    });
});
