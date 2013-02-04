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

define('io.ox/office/tk/view/view',
        ['io.ox/office/tk/utils',
         'io.ox/office/tk/view/pane',
         'gettext!io.ox/office/main',
         'less!io.ox/office/tk/view/style.css'
        ], function (Utils, Pane, gt) {

    'use strict';

    var // CSS marker class for panes in overlay mode
        OVERLAY_CLASS = 'overlay';

    // class View =============================================================

    /**
     * Base class for the view instance of an office application. Creates the
     * application window, and provides functionality to create and control the
     * top, bottom, and side pane elements.
     *
     * @constructor
     *
     * @param {OfficeApplication} app
     *  The application containing this view instance.
     *
     * @param {Object} [options]
     *  Additional options to control the appearance of the view. The following
     *  options are supported:
     *  @param {Boolean} [options.scrollable=false]
     *      If set to true, the application pane will be scrollable, and the
     *      application container node becomes resizeable. By default, the size
     *      of the application container node is locked and synchronized with
     *      the size of the application pane (with regard to padding, see the
     *      option 'options.appPanePadding').
     *  @param {Number} [options.padding=0]
     *      The padding between the fixed application pane and the embedded
     *      application container node.
     */
    function View(app, options) {

        var // centered application pane
            appPane = null,

            // root application container node
            appContainerNode = $('<div>').addClass('app-container'),

            // all pane instances, in insertion order
            panes = [],

            // all pane instances, mapped by identifier
            panesById = {},

            // inner shadows for application pane
            shadowNodes = {},

            // identifier of the view pane following an alert banner
            alertsBeforePaneId = null,

            // alert banner currently shown
            currentAlert = null,

            // timeout for current alert auto-close
            currentAlertTimeout = null;

        // private methods ----------------------------------------------------

        /**
         * Adjusts the positions of all view pane nodes.
         */
        function refreshPaneLayout() {

            var // all pane nodes and the alert banner
                paneNodes = [],
                // current offsets representing available space in the application window
                offsets = { top: 0, bottom: 0, left: 0, right: 0 };

            // callback function for _.any(), tries to insert currentAlert into the paneNodes array
            function insertCurrentAlert(pane, index) {
                if (pane.getIdentifier() === alertsBeforePaneId) {
                    paneNodes.splice(index, 0, currentAlert);
                    return true;
                }
            }

            // extract the nodes of all view panes
            paneNodes = _(panes).map(function (pane) { return pane.getNode(); });

            // insert the current alert banner at the configured position, otherwise append it
            if (currentAlert && !_(panes).any(insertCurrentAlert)) {
                paneNodes.push(currentAlert);
            }

            // update the position of all panes (updates the 'offsets' object accordingly)
            _(paneNodes).each(function (paneNode) {

                var position = paneNode.data('pane-pos'),
                    horizontal = (position === 'top') || (position === 'bottom'),
                    leading = (position === 'top') || (position === 'left'),
                    paneOffsets = _.clone(offsets);

                paneOffsets[horizontal ? (leading ? 'bottom' : 'top') : (leading ? 'right' : 'left')] = '';
                paneNode.css(paneOffsets);
                if ((paneNode.css('display') !== 'none') && !paneNode.hasClass(OVERLAY_CLASS)) {
                    offsets[position] += (horizontal ? paneNode.outerHeight() : paneNode.outerWidth());
                }
            });

            // update the application pane and the shadow nodes (jQuery interprets numbers as pixels automatically)
            appPane.getNode().css(offsets);
            shadowNodes.top.css({ top: offsets.top - 10, height: 10, left: offsets.left, right: offsets.right });
            shadowNodes.bottom.css({ bottom: offsets.bottom - 10, height: 10, left: offsets.left, right: offsets.right });
            shadowNodes.left.css({ top: offsets.top, bottom: offsets.bottom, left: offsets.left - 10, width: 10 });
            shadowNodes.right.css({ top: offsets.top, bottom: offsets.bottom, right: offsets.right - 10, width: 10 });
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the DOM node of the application pane (the complete inner
         * area between all existing view panes). Note that this is NOT the
         * container node where applications insert their own contents. The
         * method View.insertContentNode() is intended to be used to insert own
         * contents into the application pane.
         *
         * @returns {jQuery}
         *  The DOM node of the application pane.
         */
        this.getAppPaneNode = function () {
            return appPane.getNode();
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
         * @returns {View}
         *  A reference to this instance.
         */
        this.insertContentNode = function (contentNode) {
            appContainerNode.append(contentNode);
            return this;
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
         *
         * @returns {View}
         *  A reference to this instance.
         */
        this.addPane = function (pane, position, options) {

            // insert the pane
            panesById[pane.getIdentifier()] = pane;
            panes.push(pane);
            app.getWindowNode().append(pane.getNode());

            // overlay mode and position
            pane.getNode().toggleClass(OVERLAY_CLASS, Utils.getBooleanOption(options, 'overlay', false));
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
         *  the method View.addPane().
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
         * View.createPane() before.
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
         * @returns {View}
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
            return  (id in panesById) && panesById[id].isVisible();
        };

        /**
         * Makes the view pane with the specified identifier visible.
         *
         * @param {String} id
         *  The unique identifier of the view pane.
         *
         * @returns {View}
         *  A reference to this instance.
         */
        this.showPane = function (id) {
            if (id in panesById) {
                panesById[id].getNode().show();
                refreshPaneLayout();
            }
            return this;
        };

        /**
         * Hides the view pane with the specified identifier.
         *
         * @param {String} id
         *  The unique identifier of the view pane.
         *
         * @returns {View}
         *  A reference to this instance.
         */
        this.hidePane = function (id) {
            if (id in panesById) {
                panesById[id].getNode().hide();
                refreshPaneLayout();
            }
            return this;
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
         * @returns {View}
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
         * Returns whether an alert banner is currently visible.
         *
         * @returns {Boolean}
         *  Whether an alert banner is visible.
         */
        this.hasAlert = function () {
            return _.isObject(currentAlert);
        };

        /**
         * Registers the identifier of the first view pane that will be
         * rendered after/below an alert banner. By default, an alert banner
         * will be drawn after all registered view panes, but above the
         * application pane.
         *
         * @param {String} id
         *  The unique identifier of the first view pane drawn after an alert
         *  banner.
         */
        this.showAlertsBeforePane = function (id) {
            alertsBeforePaneId = _.isString(id) ? id : null;
            refreshPaneLayout();
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
         * @returns {View}
         *  A reference to this instance.
         */
        this.showAlert = function (title, message, type, options) {

            var // the label of the push button to be shown in the alert banner
                buttonLabel = Utils.getStringOption(options, 'buttonLabel'),
                // the controller key of the push button
                buttonKey = Utils.getStringOption(options, 'buttonKey'),
                // create a new alert node
                alert = $.alert(title, message)
                    .removeClass('alert-error')
                    .addClass('alert-' + type + ' in hide')
                    .data('pane-pos', 'top'),
                // auto-close timeout delay
                timeout = Utils.getIntegerOption(options, 'timeout', 5000);

            function toggleOverlay(state) {
                alert.toggleClass(OVERLAY_CLASS, state);
                refreshPaneLayout();
            }

            // Hides the alert with a specific animation.
            function closeAlert() {
                toggleOverlay(true);
                alert.slideUp('fast', function () {
                    alert.remove();
                    currentAlert = null;
                });
            }

            function buttonClickHandler() {
                closeAlert();
                app.getController().change(buttonKey);
            }

            // remove alert banner currently shown, update reference to current alert
            app.cancelDelayed(currentAlertTimeout);
            currentAlertTimeout = null;
            if (currentAlert) { currentAlert.remove(); }
            currentAlert = alert;

            // make the alert banner closeable
            if (Utils.getBooleanOption(options, 'closeable', false)) {
                // alert can be closed by clicking anywhere in the banner
                alert.click(closeAlert);
                // initialize auto-close
                if (timeout > 0) {
                    currentAlertTimeout = app.executeDelayed(closeAlert, timeout);
                }
            } else {
                // remove closer button
                alert.find('a.close').remove();
            }

            // always execute controller default action when alert has been clicked (also if not closeable)
            alert.click(function () { app.getController().done(); });

            // insert the push button into the alert banner
            if (_.isString(buttonLabel) && _.isString(buttonKey)) {
                alert.append(
                    $.button({ label: buttonLabel }).addClass('btn-' + type + ' btn-mini').click(buttonClickHandler)
                );
            }

            // insert and show the new alert banner
            app.getWindowNode().append(alert);
            toggleOverlay(true);
            // after alert is visible, remove overlay mode, and refresh pane layout again
            alert.slideDown('fast', function () { toggleOverlay(false); });

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
         * @returns {View}
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
         * @returns {View}
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
         * @returns {View}
         *  A reference to this instance.
         */
        this.showSuccess = function (title, message, options) {
            return this.showAlert(title, message, 'success', options);
        };

        this.destroy = function () {
            _(panes).invoke('destroy');
            appPane.destroy();
            appPane = panes = panesById = null;
        };

        // initialization -----------------------------------------------------

        // create the application pane, and insert the container node
        appPane = new Pane(app, 'mainApplicationPane', { classes: 'app-pane' });
        appPane.getNode()
            .toggleClass('scrollable', Utils.getBooleanOption(options, 'scrollable', false))
            .append(appContainerNode.css('margin', Utils.getIntegerOption(options, 'padding', 0, 0) + 'px'));

        // add the main application pane to the application window
        app.getWindowNode().addClass('io-ox-office-main ' + app.getName().replace(/[.\/]/g, '-') + '-main').append(appPane.getNode());

        // add shadow nodes above application pane, but below other panes
        _(['top', 'bottom', 'left', 'right']).each(function (border) {
            app.getWindowNode().append(shadowNodes[border] = $('<div>').addClass('app-pane-shadow'));
        });

        // listen to browser window resize events when the application window is visible
        app.registerWindowResizeHandler(refreshPaneLayout);

        // update all view components every time the window will be shown
        app.getWindow().on('show', function () {
            app.getController().update().done();
        });

        // #TODO: remove black/white icon hack, when icons are fonts instead of bitmaps
        app.on('docs:init:after', function () {
            app.getWindowNode().find('.toolbox .group:not(.design-white) a.button i').addClass('icon-white').closest('.group').addClass('white-icons');
        });

    } // class View

    // exports ================================================================

    return _.makeExtendable(View);

});
