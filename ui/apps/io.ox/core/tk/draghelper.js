/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2014 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */
define('io.ox/core/tk/draghelper', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    ext.point('io.ox/core/tk/draghelper').extend({
        id: 'counter',
        index: 100,
        draw: function (baton) {
            this.append($('<span class="drag-counter">').text(baton.count));
        }
    }).extend({
        id: 'text',
        index: 200,
        draw: function (baton) {
            this.append($('<span>').text(
                baton.source.attr('data-drag-message') ||
                baton.dragMessage.call(baton.container, baton.data, baton.source)));
        }
    });
});
