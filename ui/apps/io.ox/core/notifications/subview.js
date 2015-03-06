/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/notifications/subview', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'gettext!io.ox/core'
], function (ext, notifications, gt) {

    'use strict';

    ext.point('io.ox/core/notifications/default/main').extend({
        draw: function (baton) {
            var view = baton.view,
                node = view.$el,
                model = view.model,
                api = model.get('api'),
                items = view.collection.models,
                max = model.get('max') || items.length,
                itemNode = $('<ul class="items list-unstyled">'),
                extensionPoints = model.get('extensionPoints');
            node.addClass('notifications notifications-main-' + model.get('id'));
            this.append(node);
            //invoke header, items and footer
            ext.point(extensionPoints.header).invoke('draw', node, baton);
            node.append(itemNode);

            var drawItem = function (model, requestedModel) {
                //item is the result of a get request, requestedItem is the provided data
                //for example reminders need both to work correctly (reminderObject and task/appointment)
                //make sure we have a model
                if ( !model.get ) {
                    model = new Backbone.Model(model);
                }
                var node = $('<li class="item" tabindex="1" role="listitem">');
                if (view.model.get('showHideSingleButton')) {
                    node.append(
                        $('<div class="notification-item-actions">').append(
                            $('<button type="button" class="btn btn-link clear-single-button fa fa-times">')
                                .attr({
                                    tabindex: 1,
                                    'data-action': 'clearSingle',
                                    'aria-label': gt ('Hide this notification')
                                }).on('click', function () {
                                        view.hide(requestedModel);
                                    }
                                )
                            )
                        );
                }

                node.appendTo(itemNode);

                ext.point(extensionPoints.item).invoke('draw', node, ext.Baton({ view: view, model: model, requestedModel: requestedModel }));
            };

            if (api && !model.get('fullModel')) {
                //models are incomplete (only id, folder_id)
                //get the data first
                for (var i = 0; i < max && items[i]; i++) {
                    //mail needs unseen attribute, shouldn't bother other apis
                    //extend with empty object to not overwrite the model
                    api.get(_.extend({}, items[i].attributes, { unseen: true })).then(_.partial( drawItem, _, items[i]));
                }
            } else {
                for (var i = 0; i < max && items[i]; i++) {
                    drawItem(items[i], items[i]);
                }
            }

            ext.point(extensionPoints.footer).invoke('draw', node, baton);
        }
    });

    ext.point('io.ox/core/notifications/default/header').extend({
        draw: function (baton) {
            var title =  baton.view.model.get('title');
            this.append(
                $('<h1 class="section-title">').text(title),
                baton.view.model.get('showHideAllButton') ? $('<button type="button" class="btn btn-link clear-button fa fa-times">')
                        .attr({
                            tabindex: 1,
                            'data-action': 'clearAll',
                            'aria-label': baton.view.model.attributes.hideAllLabel
                        })
                    : ''
            );
        }
    });

    //use function here to not override defaults on extending
    function defaults () {
        return {
            id: '',
            title: '',
            apiSupport: null,
            apiEvents: null,
            extensionPoints: {
                main: 'io.ox/core/notifications/default/main',
                header: 'io.ox/core/notifications/default/header',
                item: '',
                footer: ''
            },
            showHideAllButton: true,
            showHideSingleButton: true,
            fullModel: false,
            max: 10,
            autoOpen: false,
            desktopNotificationSupport: true,
            desktopNotificationMessage: gt("You've got new Notifications"),
            desktopNotificationTitle: gt('New Notifications'),
            desktopNotificationIcon: '',
            hideAllLabel: ''
        };
    }
    var SubviewModel = Backbone.Model.extend({
            defaults: defaults()
        });

    var Subview = Backbone.View.extend({
        tagName: 'div',
        events: {
            'click .item': 'onClick',
            'keydown .item': 'onClick',
            'click [data-action="clearAll"]': 'hideAll'
        },
        initialize: function (options) {
            var self = this,
                api = options.model.get('api'),
                apiEvents = options.model.get('apiEvents');

            //collection to store notifications
            this.collection = new Backbone.Collection();
            //collection to store hidden notifications (for example appointment reminders that are set to remind me later)
            this.hiddenCollection = new Backbone.Collection();

            notifications.registerSubview(this);
            //enable api support if possible
            if (api && apiEvents) {
                if (apiEvents.add) {
                    api.on(apiEvents.add, function () {
                        //strip off the event parameter
                        self.addNotifications.apply(self, _.rest(arguments));
                    });
                }
                if (apiEvents.remove) {
                    api.on(apiEvents.remove, function () {
                        //strip off the event parameter
                        self.removeNotifications.apply(self, _.rest(arguments));
                    });
                }
                if (apiEvents.reset) {
                    api.on(apiEvents.reset, function () {
                        //strip off the event parameter
                        self.resetNotifications.apply(self, _.rest(arguments));
                    });
                }
            }
        },
        //clearfunction to empty the view and detach it (keeps event bindings intact)
        clear: function () {
            this.$el.empty();
            this.$el.detach();
        },
        render: function (node) {
            this.$el.empty();
            if (this.collection.size() > 0) {
                ext.point(this.model.get('extensionPoints').main).invoke('draw', node, ext.Baton({ view: this }));
            }
        },
        hideAll: function () {
            this.hiddenCollection.add(this.collection.models);
            this.collection.reset();
        },
        hide: function (model, time) {
            //should work with models and objects with attributes
            var id = model.id || model.get('id'),
                obj = this.collection.get(id),
                self = this;
            //hiding an already hidden object leads to problems by creating 2 timers
            if (obj) {
                this.hiddenCollection.add(obj);
                this.collection.remove(obj);

                //use a timer to unhide the model
                if (time) {
                    setTimeout(function () {
                        self.hiddenCollection.remove(obj);
                        //don't add twice
                        if (!self.collection.get(obj.get('id'))) {
                            self.collection.add(obj);
                        }
                    }, time);
                }
            }
        },
        unHide: function (model) {
            var id = model.id || model.get('id'),
                obj = this.hiddenCollection.get(id);
            this.hiddenCollection.remove(obj);
            //don't add twice
            if (!this.collection.get(obj.get('id'))) {
                this.collection.add(obj);
            }
        },
        //removes items that are in the hidden list so they don't get added
        checkHidden: function (items) {
            var self = this;
            return _(items).filter(function (item) {
                var id = item.id || item.get('id');
                return !self.hiddenCollection.get(id);
            });
        },
        //returns true if the given items result in new items in the collection. Used when adding to or resetting the collection
        //used for autoopen and desktop notifications
        checkNew: function (items) {
            var newIds = _(items).map(function (item) {
                    return item.id;
                }),
                oldIds = _(this.collection.models).map(function (model) {
                    return model.get('id');
                }),
                isNew = _.difference(newIds, oldIds).length;
            if (isNew) {
                if (this.model.get('autoOpen')) {
                    this.trigger('autoopen', { numberOfNewItems: isNew, subviewId: this.model.get('id') });
                }

                if (this.model.get('desktopNotificationSupport')) {
                    var message = {
                            title: this.model.get('desktopNotificationTitle'),
                            body: this.model.get('desktopNotificationMessage'),
                            icon: this.model.get('desktopNotificationIcon')
                        };
                    require(['io.ox/core/desktopNotifications'], function (desktopNotifications) {
                        //this may be to verbose...we'll see how it works
                        desktopNotifications.show(message);
                    });
                }
            }
        },
        addNotifications: function (items, silent) {
            if (!_.isArray(items)) {
                items = [].concat(items);
            }
            items = this.checkHidden(items);
            this.checkNew(items);
            this.collection.add(items, { silent: silent });
        },
        removeNotifications: function (items, silent) {
            if (!_.isArray(items)) {
                items = [].concat(items);
            }
            this.collection.remove(items, { silent: silent });
        },
        resetNotifications: function (items, silent) {
            if (!_.isArray(items)) {
                items = [].concat(items);
            }
            items = this.checkHidden(items);
            this.checkNew(items);
            this.collection.reset(items, { silent: silent });
        },
        onClick: function (e) {
            if ((!(this.model.get('detailview'))) ||
                ((e.type !== 'click') && (e.which !== 13)) ||
                $(e.target).filter('.dropdown, select, a, button, .btn').length > 0 ) {
                return;
            }
            var cid = String($(e.currentTarget).data('cid')),
                api = this.model.get('api'),
                sidepopupNode = notifications.nodes.sidepopup,
                status = notifications.getStatus;
            // toggle?
            if (status === 'sidepopup' && cid === sidepopupNode.find('[data-cid]').data('cid')) {
                //sidepopup.close();
                notifications.closeSidepopup();
            } else {
                notifications.closeSidepopup();
                if (_.isString(this.model.get('detailview'))) {
                    require([this.model.get('detailview')], function (detailview) {
                        //extend with empty object to not overwrite the model
                        notifications.openSidepopup(cid, detailview, api.get(_.extend({}, _.cid(cid), { unseen: true })));
                    });
                } else {
                    notifications.openSidepopup(cid, this.model.get('detailview'), api.get(_.extend(_.cid(cid), { unseen: true })));
                }
            }
        }
    });

    //creates a generic subview for notifications
    //provides extensionpoints to customize
    function createSubview(options) {
        //subviews need at least an id and an index
        if (!options.id) {
            return;
        }

        if (options.extensionPoints) {
            options.extensionPoints = _.extend(defaults().extensionPoints, options.extensionPoints);
        }
        return new Subview({ model: new SubviewModel(options) });
    }

    return createSubview;
});
