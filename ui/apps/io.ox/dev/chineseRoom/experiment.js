/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
