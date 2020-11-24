/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
*
* © 2020 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

define('io.ox/core/sub/sharedFolders', [
    'io.ox/core/extensions',
    'gettext!io.ox/calendar',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views',
    'io.ox/core/http',
    'less!io.ox/core/sub/sharedFolders'
], function (ext, gt, api, ModalDialog, mini, http) {

    'use strict';

    var options = {},
        properties;

    function getItemName(descriptor) {
        var folderModel = new api.FolderModel(descriptor);
        if (!folderModel) return;

        var suffix = folderModel.is('drive') && folderModel.is('federated-sharing') && folderModel.getAccountDisplayName()
            ? ' (' + folderModel.getAccountDisplayName() + ')'
            : null;
        var titel = folderModel.get('display_title') || folderModel.get('title');
        return suffix ? titel + suffix : titel;
    }

    function open(opt) {
        options = opt;
        properties = 'used_for_sync';

        ext.point(options.point).extend({
            id: 'sections',
            index: 200,
            render: function () {
                var self = this,
                    sections = options.sections;

                _.each(this.dialogData, function (section, title) {
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

        var dialog = new ModalDialog({
            top: 60,
            width: 600,
            center: false,
            help: options.help,
            async: true,
            point: options.point,
            title: options.title,
            render: false,
            noSync: options.noSync,
            tooltip: options.tooltip
        });

        dialog
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'subscribe' })
            .build(function () {
                this.$body.addClass('shared-folders');
            })
            .busy(true)
            .open();
        return getData(dialog, opt).then(loadLandingPage);
    }

    function loadLandingPage(data) {
        data.dialog.dialogData = data.dialogData;
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

            http.resume().done(function () {
                // finish this once MW is done
                // leaving this in so translations can be done already
                var insertSpecialFederatedSharingWarningHere = false;
                if (insertSpecialFederatedSharingWarningHere) {
                    new ModalDialog({
                        top: 60,
                        width: 600,
                        center: false,
                        async: false
                    })
                    .addButton({ label: gt('OK'), action: 'ok' })
                    .build(function () {
                        // we may need to use this as a for each if multiple domains are affected

                        //#. confirmation when the last folder associated with a domain is unsubscribed
                        //#. %1$s domain like google.com etc, may also be a list of domains
                        this.$body.append(gt('You unsubscribed from all folders of "%1$s". They will be removed after 30 days', 'testdomain'));
                    })
                    .open();
                    return;
                }

                if (options.refreshFolders && _(data.hash).size() > 0) api.refresh();
            });
        });

        ext.point(options.point).invoke('render', data.dialog);
        data.dialog.idle();

        // focus first usable checkbox
        data.dialog.$body.find('input[type="checkbox"]:enabled').first().focus();

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

                if (self.opt.dialog.options.noSync) return;

                if (!val) {
                    var falseValue = _.copy(self.model.get(properties), true);
                    falseValue.value = 'false';
                    self.model.set(properties, falseValue);
                    self.model.trigger(properties);
                }
            });

            if (opt.dialog.options.noSync) return;
            this.model.on('change:' + properties, function () {
                if (!self.opt.dialog.hash[this.get('id')]) self.opt.dialog.hash[this.get('id')] = {};
                self.opt.dialog.hash[this.get('id')][properties] = this.get(properties);
            });

        },

        render: function () {

            var $checkbox;
            var preparedValueTrue =  _.copy(this.model.attributes[properties], true); //?
            preparedValueTrue.value = 'true';

            var preparedValueFalse =  _.copy(this.model.attributes[properties], true); //?
            preparedValueFalse.value = 'false';

            var Switch = mini.SwitchView.extend({
                update: function () {
                    var el = this.$el.closest('.list-group-item'),
                        input = el.find('input[name="' + properties + '"]');

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
                new Switch({
                    name: 'subscribed',
                    model: this.model,
                    label: ''

                }).render().$el.attr('title', this.opt.dialog.options.tooltip || gt('subscribe to calendar')),
                $('<div class="item-name">').append(
                    $('<div>').text(getItemName(this.model.attributes))
                ),
                this.opt.dialog.options.noSync ? '' : $checkbox = new mini.CustomCheckboxView({
                    name: properties,
                    model: this.model,
                    label: gt('Sync via DAV'),
                    customValues: {
                        'true': preparedValueTrue,
                        'false': preparedValueFalse
                    }
                }).render().$el.attr('title', gt('sync via DAV'))
            );

            if (this.opt.dialog.options.noSync) return this;

            if (!this.model.get('subscribed') || preparedValueFalse.protected === 'true') {
                $checkbox
                    .addClass('disabled')
                    .find('input[name="' + properties + '"]').prop('disabled', true).attr('data-state', 'manual');

            }
            return this;
        }
    });

    function returnListItems(section, dialog, sectionTitle) {

        var elements = [],
            ItemModel = Backbone.Model.extend({});

        _.each(section, function (item) {

            if (!item[properties]) return;

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


    function getData(dialog) {

        // use custom getData function if desired, can be used by modules that do not have a flat foldertree (infostore etc)
        return $.when(options.getData ? options.getData() : api.flat({ module: options.module, all: true })).then(function (pageData) {
            var dialogData = {};
            var sections = ['private', 'public', 'shared', 'hidden'];

            // cleanup
            _.each(sections, function (section) {

                function filter(secOb) { return _.has(secOb, properties); }

                var filteredData = _.filter(pageData[section], filter);
                if (!_.isEmpty(filteredData)) {
                    dialogData[section] = filteredData;
                }
            });

            return {
                dialog: dialog,
                hash: {},
                dialogData: dialogData
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

