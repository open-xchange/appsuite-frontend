/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/notifications/badgeview', [
    'gettext!io.ox/core',
    'io.ox/core/yell'
], function (gt, yell) {

    'use strict';

    var BadgeModel = Backbone.Model.extend({
        defaults: {
            count: 0,//overall count, should be used as read only, add notificationViews to update
            registeredViews: {}//stores the notificationViews that should be included in the calculation of the count
        }
    });

    var BadgeView = Backbone.View.extend({
        tagName: 'a',
        className: 'notifications-icon',
        initialize: function () {
            this.model.set('a11y', '');
            this.model.on('change:count', _.bind(this.onChangeCount, this));
            this.nodes = {};
        },
        onChangeCount: function () {
            var count = this.model.get('count'),
                //#. %1$d number of notifications
                //#, c-format
                a11y = gt.format(gt.ngettext('You have %1$d notification.', 'You have %1$d notifications.', count), count),
                a11yState = this.$el.attr('aria-pressed') ? gt('The notification area is open') : gt('The notification area is closed');
            if (count === 0) {
                this.$el.addClass('no-notifications');
            } else {
                this.$el.removeClass('no-notifications');
            }
            //don't create a loop here
            this.model.set('a11y', a11y, { silent: true });
            this.nodes.badge.toggleClass('empty', count === 0);
            this.$el.attr('aria-label', a11y + ' ' + a11yState);
            this.nodes.number.text(_.noI18n(count >= 100 ? '99+' : count));
            yell('screenreader', a11y);
        },
        onToggle: function (open) {
            var a11yState = open ? gt('The notification area is open') : gt('The notification area is closed');

            this.$el.attr({
                'aria-pressed': open ? true : false,
                'aria-label': this.model.get('a11y') + ' ' + a11yState
            });
        },
        render: function () {

            this.$el.attr({
                href: '#',
                tabindex: '1',
                role: 'button',
                'aria-pressed': false
            })
            .append(
                this.nodes.badge = $('<span class="badge">').append(
                    this.nodes.number = $('<span class="number">')
                ),
                this.nodes.icon = $('<i class="fa fa-bell launcher-icon">')
            );

            this.onChangeCount();
            return this;
        },
        setNotifier: function (b) {
            this.nodes.badge.toggleClass('active', !!b);
        },
        registerView: function (view) {
            var views = this.model.get('registeredViews'),
                self = this;
            //prevent overwriting of existing views
            if (!views[view.model.get('id')]) {
                views[view.model.get('id')] = view;
                view.collection.on('add reset remove', _.bind(self.delayedUpdate, self));
            }
            return view;
        },
        delayedUpdate: function () {
            //delays updating by 100ms (prevents updating the badge multiple times in a row)
            var self = this;
            if (!this.updateTimer) {
                this.updateTimer = setTimeout(function () {
                    self.updateCount();
                    self.updateTimer = undefined;
                }, 100);
            }
        },
        updateCount: function () {
            var newCount = 0,
                oldCount = this.model.get('count');

            _(this.model.get('registeredViews')).each(function (view) {
                newCount = newCount + view.collection.size();
            });
            if (oldCount !== newCount) {
                this.model.set('count', newCount);
                //autoclose if count is set to 0, notificationsview handles this
                if (newCount === 0) {
                    this.trigger('auto-close');
                }
            }
        }
    });

    return {
        model: BadgeModel,
        view: BadgeView
    };
});
