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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */

define('io.ox/files/actions/share', [
], function () {

    'use strict';

    return {
        // array is an array of models
        invite: function (array, options) {

            if (!array) return;

            if (options) {
                options = _.extend({ share: true }, options);
            }

            return require(['io.ox/files/share/permissions'], function (permissions) {
                var model = _.first(array);
                permissions.showByModel(model, array, options);
            });
        }
    };
});
