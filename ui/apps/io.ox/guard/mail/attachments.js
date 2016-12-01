/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * author Greg Hill <greg.hill@open-xchange.com>
 *
 * Copyright (C) 2016-2020 OX Software GmbH
 */
define('io.ox/guard/mail/attachments', ['io.ox/core/capabilities', 'io.ox/core/http'], function (capabilities, http) {
    'use strict';

    var attachments = {};

    function saveAttachment(data, target, reEncrypt) {
        if (!capabilities.has('guard')) return new $.Deferred().reject('Guard not enabled');

        if (!data.parent) return $.Deferred().reject('Error saving Attachment, no parent found');

        var file = data,
            params = {
                action: 'attachment',
                id: data.parent.id,
                encrextrapass: data.extrapass,
                filename: data.filename,
                folder: data.parent.folder_id,
                dest_folder: target,
                inline: data.pgpFormat === 'pgpinline',
                attachment: data.id,
                folder_id: target,
                session_id: ox.session,
                userid: ox.user_id,
                cid: ox.context_id,
                epassword: data.epass,
                auth: window.oxguarddata.passcode,
                reEncrypt: reEncrypt,
                description: 'Saved mail attachment'
            };
        return http.PUT({
            module: 'oxguard/pgp',
            params: {
                action: 'savedecodedattachment',
                id: data.mail.id,
                folder: data.mail.folder_id,
                dest_folder: target,
                attachment: data.id
            },
            data: params,
            appendColumns: false
        }).then(function (id) {
            var newdata = {
                filename: file.filename + (reEncrypt ? '.pgp' : ''),
                id: id,
                mailFolder: file.parent.folder_id
            };
            return { data: newdata };
        });
    }
    // Save PGP attachment to drive fully encrypted
    attachments.savePGPAttachment = function (data, target) {
        return saveAttachment(data, target, true);
    };

    // Save PGP attachment to drive decoded
    attachments.saveDecodedPGPAttachment = function (data, target) {
        return saveAttachment(data, target, false);
    };

    return attachments;
});
