/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/dev/chineseRoom/experiment', [
    'io.ox/dev/chineseRoom/room',
    'io.ox/realtime/rt'
], function (rooms, rt) {

    'use strict';

    console.log('Setting up experiment');
    window.rooms = rooms;
    window.r = rooms.getRoom('a');
    window.rt = rt;

    window.rtExperiments = {
        run: function () {
            window.r.join();
            var interval,
                i = 0,
                log = {};

            interval = setInterval(function () {
                window.r.sayAndTrace(i, ox.base + '///' + i);
                log[i] = 0;
                i++;
            }, 500);

            window.r.on('received', function (e, o) {
                delete log[Number(o.message)];
                console.log('Received: ', o, log);
            });

            function check() {
                var failed = false;
                _(log).each(function (count, key) {
                    console.log(key, count);
                    if (count > 4) {
                        console.log('MISSING MESSAGE: ', ox.base + '///' + key);
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

    console.log('Done');

    return true;
});
