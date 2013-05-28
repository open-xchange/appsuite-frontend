/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/feed', ['io.ox/core/extensions'], function (ext) {

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
        .pipe(function (data) {
            return self.process(data);
        });
    };

    Feed.prototype.process = function (response) {
        return response;
    };

    Feed.prototype.appendLimitOffset = function (url, count, offset) {
        return url;
    };

    return Feed;
});
