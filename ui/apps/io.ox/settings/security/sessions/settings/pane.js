/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/settings/security/sessions/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'gettext!io.ox/core',
    'io.ox/core/http',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/backbone/disposable',
    'io.ox/backbone/mini-views/listutils',
    'settings!io.ox/core',
    'less!io.ox/settings/security/sessions/settings/style'
], function (ext, ExtensibleView, gt, http, SettingsListView, DisposableView, listUtils, settings) {

    'use strict';

    function buildConfirmationDialog(text, confirmText) {
        var def = new $.Deferred();
        confirmText = confirmText || gt('Ok');
        require(['io.ox/backbone/views/modal'], function (ModalDialog) {
            new ModalDialog({ title: text, async: true })
            .build(function () { this.$body.remove(); })
            .addCancelButton()
            .addButton({ label: confirmText, action: 'ok' })
            .on('ok', def.resolve)
            .open();
        });
        return def.promise();
    }

    var SessionModel = Backbone.Model.extend({

        idAttribute: 'sessionId',

        initialize: function () {
            ext.point('io.ox/settings/sessions/deviceType').invoke('customize', this);
            ext.point('io.ox/settings/sessions/operatingSystem').invoke('customize', this);
            ext.point('io.ox/settings/sessions/application').invoke('customize', this);
        },

        getDeviceInfo: function (name) {
            var device = this.get('device') || {};
            return device[name] || {};
        }

    });

    ext.point('io.ox/settings/sessions/deviceType').extend({
        id: 'desktop-mobile',
        index: 100,
        customize: function () {
            var os = this.getDeviceInfo('os').name || '';
            if (os === 'ios' || os === 'android') this.set('deviceType', 'phone');
            else this.set('deviceType', 'desktop');
        }
    });

    ext.point('io.ox/settings/sessions/operatingSystem').extend({
        id: 'os',
        index: 100,
        customize: function () {
            var os = this.getDeviceInfo('os').name || '';
            if (os === 'os x') {
                this.set('operatingSystem',
                    //#. Context: Session Management. Active session on platform/os.
                    gt('Mac')
                );
                this.set('os', 'apple');
            } else if (os === 'windows') {
                this.set('operatingSystem',
                    //#. Context: Session Management. Active session on platform/os.
                    gt('Windows')
                );
                this.set('os', 'windows');
            } else if (os === 'android') {
                this.set('operatingSystem',
                    //#. Context: Session Management. Active session on platform/os.
                    gt('Android')
                );
                this.set('os', 'android');
            } else if (os === 'ios') {
                this.set('operatingSystem',
                    //#. Context: Session Management. Active session on platform/os.
                    gt('iOS')
                );
                this.set('os', 'apple');
            }
        }
    });

    ext.point('io.ox/settings/sessions/application').extend({
        id: 'browsers',
        index: 100,
        customize: function () {
            if (this.getDeviceInfo('client').type !== 'browser') return;
            var clientName = (this.getDeviceInfo('client').name || '').toLowerCase();
            if (clientName.indexOf('firefox') >= 0) this.set('application', gt('Firefox'));
            else if (clientName.indexOf('chrome') >= 0) this.set('application', gt('Chrome'));
            else if (clientName.indexOf('safari') >= 0) this.set('application', gt('Safari'));
            else if (clientName.indexOf('internet explorer') >= 0) this.set('application', gt('Internet Explorer'));
            else if (clientName.indexOf('edge') >= 0) this.set('application', gt('Edge'));
        }
    });

    ext.point('io.ox/settings/sessions/application').extend({
        id: 'apps',
        index: 200,
        customize: function () {
            if (this.getDeviceInfo('client').type === 'browser') return;
            switch (this.get('client')) {
                case 'open-xchange-mailapp':
                case 'open-xchange-mobile-api-facade':
                    this.set('application', settings.get('productname/mailapp') || 'OX Mail');
                    break;
                case 'OpenXchange.iosClient.OXDrive':
                case 'OpenXchange.Android.OXDrive':
                case 'OpenXchange.HTTPClient.OXDrive':
                case 'OXDrive':
                case 'OSX.OXDrive':
                    this.set('application', settings.get('productname/oxdrive') || 'OXDrive');
                    break;
                case 'USM-EAS':
                    this.set('application', gt('CalDav/CardDav'));
                    break;
                case 'USM-JSON':
                    this.set('application', settings.get('productname/oxtender') || 'OXtender');
                    break;
                default: // nothing
            }
        }
    });

    var SessionCollection = Backbone.Collection.extend({

        model: SessionModel,

        comparator: function (model) {
            // sort ascending
            // current session should always be topmost
            if (model.get('sessionId') === ox.session) return -10000000000000;
            return -model.get('lastActive');
        },

        initialize: function () {
            this.initial = this.fetch();
        },

        fetch: function () {
            var self = this;
            return http.GET({
                url: '/ajax/sessionmanagement?action=all'
            }).then(function success(data) {
                self.set(data);
            });
        }
    });

    var SessionItemView = DisposableView.extend({

        tagName: 'li',

        className: 'settings-list-item',

        events: {
            'click a[data-action="delete"]': 'onDelete'
        },

        render: function () {
            var isCurrent = this.model.get('sessionId') === ox.session,
                lastActive = this.model.has('lastActive') ? moment(this.model.get('lastActive')).fromNow() : '';
            this.$el.empty().append(
                $('<div>').append(
                    $('<div class="fa-stack client-icon">').addClass(this.model.get('deviceType')).addClass(this.model.get('os')).append(
                        $('<i class="fa fa-stack-1x device" aria-hidden="true">'),
                        $('<i class="fa fa-stack-1x os" aria-hidden="true">')
                    ),
                    $('<div class="primary">').append(
                        $('<span>').text(this.model.get('application')),
                        $('<span>').text('(' + (this.model.get('operatingSystem') || gt('Unknown device')) + ')')
                    ),
                    $('<div class="secondary">').append(
                        $('<span>').text(this.model.get('location')),
                        //#. text in the settings pane to indicate session that is currently active
                        isCurrent ? $('<span class="label label-success">').text(gt('Now active')) : $('<span>').text(lastActive)
                    )
                ),
                $('<div class="list-item-controls">').append(
                    !isCurrent ? $('<a href="#" class="action" data-action="delete">').text(gt('Sign out')) : ''
                )
            );
            return this;
        },
        onDelete: function (e) {
            var self = this,
                // assign collection here since the view might be removed later
                collection = this.collection;
            e.preventDefault();
            buildConfirmationDialog(gt('Do you really want to sign out from that device?'), gt('Sign out')).done(function () {
                var dialog = this;
                http.PUT({
                    url: '/ajax/sessionmanagement',
                    params: {
                        action: 'delete'
                    },
                    data: [self.model.get('sessionId')]
                }).fail(function (error) {
                    require(['io.ox/core/yell'], function (yell) {
                        yell(error);
                    });
                    collection.fetch();
                }).always(function () {
                    dialog.close();
                });

                // trigger destroy will remove the model from all collections
                // do not use destroy(), because that will use the backbone sync mechanism
                self.model.trigger('destroy', self.model);
            });
        }

    });

    var SessionView = Backbone.View.extend({

        className: 'session-list-container',

        initialize: function () {
            this.$el.data('view', this);
        },

        render: function () {
            var self = this;
            this.collection.initial.always(function () {
                self.$el.append(
                    self.listView = new SettingsListView({
                        collection: self.collection,
                        childView: SessionItemView,
                        childOptions: { collection: self.collection }
                    }).render().$el
                );
            });
            return this;
        }

    });

    ext.point('io.ox/settings/security/sessions/settings/detail').extend({
        id: 'view',
        index: 100,
        draw: function () {
            this.append(
                new ExtensibleView({
                    point: 'io.ox/settings/sessions/settings/detail/view',
                    collection: new SessionCollection()
                })
                .render().$el
            );
        }
    });

    ext.point('io.ox/settings/sessions/settings/detail/view').extend({
        id: 'title',
        index: 100,
        render: function () {
            this.$el
                .addClass('io-ox-session-settings')
                .append(
                    $('<h1>').text(gt('You are currently signed in with the following devices'))
                );
        }
    });

    ext.point('io.ox/settings/sessions/settings/detail/view').extend({
        id: 'spinner',
        index: 200,
        render: function (baton) {
            var spinner;
            this.$el.append(spinner = $('<div>').busy());
            baton.view.collection.initial.always(function () {
                spinner.remove();
            });
        }
    });

    ext.point('io.ox/settings/sessions/settings/detail/view').extend({
        id: 'list',
        index: 300,
        render: function (baton) {
            this.$el.append(
                new SessionView({
                    collection: baton.view.collection
                }).render().$el
            );
        }
    });

    ext.point('io.ox/settings/sessions/settings/detail/view').extend({
        id: 'remove-all',
        index: 1000,
        render: function (baton) {
            var link;
            this.$el.append(
                link = $('<button data-action="remove-all" class="btn btn-primary hidden">').text('Sign out from all clients').on('click', function (e) {
                    e.preventDefault();
                    buildConfirmationDialog(gt('Do you really want to sign out from all clients except the current one?'), gt('Sign out')).done(function () {
                        var dialog = this;
                        this.busy();
                        http.GET({
                            url: '/ajax/sessionmanagement',
                            params: { action: 'clear' }
                        }).fail(function (error) {
                            require(['io.ox/core/yell'], function (yell) {
                                yell(error);
                            });
                        }).always(function () {
                            baton.view.collection.fetch().always(dialog.close);
                        });
                    });
                })
            );
            baton.view.collection.initial.done(function () {
                if (baton.view.collection.length === 0) return;
                link.removeClass('hidden');
            });
        }
    });

    return {
        Model: SessionModel,
        Collection: SessionCollection,
        View: SessionView
    };

});
