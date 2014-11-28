/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/toolbarview', [
    'io.ox/core/viewer/eventdispatcher',
    'gettext!io.ox/core'
], function (EventDispatcher, gt) {

    'use strict';

    /**
     * The ToolbarView is responsible for displaying the top toolbar,
     * with all its functions buttons/widgets.
     */
    var ToolbarView = Backbone.View.extend({

        className: 'viewer-toolbar',

        events: {
            'click': 'onClose'
        },

        initialize: function () {
            //console.info('ToolbarView.initialize()', options);
            this.$el.on('dispose', this.dispose.bind(this));

            this.listenTo(EventDispatcher, 'viewer:displayeditem:change', function (data) {
                //console.warn('SidebarbarView viewer:displayeditem:change', data);
                this.render(data);
            });

            this.render();
        },

        onClose: function () {
            //console.info('ToolbarView.onClose()');
            this.trigger('close');
        },

        render: function (data) {
            //console.info('ToolbarView.render()');
            var toolbar = this.$el,
                filenameLabel = $('<div>'),
                closeViewerButton = $('<button type="button" class="btn btn-link close-viewer">');
            closeViewerButton.append(
                $('<i class="fa fa-times" aria-hidden="true" >'),
                $('<span class="sr-only">').text(gt('Close'))
            );

            if (data && data.model) {
                filenameLabel.text(data.model.get('filename') || '');
            }

            toolbar.empty().append(filenameLabel, closeViewerButton);
            return this;
        },

        dispose: function () {
            //console.info('ToolbarView.dispose()');
            this.stopListening();
            return this;
        }

    });

    return ToolbarView;

});
