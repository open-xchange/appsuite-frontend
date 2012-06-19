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

define('io.ox/calendar/edit/view-participant',
      ['io.ox/calendar/edit/model-participant',
       'dot!io.ox/calendar/edit/common.html',
       'gettext!io.ox/calendar/edit/main'], function (ParticipantModel, tmpl, gt) {

    'use strict';

    //just a single participant
    var ParticipantView = Backbone.View.extend({
        tagName: 'div',
        className: 'edit-appointment-participant span6', //'edit-appointment-participant',
        _modelBinder: undefined,
        initialize: function () {
            var self = this;
            self.$el.attr('data-cid', self.model.cid);

            // rerender on model change
            //self.model.on('change', _.bind(self.render, self));
            this._modelBinder = new Backbone.ModelBinder();

            // FIXME: polymorph model so fetch on initialize, may be it's not a good idea
            self.model.fetch();
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
            }


        },
        renderUser: function () {
            var self = this;

            this.$el.empty().append(tmpl.render('io.ox/calendar/edit/particpant/user', {}));

            // take util function
            var convertImage = function (dir, value) {
                var url = '';
                if (value && _.isString(value) && value.length > 1) {
                    url = value.replace(/^\/ajax/, ox.apiRoot);
                } else {
                    url = ox.base + '/apps/themes/default/dummypicture.png';
                }

                return 'background: url("' + url + '");';
            };
            var bindings = {
                display_name: '.person-link',
                image1_url: [{selector: '.contact-image', elAttribute: 'style', converter: convertImage}],
                email1: '.email'
            };

            this._modelBinder.bind(self.model, this.el, bindings);
            return self;
        },
        renderUserGroup: function () {
            var self = this;

            this.$el.empty().append(tmpl.render('io.ox/calendar/edit/particpant/usergroup', {strings: {
                GROUP: gt('Group')
            }}));

            // take util function
            var convertImage = function (dir, value) {
                var url = '';
                if (value) {
                    url = value.replace(/^\/ajax/, ox.apiRoot);
                } else {
                    url = ox.base + '/apps/themes/default/dummypicture_group.png';
                }

                return 'background: url("' + url + '");';
            };
            var bindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
            bindings = _(bindings).extend({
                image1_url: [{selector: '[data-property="image1_url"]', elAttribute: 'style', converter: convertImage}]
            });

            this._modelBinder.bind(self.model, this.el, bindings);
            return self;
        },
        renderResource: function () {
            var self = this;

            this.$el.empty().append(tmpl.render('io.ox/calendar/edit/particpant/resource', {strings: {
                RESOURCE: gt('Resource')
            }}));

            // take util function
            var convertImage = function (dir, value) {
                var url = '';
                if (value) {
                    url = value.replace(/^\/ajax/, ox.apiRoot);
                } else {
                    url = ox.base + '/apps/themes/default/dummypicture_resource.png';
                }

                return 'background: url("' + url + '");';
            };

            var bindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
            bindings = _(bindings).extend({
                image1_url: [{selector: '[data-property="image1_url"]', elAttribute: 'style', converter: convertImage}]
            });

            this._modelBinder.bind(self.model, this.el, bindings);
            return self;
        },
        renderExternalUser: function () {
            var self = this;

            this.$el.empty().append(tmpl.render('io.ox/calendar/edit/particpant/externaluser', {}));

            // take util function
            var convertImage = function (dir, value) {
                var url = '';
                if (value && _.isString(value) && value.length > 1) {
                    url = value.replace(/^\/ajax/, ox.apiRoot);
                } else {
                    url = ox.base + '/apps/themes/default/dummypicture.png';
                }

                return 'background: url("' + url + '");';
            };
            console.log('render:', this);
            var bindings = {
                display_name: '.person-link',
                image1_url: [{selector: '.contact-image', elAttribute: 'style', converter: convertImage}],
                email1: '.email'
            };

            this._modelBinder.bind(self.model, this.el, bindings);
            return self;
        },
        close: function () {
            this.remove();
        }

    });

    return ParticipantView;
});

