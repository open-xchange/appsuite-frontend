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

        events: {
            'keydown': 'onKeydown'
        },

        initialize: function (/*options*/) {
            //console.info('MainView.initialize()');
            // create children views
            this.toolbarView = new ToolbarView();
            this.displayerView = new DisplayerView({ collection: this.collection });
            this.sidebarView = new SidebarView();
            // clean Viewer element and all event handlers on viewer close
            this.listenTo(this.toolbarView, 'close', function () {
                this.$el.remove();
            });
            // listen to the Viewer event 'bus' for useful events
            this.listenTo(EventDispatcher, 'viewer:display:previous', this.onPreviousSlide);
            this.listenTo(EventDispatcher, 'viewer:display:next', this.onNextSlide);
            this.listenTo(EventDispatcher, 'viewer:toggle:sidebar', this.onToggleSidebar.bind(this));
            // handle DOM events
            $(window).on('resize.viewer', this.onWindowResize.bind(this));
            // clean stuff on dispose event from core/commons.js
            this.$el.on('dispose', this.dispose.bind(this));
            // display the selected file initially
            this.displayedFileIndex = this.collection.getStartIndex();
            var displayedData = { index: this.displayedFileIndex, model: this.collection.at(this.displayedFileIndex) };
            this.render(displayedData);
            // trigger item changed event initally for the first file
            EventDispatcher.trigger('viewer:displayeditem:change', displayedData);
        },

        /**
         * Renders this MainView with the supplied data model.
         *
         * @param {Object} data
         *  @param {Number} data.index
         *   The index of the model to render.
         *  @param {Object} data.model
         *   The model object itself.
         *
         * @returns {MainView}
         */
        render: function (data) {
            //console.warn('MainView.render()', data);
            if (!data) {
                console.error('Core.Viewer.MainView.render(): no file to render');
                return;
            }
            var self = this;
            // make this main view focusable and prevent focus from leaving the viewer.
            this.$el.attr('tabindex', -1);
            // append toolbar view
            this.$el.append(this.toolbarView.render(data).el);
            // append displayerView and sidebarView deferred, for preview image optimal height calculation
            _.defer(function () {
                self.$el.append(
                    self.displayerView.render(data).el,
                    self.sidebarView.render(data).el
                );
            });
            // focus the active slide initially
            self.displayerView.focusDisplayerDeferred();
            return this;
        },

        // handler for keyboard events on the viewer
        onKeydown: function (event) {
            //console.warn('MainView.onKeyDown() event type: ', event.type, 'keyCode: ', event.keyCode, 'charCode: ', event.charCode);
            var viewerRootEl = this.$el;
            // manual TAB traversal handler. 'Traps' TAB traversal inside the viewer root component.
            function tabHandler(event) {
                var tabableActions = viewerRootEl.find('[tabindex]:not([tabindex^="-"]):visible'),
                    tabableActionsCount = tabableActions.length;
                // quit immediately if no tabable actions are found
                if (tabableActionsCount === 0) { return; }
                var focusedElementIndex = tabableActions.index(document.activeElement),
                    traversalStep = event.shiftKey ? -1 : 1,
                    nextElementIndex = focusedElementIndex + traversalStep;
                // prevent default TAB traversal
                event.preventDefault();
                // traverse to prev/next action
                if (nextElementIndex >= tabableActionsCount) {
                    nextElementIndex = 0;
                }
                // focus next action candidate
                tabableActions.eq(nextElementIndex).focus();
            }
            switch (event.which || event.keyCode) {
                case 9: // TAB key
                    tabHandler(event);
                    break;
                case 27: // ESC key
                    var escTarget = $(event.target),
                        isDropdownMenuItem = escTarget.parents('.dropdown-menu').length > 0,
                        isDropdownToggler = escTarget.attr('data-toggle') === 'dropdown';
                    // close the viewer only if user is not on a dropdown menu, or a dropdown menu item
                    if ( !isDropdownMenuItem && !isDropdownToggler ) {
                        this.$el.remove();
                    }
                    break;
            }
        },

        onPreviousSlide: function () {
            //console.warn('MainView.onPreviousSlide(), old index: ', this.displayedFileIndex);
            if (this.displayedFileIndex > 0) {
                this.displayedFileIndex--;
            } else {
                this.displayedFileIndex = this.collection.length - 1;
            }
            //console.warn('MainView.onPreviousSlide(), new index: ', this.displayedFileIndex);
            EventDispatcher.trigger('viewer:displayeditem:change', {
                index: this.displayedFileIndex,
                model: this.collection.at(this.displayedFileIndex)
            } );
        },

        onNextSlide: function () {
            //console.warn('MainView.onNextSlide(), old index: ', this.displayedFileIndex);
            if (this.displayedFileIndex < this.collection.length - 1) {
                this.displayedFileIndex++;
            } else {
                this.displayedFileIndex = 0;
            }
            //console.warn('MainView.onNextSlide(), new index: ', this.displayedFileIndex);
            EventDispatcher.trigger('viewer:displayeditem:change', {
                index: this.displayedFileIndex,
                model: this.collection.at(this.displayedFileIndex)
            });
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
