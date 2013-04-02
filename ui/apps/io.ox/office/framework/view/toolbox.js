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

define('io.ox/office/framework/view/toolbox',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/button',
     'io.ox/office/framework/view/component'
    ], function (Utils, Button, Component) {

    'use strict';

    var // CSS class for tool boxes currently collapsed
        COLLAPSED_CLASS = 'collapsed',

        // unique identifier to create controller items
        uniqueId = 0;

    // class ToolBox ==========================================================

    /**
     * Represents a view component with a fixed width and a vertically oriented
     * layout. Optionally, a heading label will be shown that allows to
     * collapse and expand the tool box.
     *
     * @constructor
     *
     * @extends Component
     *
     * @param {BaseApplication} app
     *  The application containing this tool box instance.
     *
     * @param {Object} [options]
     *  A map of options controlling the appearance and behavior of the tool
     *  box. Supports all options of the Component base class. Additionally,
     *  the following options are supported:
     *  @param {String} [options.label]
     *      If specified, a heading label will be shown at the top border of
     *      the tool box. The heading label can be clicked to collapse (hide
     *      all its contents but the heading label) and expand (show all its
     *      contents) the tool box.
     */
    function ToolBox(app, options) {

        var // self reference
            self = this,

            // the unique base controller key of the tool box
            baseKey = 'view/toolbox/' + (uniqueId += 1),

            // the label for the heading button
            headingLabel = Utils.getStringOption(options, 'label'),

            // the heading button
            headingButton = null,

            // the current line node as target for new container nodes
            lineNode = null,

            // whether next groups will be inserted into the right tab node
            rightTab = false,

            // the current container node as target for new groups
            containerNode = null;

        // base constructor ---------------------------------------------------

        Component.call(this, app, Utils.extendOptions(options, { groupInserter: groupInserter }));

        // private methods ----------------------------------------------------

        /**
         * Inserts the root DOM node of the passed group into this tool box.
         */
        function groupInserter(group) {

            var // the current tab node (for left/right alignment)
                tabNode = null,
                // whether the group takes the entire width of the tool box
                fullWidth = Utils.getBooleanOption(group.getOptions(), 'fullWidth', false);

            // the leading heading button
            if (group === headingButton) {
                self.getNode().append(group.getNode());
                return;
            }

            // get or create the line node
            if (fullWidth || !lineNode) {
                lineNode = $('<div>').addClass('group-line');
                self.getNode().append(lineNode);
            }

            // full-width: insert group node directly into the line
            if (fullWidth) {
                // class 'auto-width' expands width of group child node (button, text field) to group width
                lineNode.append(group.getNode().addClass('auto-width').css('width', '100%'));
                self.newLine();
                return;
            }

            // get or create tab node
            tabNode = lineNode.children(rightTab ? '.tab-right' : '.tab-left');
            if (tabNode.length === 0) {
                tabNode = $('<div>').addClass(rightTab ? 'tab-right' : 'tab-left');
                lineNode.append(tabNode);
            }

            // get or create group container node, insert the group
            if (!containerNode) {
                containerNode = $('<div>').addClass('group-container');
                tabNode.append(containerNode);
            }
            containerNode.append(group.getNode());
        }

        // methods ------------------------------------------------------------

        /**
         * A gap will be inserted before the next inserted group in the current
         * line.
         *
         * @param {Number} [width=9]
         *  The width of the gap, in pixels.
         *
         * @returns {ToolBox}
         *  A reference to this instance.
         */
        this.addGap = function (width) {
            if (containerNode) {
                containerNode.css('margin-right', (_.isNumber(width) ? width : 9) + 'px');
            }
            containerNode = null;
            return this;
        };

        /**
         * A gap will be inserted before the next inserted group in the current
         * line. The following groups inserted into the current line will be
         * aligned to the right border.
         *
         * @returns {ToolBox}
         *  A reference to this instance.
         */
        this.addRightTab = function () {
            if (!rightTab) {
                containerNode = null;
                rightTab = true;
            }
            return this;
        };

        /**
         * New groups will be inserted into a new line in this tool box.
         *
         * @returns {ToolBox}
         *  A reference to this instance.
         */
        this.newLine = function () {
            lineNode = containerNode = null;
            rightTab = false;
            return this;
        };

        // initialization -----------------------------------------------------

        this.getNode().addClass('toolbox');

        // tool box with heading (button that collapses/expands the tool box)
        if (_.isString(headingLabel)) {

            // add a special marker CSS class
            this.getNode().addClass('collapsing');

            // create a controller item that collapses/expands the tool box
            app.getController().registerDefinition(baseKey + '/expand', {
                set: function () {
                    self.getNode().toggleClass(COLLAPSED_CLASS);
                    self.trigger('expand', !self.getNode().hasClass(COLLAPSED_CLASS));
                }
            });

            // create the heading button
            headingButton = new Button({ classes: 'heading', label: headingLabel });
            this.addGroup(baseKey + '/expand', headingButton);
        }

    } // class ToolBox

    // exports ================================================================

    // derive this class from class Component
    return Component.extend({ constructor: ToolBox });

});
