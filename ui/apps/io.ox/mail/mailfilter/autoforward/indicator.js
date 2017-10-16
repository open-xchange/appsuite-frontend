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
 * @author Alexander Quast <Alexander Quast@open-xchange.com>
 */

define('io.ox/mail/mailfilter/autoforward/indicator', [
    'io.ox/mail/mailfilter/autoforward/model',
    'io.ox/mail/mailfilter/vacationnotice/indicator',
    'io.ox/core/extensions',
    'gettext!io.ox/mail'
], function (Model, VacationNoticeView, ext, gt) {

    'use strict';

    // just overwrite some stuff from the vacationnotice view
    var AutoforwardView = VacationNoticeView.extend({

        point: 'io.ox/mail/autoforward/indicator',

        events: {
            'click .close': 'onClose',
            'click a[data-action="edit-autoforward-notice"]': 'onEdit'
        },

        onEdit: function (e) {
            e.preventDefault();
            require(['io.ox/mail/mailfilter/autoforward/view'], function (view) {
                view.open();
            });
        },

        attachTo: function ($el) {
            this.model = new Model();
            this.model.fetch().done(function () {
                $el.before(this.render().$el.hide());
                this.listenTo(ox, 'mail:change:auto-forward', this.onChange);
                this.onChange(this.model);
            }.bind(this));
        }
    });

    ext.point('io.ox/mail/autoforward/indicator').extend(
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
                var title = gt('Auto forwarding is active');
                this.$el.append(
                    $('<i class="fa fa-warning">'),
                    $.txt(' '),
                    $('<a href="#" data-action="edit-autoforward-notice">')
                        .attr('title', title)
                        .text(title)
                );
            }
        }
    );
    return AutoforwardView;

});
