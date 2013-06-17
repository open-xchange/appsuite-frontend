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
       ['gettext!io.ox/mail/emoji',
       'raw!moxiecode/tiny_mce/plugins/emoji/unified.json',
       'raw!moxiecode/tiny_mce/plugins/emoji/softbank.json',
       'raw!moxiecode/tiny_mce/plugins/emoji/japan_carrier.json'
    ], function (gt, unified, softbank, japan_carrier) {
    "use strict";

    return {
        'unified': JSON.parse(unified),
        'softbank': JSON.parse(softbank),
        'japan_carrier': JSON.parse(japan_carrier),
        translatedNames: {
            'unified': gt('Unified'),
            'softbank': gt('SoftBank'),
            'japan_carrier': gt('Japanese Carrier')
        }
    };
});
