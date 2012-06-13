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

define('io.ox/office/model',
      ['io.ox/core/tk/model'], function (Model) {

    'use strict';

    var schema = new Model.Schema({
        'title': { format: 'string' }
    });

    return Model.extend({ schema: schema });
});
