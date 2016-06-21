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
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/mail/compose/signatures', [
    'io.ox/mail/util',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (mailUtil, settings, gt) {

    'use strict';

    // extract the raw content
    function getRaw(signature) {
        var str = $('<div>').html(signature.content).text();
        return stripWhitespace(str);
    }

    function stripWhitespace(str) {
        return str.replace(/\s+/g, '');
    }

    function looksLikeHTML(text) {
        return /(<\/?\w+(\s[^<>]*)?>)/.test(text);
    }

    // TODO: naming
    function cleanAdd(text, isHTML) {
        var clean = general(text);
        // special entities like '&'/&amp;
        var $parsed = $('<dummy>').html(clean);
        if (isHTML) {
            if (!looksLikeHTML(clean)) {
                $parsed.text(clean);
            }
            return $parsed.html();
        }
        if (!looksLikeHTML(clean)) {
            $parsed.text(clean);
        }
        $parsed.find('p').replaceWith(function () {
            return $(this).html() + '\n\n';
        });
        $parsed.find('br').replaceWith(function () {
            return $(this).html() + '\n';
        });
        return $parsed.text().trim();
    }

    // TODO: naming
    function general(text) {
        return String(text || '')
            // replace white-space and evil \r
            .replace(/(\r\n|\n|\r)/g, '\n')
            // replace subsequent white-space (except linebreaks)
            .replace(/[\t\f\v ][\t\f\v ]+/g, ' ')
            .trim();
    }

    // MODEL: extends mail compose model
    var model = {

        // get snippets from server
        initializeSignatures: function (dropdown) {
            var dropdownView = dropdown.data('view'),
                def = $.Deferred();
            // load snippets
            require(['io.ox/core/api/snippets'], function (snippetAPI) {
                snippetAPI.getAll('signature').always(function (signatures) {
                    var oldSignatures = this.get('signatures') || [],
                        allSignatures = _.uniq(signatures.concat(oldSignatures), false, function (o) { return o.id; });
                    // update model
                    this.set('signatures', allSignatures);
                    // add options to dropdown (empty signature already set)
                    _.each(signatures, function (o) {
                        dropdownView.option('signatureId', o.id, o.displayname);
                    });
                    // TODO: mobile signatures
                    def.resolve(allSignatures);
                }.bind(this));
            }.bind(this));
            // resolve
            return def;
        },

        // use defaultSignature or reference already used one (edit-case)
        setInitialSignature: function () {
            // TODO: breaks when you open text draft in html mode
            var content = this.get('attachments').at(0).get('content'),
                signatures = this.get('signatures'), signature;

            // get id of currently drawn signature
            signature = _.find(signatures, function (signature) {
                var raw = getRaw(signature);
                // ignore empty signatures (match empty content)
                if (_.isEmpty(raw)) return;
                // HTML: node content matches signature
                if (this.get('editorMode') === 'html') {
                    var node = $('<div>').append(content).find('div[class$="io-ox-signature"]:last');
                    return stripWhitespace(node.text()) === raw;
                }
                // TEXT: contains
                return stripWhitespace(content).indexOf(raw) > -1;
            }.bind(this));

            if (!signature) {
                return this.set('signatureId', this.getDefaultSignature(), { silent: false });
            }
            // special handling for edit draft
            this.set('signatureIsRendered', true);
            this.set('signatureId', signature.id, { silent: false });
        },

        // set default signature dependant on mode, there are settings that correspond to this
        getDefaultSignature: function () {
            return /compose|edit/.test(this.get('mode')) ?
                this.get('defaultSignatureId') :
                settings.get('defaultReplyForwardSignature');
        },

        // getter
        getSignatureById: function (id) {
            id = String(id);
            return _.find(this.get('signatures'), function (data) {
                return data.id === id;
            });
        },

        // TODO: cleanup; rename to something with 'mobile'?
        getSignatures: function () {
            if (_.device('!smartphone') || this.get('mode') === 'edit') return [];

            if (settings.get('mobileSignatureType') === 'custom') {
                this.set('defaultSignatureId', '0', { silent: true });
            } else if (!this.get('defaultSignatureId')) {
                this.set('defaultSignatureId', '1', { silent: true });
            }

            var value = settings.get('mobileSignature');

            if (value === undefined) {
                //#. %s is the product name
                value = gt('Sent from %s via mobile', ox.serverConfig.productName);
            }

            return [{ id: '0', content: value, misc: { insertion: 'below' } }];
        }
    };

    // VIEW: extends mail compose view
    var view = {

        // handler -> change:signatures
        updateSignatures: function () {
            var currentSignature = this.model.get('signature');

            if (!currentSignature) return;

            // get latest signature object of current signature
            var changedSignature = this.model.getSignatureById(currentSignature.id);
            // has changed?
            if (currentSignature.content !== changedSignature.content) {
                var isHTML = !!this.editor.find;
                if (isHTML) {
                    // HTML
                    this.editor.find('div[class$="io-ox-signature"]').each(function () {
                        var node = $(this),
                            text = node.text(),
                            changed = getRaw(changedSignature) === stripWhitespace(text);
                        if (changed) node.empty().append($(changedSignature.content));
                    });
                } else {
                    // TEXT
                    var currentContent = cleanAdd(currentSignature.content, false),
                        changedContent = cleanAdd(changedSignature.content, false);
                    this.editor.replaceParagraph(currentContent, changedContent);
                }

                this.model.set('signature', changedSignature);
            }
        },

        // handler -> change:signatureId
        setSignature: function (model, id) {
            var signatures = this.model.get('signatures'),
                signature = _(signatures).where({ id: id })[0],
                isEmptySignature = (id === '');

            // invalid signature
            if (!signature && !isEmptySignature) return;

            // edit-case: signature already in DOM
            // compose-case: signature not in DOM
            this.model.set('signature', signature, { silent: !!this.model.get('signatureIsRendered') });
            this.model.unset('signatureIsRendered');
        },

        // handler -> change:signature
        redrawSignature: function (model, signature) {
            var previous = model && model.previous('signature');
            // remove old signature
            if (previous) this.removeSignature(previous);
            // set new signature
            if (!signature) return;
            this.appendSignature(signature);
        },

        removeSignature: function (signature) {
            // fallback: get signature by id
            signature = _.isString(signature) ? this.model.getSignatureById(signature) : signature;
            // fallback: get current signature object
            if (!signature) {
                if (!this.model.get('signature')) return;
                signature = this.model.get('signature');
            }

            var self = this,
                isHTML = !!this.editor.find,
                currentSignature = cleanAdd(signature.content, isHTML);

            // remove current signature from editor
            if (isHTML) {
                this.editor.find('div[class$="io-ox-signature"]').each(function () {

                    var node = $(this),
                        text = node.text(),
                        unchanged = _(self.model.get('signatures')).find(function (signature) {
                            return getRaw(signature) === stripWhitespace(text);
                        });

                    // remove entire block unless it seems edited
                    if (unchanged) node.remove(); else node.removeAttr('class');
                });
            } else if (currentSignature) {
                this.editor.replaceParagraph(currentSignature, '');
            }
        },

        appendSignature: function (signature) {
            var text,
                isHTML = !!this.editor.find;

            // add signature?
            if (this.model.get('signatures').length > 0) {
                text = cleanAdd(signature.content, isHTML);
                if (isHTML) text = this.getParagraph(text);
                // signature wrapper
                if (_.isString(signature.misc)) signature.misc = JSON.parse(signature.misc);
                if (signature.misc && signature.misc.insertion === 'below') {
                    this.editor.appendContent(text);
                    this.editor.scrollTop('bottom');
                } else {
                    // backward compatibility
                    var proc = _.bind(this.editor.insertPrevCite || this.editor.prependContent, this.editor);
                    proc(text);
                    this.editor.scrollTop('top');
                }
            }
        }
    };

    return {
        model: model,
        view: view
    };
});
