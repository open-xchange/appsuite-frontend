/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('plugins/halo/linkedIn/view-halo', [
    'io.ox/linkedIn/view-detail',
    'less!io.ox/linkedIn/style'
], function (viewer) {

    'use strict';

    return {
        draw: function (liResponse) {
            var $node = $('<div>').addClass('linkedIn');
            $node.append($('<div>').addClass('widget-title clear-title').text('LinkedIn'));
            if (liResponse.status && liResponse.status === 404) {
                $node.append($('<div>').text('Not found'));
            } else {
                $node.append(viewer.draw(liResponse));
            }
            return $node;

        }
    };
});
