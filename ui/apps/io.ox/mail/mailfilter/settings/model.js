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
define('io.ox/mail/mailfilter/settings/model', [
    'io.ox/backbone/modelFactory',
    'io.ox/backbone/validation',
    'io.ox/core/api/mailfilter',
    'io.ox/settings/util',
    'gettext!io.ox/mail',
    'io.ox/mail/mailfilter/settings/util'
], function (ModelFactory, Validators, api, settingsUtil, gt, util) {

    'use strict';

    function buildFactory(ref, api) {
        var factory = new ModelFactory({
            api: api,
            ref: ref,
            model: {
                idAttribute: 'id',
                initialize: function () {
                    this.on('change', this.onChangeAttribute);

                    // ugly way of calling OXModel.prototype.initialize inside modelFactory.js
                    // but OXModel cannot be accessed from outside
                    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.apply(this, arguments);
                },
                onChangeAttribute: function () {
                    var self = this;
                    if (!this.changed.actioncmds && !this.changed.test) return;
                    $.when(
                        util.getDefaultRulename(this.previousAttributes()),
                        util.getDefaultRulename(this.attributes)
                    ).done(function (oldRulename, newRulename) {
                        if (self.get('rulename') !== oldRulename && self.get('rulename') !== gt('New rule')) return;
                        self.set('rulename', newRulename);
                    });
                },
                toJSON: function () {
                    var data = JSON.parse(JSON.stringify(this.attributes)),
                        list = [];
                    // first level
                    if (data.test) list.push(data.test);
                    _.each(data.test.tests, function (obj) {
                        // second level
                        list.push(obj);
                        // third level
                        if (obj.tests) list = list.concat(obj.tests);
                    });
                    _.each(list, removeClientOnlyProperties);
                    return data;
                }
            },

            update: function (model) {
                //yell on reject
                return settingsUtil.yellOnReject(
                    api.update(model.toJSON())
                );

            },
            create: function (model) {
                //yell on reject
                return settingsUtil.yellOnReject(
                    api.create(model.toJSON())
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

    function removeClientOnlyProperties(data) {
        if (data.id === 'size') {
            delete data.sizeValue;
            delete data.unit;
        }
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
