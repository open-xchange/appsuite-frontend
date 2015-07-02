/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/contacts/distrib/create-dist-view', [
    'io.ox/backbone/views',
    'io.ox/backbone/mini-views',
    'gettext!io.ox/contacts',
    'io.ox/core/extensions',
    'io.ox/participants/add',
    'io.ox/participants/views',
    'io.ox/participants/model'
], function (views, mini, gt, ext, AddParticipant, pViews, pModel) {

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
                header = gt('Create distribution list');

            // on edit
            if (baton.model.get('id')) {
                buttonText = gt('Save');
                header = gt('Edit distribution list');
            }
            baton.app.getWindow().setHeader(
                $('<div class="header">').append(
                    $('<h1 class="sr-only">').text(header),
                    // save/create button
                    $('<button type="button" class="btn btn-primary" data-action="save" tabindex="3">').text(buttonText).on('click', function () {
                        baton.model.save();
                    }),
                    // cancel button
                    $('<button type="button" class="btn btn-default" data-action="discard" tabindex="2">').text(gt('Discard')).on('click', function () {
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
            this.baton.member = new Backbone.Collection(this.baton.model.get('distribution_list'), {
                model: pModel.Participant
            });

            this.listenTo(this.baton.member, 'add remove reset', function (ctx, col) {
                var all = col.map(function (m) {
                    if (_.isNumber(m.getContactID())) {
                        return {
                            id: m.getContactID(),
                            folder_id: m.get('folder_id'),
                            display_name: m.getDisplayName(),
                            mail: m.getTarget(),
                            mail_field: m.getFieldNumber()
                        };
                    } else {
                        return {
                            display_name: m.getDisplayName(),
                            mail: m.getTarget(),
                            mail_field: 0
                        };
                    }
                });
                self.baton.model.set('distribution_list', all);
            });

            this.$el.append(new pViews.UserContainer({
                collection: this.baton.member,
                baton: this.baton
            }).render().$el);
        }
    });

    // add member view
    point.extend({
        id: 'add-participant',
        index: 400,
        render: function () {
            var view = new AddParticipant({
                apiOptions: {
                    contacts: true
                },
                placeholder: gt('Add contact') + ' \u2026',
                label: gt('Add contact'),
                collection: this.baton.member
            });
            this.$el.append(
                view.$el
            );
            view.render();
        }
    });

    point.extend({
        id: 'notice',
        index: 400,
        render: function () {
            this.$el.addClass('help-block').text(gt('To add contacts manually, just provide a valid email address (e.g john.doe@example.com or "John Doe" <jd@example.com>)'));
        }
    });

    return ContactCreateDistView;

});
