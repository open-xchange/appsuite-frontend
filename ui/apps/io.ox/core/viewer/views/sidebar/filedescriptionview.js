
/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/sidebar/filedescriptionview', [
    'io.ox/core/viewer/views/sidebar/panelbaseview',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/files/api',
    'gettext!io.ox/core/viewer'
], function (PanelBaseView, Ext, actionsUtil, FilesAPI, gt) {

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

            panelBody.append(
                $('<div class="description">', { title: gt('Description text') }).text((description.length > 0) ? description : '-')
            );

            baton.view.hasWritePermissions().then(function () {
                if (!baton.view.isCurrentVersion()) { return; }

                panelBody.append(
                    $('<button type="button" class="btn btn-link description-button">').text(description.length > 0 ? gt('Edit description') : gt('Add a description'))
                );

            }).fail(function () {
                panelBody.parent().hide();
            });
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
            'dblclick .description': 'editDescription',
            'click button.description-button': 'editDescription'
        },

        onEdit: function (e) {

            var touchDevice = _.device('smartphone || tablet'),
                empty = !this.model.get('description');

            e.preventDefault();

            if (touchDevice || empty) this.editDescription();
        },

        initialize: function () {
            PanelBaseView.prototype.initialize.apply(this, arguments);
            if (this.model && this.model.isFile()) {
                this.setPanelHeader(gt('Description'));
                this.togglePanel(true);
                // attach event handlers
                this.listenTo(this.model, 'change:description', this.render);
                // listen to version display events
                this.listenTo(this.viewerEvents, 'viewer:display:version', this.onDisplayTempVersion.bind(this));

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
            this.hasWritePermissions().done(function (baton) {
                // Tested: false
                actionsUtil.invoke('io.ox/files/actions/edit-description', baton);
            });
        },

        hasWritePermissions: function () {
            if (!this.model) return $.Deferred().reject();
            return actionsUtil.checkAction('io.ox/files/actions/edit-description', this.model.toJSON());
        },

        isCurrentVersion: function () {
            return (this.model && this.model.get('current_version') !== false);
        },

        /**
         * Handles display temporary file version events.
         *
         * @param {Object} versionData
         *   The JSON representation of the version.
         */
        onDisplayTempVersion: function (versionData) {
            if (!versionData) { return; }

            this.model = new FilesAPI.Model(versionData);
            this.render();
        },

        /**
         * Destructor function of this view.
         */
        onDispose: function () {
            if (this.model) this.model = null;
        }
    });

    return FileDescriptionView;
});
