/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/presenter/views/sidebar/participantsview', [
    'io.ox/backbone/disposable',
    'io.ox/presenter/views/sidebar/userbadgeview',
    'gettext!io.ox/presenter'
], function (DisposableView, UserbadgeView, gt) {

    var participantsView = DisposableView.extend({

        className: 'presenter-sidebar-section',

        initialize: function (options) {
            //console.warn('ParticipantsView.initialize()');
            _.extend(this, options);

            this.on('dispose', this.disposeView.bind(this));
            this.listenTo(this.presenterEvents, 'presenter:participants:change', this.render);
        },

        render: function () {
            //console.warn('ParticipantsView.render()');

            var sectionHeading = $('<div class="sidebar-section-heading">'),
                headline = $('<h3 class="sidebar-section-headline">').text('Participants'),
                sectionBody = $('<div class="sidebar-section-body">'),
                participantsList = $('<ul class="participants-list">');

            var participants = this.app.rtModel.get('participants');

            _.each(participants, function (participant) {
                var userbadgeView = new UserbadgeView({ participant: participant, app: this.app });
                participantsList.append(userbadgeView.render().el);
            }.bind(this));

            if (participants.length === 0) {
                var notification = $('<li>').text(gt('There are currently no participants.'));
                participantsList.append(notification);
            }

            sectionHeading.append(headline);
            sectionBody.append(participantsList);
            this.$el.empty().append(sectionHeading, sectionBody);

            return this;
        },

        disposeView: function () {
            //console.info('ParticipantsView.disposeView()');
        }

    });

    return participantsView;
});
