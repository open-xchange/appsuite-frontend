/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/switchboard/views/jitsi-meeting', [
    'io.ox/backbone/views/disposable'
], function (DisposableView) {

    'use strict';

    var MeetingView = DisposableView.extend({

        className: 'conference-view zoom',

        events: {
            'click [data-action="copy-to-location"]': 'copyToLocation'
        },

        initialize: function (options) {
            this.model = new Backbone.Model({ type: 'jitsi', state: 'done', joinLink: '' });
            this.appointment = options.appointment;
            var props = this.getExtendedProps(),
                conference = props['X-OX-CONFERENCE'];
            this.model.set('joinLink', conference && conference.label === 'jitsi' ? conference.value : '');
            window.jitsiMeeting = this;
        },

        getExtendedProps: function () {
            return this.appointment.get('extendedProperties') || {};
        },

        getJoinLink: function () {
            return this.model && this.model.get('joinLink');
        },

        render: function () {
            this.createMeeting();
            this.renderDone();
            return this;
        },

        renderDone: function () {
            // show meeting
            var link = this.getJoinLink() || 'https://...';
            this.$el.append(
                $('<i class="fa fa-video-camera conference-logo">'),
                $('<div class="ellipsis">').append(
                    $('<b>').text('Link: '),
                    $('<a target="_blank" rel="noopener">').attr('href', link).text(link)
                ),
                $('<div>').append(
                    $('<a href="#" class="secondary-action" data-action="copy-to-location">')
                        .text('Copy to location field'),
                    $('<a href="#" class="secondary-action">')
                        .text('Copy to clipboard')
                        .attr('data-clipboard-text', link)
                        .on('click', false)
                )
            );
            var el = this.$('[data-clipboard-text]').get(0);
            require(['static/3rd.party/clipboard.min.js'], function (Clipboard) {
                new Clipboard(el);
            });
        },

        copyToLocation: function (e) {
            e.preventDefault();
            this.appointment.set('location', 'Jitsi Meeting: ' + this.getJoinLink());
        },

        createMeeting: function () {
            // get a UUID (5 times s4 means a quadrillion combinations; good enough ... probably)
            var joinLink = 'https://jitsi.ox-frontend.de/' + ['ox', s4(), s4(), s4(), s4(), s4()].join('-');
            var props = this.getExtendedProps();
            props = _.extend({}, props, { 'X-OX-CONFERENCE': { value: joinLink, label: 'jitsi' } });
            this.appointment.set('extendedProperties', props);
            this.model.set({ joinLink: joinLink, state: 'done' });
        }
    });

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1);
    }

    return MeetingView;
});
