// jscs:disable disallowTrailingWhitespace
/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */

define('io.ox/core/viewer/main', [], function () {

    'use strict';

    /**
     * The OX Viewer component
     *
     * @constructor
     */
    var Viewer = function () {

        /**
         * Launches the OX Viewer.
         *
         * @param {Object} data
         *  @param {Object[]} data.files
         *  an array of plain file objects or FilesAPI file models, which should to be displayed in the Viewer
         *  @param {Object} [data.selection]
         *  a selected file, as a plain object. This is optional. The Viewer will start with the first file
         *  in the data.files Array if this parameter is omitted.
         *  @param {jQuery} [data.container]
         *  a container element where the viewer element should be appended to. Defaults to #io-ox-core element.
         *  @param {String} [data.standalone = false]
         *  whether viewer should be launched in standalone mode.
         *  @param {Boolean} [data.app]
         *  a reference to an app object, from which this viewer is launched.
         *  @param {Object} [data.opt]
         *  a reference to an an options object that can be accessed in all subviews
         */
        this.launch = function (data) {

            if (!data) {
                console.error('Core.Viewer.main.launch(): no data supplied');
                return;
            }

            var el = $('<div class="io-ox-viewer abs">');

            (data.container || $('#io-ox-core')).append(el);

            // resolve dependencies now for an instant response
            require(['io.ox/core/viewer/backbone', 'io.ox/core/viewer/views/mainview'], function (backbone, MainView) {
                var fileList = data.files;
                if (!(_.isArray(fileList) && fileList.length > 0)) {
                    console.error('Core.Viewer.main.launch(): no files to preview.');
                    el.remove();
                    el = null;
                    return;
                }
                // create file collection and populate it with file models
                this.fileCollection = new backbone.Collection();
                this.fileCollection.reset(fileList, { parse: true });
                // set the index of the selected file (Drive only)
                if (data.selection) {
                    this.fileCollection.setStartIndex(data.selection);
                }
                // create main view and append main view to core
                this.mainView = new MainView({ collection: this.fileCollection, el: el, app: data.app, standalone: data.standalone, opt: data.opt || {} });

            }.bind(this));
        };
    };

    return Viewer;
});
