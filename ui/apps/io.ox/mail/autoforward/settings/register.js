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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/autoforward/settings/register', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/core/api/user',
    'gettext!io.ox/mail'
], function (ext, notifications, userAPI, gt) {

    'use strict';

    var filterModel;

    ext.point('io.ox/settings/pane/main/io.ox/mail').extend({
        id: 'io.ox/autoforward',
        title: gt('Auto Forward'),
        ref: 'io.ox/autoforward',
        loadSettingPane: false,
        index: 200,
        lazySaveSettings: true
    });

    ext.point('io.ox/autoforward/settings/detail').extend({
        index: 100,
        draw: function () {
            var $node = this,
                $container = $('<div>');

            $node.append($container);

            require(['io.ox/mail/autoforward/settings/filter'], function (filters) {

                userAPI.get().done(function (user) {
                    filters.editAutoForward($container, user.email1).done(function (filter) {
                        filterModel = filter;
                    }).fail(function (error) {
                        var msg;
                        if (error.code === 'MAIL_FILTER-0015') {
                            msg = gt('Unable to load mail filter settings.');
                        }
                        $container.append(
                            $.fail(msg || gt('Couldn\'t load your auto forward.'), function () {
                                filters.editAutoForward($node).done(function () {
                                    $container.find('[data-action="discard"]').hide();
                                });
                            })
                        );
                    });
                });
            });
        },

        save: function () {
            filterModel.save();
        }
    });
});
