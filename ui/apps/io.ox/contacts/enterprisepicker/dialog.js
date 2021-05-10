/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2021 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */


define('io.ox/contacts/enterprisepicker/dialog', [
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/common',
    'gettext!io.ox/contacts',
    'less!io.ox/contacts/enterprisepicker/style'
], function (ModalDialog, Mini, gt) {

    'use strict';

    var open = function (callback) {

        var model = new Backbone.Model({
            searchQuery: '',
            filterQuery: '',
            selectedList: null
        });
        return new ModalDialog({
            point: 'io.ox/contacts/enterprisepicker-dialog',
            help: 'ox.appsuite.user.sect.email.send.enterpriserpicker.html',
            title: gt('Global address list')
        })
        .extend({
            addClass: function () {
                this.$el.addClass('enterprise-picker');
            },
            header: function () {
                this.$('.modal-header').append(
                    $('<div class="top-bar">').append(
                        $('<label>').text(gt('Search')).append(
                            new Mini.InputView({ name: 'searchQuery', model: model }).render().$el
                            .attr('placeholder', gt('Search for name, department, position'))
                        ),
                        $('<label>').text(gt('Filter')).append(
                            new Mini.InputView({ name: 'filterQuery', model: model }).render().$el
                            .attr('placeholder', gt('Filter address lists'))
                        ),
                        $('<label>').text(gt('Address list')).append(
                            new Mini.SelectView({ name: 'selectedList', model: model }).render().$el
                            .attr('placeholder', gt('Choose address list'))
                        )
                    )
                );
            }
        })
        .on({
            'select': function () {
                var selection = [];
                if (_.isFunction(callback)) callback(selection);
            }
        })
        .addCancelButton()
        //#. Context: Add selected contacts; German "Auswählen", for example
        .addButton({ label: gt('Select'), action: 'select' })
        .open();
    };

    // use same names as default addressbook picker, to make it easier to switch between the two
    return {
        open: open
    };

});
