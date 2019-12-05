/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
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
