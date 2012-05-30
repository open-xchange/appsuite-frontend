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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/settings/accounts/email/model',
      ['io.ox/core/tk/model'], function (Model) {

    'use strict';

    var accountSchema = new Model.Schema({

        'id': {format: 'number', label: 'Id'},
        'login': {format: 'string'},
        'password': {format: 'string'},
        'mail_url': {format: 'string'},
        'transport_url': {format: 'string'},
        'name': { format: 'string', label: 'name'},
        'primary_address': {format: 'string'},
        'spam_handler': {format: 'string'},
        'trash': {format: 'string'},
        'sent': {format: 'string'},
        'drafts': {format: 'string'},
        'spam': {format: 'string'},
        'confirmed_spam': {format: 'string'},
        'confirmed_ham': {format: 'string'},
        'mail_server': {format: 'string'},
        'mail_port': {format: 'number'},
        'mail_protocol': {format: 'string'},
        'mail_secure': {format: 'boolean'},
        'transport_server': {format: 'string'},
        'transport_port': {format: 'number'},
        'transport_protocol': {fomrat: 'string'},
        'transport_secure': {format: 'boolean'},
        'transport_login': {format: 'string'},
        'transport_password': {format: 'string'},
        'unified_inbox_enabled': {format: 'boolean'},
        'trash_fullname': {format: 'string'},
        'sent_fullname': {format: 'string'},
        'drafts_fullname': {format: 'string'},
        'spam_fullname': {format: 'string'},
        'confirmed_spam_fullname': {format: 'string'},
        'confirmed_ham_fullname': {format: 'string'},
        'pop3_refresh_rate': {format: 'number'},
        'pop3_expunge_on_quit': {format: 'boolean'},
        'pop3_delete_write_through': {format: 'boolean'},
        'pop3_storage': {format: 'string'},
        'pop3_path': {format: 'string'},
        'personal': {format: 'string'},
        'reply_to': {format: 'string'}
    });

    return Model.extend({ schema: accountSchema });
});







