
/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/sidebar/filedescriptionview', [
    'io.ox/core/viewer/views/sidebar/panelbaseview',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/actions',
    'gettext!io.ox/core/viewer'
], function (PanelBaseView, Ext, ActionsPattern, gt) {

    'use strict';

    var POINT = 'io.ox/core/viewer/sidebar/description';

    // Extensions for the file description text
    Ext.point(POINT + '/text').extend({
        index: 10,
        id: 'description-text',
        draw: function (baton) {

            var panelBody = this.find('.sidebar-panel-body'),
                description = baton.data;

            panelBody.empty();

            if (!_.isString(description)) return;

            if (description.length > 0) {
                panelBody.append(
                    $('<div class="description">', { title: gt('Description text') }).text(description)
                );
            } else {
                baton.view.hasWritePermissions().then(
                    function yep() {
                        panelBody.append(
                            $('<a href="#" class="description" role="button" tabindex="1">').text(gt('Add a description'))
                        );
                    },
                    function nope() {
                        panelBody.parent().hide();
                    }
                );
            }
        }
    });

    /**
     * The FileDescriptionView is intended as a sub view of the SidebarView and
     * is responsible for displaying the file description.
     */
    var FileDescriptionView = PanelBaseView.extend({

        className: 'viewer-filedescription',

        events: {
            'click .description': 'onEdit',
            'dblclick .description': 'onEdit',
            'keyup .description': 'onKeyUp'
        },

        onEdit: function (e) {

            var touchDevice = _.device('smartphone || tablet'),
                empty = !this.model.get('description'),
                doubleClick = e.type === 'dblclick';

            e.preventDefault();

            if (touchDevice || empty || doubleClick) this.editDescription();
        },

        onKeyUp: function (event) {
            //console.info('event type: ', event.type, 'keyCode: ', event.keyCode, 'charCode: ', event.charCode);
            switch (event.which || event.keyCode) {
            case 13:
            case 32:
                this.editDescription();
                event.preventDefault();
                break;
            // no default
            }
        },

        initialize: function () {
            PanelBaseView.prototype.initialize.apply(this, arguments);
            if (this.model && this.model.isFile()) {
                this.setPanelHeader(gt('Description'));
                this.togglePanel(true);
                // attach event handlers
                this.listenTo(this.model, 'change:description', this.render);
                this.on('dispose', this.disposeView.bind(this));
            } else {
                this.$el.hide();
            }
        },

        render: function () {
            if (this.model && this.model.isFile()) {
                Ext.point(POINT + '/text').invoke('draw', this.$el, Ext.Baton({ data: this.model.get('description'), view: this }));
            }
            return this;
        },

        /**
         * Invoke action to edit description
         */
        editDescription: function () {
            if (!this.model) return;
            var baton = Ext.Baton({ data: this.model.toJSON() });
            this.hasWritePermissions().done(function () {
                ActionsPattern.invoke('io.ox/files/actions/edit-description', null, baton);
            });
        },

        hasWritePermissions: function () {
            if (!this.model) return;
            return ActionsPattern.check('io.ox/files/actions/edit-description', [this.model.toJSON()]);
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            if (this.model) this.model = null;
        }
    });

    return FileDescriptionView;
});
