/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('spec/shared/capabilities', [
    'fixture!capabilities/common.json',
    'fixture!capabilities/premium.json',
    'fixture!capabilities/pim.json'
], function (common, premium, pim) {

    var create = function (base) {
        var data = base.slice(0),
            references = {},
            /**
             * apply current capabilites and do the requirejs hokey pokey dance
             * hint: wrapped in runs/waits to usably in beforeEach without any further handling
             * @return { deferred} returns current set of enabled capabilties (array)
             */
            apply = function () {
                var def = $.Deferred(),
                    capabilities = requirejs('io.ox/core/capabilities');

                // overwrite server capabilities and reload capabilities
                ox.serverConfig.capabilities = _(data).map(function (cap) {
                    return { id: cap };
                });
                capabilities.reset();

                //reload consuming modules
                ox.testUtils.modules.reload('io.ox/core/capabilities').then(function () {
                    //require original
                    require(references.ids, function () {
                        //reset common methods of used references
                        _.each(arguments, function (arg, index) {
                            $.extend(references.vars[index], arg || {});
                        });
                        def.resolve();
                    }, def.reject);
                }, def.reject);

                return def.then(function () {
                    return data;
                });
            },
            /**
             * enable/disable capabilities
             * @param  {array} list
             * @param  {string} action [add|remove]
             * @return {deferred}
             */
            process = function (list, action) {
                var before = [].concat(data);
                list = [].concat(list);

                if (action === 'add') {
                    data = _.unique(
                        data.concat(list)
                    );
                } else {
                    data = _(data).difference(list);
                }

                //set
                return before.length === data.length ? $.Deferred().resolve(data) : apply();
            };

        return {
            /**
             * @param  {string|array} ids of used modules
             * @param  {object|array} vars of used variables (analogous to 'ids')
             * @return {this}
             */
            init: function (ids, vars) {
                references = {
                    ids: [].concat(ids),
                    vars: [].concat(vars)
                };
                return this;
            },
            /**
             * @return {array} capabilites
             */
            get: function () {
                return [].concat(data);
            },
            /**
             * enable capabilities
             * @param  {string|array} list of capabilties
             * @return {deferred} returns current set of enabled capabilties (array)
             */
            enable: function (list) {
                return process([].concat(list), 'add');
            },
            /**
             * disable capabilities
             * @param  {string|array} list of capabilties
             * @return {deferred} returns current set of enabled capabilties (array)
             */
            disable: function (list) {
                return process([].concat(list), 'remove');
            },
            /**
             * reset to inital state of enabled caps (common, premium or pim)
             * @return {deferred} returns current set of enabled capabilties (array)
             */
            reset: function () {
                data = base.slice(0);
                return apply();
            },
            /**
             * apply curret set of capabilities
             * @return {deferred} returns current set of enabled capabilties (array)
             */
            apply: apply
        };

    };

    return {
        /**
         * list supported contexts
         * @return { array }
         */
        list: function () {
            return ['common', 'premium', 'pim'];
        },
        /**
         * get preset capabilities
         * @return { object }
         */
        get: function () {
            return {
                common: common,
                premium: premium,
                pim: pim
            };
        },
        /**
         * create util object (optional: predefined capabilites by context)
         * @param  {string} context
         * @return { object }
         */
        preset: function (context) {
            var util;
            switch (context) {
                case 'common':
                    util = create(common);
                    break;
                case 'premium':
                    util = create(premium);
                    break;
                case 'pim':
                    util = create(pim);
                    break;
                default:
                    util = create([]);
                    break;
            }
            return util;
        }
    };
});
