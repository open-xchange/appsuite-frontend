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
define('io.ox/mail/settings/old_pane',
       ['io.ox/core/extensions',
        'io.ox/core/tk/view',
        'io.ox/core/tk/model',
        'gettext!io.ox/mail',
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
                            this.createCheckbox({property: 'removeDeletedPermanently', label: gt('Permanently remove deleted E-Mails?')}).addClass('expertmode'),
                            this.createCheckbox({property: 'contactCollectOnMailTransport', label: gt('Automatically collect contacts in the folder "Collected addresses" while sending?')}).addClass('expertmode'),
                            this.createCheckbox({property: 'contactCollectOnMailAccess', label: gt('Automatically collect contacts in the folder "Collected addresses" while reading?')}).addClass('expertmode'),
                            this.createCheckbox({property: 'useFixedWidthFont', label: gt('Use fixed-width font for text mails')}).addClass('expertmode')
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
                                    that.createRadioButton({property: 'messageFormat', label: gt('HTML and plain text'), value: 'TEXT/PLAIN'})
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
                                     this.createCheckbox({property: 'displayEmoticons', label: gt('Display emoticons as graphics in text E-Mails')}),
                                     this.createCheckbox({property: 'isColorQuoted', label: gt('Color quoted lines')})
                                 )
                            ),

                            this.createSectionDelimiter().addClass('expertmode')
            );
        }
    });

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
