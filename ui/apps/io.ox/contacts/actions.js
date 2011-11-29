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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/actions', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    // actions

    ext.point("io.ox/contacts/detail/actions").extend(new ext.InlineLinks({
        index: 100,
        id: "inline-links",
        ref: 'io.ox/contacts/links/inline'
    }));
    
//    inline links
    
    ext.point("io.ox/contacts/links/inline").extend(new ext.Link({
        index: 100,
        id: 'delete',
        label: 'delete',
        ref: 'io.ox/contacts/main/delete'
        
    }));
    
    ext.point("io.ox/contacts/links/inline").extend(new ext.Link({
        index: 100,
        id: 'update',
        label: 'edit',
        ref: 'io.ox/contacts/main/update'
    }));
});