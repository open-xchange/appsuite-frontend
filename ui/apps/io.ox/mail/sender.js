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

define('io.ox/mail/sender', [
    'io.ox/mail/util',
    'io.ox/core/api/account',
    'io.ox/core/deputy/api',
    'io.ox/core/api/user',
    'io.ox/core/capabilities',
    'settings!io.ox/mail'
], function (util, api, deputyAPI, userAPI, capabilities, settings) {

    'use strict';

    function getDefaultSendAddress() {
        return $.trim(settings.get('defaultSendAddress', ''));
    }

    function getAddresses(options) {
        return $.when(
            api.getAllSenderAddresses(options),
            capabilities.has('deputy') ? deputyAPI.getGranteeAddresses() : [],
            api.getPrimaryAddress()
        );
    }

    function updateDefaultNames(list) {
        // collect first to trigger a valid 'change:customDisplayNames' settings event
        var original = settings.get('customDisplayNames', {}), names = _.extend({}, original);
        list.forEach(function (sender) {
            names[sender.email] = _.extend({}, names[sender.email], { defaultName: sender.name });
        });
        if (_.isEqual(original, names)) return;
        settings.set('customDisplayNames', names).save();
    }

    var that,
        SenderModel = Backbone.Model.extend({
            idAttribute: 'email',
            quoted: function () {
                return util.formatSender(this.get('name'), this.get('email'));
            },
            unquoted: function () {
                return util.formatSender(this.get('name'), this.get('email'), false);
            },
            is: function (type) {
                return this.get('type') === type;
            },
            toArray: function (options) {
                var opt = _.extend({ name: true }, options),
                    address = this.get('email');
                // disabled
                if (!opt.name) return [null, address];
                // default or custom
                var custom = settings.get(['customDisplayNames', address], {}),
                    name = (custom.overwrite ? custom.name : this.get('name')) || '';
                return [name, address];
            }
        }),
        SenderList = Backbone.Collection.extend({
            model: SenderModel,
            initialize: function () {
                // initial ready deferred
                this.fetched = $.Deferred();
                this.update({ useCache: false }).done(this.fetched.resolve);
                this.listenTo(ox, 'account:create account:delete account:update', this.update.bind(this, { useCache: false }));
                this.listenTo(settings, 'change:defaultSendAddress', this.update);
            },
            ready: function (callback) {
                return this.fetched.done(callback.bind(this, this));
            },
            comparator: function (a1, a2) {
                if (a1.is('default')) return -1;
                if (a2.is('default')) return 1;
                return a1.toString().toLowerCase() < a2.toString().toLowerCase() ? -1 : 1;
            },
            update: function (options) {
                return getAddresses(options).then(function (addresses, deputyAddresses, primary) {
                    var hash = {};
                    // set "type" at index 2
                    [].concat(
                        _.map(addresses, function (address) {
                            return address.concat(address[1] === primary[1] ? 'primary' : 'common');
                        }),
                        _.map(deputyAddresses, function (address) {
                            return address.concat('deputy');
                        })
                    ).forEach(function (address) {
                        // build temporary hash
                        hash[address[1]] = { name: address[0], email: address[1], type: address[2] };
                    });
                    // set default
                    var address = hash[getDefaultSendAddress()] || hash[primary[1]] || {};
                    address.type = 'default';
                    // updateDefaultNames
                    var list = Object.values(hash);
                    updateDefaultNames(list);
                    // collection
                    this.reset(list);
                }.bind(this));
            },
            getAsArray: function (email, options) {
                var model = this.get(email);
                if (!model) return;
                return model.toArray(options);
            },
            getCommon: function () {
                return this.filter(function (model) {
                    return !model.is('deputy');
                });
            },
            getDeputies: function () {
                return this.filter(function (model) {
                    return model.is('deputy');
                });
            },
            toArray: function () {
                this.map(function (model) { return model.toArray(); });
            }
        });

    that = {

        collection: new SenderList(),

        /**
         * user data
         * accessible for testing purposes
         * @return { deferred} resolves as user object
         */
        getUser: function () {
            return userAPI.get({ id: ox.user_id });
        },

        /**
         * default send address from settings
         * @return {string}
         */
        getDefaultSendAddress: getDefaultSendAddress,


        /**
         * internal and external accounts
         * accessible for testing purposes
         * @return { deferred} resolves as array of arrays
         */
        getAccounts: function (options) {
            return api.getAllSenderAddresses(options);
        },

        /**
         * display name
         * accessible for testing purposes
         * @return { deferred} resolves as string
         */
        getDisplayName: function () {
            return api.getDefaultDisplayName();
        },

        /**
         * primary address
         * accessible for testing purposes
         * @deprecated
         * @return { deferred} resolves as array
         */
        getPrimaryAddress: function () {
            return api.getPrimaryAddress();
        },

        /**
         * list of normalised arrays (display_name, value)
         * accessible for testing purposes
         * @deprecated
         * @return { deferred} resolves as array
         */
        getAddresses: getAddresses,

        /**
         * returns collection
         * @deprecated
         * @return { deferred} resolves as array
         */
        getAddressesCollection: function () {
            return that.collection;
        }
    };

    return that;
});
