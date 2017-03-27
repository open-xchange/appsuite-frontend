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

exports.command = function (opt) {

    var selector = '*',
        id;

    if (opt.id) selector = util.format('li[data-id="%s"]', opt.id);
    if (opt.title) selector = util.format('li[title^="%s"]', opt.title);

    this
        .execute(function (selector) {
            if ($('.window-container:visible .window-body > .bottom > a') === 0) return;
            $('.window-container:visible .window-body > .bottom > a').click();

            var elem = $(selector, '.window-container:visible .folder-tree');
            if (!elem.is(':visible')) {
                elem.parent().closest('li.folder').find(' > .folder-node > .folder-arrow').click();
            }
        }, [selector])
        .waitForElementVisible('.folder-tree ' + selector, 2500)
        .execute(function (selector) {
            var elem = $(selector, '.window-container:visible .folder-tree');
            elem.click();
            return elem.attr('data-id');
        }, [selector], function (ret) {
            id = ret.value;
        })
        .perform(function (api, done) {
            api.waitForElementVisible(util.format('.folder-tree li.selected[data-id="%s"]', id), 10000, done);
        })
        // add some time to start folder change in the application
        .pause(500);

    return this;

};
