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
        'io.ox/settings/utils'], function (ext, utils) {
       
    'use strict';

    function createLink (textStr, attrs, classStr) {
      var link = $('<a>');
      link.text(textStr);
      if(classStr !== null) {
        link.addClass(classStr);
      }
      if(typeof attrs !== "undefined" &&
         attrs !== null &&
         attrs.constructor.toString().indexOf('Object') !== -1) {
        _.each(attrs, function (attr, key) {
          link.attr(key, attr);
        });
      }
      return link;
    }


    var settings = {
      draw: function (node, app) {
            node
            .append(
              utils.createSettingsHead(app)
            )
            //section
            .append(
              utils.createSection()
                .append(utils.createSectionTitle('Common'))
                .append(
                  utils.createSectionContent()
                    .append(
                      utils.createInfoText('Melden Sie sich mit Ihrem OX-Konto in OX Chrome an, ' +
                                           'um Ihre personalisierten Browserfunktionen online zu ' +
                                           'speichern und über OX Chrome auf jedem Computer darauf ' +
                                           'zuzugreifen. Sie werden dann auch automatisch in Ihren ' +
                                           'Lieblingsdiensten von OX angemeldet. Weitere Informationen' +
                                           'mehr Infos unter <a href="http://www.open-xchange.com" target="_blank">www.open-xchange.com</a>')
                    )
                    .append(
                      utils.createSectionGroup()
                        .append(
                          utils.createSelectbox('mail-testselect', 'Default view:', {
                            'V-split view 1': 'option1',
                            'V-split view 2': 'option2',
                            'V-split view 3': 'option3'
                          }, 'option1')
                        )
                    )
                    .append(
                      utils.createSectionGroup()
                        .append(
                          utils.createSelectbox('mail-testselect', 'Default view for Spam folder', {
                            'V-split view 1': 'option1',
                            'V-split view 2': 'option2',
                            'V-split view 3': 'option3'
                          }, 'option3')
                        )
                    )
                    .append(utils.createSectionDelimiter())

                    .append(utils.createCheckbox('mail-common-selectfirst', 'Automatically select first E-Mail?', false))
                    .append(utils.createCheckbox('mail-common-removepermanently', 'Permanently remove deleted E-Mails?', false))
                    .append(utils.createCheckbox('mail-common-notifyreceipt', 'Notify on delivery receipt?', true))
                    .append(utils.createCheckbox('mail-common-showsenderpic', 'Show sender image?', false))
                    .append(utils.createCheckbox('mail-common-collectwhilesending', 'Automatically collect contacts in the folder "Collected addresses" while sending?', false))
                    .append(utils.createCheckbox('mail-common-collectwhilereading', 'Automatically collect contacts in the folder "Collected addresses" while reading?', true))
                    
                    .append(utils.createSectionDelimiter())

                    .append(
                      $('<button>')
                        .text('Click me to do')
                    )

                )
                .append(utils.createSectionDelimiter())
            )
            .append(
              utils.createSection()
                .append(utils.createSectionTitle('Compose'))
                .append(
                  utils.createSectionContent()
                    .append(utils.createCheckbox('mail-common-selectfirst', 'Insert the original E-Mail text to a reply', false))
                    .append(utils.createCheckbox('mail-common-removepermanently', 'Append vcard', false))
                    .append(utils.createCheckbox('mail-common-notifyreceipt', 'Enable auto completion of E-Mail addresses', true))
                    .append(
                      utils.createSectionGroup()
                        .append(utils.createInfoText('Forward E-Mails as:'))
                        .append(utils.createRadioButton('mail-compose-forwardas-inline', 'Inline', 'mail-compose-forwardas', true, true))
                        .append(utils.createRadioButton('mail-compose-forwardas-attachment', 'Attachment', 'mail-compose-forwardas', false, false))
                    )
                    .append(
                      utils.createSectionGroup()
                        .append(utils.createInfoText('When "Reply all":'))
                        .append(utils.createRadioButton('mail-compose-whenreplyall-tofields', 'Add sender and recipients to "To", Cc to "Cc"', 'mail-compose-whenreplyall', "fields", "fields"))
                        .append(utils.createRadioButton('mail-compose-whenreplyall-tocc', 'Add sender to "To", recipients to "Cc"', 'mail-compose-whenreplyall', "cc", false, "fields"))
                    )
                    .append(
                      utils.createSectionGroup()
                        .append(utils.createInfoText('Format E-Mails as:'))
                        .append(utils.createRadioButton('mail-compose-emailformat-html', 'HTML', 'mail-compose-emailformat', "html", "html"))
                        .append(utils.createRadioButton('mail-compose-emailformat-plain', 'Plain text', 'mail-compose-emailformat', "plain", "html"))
                        .append(utils.createRadioButton('mail-compose-emailformat-both', 'HTML and Plain text', 'mail-compose-emailformat', "both", "html"))
                    )

                    .append(
                      utils.createSectionGroup()
                        .append(
                          utils.createSelectbox('mail-testselect', 'Editor feature set', {
                            'Enhanced': 'enhanced',
                            'Default': 'default'
                          }, 'enhanced')
                        )
                    )
                    .append(
                      utils.createSectionGroup()
                        .append(
                          utils.createSelectbox('mail-testselect', 'Default E-Mail font:', {
                            'Default': 'default',
                            'Andale Mono': 'andale_mono',
                            'Arial': 'arial',
                            'Arial Black': 'arial_black',
                            'Book Antiqua': 'book_antiqua'
                          }, 'default')
                        )
                    )
                    .append(
                      utils.createSectionGroup()
                        .append(
                          utils.createSelectbox('mail-testselect', 'Default E-Mail font size:', {
                            'Default': 'default',
                            '1 (8pt)': '8_pt',
                            '2 (10pt)': '10_pt'
                          }, 'default')
                        )
                    )
                    .append(
                      utils.createLabel()
                        .append(
                          utils.createText('Line wrap when sending text mails after:')
                        )
                        .append(
                          utils.createTextField('mail-compose-linewarpafter', 80).css({ width: '30px', display: 'inline-block'})
                        )
                        .append(
                          utils.createText('characters')
                        )
                    )
                    .append(
                      utils.createSectionGroup()
                        .append(
                          utils.createSelectbox('mail-testselect', 'Default sender address:', {
                            'mario@sourcegarden.de': 'mario@sourcegarden.de',
                            'mario@sourcegarden.com': 'mario@sourcegarden.com',
                            'mario.scheliga@open-xchange.com': 'mario.scheliga@open-xchange.com'
                          }, 'mario.scheliga@open-xchange.com')
                        )
                    )
                    .append(
                      utils.createSectionGroup()
                        .append(
                          utils.createSelectbox('mail-testselect', 'Auto-save Email drafts?', {
                            'Disabled': 'disabled',
                            '1 Minute': '1_minute',
                            '3 Minutes': '3_minutes',
                            '5 Minutes': '5_minutes',
                            '10 Minutes': '10_minutes'
                          }, '3_minutes')
                        )
                    )
                    .append(utils.createSectionDelimiter())


                    .append(
                      $('<button>')
                        .text('Click me to do')
                    )

                )
                .append(utils.createSectionDelimiter())
            )

            .append(
              utils.createSection()
                .append(utils.createSectionTitle('Display'))
                .append(
                  utils.createSectionContent()
                    .append(utils.createCheckbox('mail-display-allowhtml', 'Allow html formatted E-Mails', false))
                    .append(utils.createCheckbox('mail-display-blockimgs', 'Block pre-loading of externally linked images', false))
                    .append(utils.createCheckbox('mail-display-emotionicons', 'Display emoticons as graphics in text E-Mails', true))
                    .append(utils.createCheckbox('mail-display-colorquotes', 'Color quoted lines', false))
                    .append(utils.createCheckbox('mail-display-namesinfields', 'Show name instead of E-Mail address in To and Cc fields', false))
                )
                .append(utils.createSectionDelimiter())
            )


            .append(
              utils.createSection()
                .append(utils.createSectionTitle('Signatures'))
                .append(
                  utils.createSectionContent()
                    .append(utils.createCheckbox('mail-display-namesinfields', 'Show name instead of E-Mail address in To and Cc fields', false))
                )
                .append(utils.createSectionDelimiter())
            )

            .append(
              utils.createSection()
                .append(utils.createSectionTitle('Accounts'))
                .append(
                  utils.createSectionContent()
                    .append(
                      $('<div>')
                        .addClass('settings-listbox')
                        .append(
                          $('<div>')
                        )
                    )
                )
                .append(utils.createSectionDelimiter())
            )

            .append(
              utils.createSection()
                .append(utils.createSectionTitle('Filter'))
                .append(
                  utils.createSectionContent()
                    .append(utils.createCheckbox('mail-display-namesinfields', 'Show name instead of E-Mail address in To and Cc fields', false))
                )
                .append(utils.createSectionDelimiter())
            )

            .append(
              utils.createSection()
                .append(utils.createSectionTitle('Vacation Notice'))
                .append(
                  utils.createSectionContent()
                    .append(utils.createCheckbox('mail-display-namesinfields', 'Show name instead of E-Mail address in To and Cc fields', false))
                )
                .append(utils.createSectionDelimiter())
            )

            .append(
                $("<span>")
                    .addClass("detail")
                    .append($("<span>").text("I AM A SUPER FINE MAILSETTING WHOA"))
            );
            return node;
      }
    
    };
    // created on/by
    ext.point("io.ox/mail/settings/detail").extend({
        index: 200,
        id: "mailsettings",
        draw: function (data) {
            return settings.draw(this, data);
        }
    });
    
    return {}; //whoa return nothing at first
});
