/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
(function () {
    "use strict";
    
    var lessons = [
        'basic_apps',
        'basic_deferred',
        'basic_extensions',
        'basic_jquery',
        'model_view'
    ];
    
    var dependencies = _(lessons).map(function (lesson) {
        return 'io.ox/lessons/lessons/' + lesson + "/register";
    });
    
    define('io.ox/lessons/lessonlist', dependencies, $.noop);
}());
