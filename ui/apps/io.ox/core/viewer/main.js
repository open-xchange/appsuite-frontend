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

define('io.ox/core/viewer/main', [
    'io.ox/core/viewer/backbone',
    'io.ox/core/viewer/views/mainview'
], function (backbone, MainView) {

    'use strict';

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
            //console.warn('Main.launch() ');
            if (!baton) {
                console.error('Core.Viewer.launch(): no files to preview.');
                return;
            }
            // Drive has the list in the allIds property, Mail in the root
            var fileList = baton.allIds || baton;
            // create file collection and populate it with file models
            this.fileCollection = new backbone.Collection();
            this.fileCollection.set(fileList, { parse: true });
            // set the index of the selected file (Drive only)
            if (baton.data) {
                this.fileCollection.setStartIndex(baton.data);
            }
            // create main view and append main view to core
            this.mainView =  new MainView({ collection: this.fileCollection });
            $('#io-ox-core').append(this.mainView.el);
        };
    };

    return new Viewer();
});
