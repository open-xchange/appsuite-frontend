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
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/mail/util',
    'io.ox/core/tk/textproc',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (ext, Dropdown, mailUtil, textproc, settings, gt) {

    'use strict';

    var extensions = {

        menu: function (baton) {
            if (_.device('smartphone')) return;
            var self = this,
                dropdown = new Dropdown({ model: baton.config, label: gt('Signatures'), caret: true });

            function draw() {
                dropdown.prepareReuse();
                dropdown.option('signatureId', '', gt('No signature'));
                ext.point('io.ox/mail/compose/signatures').invoke('draw', dropdown.$el, baton);
                dropdown.$ul.addClass('pull-right');
                baton.view.signaturesLoading.done(function () {
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
                });
            }

            require(['io.ox/core/api/snippets'], function (snippetAPI) {
                // use normal event listeners since view.listenTo does not trigger correctly.
                snippetAPI.on('refresh.all', draw);
                baton.view.$el.one('dispose', function () { snippetAPI.off('refresh.all', draw); });

                draw();
            });
            self.append(dropdown.$el.addClass('signatures text-left'));
        },

        menuitems: function (baton) {
            if (_.device('smartphone')) return;
            var config = baton.config,
                def = baton.view.signaturesLoading = $.Deferred(),
                dropdown = this,
                dropdownView = dropdown.data('view');

            // load snippets
            require(['io.ox/core/api/snippets'], function (snippetAPI) {
                snippetAPI.getAll('signature').always(function (signatures) {
                    var oldSignatures = config.get('signatures') || [],
                        allSignatures = _.uniq(signatures.concat(oldSignatures), false, function (o) { return o.id; });
                    // update model
                    config.set('signatures', allSignatures);
                    // add options to dropdown (empty signature already set)
                    _.each(signatures, function (o) {
                        dropdownView.option('signatureId', o.id, o.displayname);
                    });
                    // TODO: mobile signatures
                    def.resolve(allSignatures);
                });
            });
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

            if (isHTML) return html;

            // process plain text
            if (sourceLooksLikeHTML) {
                html = html.replace(/(<pre>([^<]+)<\/pre>|>\s*|\r\n\s*|\n\s*|\r)/gi, function (all, match, pre) {
                    if (/^<pre>/i.test(match)) return pre;
                    if (match[0] === '>') return '>';
                    return '';
                });
            }

            return textproc.htmltotext(html);
        }
    };

    // MODEL: extends mail compose model
    var model = {

        // use defaultSignature or reference already used one (edit-case)
        setInitialSignature: function () {
            // TODO: breaks when you open text draft in html mode
            var content = this.get('content'),
                signatures = this.get('signatures'), signature;

            // when editing a draft we might have a signature
            if (this.get('mode') === 'edit') {

                // get id of currently drawn signature
                signature = _.find(signatures, function (signature) {
                    var raw = util.getRaw(signature);
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
                this.set('signatureId', this.getDefaultSignature(), { silent: false });
            }
        },

        // set default signature dependant on mode, there are settings that correspond to this
        getDefaultSignature: function () {
            // no differentiation between compose/edit and reply/forward on mobile
            return /compose|edit/.test(this.get('mode')) || _.device('smartphone') ?
                this.get('defaultSignatureId') :
                mailUtil.getDefaultSignature('reply/forward');
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

        getSignatureContent: function () {
            var isUnquotedForward = settings.get('forwardunquoted', false) && this.config.get('mode') === 'forward';
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
                signature = _(signatures).where({ id: id })[0],
                isEmptySignature = (id === '');
            // invalid signature
            if (!signature && !isEmptySignature) return;

            // edit-case: signature already in DOM
            // compose-case: signature not in DOM
            this.config.set('signature', signature, { silent: !!this.config.get('signatureIsRendered') });
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
                        unchanged = _(self.config.get('signatures')).find(function (signature) {
                            return util.getRaw(signature) === util.stripWhitespace(text);
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
                isHTML = !!this.editor.find;

            // add signature?
            if (this.config.get('signatures').length > 0) {
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
        }
    };

    return {
        extensions: extensions,
        util: util,
        model: model,
        view: view
    };
});
