
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
    'io.ox/backbone/disposable',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/viewer/eventdispatcher',
    'io.ox/files/api',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core/viewer'
], function (DisposableView, Ext, ActionsPattern, EventDispatcher, FilesAPI, Util, gt) {

    'use strict';

    var POINT = 'io.ox/core/viewer/sidebar/description';

    // Extensions for the file description view
    Ext.point(POINT).extend({
        index: 200,
        id: 'description',
        draw: function (baton) {
            var panel, panelHeading,
                model = baton && baton.model,
                origModel = model && model.get('origData'),
                description = model && model.get('description');

            this.empty();
            // mail and PIM attachments don't support file description
            if (!model || !model.isDriveFile()) {
                this.attr({ 'aria-hidden': 'true' }).addClass('hidden');
                return;
            }

            // a11y
            this.attr({ role: 'tablist', 'aria-hidden': 'false' }).removeClass('hidden');

            // render panel
            this.append(panel = Util.createPanelNode({ title: gt('Description') }));

            if (_.isString(description)) {
                Ext.point(POINT + '/text').invoke('draw', panel, Ext.Baton({ data: description }));

            } else {
                panelHeading = panel.find('.panel-heading');
                panelHeading.busy();
                // get description
                FilesAPI.get({
                    id: model.get('id'),
                    folder_id: model.get('folderId')
                })
                .done(function (file) {
                    //console.info('FilesAPI.get() ok ', file);
                    var description = (file && _.isString(file.description)) ? file.description : '';

                    model.set('description', description);
                    if (origModel instanceof Backbone.Model) {
                        origModel.set('description', description);
                    }
                })
                .fail(function (err) {
                    console.warn('FilesAPI.get() error ', err);
                })
                .always(function () {
                    panelHeading.idle();
                });
            }
        }
    });

    // Extensions for the file description text
    Ext.point(POINT + '/text').extend({
        index: 10,
        id: 'description-text',
        draw: function (baton) {
            var panelBody = this.find('.panel-body'),
                description = baton.data,
                labelString;

            panelBody.empty();
            if (!_.isString(description)) { return; }

            labelString = (description.length > 0) ? description : gt('Add a description');

            panelBody.append(
                $('<div>').append(
                    $('<div>', { tabindex: 1, title: gt('Description text'), 'aria-label': gt('Description text') }).addClass('description description-label' + ((description.length === 0) ? ' description-empty' : '')).text(labelString),
                    $('<textarea>').addClass('description description-text').val(description)
                )
            );
        }
    });

    // Extensions for the file description edit button
    Ext.point(POINT + '/edit').extend({
        index: 20,
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
    var FileDescriptionView = DisposableView.extend({

        className: 'viewer-filedescription',

        events: {
            'click .toggle-panel': 'onTogglePanel',
            'click .description-label': 'onStartEdit',
            'dblclick .description-label': 'onStartEdit',
            'keyup .description-label': 'onKeyUp'
            //'blur .description-text': 'onStopEdit'
        },

        onTogglePanel: function (event) {
            var panelBody = this.$el.find('.panel>.panel-body');
            event.preventDefault();

            if (panelBody.hasClass('panel-collapsed')) {
                // expand the panel
                panelBody.slideDown().removeClass('panel-collapsed');
            } else {
                // collapse the panel
                panelBody.slideUp().addClass('panel-collapsed');
            }
        },

        onStartEdit: function (event) {
            //console.info('FileDescriptionView.onStartEdit()');
            if (_.device('smartphone || tablet') || event.type === 'dblclick') {
                event.preventDefault();
                this.startEdit();
            }
        },

        onStopEdit: function () {
            //console.info('FileDescriptionView.onStopEdit()');
            this.stopEdit();
            this.saveDescription(this.$el.find('.description-text').first().val());
        },

        onKeyUp: function (event) {
            //console.info('event type: ', event.type, 'keyCode: ', event.keyCode, 'charCode: ', event.charCode);

            switch (event.which || event.keyCode) {
            case 13:
            case 32:
                this.startEdit();
                event.preventDefault();
                break;
            }
            /*case 27:
                this.stopEdit();
                this.resetDescriptionString();
                break;
            }*/
        },

        onModelChangeDescription: function (model) {
            //console.info('onModelChangeDescription() ', model);
            var panel = this.$el.find('.panel'),
                description = model.get('description');

            Ext.point(POINT + '/text').invoke('draw', panel, Ext.Baton({ data: description }));
        },

        initialize: function () {
            //console.info('FileDescriptionView.initialize()');
            this.on('dispose', this.disposeView.bind(this));
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

            var baton = Ext.Baton({ model: data.model, data: data.model.get('origData') });

            // remove listener from previous model
            if (this.model) {
                this.stopListening(this.model, 'change:description');
            }

            // add listener to new model
            this.model = data.model;
            this.listenTo(this.model, 'change:description', this.onModelChangeDescription);

            this.$el.attr({ role: 'tablist' });

            Ext.point('io.ox/core/viewer/sidebar/description').invoke('draw', this.$el, baton);
            return this;
        },

        disposeView: function () {
            //console.info('FileDescriptionView.disposeView()');
            this.model.off().stopListening();
            this.model = null;
            return this;
        }
    });

    return FileDescriptionView;
});
