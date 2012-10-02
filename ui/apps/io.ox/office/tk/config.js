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

define('io.ox/office/tk/config',
    ['io.ox/core/config',
     'io.ox/office/tk/utils'
     ], function (CoreConfig, Utils) {

    'use strict';

    var // the configuration items of the module com.open-xchange.documents
        documentsConfig = CoreConfig.get('modules')['com.open-xchange.documents'];

    // class Config ===========================================================

    /**
     * The documents Config 'namespace' wraps the configuration of the module
     * com.open-xchange.documents.
     */
    var Config = {};

    /**
     * Returns the value of the configuration property 'debugavailable'.
     *
     * @returns {Boolean}
     *  whether debug mode is enabled.
     */
    Config.isDebugAvailable = function () {
        return Utils.getBooleanOption(documentsConfig, 'debugavailable', false);
    };

    /**
     * Returns the value of the configuration property 'odfsupport'.
     *
     * @returns {Boolean}
     *  whether ODF documents are supported.
     */
    Config.isODFSupported = function () {
        return Utils.getBooleanOption(documentsConfig, 'odfsupport', false);
    };

    // exports ================================================================

    return Config;

});
