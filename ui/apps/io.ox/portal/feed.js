/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/portal/feed', function () {

    'use strict';

    function Feed(options) {

        this.options = _.extend({}, options || {});
    }

    Feed.prototype.load = function (count, offset) {

        var callback = 'feed_callback_' + _.now(), url, self = this;

        if (count) { callback += '_' + count; }
        if (offset) { callback += '_' + offset; }

        url = this.options.url + callback;

        if (offset || count) {
            url = this.appendLimitOffset(url, count, offset);
        }

        return $.ajax({
            url: url,
            dataType: 'jsonp',
            jsonp: false,
            jsonpCallback: callback
        })
        .then(function (data) {
            return self.process(data);
        });
    };

    Feed.prototype.process = function (response) {
        return response;
    };

    Feed.prototype.appendLimitOffset = function (url) {
        return url;
    };

    return Feed;
});
