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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define('io.ox/mail/mailfilter/settings/model',
      ['io.ox/backbone/modelFactory',
       'io.ox/backbone/validation',
       'io.ox/core/api/mailfilter',
       'gettext!io.ox/mail'
       ], function (ModelFactory, Validators, api, gt) {

    'use strict';

    function buildFactory(ref, api) {
        var factory = new ModelFactory({
            api: api,
            ref: ref,

            update: function (model) {
                return api.update(model.attributes);

            },
            create: function (model) {
                return api.create(model.attributes);
            }

        });

        Validators.validationFor(ref, {
            rulename: { format: 'string', mandatory: true}
        });

        return factory;

    }

    function provideEmptyModel() {
        return {
            "rulename": "",
            "test": {
                "id": "true"
            },
            "actioncmds": [],
            "flags": [],
            "active": false
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

