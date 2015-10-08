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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define('io.ox/mail/mailfilter/settings/model', [
    'io.ox/backbone/modelFactory',
    'io.ox/backbone/validation',
    'io.ox/core/api/mailfilter',
    'io.ox/settings/util',
    'gettext!io.ox/mail'
], function (ModelFactory, Validators, api, settingsUtil, gt) {

    'use strict';

    function buildFactory(ref, api) {
        var factory = new ModelFactory({
            api: api,
            ref: ref,
            model: {
                idAttribute: 'id'
            },

            update: function (model) {
                //yell on reject
                return settingsUtil.yellOnReject(
                    api.update(model.attributes)
                );

            },
            create: function (model) {
                //yell on reject
                return settingsUtil.yellOnReject(
                    api.create(model.attributes)
                );
            }

        });

        Validators.validationFor(ref, {
            rulename: { format: 'string' },
            test: { format:  'object' },
            actioncmds: { format: 'array' },
            flags: { format: 'array' },
            active: { format: 'boolean' }

        });

        return factory;

    }

    function provideEmptyModel() {
        return {
            'rulename': gt('New rule'),
            'test': {
                'id': 'true'
            },
            'actioncmds': [],
            'flags': [],
            'active': true
        };
    }

    return {
        api: api,
        protectedMethods: {
            buildFactory: buildFactory,
            provideEmptyModel: provideEmptyModel
        }
    };
});
