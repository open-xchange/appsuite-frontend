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
 * @author Oliver Specht <oliver.specht@open-xchange.com>
 */

define('io.ox/office/tk/config', ['io.ox/core/config'], function (CoreConfig) {

    'use strict';

    // class Config =======================================================

    /**
     * The documents Config 'namespace' wraps the configuration of the module com.open-xchange.documents.
     * @constructor
     *
     */
    var Config = {};
    /**
     * Returns the value of the configuration property debugavailable.
     *
     * @returns
     *  whether debug mode is enabled.
     */
    Config.isDebugAvailable = function () {
                
        return CoreConfig.get("modules")['com.open-xchange.documents'].debugavailable;
    };
    /**
     * Returns the value of the configuration property odfsupport.
     *
     * @returns
     *  whether ODF documents are supported.
     */
    Config.isODFSupported = function () {
        return CoreConfig.get("modules")['com.open-xchange.documents'].odfsupport;
    };
    return Config;
});
