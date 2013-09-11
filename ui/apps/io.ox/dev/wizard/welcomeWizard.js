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

/**
* In this example we will build a simple welcome wizard, that tries to complete the users information.
*/
define('io.ox/dev/wizard/welcomeWizard', ['io.ox/core/extensions', 'io.ox/core/wizard/registry'], function (ext, wizards) {
	'use strict';
	// Grab the extension point for the wizard
	// Every page in the wizard will be an extension to this extension point
	var point = ext.point("io.ox/dev/wizard/welcomeWizard");
	
		

	return {
		getInstance: function () {
			// Create a new instance of the wizard. Note that the id of the wizard determines the extension point
			// that pages have to extend
			return wizards.getWizard({id: 'io.ox/dev/wizard/welcomeWizard'});
		}
	};
});