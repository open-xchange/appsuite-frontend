/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2013
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/core/wizard/registry', ['io.ox/core/extensions'], function (ext) {
	'use strict';

	function Wizard(options) {

		this.point = function () {
			return ext.point(options.id);
		};

		

	}

});