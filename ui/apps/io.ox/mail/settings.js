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
        'settings!io.ox/mail', 'io.ox/core/api/account'],

function (ext, View, Model, gt, settings, api) {

    'use strict';






    var MailSettingsModel = Model.extend({
    });


    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_common',
        draw: function (options) {
            this.append(

                    this.createSectionTitle({ text: gt('Common')}).addClass('expertmode'),
                    this.createControlGroup().append(
                        this.createControlGroupLabel(),
                        this.createControlsWrapper().append(
//                            this.createCheckbox({property: 'selectFirstMessage', label: gt('Automatically select first E-Mail?')}).addClass('expertmode'),
                            this.createCheckbox({property: 'removeDeletedPermanently', label: gt('Permanently remove deleted E-Mails?')}).addClass('expertmode'),
//                            this.createCheckbox({property: 'notifyAcknoledge', label: gt('Notify on delivery receipt?')}).addClass('expertmode'),
//                            this.createCheckbox({property: 'showContactImage', label: gt('Show sender image?')}),
                            this.createCheckbox({property: 'contactCollectOnMailTransport', label: gt('Automatically collect contacts in the folder "Collected addresses" while sending?')}).addClass('expertmode'),
                            this.createCheckbox({property: 'contactCollectOnMailAccess', label: gt('Automatically collect contacts in the folder "Collected addresses" while reading?')}).addClass('expertmode')
                        )
                    ),
                    this.createSectionDelimiter().addClass('expertmode')

            );
        }
    });


    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_compose',
        draw: function (options) {

            var that = this;
            var itemList = {};

            var getAllAccounts = function () {
                var arrayOfAllAccount;

                api.all().done(function (array) {

                    _.each(array, function (key, value) {
                        itemList[key.primary_address] = key.primary_address;
                    });

                    that.append(

                            that.createSectionHorizontalWrapper().append(
                            that.createControlGroup().append(
                                that.createControlGroupLabel({text: gt('Compose')}),
                                that.createControlsWrapper().append(
                                    that.createCheckbox({property: 'appendVcard', label: gt('Append vcard')}),
                                    that.createCheckbox({ property: 'appendMailTextOnReply', label: gt('Insert the original E-Mail text to a reply')}).addClass('expertmode')
                                )

                            ),


                            that.createSectionDelimiter().addClass('expertmode'),



                            that.createControlGroup().addClass('expertmode').append(
                                    that.createControlGroupLabel({text: gt('Forward E-Mails as:')}),
                                    that.createControlsWrapper().append(
                                        that.createRadioButton({property: 'forwardMessageAs', label: gt('Inline'), value: 'Inline'}),
                                        that.createRadioButton({property: 'forwardMessageAs', label: gt('Attachment'), value: 'Attachment'})
                                    )
                            ),



                            that.createSectionDelimiter(),

                            that.createControlGroup().append(
                                that.createControlGroupLabel({text: gt('Format E-Mails as:')}),
                                that.createControlsWrapper().append(
                                    that.createRadioButton({property: 'messageFormat', label: gt('HTML'), value: 'html'}),
                                    that.createRadioButton({property: 'messageFormat', label: gt('Plain text'), value: 'text' }),
                                    that.createRadioButton({property: 'messageFormat', label: gt('HTML and Plain text'), value: 'TEXT/PLAIN'})
                                )
                            ),

                            that.createSectionDelimiter(),

                            that.createInlineControlGroup().append(
                                that.createControlsWrapper().append(

                                    that.createText({ text: gt('Line wrap when sending text mails after: ') }),
                                    that.createTextField({ property: 'lineWrapAfter', classes: 'span1', label: false}),
                                    that.createText({ text: ' characters' })
                                )

                            ).addClass('expertmode'),
                            that.createControlGroup().append(
                                that.createControlGroupLabel({text: gt('Default sender address:'), 'for': 'auto'}),
                                that.createControlsWrapper().append(
                                    that.createSelectbox({property: 'defaultSendAddress', id: 'last', classes: 'input-xlarge', items: itemList})
                                )
                            ),
                            that.createControlGroup().addClass('expertmode').append(
                                that.createControlGroupLabel({text: gt('Auto-save Email drafts?'), 'for': 'auto'}),
                                that.createControlsWrapper().append(
                                    that.createSelectbox({property: 'autoSafeDraftsAfter', id: 'last', classes: 'input-xlarge', items: {'Disabled': 'disabled', '1 Minute': '1_minute', '3 Minutes': '3_minutes', '5 Minutes': '5_minutes', '10 Minutes': '10_minutes' }})
                                )
                            ),
                            that.createSectionDelimiter()
                        )

                );
                }

                );
            };

            getAllAccounts();


        }
    });

    ext.point('io.ox/mail/settings/detail/section').extend({
        index: 200,
        id: 'section_display',
        draw: function (options) {
            this.append(

                            this.createSectionTitle({ text: gt('Display')}).addClass('expertmode'),
                            this.createControlGroup().addClass('expertmode').append(
                                 this.createControlGroupLabel(),
                                 this.createControlsWrapper().append(
                                     this.createCheckbox({property: 'allowHtmlMessages', label: gt('Allow html formatted E-Mails')}),
                                     this.createCheckbox({property: 'allowHtmlImages', label: gt('Block pre-loading of externally linked images')}),
                                     this.createCheckbox({property: 'displayEmomticons', label: gt('Display emoticons as graphics in text E-Mails')}),
                                     this.createCheckbox({property: 'isColorQuoted', label: gt('Color quoted lines')})
                                     //this.createCheckbox({property: 'showName', label: gt('Show name instead of E-Mail address in To and Cc fields')})
                                 )
                            ),

                            this.createSectionDelimiter().addClass('expertmode')
            );
        }
    });
