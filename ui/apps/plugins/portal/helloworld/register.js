/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/portal/helloworld/register', [
    'io.ox/core/extensions',
    'gettext!plugins/portal'
], function (ext, gt) {

    'use strict';

    // most common trap is that you plugin is not loaded at all.
    // there are different ways to enabled a plugin. simple hack is to
    // register it manually in io.ox/portal/main.js by adding it to the
    // DEV_PLUGINS array.

    console.info('Loaded portal plugin: plugins/portal/helloworld/register');

    // this line allows putting this file to other folders than "apps/plugins/portal"
    ext.point('io.ox/portal/widget').extend({ id: 'helloworld' });

    ext.point('io.ox/portal/widget/helloworld').extend({

        // widget title (fills <h2> title node)
        title: 'Hello World',

        // if 'action' is implemented the widget title becomes clickable
        action: function (baton) {
            alert(baton.hello);
        },

        // called first. Optional. You can create instances here and put them into the baton
        initialize: function (baton) {
            baton.hello = String('Hello World');
        },

        // called right after initialize. Should return a deferred object when done
        load: function () {
            return $.when();
        },

        // called to draw the preview stuff on the portal. waits for load().
        // usually a widget creates a "content" div
        preview: function (baton) {
            var content = $('<div class="content pointer">').text(baton.hello);
            // you could do something great here
            this.append(content);
        },

        // 'draw' is called to put content into the side-popup
        // the side-popup uses the following delegate: '.item, .content.pointer'
        // so you have to you proper CSS classes in preview
        draw: function (baton) {
            this.append(
                $('<h1>').text(baton.hello)
            );
        }
    });

    ext.point('io.ox/portal/widget/helloworld/settings').extend({
        title: gt('Hello World'),
        type: 'helloworld',
        editable: false
    });
});
