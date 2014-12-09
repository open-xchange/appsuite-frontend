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
define('io.ox/core/viewer/views/mainview', [
    'io.ox/core/viewer/views/toolbarview',
    'io.ox/core/viewer/views/displayerview',
    'io.ox/core/viewer/views/sidebarview',
    'io.ox/core/viewer/eventdispatcher',
    'less!io.ox/core/viewer/style'
], function (ToolbarView, DisplayerView, SidebarView, EventDispatcher) {

    'use strict';

    /**
     * The MainViewer is the base view for the OX Viewer.
     * This view imports, manage and  renders these children views:
     * - ToolbarView
     * - DisplayerView
     * - SidebarView
     */
    var MainView = Backbone.View.extend({

        className: 'io-ox-viewer abs',

        initialize: function (/*options*/) {
            //console.info('MainView.initialize()');
            this.$el.on('dispose', this.dispose.bind(this));

            this.toolbarView = new ToolbarView();
            this.displayerView = new DisplayerView({ collection: this.collection });
            this.sidebarView = new SidebarView();

            this.listenTo(this.toolbarView, 'close', function () {
                this.$el.remove();
            });

            this.listenTo(EventDispatcher, 'viewer:display:previous', this.onPreviousSlide);
            this.listenTo(EventDispatcher, 'viewer:display:next', this.onNextSlide);
            this.listenTo(EventDispatcher, 'viewer:toggle:sidebar', this.onToggleSidebar.bind(this));

            this.displayedFileIndex = 0;
            this.render();

            EventDispatcher.trigger('viewer:displayeditem:change', { index: this.displayedFileIndex, model: this.collection.at(this.displayedFileIndex) } );

            // listen to browser window resize
            $(window).on('resize.viewer', this.onWindowResize.bind(this));

        },

        render: function () {
            //console.info('MainView.render()');
            // append children views
            this.$el.append(
                this.toolbarView.render().el,
                this.displayerView.render().el,
                this.sidebarView.render().el
            );

            return this;
        },

        onPreviousSlide: function () {
            //console.warn('MainView.onPreviousSlide(), old index: ', this.displayedFileIndex);

            if (this.displayedFileIndex > 0) {
                this.displayedFileIndex--;

            } else {
                this.displayedFileIndex = this.collection.length - 1;
            }

            //console.warn('MainView.onPreviousSlide(), new index: ', this.displayedFileIndex);

            EventDispatcher.trigger('viewer:displayeditem:change', { index: this.displayedFileIndex, model: this.collection.at(this.displayedFileIndex) } );
        },

        onNextSlide: function () {
            //console.warn('MainView.onNextSlide(), old index: ', this.displayedFileIndex);

            if (this.displayedFileIndex < this.collection.length - 1) {
                this.displayedFileIndex++;

            } else {
                this.displayedFileIndex = 0;
            }

            //console.warn('MainView.onNextSlide(), new index: ', this.displayedFileIndex);

            EventDispatcher.trigger('viewer:displayeditem:change', { index: this.displayedFileIndex, model: this.collection.at(this.displayedFileIndex) } );
        },

        // refresh view sizes and broadcast window resize event
        onWindowResize: function () {
            //console.warn('MainView.onWindowResize()');
            this.refreshViewSizes();
            EventDispatcher.trigger('viewer:window:resize');
        },

        // eventually necessary actions after the sidebar button is toggled
        onToggleSidebar: function () {
            //console.warn('MainView.onToggleSidebar()');
            this.refreshViewSizes();
        },

        // recalculate view dimensions after e.g. window resize events
        refreshViewSizes: function () {
            //console.warn('MainView.refreshViewSizes()');
            var rightOffset = this.sidebarView.opened ? this.sidebarView.width : 0;
            this.displayerView.$el.css({ width: window.innerWidth - rightOffset });
        },

        dispose: function () {
            //console.info('MainView.dispose()');
            this.stopListening();
            this.toolbarView = null;
            this.displayerView = null;
            this.sidebarView = null;
            $(window).off('resize.viewer');
            return this;
        }
    });
    return MainView;
});
