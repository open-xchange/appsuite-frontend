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

	function Executor(steps, options) {
		var options = options || {};

		var step = 0;
		function e() {
			if (step >= steps.length) {
				step = 0;
			}
			steps[step]();
			step++;
		}

		var interval = null;

		this.start = function () {
			if (interval) {
				return;
			}
			interval = setInterval(e, options.interval);
		};

		this.stop = function () {
			if (!interval) {
				return;
			}
			clearInterval(interval);
		};

	}

	console.log("Setting up experiment");
	window.rooms = rooms;
	window.r = rooms.getRoom("a");
	window.rt = rt;

	window.experiments = {
		continousOpenAndClose: function (options) {
			var room = null;
			var steps = [
				function () {
					room = rooms.getRoom("continousOpenAndClose");
					room.join({trace: false});
					room.say("1");
				},
				function () {
					room.leave({trace: false});
				},
				function () {
					room.destroy();
				}

			];

			return new Executor(steps, options);
		}
	};

	console.log("Done");

	return true;

});