/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/contacts/distrib/create-dist-view', [
    'io.ox/backbone/views',
    'io.ox/backbone/mini-views',
    'gettext!io.ox/contacts',
    'io.ox/core/extensions',
    'io.ox/participants/add',
    'io.ox/participants/views',
    'io.ox/participants/model'
], function (views, mini, gt, ext, AddParticipantView, pViews, pModel) {

    'use strict';

    var point = views.point('io.ox/contacts/distrib/create-dist-view'),
        ContactCreateDistView = point.createView({
            tagName: 'div',
            className: 'create-distributionlist-view'
        });

    point.basicExtend({
        id: 'title-controls',
        index: 100,
        className: 'row title-controls',
        draw: function (baton) {
            var buttonText = gt('Create list'),
                header = gt('Create distribution list'),
                self = this;

            // on edit
            if (baton.model.get('id')) {
                buttonText = gt('Save');
                header = gt('Edit distribution list');
            }
            baton.app.getWindow().setHeader(
                $('<div class="header">').append(
                    $('<h1 class="sr-only">').text(header),
                    // save/create button, important to use mousedown here, because this fires before the blur event.
                    // if the blur event fires first we would not be able to catch errors from baton.addParticipantView.resolve(); (invalid stuff in the input field etc)
                    $('<button type="button" class="btn btn-primary" data-action="save">').text(buttonText).on('mousedown', function () {
                        // wait if there was an error so the user has a chance to react (invalid data in the input field etc)
                        var error = baton.addParticipantView.resolve();
                        if (error) return;
                        // trigger blur so name changes are applied
                        self.find('input[name="display_name"]').trigger('blur');
                        baton.member.resolve().always(function () {
                            baton.model.save();
                        });
                    }),
                    // cancel button
                    $('<button type="button" class="btn btn-default" data-action="discard">').text(gt('Discard')).on('click', function () {
                        // use this sneaky channel
                        $(this).trigger('controller:quit');
                    })
                )
            );

        }
    });

    point.extend({
        id: 'displayname',
        index: 200,
        className: 'row',
        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.$el.append(
                $('<div>').addClass('form-group col-md-12').append(
                    // see Bug 31073 - [L3] Field "List name" is mentioned as Display Name in the error message appears on create distribution list page
                    //#. Name of distribution list
                    $('<label>').addClass('control-label').attr('for', guid).text(gt('Name')),
                    new mini.InputView({ name: 'display_name', model: this.baton.model, className: 'form-control control', id: guid }).render().$el
                )
            );
        }
    });

    // member container
    point.extend({
        id: 'participants_list',
        index: 300,
        className: 'row',
        render: function () {
            var self = this;
            // define collection
            this.baton.member = new pModel.Participants(this.baton.model.get('distribution_list'), { silent: false });

            this.listenTo(this.baton.member, 'add remove', function (ctx, col) {
                var all = col.map(function (m) {
                    // simple regex to check if the contact id string is a number (note: _.isNumber doesn't work for strings, parseInt has issues with mixed strings like 123abc)
                    if (/^-?\d+$/.test(m.getContactID())) {
                        return {
                            id: m.getContactID(),
                            folder_id: m.get('folder_id'),
                            display_name: m.getDisplayName(),
                            mail: m.getTarget(),
                            mail_field: m.getFieldNumber()
                        };
                    }
                    return {
                        display_name: m.getDisplayName(),
                        mail: m.getTarget(),
                        mail_field: 0
                    };
                });
                self.baton.model.set('distribution_list', all);
            });

            this.$el.append(new pViews.UserContainer({
                collection: this.baton.member,
                baton: this.baton,
                isMail: true,
                strict: true,
                empty: gt('This list has no members yet')
            }).render().$el);
        }
    });

    // add member view
    point.extend({
        id: 'add-participant',
        index: 400,
        className: 'row',
        render: function () {
            var view = new AddParticipantView({
                apiOptions: {
                    contacts: true
                },
                placeholder: gt('Add contact') + ' \u2026',
                label: gt('Add contact'),
                collection: this.baton.member,
                scrollIntoView: true,
                isMail: true
            });
            this.$el.append(
                view.$el
            );
            view.render().$el.addClass('col-md-6');

            this.baton.addParticipantView = view;
        }
    });

    point.extend({
        id: 'notice',
        index: 400,
        className: 'row',
        render: function () {
            this.$el.append(
                $('<div class="col-md-6">').append(
                    $('<div class="help-block">').text(gt('To add contacts manually, just provide a valid email address (e.g john.doe@example.com or "John Doe" <jd@example.com>)'))
                )
            );
        }
    });

    point.extend({
        id: 'metrics',
        render: function () {
            var self = this;
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                self.baton.app.getWindow().nodes.footer.on('mousedown', '[data-action]', function (e) {
                    var node =  $(e.target);
                    metrics.trackEvent({
                        app: 'contacts',
                        target: 'edit/distribution-list/toolbar',
                        type: 'click',
                        action: node.attr('data-action') || node.attr('data-name'),
                        detail: node.attr('data-value')
                    });
                });
            });
        }
    });

    return ContactCreateDistView;

});
