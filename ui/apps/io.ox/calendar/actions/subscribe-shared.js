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
    'io.ox/core/http',
    'less!io.ox/calendar/actions/subscribe-shared'
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
            })
            .busy(true)
            .open();
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

            _.each(data.hash, function (obj, id) {
                api.update(id, obj);
            });

            http.resume();

        });
        ext.point('io.ox/core/folder/subscribe-shared-calendar').invoke('render', data.dialog);
        data.dialog.idle();
    }

    var ItemView = Backbone.View.extend({

        tagName: 'li',

        className: 'list-group-item',

        initialize: function (opt) {
            var self = this;
            this.opt = _.extend({}, opt);
            this.model.on('change:subscribed', function (model, val) {
                if (!self.opt.dialog.hash[this.get('id')]) self.opt.dialog.hash[this.get('id')] = {};
                self.opt.dialog.hash[this.get('id')].subscribed = this.get('subscribed');

                if (!val) {
                    var falseValue = _.copy(self.model.get('com.openexchange.calendar.extendedProperties'), true);
                    falseValue.usedForSync.value = 'false';
                    self.model.set('com.openexchange.calendar.extendedProperties', falseValue);
                    self.model.trigger('change:com.openexchange.calendar.extendedProperties');
                }
            });

            this.model.on('change:com.openexchange.calendar.extendedProperties', function () {
                if (!self.opt.dialog.hash[this.get('id')]) self.opt.dialog.hash[this.get('id')] = {};
                self.opt.dialog.hash[this.get('id')]['com.openexchange.calendar.extendedProperties'] = this.get('com.openexchange.calendar.extendedProperties');
            });

        },

        render: function () {

            var preparedValueTrue =  _.copy(this.model.attributes['com.openexchange.calendar.extendedProperties'], true);
            preparedValueTrue.usedForSync.value = 'true';

            var preparedValueFalse =  _.copy(this.model.attributes['com.openexchange.calendar.extendedProperties'], true);
            preparedValueFalse.usedForSync.value = 'false';

            var Switch = mini.SwitchView.extend({
                update: function () {
                    var el = this.$el.closest('.list-group-item'),
                        input = el.find('input[name="com.openexchange.calendar.extendedProperties"]');

                    if (!this.model.get('subscribed')) {
                        input.prop('disabled', true).attr('data-state', 'manual');
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
                            'false': preparedValueFalse
                        }
                    }).render().$el.attr('title', gt('sync via DAV'))
                )
            );

            if (!this.model.get('subscribed')) {
                this.$el.addClass('disabled');
                this.$el.find('input[name="com.openexchange.calendar.extendedProperties"]').prop('disabled', true).attr('data-state', 'manual');

            }
            return this;
        }
    });

    function returnListItems(section, dialog, sectionTitle) {
        var elements = [],
            ItemModel = Backbone.Model.extend({});

        _.each(section, function (item) {
            if (!item['com.openexchange.calendar.extendedProperties']) return;

            var newItem = new ItemView({
                model: new ItemModel(item),
                dialog: dialog
            }).render().$el;

            if (sectionTitle === 'private') {
                newItem.find('[name="subscribed"]').prop('disabled', true).attr('data-state', 'manual');
            }
            elements.push(newItem);
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
                    shared: gt('Shared calendars'),
                    private: gt('Private')
                };

            _.each(this.calendarData, function (section, title) {
                self.$body.append(
                    $('<div class="item-block">').append(
                        $('<h4>').text(sections[title]),
                        $('<ol class="list-group">').append(
                            returnListItems(section, self, title)
                        )
                    )
                );
            });
        }
    });

    function getData(dialog) {
        return $.when(api.flat({ module: 'calendar', all: true })).then(function (pageData) {
            var calendarData = {};

            // cleanup
            calendarData.public = pageData.public;
            calendarData.shared = pageData.shared;
            calendarData.private = pageData.private;

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
            dialog.$footer.find('button[data-action="subscribe"]').prop('disabled', true);

        });
    }

    return {
        open: open
    };

});
