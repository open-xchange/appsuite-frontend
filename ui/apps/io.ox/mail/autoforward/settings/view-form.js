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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/autoforward/settings/view-form', [
    'io.ox/mail/autoforward/settings/model',
    'io.ox/backbone/views',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'less!io.ox/mail/autoforward/settings/style'
], function (model, views, ext, mini) {

    'use strict';

    function createAutoForwardEdit(ref) {
        var point = views.point(ref + '/edit/view'),
            AutoforwardEditView = point.createView({
                tagName: 'div',
                className: 'edit-autoforward'
            });

        ext.point(ref + '/edit/view').extend({
            index: 50,
            id: 'headline',
            draw: function () {
                this.append($('<div>').append(
                    $('<h1>').text(model.fields.headline)
                ));
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 150,
            id: ref + '/edit/view/forwardmail',
            draw: function (baton) {
                this.append(
                    $('<div>').addClass('form-group').append(
                        $('<label for="forwardmail">').text(model.fields.forwardmail),
                        new mini.InputView({ name: 'forwardmail', model: baton.model, className: 'form-control', id: 'forwardmail' }).render().$el
                    )
                );
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 250,
            id: ref + '/edit/view/keep',
            draw: function (baton) {
                this.append(
                    $('<div>').addClass('form-group').append(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(model.fields.keep).prepend(
                                new mini.CheckboxView({ name: 'keep', model: baton.model }).render().$el
                            )
                        )
                    )
                );
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 350,
            id: ref + '/edit/view/active',
            draw: function (baton) {
                this.append(
                    $('<div>').addClass('form-group').append(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(model.fields.active).prepend(
                                new mini.CheckboxView({ name: 'active', model: baton.model }).render().$el
                            )
                        )
                    )
                );
            }
        });

        return AutoforwardEditView;
    }

    return {
        protectedMethods: {
            createAutoForwardEdit: createAutoForwardEdit
        }
    };

});
