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

define('io.ox/core/settings/defaults', function (ext) {
	'use strict';

	return {
		language: 'en_US',
		refreshInterval: 5 * 60000,
		autoStart: 'io.ox/mail/main',
		autoOpenNotification: true
	};
	
});