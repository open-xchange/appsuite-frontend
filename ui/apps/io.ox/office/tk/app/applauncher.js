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

define('io.ox/office/tk/app/applauncher', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // static class ApplicationLauncher =======================================

    /**
     * Provides static helper function to find running applications and launch
     * new applications.
     */
    var ApplicationLauncher = {};

    /**
     * Tries to find a running application which is working on a file described
     * in the passed options object.
     *
     * @param {String} moduleName
     *  The application type identifier.
     *
     * @param {Object} [launchOptions]
     *  A map of options that may contain a file descriptor in 'options.file'.
     *  If existing, compares it with the file descriptors of all running
     *  applications with the specified module identifier (returned by their
     *  getFileDescriptor() method).
     *
     * @returns {ox.ui.App}
     *  A running application of the specified type with a matching file
     *  descriptor.
     */
    ApplicationLauncher.getRunningApplication = function (moduleName, launchOptions) {

        var // get file descriptor from options
            file = Utils.getObjectOption(launchOptions, 'file', null),

            // find running editor application
            runningApps = file ? ox.ui.App.get(moduleName).filter(function (app) {
                var appFile = _.isFunction(app.getFileDescriptor) ? app.getFileDescriptor() : null;
                // TODO: check file version too?
                return _.isObject(appFile) &&
                    (file.id === appFile.id) &&
                    (file.folder_id === appFile.folder_id);
            }) : [];

        if (runningApps.length > 1) {
            Utils.warn('ApplicationLauncher.getRunningApplication(): found multiple applications for the same file.');
        }
        return runningApps.length ? runningApps[0] : null;
    };

    /**
     * Creates a new application object of the specified type, and performs
     * basic initialization steps.
     *
     * @param {String} moduleName
     *  The application type identifier.
     *
     * @param {Function} ApplicationClass
     *  The constructor function of the application mix-in class that will
     *  extend the core application object. Receives the passed launch options
     *  as first parameter.
     *
     * @param {Object} [launchOptions]
     *  A map of options containing initialization data for the new application
     *  object.
     *
     * @returns {ox.ui.App}
     *  The new application object.
     */
    ApplicationLauncher.createApplication = function (moduleName, ApplicationClass, launchOptions) {

        var // the icon shown in the top bar launcher
            icon = Utils.getStringOption(launchOptions, 'icon', ''),
            // the base application object
            app = ox.ui.createApp({ name: moduleName, userContent: icon.length > 0, userContentIcon: icon });

        // mix-in constructor for additional application methods
        ApplicationClass.call(app, launchOptions);

        return app;
    };

    /**
     * Tries to find a running application which is working on a file described
     * in the passed options object (see method
     * ApplicationLauncher.getRunningApplication() for details). If no such
     * application exists, creates a new application object (see method
     * ApplicationLauncher.createApplication() for details).
     *
     * @param {String} moduleName
     *  The application type identifier.
     *
     * @param {Function} ApplicationClass
     *  The constructor function of the application mix-in class that will
     *  extend the core application object. Receives the passed launch options
     *  as first parameter.
     *
     * @param {Object} [launchOptions]
     *  A map of options containing initialization data for the new application
     *  object.
     *
     * @returns {ox.ui.App}
     *  A running application of the specified type with a matching file
     *  descriptor, or a newly created application object.
     */
    ApplicationLauncher.getOrCreateApplication = function (moduleName, ApplicationClass, launchOptions) {

        var // try to find a running application
            app = ApplicationLauncher.getRunningApplication(moduleName, launchOptions);

        // no running application: create and initialize a new application object
        if (!_.isObject(app)) {
            app = ApplicationLauncher.createApplication(moduleName, ApplicationClass, launchOptions);
        }

        return app;
    };

    // exports ================================================================

    return ApplicationLauncher;

});
