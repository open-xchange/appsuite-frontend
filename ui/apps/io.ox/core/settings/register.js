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

define('io.ox/core/settings/register', ['io.ox/core/extensions', 'gettext!io.ox/core/settings'], function (ext, gt) {

	'use strict';

	ext.point("io.ox/settings/pane").extend({
		id: 'users',
		title: gt("My contact data"),
		ref: 'io.ox/users',
		loadSettingPane: false
	});

	ext.point("io.ox/users/settings/detail").extend({
		index: 100,
		draw: function () {
			var $node = this;
			require(["io.ox/core/settings/user"], function (users) {
				users.editCurrentUser($node).done(function (user) {
					user.on('update', function () {
						require("io.ox/core/notifications").yell("success", gt("Your data has been saved"));
					});
				}).done(function () {
						$node.find('[data-action="discard"]').hide();
					}
				);
			});
		}
	});
});
