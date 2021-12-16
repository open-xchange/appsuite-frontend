/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/compose/signatures', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/mail/util',
    'io.ox/core/tk/textproc',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (ext, Dropdown, mailUtil, textproc, settings, gt) {

    'use strict';

    var extensions = {

        options: function (baton) {
            if (_.device('smartphone')) return;

            // TODO: limit is 'de fato' disabled for now
            var dropdown = this.data('view'),
                LIMIT = settings.get('compose/signatureLimit', 100);

            function draw() {
                var collection = baton.config.get('signatures'),
                    overflow = collection.length - LIMIT;
                dropdown.header(gt('Signatures'));
                dropdown.option('signatureId', '', gt('No signature'));

                collection.each(function (model, index) {
                    if (index >= LIMIT) return;
                    dropdown.option('signatureId', model.get('id'), model.get('displayname'));
                });
                if (overflow > 0) {
                    //#. %1$s: number of additional signatures in context of a signatures dropdown
                    dropdown.link('settings', gt('%1$s more...', overflow), function () {
                        var options = { id: 'io.ox/mail/settings/signatures' };
                        ox.launch('io.ox/settings/main', options).done(function () {
                            // minimize this window, so it doesn't overlap the setting the user wants to manage now
                            if (baton.view.app.getWindow().floating) baton.view.app.getWindow().floating.onMinimize();
                            this.setSettingsPane(options);
                        });
                    }, { icon: true });
                }
                dropdown.link('settings', gt('Edit signatures...'), function () {
                    var options = { id: 'io.ox/mail/settings/signatures' };
                    ox.launch('io.ox/settings/main', options).done(function () {
                        // minimize this window, so it doesn't overlap the setting the user wants to manage now
                        if (baton.view.app.getWindow().floating) baton.view.app.getWindow().floating.onMinimize();
                        this.setSettingsPane(options);
                    });
                }, { icon: true });
            }

            baton.view.signaturesLoading.done(draw);
        },

        menu: function (baton) {
            if (_.device('smartphone')) return;
            var self = this,
                dropdown = new Dropdown({ model: baton.config, label: gt('Signatures'), caret: true });

            function draw(collection) {
                dropdown.prepareReuse();
                dropdown.option('signatureId', '', gt('No signature'));
                dropdown.$ul.addClass('pull-right');

                collection.each(function (model) {
                    dropdown.option('signatureId', model.get('id'), model.get('displayname'));
                });
                dropdown.divider();
                dropdown.link('settings', gt('Manage signatures'), function () {
                    var options = { id: 'io.ox/mail/settings/signatures' };
                    ox.launch('io.ox/settings/main', options).done(function () {
                        // minimize this window, so it doesn't overlap the setting the user wants to manage now
                        if (baton.view.app.getWindow().floating) baton.view.app.getWindow().floating.onMinimize();
                        this.setSettingsPane(options);
                    });
                });
                dropdown.$ul.addClass('pull-right');
                dropdown.render();
            }

            baton.view.signaturesLoading.done(function (collection) {
                var refresh = draw.bind(null, collection);
                baton.view.listenTo(collection, 'add remove reset', refresh);
                refresh();
            });

            self.append(dropdown.$el.addClass('signatures text-left'));
        }
    };

    var util = {

        // extract the raw content
        getRaw: function (signature) {
            var str = $('<div>').html(signature.content).text();
            return util.stripWhitespace(str);
        },

        stripWhitespace: function (str) {
            return str.replace(/\s+/g, '');
        },

        looksLikeHTML: function (text) {
            return /(<\/?\w+(\s[^<>]*)?>)/.test(text);
        },

        lookLikePlainTextWithHTML: function (text) {
            // only plaintext with links
            return /^([^<>]|<\/?a>|<a [^>]+>)*$/.test(text);
        },

        cleanUpWhiteSpace: function (text) {
            return String(text || '')
                // replace white-space and evil \r
                .replace(/(\r\n|\n|\r)/g, '\n')
                // replace subsequent white-space (except linebreaks)
                .replace(/[\t\f\v ][\t\f\v ]+/g, ' ')
                .trim();
        },

        cleanUp: function (str, isHTML) {

            // special entities like '&'/&amp;
            var sourceLooksLikeHTML = util.looksLikeHTML(str),
                $el = $('<div>')[sourceLooksLikeHTML ? 'html' : 'text'](util.cleanUpWhiteSpace(str)),
                html = $el.html();

            if (util.lookLikePlainTextWithHTML(html)) html = '<pre>' + html + '</pre>';
            if (!isHTML && sourceLooksLikeHTML) return textproc.htmltotext(html);
            return html;
        }
    };

    // MODEL: extends mail compose model
    var model = {

        // use defaultSignature or reference already used one (edit-case)
        setInitialSignature: function (model) {
            var signatures = this.get('signatures'), signature, content = model.get('content');

            // when editing a draft we might have a signature
            if (this.is('edit|copy') || model.restored) {
                // get id of currently drawn signature
                signature = signatures.find(function (model) {
                    var raw = util.getRaw(model.toJSON());
                    // ignore empty signatures (match empty content)
                    if (_.isEmpty(raw)) return;
                    // HTML: node content matches signature
                    if (this.get('editorMode') === 'html') {
                        var node = $('<div>').append(content).children('div[class$="io-ox-signature"]:last');
                        return util.stripWhitespace(node.text()) === raw;
                    }
                    // TEXT: contains
                    return util.stripWhitespace(content).indexOf(raw) > -1;
                }.bind(this));

                if (signature) {
                    this.set('signatureIsRendered', true);
                    this.set('signatureId', signature.id, { silent: false });
                }
            } else {
                // if not editing a draft we add the default signature (if it exists)
                this.set('signatureId', this.getDefaultSignatureId());
            }
        },

        // set default signature dependant on mode, there are settings that correspond to this
        getDefaultSignatureId: function () {
            if (_.device('smartphone')) {
                // custom|none
                return settings.get('mobileSignatureType', 'none') === 'custom' ? '0' : '';
            }
            // no differentiation between compose/edit and reply/forward on mobile
            return mailUtil.getDefaultSignature(this.get('type'));
        },

        // getter
        getSignatureById: function (id) {
            id = String(id);
            return this.get('signatures').find(function (model) {
                return model.get('id') === id;
            });
        }
    };

    // VIEW: extends mail compose view
    var view = {

        getSignatureContent: function () {
            var isUnquotedForward = settings.get('forwardunquoted', false) && this.config.is('forward');
            if (isUnquotedForward) return this.editor.find('div[class$="io-ox-signature"]');
            return this.editor.children('div[class$="io-ox-signature"]');
        },

        // handler -> change:signatures
        updateSignatures: function () {
            var currentSignature = this.config.get('signature');

            if (!currentSignature) return;

            // get latest signature object of current signature
            var changedSignature = this.config.getSignatureById(currentSignature.id);
            // has changed?
            if (currentSignature.content !== changedSignature.content) {
                var isHTML = !!this.editor.find;
                if (isHTML) {
                    // HTML
                    this.getSignatureContent().each(function () {
                        var node = $(this),
                            text = node.text(),
                            changed = util.getRaw(changedSignature) === util.stripWhitespace(text);
                        if (changed) node.empty().append($(changedSignature.content));
                    });
                } else {
                    // TEXT
                    var currentContent = util.cleanUp(currentSignature.content, false),
                        changedContent = util.cleanUp(changedSignature.content, false);
                    this.editor.replaceParagraph(currentContent, changedContent);
                }

                this.config.set('signature', changedSignature);
            }
        },

        // handler -> change:signatureId
        setSignature: function (model, id) {
            var signatures = this.config.get('signatures'),
                signature = signatures.findWhere({ id: id }),
                isEmptySignature = (id === '');
            // invalid signature
            if (!signature && !isEmptySignature) return;

            // edit-case: signature already in DOM
            // compose-case: signature not in DOM
            this.config.set('signature', signature ? signature.toJSON() : null, { silent: !!this.config.get('signatureIsRendered') });
            this.config.unset('signatureIsRendered');
        },

        // handler -> change:signature
        redrawSignature: function (model, signature) {
            var previous = this.config && this.config.previous('signature');
            // remove old signature
            if (previous) this.removeSignature(previous);
            // set new signature
            if (!signature) return;
            this.appendSignature(signature);
        },

        removeSignature: function (signature) {
            // fallback: get signature by id
            signature = _.isString(signature) ? this.config.getSignatureById(signature) : signature;
            // fallback: get current signature object
            if (!signature) {
                if (!this.config.get('signature')) return;
                signature = this.config.get('signature');
            }

            var self = this,
                isHTML = !!this.editor.find,
                currentSignature = util.cleanUp(signature.content, isHTML);

            // remove current signature from editor
            if (isHTML) {
                this.getSignatureContent().each(function () {

                    var node = $(this),
                        text = node.text(),
                        unchanged = self.config.get('signatures').find(function (model) {
                            return util.getRaw(model.toJSON()) === util.stripWhitespace(text);
                        });

                    // remove entire block unless it seems edited
                    if (unchanged) node.remove(); else node.removeAttr('class');
                });
            } else if (currentSignature) {
                // matches linebreaks in insertPostCite
                var str = (signature.misc.insertion === 'below') ? '\n\n' + currentSignature : currentSignature + '\n\n';
                this.editor.replaceParagraph(str, '');
            }
        },

        appendSignature: function (signature) {
            var text, proc,
                isHTML = !!this.editor.find,
                isEmpty = !/<img\s[^>]*?src\s*=\s*['"]([^'"]*?)['"][^>]*?>/.test(signature.content || '') && !textproc.htmltotext(signature.content).trim();

            // add signature?
            if (isEmpty || !this.config.get('signatures').length) return;

            text = util.cleanUp(signature.content, isHTML);
            if (isHTML) text = this.getParagraph(text, util.looksLikeHTML(text));
            // signature wrapper
            if (signature.misc.insertion === 'below') {
                proc = _.bind(this.editor.insertPostCite || this.editor.appendContent, this.editor);
                proc(text);
                this.editor.scrollTop('bottom');
            } else {
                // backward compatibility
                proc = _.bind(this.editor.insertPrevCite || this.editor.prependContent, this.editor);
                proc(text);
                this.editor.scrollTop('top');
            }
        }
    };

    return {
        extensions: extensions,
        util: util,
        model: model,
        view: view
    };
});
