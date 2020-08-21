/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/switchboard/views/call-history', [
    'io.ox/backbone/views/disposable',
    'io.ox/contacts/api',
    'io.ox/contacts/util',
    'io.ox/switchboard/presence',
    'io.ox/switchboard/lookup',
    'io.ox/switchboard/call/api',
    'io.ox/core/extensions',
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (DisposableView, contactsAPI, util, presence, lookup, call, ext, settings, gt) {

    'use strict';

    // CallHistory Model
    // - [email] <string>
    // - [number] <string>
    // - type <string>: zoom, jitsi, phone
    // - date <int>: Call date+time
    // - incoming <bool>
    // - missed <bool>
    // - [name] <string>: Caller/callee name (optional)

    var point = ext.point('io.ox/switchboard/call-history/data');
    var historyLimit = settings.get('callHistory/limit', 50);
    var CallHistoryCollection = Backbone.Collection.extend({ comparator: 'date' });
    var callHistory = new CallHistoryCollection();

    var CallHistoryView = DisposableView.extend({
        tagName: 'li',
        className: 'launcher dropdown call-history',
        events: {
            'click [data-action="all"]': 'showAll',
            'click [data-action="missed"]': 'showMissed'
        },
        initialize: function () {
            var entries = settings.get('callHistory/entries') || [];
            this.collection.add(entries);
            this.onAddRemove = _.debounce(this.onAddRemove.bind(this), 10);
            this.listenTo(this.collection, 'add remove reset', this.onAddRemove);
            this.onChange = _.debounce(this.onChange.bind(this), 10);
            this.listenTo(this.collection, 'change', this.onChange);
            this.opened = false;
            point.invoke('load', this);
        },
        render: function () {
            this.$el.attr('role', 'presentation').append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" tabindex="-1" aria-haspopup="true" aria-expanded="false" role="button">')
                    .attr('aria-label', gt('Call history'))
                    .on('click', this.onOpen.bind(this))
                    .one('click', this.onFirstOpen.bind(this))
                    .append(
                        $('<i class="fa fa-phone" aria-hidden="true">'),
                        this.$indicator = $('<svg height="8" width="8" class="indicator" focusable="false" aria-hidden="true"><circle cx="4" cy="4" r="4"></svg>')
                    ),
                this.$ul = $('<ul class="dropdown-menu dropdown-menu-right" role="menu">').append(
                    this.$header = $('<li class="header" role="separator">').append(
                        $('<div class="header-caption">')
                            .text(gt('Call History')),
                        $('<div class="header-controls">').append(
                            $('<button type="button" class="btn btn-link" data-action="all">')
                                .text(gt.pgettext('call-history', 'All')),
                            $('<button type="button" class="btn btn-link" data-action="missed">')
                                .text(gt.pgettext('call-history', 'Missed'))
                        )
                    )
                )
            );
            this.updateIndicator();
            return this;
        },
        onFirstOpen: function () {
            this.opened = true;
            point.invoke('initialize', this);
            this.renderItems();
        },
        onOpen: function () {
            settings.set('callHistory/lastSeen', _.now()).save();
            this.updateIndicator();
        },
        onAddRemove: function () {
            this.updateIndicator();
            this.onChange();
            if (!this.opened) return;
            this.removeItems();
            this.renderItems();
        },
        onChange: function () {
            point.invoke('store', this);
        },
        renderItems: function () {
            this.collection.slice(-historyLimit).reverse().forEach(function (model) {
                this.$ul.append(new CallHistoryItem({ model: model }).render().$el);
            }, this);
        },
        updateIndicator: function () {
            var lastSeen = settings.get('callHistory/lastSeen', 0);
            var hasUnseen = this.collection.some(function (model) {
                return model.get('missed') && model.get('date') > lastSeen;
            });
            this.$indicator.toggleClass('hidden', !hasUnseen);
            this.$el.find('.dropdown-toggle').toggle(this.collection.length > 0);
        },
        removeItems: function () {
            this.$ul.children().slice(1).remove();
        },
        showAll: function (e) {
            e.stopPropagation();
            this.$('.dropdown-menu > li[role="presentation"]').slideDown(300);
        },
        showMissed: function (e) {
            e.stopPropagation();
            this.$('.dropdown-menu > li[role="presentation"]:not(.missed)').slideUp(300);
        }
    });

    var CallHistoryItem = DisposableView.extend({
        tagName: 'li',
        className: 'call-history-item',
        events: {
            'click a': 'onClick'
        },
        initialize: function () {
            this.type = this.model.get('type');
            this.listenTo(this.model, 'remove', this.onRemove);
            this.listenTo(this.model, 'change:name change:email', this.onChange);
            this.$el.attr('role', 'presentation');
            this.fetchMissingData();
        },
        fetchMissingData: function () {
            if (this.model.get('name')) return;
            point.invoke('fetch', this);
        },
        updateMissingData: function (data) {
            if (!data) return;
            if (this.disposed) return;
            this.model.set({
                email: data.email1 || data.email2 || data.email3,
                name: util.getFullName(data)
            });
        },
        render: function () {
            this.$el
                .empty()
                .attr('title', this.getTooltip())
                .toggleClass('missed', this.model.get('missed'))
                .append(
                    this.createLink().append(
                        this.createIcon(),
                        this.createPicture(),
                        this.createPresence(),
                        $('<div>').append(
                            $('<span class="date">').text(this.getDate()),
                            $('<div class="name ellipsis">').text(this.getName())
                        ),
                        $('<div class="caption ellipsis">').text(this.getCaption())
                    )
                );
            return this;
        },
        createLink: function () {
            var $a = $('<a href="#" role="menuitem" draggable="false">');
            if (this.type === 'phone') $a.attr('href', 'callto:' + this.model.get('number'));
            $a.attr('tabindex', this.model === _(this.model.collection.models).last() ? 0 : -1);
            return $a;
        },
        createIcon: function () {
            if (this.model.get('missed')) return $('<span class="call-icon" aria-hidden="true"><i class="fa fa-exclamation"></i></span>');
            if (!this.model.get('incoming')) return $('<span class="call-icon" aria-hidden="true"><i class="fa fa-phone"></i><i class="fa fa-angle-double-right"></i></span>');
            return $();
        },
        createPicture: function () {
            var email = this.model.get('email');
            if (!email) return $('<div class="contact-photo">');
            var options = { email: email };
            return contactsAPI.pictureHalo($('<div class="contact-photo">'), options, { width: 32, height: 32 });
        },
        createPresence: function () {
            var email = this.model.get('email');
            if (!email) return $('<span class="presence">');
            return presence.getPresenceDot(email);
        },
        getTooltip: function () {
            var missed = this.model.get('missed'),
                incoming = this.model.get('incoming'),
                name = this.model.get('name') || this.model.get('number') || this.model.get('email');
            if (missed) return gt('Missed call from %1$s', name);
            if (incoming) return gt('Answered call from %1$s', name);
            return gt('You called %1$s', name);
        },
        getDate: function () {
            var t = this.model.get('date');
            var isToday = moment().isSame(t, 'day');
            if (isToday) return moment(t).format('LT');
            var sameWeek = moment().isSame(t, 'week');
            if (sameWeek) return moment(t).format('dddd');
            return moment(t).format('l');
        },
        getName: function () {
            return this.model.get('name') || this.model.get('number') || this.model.get('email');
        },
        getCaption: function () {
            switch (this.type) {
                case 'phone': return this.model.get('name') ? this.model.get('number') : 'Unbekannt';
                case 'jisti': return 'Jitsi';
                case 'zoom': return 'Zoom';
                // no default
            }
        },
        onChange: function () {
            this.render();
        },
        onRemove: function () {
            this.$el.remove();
        },
        onClick: function (e) {
            point.invoke('action', this, e);
        }
    });

    // helper: is zoom (or jitsi)
    var isZoom = /^(zoom|jitsi)$/i;

    // allow other implementations to add data
    ext.point('io.ox/switchboard/call-history/data').extend(
        {
            id: 'default',
            index: 100,
            initialize: function () {
                lookup.initialize();
            },
            store: function () {
                var entries = this.collection.toJSON().filter(function (data) {
                    return isZoom.test(data.type);
                });
                settings.set('callHistory/entries', entries.slice(-historyLimit)).save();
            },
            fetch: function () {
                if (!isZoom.test(this.type)) return;
                lookup.findByEmail(this.model.get('email'))
                    .done(this.updateMissingData.bind(this));
            },
            action: function (e) {
                if (!isZoom.test(this.type)) return;
                e.preventDefault();
                call.start(this.type, this.model.get('email'));
            }
        },
        {
            id: 'phone',
            index: 200,
            initialize: function () {},
            fetch: function () {
                if (this.type !== 'phone') return;
                lookup.findByNumber(this.model.get('number'))
                    .done(this.updateMissingData.bind(this));
            }
        }
    );

    // make views accessible
    callHistory.view = new CallHistoryView({ collection: callHistory }).render();
    callHistory.lookup = lookup;
    callHistory.settings = settings;
    window.callHistory = callHistory;
    // make prototype accessible
    callHistory.CallHistoryItem = CallHistoryItem;

    return callHistory;
});
