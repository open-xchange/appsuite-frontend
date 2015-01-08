
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
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/viewer/eventdispatcher',
    'io.ox/files/api',
    'gettext!io.ox/core/viewer'
], function (Ext, ActionsPattern, EventDispatcher, FilesAPI, gt) {

    'use strict';

    var POINT = 'io.ox/core/viewer/sidebar/description';

    // Extensions for the file description view
    Ext.point(POINT).extend({
        index: 200,
        id: 'description',
        draw: function (baton) {
            //console.info('FileDescriptionView.draw()');
            var panel, panelHeader, panelBody, descriptionLabel, descriptionTextArea,
                labelString,
                model = baton && baton.model,
                description = model && model.get('description');

            if (!model) { return; }

            baton.$el.empty();

            if (!_.isString(description)) {
                // get description
                FilesAPI.get({
                    id: model.get('id'),
                    folder_id: model.get('folderId')
                })
                .done(function (file) {
                    //console.info('FilesAPI.get() ok ', file);
                    model.set('description', (file && _.isString(file.description) ? file.description : ''));
                })
                .fail(function (/*err*/) {
                    //console.info('FilesAPI.get() error ', err);
                });

            } else {
                // render panel
                labelString = (description.length > 0) ? description : gt('Add a description');

                panel = $('<div>').addClass('panel panel-default');
                panelHeader = $('<div>').addClass('panel-heading');
                panelHeader.append($('<h3>').addClass('panel-title').text(gt('Description')));
                //panelHeader.append($('<a>', { id: 'edit-button', href: '#', role: 'button', tabindex: 1 }).addClass('panel-heading-button btn').append($('<i>').addClass('fa fa-pencil')));
                Ext.point(POINT + '/edit').invoke('draw', panelHeader, baton);

                descriptionLabel = $('<span>').addClass('description description-label').text(labelString);
                descriptionTextArea = $('<textarea>').addClass('description description-text').val(description);

                panelBody = $('<div>').addClass('panel-body')
                .append(($('<div>').addClass('row'))
                        .append(($('<div>').addClass('col-xs-12 col-md-12'))
                                .append(descriptionLabel, descriptionTextArea)));

                panel.append(panelHeader, panelBody);
                baton.$el.append(panel);
            }
        }
    });

    // Extensions for the file description edit button
    Ext.point(POINT + '/edit').extend({
        index: 10,
        id: 'description-edit',
        ref: 'io.ox/files/actions/edit-description',
        draw: function (baton) {
            //console.info('description-edit.draw() ', baton);
            var actionBaton, buttonNode;

            actionBaton = Ext.Baton({ data: {
                id: baton.model.get('id'),
                folder_id: baton.model.get('folderId'),
                description: baton.model.get('description')
            }});

            buttonNode = $('<a>', { id: 'edit-button', href: '#', role: 'button', tabindex: 1 }).addClass('panel-heading-button btn')
                    .append($('<i>').addClass('fa fa-pencil'));

            buttonNode.on('click', function () {
                ActionsPattern.invoke('io.ox/files/actions/edit-description', null, actionBaton);
            });

            this.append(buttonNode);
        }
    });

    /**
     * The FileDescriptionView is intended as a sub view of the SidebarView and
     * is responsible for displaying the file description.
     */
    var FileDescriptionView = Backbone.View.extend({

        className: 'viewer-filedescription',

        events: {
            //'click #edit-button': 'onStartEdit',
            'click .description-label': 'onStartEdit'
            //'blur .description-text': 'onStopEdit',
            //'keyup': 'onKeyUp'
        },

        onStartEdit: function () {
            //console.info('FileDescriptionView.onStartEdit()');
            this.startEdit();
        },

        onStopEdit: function () {
            //console.info('FileDescriptionView.onStopEdit()');
            this.stopEdit();
            this.saveDescription(this.$el.find('.description-text').first().val());
        },

        onKeyUp: function (e) {
            //console.info('event type: ', e.type, 'keyCode: ', e.keyCode, 'charCode: ', e.charCode);

            switch (e.which || e.keyCode) {
            case 27:
                this.stopEdit();
                this.resetDescriptionString();
                break;
            }
        },

        onModelChangeDescription: function (model) {
            //console.info('onModelChangeDescription() ', model);
            this.render({ model: model });
        },

        initialize: function () {
            //console.info('FileDescriptionView.initialize()');
            this.$el.on('dispose', this.dispose.bind(this));
            this.model = null;
        },

        /**
         * Switch description to texarea
         */
        startEdit: function () {
            if (!this.model) { return; }

            var baton = Ext.Baton({ data: {
                id: this.model.get('id'),
                folder_id: this.model.get('folderId'),
                description: this.model.get('description')
            }});

            ActionsPattern.invoke('io.ox/files/actions/edit-description', null, baton);

            // Inplace edit
            /*var descriptionTextArea = this.$el.find('.description-text').first();

            this.$el.find('.description').addClass('editmode');

            // set initial textarea height
            if (descriptionTextArea.height() < descriptionTextArea.prop('scrollHeight')) {
                descriptionTextArea.height('auto');
                descriptionTextArea.height(descriptionTextArea.prop('scrollHeight'));
            }

            descriptionTextArea.focus();*/
        },

        /**
         * Switch description to label
         */
        stopEdit: function () {
            this.$el.find('.description').removeClass('editmode');
        },

        /**
         * Resets the label and text area to the previous description
         */
        resetDescriptionString: function () {
            var description = this.model && this.model.get('description') || '',
                labelString = (description.length > 0) ? description : gt('Add a description');

            this.$el.find('.description-label').first().text(labelString);
            this.$el.find('.description-text').first().val(description);
        },

        /**
         * Updates the file with the new description
         */
        saveDescription: function (description) {

            description = (_.isString(description)) ? description : '';
            if (description === this.model.get('description')) { return; }

            //this.descriptionLabel.text(gt('Saving...'));

            FilesAPI.update({
                id: this.model.get('id'),
                folder_id: this.model.get('folderId'),
                description: description
            })
            .done(function (file) {
                //console.info('FilesAPI.update() ok ', file);
                this.model.set('description', (file && _.isString(file.description) ? file.description : ''));

            }.bind(this))
            .fail(function (/*err*/) {
                //console.info('FilesAPI.update() error ', err);
            }.bind(this));
        },

        render: function (data) {
            //console.info('FileDescriptionView.render() ', data);
            if (!data || !data.model) { return this; }

            var description = this.$el,
                baton = Ext.Baton({ $el: description, model: data.model, data: data.model.get('origData') });

            // remove listener from previous model
            if (this.model) {
                this.stopListening(this.model, 'change:description');
            }

            // add listener to new model
            this.model = data.model;
            this.listenTo(this.model, 'change:description', this.onModelChangeDescription);

            Ext.point('io.ox/core/viewer/sidebar/description').invoke('draw', description, baton);
            return this;
        },

        dispose: function () {
            //console.info('FileDescriptionView.dispose()');

            this.stopListening();
            return this;
        }
    });

    return FileDescriptionView;
});
