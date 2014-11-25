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
    'io.ox/core/viewer/models/filemodel',
    'io.ox/core/viewer/collections/filecollection',
    'io.ox/core/viewer/views/mainview'
], function (FileModel, FileCollection, MainView) {

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
        this.launch = function (data) {
            //console.info('Main.launch() ', data);
            var files = data && data.baton && data.baton.allIds;
            // create file collection and populate it with file models
            var fileCollection = new FileCollection();
            _.each(files, function (file) {
                fileCollection.add(new FileModel(file, { parse: true }) );
            });
            // create main view and append main view to core
            var mainView =  new MainView({ collection: fileCollection });
            $('#io-ox-core').append(mainView.el);
        };
    };

    return new Viewer();
});
