/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/oauth/backbone', [
    'less!io.ox/oauth/style'
], function () {
    'use strict';

    function getServiceAPI(serviceId) {
        var keychain = require('io.ox/oauth/keychain');
        var service = keychain.services.get(serviceId);
        return new keychain.api(service.toJSON());
    }

    var Account = {};

    Account.Model = Backbone.Model.extend({
        hasScope: function (scope) {
            return _(this.get('enabledScopes')).contains(scope);
        },
        enableScopes: function (scopes) {
            var wanted = this.get('wantedScopes') || this.get('enabledScopes') || [];
            scopes = _([].concat(scopes, wanted)).uniq();
            //if scopes is empty, add all availableScopes by default?
            this.set('wantedScopes', scopes);
        },
        disableScopes: function (scopes) {
            var wanted = this.get('wantedScopes') || this.get('enabledScopes') || [];
            scopes = _(wanted).difference([].concat(scopes));
            this.set('wantedScopes', scopes);
        },
        sync: function (method, model, options) {
            switch (method) {
                case 'create':
                    var popupWindow = window.open(ox.base + '/busy.html', '_blank', 'height=800, width=1200, resizable=yes, scrollbars=yes');
                    popupWindow.focus();
                    getServiceAPI(model.get('serviceId'))
                        .createInteractively(popupWindow, model.get('wantedScopes'))
                        .then(options.success, options.error);
                    break;
                case 'update':
                    getServiceAPI(model.get('serviceId'))
                        .reauthorize(model.toJSON())
                        .then(options.success, options.error);
                    break;
                case 'delete': getServiceAPI(model.get('serviceId')).remove(model.toJSON()); break;
                default:
            }
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

    var iconsForService = {
        'com.openexchange.oauth.google': 'fa-google',
        'com.openexchange.oauth.yahoo': 'fa-yahoo'
    };

    var ServiceItemView = Backbone.View.extend({
        tagName: 'li',
        className: 'service-item',
        render: function () {
            this.$el.attr({
                role: 'button',
                tabindex: '0'
            }).append(
                $('<i class="service-icon fa">')
                    .addClass(this.model.get('icon') || iconsForService[this.model.id] || 'fa-envelope'),
                this.model.get('displayName')
            ).data({
                cid: this.model.cid
            });
            return this;
        }
    });
    var ServicesListView = Backbone.View.extend({
        tagName: 'ul',
        className: 'form-group list-unstyled services-list-view',
        events: {
            'keypress li': 'select',
            'click li': 'select'
        },
        ItemView: ServiceItemView,
        render: function () {
            var ItemView = this.ItemView;
            this.$el.append(
                this.collection.map(function (service) {
                    var view = new ItemView({
                        model: service
                    });
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
            this.trigger('select:' + service.id, service);
        }
    });

    return {
        Account: Account,
        Views: {
            ServicesListView: ServicesListView,
            ServiceItemView: ServiceItemView
        }
    };
});
