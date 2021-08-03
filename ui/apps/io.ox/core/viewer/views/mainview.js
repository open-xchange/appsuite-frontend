/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/viewer/views/mainview', [
    'io.ox/core/viewer/views/toolbarview',
    'io.ox/core/viewer/views/displayerview',
    'io.ox/core/viewer/views/sidebarview',
    'io.ox/backbone/views/disposable',
    'io.ox/core/tk/nodetouch',
    'io.ox/core/viewer/util',
    'io.ox/core/viewer/settings',
    'io.ox/core/a11y',
    'less!io.ox/core/viewer/style',
    // prefetch file actions
    'io.ox/files/actions'
], function (ToolbarView, DisplayerView, SidebarView, DisposableView, NodeTouch, Util, Settings, a11y) {

    'use strict';

    /**
     * The MainViewer is the base view for the OX Viewer.
     * This view imports, manage and  renders these children views:
     * - ToolbarView
     * - DisplayerView
     * - SidebarView
     */
    var MainView = DisposableView.extend({

        className: 'io-ox-viewer abs',

        events: {
            'keydown': 'onKeydown'
        },

        initialize: function (options) {

            Util.logPerformanceTimer('MainView:initialize');

            _.extend(this, options);
            // apps with 'simple window' class (Portal) scrolls behind the viewer.
            // Hide it for the moment as a workaround.
            // TODO find a better solution
            if (!this.standalone) {
                this.$el.parent().find('.simple-window').hide();
            }
            // set default theme
            var themeClass = this.standalone ? 'viewer-light-theme' : 'viewer-dark-theme';
            this.setTheme(themeClass);
            // create the event aggregator of this view.
            this.viewerEvents = _.extend({}, Backbone.Events);
            // create children views
            var childViewParams = { collection: this.collection, viewerEvents: this.viewerEvents, standalone: this.standalone, app: this.app, opt: this.opt, isViewer: true, openedBy: this.openedBy, isSharing: this.isSharing };
            this.toolbarView = new ToolbarView(childViewParams);
            this.displayerView = new DisplayerView(childViewParams);
            this.sidebarView = new SidebarView(childViewParams);
            // close viewer on events
            this.listenTo(this.viewerEvents, 'viewer:close', this.viewerCloseHandler);
            this.listenTo(this.viewerEvents, 'viewer:toggle:sidebar', this.onToggleSidebar);
            // bind toggle side bar handler
            this.listenTo(this.viewerEvents, 'viewer:sidebar:change:state', this.onSideBarToggled);
            // close viewer when other app is start or resumed, except in standalone mode
            if (!this.standalone) {
                this.listenTo(ox, 'app:start app:resume', this.viewerCloseHandler);
            }
            // register app resume event for stand alone mode
            if (this.app) {
                this.app.on('resume', this.onAppResume);
            }
            // handle DOM events
            $(window).on('resize', this.refreshViewSizes.bind(this));
            // display the selected file initially
            var startIndex = this.collection.getStartIndex(),
                startModel = this.collection.at(startIndex);
            this.render(startModel);
            // init metrics
            this.initMetrics();
        },

        /**
         * Renders this MainView with the supplied model.
         *
         *  @param {Object} model
         *   The file model object.
         *
         * @returns {MainView}
         */
        render: function (model) {
            // #58229 - sidebar closed by default for shared files
            var state = (this.isSharing) ? false : Settings.getSidebarOpenState();

            if (!model) {
                console.error('Core.Viewer.MainView.render(): no file to render');
                return;
            }
            // make this main view focusable and prevent focus from leaving the viewer.
            this.$el.attr('tabindex', -1);
            // set device type
            Util.setDeviceClass(this.$el);
            // append toolbar view
            this.$el.append(
                this.sidebarView.render(model).el,
                this.toolbarView.render(model).el,
                this.displayerView.render(model).el
            );
            // set initial sidebar state
            this.sidebarView.toggleSidebar(state);
            return this;
        },

        'initMetrics': function () {
            var self = this;
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                var toolbar = self.$el.find('.viewer-toolbar');
                // toolbar actions
                toolbar.on('mousedown', '.io-ox-action-link', function (e) {
                    metrics.trackEvent({
                        app: 'core',
                        target: 'viewer/toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
            });
        },

        // handler for keyboard events on the viewer
        onKeydown: function (event) {
            var viewerRootEl = this.$el;
            var swiper = this.displayerView.swiper;
            var self = this;

            var handleChangeSlide = _.throttle(function (direction) {
                if (!swiper) { return; }

                if (direction === 'right') {
                    swiper.slideNext();
                } else {
                    swiper.slidePrev();
                }
                swiper.updateClickedSlide({ target: null });
            }, 200);

            // manual TAB traversal handler. 'Traps' TAB traversal inside the viewer root component.
            function tabHandler(event) {
                var tabableActions = a11y.getTabbable(viewerRootEl).filter(':not(.swiper-button-control):not([tabindex=-1])');
                var tabableActionsCount = tabableActions.length;

                // quit immediately if no tabable actions are found
                if (tabableActionsCount === 0) { return; }

                var focusedElementIndex = tabableActions.index(document.activeElement);
                var traversalStep = event.shiftKey ? -1 : 1;
                var nextElementIndex = focusedElementIndex + traversalStep;
                // prevent default TAB traversal
                event.preventDefault();
                // traverse to prev/next action
                if (nextElementIndex >= tabableActionsCount) {
                    nextElementIndex = 0;
                }
                // focus next action candidate
                tabableActions.eq(nextElementIndex).visibleFocus();
            }

            function handleLeftRightArrowKey(direction) {
                // need to use defer here in order to let the toolbar navigation select the action link first
                _.defer(function () {
                    if (self.disposed) return;
                    var toolbarFocused = $.contains(self.toolbarView.el, document.activeElement);
                    // if the focus is inside the toolbar cursor left/right switches between toolbar links, otherwise between slides
                    if (!toolbarFocused) {
                        handleChangeSlide(direction);
                    }
                });
            }

            switch (event.which) {
                case 9: // TAB key
                    if (this.standalone) return;
                    tabHandler(event);
                    break;
                case 27: // ESC key
                    var escTarget = $(event.target),
                        isDropdownMenuItem = escTarget.parents('.dropdown-menu').length > 0,
                        isDropdownToggler = escTarget.attr('data-toggle') === 'dropdown' && escTarget.attr('aria-expanded') === 'true';
                    // close the viewer only if user is not on a dropdown menu, or a dropdown menu item
                    if (!isDropdownMenuItem && !isDropdownToggler && !(ox.tabHandlingEnabled && this.standalone)) {
                        this.viewerCloseHandler();
                    }
                    break;
                case 37: // left arrow
                    handleLeftRightArrowKey('left');
                    break;
                case 39: // right arrow
                    handleLeftRightArrowKey('right');
                    break;
                case 33: // page up
                    event.preventDefault();
                    this.viewerEvents.trigger('viewer:document:previous');
                    break;
                case 34: // page down
                    event.preventDefault();
                    this.viewerEvents.trigger('viewer:document:next');
                    break;
                case 114: // Ctrl/Meta + F3
                    if (!event.altKey && !event.shiftKey && (event.metaKey !== event.ctrlKey)) {
                        event.preventDefault();
                        this.onToggleSidebar();
                    }
                    break;
                // no default
            }
        },

        // toggle sidebar after the sidebar button is clicked
        onToggleSidebar: function () {
            this.sidebarView.toggleSidebar();
        },

        // handle sidebar toggle
        onSideBarToggled: function (/*state*/) {
            this.refreshViewSizes();
        },

        // recalculate view dimensions after e.g. window resize events
        refreshViewSizes: function () {
            // filter random resize events that are coming from other parts of appsuite while switching apps.
            if (this.disposed || !this.$el.is(':visible')) {
                return;
            }

            var rightOffset = this.sidebarView.open ? this.sidebarView.$el.outerWidth() : 0;
            var displayerEl = this.displayerView.$el;
            var activeSlide = this.displayerView.getActiveSlideNode();
            var swiper      = this.displayerView.swiper;

            displayerEl.css({ width: window.innerWidth - rightOffset });
            activeSlide.find('.viewer-displayer-item').css({ maxWidth: window.innerWidth - rightOffset });

            if (swiper) {
                swiper.update();
                this.viewerEvents.trigger('viewer:resize');
            }
        },

        // handle app resume
        onAppResume: function () {
            $(window).trigger('resize');
        },

        /**
         * Sets viewer theme.
         *
         * @param {String} themeClass
         * CSS theme class to be applied to viewer.
         */
        setTheme: function (themeClass) {
            this.$el.removeClass().addClass('io-ox-viewer abs ' + themeClass);
        },

        /**
         * Viewer close handler.
         * - triggers an 'viewer:beforeclose' event.
         * - save sidebar state into the Settings.
         * - Hides viewer DOM first and then do cleanup.
         */
        viewerCloseHandler: function (app) {

            // ignore startup of applications plugged by the Viewer (triggers the "app:start" event)
            if (app && app.options && app.options.plugged) {
                return;
            }

            // don't close the Viewer when help is opened
            if (app && app.get('name') === 'io.ox/help') {
                return;
            }

            this.viewerEvents.trigger('viewer:beforeclose');
            // save sidebar state, but only if files are not shared #58229
            if (!this.isSharing) {
                Settings.setSidebarOpenState(this.sidebarView.open);
            }
            this.$el.hide();
            if (!this.standalone) {
                this.$el.parent().find('.simple-window').show();
                this.remove();
            } else {
                this.app.quit();
            }
        },

        onDispose: function () {
            if (this.toolbarView) { this.toolbarView.remove(); }
            if (this.displayerView) { this.displayerView.remove(); }
            if (this.sidebarView) { this.sidebarView.remove(); }
            this.collection = null;
            this.toolbarView = null;
            this.displayerView = null;
            this.sidebarView = null;

            $(window).off('resize', this.refreshViewSizes.bind(this));

            if (this.app) {
                this.app.off('resume', this.onAppResume);
            }

            if (!this.standalone && this.app) {
                this.app.quit();
                this.app = null;
            }
        }
    });
    return MainView;
});
