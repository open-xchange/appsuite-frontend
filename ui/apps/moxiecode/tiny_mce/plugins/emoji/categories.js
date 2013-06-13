/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('moxiecode/tiny_mce/plugins/emoji/categories',
       ['gettext!io.ox/mail/emoji'], function (gt) {
    "use strict";

    function category(cat) {
        return require(['raw!moxiecode/tiny_mce/plugins/emoji/' + cat + '.json'])
            .then(function (data) {
                return JSON.parse(data || '{}');
            }).promise();
    }

    return {
        'unified': category('unified')
        translatedNames: {
            'unified': gt('Unified')
        }
    };
});
