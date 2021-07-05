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

define('io.ox/core/active', [], function () {

    'use strict';

    var active = true, focus = true, counter = 0;

    // check state very second
    setInterval(check, 1000);

    $(window).on('mousemove mousedown keydown mousewheel focus', yes);
    $(document).on('visibilitychange', maybe);
    $(window).on('blur', no);

    function check() {
        counter++;
        active = focus && counter < 60 && document.visibilityState === 'visible';
    }

    // this function is called very often (e.g. mousemove) so it must be very simple
    function yes() {
        counter = 0;
        active = focus = true;
    }

    function maybe() {
        counter = 0;
        check();
    }

    function no() {
        active = focus = false;
    }

    return function isActive() {
        return active;
    };
});
