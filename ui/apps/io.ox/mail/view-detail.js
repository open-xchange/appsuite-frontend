/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com
 */

define('io.ox/mail/view-detail', [], function () {

    // ['io.ox/mail/detail/content',
    //  'io.ox/core/extensions',
    //  'io.ox/core/extPatterns/links',
    //  'io.ox/mail/util',
    //  'io.ox/mail/api',
    //  'io.ox/core/http',
    //  'io.ox/core/util',
    //  'io.ox/core/api/account',
    //  'settings!io.ox/mail',
    //  'gettext!io.ox/mail',
    //  'io.ox/core/api/folder',
    //  'io.ox/core/emoji/util',
    //  'io.ox/core/capabilities',
    //  'io.ox/mail/actions',
    //  'less!io.ox/mail/style'
    // ], function (content, ext, links, util, api, http, coreUtil, account, settings, gt, folder, emoji, capabilities) {

    'use strict';

    // ext.point('io.ox/mail/detail/header').extend({
    //     id: 'account',
    //     index: 152,
    //     draw: function (baton) {

    //         if (!folder.is('unifiedfolder', baton.data.folder_id)) return;

    //         this.find('.to-cc').prepend(
    //             $('<span class="io-ox-label">').append(
    //                 $.txt(gt('Account')),
    //                 $.txt(_.noI18n('\u00A0\u00A0'))
    //             ),
    //             $('<span class="account-name">').text(
    //                 _.noI18n(util.getAccountName(baton.data))
    //             ),
    //             $.txt(_.noI18n(' \u00A0 '))
    //         );
    //     }
    // });

    // /**
    //  * @description actions for publication invitation mails
    //  */
    // ext.point('io.ox/mail/detail/header').extend({
    //     index: 199,
    //     id: 'subscribe',
    //     draw: function (baton) {
    //         var data = baton.data,
    //             label = '',
    //             pub = {},
    //             pubtype = '';

    //         //exists publication header
    //         pub.url  = data.headers['X-OX-PubURL'] || '';
    //         if (pub.url === '')
    //             return false;
    //         else {
    //             //qualify data
    //             pubtype = /^(\w+),(.*)$/.exec(data.headers['X-OX-PubType']) || ['', '', ''];
    //             pub.module  = pubtype[1];
    //             pub.type  = pubtype[2];
    //             pub.name = _.first(_.last(pub.url.split('/')).split('?'));
    //             pub.parent = require('settings!io.ox/core').get('folder/' + pub.module);
    //             pub.folder = '';
    //             label = pub.module === 'infostore' ? gt('files') : gt(pub.module);

    //             // published folder have much more data, single file just has a name and a URL.
    //             var isSingleFilePublication = !pub.type;

    //             if (isSingleFilePublication) {
    //                 this.append(
    //                     $('<div class="well">').append(
    //                         $('<div class="invitation">').text(gt('Someone shared a file with you')),
    //                         $('<div class="subscription-actions">').append(
    //                             $('<button type="button" class="btn btn-default" data-action="show">').text(gt('Show file'))
    //                         )
    //                     )
    //                 );
    //             } else {
    //                 this.append(
    //                     $('<div class="well">').append(
    //                         $('<div class="invitation">').text(gt('Someone shared a folder with you. Would you like to subscribe those %1$s?', label)),
    //                         $('<div class="subscription-actions">').append(
    //                             $('<button type="button" class="btn btn-default" data-action="show">').text(gt('Show original publication')),
    //                             '&nbsp;',
    //                             $('<button type="button" class="btn btn-primary" data-action="subscribe">').text(gt('Subscribe'))
    //                         )
    //                     )
    //                 );
    //             }

    //             //actions
    //             this.on('click', '.subscription-actions .btn', function (e) {
    //                 var button = $(e.target),
    //                     notifications = require('io.ox/core/notifications');
    //                 //disble button
    //                 if (button.data('action') === 'show') {
    //                     window.open(pub.url, '_blank');
    //                 } else {
    //                     $(e.target).prop('disabled', true);
    //                     notifications.yell('info', gt('Adding subscription. This may take some seconds...'));
    //                     var opt = opt || {};
    //                     //create folder; create and refresh subscription
    //                     require(['io.ox/core/pubsub/util']).done(function (pubsubUtil) {
    //                         pubsubUtil.autoSubscribe(pub.module, pub.name, pub.url).then(
    //                             function success() {
    //                                 notifications.yell('success', gt('Created private folder \'%1$s\' in %2$s and subscribed successfully to shared folder', pub.name, pub.module));
    //                                 //refresh folder views
    //                                 folder.trigger('update');
    //                             },
    //                             function fail(data) {
    //                                 notifications.yell('error', data.error || gt('An unknown error occurred'));
    //                             }
    //                         );
    //                     });
    //                 }
    //             });
    //         }
    //     }
    // });

    // function findFarthestElement(memo, node) {
    //     var pos;
    //     if (node.css('position') === 'absolute' && (pos = node.position())) {
    //         memo.x = Math.max(memo.x, pos.left + node.width());
    //         memo.y = Math.max(memo.y, pos.top + node.height());
    //         memo.found = true;
    //     }
    //     return memo;
    // }

    // ext.point('io.ox/mail/detail').extend({
    //     index: 300,
    //     id: 'content',
    //     draw: function (baton) {
    //         var article, data = baton.data, content = that.getContent(data, baton.options);

    //         if (content.processedEmoji === false) {
    //             content.content.addClass('unprocessedEmoji');
    //             emoji.processEmoji(content.content.html(), function (text) {
    //                 $(article || $()).find('.unprocessedEmoji').removeClass('unprocessedEmoji').html(text);
    //             });
    //         }
    //         this.append(
    //             article = $('<article>').attr({
    //                 'data-cid': data.folder_id + '.' + data.id,
    //                 'data-content-type': content.type
    //             })
    //             .addClass(
    //                 // html or text mail
    //                 content.type === 'text/html' ? 'text-html' : 'text-plain'
    //             )
    //             .addClass(
    //                 // assuming touch-pad/magic mouse for macos
    //                 // chrome & safari do a good job; firefox is not smooth
    //                 // ios means touch devices; that's fine
    //                 // biggeleben: DISABLED for 7.2.1 due to too many potential bugs
    //                 false && _.device('(macos && (chrome|| safari)) || ios') ? 'horizontal-scrolling' : ''
    //             )
    //             .append(
    //                 content.content,
    //                 $('<div class="mail-detail-clear-both">')
    //             )
    //         );

    //         // show toggle info box instead of original mail
    //         if (baton.hideOriginalMail) {
    //             article.hide();
    //             this.append(
    //                 $('<div>').addClass('alert alert-info cursor-pointer').append(
    //                     $('<a href="#" role="button">').text(gt('Show original message'))
    //                 ).on('click', function () {
    //                     article.show();
    //                     $(this).remove();
    //                 })
    //             );
    //         }

    //         var content = this.find('.content');

    //         setTimeout(function () {
    //             var farthest = { x: content.get(0).scrollWidth, y: content.get(0).scrollHeight, found: false },
    //                 width = content.width(), height = content.height();
    //             if (!content.isLarge && (farthest.x >= width || farthest.y >= height)) { // Bug 22756: FF18 is behaving oddly correct, but impractical
    //                 farthest = _.chain($(content).find('*')).map($).reduce(findFarthestElement, farthest).value();
    //             }
    //             // only do this for absolute elements
    //             if (farthest.found) {
    //                 if (farthest.x > width) content.css('width', Math.round(farthest.x) + 'px');
    //                 if (farthest.y > height) content.css('height', Math.round(farthest.y) + 'px');
    //             }
    //             content = null;
    //         }, 0);
    //     }
    // });
});
