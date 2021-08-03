/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/mailfilter/settings/filter/defaults', [
    'io.ox/core/extensions',
    'io.ox/core/folder/api'
], function (ext, folderAPI) {

    'use strict';

    var conditionsTranslation = {},
        actionsTranslations = {},
        actionCapabilities = {},
        conditionsMapping = {},
        conditionsOrder = [],
        actionsOrder = [],
        defaults = {
            tests: {
                'true': {
                    'id': 'true'
                }
            },
            actions: {},
            applyMailFilterSupport: false
        };

    ext.point('io.ox/mail/mailfilter/tests').each(function (point) {
        point.invoke('initialize', null, { conditionsTranslation: conditionsTranslation, defaults: defaults, conditionsMapping: conditionsMapping, conditionsOrder: conditionsOrder });
    });

    ext.point('io.ox/mail/mailfilter/actions').each(function (point) {
        point.invoke('initialize', null, { actionsTranslations: actionsTranslations, defaults: defaults, actionCapabilities: actionCapabilities, actionsOrder: actionsOrder });
    });

    // for whatever reason support for "apply filter to folder" is not exposed as general capability
    // since SIEVE rules can only apply to default0 folders, check the INBOX for support
    folderAPI.get('default0/INBOX').then(function (f) {
        defaults.applyMailFilterSupport = _(f.supported_capabilities).contains('MAIL_FILTER');
    });

    _.extend(defaults, {
        conditionsTranslation: conditionsTranslation,
        actionsTranslations: actionsTranslations,
        actionCapabilities: actionCapabilities,
        conditionsMapping: conditionsMapping,
        conditionsOrder: conditionsOrder,
        actionsOrder: actionsOrder
    });

    return defaults;
});
