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
     'less!io.ox/office/framework/view/basestyle.css',
     'less!io.ox/office/framework/view/docs-icons.less'
    ], function (Events, Utils, Pane, gt) {

    'use strict';

    var // CSS marker class for panes in overlay mode
        OVERLAY_CLASS = 'overlay';

    // class BaseView =========================================================

    /**
     * Base class for the view instance of an office application. Creates the
     * application window, and provides functionality to create and control the
     * top, bottom, and side pane elements.
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

            // moves the browser focus into a node of the application pane
            grabFocusHandler = Utils.getFunctionOption(options, 'grabFocusHandler'),

            // centered application pane
            appPane = null,

            // root application container node
            appContainerNode = $('<div>').addClass('app-container'),

            // all fixed view panes, in insertion order
            fixedPanes = [],

            // all overlay view panes, in insertion order
            overlayPanes = [],

            // all view panes, mapped by identifier
            panesById = {},

            // inner shadows for application pane
            shadowNodes = {},

            // alert banner currently shown
            currentAlert = null;

        // base constructor ---------------------------------------------------

        // add event hub
        Events.extend(this);

        // private methods ----------------------------------------------------

        function isHorizontalPosition(position) {
            return (position === 'top') || (position === 'bottom');
        }

        function isLeadingPosition(position) {
            return (position === 'top') || (position === 'left');
        }

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
                    position = paneNode.data('pane-pos'),
                    horizontal = isHorizontalPosition(position),
                    leading = isLeadingPosition(position),
                    visible = paneNode.css('display') !== 'none',
                    sizeFunc = _.bind(horizontal ? paneNode.outerHeight : paneNode.outerWidth, paneNode),
                    transparent = visible && paneNode.hasClass(OVERLAY_CLASS) && (sizeFunc() === 0),
                    sizeAttr = horizontal ? 'height' : 'width',
                    paneOffsets = _.clone(offsets);

                // remove the position attribute at the opposite border of the pane position
                paneOffsets[horizontal ? (leading ? 'bottom' : 'top') : (leading ? 'right' : 'left')] = '';

                // transparent overlay panes: temporarily set to auto size, adjust position of trailing panes
                if (transparent) {
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
                if (transparent) {
                    paneNode.css(sizeAttr, 0);
                }
            }

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
                    currentAlert.css({ top: offsets.top + 56, left: alertMargin, right: alertMargin });
                } else {
                    alertMargin = Math.max((appPaneNode.width() - 500) / 2, 10);
                    currentAlert.css({ top: offsets.top + 10, left: offsets.left + alertMargin, right: offsets.right + alertMargin });
                }
            }

            // update overlay view panes
            _(overlayPanes).each(updatePane);
        }

        /**
         * Updates the view after the application becomes active/visible.
         */
        function windowShowHandler() {
            app.getController().update();
            self.grabFocus();
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
         * Detaches the application pane from the DOM.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.detachAppPane = function () {
            this.getAppPaneNode().detach();
            return this;
        };

        /**
         * Attaches the application pane to the DOM.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.attachAppPane = function () {
            app.getWindowNode().prepend(this.getAppPaneNode());
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
         * Adds the passed view pane instance into this view.
         *
         * @param {Pane} pane
         *  The view pane instance to be inserted into this view.
         *
         * @param {String} position
         *  The border of the application window to attach the view pane to.
         *  Supported values are 'top', 'bottom', 'left', and 'right'.
         *
         * @param {Object} [options]
         *  A map of options to control the appearance of the view pane. The
         *  following options are supported:
         *  @param {Boolean} [options.overlay=false]
         *      If set to true, the pane will float over the other panes and
         *      application contents instead of reserving and consuming the
         *      space needed for its size.
         *  @param {Boolean} [options.transparent=false]
         *      If set to true, the background of an overlay pane will be
         *      transparent. Has no effect if the pane is not in overlay mode.
         *  @param {Boolean} [options.hoverEffect=false]
         *      If set to true, the view components in a transparent overlay
         *      view pane will be displayed half-transparent as long as the
         *      mouse does not hover the view component. Has no effect if the
         *      pane is not in transparent overlay mode.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.addPane = function (pane, position, options) {

            var // overlay pane or fixed pane
                overlay = Utils.getBooleanOption(options, 'overlay', false),
                // the root node of the view pane
                paneNode = pane.getNode();

            // insert the pane
            panesById[pane.getIdentifier()] = pane;
            (overlay ? overlayPanes : fixedPanes).push(pane);
            app.getWindowNode().append(paneNode);

            // overlay mode and position
            paneNode.toggleClass(OVERLAY_CLASS, overlay);
            if (overlay && Utils.getBooleanOption(options, 'transparent', false)) {
                paneNode[isHorizontalPosition(position) ? 'height' : 'width'](0);
                // additional CSS classes
                paneNode.toggleClass('hover-effect', Utils.getBooleanOption(options, 'hoverEffect', false));
            }
            return this.setPanePosition(pane.getIdentifier(), position);
        };

        /**
         * Creates a new view pane instance in this view.
         *
         * @param {String} id
         *  The unique identifier of the new view pane.
         *
         * @param {String} position
         *  The border of the application window to attach the view pane to.
         *  Supported values are 'top', 'bottom', 'left', and 'right'.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new view pane.
         *  Supports all options supported by the Pane class constructor, and
         *  the method BaseView.addPane().
         *
         * @returns {Pane}
         *  The new view pane.
         */
        this.createPane = function (id, position, options) {
            var pane = new Pane(app, id, options);
            this.addPane(pane, position, options);
            return pane;
        };

        /**
         * Returns the specified view pane which has been added with the method
         * BaseView.createPane() before.
         *
         * @param {String} id
         *  The unique identifier of the view pane.
         *
         * @returns {Pane|Null}
         *  The view pane with the specified identifier, or null if no view
         *  pane has been found.
         */
        this.getPane = function (id) {
            return (id in panesById) ? panesById[id] : null;
        };

        /**
         * Changes the position of the pane.
         *
         * @param {String} id
         *  The unique identifier of the view pane.
         *
         * @param {String} position
         *  The border of the application window to attach the view pane to.
         *  Supported values are 'top', 'bottom', 'left', and 'right'.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.setPanePosition = function (id, position) {
            if (id in panesById) {
                panesById[id].getNode().data('pane-pos', position);
                refreshPaneLayout();
            }
            return this;
        };

        /**
         * Returns whether the specified view pane is currently visible.
         *
         * @param {String} id
         *  The unique identifier of the view pane.
         *
         * @returns {Boolean}
         *  Whether the specified view pane is currently visible.
         */
        this.isPaneVisible = function (id) {
            return (id in panesById) && panesById[id].isVisible();
        };

        /**
         * Makes the view pane with the specified identifier visible.
         *
         * @param {String} id
         *  The unique identifier of the view pane.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.showPane = function (id) {
            return this.togglePane(id, false);
        };

        /**
         * Hides the view pane with the specified identifier.
         *
         * @param {String} id
         *  The unique identifier of the view pane.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.hidePane = function (id) {
            return this.togglePane(id, true);
        };

        /**
         * Changes the visibility of the view pane with the specified
         * identifier.
         *
         * @param {String} id
         *  The unique identifier of the view pane.
         *
         * @param {Boolean} [state]
         *  If specified, shows or hides the view pane independently from its
         *  current visibility state. If omitted, toggles the visibility of the
         *  view pane.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.togglePane = function (id, state) {
            if (id in panesById) {
                panesById[id].getNode().toggle(state);
                refreshPaneLayout();
            }
            return this;
        };

        /**
         * Adjusts the positions of all view pane nodes.
         */
        this.refreshPaneLayout = function () {
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
         *  @param {String} [options.buttonKey]
         *      Must be specified together with the 'options.buttonLabel'
         *      option. When the button has been pressed, the controller item
         *      with the passed key will be executed.
         *
         * @returns {BaseView}
         *  A reference to this instance.
         */
        this.showAlert = function (title, message, type, options) {

            var // the label of the push button to be shown in the alert banner
                buttonLabel = Utils.getStringOption(options, 'buttonLabel'),
                // the controller key of the push button
                buttonKey = Utils.getStringOption(options, 'buttonKey'),
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
                alert.off('click').stop().fadeOut(function () { alert.remove(); });
            }

            // remove the alert banner currently shown, store reference to new alert
            if (currentAlert) { currentAlert.stop().remove(); }
            currentAlert = alert;

            // make the alert banner closeable
            if (Utils.getBooleanOption(options, 'closeable', false)) {
                // add closer symbol
                alert.prepend($('<a>', { href: '#' }).text('\xd7').addClass('close'))
                    // alert can be closed by clicking anywhere in the banner
                    .on('click', closeAlert);
                // initialize auto-close
                alert.delay(delay).fadeOut(function () { currentAlert = null; alert.remove(); });
            }

            // return focus to application pane when alert has been clicked (also if not closeable)
            alert.on('click', function () { self.grabFocus(); });

            // insert the push button into the alert banner
            if (_.isString(buttonLabel) && _.isString(buttonKey)) {
                alert.prepend(
                    $.button({ label: buttonLabel })
                        .addClass('btn-' + ((type === 'error') ? 'danger' : type) + ' btn-mini')
                        .on('click', function () {
                            closeAlert();
                            app.getController().change(buttonKey);
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
            _(panesById).invoke('destroy');
            appPane.destroy();
            appPane = fixedPanes = overlayPanes = panesById = null;
        };

        // initialization -----------------------------------------------------

        // create the application pane, and insert the container node
        appPane = new Pane(app, 'mainApplicationPane', { classes: 'app-pane' });
        appPane.getNode()
            .attr('tabindex', -1) // make focusable for global keyboard shortcuts
            .toggleClass('scrollable', Utils.getBooleanOption(options, 'scrollable', false))
            .append(appContainerNode.css('margin', Utils.getStringOption(options, 'margin', '0')));

        // add the main application pane to the application window
        app.getWindowNode().addClass('io-ox-office-main ' + app.getName().replace(/[.\/]/g, '-') + '-main').append(appPane.getNode());

        // add shadow nodes above application pane, but below other panes
        _(['top', 'bottom', 'left', 'right']).each(function (border) {
            app.getWindowNode().append(shadowNodes[border] = $('<div>').addClass('app-pane-shadow'));
        });

        // listen to browser window resize events when the application window is visible
        app.registerWindowResizeHandler(refreshPaneLayout);

        // after import, update all view components every time the window will be shown
        app.on('docs:import:after', function () {
            app.getWindow().on('show', windowShowHandler);
            windowShowHandler();
        });

        // #TODO: remove black/white icon hack, when icons are fonts instead of bitmaps
        app.on('docs:init:after', function () {
            app.getWindowNode().find('.toolbox .group a.button i').addClass('icon-white').closest('.group').addClass('white-icons');
        });

    } // class BaseView

    // exports ================================================================

    return _.makeExtendable(BaseView);

});
