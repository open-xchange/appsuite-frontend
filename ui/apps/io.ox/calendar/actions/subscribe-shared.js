/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
*
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

define('io.ox/calendar/actions/subscribe-shared', [
    'io.ox/core/extensions',
    'gettext!io.ox/calendar',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views',
    'io.ox/core/http'
], function (ext, gt, api, ModalDialog, mini, http) {

    'use strict';

    function open() {
        var dialog = new ModalDialog({
            top: 60,
            width: 600,
            center: false,
            maximize: true,
            help: 'ox.appsuite.user.sect.calendar.folder.usedforsync.html',
            async: true,
            point: 'io.ox/core/folder/subscribe-shared-calendar',
            title: gt('Subscribe shared calendars'),
            render: false
        });

        dialog
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'subscribe' })
            .build(function () {
                this.$body.addClass('shared-calendars');
            });

        dialog.open();
        dialog.busy(true);
        return getData(dialog).then(loadLandingPage);
    }

    function loadLandingPage(data) {
        data.dialog.calendarData = data.calendarData;
        data.dialog.hash = data.hash;
        openDialog(data);
    }

    function openDialog(data) {

        data.dialog.on('subscribe', function () {

            data.dialog.close();

            http.pause();

            var allClaendars = data.calendarData.public.concat(data.calendarData.shared);
            _.each(data.hash, function (obj, id) {

                var folder = allClaendars[_.findIndex(allClaendars, { id: id })],
                    ext = 'com.openexchange.calendar.extendedProperties';

                if (obj[ext]) {
                    if (obj[ext] === 'false') {
                        folder[ext].usedForSync.value = obj[ext];
                    } else {
                        folder[ext].usedForSync.value = obj[ext].usedForSync.value;
                    }

                    obj[ext] = folder[ext];
                }
                api.update(id, obj);
            });

            http.resume();

        });

        data.dialog.idle();
        ext.point('io.ox/core/folder/subscribe-shared-calendar').invoke('render', data.dialog);
    }

    var ItemView = Backbone.View.extend({

        tagName: 'li',

        className: 'list-group-item',

        initialize: function (opt) {
            var self = this;
            this.opt = _.extend({}, opt);
            this.model.on('change:subscribed', function () {
                if (!self.opt.dialog.hash[this.get('id')]) self.opt.dialog.hash[this.get('id')] = {};
                self.opt.dialog.hash[this.get('id')].subscribed = this.get('subscribed');
            });

            this.model.on('change:com.openexchange.calendar.extendedProperties', function () {
                if (!self.opt.dialog.hash[this.get('id')]) self.opt.dialog.hash[this.get('id')] = {};
                self.opt.dialog.hash[this.get('id')]['com.openexchange.calendar.extendedProperties'] = this.get('com.openexchange.calendar.extendedProperties');
            });

        },

        render: function () {

            var preparedValueTrue =  _.copy(this.model.attributes['com.openexchange.calendar.extendedProperties'], true);

            preparedValueTrue.usedForSync.value = 'true';

            var Switch = mini.SwitchView.extend({
                update: function () {
                    var el = this.$el.closest('.list-group-item'),
                        input = el.find('input[name="com.openexchange.calendar.extendedProperties"]');

                    if (!this.model.get('subscribed')) {
                        input.prop('disabled', true);
                        el.addClass('disabled');
                    } else {
                        input.prop('disabled', false);
                        el.removeClass('disabled');
                    }

                    this.$input.prop('checked', this.setValue());
                }
            });

            this.$el.append(
                $('<div class="item">').append(
                    new Switch({
                        name: 'subscribed',
                        model: this.model,
                        label: ''

                    }).render().$el.attr('title', gt('subscribe to calendar')),
                    $('<div class="item-name">').append(
                        $('<div>').text(this.model.attributes.display_title || this.model.attributes.title)
                    ),
                    new mini.CustomCheckboxView({
                        name: 'com.openexchange.calendar.extendedProperties',
                        model: this.model,
                        label: gt('Sync via DAV'),
                        customValues: {
                            'true': preparedValueTrue,
                            'false': 'false'
                        }
                    }).render().$el.attr('title', gt('sync via DAV'))
                )
            );

            if (!this.model.get('subscribed')) {
                this.$el.addClass('disabled');
                this.$el.find('input[name="com.openexchange.calendar.extendedProperties"]').prop('disabled', true);

            }
            return this;
        }
    });

    function returnListItems(section, dialog) {
        var elements = [],
            ItemModel = Backbone.Model.extend({});

        _.each(section, function (item) {
            if (!item['com.openexchange.calendar.extendedProperties']) return;
            elements.push(new ItemView({
                model: new ItemModel(item),
                dialog: dialog
            }).render().$el);
        });

        return elements;
    }

    ext.point('io.ox/core/folder/subscribe-shared-calendar').extend({
        id: 'sections',
        index: 200,
        render: function () {
            var self = this,
                sections = {
                    public: gt('Public calendars'),
                    shared: gt('Shared calendars')
                };

            _.each(this.calendarData, function (section, title) {
                self.$body.append(
                    $('<div class="item-block">').append(
                        $('<h4>').text(sections[title]),
                        $('<ol class="list-group">').append(
                            returnListItems(section, self)
                        )
                    )
                );
            });
        }
    });

    function getData(dialog) {
        return $.when(api.flat({ module: 'calendar' })).then(function (pageData) {
            var calendarData = {};

            // cleanup
            calendarData.public = pageData.public;
            calendarData.shared = pageData.shared;

            return {
                dialog: dialog,
                hash: {},
                calendarData: calendarData
            };
        }, function (data) {
            dialog.idle();
            dialog.$body.append(
                $('<div class="alert alert-warning">').text(data.error_desc)
            );
            dialog.$footer.find('button[data-action="subscribe"]').attr('disabled', 'disabled');

        });
    }

    return {
        open: open
    };

});
