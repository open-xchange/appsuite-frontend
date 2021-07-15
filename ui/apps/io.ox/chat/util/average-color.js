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

define('io.ox/chat/util/average-color', [], function () {

    'use strict';

    function getAverageColor(url) {
        var def = $.Deferred();
        var img = document.createElement('img');
        img.onload = function () {
            var canvas = document.createElement('canvas');
            var ratio = this.width / this.height;
            var width = 100, height = Math.floor(width / ratio);
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(this, 0, 0, width, height);
            var colors = ctx.getImageData(0, 0, width, height).data;
            var length = colors.length;
            var i = 0, r = 0, g = 0, b = 0, n = 0;
            while (i < length) {
                r += colors[i];
                g += colors[i + 1];
                b += colors[i + 2];
                i += 4 * 5;
                n++;
            }
            r = Math.round(r / n);
            g = Math.round(g / n);
            b = Math.round(b / n);
            canvas = ctx = colors = img = img.onload = null;
            def.resolve('rgb(' + r + ', ' + g + ', ' + b + ')');
        };
        img.src = url;
        return def;
    }

    return {
        fromBlob: function (blob) {
            var url = URL.createObjectURL(blob);
            return getAverageColor(url);
        }
    };
});
