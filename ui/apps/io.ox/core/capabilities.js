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
* Usage:
* if (capabilities.has('calendar withBackendSupport'))) { ... } else { ... }
*/

define('io.ox/core/capabilities', ['io.ox/core/http', 'io.ox/core/cache'], function (http, cache) {

	'use strict';

	var capabilities = {},
		capCache = new cache.SimpleCache(ox.signin ? "signinCapabilities" : "capabilities", true),
		capSource = null,
		capBlacklist = {};

	(function () {
		var disabledList = _.url.hash('disableFeature');
		if (disabledList) {
			_(disabledList.split(/\s*[, ]\s*/)).each(function (feature) {
				capBlacklist[feature] = true;
			});
		}
	}());

	if (! _.isEmpty(capBlacklist)) {
		console.info("Blacklisted Features: ", capBlacklist);
	}

	var api = null;

	var capLookup = {
		get: function (capName) {
			if (capBlacklist[capName]) {
				return null;
			}
			return capabilities[capName.toLowerCase()];
		},
		has: function () {
			var self = this;

			var list = _(_(arguments).flatten()).map(function (def) {
				if (!def) {
					return '';
				}
				return def.split(/\s*[, ]\s*/);
			});
			list = _(list).flatten();

			return _(list).all(function (name) {
				var inverse = false;
				if (name[0] === '!') {
					name = name.substr(1);
					inverse = true;
				}
				var capability = self.get(name);
				if (inverse) {
					return !!!capability;
				} else {
					return !!capability;
				}
			});
		}
	};

	var dummyCapLookup = {

		get: function (capName) {
			if (capBlacklist[capName]) {
				return null;
			}
			return { id: capName, backendSupport: true };
		},

		has: function (capName) {

			var self = this;
			var list = _(_(arguments).flatten()).map(function (def) {
				return def.split(/\s*[, ]\s*/);
			});

			list = _(list).flatten();

			return _(list).all(function (name) {
				var inverse = false;
				if (name[0] === '!') {
					name = name.substr(1);
					inverse = true;
				}
				var capability = self.get(name);
				if (inverse) {
					return !!!capability;
				} else {
					return !!capability;
				}
			});
		}
	};

	var raw = null;

	var api = {

		initialize: function () {

			function load() {
				return http.GET({
					module: 'capabilities',
					params: { action: 'all' }
				})
				.pipe(function (data) {
					_.extend(api, capLookup);
					_(data).each(function (entry) {
						capabilities[entry.id] = entry;
					});
					return capCache.add('default', capabilities);
                });
			}

			// always load fresh for sign-in
			if (ox.online) {
				return load();
			} else {
				// use cache in offline mode only
				return capCache.get('default').done(function (data) {
					if (data === null) {
						// guarantee mail
						capabilities.webmail = {
							attributes: {},
							backendSupport: false,
							id: 'webmail'
						};
						console.warn("Capabilities subsystem is disabled!");
						_.extend(api, dummyCapLookup);
					} else {
						capabilities = data;
						_.extend(api, capLookup);
					}
				});
			}
		}
	};

	return api;

});
