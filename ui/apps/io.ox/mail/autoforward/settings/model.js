/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define('io.ox/mail/autoforward/settings/model',
    ['io.ox/backbone/modelFactory',
     'io.ox/backbone/validation',
     'io.ox/core/api/mailfilter',
     'io.ox/settings/util',
     'gettext!io.ox/mail'
    ], function (ModelFactory, Validators, api, settingsUtil, gt) {

    'use strict';

    function providePreparedData(attributes) {
        if (!attributes.forwardmail) {
            return {};
        } else {
            var preparedData = {
                    'rulename': 'autoforward',

                    'test': {
                        'id': 'header',
                        'comparison': 'contains',
                        'values': [attributes.userMainEmail],
                        'headers': ['To']
                    },
                    'actioncmds': [
                        {
                            'id': 'redirect',
                            'to': attributes.forwardmail
                        },
                        {
                            'id': 'keep'
                        }
                    ],
                    'flags': ['autoforward'],
                    'active': attributes.active ? true : false
                };
            if (attributes.id) {
                preparedData.id = attributes.id;
            }

            return preparedData;
        }

    }

    function buildFactory(ref, api) {
        var factory = new ModelFactory({
            api: api,
            ref: ref,

            update: function (model) {
                $(document.activeElement).blur();//make the active element lose focus to get the changes of the field a user was editing
                if (model.attributes.forwardmail === '') {
                    return settingsUtil.yellOnReject(
                        api.deleteRule(model.attributes.id)
                    );
                } else {
                    return settingsUtil.yellOnReject(
                        api.update(providePreparedData(model.attributes))
                    );
                }
            },
            create: function (model) {
                $(document.activeElement).blur();//make the active element lose focus to get the changes of the field a user was editing
                return settingsUtil.yellOnReject(
                    api.create(providePreparedData(model.attributes))
                );
            }

        });

        return factory;

    }

    var fields = {
        headline: gt('Auto Forward'),
        forwardmail: gt('Forward all incoming emails to this address'),
        active: gt('Enabled')
    };

    return {
        api: api,
        fields: fields,
        protectedMethods: {
            buildFactory: buildFactory
        }
    };
});

