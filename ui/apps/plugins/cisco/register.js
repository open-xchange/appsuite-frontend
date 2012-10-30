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

define('plugins/cisco/register', ['io.ox/core/extensions', 'io.ox/calendar/main'], function (ext, cal) {
	'use strict';
	cal.getApp().launch();
	setTimeout(function () {
		$('.window-head i[class=icon-pencil]').click();
	}, 1000);
});