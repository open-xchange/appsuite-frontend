/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

//TODO: split into packages for services, accounts and messages
define('io.ox/messaging/messages/api', ['io.ox/core/http'], function (http) {

    'use strict';

    var api = {
        all: function (folder) {
            return http.GET({
                module: 'messaging/message',
                params: {
                    action: 'all',
                    columns: 'folder,from,id,subject,from,receivedDate,body,headers,picture,url',
                    folder: folder
                }
            });
        }
    };
    return api;
});
