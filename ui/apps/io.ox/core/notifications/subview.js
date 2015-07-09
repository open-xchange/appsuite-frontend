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
                viewNode = view.$el,
                model = view.model,
                api = model.get('api'),
                items = view.collection.models,
                max = model.get('max') || items.length,
                itemNode = $('<ul class="items list-unstyled">'),
                extensionPoints = model.get('extensionPoints'),
                desktopNotificationFor = model.get('showNotificationFor'),
                specific = model.get('specificDesktopNotification');

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
                if ( !model ) {
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
                if (model.get('useListRequest')) {
                    var requestData = _(items.slice(0, max)).map(function (obj) {
                        return obj.attributes;
                    });
                    api.getList(requestData).then(function (data) {
                        for (var i = 0; i < max && items[i]; i++) {
                            drawItem(data[i], items[i]);
                        }
                        itemNode.idle();
                    });
                } else {
                    var defs = [];
                    for (var i = 0; i < max && items[i]; i++) {
                        //mail needs unseen attribute, shouldn't bother other apis
                        //extend with empty object to not overwrite the model
                        defs.push(api.get(_.extend({}, items[i].attributes, { unseen: true })).then(_.partial( drawItem, _, items[i])));
                    }
                    $.when.apply($, defs).then(function () {
                        itemNode.idle();
                    });
                }
            } else {
                for (var i = 0; i < max && items[i]; i++) {
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
                body: gt('You\'ve got new notifications'),
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
        //removes a notification from view and puts it in the hidden collection
        //does not redraw the whole view or fire requests
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
                this.removeNotifications(obj, true);

                this.$el.find('[data-cid="' + _.cid(data) + '"]').remove();

                if (this.collection.size() === 0) {
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
                if (!_.device('smartphone') && model.get('autoOpen')) {
                    this.trigger('autoopen', { numberOfNewItems: newItems.length, subviewId: model.get('id'), itemIds: newItems });
                }

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
            }
        },
        addNotifications: function (items, silent) {
            if (!_.isArray(items)) {
                items = [].concat(items);
            }
            //stop here if nothing changes, to prevent event triggering and redrawing
            if (items.length === 0) {
                return;
            }
            items = this.checkHidden(items);
            this.checkNew(items);
            this.collection.add(items, { silent: silent });
        },
        removeNotifications: function (items, silent) {
            if (!_.isArray(items)) {
                items = [].concat(items);
            }
            //stop here if nothing changes, to prevent event triggering and redrawing
            if (items.length === 0 ||  (items.length === 1 && items[0].id && !this.collection.get(items[0]))) {
                return;
            }
            this.collection.remove(items, { silent: silent });
        },
        resetNotifications: function (items, silent) {
            if (!_.isArray(items)) {
                items = [].concat(items);
            }
            //stop here if nothing changes, to prevent event triggering and redrawing
            if (this.collection.size() === 0 && items.length === 0) {
                return;
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
                fullModel = this.model.get('fullModel'),
                sidepopupNode = notifications.nodes.sidepopup,
                status = notifications.getStatus();
            // toggle?
            if (status === 'sidepopup' && cid === String(sidepopupNode.find('[data-cid]').data('cid'))) {
                //sidepopup.close();
                notifications.closeSidepopup();
            } else {
                notifications.closeSidepopup();
                var data;
                if (api && !fullModel) {
                    data = api.get(_.extend({}, _.cid(cid), { unseen: true }));
                } else {
                    data = this.collection.get(_.cid(cid)).attributes;
                }
                if (!data) {
                    return;
                }
                if (_.isString(this.model.get('detailview'))) {
                    require([this.model.get('detailview')], function (detailview) {
                        //extend with empty object to not overwrite the model
                        notifications.openSidepopup(cid, detailview, data);
                    });
                } else {
                    notifications.openSidepopup(cid, this.model.get('detailview'), data);
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
