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

define('io.ox/dev/wizard/example', ['io.ox/core/extensions', 'io.ox/core/wizard/registry'], function (ext, wizardRegistry) {
	'use strict';

	window.wizard = wizardRegistry.getWizard({id: 'io.ox/dev/wizard/example'});

	ext.point("io.ox/dev/wizard/example").extend({
		id: "page1",
		index: 0,
		load: function (baton) {
			var def = $.Deferred();
			setTimeout(function () {
				baton.data = {
					greeting: "Hello World"
				};
				def.resolve();
			}, 1000);
			return def;
		},

		draw: function (baton) {
			var $input;
			this.append($input = $('<input type="text" name="greeting" />').val(baton.data.greeting));
			$input.on("change", function () {
				if ($input.val() === 'opensesame') {
					baton.buttons.enableNext();
				}
			});

			baton.form = {
				input: $input
			};
		},

		activate: function (baton) {
			baton.buttons.disableNext();
		},

		finish: function (baton) {
			console.log(baton.form.input.val());
		}
	});
});