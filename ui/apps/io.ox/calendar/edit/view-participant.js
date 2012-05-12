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
      ['io.ox/core/tk/view',
       'text!io.ox/calendar/edit/tpl/participant.tpl'], function (View, participantTemplate) {

    'use strict';

    //just a single participant
    var ParticipantView = View.extend({
        initialize: function () {
            var self = this;
            self.template = _.template(participantTemplate);
            self.el = $('<li>')
                .addClass('edit-appointment-participant')
                .attr('data-cid', self.model.cid);

            // rerender on model change
            self.model.on('change', _.bind(self.render, self));
        },
        render: function () {
            var self = this;

            var mydata = _.clone(self.model.get());
            console.log('render participant');
            console.log(self.model.collection);

            if (mydata.image1_url) {
                mydata.image1_url = mydata.image1_url.replace(/^\/ajax/, ox.apiRoot);
            } else {
                mydata.image1_url = '';
            }

            var renderedContent = self.template(mydata);
            self.el.empty().append(renderedContent);
            return self;
        }
    });

    return ParticipantView;
});
