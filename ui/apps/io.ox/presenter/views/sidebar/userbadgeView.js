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
define('io.ox/presenter/views/sidebar/userbadgeview', [
    'io.ox/backbone/disposable',
    'io.ox/contacts/api',
    'gettext!io.ox/presenter'
], function (DisposableView, ContactsAPI, gt) {

    var userbadgeView = DisposableView.extend({

        tagName: 'li',

        className: 'participant',

        initialize: function (options) {
            _.extend(this, options);

            this.defaultPictureSize = 40;
            this.pictureSize = _.device('retina') ? this.defaultPictureSize * 2 : this.defaultPictureSize;

            this.on('dispose', this.disposeView.bind(this));
        },

        render: function () {

            var pictureColumn = $('<div class="participant-picture-col">'),
                picture = $('<div class="picture">'),
                nameColumn = $('<div class="participant-name-col">'),
                name = $('<a class="name halo-link">').text(this.participant.userDisplayName),
                roleColumn = $('<div class="participant-role-col">'),
                presenterId = this.app.rtModel.get('presenterId'),
                presenterIcon = $('<i class="fa fa-desktop">').attr('title', gt('Presenter'));

            ContactsAPI.pictureHalo(
                picture,
                {
                    internal_userid: this.participant.id
                },
                {
                    width: this.pictureSize,
                    height: this.pictureSize,
                    scaleType: 'cover'
                }
            );

            pictureColumn.append(picture);
            nameColumn.append(name);
            if (this.participant.userId === presenterId) {
                roleColumn.append(presenterIcon);
            }

            this.$el.append(pictureColumn, nameColumn, roleColumn);

            return this;
        },

        disposeView: function () {
            //console.info('UserbadgeView.disposeView()');
        }
    });

    return userbadgeView;
});
