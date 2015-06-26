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
    'io.ox/contacts/api'
], function (DisposableView, ContactsAPI) {

    var userbadgeView = DisposableView.extend({

        tagName: 'li',

        className: 'participant',

        initialize: function (options) {
            //console.warn('UserbadgeView.initialize()');
            // TODO use real participant model
            _.extend(this, options);

            this.userId = 20;

            this.defaultPictureSize = 40;
            this.pictureSize = _.device('retina') ? this.defaultPictureSize * 2 : this.defaultPictureSize;

            this.on('dispose', this.disposeView.bind(this));
        },

        render: function () {
            //console.warn('UserbadgeView.render()');

            var pictureColumn = $('<div class="participant-picture-col">'),
                picture = $('<div class="picture">'),
                nameColumn = $('<div class="participant-name-col">'),
                name = $('<a class="name halo-link">').text(this.participant);

            ContactsAPI.pictureHalo(
                picture,
                {
                    internal_userid: this.userId
                },
                {
                    width: this.pictureSize,
                    height: this.pictureSize,
                    scaleType: 'cover'
                }
            );

            pictureColumn.append(picture);
            nameColumn.append(name);
            this.$el.append(pictureColumn, nameColumn);

            return this;
        },

        disposeView: function () {
            //console.info('UserbadgeView.disposeView()');
        }
    });

    return userbadgeView;
});
