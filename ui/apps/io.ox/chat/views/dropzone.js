/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/views/dropzone', [
    'io.ox/core/dropzone',
    'gettext!io.ox/chat'
], function (dropzone, gt) {

    'use strict';

    var Zone = dropzone.Inplace.extend({
        isSupported: function () {
            // maybe we will have read-only chats
            return true;
        }
    });

    function add(parentView) {

        var zone = new Zone({
            caption: gt('Drop file here to send it')
        });

        parentView.$el.append(
            zone.render().$el.addClass('abs')
        );

        // to get the files you need to attach
        // a listener for the "drop" event (files)
        return zone;
    }

    return {
        add: add
    };
});
