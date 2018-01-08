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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/mailfilter/vacationnotice/indicator', [
    'io.ox/mail/mailfilter/vacationnotice/model',
    'io.ox/backbone/views/extensible',
    'io.ox/core/extensions',
    'gettext!io.ox/mail'
], function (Model, ExtensibleView, ext, gt) {

    'use strict';

    var VacationNoticeIndicator = ExtensibleView.extend({

        point: 'io.ox/mail/vacation-notice/indicator',

        el: '<div class="alert alert-info alert-dismissable ellipsis indicator" role="alert">',

        events: {
            'click .btn-close': 'onClose',
            'click a[data-action="edit-vacation-notice"]': 'onEdit'
        },

        onEdit: function (e) {
            e.preventDefault();
            require(['io.ox/mail/mailfilter/vacationnotice/view'], function (view) {
                view.open();
            });
        },

        attachTo: function ($el) {
            this.model = new Model();
            this.model.fetch().done(function () {
                $el.before(this.render().$el.hide());
                this.listenTo(ox, 'mail:change:vacation-notice', this.onChange);
                this.onChange(this.model);
            }.bind(this));
        },

        onClose: function (e) {
            var $listview = $(e.delegateTarget).nextAll('.list-view-control');
            this.$el.hide();
            $listview.css('top', ($listview.position().top - 40));
        },

        activeElements: [],

        setActiveState: function (model) {
            var key = _.indexOf(this.activeElements, model.id);
            if (model.isActive() && key === -1) {
                this.activeElements.push(model.id);
            } else if (key !== -1) {
                this.activeElements.splice(key, 1);
            }
        },

        onChange: function (model) {

            this.setActiveState(model);

            var active = _.indexOf(this.activeElements, model.id) !== -1,
                $listview = this.$el.nextAll('.list-view-control');

            this.$el.toggle(active);

            if (this.activeElements.length === 1) {
                $listview.css('top', 40);

            } else if (this.activeElements.length === 2) {
                $listview.css('top', 80);

            } else {
                $listview.css('top', 0);
            }
        }
    });

    ext.point('io.ox/mail/vacation-notice/indicator').extend(
        {
            id: 'link',
            index: 100,
            render: function () {
                var title = gt('Your vacation notice is active');
                this.$el.append(
                    $('<i class="fa fa-warning" aria-hidden="true">'),
                    $('<span class="sr-only">').text(gt('Warning')),
                    $('<a href="#" data-action="edit-vacation-notice">').text(title)
                );
            }
        },
        {
            id: 'close',
            index: 200,
            render: function () {
                this.$el.append(
                    $('<button type="button" class="btn btn-link btn-close">').attr('title', gt('Close')).append(
                        $('<i class="fa fa-times" aria-hidden="true">')
                    )
                );
            }
        }
    );

    return VacationNoticeIndicator;
});
