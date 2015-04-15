
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
    'io.ox/core/viewer/util',
    'gettext!io.ox/core/viewer'
], function (DisposableView, Ext, ActionsPattern, EventDispatcher, Util, gt) {

    'use strict';

    var POINT = 'io.ox/core/viewer/sidebar/description';

    // Extensions for the file description view
    Ext.point(POINT).extend({
        index: 200,
        id: 'description',
        draw: function (baton) {
            var panel,
                model = baton && baton.model;

            this.empty();
            // mail and PIM attachments don't support file description
            if (!model || !model.isFile()) {
                this.attr({ 'aria-hidden': 'true' }).addClass('hidden');
                return;
            }
            // a11y
            this.attr({ role: 'tablist', 'aria-hidden': 'false' }).removeClass('hidden');

            // render panel
            this.append(panel = Util.createPanelNode({ title: gt('Description') }));
            Ext.point(POINT + '/text').invoke('draw', panel, Ext.Baton({ data: model.get('description') }));
        }
    });

    // Extensions for the file description text
    Ext.point(POINT + '/text').extend({
        index: 10,
        id: 'description-text',
        draw: function (baton) {
            var panelBody = this.find('.sidebar-panel-body'),
                description = baton.data,
                labelString;

            panelBody.empty();
            if (!_.isString(description)) {
                return;
            }
            labelString = (description.length > 0) ? description : gt('Add a description');

            panelBody.append(
                $('<div>', { tabindex: 1, title: gt('Description text'), 'aria-label': gt('Description text') }).addClass('description' + ((description.length === 0) ? ' description-empty' : '')).text(labelString)
            );
        }
    });

    /**
     * The FileDescriptionView is intended as a sub view of the SidebarView and
     * is responsible for displaying the file description.
     */
    var FileDescriptionView = DisposableView.extend({

        className: 'viewer-filedescription',

        events: {
            'click .description': 'onEdit',
            'dblclick .description': 'onEdit',
            'keyup .description': 'onKeyUp'
        },

        onEdit: function (event) {
            //console.info('FileDescriptionView.onEdit()');
            if (_.device('smartphone || tablet') || event.type === 'dblclick') {
                event.preventDefault();
                this.editDescription();
            }
        },

        onKeyUp: function (event) {
            //console.info('event type: ', event.type, 'keyCode: ', event.keyCode, 'charCode: ', event.charCode);
            switch (event.which || event.keyCode) {
            case 13:
            case 32:
                this.editDescription();
                event.preventDefault();
                break;
            }
        },

        onModelChangeDescription: function (model) {
            //console.info('FileDescriptionView.onModelChangeDescription() ', model);
            var panel = this.$el.find('.sidebar-panel'),
                description = model.get('description');

            Ext.point(POINT + '/text').invoke('draw', panel, Ext.Baton({ data: description }));
        },

        initialize: function () {
            //console.info('FileDescriptionView.initialize()', this.model);
            this.on('dispose', this.disposeView.bind(this));
        },

        render: function () {
            //console.info('FileDescriptionView.render()');
            if (!this.model) {
                return this;
            }
            // a11y
            this.$el.attr({ role: 'tablist' });
            // add model change listener
            this.listenTo(this.model, 'change:description', this.onModelChangeDescription);
            // draw
            var baton = Ext.Baton({ model: this.model, data: this.model.toJSON() });
            Ext.point('io.ox/core/viewer/sidebar/description').invoke('draw', this.$el, baton);

            return this;
        },

        /**
         * Invoke action to edit description
         */
        editDescription: function () {
            if (!this.model) {
                return;
            }
            ActionsPattern.invoke('io.ox/files/actions/edit-description', null, Ext.Baton({ data: this.model.toJSON() }));
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            //console.info('FileDescriptionView.disposeView()');
            if (this.model) {
                this.model.off().stopListening();
                this.model = null;
            }
        }
    });

    return FileDescriptionView;
});
