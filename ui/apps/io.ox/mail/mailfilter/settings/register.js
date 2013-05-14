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

define('io.ox/mail/mailfilter/settings/register',
        ['io.ox/core/extensions', 'io.ox/core/notifications',
         'io.ox/core/api/user', 'gettext!io.ox/mail', 'less!io.ox/mail/mailfilter/settings/style.less'], function (ext, notifications, userAPI, gt) {

    'use strict';

    var filterModel;

    ext.point("io.ox/settings/pane").extend({
        id: 'mailfilter',
        title: gt("Mail Filter"),
        ref: 'io.ox/mailfilter',
        loadSettingPane: false,
        index: 425,
        lazySaveSettings: true
    });

    ext.point("io.ox/mailfilter/settings/detail").extend({
        index: 100,
        draw: function () {
            var $node = this,
                $container = $('<div>').addClass('io-ox-mailfilter-settings');

            $node.append($container);

            require(["io.ox/mail/mailfilter/settings/filter"], function (filters) {
                filters.editMailfilter($container).done(function (filter) {
                    filterModel = filter;
                }).fail(function (error) {
                    var msg;
                    if (error.code === 'MAIL_FILTER-0015') {
                        msg = gt('Unable to contact mailfilter backend.');
                    }
                    $container.append(
                        $.fail(msg || gt("Couldn't load your mail filters."), function () {
                            filters.editMailfilter($node).done(function () {
                                $container.find('[data-action="discard"]').hide();
                            });
                        })
                    );
                });
            });


        },

        save: function () {
            console.log('the save is triggered');

        }
    });
});
