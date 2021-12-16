/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
                viewNode = view.$el,
                model = view.model,
                api = model.get('api'),
                items = view.collection.models, i,
                max = model.get('max') || items.length,
                itemNode = $('<ul class="items list-unstyled">'),
                extensionPoints = model.get('extensionPoints'),
                desktopNotificationFor = model.get('showNotificationFor'),
                specific = model.get('specificDesktopNotification'),
                self = this;

            //make sure it's only displayed once
            model.set('showNotificationFor', null);

            viewNode.addClass('notifications notifications-main-' + model.get('id'));

            //invoke header, items and footer
            ext.point(extensionPoints.header).invoke('draw', viewNode, baton);
            viewNode.append(itemNode);
            itemNode.busy();

            var drawItem = function (model, requestedModel) {
                //model is the result of a get request, requestedModel is the data passed to the api (they are usually the same)
                //reminders need both to work correctly (reminderObject and task/appointment)

                //make sure we have a model
                if (!model) {
                    model = requestedModel;
                } else if (!model.get) {
                    model = new Backbone.Model(model);
                }

                if (String(requestedModel.get('id')) === String(desktopNotificationFor)) {
                    require(['io.ox/core/desktopNotifications'], function (desktopNotifications) {
                        //this may be to verbose...we'll see how it works
                        desktopNotifications.show(specific(model));
                    });
                }
                var node = $('<li class="item" tabindex="0" role="menuitem">');
                if (view.model.get('showHideSingleButton')) {
                    node.append(
                        $('<div class="notification-item-actions">').append(
                            $('<button type="button" class="btn btn-link clear-single-button fa fa-times" data-action="clear-single">')
                                .attr('aria-label', gt('Hide this notification'))
                                .on('click', function () {
                                    view.hide(requestedModel);
                                })
                        )
                    );
                }

                node.appendTo(itemNode);

                ext.point(extensionPoints.item).invoke('draw', node, ext.Baton({ view: view, model: model, requestedModel: requestedModel }));
            };

            if (api && !model.get('fullModel')) {
                //models are incomplete (only id, folder_id)
                //get the data first
                if (model.get('useListRequest')) {
                    var requestData = _(items.slice(0, max)).map(function (obj) {
                        return obj.attributes;
                    });
                    // no cache here, or we might show reminders for deleted requests
                    api.getList(requestData, false).then(function (data) {
                        for (i = 0; i < max && requestData[i]; i++) {
                            // some list requests return null for items that were deleted meanwhile (request doesn't fail so the other data can still be used). Dont show these
                            // also check if the models are still in our collection
                            if (data[i] && view.collection.get(requestData[i])) drawItem(data[i], view.collection.get(requestData[i]));
                        }
                        itemNode.idle();
                    }, function () {
                        // if list fails (insufficient permissions etc) we try again with get requests, this way we can at least show working alarms
                        model.set('useListRequest', false);
                        viewNode.empty();
                        ext.point('io.ox/core/notifications/default/main').invoke('draw', self, baton);
                    });
                } else {
                    var defs = [];
                    for (i = 0; i < max && items[i]; i++) {
                        // mail needs unseen attribute, shouldn't bother other apis
                        // extend with empty object to not overwrite the model
                        // if get fails, hide the reminder
                        defs.push(api.get(_.extend({}, items[i].attributes, { unseen: true })).then(_.partial(drawItem, _, items[i]), _(view.hide).bind(view, items[i])));
                    }
                    $.when.apply($, defs).always(function () {
                        itemNode.idle();
                    });
                }
            } else {
                for (i = 0; i < max && items[i]; i++) {
                    drawItem(items[i], items[i]);
                }
                itemNode.idle();
            }

            ext.point(extensionPoints.footer).invoke('draw', viewNode, baton);
        }
    });

    ext.point('io.ox/core/notifications/default/header').extend({
        draw: function (baton) {
            var title =  baton.view.model.get('title');
            this.append(
                $('<h1 class="section-title">').text(title),
                baton.view.model.get('showHideAllButton') ?
                    $('<button type="button" class="btn btn-link clear-button fa fa-times" data-action="clear-all">')
                        .attr({
                            'aria-label': baton.view.model.attributes.hideAllLabel
                        })
                    : ''
            );
        }
    });

    //use function here to not override defaults on extending
    function defaults() {
        return {
            id: '',
            title: '',
            api: null,
            apiEvents: null,
            useListRequest: false,
            extensionPoints: {
                main: 'io.ox/core/notifications/default/main',
                header: 'io.ox/core/notifications/default/header',
                item: '',
                footer: ''
            },
            showHideAllButton: false,
            showHideSingleButton: true,
            fullModel: false,
            max: 10,
            autoOpen: false,
            desktopNotificationSupport: true,
            genericDesktopNotification: {
                title: gt('New notifications'),
                body: gt('You have new notifications'),
                icon: ''
            },
            specificDesktopNotification: null,
            hideAllLabel: ''
        };
    }
    var SubviewModel = Backbone.Model.extend({
        defaults: defaults()
    });

    var Subview = Backbone.View.extend({
        tagName: 'div',
        events: {
            'click .notification-info': 'onClick',
            'keydown .item': 'onClick',
            'click [data-action="clear-all"]': 'hideAll'
        },
        initialize: function (options) {
            var self = this,
                api = options.model.get('api'),
                apiEvents = options.model.get('apiEvents');

            //collection to store notifications
            this.collection = new Backbone.Collection();
            //add id to collection to distinguish them
            this.collection.subviewId = options.model.get('id');
            //collection to store hidden notifications (for example appointment reminders that are set to remind me later)
            this.hiddenCollection = new Backbone.Collection();

            //placeholder to keep the position if view has no notifications to display.
            this.placeholder = $('<div class="notification-placeholder">').css('display', 'none');
            this.placeholderInUse = false;

            notifications.registerSubview(this);
            //enable api support if possible
            if (api && apiEvents) {
                if (apiEvents.add) {
                    api.on(apiEvents.add, function () {
                        //strip off the event parameter
                        var items = arguments[0] instanceof jQuery.Event ? _.rest(arguments) : arguments;
                        self.addNotifications.apply(self, items);
                    });
                }
                if (apiEvents.remove) {
                    api.on(apiEvents.remove, function () {
                        //strip off the event parameter
                        var items = arguments[0] instanceof jQuery.Event ? _.rest(arguments) : arguments;
                        self.removeNotifications.apply(self, items);
                    });
                }
                if (apiEvents.reset) {
                    api.on(apiEvents.reset, function () {
                        //strip off the event parameter
                        var items = arguments[0] instanceof jQuery.Event ? _.rest(arguments) : arguments;
                        self.resetNotifications.apply(self, items);
                    });
                }
            }
        },
        //clearfunction to empty the view and detach it (keeps event bindings intact)
        clear: function () {
            this.$el.empty();
            this.$el.detach();
        },
        //renderfunction, will either render the view or leave a placeholder if the collection has no items(to keep the order intact)
        render: function (node) {
            this.$el.empty();

            if (this.collection.size() > 0) {
                //if there is a placeholder attached use it's position
                if (this.placeholderInUse) {
                    this.placeholderInUse = false;
                    this.placeholder.after(this.$el);
                    this.placeholder.detach();
                } else if (this.$el.parents().length === 0) {
                    //only append if it is detached
                    node.append(this.$el);
                }
                ext.point(this.model.get('extensionPoints').main).invoke('draw', node, ext.Baton({ view: this }));
            } else if (!this.placeholderInUse) {
                //leave placeholder to keep the correct order and detach the view
                if (this.$el.parents().length === 0) {
                    node.append(this.placeholder);
                    this.placeholderInUse = true;
                } else {
                    this.$el.after(this.placeholder);
                    this.placeholderInUse = true;
                    this.$el.detach();
                }
            }
        },

        hideAll: function (time) {
            var models = this.collection.models,
                self = this;
            if (models.length === 0) {
                return;
            }
            this.hiddenCollection.add(models);
            this.collection.reset();

            // if a time is given, show notifcations again after the timeout
            if (time) {
                _(models).each(function (model) {
                    setTimeout(function (hiddenModel) {
                        self.hiddenCollection.remove(hiddenModel);
                        //don't add twice
                        if (!self.collection.get(hiddenModel.get('id'))) {
                            self.addNotifications([hiddenModel]);
                        }
                    }, time, model);
                });
            }
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
                if (_.isNumber(time)) {
                    setTimeout(function () {
                        self.hiddenCollection.remove(obj);
                        //don't add twice
                        if (!self.collection.get(obj.get('id'))) {
                            self.addNotifications([obj]);
                        }
                    }, time);
                }
            }
        },
        //removes a notification from view and puts it in the hidden collection
        //does not redraw the whole view or fire requests (exeption: there are more notifications than the max number, in that case we have to redraw to get a new one)
        //if there is 0 items left to display, hides the view

        // BE SURE TO REMOVE IT FROM THE HIDDEN COLLECTION WHEN THE REQUEST IS DONE OR IT CANNOT BE READDED
        // hidden items are considered as items the user does not want to see or should not see
        responsiveRemove: function (model) {
            //should work with models and objects with attributes
            var data = model.attributes || model,
                id = data.id,
                obj = this.collection.get(id);

            if (obj) {
                this.hiddenCollection.add(obj);
                var aboveLimit = this.collection.size() > this.model.get('max');
                this.removeNotifications(obj, true);

                this.$el.find('[data-cid="' + _.cid(data) + '"]').remove();

                if (this.collection.size() === 0 || aboveLimit) {
                    this.render(this.$el.parent());
                }
                this.trigger('responsive-remove');
            }
        },
        // puts models from the hiddenCollection back into the main collection
        unHide: function (model) {
            var id = model.id || model.get('id'),
                obj = this.hiddenCollection.get(id);
            this.hiddenCollection.remove(obj);
            //don't add twice
            if (!this.collection.get(obj.get('id'))) {
                this.addNotifications(obj);
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
                newItems = _.difference(newIds, oldIds),
                model = this.model;
            if (newItems.length) {
                if (model.get('desktopNotificationSupport')) {
                    var generic = model.get('genericDesktopNotification'),
                        specific = model.get('specificDesktopNotification');
                    //if theres multiple items or no specific notification given, use the generic
                    if (newItems.length > 1 || !specific || !$.isFunction(specific)) {
                        require(['io.ox/core/desktopNotifications'], function (desktopNotifications) {
                            //this may be to verbose...we'll see how it works
                            desktopNotifications.show(generic);
                        });
                    } else {
                        //will be executed on drawing the notifications ('io.ox/core/notifications/default/main') to reduce requests
                        //we can use the same data then
                        model.set('showNotificationFor', newItems[0]);
                    }
                }
                return true;
            }
            return false;
        },
        addNotifications: function (items, silent) {

            if (!items) return;

            if (!_.isArray(items)) {
                items = [].concat(items);
            }
            //stop here if nothing changes, to prevent event triggering and redrawing
            if (items.length === 0) {
                return;
            }
            items = this.checkHidden(items);
            var newModels = this.checkNew(items, this.collection);
            this.collection.add(items, { silent: silent });
            if (newModels && !_.device('smartphone') && this.model.get('autoOpen')) {
                this.trigger('autoopen');
            }
        },
        removeNotifications: function (items, silent) {

            if (!items) return;

            if (!_.isArray(items)) {
                items = [].concat(items);
            }
            //stop here if nothing changes, to prevent event triggering and redrawing
            if (items.length === 0 || (items.length === 1 && items[0].id && !this.collection.get(items[0]))) {
                return;
            }

            // smartRemove removes the item without redrawing (manual remove of the nodes)
            // redraw only when hitting 0 or when we are above the max number of notifications (to render a new one)
            if (this.model.get('smartRemove')) {
                var aboveLimit = this.collection.size() > this.model.get('max');
                this.collection.remove(items, { silent: true });
                var self = this;

                _(items).each(function (item) {
                    if (item.get) item = item.attributes;
                    self.$el.find('[data-cid="' + _.cid(item) + '"],[model-cid="' + _.cid(item) + '"]').remove();
                });

                if (this.collection.size() === 0 || aboveLimit) {
                    this.render(this.$el.parent());
                }
                this.trigger('responsive-remove');
                return;
            }
            this.collection.remove(items, { silent: silent });
        },
        resetNotifications: function (items, silent) {
            // prevent [undefined] arrays
            items = items || [];
            if (!_.isArray(items)) {
                items = [].concat(items);
            }
            //stop here if nothing changes, to prevent event triggering and redrawing
            if (this.collection.size() === 0 && items.length === 0) {
                return;
            }
            items = this.checkHidden(items);
            var newModels = this.checkNew(items);
            this.collection.reset(items, { silent: silent });
            if (newModels && !_.device('smartphone') && this.model.get('autoOpen')) {
                this.trigger('autoopen');
            }
        },
        onClick: function (e) {
            if ((!(this.model.get('detailview'))) ||
                ((e.type !== 'click') && (e.which !== 13)) ||
                $(e.target).filter('.dropdown, select, a:not(.notification-info), button, .btn').length > 0) {
                return;
            }

            var cid = e.which === 13 ? String($(e.currentTarget).data('cid')) : String($(e.currentTarget).parent().data('cid')),
                api = this.model.get('api'),
                sidepopupNode = notifications.sidepopupNode,
                getCid = this.model.get('useApiCid') ? this.model.get('api').cid : _.cid,
                self = this;

            // toggle?
            if (notifications.model.get('sidepopup') && cid === String(sidepopupNode.find('[data-cid]').data('cid'))) {
                notifications.closeSidepopup();
            } else {
                notifications.closeSidepopup();
                var data;
                if (api) {
                    data = api.get(_.extend({}, getCid(cid), { unseen: true }));
                } else {
                    data = this.collection.get(getCid(cid)).attributes;
                }
                if (!data) {
                    return;
                }
                if (_.isString(this.model.get('detailview'))) {
                    require([this.model.get('detailview')], function (detailview) {
                        //extend with empty object to not overwrite the model
                        notifications.openSidepopup(cid, detailview, data, self.model.get('detailviewOptions'));
                    });
                } else {
                    notifications.openSidepopup(cid, this.model.get('detailview'), data, this.model.get('detailviewOptions'));
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
