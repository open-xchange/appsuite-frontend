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

define('io.ox/mail/mailfilter/settings/register',
    ['io.ox/core/extensions',
     'gettext!io.ox/mail',
     'less!io.ox/mail/mailfilter/settings/style.less'
    ], function (ext, gt) {

    'use strict';

    ext.point('io.ox/settings/pane').extend({
        id: 'mailfilter',
        title: gt('Mail Filter'),
        ref: 'io.ox/mailfilter',
        loadSettingPane: false,
        index: 425
    });

    ext.point('io.ox/mailfilter/settings/detail').extend({
        index: 100,
        draw: function () {
            var $node = this,
                $container = $('<div>').addClass('io-ox-mailfilter-settings');

            $node.append($container);

            ox.load(['io.ox/mail/mailfilter/settings/filter']).done(function (filters) {
                filters.editMailfilter($container).fail(function (error) {
                    var msg;
                    if (error.code === 'MAIL_FILTER-0015') {
                        msg = gt('Unable to load mail filter settings.');
                    }
                    $container.append(
                        $.fail(msg || gt('Couldn\'t load your mail filters.'), function () {
                            filters.editMailfilter($node).done(function () {
                                $container.find('[data-action="discard"]').hide();
                            });
                        })
                    );
                });
            });

        }

    });
});
