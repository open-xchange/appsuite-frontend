/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/framework/view/baseview',
    ['io.ox/core/event',
     'io.ox/office/tk/utils',
     'io.ox/office/framework/view/pane',
     'gettext!io.ox/office/main',
     'io.ox/office/framework/view/nodetracking',
     'less!io.ox/office/framework/view/basestyle.less',
     'less!io.ox/office/framework/view/docs-icons.less'
    ], function (Events, Utils, Pane, gt) {

    'use strict';

    var // the global root element used to store DOM elements temporarily
        tempStorageNode = $('<div>', { id: 'io-ox-office-temp' }).appendTo('body');

    // class BaseView =========================================================

    /**
     * Base class for the view instance of an office application. Creates the
     * application window, and provides functionality to create and control the
     * top, bottom, and side pane elements.
     *
     * Triggers the following events:
     * - 'refresh:layout': After this view instance has refreshed the layout of
     *      all registered view panes. This event will be triggered after
     *      inserting new view panes into this view, or content nodes into the
     *      application pane, after showing/hiding view panes, while and after
     *      the browser window is resized, and when the method
     *      BaseView.refreshPaneLayout() has been called manually.
     *
     * @constructor
     *
     * @extends Events
     *
     * @param {BaseApplication} app
     *  The application containing this view instance.
     *
     * @param {Object} [options]
     *  Additional options to control the appearance of the view. The following
     *  options are supported:
     *  @param {Function} [options.initHandler]
     *      A callback handler function called to initialize the contents of
     *      this view instance after construction.
     *  @param {Function} [options.deferredInitHandler]
     *      A callback handler function called to initialize more contents of
     *      this view instance, after the document has been imported.
     *  @param {Function} [options.grabFocusHandler]
     *      A function that has to implement moving the browser focus somewhere
     *      into the application pane. Used in the method BaseView.grabFocus()
     *      of this class. If omitted, the application pane itself will be
     *      focused.
     *  @param {Boolean} [options.scrollable=false]
     *      If set to true, the application pane will be scrollable, and the
     *      application container node becomes resizeable. By default, the size
     *      of the application container node is locked and synchronized with
     *      the size of the application pane (with regard to padding, see the
     *      option 'options.appPanePadding').
     *  @param {String} [options.margin='0']
     *      The margin between the fixed application pane and the embedded
     *      application container node, as CSS 'margin' attribute.
     */
    function BaseView(app, options) {

        var // self reference
            self = this,

            // CSS classes to be added at the window root node
            windowNodeClasses = 'io-ox-office-main ' + app.getName().replace(/[.\/]/g, '-') + '-main',

            // moves the browser focus into a node of the application pane
            grabFocusHandler = Utils.getFunctionOption(options, 'grabFocusHandler'),

            // centered application pane
            appPane = null,

            // root application container node
            appContainerNode = $('<div>').addClass('app-container'),

            // busy node for the application pane
            appBusyNode = $('<div>').addClass('abs'),

            // all fixed view panes, in insertion order
            fixedPanes = [],

            // all overlay view panes, in insertion order
            overlayPanes = [],

            // inner shadows for application pane
            shadowNodes = {},

            // whether refreshing the pane layout is currently locked
            layoutLocks = 0,

            // alert banner currently shown
            currentAlert = null,

            // the temporary container for all nodes while application is hidden
            tempNode = $('<div>').addClass(windowNodeClasses).appendTo(tempStorageNode),

            // whether the application is hidden explicitly
            viewHidden = false;

        // base constructor ---------------------------------------------------

        // add event hub
        Events.extend(this);

        // private methods ----------------------------------------------------

        /**
         * Adjusts the positions of all view pane nodes.
         */
        function refreshPaneLayout() {

            var // the root node of the application pane
                appPaneNode = appPane.getNode(),
                // current offsets representing available space in the application window
                offsets = { top: 0, bottom: 0, left: 0, right: 0 },
                // margin for the alert banner, to keep a maximum width
                alertMargin = 0;

            function updatePane(pane) {

                var paneNode = pane.getNode(),
                    visible = pane.isVisible(),
                    transparent = pane.isTransparent(),
                    position = pane.getPosition(),
                    vertical = Utils.isVerticalPosition(position),
                    leading = Utils.isLeadingPosition(position),
                    sizeFunc = _.bind(vertical ? paneNode.outerHeight : paneNode.outerWidth, paneNode),
                    sizeAttr = vertical ? 'height' : 'width',
                    paneOffsets = _.clone(offsets);

                // remove the position attribute at the opposite border of the pane position
                paneOffsets[vertical ? (leading ? 'bottom' : 'top') : (leading ? 'right' : 'left')] = '';

                // transparent overlay panes: temporarily set to auto size, adjust position of trailing panes
                if (visible && transparent) {
                    paneNode.css(sizeAttr, 'auto');
                    if (!leading) {
                        paneOffsets[position] += sizeFunc();
                    }
                }

                // set pane position, adjust global offsets
                paneNode.css(paneOffsets);
                if (visible) {
                    offsets[position] += sizeFunc();
                }

                // transparent overlay panes: set zero size
                if (visible && transparent) {
                    paneNode.css(sizeAttr, 0);
                }
            }

            // do nothing if refreshing is currently locked, or the window is hidden
            if ((layoutLocks > 0) || !app.getWindow().state.visible) { return; }

            // update fixed view panes
            _(fixedPanes).each(updatePane);

            // update the application pane and the shadow nodes (jQuery interprets numbers as pixels automatically)
            appPaneNode.css(offsets);
            shadowNodes.top.css({ top: offsets.top - 10, height: 10, left: offsets.left, right: offsets.right });
            shadowNodes.bottom.css({ bottom: offsets.bottom - 10, height: 10, left: offsets.left, right: offsets.right });
            shadowNodes.left.css({ top: offsets.top, bottom: offsets.bottom, left: offsets.left - 10, width: 10 });
            shadowNodes.right.css({ top: offsets.top, bottom: offsets.bottom, right: offsets.right - 10, width: 10 });

            // skip scroll bars of application pane for overlay panes
            if (/^(scroll|auto)$/.test(appPaneNode.css('overflow-x'))) {
                offsets.right += Utils.SCROLLBAR_WIDTH;
            }
            if (/^(scroll|auto)$/.test(appPaneNode.css('overflow-y'))) {
                offsets.bottom += Utils.SCROLLBAR_HEIGHT;
            }

            // update alert banner
            if (_.isObject(currentAlert)) {
                if (app.getWindowNode().width() <= 640) {
                    alertMargin = Math.max((app.getWindowNode().width() - 500) / 2, 10);
                    // TODO: get size of existing overlay panes at top border
                    currentAlert.css({ top: offsets.top + 56, left: alertMargin, right: alertMargin });
                } else {
                    alertMargin = Math.max((appPaneNode.width() - 500) / 2, 10);
                    currentAlert.css({ top: offsets.top + 10, left: offsets.left + alertMargin, right: offsets.right + alertMargin });
                }
            }

            // update overlay view panes
            _(overlayPanes).each(updatePane);

            // notify listeners
            self.trigger('refresh:layout');
        }

        /**
         * Updates the view after the application becomes active/visible.
         */
        function windowShowHandler() {

            // do not show the window contents if view is still hidden explicitly
            if (viewHidden) { return; }

            // move all application nodes from temporary storage into view
            app.getWindowNode().append(tempNode.children());
            refreshPaneLayout();

            // do not update GUI and grab focus while document is still being imported
            if (app.isImportFinished()) {
                app.getController().update();
                self.grabFocus();
            }
        }

        /**
         * Updates the view after the application becomes inactive/hidden.
         */
        function windowHideHandler() {
            // move all application nodes from view to temporary storage
            tempNode.append(app.getWindowNode().children());
        }

        // methods ------------------------------------------------------------

        /**
         * Moves the browser focus into the application pane. Calls the
         * handler function passed to the constructor of this instance.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.grabFocus = function () {
            if (_.isFunction(grabFocusHandler)) {
                grabFocusHandler.call(this);
            } else {
                this.getAppPaneNode().focus();
            }
            return this;
        };

        /**
         * Hides all contents of the application window and moves them to the
         * internal temporary DOM storage node.
         *
         * @return {BaseView}
         *  A reference to this instance.
         */
        this.hide = function () {
            viewHidden = true;
            windowHideHandler();
            return this;
        };

        /**
         * Shows all contents of the application window, if the application
         * itself is currently active. Otherwise, the contents will be shown
         * when the application becomes visible.
         *
         * @return {BaseView}
         *  A reference to this instance.
         */
        this.show = function () {
            viewHidden = false;
            windowShowHandler();
            return this;
        };

        /**
         * Returns the DOM node of the application pane (the complete inner
         * area between all existing view panes). Note that this is NOT the
         * container node where applications insert their own contents. The
         * method BaseView.insertContentNode() is intended to be used to insert
         * own contents into the application pane.
         *
         * @returns {jQuery}
         *  The DOM node of the application pane.
         */
        this.getAppPaneNode = function () {
            return appPane.getNode();
        };

        /**
         * Sets the application into the busy state by displaying a window
         * blocker element covering the application pane. All other view panes
         * (also the overlay panes covering the blocked application pane)
         * remain available.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.appPaneBusy = function () {
            appBusyNode.show().busy();
            return this;
        };

        /**
         * Leaves the busy state from the application pane that has been
         * entered by the method BaseView.appPaneBusy().
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.appPaneIdle = function () {
            appBusyNode.idle().hide();
            return this;
        };

        /**
         * Detaches the application pane from the DOM.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.detachAppPane = function () {
            appContainerNode.detach();
            return this;
        };

        /**
         * Attaches the application pane to the DOM.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.attachAppPane = function () {
            this.getAppPaneNode().prepend(appContainerNode);
            return this;
        };

        /**
         * Inserts new DOM nodes into the container node of the application
         * pane.
         *
         * @param {HTMLElement|jQuery}
         *  The DOM node(s) to be inserted into the application pane. If this
         *  object is a jQuery collection, inserts all contained DOM nodes into
         *  the application pane.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.insertContentNode = function (contentNode) {
            appContainerNode.append(contentNode);
            return this.refreshPaneLayout();
        };

        /**
         * Removes all DOM nodes from the container node of the application
         * pane.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.removeAllContentNodes = function () {
            appContainerNode.empty();
            return this.refreshPaneLayout();
        };

        /**
         * Inserts new DOM nodes into the private storage container. The nodes
         * will not be visible but will be part of the living DOM, thus it will
         * be possible to access and modify the geometry of the nodes.
         *
         * @param {HTMLElement|jQuery}
         *  The DOM node(s) to be inserted into the private storage container.
         *  If this object is a jQuery collection, inserts all contained DOM
         *  nodes into the container.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.insertTemporaryNode = function (node) {
            tempStorageNode.append(node);
            return this;
        };

        /**
         * Adds the passed view pane instance into this view.
         *
         * @param {Pane} pane
         *  The view pane instance to be inserted into this view.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.addPane = function (pane) {

            // insert the pane
            (pane.isOverlay() ? overlayPanes : fixedPanes).push(pane);
            app.getWindowNode().append(pane.getNode());

            // refresh overall layout
            return this.refreshPaneLayout();
        };

        /**
         * Adjusts the positions of all view pane nodes, and the current alert
         * banner.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.refreshPaneLayout = function () {
            refreshPaneLayout();
            return this;
        };

        /**
         * Prevents refreshing the pane layout while the specified callback
         * function is running. After the callback function has finished, the
         * pane layout will be adjusted once by calling the method
         * BaseApplication.refreshPaneLayout().
         *
         * @param {Function} callback
         *  The callback function that will be executed synchronously while
         *  refreshing the pane layout is locked.
         *
         * @param {Object} [context]
         *  The context bound to the callback function.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.lockPaneLayout = function (callback, context) {
            layoutLocks += 1;
            callback.call(context);
            layoutLocks -= 1;
            refreshPaneLayout();
            return this;
        };

        /**
         * Sets the application into the busy state by displaying a window
         * blocker element covering the entire GUI of the application. The
         * contents of the header and footer in the blocker element are
         * cleared, and the passed callback may insert new contents into these
         * elements.
         *
         * @param {Function} [callback]
         *  A function that can fill custom contents into the header and footer
         *  of the window blocker element. Receives the following parameters:
         *  (1) {jQuery} header
         *      The header element above the centered progress bar.
         *  (2) {jQuery} footer
         *      The footer element below the centered progress bar.
         *  (3) {jQuery} blocker
         *      The entire window blocker element (containing the header,
         *      footer, and progress bar elements).
         *  Will be called in the context of this view instance.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.enterBusy = function (callback) {

            // enter busy state, and extend the blocker element
            app.getWindow().busy(null, null, function () {

                var // the window blocker element (bound to 'this')
                    blocker = this;

                // special marker for custom CSS formatting, clear header/footer
                blocker.addClass('io-ox-office-blocker').find('.header, .footer').empty();

                // execute callback
                if (_.isFunction(callback)) {
                    callback.call(self, blocker.find('.header'), blocker.find('.footer'), blocker);
                }
            });

            return this;
        };

        /**
         * Leaves the busy state of the application. Hides the window blocker
         * element covering the entire GUI of the application.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.leaveBusy = function () {
            app.getWindow().idle();
            return this;
        };

        /**
         * Returns whether an alert banner is currently visible.
         *
         * @returns {Boolean}
         *  Whether an alert banner is visible.
         */
        this.hasAlert = function () {
            return _.isObject(currentAlert);
        };

        /**
         * Shows an alert banner at the top of the application window. An alert
         * currently shown will be removed before.
         *
         * @param {String} title
         *  The alert title.
         *
         * @param {String} message
         *  The alert message text.
         *
         * @param {String} type
         *  The type of the alert banner. Supported values are 'error',
         *  'warning', and 'success'.
         *
         * @param {Object} [options]
         *  A map with additional options controlling the appearance and
         *  behavior of the alert banner. The following options are supported:
         *  @param {Boolean} [options.closeable]
         *      If set to true, the alert banner can be closed with a close
         *      button shown in the top-right corner of the banner.
         *  @param {Number} [options.timeout=5000]
         *      Can be specified together with 'options.closeable'. Specifies
         *      the number of milliseconds until the alert banner will vanish
         *      automatically. If not specified, the default of five seconds is
         *      used. The value 0 will show a closeable alert banner that will
         *      not vanish automatically.
         *  @param {String} [options.buttonLabel]
         *      If specified, a push button will be shown with the passed
         *      caption label.
         *  @param {Function|String} [options.buttonAction]
         *      Must be specified together with the 'options.buttonLabel'
         *      option. When the button has been pressed, the passed function
         *      will be executed. If set to a string, the controller item with
         *      the passed key will be executed instead.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.showAlert = function (title, message, type, options) {

            var // the label of the push button to be shown in the alert banner
                buttonLabel = Utils.getStringOption(options, 'buttonLabel'),
                // the callback action for the push button
                buttonAction = Utils.getFunctionOption(options, 'buttonAction'),
                // the controller key for the push button
                buttonKey = Utils.getStringOption(options, 'buttonAction'),
                // create a new alert node
                alert = $('<div>')
                    .addClass('alert alert-' + type)
                    .append($('<h4>').text(title), $('<p>').text(message))
                    .data('pane-pos', 'top'),
                // auto-close timeout delay
                delay = Utils.getIntegerOption(options, 'timeout', 5000);

            // Hides the alert with a specific animation.
            function closeAlert() {
                currentAlert = null;
                alert.off('click').stop(true).fadeOut(function () { alert.remove(); });
            }

            // remove the alert banner currently shown, store reference to new alert
            if (currentAlert) { currentAlert.stop(true).remove(); }
            currentAlert = alert;

            // make the alert banner closeable
            if (Utils.getBooleanOption(options, 'closeable', false)) {
                // add closer symbol
                alert.prepend($('<a>', { href: '#' }).text('\xd7').addClass('close'))
                    .css('cursor', 'pointer')
                    // alert can be closed by clicking anywhere in the banner
                    .on('click', closeAlert)
                    // initialize auto-close
                    .delay(delay)
                    .fadeOut(function () {
                        currentAlert = null;
                        alert.remove();
                    });
            }

            // return focus to application pane when alert has been clicked (also if not closeable)
            alert.on('click', function () { self.grabFocus(); });

            // create a function that executes the specified controller item
            if (_.isString(buttonKey)) {
                buttonAction = function () { app.getController().change(buttonKey); };
            }

            // insert the push button into the alert banner
            if (_.isString(buttonLabel) && _.isFunction(buttonAction)) {
                alert.prepend(
                    $.button({ label: buttonLabel })
                        .addClass('btn-' + ((type === 'error') ? 'danger' : type) + ' btn-mini')
                        .on('click', function () {
                            closeAlert();
                            buttonAction.call(self);
                        })
                );
            }

            // insert and show the new alert banner
            app.getWindowNode().append(alert);
            refreshPaneLayout();

            return this;
        };

        /**
         * Shows an error alert banner at the top of the application window. An
         * alert currently shown will be removed before.
         *
         * @param {String} title
         *  The alert title.
         *
         * @param {String} message
         *  The alert message text.
         *
         * @param {Object} [options]
         *  A map with additional options controlling the appearance and
         *  behavior of the alert banner. See method Alert.showAlert() for
         *  details.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.showError = function (title, message, options) {
            return this.showAlert(title, message, 'error', options);
        };

        /**
         * Shows a warning alert banner at the top of the application window.
         * An alert currently shown will be removed before.
         *
         * @param {String} title
         *  The alert title.
         *
         * @param {String} message
         *  The alert message text.
         *
         * @param {Object} [options]
         *  A map with additional options controlling the appearance and
         *  behavior of the alert banner. See method Alert.showAlert() for
         *  details.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.showWarning = function (title, message, options) {
            return this.showAlert(title, message, 'warning', options);
        };

        /**
         * Shows a success alert banner at the top of the application window.
         * An alert currently shown will be removed before.
         *
         * @param {String} title
         *  The alert title.
         *
         * @param {String} message
         *  The alert message text.
         *
         * @param {Object} [options]
         *  A map with additional options controlling the appearance and
         *  behavior of the alert banner. See method Alert.showAlert() for
         *  details.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.showSuccess = function (title, message, options) {
            return this.showAlert(title, message, 'success', options);
        };

        this.destroy = function () {
            this.events.destroy();
            _(fixedPanes).invoke('destroy');
            _(overlayPanes).invoke('destroy');
            appPane.destroy();
            appPane = fixedPanes = overlayPanes = null;
        };

        // initialization -----------------------------------------------------

        // create the application pane, and insert the container node
        appPane = new Pane(app, { classes: 'app-pane unselectable' });
        appPane.getNode()
            .attr('tabindex', -1) // make focusable for global keyboard shortcuts
            .toggleClass('scrollable', Utils.getBooleanOption(options, 'scrollable', false))
            .append(appContainerNode.css('margin', Utils.getStringOption(options, 'margin', '0')), appBusyNode.hide());

        // add the main application pane to the application window
        app.getWindowNode().addClass(windowNodeClasses).append(appPane.getNode());

        // add shadow nodes above application pane, but below other panes
        _(['top', 'bottom', 'left', 'right']).each(function (border) {
            app.getWindowNode().append(shadowNodes[border] = $('<div>').addClass('app-pane-shadow'));
        });

        // listen to browser window resize events when the application window is visible
        app.registerWindowResizeHandler(refreshPaneLayout);

        // keep application in DOM while application is hidden, applications
        // may want to access element geometry in background tasks
        app.getWindow().on({ show: windowShowHandler, hide: windowHideHandler });

        // after construction, call initialization handler
        app.on('docs:init', function () {
            self.lockPaneLayout(function () {
                Utils.getFunctionOption(options, 'initHandler', $.noop).call(self);
            });
        });

        // after import, call deferred initialization handler, and update view and controller
        app.on('docs:import:after', function () {
            self.lockPaneLayout(function () {
                Utils.getFunctionOption(options, 'deferredInitHandler', $.noop).call(self);
            });
            windowShowHandler();
        });

        // remove hidden container node when application has been closed
        app.on('quit', function () { tempNode.remove(); });

    } // class BaseView

    // exports ================================================================

    return _.makeExtendable(BaseView);

});
