/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/calendar/edit/module-participants',
      ['io.ox/core/api/user',
       'io.ox/core/api/group',
       'io.ox/core/api/resource',
       'io.ox/contacts/api',
       'io.ox/core/extensions',
       'dot!io.ox/calendar/edit/common.html',
       'gettext!io.ox/calendar/edit/main'], function (userAPI, groupAPI, resourceAPI, contactAPI, ext, tmpl, gt) {

    'use strict';


    // take util function
    var convertImage = function (dir, value) {
        var url = '';
        if (value && _.isString(value) && value.length > 1) {
            url = value.replace(/^\/ajax/, ox.apiRoot);
            return url;
        } else {
            return '';
        }
    };
    // take util function
    var convertImageStyle = function (dir, value) {
        var url = '';
        if (value && _.isString(value) && value.length > 1) {
            url = value.replace(/^\/ajax/, ox.apiRoot);
            return 'background-image: url("' + url + '");';
        } else {
            return '';
        }
    };


    var ParticipantModel = Backbone.Model.extend({
        TYPE_USER: 1,
        TYPE_USER_GROUP: 2,
        TYPE_RESOURCE: 3,
        TYPE_RESOURCE_GROUP: 4,
        TYPE_EXTERNAL_USER: 5,
        TYPE_DISTLIST_USER_GROUP: 6,

        defaults: {
            display_name: '...',
            email1: '',
            image1_url: ''
        },
        fetch: function (options) {
            var self = this,
                df = new $.Deferred();


            switch (self.get('type')) {
            case self.TYPE_USER:
                //fetch user contact
                userAPI.get({id: self.get('id')}).done(function (user) {
                    self.set(user);
                    self.trigger('change', self);
                    df.resolve();
                });
                break;
            case self.TYPE_USER_GROUP:
                //fetch user group
                groupAPI.get({id: self.get('id')}).done(function (group) {
                    self.set(group);
                    self.trigger('change', self);
                    df.resolve();
                });
                break;
            case self.TYPE_RESOURCE:
                resourceAPI.get({id: self.get('id')}).done(function (resource) {
                    self.set(resource);
                    self.trigger('change', self);
                    df.resolve();
                });
                break;
            case self.TYPE_RESOURCE_GROUP:
                self._data = {display_name: 'resource group'};
                self.trigger('change', self);
                df.resolve();
                break;
            case self.TYPE_EXTERNAL_USER:
                contactAPI.search(self.get('mail')).done(function (results) {
                    if (results && results.length > 0) {
                        var itemWithImage = _(results).find(function (item) {
                            return item.image1_url && item.image1_url !== '';
                        });
                        itemWithImage = itemWithImage || results[0]; // take with image or just the first one
                        self.set({
                            display_name: itemWithImage.display_name,
                            email1: self.get('mail') || self.get('email1'),
                            image1_url: itemWithImage.image1_url
                        });
                    } else {
                        self.set({display_name: self.get('display_name').replace(/(^["'\\\s]+|["'\\\s]+$)/g, ''), email1: self.get('mail') || self.get('email1')});
                    }
                    self.trigger('change', self);
                    df.resolve();
                });
                break;
            case self.TYPE_DISTLIST_USER_GROUP:
                //fetch user group
                groupAPI.get({id: self.get('id')}).done(function (group) {
                    self.set(group);
                    self.trigger('change', self);
                    df.resolve();
                });
                break;
            default:
                self.set({display_name: 'unknown'});
                self.trigger('change', self);
                df.resolve();
                break;
            }

            return df;
        }
    });


    var ParticipantsCollection = Backbone.Collection.extend({
        model: ParticipantModel
    });

    //just a single participant
    var ParticipantView = Backbone.View.extend({
        tagName: 'div',
        className: 'edit-appointment-participant span6', //'edit-appointment-participant',
        _modelBinder: undefined,
        initialize: function (options) {
            var self = this;
            self.$el.attr('data-cid', self.model.cid);

            // rerender on model change
            //self.model.on('change', _.bind(self.render, self));
            this._modelBinder = new Backbone.ModelBinder();

            // FIXME: polymorph model so fetch on initialize, may be it's not a good idea
            if (options.prefetched !== true) {
                self.model.fetch();
            }
        },
        render: function () {
            switch (this.model.get('type')) {
            case this.model.TYPE_USER:
                return this.renderUser();
            case this.model.TYPE_USER_GROUP:
                return this.renderUserGroup();
            case this.model.TYPE_RESOURCE:
                return this.renderResource();
            case this.model.TYPE_EXTERNAL_USER:
                return this.renderExternalUser();
            case this.model.TYPE_DISTLIST_USER_GROUP:
                return this.renderDistlistUserGroup();
            }

            return this;
        },
        renderUser: function () {
            var self = this;

            this.$el.empty().append(tmpl.render('io.ox/calendar/edit/particpant/user', {}));
            var bindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');

            if (Modernizr.backgroundsize) {
                bindings.image1_url =  [{selector: '[data-property="image1_url"]', elAttribute: 'style', converter: convertImageStyle}];
            } else {
                this.$('[data-property="image1_url"]').append($('<img>').css({width: '100%'/*, height: '100%'*/}));
                bindings.image1_url =  [{selector: '[data-property="image1_url"] > img', elAttribute: 'src', converter: convertImage}];
            }

            this._modelBinder.bind(self.model, this.el, bindings);
            return self;
        },
        renderUserGroup: function () {
            var self = this;

            this.$el.empty().append(tmpl.render('io.ox/calendar/edit/particpant/usergroup', {strings: {
                GROUP: gt('Group')
            }}));

            var bindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
            if (Modernizr.backgroundsize) {
                bindings.image1_url =  [{selector: '[data-property="image1_url"]', elAttribute: 'style', converter: convertImageStyle}];
            } else {
                this.$('[data-property="image1_url"]').append($('<img>').css({width: '100%'/*, height: '100%'*/}));
                bindings.image1_url =  [{selector: '[data-property="image1_url"] > img', elAttribute: 'src', converter: convertImage}];
            }

            this._modelBinder.bind(self.model, this.el, bindings);
            return self;
        },
        renderResource: function () {
            var self = this;

            this.$el.empty().append(tmpl.render('io.ox/calendar/edit/particpant/resource', {strings: {
                RESOURCE: gt('Resource')
            }}));

            var bindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
            if (Modernizr.backgroundsize) {
                bindings.image1_url =  [{selector: '[data-property="image1_url"]', elAttribute: 'style', converter: convertImageStyle}];
            } else {
                this.$('[data-property="image1_url"]').append($('<img>').css({width: '100%'/*, height: '100%'*/}));
                bindings.image1_url =  [{selector: '[data-property="image1_url"] > img', elAttribute: 'src', converter: convertImage}];
            }

            this._modelBinder.bind(self.model, this.el, bindings);
            return self;
        },
        renderExternalUser: function () {
            var self = this;

            this.$el.empty().append(tmpl.render('io.ox/calendar/edit/particpant/externaluser', {}));
            var bindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');

            if (Modernizr.backgroundsize) {
                bindings.image1_url =  [{selector: '[data-property="image1_url"]', elAttribute: 'style', converter: convertImageStyle}];
            } else {
                this.$('[data-property="image1_url"]').append($('<img>').css({width: '100%'/*, height: '100%'*/}));
                bindings.image1_url =  [{selector: '[data-property="image1_url"] > img', elAttribute: 'src', converter: convertImage}];
            }
            this._modelBinder.bind(self.model, this.el, bindings);
            return self;
        },
        renderDistlistUserGroup: function () {
            var self = this;

            this.$el.empty().append(tmpl.render('io.ox/calendar/edit/particpant/distlistusergroup', {strings: {
                DISTLISTGROUP: gt('Distribution list')
            }}));

            var bindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
            if (Modernizr.backgroundsize) {
                bindings.image1_url =  [{selector: '[data-property="image1_url"]', elAttribute: 'style', converter: convertImageStyle}];
            } else {
                this.$('[data-property="image1_url"]').append($('<img>').css({width: '100%'/*, height: '100%'*/}));
                bindings.image1_url =  [{selector: '[data-property="image1_url"] > img', elAttribute: 'src', converter: convertImage}];
            }

            this._modelBinder.bind(self.model, this.el, bindings);
            return self;
        },
        close: function () {
            this.remove();
        }

    });



    // just a collection of a participant view
    var ParticipantsView = Backbone.View.extend({
        tagName: 'div',
        className: 'edit-appointment-participants',
        _collectionBinder: undefined,
        events: {
            'click .person-link': 'onClickPersonLink',
            'click .remove': 'onClickRemove',
            'mouseover .remove': 'onMouseOverRemove',
            'mouseout .remove': 'onMouseOutRemove'
        },
        initialize: function (options) {
            var viewCreator = function (model) {
                return new ParticipantView({model: model});
            };
            var elManagerFactory = new Backbone.CollectionBinder.ViewManagerFactory(viewCreator);
            this._collectionBinder = new Backbone.CollectionBinder(elManagerFactory);

            this._collectionBinder.on('elCreated', _.bind(this.updateCSS, this));
            this._collectionBinder.on('elRemoved', _.bind(this.updateCSS, this));
        },
        render: function () {
            this.$el.empty();
            this._collectionBinder.bind(this.collection, this.$el);
            return this;
        },
        updateCSS: function () {
            this.$el.find(':nth-child(even)').removeClass('odd').addClass('even');
            this.$el.find(':nth-child(odd)').removeClass('even').addClass('odd');
        },
        onAdd: function (model) {
            this.collection.add(model);
        },

        onClickRemove: function (evt) {
            var self = this,
                item = $(evt.target).parents('.edit-appointment-participant').get(0),
                itemid = $(item).attr('data-cid');

            self.collection.remove(self.collection.getByCid(itemid));
        },
        onMouseOverRemove: function (e) {
            $(e.target).find('i').addClass('icon-white');
        },
        onMouseOutRemove: function (e) {
            $(e.target).find('i').removeClass('icon-white');
        },

        onClickPersonLink: function (evt) {
            var self = this,
                item = $(evt.target).parents('.edit-appointment-participant').get(0),
                itemid = $(item).attr('data-cid');

            var obj = self.collection.getByCid(itemid);

            if (obj.get('type') !== 5) { // no external
                evt.data = {id: obj.get('id'), email1: obj.get('email1')};
            } else {
                evt.data = {email1: obj.get('email1'), display_name: obj.get('display_name')};
            }
            ext.point('io.ox/core/person:action').each(function (ext) {
                _.call(ext.action, evt.data, evt);
            });
        }
    });

    return {
        ItemView: ParticipantView,
        CollectionView: ParticipantsView,
        Model: ParticipantModel,
        Collection: ParticipantsCollection
    };
});
