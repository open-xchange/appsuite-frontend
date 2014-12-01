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
            'click button#viewer-close': 'onClose',
            'click button#viewer-toggle-sidebar': 'onToggleSidebar'
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

        onToggleSidebar: function () {
            //console.info('ToolbarView.onClose()');
            this.$el.find('#viewer-toggle-sidebar').toggleClass('active');
            EventDispatcher.trigger('viewer:toggle:sidebar');
        },

        render: function (data) {
            //console.info('ToolbarView.render()');
            var toolbar = this.$el,
                filenameLabel = $('<div>'),
                rightWrapper = $('<div class="right-wrapper">'),
                closeViewerButton = $('<button id="viewer-close" type="button" class="btn btn-link">').append(
                    $('<i class="fa fa-times" aria-hidden="true" >'),
                    $('<span class="sr-only">').text(gt('Close'))
                ),
                toggleSidebarButton = $('<button id="viewer-toggle-sidebar" type="button" class="btn btn-link">').append(
                    $('<i class="fa fa-info-circle" aria-hidden="true" >'),
                    $('<span class="sr-only">').text(gt('Toggle detail sidebar'))
                );

            rightWrapper.append(toggleSidebarButton, closeViewerButton);

            if (data && data.model) {
                filenameLabel.text(data.model.get('filename') || '');
            }

            toolbar.empty().append(filenameLabel, rightWrapper);

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
