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
define('moxiecode/tiny_mce/plugins/emoji/main',
       ['emoji/emoji',
       'css!emoji/emoji.css',
       'less!moxiecode/tiny_mce/plugins/emoji/emoji.less'], function (emoji) {

    "use strict";

    var icons = _(emoji.EMOJI_MAP)
    .chain()
    .pairs()
    .map(function (icon) {
        return {css: 'emoji' + icon[1][2], unicode: icon[0], desc: icon[1][1]};
    })
    .value();


    return _.extend({
        icons: icons
    }, emoji);
});
