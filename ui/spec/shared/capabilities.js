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
define('capabilities',
       ['fixture!capabilities/common.json',
        'fixture!capabilities/premium.json',
        'fixture!capabilities/pim.json'], function (common, premium, pim) {

        var init = function (base) {
            var data = base.slice(0),
                process = function (list, action) {
                    if (action === 'add') {
                        data = _.unique(
                            data.concat(list)
                        );
                    } else {
                        data = _.filter(data, function (cap) {
                            return _.where(list, cap).length === 0
                        })
                    }
                    return data;
                }

            return {
                reset: function () {
                    return this.data = da.slice(0);
                },
                enable: function (list) {
                    return process([].concat(list), 'add');
                },
                disable: function (list) {
                    return process([].concat(list), 'remove');
                },
                get: function () {
                    return data;
                }
            }

        };

        return {
            common: init(common),
            premium: init(premium),
            pim: init(pimdata)
        }
});
