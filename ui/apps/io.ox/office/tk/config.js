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

define('io.ox/office/tk/config', ['settings!io.ox/office'], function (settings) {

    'use strict';

    var // the configuration items of the OX Documents modules
        documentsConfig = settings.get('module', {});

    // static class Config ====================================================

    /**
     * Wraps the configuration of the OX Documents module.
     */
    var Config = {};


    /**
     * Returns the complete set of configuration properties.
     *
     * @returns {Object}
     *  The complete set of configuration properties of the OX Documents
     *  module.
     */
    Config.get = function () {
        return documentsConfig;
    };

    /**
     * Returns the value of the configuration property 'debugavailable'.
     *
     * @returns {Boolean}
     *  Whether debug mode is enabled in all OX Documents applications.
     */
    Config.isDebug = function () {
        return !!documentsConfig.debugavailable;
    };

    // exports ================================================================

    return Config;

});
