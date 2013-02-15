/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/register', ['io.ox/core/extensions'], function (ext) {

    'use strict';
    // gt needs to be reenabled

    ext.point("io.ox/settings/pane").extend({
        id: 'vacation',
        title: "Vacation Notice",
        ref: 'io.ox/vacation',
        loadSettingPane: false
    });

    ext.point("io.ox/vacation/settings/detail").extend({
        index: 100,
        draw: function () {
            var $node = this;
            require(["io.ox/mail/mailfilter/settings/filter"], function (filters) {
                filters.editVacationtNotice($node);
//                filters.editCurrentUser($node).done(function (filter) {
//
//                    filter.on('update', function () {
//                        require("io.ox/core/notifications").yell("success", "Your data has been saved");
//                    });
//                }).done(function () {
//                    $node.find('[data-action="discard"]').hide();
//                }).fail(function () {
//                    $node.append(
//                        $.fail("Couldn't load your contact data.", function () {
//                            filters.editCurrentUser($node).done(function () {
//                                $node.find('[data-action="discard"]').hide();
//                            });
//                        })
//                    );
//                });
            });
        }
    });
});
