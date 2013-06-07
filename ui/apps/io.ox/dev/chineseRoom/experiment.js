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
			window.r.join();
			var interval, checkInterval;
			var i = 0;
			var log = {};

			interval = setInterval(function () {
				window.r.sayAndTrace(i, ox.base + "///" + i);
				log[i] = 0;
				i++;
			}, 500);

			window.r.on("received", function (e, o) {
				delete log[Number(o.message)];
				console.log("Received: ", o, log);
			});

			function check() {
				var failed = false;
				_(log).each(function (count, key) {
					console.log(key, count);
					if (count > 4) {
						console.log("MISSING MESSAGE: ", ox.base + "///" + key);
						clearInterval(interval);
						window.r.leave();
						failed = true;
						return;
					}
					log[key]++;
				});
				if (!failed) {
					setTimeout(check, 1000);
				}
			}

			setTimeout(check, 1000);
		}
	};

	console.log("Done");

	return true;
});