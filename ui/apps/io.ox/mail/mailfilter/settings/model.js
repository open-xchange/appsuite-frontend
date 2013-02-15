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
define('io.ox/mail/mailfilter/settings/model',
      ['io.ox/backbone/modelFactory',
       'io.ox/backbone/validation',
       'io.ox/mail/mailfilter/api',
       'gettext!io.ox/mail'
       ], function (ModelFactory, Validators, api, gt) {

    'use strict';

    function buildFactory(ref, api) {
        var factory = new ModelFactory({
            api: api,
            ref: ref,

            updateEvents: ['edit']
//            destroy: function (model) {
//                return api.remove({id: model.id, folder_id: model.get('folder_id')});
//            }
        });

        Validators.validationFor(ref, {
            subject: { format: 'string'},
            text: { format: 'string' }
        });
        return factory;

    }

    var fields = {
        subject: 'Subject',
        text: 'Text'
    };

//    var factory = buildFactory('io.ox/mail/mailfilter/settings/model', api);

    return {
//        mailfilter: factory.model,
//        mailfilters: factory.collection,
//        factory: factory,
        api: api,
        fields: fields,
        protectedMethods: {
            buildFactory: buildFactory
        }
    };
});

