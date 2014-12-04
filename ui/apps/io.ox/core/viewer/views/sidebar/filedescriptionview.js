
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
    'io.ox/core/viewer/eventdispatcher',
    'io.ox/files/api',
    'gettext!io.ox/core/viewer'
], function (EventDispatcher, FilesAPI, gt) {

    'use strict';

    /**
     * The FileDescriptionView is intended as a sub view of the SidebarView and
     * is responsible for displaying the file description.
     */
    var FileDescriptionView = Backbone.View.extend({

        className: 'viewer-filedescription',

        events: {
            'click #edit-button': 'onStartEdit',
            'click #description-label': 'onStartEdit',
            'blur #description-text': 'onStopEdit'
        },

        onStartEdit: function () {
            console.info('FileDescriptionView.onStartEdit()');
            this.setDescriptionString(this.descriptionString);
            this.descriptionLabel.addClass('editmode');
            this.descriptionTextArea.addClass('editmode').focus();
        },

        onStopEdit: function () {
            console.info('FileDescriptionView.onStopEdit()');
            this.descriptionLabel.removeClass('editmode');
            this.descriptionTextArea.removeClass('editmode');

            this.saveDescription(this.descriptionTextArea.val());
        },

        initialize: function () {
            //console.info('FileDescriptionView.initialize()');
            this.$el.on('dispose', this.dispose.bind(this));

            this.id = null;
            this.folderId = null;
            this.descriptionString = '';
            this.descriptionLabel = null;
            this.descriptionTextArea = null;
        },

        /**
         * Sets the description to the label and text area
         */
        setDescriptionString: function (description) {
            var labelString;

            this.descriptionString = (_.isString(description)) ? description : '';

            if (this.descriptionLabel) {
                labelString = (this.descriptionString.length > 0) ? this.descriptionString : gt('Add a description');
                this.descriptionLabel.text(labelString);
            }
            if (this.descriptionTextArea) {
                this.descriptionTextArea.val(this.descriptionString);
            }
        },

        /**
         * Updates the file with the new description
         */
        saveDescription: function (description) {

            description = (_.isString(description)) ? description : '';
            if (description === this.descriptionString) { return; }

            this.descriptionLabel.text(gt('Saving...'));

            FilesAPI.update({
                id: this.id,
                folder_id: this.folderId,
                description: description
            })
            .done(function (file) {
                console.info('FilesAPI.update() ok ', file);
                this.setDescriptionString(file && file.description);

            }.bind(this))
            .fail(function (err) {
                console.info('FilesAPI.update() error ', err);
                this.setDescriptionString(this.descriptionString);

            }.bind(this));
        },

        render: function (data) {
            console.info('FileDescriptionView.render() ', data);

            var panel, panelHeader, panelBody;

            this.id = data && data.model && data.model.get('id');
            this.folderId = data && data.model && data.model.get('folderId');

            if (!this.id || !this.folderId) { return this; }

            panel = $('<div>').addClass('panel panel-default');
            panelHeader = $('<div>').addClass('panel-heading');
            panelHeader.append($('<h3>').addClass('panel-title').text(gt('Description')));
            panelHeader.append($('<a>', { id: 'edit-button', href: '#', role: 'button', tabindex: 1 }).addClass('panel-heading-button').append($('<i>').addClass('fa fa-pencil')));

            this.descriptionLabel = $('<span>', { id: 'description-label' });
            this.descriptionTextArea = $('<textarea>', { id: 'description-text' });

            panelBody = $('<div>').addClass('panel-body')
                .append(($('<div>').addClass('row'))
                        .append(($('<div>').addClass('col-xs-12 col-md-12 description'))
                                .append(this.descriptionLabel, this.descriptionTextArea)));

            // get description
            FilesAPI.get({ id: this.id, folder_id: this.folderId })
            .done(function (file) {
                console.info('FilesAPI.get() ok ', file);
                this.setDescriptionString(file && file.description);

            }.bind(this))
            .fail(function (err) {
                console.info('FilesAPI.get() error ', err);
                this.setDescriptionString('');

            }.bind(this));

            panel.append(panelHeader, panelBody);
            this.$el.empty().append(panel);
            return this;
        },

        dispose: function () {
            console.info('FileDescriptionView.dispose()');

            this.stopListening();
            return this;
        }
    });

    return FileDescriptionView;
});
