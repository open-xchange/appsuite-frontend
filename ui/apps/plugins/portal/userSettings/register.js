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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('plugins/portal/userSettings/register', ['io.ox/core/extensions', 'gettext!io.ox/core'], function (ext, gt) {
	'use strict';
    ext.point('io.ox/portal/widget/userSettings').extend({

        title: gt('User Settings'),

        preview: function (baton) {
            this.append(
                $('<div class="content">').append(
                    $('<div class="action">').text(
                        gt("My contact data")
                    ).on('click', function (e) {
                        require(['io.ox/core/tk/dialogs', 'io.ox/core/settings/user'], function (dialogs, userEdit) {
                            var popup = new dialogs.SidePopup({
                                easyOut: true
                            });

                            var $node = $('<div>');

                            userEdit.editCurrentUser($node).done(function (user) {
                                user.on('update', function () {
                                    popup.close();
                                });
                            });

                            popup.show(e, function (pane) {
                                pane.append($node);
                                pane.closest('.io-ox-sidepopup').find('.io-ox-sidepopup-close').hide();
                            });
                        });
                    })
                )
            );
        }
    });
});