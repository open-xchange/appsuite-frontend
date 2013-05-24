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

define('io.ox/dev/chineseRoom/experiment', ['io.ox/dev/chineseRoom/room', 'io.ox/realtime/rt'], function (rooms, rt) {
	'use strict';

	console.log("Setting up experiment");
	window.rooms = rooms;
	window.r = rooms.getRoom("a");
	window.rt = rt;

	window.rtExperiments = {
		run: function () {
			var interval, checkInterval;
			var i = 0;
			var log = {};

			interval = setInterval(function () {
				window.r.sayAndTrace(i);
				log[i] = 0;
			}, 500);

			checkInterval = setInterval(function () {
				_(log).each(function (count, key) {
					if (count > 4) {
						console.log("MISSING MESSAGE: ", key);
						clearInterval(interval);
						clearInterval(checkInterval);
					}
				});
			});
		}
	};

	console.log("Done");

	return true;

});