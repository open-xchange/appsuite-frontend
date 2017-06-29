/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 *
 */

define('io.ox/calendar/chronos-model', [
    'io.ox/calendar/chronos-util'
], function (util) {

    'use strict';

    var Model = Backbone.Model.extend({
        idAttribute: 'cid',
        initialize: function () {
            this.cid = this.attributes.cid = util.cid(this.attributes);
        }
    });

    var Collection = Backbone.Collection.extend({

        model: Model,

        initialize: function () {
            this.ranges = [];
        },

        getRanges: function (opt) {
            var ranges = [];
            if (opt.useCache) ranges = this.getRangeDiff(opt);
            else ranges = [{ start: opt.start, end: opt.end }];

            this.ranges.push(_(opt).pick('start', 'end'));
            this.consolidateRanges();
            return ranges;
        },

        getRangeDiff: function (range) {
            if (this.ranges.length === 0) return [_(range).pick('start', 'end')];
            // assume that the ranges are ordered and disjoint
            var i, ranges = [], start = range.start;
            for (i = 0; i < this.ranges.length; i++) {
                if (this.ranges[i].end <= start && i === this.ranges.length - 1) ranges.push(_(range).pick('start', 'end'));
                if (this.ranges[i].end <= start) continue;
                if (this.ranges[i].start > range.end) {
                    ranges.push({ start: start, end: range.end });
                    break;
                }
                if (this.ranges[i].start > start) ranges.push({ start: start, end: this.ranges[i].start });
                start = this.ranges[i].end;
            }
            return ranges;
        },

        consolidateRanges: function () {
            var ranges = _(this.ranges).sortBy('start');
            if (ranges.length === 0) return;
            var stack = [ranges[0]], i;
            for (i = 1; i < ranges.length; i++) {
                var top = _(stack).last();
                if (top.end < ranges[i].start) {
                    stack.push(ranges[i]);
                } else if (top.end < ranges[i].end) {
                    top.end = ranges[i].end;
                    stack.pop();
                    stack.push(top);
                }
            }
            this.ranges = stack;
        }

    });

    return {
        Model: Model,
        Collection: Collection
    };
});
