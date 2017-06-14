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

define('io.ox/settings/sessions/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'gettext!io.ox/core',
    'io.ox/core/http',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/backbone/disposable',
    'io.ox/backbone/mini-views/listutils',
    'settings!io.ox/core',
    'less!io.ox/settings/sessions/settings/style'
], function (ext, ExtensibleView, gt, http, SettingsListView, DisposableView, listUtils, settings) {

    'use strict';

    ext.point('io.ox/settings/pane/external').extend({
        id: 'sessions',
        title: gt('Active clients'),
        ref: 'io.ox/settings/sessions',
        index: 200,
        advancedMode: true
    });

    var operatingSystems = {
        windows: gt('Windows'),
        windows8: gt('windows'),
        macos: gt('MacOS'),
        android: gt('Android'),
        ios: gt('iOS')
    };

    function buildConfirmationDialog(text) {
        var def = new $.Deferred();
        require(['io.ox/backbone/views/modal'], function (ModalDialog) {
            new ModalDialog({ title: text, async: true })
            .build(function () { this.$body.remove(); })
            .addButton({ label: gt('Ok'), action: 'ok' })
            .addCancelButton()
            .on('ok', def.resolve)
            .open();
        });
        return def.promise();
    }

    var SessionModel = Backbone.Model.extend({

        idAttribute: 'sessionId',

        initialize: function () {
            this.browser = _.detectBrowser({ userAgent: this.get('userAgent') }) || {};
            this.setPlatform();
            this.setClient();
        },

        setPlatform: function () {
            if (this.browser.ios || this.browser.android || this.browser.blackberry || this.browser.windowsphone) this.set('platform', 'smartphone');
            else if (this.browser.windows || this.browser.windows8 || this.browser.macos) this.set('platform', 'desktop');
            else this.set('platform', 'other');
        },

        setClient: function () {
            ext.point('io.ox/settings/sessions/display-name').invoke('customize', this);
        }

    });

    ext.point('io.ox/settings/sessions/display-name').extend({
        id: 'browser',
        index: 100,
        customize: function () {
            if (this.get('client') !== 'open-xchange-appsuite') return;
            var self = this,
                os = _(operatingSystems).find(function (value, key) {
                    return !!self.browser[key];
                }) || gt('Unknown Operating System');
            if (this.browser.firefox) this.set('displayName', gt('Firefox %1$s on %2$s', this.browser.firefox, os));
            else if (this.browser.chrome) this.set('displayName', gt('Chrome %1$s on %2$s', this.browser.chrome, os));
            else if (this.browser.safari) this.set('displayName', gt('Safari %1$s on %2$s', this.browser.safari, os));
            else if (this.browser.ie) this.set('displayName', gt('Internet Explorer on %1$s', os));
            else if (this.browser.edge) this.set('displayName', gt('Edge on %1$s', os));
            else this.set({ displayName: gt('Unknown client'), other: true });
        }
    });

    ext.point('io.ox/settings/sessions/display-name').extend({
        id: 'fatclients',
        index: 200,
        customize: function () {
            if (this.get('client') === 'open-xchange-appsuite') return;
            var self = this,
                client = this.get('client'),
                os = _(operatingSystems).find(function (value, key) {
                    return !!self.browser[key];
                }) || gt('Unknown Operating System');
            if (client === 'open-xchange-mailapp' ||
                client === 'open-xchange-mobile-api-facade') {
                this.set('displayName',
                    //#. %1$s the productname of the mailapp
                    //#. %2$s the operating system
                    //#. Example: Mailapp on iOS
                    gt('%1$s on %2$s', settings.get('productname/mailapp'), os)
                );
            } else if (client === 'OpenXchange.HTTPClient.OXDrive') {
                this.set('displayName',
                    //#. %1$s the producname of the drive app
                    //#. Example: OXDrive on Windows
                    gt('%1$s on Windows', settings.get('productname/oxdrive'))
                );
            } else if (client === 'OpenXchange.iosClient.OXDrive') {
                this.set('displayName',
                    //#. %1$s the producname of the drive app
                    //#. Example: OXDrive on iOS
                    gt('%1$s on iOS', settings.get('productname/oxdrive'))
                );
            } else if (client === 'OpenXchange.Android.OXDrive') {
                this.set('displayName',
                    //#. %1$s the producname of the drive app
                    //#. Example: OXDrive on Android
                    gt('%1$s on Android', settings.get('productname/oxdrive'))
                );
            } else if (client === 'OXDrive') {
                this.set('displayName',
                    //#. %1$s the producname of the drive app
                    //#. %2$s the operating system
                    //#. Example: OXDrive on Windows
                    gt('%1$s on %2$s', settings.get('productname/oxdrive'), os)
                );
            } else if (client === 'OSX.OXDrive') {
                this.set('displayName',
                    //#. %1$s the producname of the drive app
                    //#. Example: OXDrive on MacOS
                    gt('%1$s for MacOS', settings.get('productname/oxdrive'))
                );
            } else if (client === 'USM-EAS') {
                this.set('displayName', gt('Exchange Active Sync'));
            } else if (client === 'USM-JSON') {
                this.set('displayName', settings.get('productname/oxtender'));
            } else {
                this.set({ displayName: gt('Unknown client'), other: true });
            }
        }
    });

    var SessionCollection = Backbone.Collection.extend({

        model: SessionModel,

        comparator: function (model) {
            // sort ascending
            return -model.get('loginTime');
        },

        initialize: function () {
            this.initial = this.fetch();
        },

        fetch: function () {
            var self = this;
            return http.GET({
                url: '/ajax/sessionmanagement?action=getSessions'
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
            this.$el.empty().append(
                $('<div>').append(
                    $('<div>').text(this.model.get('displayName')),
                    $('<div>').text(gt('IP Address: %1$s', this.model.get('ipAddress')))
                ),
                this.model.get('sessionId') !== ox.session ? listUtils.makeControls().append(
                    listUtils.controlsDelete({ title: gt('Delete %1$s', this.model.get('displayName')) })
                ) : $('<div class="list-control-placeholder">'),
                $('<div class="addition-information">').append(
                    $('<span>').append(
                        this.model.get('location'),
                        ' &#xb7; ',
                        moment(this.model.get('loginTime')).fromNow()
                    ),
                    this.model.get('sessionId') === ox.session ? $('<div>').append($('<span class="label label-success">').text(gt('Current session'))) : ''
                )
            );
            return this;
        },

        onDelete: function (e) {
            var self = this,
                // assign collection here since the view might be removed later
                collection = this.collection;
            e.preventDefault();
            buildConfirmationDialog(gt('Do you really want to terminate that session?')).done(function () {
                var dialog = this;
                http.PUT({
                    url: '/ajax/sessionmanagement',
                    params: {
                        action: 'removeSession'
                    },
                    data: {
                        sessionIdToRemove: self.model.get('sessionId')
                    }
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

        initialize: function (opt) {
            this.opt = _.extend({
                filter: function () { return true; }
            }, opt);
            this.listenTo(this.collection, 'remove', this.onRemove.bind(this));
        },

        render: function () {
            var self = this;
            this.collection.initial.always(function () {
                if (self.collection.filter(self.opt.filter).length === 0) return;
                self.$el.append(
                    $('<h4>').text(self.opt.title),
                    self.listView = new SettingsListView({
                        collection: self.collection,
                        childView: SessionItemView,
                        childOptions: { collection: self.collection },
                        filter: self.opt.filter
                    }).render().$el
                );
            });
            return this;
        },

        onRemove: function () {
            if (!this.listView) return;
            if (this.collection.filter(this.opt.filter).length > 0) return;
            // defer removal to prevent errors in SettingsListView
            var self = this;
            _.defer(function () {
                self.listView.remove();
                self.$el.empty();
            });
        }

    });

    ext.point('io.ox/settings/sessions/settings/detail').extend({
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
                    $('<h1>').text(gt('Active clients'))
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
        id: 'mobile-list',
        index: 300,
        render: function (baton) {
            this.$el.append(
                new SessionView({
                    title: gt('Browser'),
                    collection: baton.view.collection,
                    filter: function (model) {
                        return model.get('client') === 'open-xchange-appsuite' && !model.get('other');
                    }
                }).render().$el
            );
        }
    });

    ext.point('io.ox/settings/sessions/settings/detail/view').extend({
        id: 'desktop-list',
        index: 400,
        render: function (baton) {
            this.$el.append(
                new SessionView({
                    title: gt('Native clients'),
                    collection: baton.view.collection,
                    filter: function (model) {
                        return model.get('client') !== 'open-xchange-appsuite' && !model.get('other');
                    }
                }).render().$el
            );
        }
    });

    ext.point('io.ox/settings/sessions/settings/detail/view').extend({
        id: 'other-list',
        index: 500,
        render: function (baton) {
            this.$el.append(
                new SessionView({
                    title: gt('Other clients'),
                    collection: baton.view.collection,
                    filter: function (model) {
                        return !!model.get('other');
                    }
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
                link = $('<a href="#" data-action="remove-all" class="hidden">').text('Remove all sessions except the current one').on('click', function (e) {
                    e.preventDefault();
                    buildConfirmationDialog(gt('Do you really want to terminate all active sessions except the current one?')).done(function () {
                        var dialog = this;
                        this.busy();
                        http.PUT({
                            url: '/ajax/sessionmanagement',
                            params: {
                                action: 'removeAllOtherSessions'
                            },
                            data: {
                                sessionIdToKeep: ox.session
                            }
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