//    ext.point('io.ox/mail/settings/detail/section').extend({
//        index: 200,
//        id: 'section_filter',
//        draw: function (options) {
//            var listbox,
//                addSignatureButton,
//                editSignatureButton,
//                deleteSignatureButton;
//
//
//            addSignatureButton = function () {
//                console.log('add Signature');
//            };
//            editSignatureButton = function () {
//                var selectedItemID =  listbox.find('div[selected="selected"]').attr('data-item-id');
//                console.log('edit signature:' + selectedItemID);
//            };
//            deleteSignatureButton = function () {
//                var selectedItemID =  listbox.find('div[selected="selected"]').attr('data-item-id');
//                console.log('delete signature:' +  selectedItemID);
//            };
//
//
//
//            this.append(
//                    this.createSectionTitle({ text: gt('Signatures')}),
//                    this.createSectionContent()
//                        .append(
//                            listbox = this.createListBox({ dataid: 'accounts-list',
//                                model: { get: function () {
//                                        var list = [
//                                            {dataid: 'signature1', html: 'Halleluja....'},
//                                            {dataid: 'signature2', html: 'Mit freundlichem Gruss aus dem Labor ...'}
//                                        ];
//                                        return list;
//                                    }
//                                }
//                            }),
//                            this.createButton({label: gt('Add ...'), btnclass: 'btn'}).on('click', addSignatureButton),
//                            this.createButton({label: gt('Edit ...'), btnclass: 'btn'}).on('click', editSignatureButton),
//                            this.createButton({label: gt('Delete ...'), btnclass: 'btn'}).on('click', deleteSignatureButton)
//                        ),
//                    this.createSectionDelimiter()
//            );
//        }
//    });

//    ext.point('io.ox/mail/settings/detail/section').extend({
//        index: 200,
//        id: 'section_signatures',
//        draw: function (options) {
//            var listbox,
//                addFilterButton,
//                editFilterButton,
//                deleteFilterButton;
//
//
//            addFilterButton = function () {
//                console.log('add filter');
//            };
//            editFilterButton = function () {
//                var selectedItemID =  listbox.find('div[selected="selected"]').attr('data-item-id');
//                console.log('edit filter:' + selectedItemID);
//            };
//            deleteFilterButton = function () {
//                var selectedItemID =  listbox.find('div[selected="selected"]').attr('data-item-id');
//                console.log('delete filter:' +  selectedItemID);
//            };
//
//
//
//            this.append(
//                    this.createSectionTitle({ text: gt('Filter')}),
//                    this.createSectionContent()
//                        .append(
//                            listbox = this.createListBox({ dataid: 'accounts-list',
//                                model: { get: function () {
//                                        var list = [
//                                            {dataid: 'filter1', html: 'Wichtige Nachrichten'},
//                                            {dataid: 'filter2', html: 'Privat....'},
//                                            {dataid: 'filter3', html: '@googlemail.com'},
//                                            {dataid: 'filter4', html: '[couchdb-usergroup]'},
//                                            {dataid: 'filter5', html: 'techcrunch'},
//                                            {dataid: 'filter6', html: 'hackernews'}
//                                        ];
//                                        return list;
//                                    }
//                                }
//                            }),
//                            this.createButton({label: 'Add ...', btnclass: 'btn'}).on('click', addFilterButton),
//                            this.createButton({label: 'Edit ...', btnclass: 'btn'}).on('click', editFilterButton),
//                            this.createButton({label: 'Delete ...', btnclass: 'btn'}).on('click', deleteFilterButton)
//                        ),
//                    this.createSectionDelimiter()
//            );
//
//        }
//    });
//    ext.point('io.ox/mail/settings/detail/section').extend({
//        index: 200,
//        id: 'section_vacation_notice',
//        draw: function (options) {
//            this.append(
//
//                    this.createSectionTitle({ text: gt('Vacation Notice')}),
//                    this.createSectionContent()
//                        .append(
//                            this.createControlGroup().append(
//                                this.createControlsWrapper().append(
//                                    this.createCheckbox({property: 'activateMailFilter', label: gt('activate vacation notification')})
//                                 )
//
//                            ),
//                            this.createControlGroup().append(
//                                this.createControlGroupLabel(),
//                                this.createControlsWrapper().append(
//                                    this.createTextField({ label: gt('Subject'), property: 'mailFilterSubject', classes: 'input-xxlarge'}),
//                                    this.createTextArea({ label: gt('Message'), property: 'mailFilterBody',  classes: 'input-xxlarge'}),
//                                    this.createTextField({ label: gt('Days'), property: 'mailFilterResendDays',  classes: 'input-xxlarge'})
//                                )
//                            ),
//                            this.createSectionDelimiter(),
//                            this.createSectionHorizontalWrapper().append(
//                                this.createControlGroup().append(
//                                    this.createControlGroupLabel({text: gt('E-Mail Adressen')}),
//                                    this.createControlsWrapper().append(
//                                        this.createCheckbox({property: 'emailAddress', label: 'bill.gates@microsoft.com'})
//                                    )
//                                )
//                            )
//                        ),
//                    this.createSectionDelimiter()
//            );
//        }
//    });
    var MailSettingsView = View.extend({
        draw: function (data) {
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
            settings.save();
//            .done(function () {
//                console.log('saved for email');
//            });
        }
    });

    return {}; //whoa return nothing at first
});
