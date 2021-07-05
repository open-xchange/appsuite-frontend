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

define('io.ox/oauth/backbone', [
    'io.ox/core/http',
    'io.ox/core/yell',
    'gettext!io.ox/oauth',
    'less!io.ox/oauth/style'
], function (http, yell, gt) {
    'use strict';

    var generateId = function () {
        generateId.id = generateId.id + 1;
        return generateId.id;
    };

    generateId.id = 1;

    var Account = {};

    Account.Model = Backbone.Model.extend({
        hasScopes: function (scopes) {
            var self = this;
            scopes = [].concat(scopes);
            return _(scopes).reduce(function (memo, scope) {
                return memo || _(self.get('enabledScopes')).contains(scope);
            }, false);
        },
        enableScopes: function (scopes) {
            var wanted = this.get('wantedScopes') || this.get('enabledScopes') || [];
            scopes = _([].concat(scopes, wanted)).uniq();
            //if scopes is empty, add all availableScopes by default?
            this.set('wantedScopes', scopes);

            return this;
        },
        disableScopes: function (scopes) {
            var wanted = this.get('wantedScopes') || this.get('enabledScopes') || [];
            scopes = _(wanted).difference([].concat(scopes));
            this.set('wantedScopes', scopes);

            return this;
        },
        reauthorize: function (options) {
            options = _.extend({ force: true }, options);
            var account = this,
                needsReauth = options.force || (this.get('wantedScopes') || []).reduce(function (acc, scope) {
                    return acc || !account.hasScopes(scope);
                }, false);
            if (!needsReauth) return $.when();

            var callbackName = 'oauth' + generateId(),
                params = {
                    action: 'init',
                    action_hint: 'reauthorize',
                    serviceId: account.get('serviceId'),
                    displayName: account.get('displayName'),
                    cb: callbackName,
                    id: account.id
                };

            params.scopes = (_([].concat(this.get('enabledScopes'), this.get('wantedScopes'))).uniq()).join(' ');
            var popupWindow = window.open(ox.base + '/busy.html', '_blank', 'height=800, width=1200, resizable=yes, scrollbars=yes');
            popupWindow.focus();

            return http.GET({
                module: 'oauth/accounts',
                params: params
            })
            .then(function (interaction) {
                var def = $.Deferred();

                window['callback_' + callbackName] = def.resolve;
                popupWindow.location = interaction.authUrl;

                return def;
            }).then(function (res) {
                var def = $.Deferred();
                delete window['callback_' + callbackName];
                popupWindow.close();
                if (res.error) return def.reject(res);
                return def.resolve(res);
            }).then(function () {
                account.enableScopes(account.get('enabledScopes'));
                account.set('enabledScopes', account.get('wantedScopes'));
                account.unset('wantedScopes');
                return account;
            }, yell);
        },
        sync: function (method, model, options) {
            switch (method) {
                case 'create':
                    var popupWindow = model.get('popup') || window.open(ox.base + '/busy.html', '_blank', 'height=800, width=1200, resizable=yes, scrollbars=yes');
                    return require(['io.ox/core/tk/keys']).then(function () {

                        var callbackName = 'oauth' + generateId(),
                            params = {
                                action: 'init',
                                cb: callbackName,
                                display: 'popup',
                                displayName: model.get('displayName'),
                                redirect: true,
                                serviceId: model.get('serviceId'),
                                session: ox.session
                            },
                            def = $.Deferred();

                        if (model.get('wantedScopes').length > 0) params.scopes = model.get('wantedScopes').join(' ');

                        window['callback_' + callbackName] = def.resolve;

                        popupWindow.location = ox.apiRoot + '/oauth/accounts?' + $.param(params);

                        return def.done(function () {
                            delete window['callback_' + callbackName];
                        });
                    }).then(function (response) {
                        if (!response.data) {
                            // TODO handle a possible error object in response
                            return $.Deferred().reject(response.error);
                        }

                        var id = response.data.id;
                        //get fresh data from the server to be sure we have valid data (IE has some problems otherwise see Bug 37891)
                        return http.GET({
                            module: 'oauth/accounts',
                            params: {
                                action: 'get',
                                id: id
                            }
                        }).then(function (res) {
                            model.set(res);
                            return res;
                        });
                    }).then(function (res) {
                        return require(['io.ox/oauth/keychain']).then(function (oauthAPI) {
                            oauthAPI.accounts.add(model);
                            return res;
                        });
                    }).done(options.success).fail(options.error).always(function () {
                        // FIXME: should the caller close the popup?
                        popupWindow.close();
                    });
                case 'update':
                    return model.reauthorize({ force: false }).then(function () {
                        return http.PUT({
                            module: 'oauth/accounts',
                            params: {
                                action: 'update',
                                id: model.id
                            },
                            data: {
                                displayName: model.get('displayName')
                            }
                        });
                    }).then(function () {
                        return model.toJSON();
                    }).done(options.success).fail(options.error);
                case 'delete':
                    return http.PUT({
                        module: 'oauth/accounts',
                        params: {
                            action: 'delete',
                            id: model.id
                        }
                    }).done(options.success).fail(options.error);
                case 'read':
                    return http.GET({
                        module: 'oauth/accounts',
                        params: {
                            action: 'get',
                            id: model.id
                        }
                    }).then(function (res) {
                        model.set(res);
                        return res;
                    }).done(options.success).fail(options.error);
                default:
            }
        },
        fetchRelatedAccounts: function () {
            var self = this;
            return require([
                'io.ox/core/api/account',
                'io.ox/core/api/filestorage'
            ]).then(function (accountAPI, filestorageAPI) {
                return $.when(accountAPI.all(), filestorageAPI.getAllAccounts());
            }).then(function (accounts, storageAccounts) {
                return [].concat(
                    storageAccounts.toJSON().filter(function (account) {
                        return account.configuration
                            && String(account.configuration.account) === String(self.get('id'));
                    }).map(function addAccountType(model) {
                        model.accountType = model.accountType || 'fileStorage';

                        // handle possible error messages for fileStorage accounts
                        if (model.error) model.status = { message: model.error };

                        return model;
                    }),
                    accounts.filter(function isRelated(account) {
                        return account.mail_oauth === self.get('id');
                    })
                ).map(function (account) {
                    // add serviceId to related account
                    account.serviceId = self.get('serviceId');
                    return account;
                });
            });
        }
    });

    Account.Collection = Backbone.Collection.extend({
        model: Account.Model,
        forService: function (serviceId, limits) {
            limits = _.extend({}, limits);
            return this.filter(function (account) {
                return account.get('serviceId') === serviceId &&
                    (!limits.scope || _(account.get('enabledScopes')).contains(limits.scope));
            });
        }
    });

    var ServiceItemView = Backbone.View.extend({
        tagName: 'li',
        className: 'service-item',
        render: function () {
            var shortId = this.model.get('icon') || this.model.id.match(/\.?(\w*)$/)[1] || 'fallback',
                mod = this.model.get('module') || '';
            this.$el.append(
                $('<button type="button" class="btn btn-default">').append(
                    $('<i class="service-icon fa">').addClass('logo-' + shortId + ' ' + mod),
                    $('<div class="service-label">').text(this.model.get('displayName'))
                ).data({
                    cid: this.model.cid
                })
            );
            return this;
        }
    });

    var MailServiceItemView = ServiceItemView.extend({
        render: function () {
            var shortId = this.model.get('icon') || this.model.id.match(/\.?(\w*)$/)[1] || 'fallback';
            var label = (this.model.get('displayName') === 'Google') ? gt('Sign in with Google. This will add your Gmail account.') : this.model.get('displayName');
            this.$el.append(
                $('<button type="button" class="btn btn-default">').data({ cid: this.model.cid }).append(
                    $('<i class="service-icon fa">').addClass('logo-' + shortId)
                ),
                $('<div class="service-label">').text(label)
            );
            return this;
        }
    });

    var ServicesListView = Backbone.View.extend({
        tagName: 'ul',
        className: 'list-unstyled services-list-view',
        events: {
            'keypress button': 'select',
            'click button': 'select'
        },
        ItemView: ServiceItemView,
        render: function () {
            var ItemView = this.ItemView;
            var isMailService = this.model && this.model.mailService || false;
            this.$el.append(
                this.collection.map(function (service) {
                    var view;
                    if (isMailService) {
                        view = new MailServiceItemView({
                            model: service
                        });
                    } else {
                        view = new ItemView({
                            model: service
                        });
                    }
                    return view.render().$el;
                })
            );
            return this;
        },
        select: function (ev) {
            //ignore keypress events other than space and return keys
            if (ev.type === 'keypress' && ev.which !== 13 && ev.which !== 32) return;

            var service = this.collection.get($(ev.currentTarget).data('cid'));
            this.trigger('select', service);
            this.trigger('select:' + service.get('type'), service);
        }
    });

    return {
        Account: Account,
        Views: {
            ServicesListView: ServicesListView,
            ServiceItemView: ServiceItemView,
            MailServiceItemView: MailServiceItemView
        }
    };
});
