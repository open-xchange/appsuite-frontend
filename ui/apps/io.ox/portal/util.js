/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/util', ['settings!io.ox/portal'], function (settings) {

    'use strict';

    // this util class was introduced to avoid using portal/widgets.js
    // because this would load *all* portal plugins

    return {

        getWidgets: function () {
            return _(settings.get('widgets/user', {})).map(function (obj) {
                // make sure we always have props
                obj.props = obj.props || {};
                return obj;
            });
        },

        getWidgetsByType: function (type) {
            return _(this.getWidgets()).filter(function (obj) {
                return obj.type === type;
            });
        }
    };
});
