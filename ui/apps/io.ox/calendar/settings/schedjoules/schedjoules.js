/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

//# sourceURL=io.ox/calendar/settings/schedjoules/schedjoules.js


/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/calendar/settings/schedjoules/schedjoules', [
    'io.ox/core/extensions',
    'gettext!io.ox/calendar/settings/schedjoules',
    'io.ox/calendar/settings/schedjoules/api',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views',
    'io.ox/core/api/user',
    'io.ox/core/folder/api',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/notifications',
    'io.ox/core/http',
    'less!io.ox/calendar/settings/schedjoules/style'
], function (ext, gt, api, ModalDialog, mini, userAPI, folderAPI, BreadcrumbView, notifications, http) {

    'use strict';

    function open() {
        var dialog = new ModalDialog({
            top: 60,
            width: 600,
            center: false,
            maximize: true,
            help: 'ox.appsuite.user.sect.calendar.folder.subscribe.html',
            async: true,
            point: 'io.ox/core/folder/add-schedjoules-calendar',
            title: gt('Add calendar'),
            render: false
        });

        dialog
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'subscribe' })
            .build(function () {
                this.$body.addClass('schedjoules');
            });

        dialog.open();
        dialog.busy(true);
        return getData(dialog).then(loadLandingPage);
    }

    function loadLandingPage(data) {
        api.get({ language: data.user.get('locale').slice(0, 2).toLowerCase(), country: data.user.get('locale').slice(3, 5).toLowerCase() }).then(function (pageData) {

            var RequestModel = Backbone.Model.extend({}),
                requestModel = new RequestModel({});
            requestModel.on('change:language', function () {
                data.dialog.busy(true);
                $.when(api.get({ id: _.last(data.dialog.data.pageHistory).item_id, language: requestModel.get('language'), country: requestModel.get('country') }), api.getCountries(requestModel.get('language'))).then(function (response, countries) {
                    data.data = response[0];
                    data.countries = countries;
                    ext.point('io.ox/core/folder/add-schedjoules-calendar').invoke('render', data.dialog);
                    data.dialog.idle();
                });
            });

            requestModel.on('change:country', function () {
                // reset history
                data.dialog.data.pageHistory = [];
                data.dialog.busy(true);
                api.get({ language: requestModel.get('language'), country: requestModel.get('country') }).done(function (response) {
                    data.data = response;
                    data.dialog.data.pageHistory.push(response);
                    ext.point('io.ox/core/folder/add-schedjoules-calendar').invoke('render', data.dialog);
                    data.dialog.idle();
                });
            });

            requestModel.set({ language: data.user.get('locale').slice(0, 2).toLowerCase(), country: data.user.get('locale').slice(3, 5).toLowerCase() }, { silent: true });

            data.dialog.data = data;
            data.dialog.requestModel = requestModel;
            data.dialog.handleClick = function (id) {
                data.dialog.busy(true);

                api.get({
                    id: id,
                    language: data.dialog.requestModel.get('language'),
                    country: data.dialog.requestModel.get('country')
                }).done(function (response) {
                    var historyIndex = _.findIndex(data.dialog.data.pageHistory, { item_id: response.item_id });
                    data.dialog.data.data = response;
                    data.dialog.idle();

                    data.dialog.data.pageHistory.splice(historyIndex + 1);

                    ext.point('io.ox/core/folder/add-schedjoules-calendar').invoke('render', data.dialog);
                });
            };

            pageData.name = gt('Start');
            data.data = pageData;
            data.pageHistory = [pageData];
            openSchedjoulesDialog(data);
        });

    }

    function openSchedjoulesDialog(data) {

        data.dialog.on('subscribe', function () {
            var subscriptions = _.values(this.data.subscriptionsModel.attributes),
                currentSubscriptions = _.copy(this.data.currentSubscriptions);
            data.dialog.close();
            notifications.yell('success', gt('The integration of the subscribed calendars might take a while.'));
            http.pause();
            // subscribe
            _.each(subscriptions, function (sub) {
                if (!currentSubscriptions[sub.itemId] || (currentSubscriptions[sub.itemId] && currentSubscriptions[sub.itemId].locale !== sub.locale)) {
                    api.subscribeCalendar(sub);
                } else {
                    delete currentSubscriptions[sub.itemId];
                }

            });
            // unsubscribe
            _.each(currentSubscriptions, function (sub) {
                folderAPI.remove([sub.id]);
            });

            http.resume();

        });

        ext.point('io.ox/core/folder/add-schedjoules-calendar').invoke('render', data.dialog);
        data.dialog.idle();
    }

    var ItemView = Backbone.View.extend({

        tagName: 'li',

        className: 'list-group-item',

        initialize: function (opt) {
            this.opt = _.extend({}, opt);
        },

        events: {
            'click': 'onBrowse',
            'keypress .chevron': 'onBrowse'
        },

        render: function () {

            var CustomSwitch = mini.SwitchView.extend({
                    onChange: function () {
                        if (this.getValue() === 'false') {
                            this.model.unset(this.name);
                        } else {
                            this.model.set(this.name, this.getValue());
                        }
                    }
                }),
                cssClass = this.model.attributes.item_class === 'page' ? 'page' : '',
                country = this.model.attributes.item.country ? ' (' + this.model.attributes.item.country + ')' : '';

            this.$el.addClass(cssClass);

            this.$el.append(
                $('<div class="item">').append(
                    $('<div class="item-name">').append(
                        this.model.attributes.item.icon !== undefined ? $('<div class="schedjoules-icon">').css('background-image', 'url(' + this.model.attributes.item.icon + ')') : [],
                        $('<div>').text(this.model.attributes.item.name)
                    ),
                    this.model.attributes.item_class === 'page' ? $('<div class="chevron" tabindex="0">').append($('<i class="fa fa-chevron-right" aria-hidden="true">')) : new CustomSwitch({
                        name: this.model.attributes.item.item_id,
                        model: this.opt.dialogView.data.subscriptionsModel,
                        label: '',
                        size: 'small',
                        customValues: {
                            'true': {
                                itemId: this.model.attributes.item.item_id,
                                name: this.opt.dialogView.data.subscriptionsModel.get(this.model.attributes.item.item_id) ? this.opt.dialogView.data.subscriptionsModel.get(this.model.attributes.item.item_id).name : this.model.attributes.item.name + country,
                                locale: this.opt.dialogView.data.dialog.requestModel.get('language')
                            },
                            'false': 'false'
                        }
                    })
                        .render().$el.attr('title', gt('subscribe to calendar'))
                )
            );
            if (this.opt.dialogView.data.subscriptionsModel.get(this.model.attributes.item.item_id)) {
                if (this.opt.dialogView.data.subscriptionsModel.get(this.model.attributes.item.item_id).locale !== this.opt.dialogView.data.dialog.requestModel.get('language')) {
                    $(this.$el.find('input[type="checkbox"]')).prop('checked', true).attr({ 'disabled': true, 'data-state': 'manual' });
                }
            }

            return this;
        },

        onBrowse: function (e) {
            if ((e.type === 'click' || e.which === 13) && $(e.currentTarget).closest('li').hasClass('page')) {
                this.opt.dialogView.busy(true);
                var self = this;
                api.get({
                    id: this.model.attributes.item.item_id,
                    language: this.opt.dialogView.requestModel.get('language'),
                    country: this.opt.dialogView.requestModel.get('country')
                }).done(function (data) {
                    self.opt.dialogView.data.data = data;
                    self.opt.dialogView.idle();
                    self.opt.dialogView.data.pageHistory.push(data);
                    ext.point('io.ox/core/folder/add-schedjoules-calendar').invoke('render', self.opt.dialogView);
                    self.opt.dialogView.$body.scrollTop(0);
                });
            }

        }

    });

    function returnListItems(sections, dialogView) {
        var elements = [];
        var ItemModel = Backbone.Model.extend({});
        _.each(sections.items, function (item) {
            elements.push(new ItemView({
                model: new ItemModel(item),
                dialogView: dialogView
            }).render().$el);
        });

        return elements;
    }

    ext.point('io.ox/core/folder/add-schedjoules-calendar').extend({
        id: 'breadcrumb',
        index: 150,
        render: function () {
            var self = this;
            var ModifiedBreadcrumbView = BreadcrumbView.extend({
                initialize: function (options) {
                    this.path = options.path;
                    this.handler = options.handler;

                },
                render: function () {
                    this.$el.text('\xa0');
                    this.renderPath.bind(this);
                    this.renderPath(this.path);
                    return this;
                },
                renderLink: function (data, index, all) {
                    var length = all.length,
                        isLast = index === length - 1,
                        node;

                    // add plain text tail or clickable link
                    if (isLast && !this.notail) node = $('<span class="breadcrumb-tail">');
                    else node = $('<a href="#" role="button" class="breadcrumb-link">').attr('href', '#');

                    node.attr({ 'data-id': data.item_id, 'data-module': data.module }).text(
                        isLast ? data.name : _.ellipsis(data.name, { max: 20 })
                    );

                    if (!isLast) node = node.add($('<i class="fa breadcrumb-divider" aria-hidden="true">'));
                    node.add($('<i class="fa breadcrumb-divider" aria-hidden="true">'));

                    return node;
                },
                onClickLink: function (e) {
                    e.preventDefault();
                    var id = $(e.target).attr('data-id'),
                        module = $(e.target).attr('data-module');
                    if (this.handler) this.handler(id, module);
                }
            });

            var backButton = $('<button type="button" class="btn btn-default">').append(
                $('<i class="fa fa-chevron-left" aria-hidden="true">')
            );

            backButton.on('click', function (e) {
                e.preventDefault();
                self.busy(true);
                self.data.pageHistory.pop();
                var pageID = _.last(self.data.pageHistory).item_id;
                api.get({ id: pageID, language: self.requestModel.get('language'), country: self.requestModel.get('country') }).done(function (data) {
                    self.data.data = data;
                    self.idle();

                    ext.point('io.ox/core/folder/add-schedjoules-calendar').invoke('render', self);
                });
            });

            if (this.data.pageHistory.length >= 2) {
                this.$body.append(
                    $('<div class="row">').append(
                        $('<div class="form-group col-xs-12 col-md-1">').append(
                            backButton
                        ),
                        $('<div class="form-group col-xs-12 col-md-11">').append(
                            new ModifiedBreadcrumbView({ path: this.data.pageHistory, handler: this.handleClick }).render().$el
                        )
                    )
                );
            }

        }
    });

    ext.point('io.ox/core/folder/add-schedjoules-calendar').extend({
        id: 'settings',
        index: 100,
        render: function () {
            this.$body.empty();
            var switchEnabled = this.data.data.item_id === this.data.pageHistory[0].item_id || _.isEmpty(this.data.pageHistory);
            this.$body.append(
                $('<div class="row">').append(
                    $('<div class="form-group col-xs-12 col-md-6">').append(
                        $('<label for="language">').text(gt('Language')),
                        new mini.SelectView({
                            list: _.map(this.data.languages[0], function (obj) { return { label: obj.name, value: obj.iso_639_1 }; }),
                            name: 'language',
                            model: this.requestModel,
                            id: 'language',
                            className: 'form-control'
                        }).render().$el
                    ),
                    $('<div class="form-group col-xs-12 col-md-6">').append(
                        $('<label for="country">').text(gt('Country')),
                        new mini.SelectView({
                            list: _.map(this.data.countries[0], function (obj) { return { label: obj.name_translation, value: obj.iso_3166 }; }),
                            name: 'country',
                            model: this.requestModel,
                            id: 'country',
                            className: 'form-control'
                        }).render().$el.attr('disabled', !switchEnabled)
                    )
                )
            );
        }
    });

    ext.point('io.ox/core/folder/add-schedjoules-calendar').extend({
        id: 'sections',
        index: 200,
        render: function () {
            var self = this;
            _.each(this.data.data.page_sections, function (section) {
                self.$body.append(
                    $('<div class="item-block">').append(
                        $('<h2>').text(section.name),
                        $('<ol class="list-group">').append(
                            returnListItems(section, self)
                        )
                    )
                );
            });
        }
    });

    ext.point('io.ox/core/folder/add-schedjoules-calendar').extend({
        id: 'alarms',
        index: 300,
        render: function () {
            this.$body.prepend(
                $('<div class="alert alert-info">').text(gt('Your default reminders will be applied to these calendars.'))
            );
        }
    });

    function getData(dialog) {
        return $.when(api.getLanguages(), api.getCountries(), userAPI.getCurrentUser()).then(function (languages, countries, user) {
            var accountFolders = _.filter(folderAPI.pool.models, function (folder) { return folder.get('com.openexchange.calendar.provider') === 'schedjoules'; }),
                SubscriptionsModel = Backbone.Model.extend({});

            function collect(accountFolders, withId) {
                var collection = {};
                _.each(accountFolders, function (model) {
                    collection[model.get('com.openexchange.calendar.config').itemId] = {
                        itemId: model.get('com.openexchange.calendar.config').itemId,
                        name: model.get('folder_name'),
                        locale: model.get('com.openexchange.calendar.config').locale
                    };

                    if (withId) {
                        collection[model.get('com.openexchange.calendar.config').itemId].id = model.get('id');
                    }
                });
                return collection;
            }
            var subscriptionsModel = new SubscriptionsModel(collect(accountFolders));

            return {
                dialog: dialog,
                languages: languages,
                countries: countries,
                user: user,
                accountFolders: accountFolders,
                subscriptionsModel: subscriptionsModel,
                currentSubscriptions: collect(accountFolders, true)
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
