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
    * Extracts the file list from the baton of the Viewer launch action.
    *
    * @param {Object} baton
    *  The baton object delivered by the Viewer launch action.
    *
    * @returns {Array|null}
    *  The file list or null.
    */
    function getFileList (baton) {
        if (!baton) { return null; }
        if (baton.collection) {
            return baton.collection.models;
        }
        // exception for Mail and PIM
        if (_.isArray(baton)) return baton;
        return null;
    }

    /**
     * The OX Viewer component
     *
     * @constructor
     */
    var Viewer = function () {
        /**
         * Main bootstrap file for the OX Viewer.
         */
        this.launch = function (baton) {

            var el = $('<div class="io-ox-viewer abs">');
            $('#io-ox-core').append(el);

            // resolve dependencies now for an instant response
            require(['io.ox/core/viewer/backbone', 'io.ox/core/viewer/views/mainview'], function (backbone, MainView) {

                var fileList = getFileList(baton);
                if (!fileList) {
                    console.error('Core.Viewer.main.launch(): no files to preview.');
                    el.remove();
                    el = null;
                    return;
                }
                // create file collection and populate it with file models
                this.fileCollection = new backbone.Collection();
                this.fileCollection.reset(fileList, { parse: true });
                // set the index of the selected file (Drive only)
                if (baton.data) {
                    this.fileCollection.setStartIndex(baton.data);
                }
                // create main view and append main view to core
                this.mainView = new MainView({ collection: this.fileCollection, el: el });

            }.bind(this));
        };
    };

    return new Viewer();
});
