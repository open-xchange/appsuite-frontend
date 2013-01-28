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
         'gettext!io.ox/office/main'
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
     * @param {Application} app
     *  The application containing this view instance.
     *
     * @param {Object} [options]
     *  Additional options to control the appearance of the view. The following
     *  options are supported:
     *  @param {Number} [options.modelPadding=0]
     *      The padding of the model root node to the borders of the scrollable
     *      application pane.
     */
    function View(app, options) {

        var // the application controller
            controller = app.getController(),

            // the application window
            win = ox.ui.createWindow({ name: app.getName(), search: options.search || false }),

            // centered application pane
            appPane = null,

            // application model container node
            modelContainerNode = $('<div>').addClass('app-pane-model-container'),

            // all pane instances, in insertion order
            panes = [],

            // all pane instances, mapped by identifier
            panesById = {},

            // inner shadows for application pane
            shadowNodes = {},

            // alert banner currently shown
            currentAlert = null,

            // identifier of the view pane following an alert banner
            alertsBeforePaneId = null;

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
         * Returns the root node of the application window.
         *
         * @returns {jQuery}
         *  The root node of the application window.
         */
        this.getWindowMainNode = function () {
            return win.nodes.main;
        };

        /**
         * Returns the central DOM node of the application (the complete inner
         * area between all existing view panes).
         *
         * @returns {jQuery}
         *  The central DOM node of the application.
         */
        this.getApplicationNode = function () {
            return appPane.getNode();
        };

        /**
         * Adds the passed view pane instance into this view.
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
         *  Supports all options supported by the Pane class constructor.
         *  Additionally, the following options are supported:
         *  @param {Boolean} [options.overlay=false]
         *      If set to true, the pane will float over the other panes and
         *      application contents instead of reserving and consuming the
         *      space needed for its size.
         *
         * @returns {Pane}
         *  The new view pane.
         */
        this.createPane = function (id, position, options) {

            var // create the new view pane
                pane = panesById[id] = new Pane(app, id, options);

            panes.push(pane);
            win.nodes.main.append(pane.getNode());
            this.setPanePosition(id, position);

            // hover mode
            if (Utils.getBooleanOption(options, 'overlay', false)) {
                pane.getNode().addClass(OVERLAY_CLASS);
            }

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
            return  (id in panesById) && (panesById[id].getNode().css('display') !== 'none');
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
         * rendered after an alert banner. By default, an alert banner will be
         * drawn after all view panes.
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
         *  @param {Boolean} [options.autoClose]
         *      If set to true, the alert banner will vanish automatically
         *      after five seconds.
         *  @param {Number} [options.timeout]
         *      Can be specified together with 'options.autoClose'. Specifies
         *      the number of milliseconds until the alert banner will
         *      vanish automatically. If not specified the default of five
         *      seconds is used.
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
                    .data('pane-pos', 'top');

            function toggleOverlay(state) {
                alert.toggleClass(OVERLAY_CLASS, state);
                refreshPaneLayout();
            }

            // Hides the alert with a specific animation.
            function closeAlert() {
                toggleOverlay(true);
                alert.slideUp('fast', function () {
                    alert.remove();
                    if (alert.is(currentAlert)) {
                        currentAlert = null;
                    }
                });
            }

            // remove alert banner currently shown, update reference to current alert
            if (currentAlert) { currentAlert.remove(); }
            currentAlert = alert;

            // make the alert banner closeable
            if (Utils.getBooleanOption(options, 'closeable', false)) {
                // alert can be closed by clicking anywhere in the banner
                alert.click(closeAlert);
            } else {
                // remove closer button
                alert.find('a.close').remove();
            }

            // always execute controller default action when alert has been clicked (also if not closeable)
            alert.click(function () { app.getController().done(); });

            // initialize auto-close
            if (Utils.getBooleanOption(options, 'autoClose', false)) {
                var timeout = Utils.getNumberOption(options, 'timeout', 5000);
                _.delay(closeAlert, timeout);
            }

            // insert the push button into the alert banner
            if (_.isString(buttonLabel) && _.isString(buttonKey)) {
                alert.append(
                    $.button({ label: buttonLabel })
                        .addClass('btn-' + type + ' btn-mini')
                        .click(function () { closeAlert(); app.getController().change(buttonKey); })
                );
            }

            // insert and show the new alert banner
            win.nodes.main.append(alert);
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

        /**
         * Shows a closeable error alert banner with a 'Load Error' message.
         *
         * @returns {View}
         *  A reference to this instance.
         */
        this.showLoadError = function () {
            return this.showError(gt('Load Error'), gt('An error occurred while loading the document.'), { closeable: true });
        };

        this.destroy = function () {
            _(panes).invoke('destroy');
            appPane.destroy();
            win = appPane = panes = panesById = null;
        };

        // initialization -----------------------------------------------------

        // set the window at the application instance
        app.setWindow(win);

        // insert the document model root node into the container node
        modelContainerNode.append(app.getModel().getNode());
        modelContainerNode.css('margin', Utils.getIntegerOption(options, 'modelPadding', 0, 0) + 'px');

        // create the application pane, and insert the model container
        appPane = new Pane(app, 'mainApplicationPane', { classes: 'app-pane' });
        appPane.getNode().append(modelContainerNode);

        // add the main application pane
        win.nodes.main.addClass('io-ox-office-main ' + app.getName().replace(/[.\/]/g, '-') + '-main').append(appPane.getNode());

        // add shadow nodes above application pane, but below other panes
        _(['top', 'bottom', 'left', 'right']).each(function (border) {
            win.nodes.main.append(shadowNodes[border] = $('<div>').addClass('app-pane-shadow'));
        });

        // listen to browser window resize events when the OX window is visible
        app.registerWindowResizeHandler(refreshPaneLayout);

        // update all view components every time the window will be shown
        win.on('show', function () { controller.update(); });

        // #TODO: remove black/white icon hack, when icons are fonts instead of bitmaps
        win.one('show', function () {
            win.nodes.main.find('.toolbox .group:not(.design-white) a.button i').addClass('icon-white').closest('.group').addClass('white-icons');
        });

    } // class View

    // exports ================================================================

    return _.makeExtendable(View);

});
