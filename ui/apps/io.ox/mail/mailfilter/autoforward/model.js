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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/mailfilter/autoforward/model', [
    'io.ox/core/api/mailfilter',
    'io.ox/core/api/user',
    'gettext!io.ox/mail'
], function (api, userAPI, gt) {

    'use strict';

    var AutoforwardModel = Backbone.Model.extend({

        parse: function (data) {

            // early return is required for model.save()
            // server does not return usable data
            if (!_.isObject(data)) return {};

            var attr = {
                active: false,
                copy: false,
                processSub: true,
                to: '',
                userMainEmail: data.user.email1
            };

            if (_.isEmpty(data)) {
                // new rule
                attr.position = _.isEmpty(data.vacation) ? 0 : data[0].position + 1;
                return attr;
            }

            // rule already exists
            attr.active = !!data.forward.active;
            attr.id = data.forward.id;

            _(data.forward.actioncmds).each(function (value) {
                switch (value.id) {
                    case 'redirect':
                        attr.to = value.to;
                        attr.copy = !!value.copy;
                        break;
                    case 'stop':
                        attr.processSub = false;
                        break;
                    // no default
                }
            });

            return attr;
        },

        toJSON: function () {

            var attr = this.attributes;
            if (!attr.to) return {};

            var json = {
                actioncmds: [{ id: 'redirect', to: attr.to }],
                active: !!attr.active,
                flags: ['autoforward'],
                position: attr.position,
                rulename: 'autoforward',
                test: { id: 'true' }
            };

            if (attr.copy) json.actioncmds[0].copy = true;
            if (!attr.processSub) json.actioncmds.push({ id: 'stop' });
            // first rule gets 0 so we check for isNumber
            if (_.isNumber(attr.id)) json.id = attr.id;

            return json;
        },

        sync: function (method, module, options) {

            // IF model.attributes.forwardmail === '' then delete()

            switch (method) {
                case 'create':
                    return api.create(this.toJSON()).done(options.success).fail(options.error);
                case 'read':
                    return $.when(
                        api.getRules('autoforward'),
                        api.getRules('vacation'),
                        userAPI.get()
                    )
                    .then(function (forward, vacation, user) {
                        return { forward: forward[0], vacation: vacation[0], user: user };
                    })
                    .done(options.success)
                    .fail(options.error);
                case 'update':
                    return api.update(this.toJSON()).done(options.success).fail(options.error);
                case 'delete':
                    return api.deleteRule(this.get('id')).done(options.success).fail(options.error);
                // no default
            }
        }
    });

    AutoforwardModel.fields = {
        headline: gt('Auto forward'),
        to: gt('Forward all incoming emails to this address'),
        active: gt('Enable'),
        copy: gt('Keep a copy of the message'),
        processSub: gt('Process subsequent rules')
    };

    return AutoforwardModel;
});
