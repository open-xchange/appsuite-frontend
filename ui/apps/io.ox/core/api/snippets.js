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
/*
	{
		id: 12, // Set by the backend
		type: 'signature',   // The type of snippet, for easy lookup
		module: 'io.ox/mail', // The module that created the snippet
		displayname: 'My Signature', // A display name
		content: 'This email contains the absolute unchangeable truth, questioning its content is discouraged. \n The Mgt.', // The content of the snippet
		misc: { insertion: above } // Object with misc options
	}
*/
define('io.ox/core/api/snippets', ['io.ox/core/http', 'io.ox/core/event'], function (http, Events) {
	'use strict';

	var api = {};
	Events.extend(api);


	function fnTrigger(event) {
		return function () {
			api.trigger(event);
		};
	}

	api.getAll = function (type) {
		return http.GET({
			module: 'snippet',
			params: {
				action: 'all'
			}
		})
		.pipe(function (data) {
			return _(data).map(function (sig) {
				// robustness: signature migration
				sig.misc = $.extend({ insertion: 'below'}, sig.misc || {});
				return sig;
			});
		});
	};

	api.create = function (snippet) {
		return http.PUT({
			module: 'snippet',
			params: {
				action: 'new'
			},
			data: snippet
		}).done(fnTrigger('refresh.all'));
	};

	api.update = function (snippet) {
		return http.PUT({
			module: 'snippet',
			params: {
				action: 'update',
				id: snippet.id
			},
			data: snippet
		}).done(fnTrigger('refresh.all'));
	};

	api.get = function (id) {
		return http.GET({
			module: 'snippet',
			params: {
				action: 'get',
				id: id
			}
		});
	};

	api.list = function (ids) {
		return http.PUT({
			module: 'snippet',
			params: {
				action: 'list'
			},
			data: ids
		});
	};

	// TODO: Attachment Handling


	api.destroy = function (id) {
		return http.GET({
			module: 'snippet',
			params: {
				action: 'delete',
				id: id
			}
		}).done(fnTrigger('refresh.all'));
	};


	return api;

});
