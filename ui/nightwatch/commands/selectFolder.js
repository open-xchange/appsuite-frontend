/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

var util = require('util');

exports.command = function (id) {

    this
        .executeAsync(function (id) {
            $('*[data-id="' + id + '"]', '.folder-tree:visible').click();
        }, [id])
        .waitForElementVisible(util.format('.folder-tree li[data-id="%s"] .contextmenu-control', id), 10000);

    return this;

};
