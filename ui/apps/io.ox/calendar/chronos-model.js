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
    'io.ox/calendar/chronos-util',
    'io.ox/core/folder/api'
], function (util, folderAPI) {

    'use strict';

    var AttendeeModel = Backbone.Model.extend({ idAttribute: 'entity' }),
        AttendeeCollection = Backbone.Collection.extend({ model: AttendeeModel });

    var Model = Backbone.Model.extend({
        idAttribute: 'cid',
        initialize: function () {
            // models in create view do not have an id yet. avoid undefined.undefined cids
            if (this.attributes.folder && this.attributes.id) {
                this.cid = this.attributes.cid = util.cid(this.attributes);
            }
        },
        getAttendees: function () {
            if (this._attendees) {
                return this._attendees;
            }
            var self = this,
                resetListUpdate = false,
                changeAttendeesUpdate = false;

            this._attendees = new AttendeeCollection(this.get('attendees'), { silent: false });

            this._attendees.on('add remove reset', function () {
                if (changeAttendeesUpdate) {
                    return;
                }
                resetListUpdate = true;
                self.set('attendees', this.toJSON(), { validate: true });
                resetListUpdate = false;
            });

            this.on('change:attendees', function () {
                if (resetListUpdate) {
                    return;
                }
                changeAttendeesUpdate = true;
                self._attendees.reset(self.get('attendees'));
                changeAttendeesUpdate = false;
            });
            return this._attendees;
        },

        setDefaultAttendees: function (options) {
            var self = this;
            var def = $.Deferred();
            folderAPI.get(this.get('folder')).then(function (folder) {
                if (folderAPI.is('private', folder)) {
                    // if private folder, current user will be the organizer
                    if (options.create) {
                        require(['io.ox/core/api/user'], function (userAPI) {
                            userAPI.get().done(function (user) {

                                self.set('organizer', {
                                    cn: user.display_name,
                                    email: user.email1,
                                    uri: 'mailto:' + user.email1,
                                    entity: ox.user_id
                                });
                                self.getAttendees().add(util.createAttendee(user, { partStat: 'ACCEPTED' }));
                                def.resolve();

                            }).fail(def.reject);
                        });
                    } else {
                        def.resolve();
                    }
                } else if (folderAPI.is('public', folder)) {
                    // if public folder, current user will be added
                    if (options.create) {
                        require(['io.ox/core/api/user'], function (userAPI) {
                            userAPI.get().done(function (user) {

                                self.getAttendees().add(util.createAttendee(user, { partStat: 'ACCEPTED' }));
                                def.resolve();

                            }).fail(def.reject);
                        });
                    } else {
                        def.resolve();
                    }
                } else if (folderAPI.is('shared', folder)) {
                    // in a shared folder the owner (created_by) will be added by default
                    require(['io.ox/core/api/user'], function (userAPI) {
                        userAPI.get(folder.created_by).done(function (user) {

                            self.getAttendees().add(util.createAttendee(user, { partStat: 'ACCEPTED' }));
                            def.resolve();

                        }).fail(def.reject);
                    });
                }
            }).fail(def.reject);
            return def;
        },
        getMoment: function (name) {
            if (!this.get(name)) return;
            var date = this.get(name);
            return moment.tz(date.value, date.tzid || moment.defaultZone.name);
        },
        getTimestamp: function (name) {
            return this.getMoment(name).valueOf();
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
