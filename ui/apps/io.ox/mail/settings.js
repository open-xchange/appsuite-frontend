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
/*global
define: true, _: true
*/
define('io.ox/mail/settings',
       ['io.ox/core/extensions',
        'io.ox/core/tk/view',
        'io.ox/core/tk/model',
        'io.ox/settings/utils',
        'gettext!io.ox/mail/mail',
        'settings!io.ox/mail'],

function (ext, View, Model, util, gt, settings) {

    'use strict';


    var MailSettingsModel = Model.extend({
    });


    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_common',
        draw: function (options) {
            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Common')}),
                        util.createSectionContent()
                          .append(
                              this.createCheckbox({property: 'selectFirstMessage', label: gt('Automatically select first E-Mail?')}).addClass('expertmode'),
                              this.createCheckbox({property: 'removeDeletedPermanently', label: gt('Permanently remove deleted E-Mails?')}),
                              this.createCheckbox({property: 'notifyAcknoledge', label: gt('Notify on delivery receipt?')}).addClass('expertmode'),
                              this.createCheckbox({property: 'showContactImage', label: gt('Show sender image?')}),
                              this.createCheckbox({property: 'contactCollectOnMailTransport', label: gt('Automatically collect contacts in the folder "Collected addresses" while sending?')}).addClass('expertmode'),
                              this.createCheckbox({property: 'contactCollectOnMailAccess', label: gt('Automatically collect contacts in the folder "Collected addresses" while reading?')}).addClass('expertmode')
                          ),
                      util.createSectionDelimiter()
                    )
            );
        }
    });


    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_compose',
        draw: function (options) {
            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Compose')}),
                        util.createSectionContent()
                            .append(
                                this.createCheckbox({property: 'appendMailTextOnReply', label: gt('Insert the original E-Mail text to a reply')}).addClass('expertmode'),
                                this.createCheckbox({property: 'appendVcard', label: gt('Append vcard')}),
                                this.createCheckbox({property: 'autocompleteEmailAddresses', label: gt('Enable auto completion of E-Mail addresses')}),
                                util.createSectionDelimiter(),
                                util.createSectionGroup()
                                    .append(
                                        util.createInfoText({text: gt('Forward E-Mails as:')}),
                                        this.createRadioButton({property: 'forwardMessageAs', label: gt('Inline'), name: 'forwardMessageAs', value: 'Inline' }),
                                        this.createRadioButton({property: 'forwardMessageAs', label: gt('Attachment'), name: 'forwardMessageAs', value: 'Attachment'})
                                    ),
                                util.createSectionDelimiter(),
                                util.createSectionGroup()
                                    .append(
                                        util.createInfoText({text: gt('When "Reply all":')}),
                                        this.createRadioButton({property: 'replyAllCc', label: gt('Add sender and recipients to "To", Cc to "Cc"'), name: 'replyAllCc', value: false}),
                                        this.createRadioButton({property: 'replyAllCc', label: gt('Add sender to "To", recipients to "Cc"'), name: 'replyAllCc', value: true})
                                    ),
                                util.createSectionDelimiter(),
                                util.createSectionGroup()
                                    .append(
                                        util.createInfoText({text: gt('Format E-Mails as:')}),
                                        this.createRadioButton({property: 'messageFormat', label: gt('HTML'), name: 'messageFormat', value: 'html'}),
                                        this.createRadioButton({property: 'messageFormat', label: gt('Plain text'), name: 'messageFormat', value: 'plain'}),
                                        this.createRadioButton({property: 'messageFormat', label: gt('HTML and Plain text'), name: 'messageFormat', value: 'both'})
                                    ),
                                util.createSectionDelimiter(),
                                util.createSectionGroup()
                                    .append(
                                        this.createSelectbox({property: 'defaultMailFont', label: gt('Default E-Mail font:'), items: {'Default': 'default', 'Andale Mono': 'andale_mono', 'Arial': 'arial', 'Arial Black': 'arial_black', 'Book Antiqua': 'book_antiqua'}})
                                    ).addClass('expertmode'),
                                util.createSectionGroup()
                                    .append(
                                        this.createSelectbox({property: 'defaultMailFontSize', label: gt('Default E-Mail font size:'), items: {'Default': 'default', '1 (8pt)': '8_pt', '2 (10pt)': '10_pt'}})
                                    ).addClass('expertmode'),
                                util.createSectionGroup()
                                    .append(
                                        this.createText({ text: gt('Line wrap when sending text mails after: ') }),
                                        this.createTextField({ property: 'lineWrapAfter'}).css({ width: '30px', display: 'inline-block'}),
                                        this.createText({ text: ' characters' })
                                    ),
                                util.createSectionGroup()
                                    .append(
                                        this.createSelectbox({property: 'defaultSendAddress', label: gt('Default sender address:'), items: { 'mario@sourcegarden.de': 'mario@sourcegarden.de', 'mario@sourcegarden.com': 'mario@sourcegarden.com', 'mario.scheliga@open-xchange.com': 'mario.scheliga@open-xchange.com' }})
                                    ),
                                util.createSectionGroup()
                                    .append(
                                        this.createSelectbox({property: 'autoSafeDraftsAfter', label: gt('Auto-save Email drafts?'), items: {'Disabled': 'disabled', '1 Minute': '1_minute', '3 Minutes': '3_minutes', '5 Minutes': '5_minutes', '10 Minutes': '10_minutes' }})
                                    )
                            ),
                        util.createSectionDelimiter()
                    )
            );
        }
    });

    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_display',
        draw: function (options) {
            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Display')}),
                        util.createSectionContent()
                            .append(
                                this.createCheckbox({property: 'allowHtmlMessages', label: gt('Allow html formatted E-Mails')}),
                                this.createCheckbox({property: 'allowHtmlImages', label: gt('Block pre-loading of externally linked images')}),
                                this.createCheckbox({property: 'displayEmomticons', label: gt('Display emoticons as graphics in text E-Mails')}),
                                this.createCheckbox({property: 'isColorQuoted', label: gt('Color quoted lines')}),
                                this.createCheckbox({property: 'showName', label: gt('Show name instead of E-Mail address in To and Cc fields')})
                            ),
                        util.createSectionDelimiter()
                    )
            );
        }
    });
    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_filter',
        draw: function (options) {
            var listbox,
                addSignatureButton,
                editSignatureButton,
                deleteSignatureButton;


            addSignatureButton = function () {
                console.log('add Signature');
            };
            editSignatureButton = function () {
                var selectedItemID =  listbox.find('div[selected="selected"]').attr('data-item-id');
                console.log('edit signature:' + selectedItemID);
            };
            deleteSignatureButton = function () {
                var selectedItemID =  listbox.find('div[selected="selected"]').attr('data-item-id');
                console.log('delete signature:' +  selectedItemID);
            };



            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Signatures')}),
                        util.createSectionContent()
                            .append(
                                listbox = util.createListBox({ dataid: 'accounts-list',
                                    model: { get: function () {
                                            var list = [
                                                {dataid: 'signature1', html: 'Halleluja....'},
                                                {dataid: 'signature2', html: 'Mit freundlichem Gruss aus dem Labor ...'}
                                            ];
                                            return list;
                                        }
                                    }
                                }),
                                util.createButton({label: gt('Add ...')}).css({'margin-right': '15px'}).on('click', addSignatureButton),
                                util.createButton({label: gt('Edit ...')}).css({'margin-right': '15px'}).on('click', editSignatureButton),
                                util.createButton({label: gt('Delete ...')}).css({'margin-right': '15px'}).on('click', deleteSignatureButton)
                            ),
                        util.createSectionDelimiter()
                    )
            );
        }
    });

    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_signatures',
        draw: function (options) {
            var listbox,
                addFilterButton,
                editFilterButton,
                deleteFilterButton;


            addFilterButton = function () {
                console.log('add filter');
            };
            editFilterButton = function () {
                var selectedItemID =  listbox.find('div[selected="selected"]').attr('data-item-id');
                console.log('edit filter:' + selectedItemID);
            };
            deleteFilterButton = function () {
                var selectedItemID =  listbox.find('div[selected="selected"]').attr('data-item-id');
                console.log('delete filter:' +  selectedItemID);
            };



            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Filter')}),
                        util.createSectionContent()
                            .append(
                                listbox = util.createListBox({ dataid: 'accounts-list',
                                    model: { get: function () {
                                            var list = [
                                                {dataid: 'filter1', html: 'Wichtige Nachrichten'},
                                                {dataid: 'filter2', html: 'Privat....'},
                                                {dataid: 'filter3', html: '@googlemail.com'},
                                                {dataid: 'filter4', html: '[couchdb-usergroup]'},
                                                {dataid: 'filter5', html: 'techcrunch'},
                                                {dataid: 'filter6', html: 'hackernews'}
                                            ];
                                            return list;
                                        }
                                    }
                                }),
                                util.createButton({label: 'Add ...'}).css({'margin-right': '15px'}).on('click', addFilterButton),
                                util.createButton({label: 'Edit ...'}).css({'margin-right': '15px'}).on('click', editFilterButton),
                                util.createButton({label: 'Delete ...'}).css({'margin-right': '15px'}).on('click', deleteFilterButton)
                            ),
                        util.createSectionDelimiter()
                    )
            );

        }
    });
    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_vacation_notice',
        draw: function (options) {
            this.append(
                util.createSection()
                    .append(
                        util.createSectionTitle({ text: gt('Vacation Notice')}),
                        util.createSectionContent()
                            .append(
                                this.createCheckbox({property: 'activateMailFilter', label: 'activate vacation notification'}),
                                this.createLabeledTextField({ label: gt('Subject'), property: 'mailFilterSubject'}),
                                this.createLabeledTextArea({ label: gt('Message'), property: 'mailFilterBody'}),
                                this.createLabeledTextField({ label: gt('Days'), property: 'mailFilterResendDays'}),
                                util.createSectionDelimiter(),
                                this.createText({text: gt('E-Mail Adressen')}),
                                this.createCheckbox({property: 'emailAddress', label: 'bill.gates@microsoft.com'})

                            ),
                        util.createSectionDelimiter()
                    )
            );
        }
    });
    var MailSettingsView = View.extend({
        draw: function (data) {
            var self = this;
            self.node.append(util.createSettingsHead(data));
            ext.point('io.ox/mail/settings/detail/section').invoke('draw', self);
            return self;
        }
    });


    // created on/by
    ext.point('io.ox/mail/settings/detail').extend({
        index: 200,
        id: 'mailsettings',
        draw: function (data) {
            var myModel = settings.createModel(MailSettingsModel),
                myView = new MailSettingsView({model: myModel});

            this.append(myView.draw(data).node);
            return myView.node;
        },
        save: function () {
            settings.save().done(function () {
                console.log('saved for email');
            });
        }
    });

    return {}; //whoa return nothing at first
});
