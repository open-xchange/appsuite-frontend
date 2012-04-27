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
        'gettext!io.ox/mail/mail',
        'settings!io.ox/mail'],

function (ext, View, Model, gt, settings) {

    'use strict';


    var MailSettingsModel = Model.extend({
    });


    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_common',
        draw: function (options) {
            this.append(
                    this.createSectionTitle({ text: gt('Common')}),
                    this.createControlGroup().append(
                        this.createControlGroupLabel(),
                        this.createControlsWrapper().append(
                            this.createCheckbox({property: 'selectFirstMessage', label: gt('Automatically select first E-Mail?')}).addClass('expertmode'),
                            this.createCheckbox({property: 'removeDeletedPermanently', label: gt('Permanently remove deleted E-Mails?') }),
                            this.createCheckbox({property: 'notifyAcknoledge', label: gt('Notify on delivery receipt?')}).addClass('expertmode'),
                            this.createCheckbox({property: 'showContactImage', label: gt('Show sender image?')}),
                            this.createCheckbox({property: 'contactCollectOnMailTransport', label: gt('Automatically collect contacts in the folder "Collected addresses" while sending?')}).addClass('expertmode'),
                            this.createCheckbox({property: 'contactCollectOnMailAccess', label: gt('Automatically collect contacts in the folder "Collected addresses" while reading?')}).addClass('expertmode')
                        )
                    ),
                    this.createSectionDelimiter()
            );
        }
    });


    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_compose',
        draw: function (options) {
            this.append(
                        this.createSectionHorizontalWrapper().append(
                        this.createControlGroup().append(
                            this.createControlGroupLabel({text: gt('Compose')}),
                            this.createControlsWrapper().append(
                                this.createCheckbox({ property: 'appendMailTextOnReply', label: gt('Insert the original E-Mail text to a reply')}),
                                this.createCheckbox({property: 'appendVcard', label: gt('Append vcard')}),
                                this.createCheckbox({property: 'autocompleteEmailAddresses', label: gt('Enable auto completion of E-Mail addresses')})
                            )

                        ),


                        this.createSectionDelimiter(),



                        this.createControlGroup().append(
                                this.createControlGroupLabel({text: gt('Forward E-Mails as:')}),
                                this.createControlsWrapper().append(
                                    this.createRadioButton({property: 'forwardMessageAs', label: gt('Inline'), value: 'Inline'}),
                                    this.createRadioButton({property: 'forwardMessageAs', label: gt('Attachment'), value: 'Attachment'})
                                )
                        ),

                        this.createSectionDelimiter(),

                        this.createControlGroup().append(
                           this.createControlGroupLabel({text: gt('When "reply all":')}),
                           this.createControlsWrapper().append(
                               this.createRadioButton({property: 'replyAllCc', label: gt('Add sender and recipients to "To", Cc to "Cc"'), value: false}),
                               this.createRadioButton({property: 'replyAllCc', label: gt('Add sender to "To", recipients to "Cc"'), value: true })
                           )

                        ),


                        this.createSectionDelimiter(),

                        this.createControlGroup().append(
                            this.createControlGroupLabel({text: gt('Format E-Mails as:')}),
                            this.createControlsWrapper().append(
                                this.createRadioButton({property: 'messageFormat', label: gt('HTML'), value: 'html'}),
                                this.createRadioButton({property: 'messageFormat', label: gt('Plain text'), value: 'plain' }),
                                this.createRadioButton({property: 'messageFormat', label: gt('HTML and Plain text'), value: 'both'})
                            )
                        ),

                        this.createSectionDelimiter(),

                        this.createControlGroup().append(
                            this.createControlGroupLabel({text: gt('Default E-Mail font:'), 'for': 'auto'}),
                            this.createControlsWrapper().append(
                                this.createSelectbox({property: 'defaultMailFont', classes: 'input-xlarge', id: 'last', items: {'Default': 'default', 'Andale Mono': 'andale_mono', 'Arial': 'arial', 'Arial Black': 'arial_black', 'Book Antiqua': 'book_antiqua'}}).addClass('expertmode')
                            )
                        ),
                        this.createControlGroup().append(
                            this.createControlGroupLabel({text: gt('Default E-Mail font size:'), 'for': 'auto'}),
                            this.createControlsWrapper().append(
                                this.createSelectbox({property: 'defaultMailFontSize', id: 'last', classes: 'input-xlarge', items: {'Default': 'default', '1 (8pt)': '8_pt', '2 (10pt)': '10_pt'}}).addClass('expertmode')
                            )
                        ),


                        this.createInlineControlGroup().append(
                            this.createControlsWrapper().append(
                                this.createText({ text: gt('Line wrap when sending text mails after: ') }),
                                this.createTextField({ property: 'lineWrapAfter', classes: 'span1', label: false}),
                                this.createText({ text: ' characters' })
                            )

                        ),
                        this.createControlGroup().append(
                            this.createControlGroupLabel({text: gt('Default sender address:'), 'for': 'auto'}),
                            this.createControlsWrapper().append(
                                this.createSelectbox({property: 'defaultSendAddress', id: 'last', classes: 'input-xlarge', items: { 'mario@sourcegarden.de': 'mario@sourcegarden.de', 'mario@sourcegarden.com': 'mario@sourcegarden.com', 'mario.scheliga@open-xchange.com': 'mario.scheliga@open-xchange.com' }})
                            )
                        ),
                        this.createControlGroup().append(
                            this.createControlGroupLabel({text: gt('Auto-save Email drafts?'), 'for': 'auto'}),
                            this.createControlsWrapper().append(
                                this.createSelectbox({property: 'autoSafeDraftsAfter', id: 'last', classes: 'input-xlarge', items: {'Disabled': 'disabled', '1 Minute': '1_minute', '3 Minutes': '3_minutes', '5 Minutes': '5_minutes', '10 Minutes': '10_minutes' }})
                            )
                        ),
                        this.createSectionDelimiter()
                    )

            );
        }
    });

    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_display',
        draw: function (options) {
            this.append(
                            this.createSectionTitle({ text: gt('Display')}),
                            this.createControlGroup().append(
                                 this.createControlGroupLabel(),
                                 this.createControlsWrapper().append(
                                     this.createCheckbox({property: 'allowHtmlMessages', label: gt('Allow html formatted E-Mails')}),
                                     this.createCheckbox({property: 'allowHtmlImages', label: gt('Block pre-loading of externally linked images')}),
                                     this.createCheckbox({property: 'displayEmomticons', label: gt('Display emoticons as graphics in text E-Mails')}),
                                     this.createCheckbox({property: 'isColorQuoted', label: gt('Color quoted lines')}),
                                     this.createCheckbox({property: 'showName', label: gt('Show name instead of E-Mail address in To and Cc fields')})
                                 )
                            ),

                            this.createSectionDelimiter()
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
                    this.createSectionTitle({ text: gt('Signatures')}),
                    this.createSectionContent()
                        .append(
                            listbox = this.createListBox({ dataid: 'accounts-list',
                                model: { get: function () {
                                        var list = [
                                            {dataid: 'signature1', html: 'Halleluja....'},
                                            {dataid: 'signature2', html: 'Mit freundlichem Gruss aus dem Labor ...'}
                                        ];
                                        return list;
                                    }
                                }
                            }),
                            this.createButton({label: gt('Add ...'), btnclass: 'btn'}).on('click', addSignatureButton),
                            this.createButton({label: gt('Edit ...'), btnclass: 'btn'}).on('click', editSignatureButton),
                            this.createButton({label: gt('Delete ...'), btnclass: 'btn'}).on('click', deleteSignatureButton)
                        ),
                    this.createSectionDelimiter()
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
                    this.createSectionTitle({ text: gt('Filter')}),
                    this.createSectionContent()
                        .append(
                            listbox = this.createListBox({ dataid: 'accounts-list',
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
                            this.createButton({label: 'Add ...', btnclass: 'btn'}).on('click', addFilterButton),
                            this.createButton({label: 'Edit ...', btnclass: 'btn'}).on('click', editFilterButton),
                            this.createButton({label: 'Delete ...', btnclass: 'btn'}).on('click', deleteFilterButton)
                        ),
                    this.createSectionDelimiter()
            );

        }
    });
    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_vacation_notice',
        draw: function (options) {
            this.append(
                    this.createSectionTitle({ text: gt('Vacation Notice')}),
                    this.createSectionContent()
                        .append(
                            this.createControlGroup().append(
                                this.createControlsWrapper().append(
                                    this.createCheckbox({property: 'activateMailFilter', label: gt('activate vacation notification')})
                                 )
                            ),
                            this.createControlGroup().append(
                                this.createControlGroupLabel(),
                                this.createControlsWrapper().append(
                                    this.createTextField({ label: gt('Subject'), property: 'mailFilterSubject', classes: 'input-xxlarge'}),
                                    this.createTextArea({ label: gt('Message'), property: 'mailFilterBody',  classes: 'input-xxlarge'}),
                                    this.createTextField({ label: gt('Days'), property: 'mailFilterResendDays',  classes: 'input-xxlarge'})
                                )
                            ),
                            this.createSectionDelimiter(),
                            this.createSectionHorizontalWrapper().append(
                                this.createControlGroup().append(
                                    this.createControlGroupLabel({text: gt('E-Mail Adressen')}),
                                    this.createControlsWrapper().append(
                                        this.createCheckbox({property: 'emailAddress', label: 'bill.gates@microsoft.com'})
                                    )
                                )
                            )
                        ),
                    this.createSectionDelimiter()
            );
        }
    });
    var MailSettingsView = View.extend({
        draw: function (data) {
            console.log(data);
            var self = this;
            self.node.append(this.createSettingsHead(data));
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

            this.append(myView.draw(data).node.css('max-width', '800px'));
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
