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

/**
 * This will open the context menu for a folder with an id or by the title
 * @param opt {object} Must contain exactly one of the following
 * @param opt.id {string} The id of the target folder.
 * @param opt.title {string} The title of the target folder.
 */
exports.command = function (opt) {

    var id = opt.id;

    // find the id, if only the title is specified
    if (opt.title) {
        this.execute(function (title) {
            var elem;
            $('.folder-tree:visible .folder-node').each(function () {
                if ($(this).text() === title) {
                    elem = $(this);
                    return false;
                }
            });
            return elem.closest('.folder').attr('data-id');
        }, [opt.title], function (result) {
            if (!result || !result.value) this.assert.fail('not found', 'folder id', util.format('Could not find a folder id for the folder with the title "%s".', opt.title));
            id = result.value;
        });
    }

    this.perform(function (api, done) {
        api
            .waitForElementVisible(util.format('.folder-tree li[data-id="%s"] .contextmenu-control', id), 2000)
            .click(util.format('.folder-tree li[data-id="%s"] .contextmenu-control', id));
        done();
    });

    return this;

};
