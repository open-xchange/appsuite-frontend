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

define('io.ox/core/capabilities', function () {

	'use strict';

	var capabilities = {},
		capBlacklist = {};

	_(ox.serverConfig.capabilities).each(function (cap) {
		capabilities[cap.id] = cap;
	});

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
		},
		reset: function () {
			capabilities = {};
			_(ox.serverConfig.capabilities).each(function (cap) {
				capabilities[cap.id] = cap;
			});
		}
	};

	return capLookup;

});
