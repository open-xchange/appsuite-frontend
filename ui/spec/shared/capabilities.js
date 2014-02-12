/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define('spec/shared/capabilities',
       ['fixture!capabilities/common.json',
        'fixture!capabilities/premium.json',
        'fixture!capabilities/pim.json'], function (common, premium, pim) {

        var create = function (base) {
            var data = base.slice(0),
                references = {},
                /**
                 * apply current capabilites and do the requirejs hokey pokey dance
                 * hint: wrapped in runs/waits to usably in beforeEach without any further handling
                 * @return {deferred} returns current set of enabled capabilties (array)
                 */
                apply = function () {
                    var def = $.Deferred(),
                        capabilities = requirejs('io.ox/core/capabilities');

                    runs(function () {
                        //remove existing stubs
                        capabilities.has.restore && capabilities.has.restore();
                        //create stub
                        sinon.stub(capabilities, 'has', function (arg) {
                            return data.length && _.contains(data, arg);
                        });
                        //reload consuming modules
                        ox.testUtils.modules.reload('io.ox/core/capabilities')
                            .then(function () {
                                //require original
                                require(references.ids, function () {
                                    //reset common methods of used references
                                    _.each(arguments, function (arg, index) {
                                        $.extend(references.vars[index], arg || {});
                                    });
                                    def.resolve();
                                }, def.reject);
                            }, def.reject);
                    });

                    waitsFor(function () {
                        return def.state() === 'resolved';
                    });

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
                    var before = data.length;
                    list = [].concat(list);

                    if (action === 'add') {
                        data = _.unique(
                            data.concat(list)
                        );
                    } else {
                        data = _.filter(data, function (cap) {
                            return _.where(list, cap).length === 0;
                        });
                    }

                    //set
                    return before.length === data.length ? $.Defered().resolve() : apply();
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
                }
            };
        };

        return {
            /**
             * list supported contexts
             * @return {array}
             */
            list: function () {
                return ['common', 'premium', 'pim'];
            },
            /**
             * get preset capabilities
             * @return {object}
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
             * @return {object}
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
