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

        el: '<div class="alert alert-info alert-dismissable" role="alert">',

        events: {
            'click .close': 'onClose',
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

        onClose: function () {
            this.$el.hide().next().css('top', '');
        },

        onChange: function (model) {
            var active = model.isActive();
            this.$el.toggle(active).next().css('top', active ? '40px' : '');
        }
    });

    ext.point('io.ox/mail/vacation-notice/indicator').extend(
        {
            id: 'close',
            index: 100,
            render: function () {
                this.$el.append(
                    $('<button type="button" class="close"><span aria-hidden="true">&times;</span></button>')
                        .attr('aria-label', gt('Close'))
                );
            }
        },
        {
            id: 'link',
            index: 200,
            render: function () {
                this.$el.append(
                    $('<a href="#" data-action="edit-vacation-notice">')
                        .text(gt('Your vacation notice is active'))
                );
            }
        }
    );

    return VacationNoticeIndicator;
});
