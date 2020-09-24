/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/mail/compose/actions/extensions', [
    'io.ox/mail/actions/attachmentEmpty',
    'io.ox/mail/api',
    'io.ox/mail/compose/api',
    'gettext!io.ox/mail',
    'settings!io.ox/mail',
    'io.ox/core/yell'
], function (attachmentEmpty, mailAPI, composeAPI, gt, settings, yell) {
    'use strict';

    var api = {};

    api.emptyAttachmentCheck = function (baton) {
        var files = baton.model.get('attachments').chain().pluck('originalFile').compact().value();
        return attachmentEmpty.emptinessCheck(files).then(_.identity, function () {
            baton.stopPropagation();
            throw arguments;
        });
    };


    api.waitForPendingUploads = function (baton) {
        var deferreds = baton.model.get('attachments')
            .chain()
            .map(function (model) {
                if (model.get('uploaded') >= 1) return;
                var def = new $.Deferred();
                model.trigger('force:upload');
                model.once('upload:complete', def.resolve);
                model.once('upload:failed', function (error) {
                    // to stop the cascade and result in an idle window instead of closing (prevent data loss)
                    baton.stopPropagation();
                    def.reject(error);
                });
                return def;
            })
            .compact()
            .value();
        if (deferreds.length <= 0) return;
        return $.when.apply($, deferreds).then(function () {
            baton.view.syncMail();
        });
    };

    api.removeUnusedInlineImages = function (baton) {
        var inlineAttachments = baton.model.get('attachments').where({ contentDisposition: 'INLINE' }),
            deferreds = _(inlineAttachments)
                .chain()
                .map(function (attachment) {
                    var space = baton.model.get('id'),
                        url = mailAPI.getUrl(_.extend({ space: space }, attachment), 'view').replace('?', '\\?');
                    if (new RegExp('<img[^>]*src="' + url + '"[^>]*>').test(baton.model.get('content'))) return;
                    if (new RegExp('<img[^>]*src="[^"]*' + attachment.get('id') + '"[^>]*>').test(baton.model.get('content'))) return;


                    return composeAPI.space.attachments.remove(space, attachment.get('id'));
                })
                .compact()
                .value();

        return $.when.apply($, deferreds);
    };

    api.checkForAutoEnabledDriveMail = function (opt) {
        opt = _.extend({
            yell: false,
            restoreWindow: false,
            stopPropagation: false,
            removeQueue: false
        }, opt);

        return function (baton) {
            var model = baton.model;

            if (!model.exceedsThreshold()) return;

            //#. %1$s is usually "Drive Mail" (product name; might be customized)
            if (opt.yell) yell('info', gt('Attachment file size too large. You have to use %1$s or reduce the attachment file size.', settings.get('compose/shareAttachments/name')));
            var sharedAttachments = model.get('sharedAttachments') || {};
            model.set('sharedAttachments', _.extend({}, sharedAttachments, { enabled: true }));

            if (opt.stopPropagation) baton.stopPropagation();

            if (opt.restoreWindow) {
                var win = baton.app.getWindow();
                win.idle().show();
            }

            if (opt.removeQueue) composeAPI.queue.remove(baton.model.get('id'));

            throw arguments;
        };
    };

    api.attachmentMissingCheck = function (baton) {
        if (baton.model.get('attachments').length >= 1) return;

        // Native language via gt
        //#. Detection phrases: These are phrases with a "|" as delimiter to detect if someone had the intent to attach a file to a mail, but forgot to do so.
        //#. Please use this as a template for english. There could be more or less phrases in other languages, there is no maximum or minimum length, as
        //#. long as you use the "|" delimiter to seperate each phrase. Also: Detection is case-insensitive so we don't need case variants.
        var translated = gt('see attached|see attachment|see included|is attached|attached is|are attached|attached are|attached to this email|attached to this message|I\'m attaching|I am attaching|I\'ve attached|I have attached|I attach|I attached|find attached|find the attached|find included|find the included|attached file|see the attached|see attachments|attached files|see the attachment'),
            // English
            en_US = '|see attached|see attachment|see included|is attached|attached is|are attached|attached are|attached to this email|attached to this message|I\'m attaching|I am attaching|I\'ve attached|I have attached|I attach|I attached|find attached|find the attached|find included|find the included|attached file|see the attached|see attachments|attached files|see the attachment',
            // German
            de_DE = '|siehe Anhang|angehängt|anbei|hinzugefügt|ist angehängt|angehängt ist|sind angehängt|angehängt sind|an diese E-Mail angehängt|an diese Nachricht angehängt|Anhang hinzufügen|Anhang anbei|Anhang hinzugefügt|anbei finden|anbei|im Anhang|mit dieser E-Mail sende ich|angehängte Datei|siehe angehängte Datei|siehe Anhänge|angehängte Dateien|siehe Anlage|siehe Anlagen';

        var words = _((translated + en_US + de_DE).split('|')).chain().compact().uniq().value().join('|');

        var mailContent = (baton.model.get('subject') || '') + '|';
        if (baton.view.editor.getMode() === 'html') {
            mailContent += $(baton.view.editor.getContent()).not('blockquote,.io-ox-signature').text();
        } else {
            mailContent += baton.view.editor.getContent().replace(/^>.*\n/gm, '');
        }

        var detectedString = new RegExp('(' + words + ')', 'i').exec(mailContent);
        if (!detectedString) return;

        var def = $.Deferred();
        require(['io.ox/backbone/views/modal'], function (ModalDialogView) {
            new ModalDialogView({ title: gt('Forgot attachment?'), focus: '.btn-primary' })
            .on('add', function () {
                this.previousFocus = $('[data-extension-id="add_attachments"] > div > a[role="button"]');
                baton.stopPropagation();
                def.reject();
            })
            .on('send', function () { def.resolve(); })
            .addButton({ action: 'add', label: gt('Cancel'), className: 'btn-default' })
            .addButton({ action: 'send', label: gt('Send without attachment') })
            .build(function () {
                this.$body.append(
                    $('<div>').append(
                        $('<p>').text(gt('It appears as if you forgot to attach a file.')),
                        $('<p>').text(gt('You mentioned "%s" in your email, but there are no files attached.', detectedString[1]))
                    )
                );
            })
            .open();
        });
        return def;
    };

    return api;
});
