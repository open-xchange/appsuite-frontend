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
      ['text!io.ox/calendar/edit/tpl/participant.tpl'], function (participantTemplate) {

    'use strict';

    //just a single participant
    var ParticipantView = Backbone.View.extend({
        tagName: 'li',
        className: 'edit-appointment-participant',
        _modelBinder: undefined,
        initialize: function () {
            var self = this;
            self.template = doT.template(participantTemplate);
            self.$el.attr('data-cid', self.model.cid);

            // rerender on model change
            //self.model.on('change', _.bind(self.render, self));
            this._modelBinder = new Backbone.ModelBinder();

            // FIXME: polymorph model so fetch on initialize, may be it's not a good idea
            self.model.fetch();
        },
        render: function () {
            var self = this;

            this.$el.empty().append(participantTemplate);

            // take util function
            var convertImage = function (dir, value) {
                var url = '';
                if (value) {
                    url = value.replace(/^\/ajax/, ox.apiRoot);
                } else {
                    url = '';
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
        }
    });

    return ParticipantView;
});
