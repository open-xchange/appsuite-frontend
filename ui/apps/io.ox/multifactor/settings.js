/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 *
 * Copyright (C) 2016-2020 OX Software GmbH
 */
define('io.ox/multifactor/settings', [
    'io.ox/core/extensions',
    'gettext!multifactor'
], function (ext, gt) {
    'use strict';

    ext.point('io.ox/settings/pane/general/security').extend({
        id: 'io.ox/multifactor',
        title: gt('Multifactor'),
        index: 700,
        loadSettingPane: true
    });

});
