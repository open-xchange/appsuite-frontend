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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/register', ['io.ox/core/extensions'], function (ext) {

    'use strict';
    // gt needs to be reanabled

    ext.point("io.ox/settings/pane").extend({
        id: 'vacation',
        title: "Vacation Notice",
        ref: 'io.ox/vacation',
        loadSettingPane: false
    });

    ext.point("io.ox/vacation/settings/detail").extend({
        index: 100,
        draw: function () {
            var $node = this;
            $node.append($('<div>'));
        }
    });
});
