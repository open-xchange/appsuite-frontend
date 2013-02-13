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
		var regex = /text\/calendar.*?method=.+/i;
		return _(baton.data.attachments).find(function (attachment) {
			return regex.test(attachment.content_type);
		});
	}

	function analyzeAttachment(baton) {
		console.log(baton);
		return http.PUT({
			module: 'calendar/itip',
			params: {
				action: 'analyze',
				dataSource: 'com.openexchange.mail.ical',
				descriptionFormat: 'html'
			},
			data: {
				"com.openexchange.mail.conversion.fullname": baton.data.folder_id,
				"com.openexchange.mail.conversion.mailid": baton.data.id,
				"com.openexchange.mail.conversion.sequenceid": baton.imip.attachment.id
			}
		});
	}

	function renderAnalysis($node, analysis, detailPoint, baton) {
		var $analysisNode;
		$node.append($analysisNode = $('<div class="io-ox-calendar-itip-analysis>'));
		// Annotations
		_(analysis.annotations).each(function (annotation) {
			renderAnnotation($analysisNode, annotation, analysis, detailPoint, baton);
		});
		// Changes
		_(analysis.changes).each(function (change) {
			renderChange($analysisNode, change, analysis, detailPoint, baton);
		});
	}

	function renderAnnotation($node, annotation, analysis, detailPoint, baton) {
		$node.append(
			$('<div class="annotation">').append(
				$('<div class="message">').append(annotation.message),
				renderAppointment(annotation.appointment, baton, detailPoint)
			)
		);
	}

	function renderChange($node, change, analysis, detailPoint, baton) {
		$node.append(
			$('<div class="change">').append(
				$('<div class="introduction">').append(change.introduction),
				renderDiffDescription(change),
				renderConflicts(change),
				renderAppointment(change.newAppointment || change.currentAppointment || change.deletedAppointment)
			)
		);
	}

	function renderAppointment(appointment, detailPoint, baton) {

	}

	function renderDiffDescription(change) {
		if (!change.diffDescription) {
			return;
		}

		// UL
		_(change.diffDescription || []).each(function (diffEntry) {
			// LI
		});
	}

	function renderConflicts(change) {

	}

	ext.point("io.ox/mail/detail/alternatives").extend({
		index: 100,
		id: 'imip',
		accept: function (baton) {
			var imipAttachment = discoverIMipAttachment(baton);
			if (imipAttachment) {
				console.log("Found IMIP Attachment", imipAttachment);
				baton.imip = {
					attachment: imipAttachment
				};
				return true;
			}
			return false;
		},
		draw: function (baton, detailPoint) {
			var $node = this;
			analyzeAttachment(baton).done(function (analysis) {
				renderAnalysis($node, analysis, detailPoint, baton);
			});
		}
	});
	
});