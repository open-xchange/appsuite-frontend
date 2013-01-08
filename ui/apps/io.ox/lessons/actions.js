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
define('io.ox/lessons/actions', ['io.ox/core/extensions', 'io.ox/core/extPatterns/links'], function (ext, links) {
    
    "use strict";
    
    new links.Action('io.ox/lessons/actions/toc', {
        id: 'toc',
        action: function (baton) {
            baton.app.tableOfContents();
        }
    });
    
    new links.ActionGroup("io.ox/lessons/links/toolbar", {
        index: 100,
        id: 'default',
        icon: function () {
            return $('<i class="icon-list">');
        }
    });

    new links.ActionLink('io.ox/lessons/links/toolbar/default', {
        index: 100,
        id: 'default',
        label: 'Table of contents',
        ref: 'io.ox/lessons/actions/toc'
    });
    
        
});