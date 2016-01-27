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
         *  @param {String} [data.folder]
         *  if you want to open all files in the folder with the current file selected you can pass a single file and a folder. the file will be selected first
         */
        this.launch = function (data) {

            if (!data) return console.error('Core.Viewer.main.launch(): no data supplied');
            if (!_.isArray(data.files) || data.files.length === 0) return console.error('Core.Viewer.main.launch(): no files to preview.');

            var self = this,
                el = $('<div class="io-ox-viewer abs">'),
                fileList = [].concat(data.files),
                container = data.container || $('#io-ox-core');

            container.append(el);

            function cont() {
                // resolve dependencies now for an instant response
                require(['io.ox/core/viewer/backbone', 'io.ox/core/viewer/views/mainview'], function (backbone, MainView) {
                    // create file collection and populate it with file models
                    self.fileCollection = new backbone.Collection();
                    self.fileCollection.reset(fileList, { parse: true });
                    // set the index of the selected file (Drive only)
                    if (data.selection) {
                        self.fileCollection.setStartIndex(data.selection);
                    }
                    // create main view and append main view to core
                    self.mainView = new MainView({ collection: self.fileCollection, el: el, app: data.app, standalone: data.standalone, opt: data.opt || {} });

                    self.mainView.on('dispose', function () {
                        // remove id form URL hash (see bug 43410)
                        // use-case: viewer was opened via deep-link; a page-reload might surprise the user
                        _.url.hash('id', null);
                    });
                });
            }

            if (data.folder) {
                require(['io.ox/files/api'], function (api) {
                    api.getAll(data.folder).then(function success(files) {
                        data.selection = data.files[0];
                        function getter(item) {
                            return this.get(_.cid(item));
                        }
                        // the viewer has listeners that work directly on the model
                        // so we need to get the pool models instead of creating own models
                        fileList = _(files).map(getter, api.pool.get('detail'));
                    }).always(cont);
                });
            } else {
                cont();
            }
        };
    };

    return Viewer;
});
