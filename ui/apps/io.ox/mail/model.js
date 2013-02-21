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
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */
define('io.ox/mail/model',
      ['io.ox/core/tk/model'], function (Model) {

    'use strict';

    var mailSchema = new Model.Schema({
        'subject': {format: 'string'},
        'from': { format: 'array'},
        'to': {format: 'array'},
        'cc': {format: 'array'},
        'bcc': {format: 'array'},
        'headers': {format: 'array'},
        'sent_date': {format: 'date'},
        'received_date': {format: 'date'},
        'id': {format: 'string'},
        'folder_id': {format: 'string'},
        'size': {format: 'number'},
        'flags': {format: 'number'},
        'color_label': {format: 'string'},
        'flag_seen': {format: 'string'},
        'priority': {format: 'number'},
        'disp_notification_to': {format: 'string'},
        'level': {format: 'string'},
        'msgref': {format: 'string'},
        'account_name': {format: 'string'},
        'attachment': {format: 'string'},
        'attachments': {format: 'array'},
        'unread': {format: 'number'},
        'modified': {format: 'number'},
        'user': {format: 'array'},
        'content_type': {format: 'string'}
    });

    return Model.extend({ schema: mailSchema });
});
