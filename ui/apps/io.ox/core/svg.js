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
 * @author David Bauer <david.bauer@open-xchange.com>
 *
 * Provides a simple implementation for chaining tasks back to back.
 *
 */

define('io.ox/core/svg', [], function () {

    'use strict';

    function circleAvatar(initials) {
        return '<svg viewbox="0 0 32 32"><text x="16" y="21" text-anchor="middle">' + initials + '</text></svg>';
    }

    return {
        circleAvatar: circleAvatar
    };
});
