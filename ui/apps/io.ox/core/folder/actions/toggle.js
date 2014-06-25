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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/toggle', [], function () {

    'use strict';

    return function toggle(baton, state, point) {

        var data = baton.data,
            settings = baton.app.settings,
            blacklist = settings.get('folderview/blacklist', {});

        // update blacklist
        if (state) delete blacklist[data.id]; else blacklist[data.id] = true;
        settings.set('folderview/blacklist', blacklist).save();

        //repaint tree but keep scrollposition
        var node = baton.tree.container.parents('.foldertree-container'),
            pos = node.scrollTop();

        baton.tree.repaint().done(function () {
            node.scrollTop(pos);//apply old scrollposition
        });

        //dropdown menu needs a redraw too
        var ul = baton.$.sidepanel.find('.context-dropdown ul');
        point.invoke('draw', ul.empty(), baton);
    };
});
