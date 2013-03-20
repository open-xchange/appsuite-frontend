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
        COLLAPSED_CLASS = 'collapsed';

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
     * @param {String} id
     *  The unique identifier of the tool box. Will be used to register a
     *  controller item that handles the collapsed state of the tool box.
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
    function ToolBox(app, id, options) {

        var // self reference
            self = this,

            // the unique base controller key of the tool box
            baseKey = 'view/toolbox/' + id,

            // the label for the heading button
            headingLabel = Utils.getStringOption(options, 'label'),

            // the heading button
            headingButton = null,

            // the current line node as target for new container nodes
            lineNode = null,

            // the current container node as target for new groups
            containerNode = null;

        // base constructor ---------------------------------------------------

        Component.call(this, app, Utils.extendOptions({ groupInserter: groupInserter }, options));

        // private methods ----------------------------------------------------

        function groupInserter(group) {
            if (group === headingButton) {
                self.getNode().append(group.getNode());
            } else {
                if (!lineNode) {
                    lineNode = Utils.createContainerNode('group-line');
                    self.getNode().append(lineNode);
                }
                if (!containerNode) {
                    containerNode = Utils.createContainerNode('group-container');
                    lineNode.append(containerNode);
                }
                containerNode.append(group.getNode());
            }
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
         * New groups will be inserted into a new line in this tool box.
         *
         * @returns {ToolBox}
         *  A reference to this instance.
         */
        this.newLine = function () {
            lineNode = containerNode = null;
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
                set: function (expand) { self.getNode().toggleClass(COLLAPSED_CLASS); }
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
