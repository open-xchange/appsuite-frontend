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

define('io.ox/calendar/invitations/register', ['io.ox/core/extensions', 'io.ox/core/http', 'settings!io.ox/calendar'], function (ext, http, settings) {
	'use strict';

	function discoverIMipAttachment(baton) {
		
	}

	function analyzeAttachment(attachment) {
		
	}

	function renderAnalysis($node, analysis, detailPoint) {
		
	}

	ext.point("io.ox/mail/detail/alternatives").extend({
		index: 100,
		id: 'imip',
		accept: function (baton) {
			var imipAttachment = discoverIMipAttachment(baton);
			if (imipAttachment) {
				baton.imip = {
					attachment: imipAttachment
				};
			}
		},
		draw: function (baton, detailPoint) {
			var $node = this;
			analyzeAttachment(baton.imip.attachment).done(function (analysis) {
				renderAnalysis($node, analysis, detailPoint);
			});
		}
	});
	
});