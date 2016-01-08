/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/listview', [
    'io.ox/mail/common-extensions',
    'io.ox/core/extensions',
    'io.ox/mail/util',
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/core/tk/list',
    'io.ox/core/folder/api',
    'io.ox/mail/view-options',
    'less!io.ox/mail/style'
], function (extensions, ext, util, api, account, ListView, folderAPI) {

    'use strict';

    function fixThreadSize(data) {
        if ('threadSize' in data) return;
        data.threadSize = Math.max(1, _(data.thread).reduce(function (sum, data) {
            return sum + (util.isDeleted(data) ? 0 : 1);
        }, 0));
    }

    ext.point('io.ox/mail/listview/item').extend(
        {
            id: 'default',
            index: 100,
            draw: function (baton) {

                // fix missing threadSize (aparently only used by tests)
                fixThreadSize(baton.data);

                if (!baton.app) {
                    ext.point('io.ox/mail/listview/item/default').invoke('draw', this, baton);
                    return;
                }

                var layout = baton.app.props.get('layout'),
                    isSmall = layout === 'horizontal' || layout === 'list';

                this.closest('.list-item').toggleClass('small', isSmall);
                ext.point('io.ox/mail/listview/item/' + (isSmall ? 'small' : 'default')).invoke('draw', this, baton);
            }
        },
        {
            id: 'a11y',
            index: 200,
            draw: extensions.a11yLabel
        }
    );

    /* small */

    ext.point('io.ox/mail/listview/item/small').extend(
        {
            id: 'unread',
            index: 110,
            draw: extensions.unreadClass
        },
        {
            id: 'deleted',
            index: 120,
            draw: extensions.deleted
        },
        {
            id: 'col1',
            index: 100,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-1">');
                extensions.unread.call(column, baton);
                this.append(column);
            }
        },
        {
            id: 'col2',
            index: 200,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-2">');
                extensions.answered.call(column, baton);
                if (column.children().length === 0) {
                    // horizontal view: only show forwarded icon if answered flag not set
                    extensions.forwarded.call(column, baton);
                }
                this.append(column);
            }
        },
        {
            id: 'col3',
            index: 300,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-3">');
                extensions.priority.call(column, baton);
                this.append(column);
            }
        },
        {
            id: 'col4',
            index: 400,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-4">');
                ext.point('io.ox/mail/listview/item/small/col4').invoke('draw', column, baton);
                this.append(column);
            }
        },
        {
            id: 'col5',
            index: 500,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-5">');
                ext.point('io.ox/mail/listview/item/small/col5').invoke('draw', column, baton);
                this.append(column);
            }
        },
        {
            id: 'col6',
            index: 600,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-6">');
                ext.point('io.ox/mail/listview/item/small/col6').invoke('draw', column, baton);
                this.append(column);
            }
        }
    );

    ext.point('io.ox/mail/listview/item/small/col4').extend({
        id: 'from',
        index: 100,
        draw: extensions.from
    });

    ext.point('io.ox/mail/listview/item/small/col5').extend(
        {
            id: 'account',
            index: 100,
            draw: extensions.account
        },
        {
            id: 'original-folder',
            index: 150,
            draw: extensions.folder
        },
        {
            id: 'flag',
            index: 200,
            draw: extensions.flag
        },
        {
            id: 'thread-size',
            index: 300,
            draw: extensions.threadSize
        },
        {
            id: 'paper-clip',
            index: 400,
            draw: extensions.paperClip
        },
        {
            id: 'pgp-encrypted',
            index: 600,
            draw: extensions.pgp.encrypted
        },
        {
            id: 'pgp-signed',
            index: 600,
            draw: extensions.pgp.signed
        },
        {
            id: 'subject',
            index: 1000,
            draw: extensions.subject
        }
    );

    ext.point('io.ox/mail/listview/item/small/col6').extend({
        id: 'date/size',
        index: 100,
        draw: extensions.dateOrSize
    });

    /* default */

    ext.point('io.ox/mail/listview/item/default').extend(
        {
            id: 'picture',
            before: 'row1',
            draw: function (baton) {
                if (baton.app && baton.app.props.get('contactPictures')) {
                    extensions.picture.call(this, baton);
                }
            }
        },
        {
            id: 'row1',
            index: 100,
            draw: function (baton) {
                var row = $('<div class="list-item-row">');
                ext.point('io.ox/mail/listview/item/default/row1').invoke('draw', row, baton);
                this.append(row);
            }
        },
        {
            id: 'unread',
            index: 110,
            draw: extensions.unreadClass
        },
        {
            id: 'deleted',
            index: 120,
            draw: extensions.deleted
        },
        {
            id: 'row2',
            index: 200,
            draw: function (baton) {
                var row = $('<div class="list-item-row">');
                ext.point('io.ox/mail/listview/item/default/row2').invoke('draw', row, baton);
                this.append(row);
            }
        }
    );

    ext.point('io.ox/mail/listview/item/default/row1').extend(
        {
            id: 'date/size',
            index: 100,
            draw: extensions.dateOrSize
        },
        {
            id: 'from',
            index: 300,
            draw: extensions.from
        }
    );

    ext.point('io.ox/mail/listview/item/default/row2').extend(
        {
            id: 'account',
            index: 100,
            draw: extensions.account
        },
        {
            id: 'original-folder',
            index: 150,
            draw: extensions.folder
        },
        {
            id: 'flag',
            index: 200,
            draw: extensions.flag
        },
        {
            id: 'thread-size',
            index: 300,
            draw: extensions.threadSize
        },
        {
            id: 'paper-clip',
            index: 400,
            draw: extensions.paperClip
        },
        {
            id: 'pgp-encrypted',
            index: 450,
            draw: extensions.pgp.encrypted
        },
        {
            id: 'pgp-signed',
            index: 450,
            draw: extensions.pgp.signed
        },
        {
            id: 'priority',
            index: 500,
            draw: extensions.priority
        },
        {
            id: 'subject',
            index: 1000,
            draw: function (baton) {
                extensions.subject.call(this, baton);
                var node = this.find('.flags');
                extensions.unread.call(node, baton);
                extensions.answered.call(node, baton);
                extensions.forwarded.call(node, baton);
            }
        }
    );

    var MailListView = ListView.extend({

        ref: 'io.ox/mail/listview',

        initialize: function (options) {

            ListView.prototype.initialize.call(this, options);
            this.$el.addClass('mail-item');
            this.on('collection:load', this.lookForUnseenMessage);
            this.$el.on('click mousedown',  '.selectable .icon-unread', this.markRead.bind(this));

            // track some states
            if (options && options.app) {
                var props = options.app.props;
                _.extend(this.options, props.pick('thread', 'sort'));
                this.listenTo(props, 'change:sort', function (model, value) {
                    this.options.sort = value;
                });
            }
        },

        lookForUnseenMessage: function () {

            if (!this.collection.length) return;

            // let's take the first folder_id we see
            var folder_id = this.collection.at(0).get('folder_id');

            // run over entre collection to get number of unseen messages
            var unseen = this.collection.reduce(function (sum, model) {
                return sum + util.isUnseen(model.get('flags')) ? 1 : 0;
            }, 0);

            // use this number only to set the minimum (there might be more due to pagination)
            folderAPI.setUnseenMinimum(folder_id, unseen);
        },

        markRead: function (e) {
            var cid = $(e.currentTarget).closest('.selectable').data('cid'),
                thread = api.threads.get(cid),
                isUnseen = _(thread).reduce(function (memo, item) {
                    return memo || util.isUnseen(item);
                }, false);

            if (isUnseen) api.markRead(thread);

            e.preventDefault();
            e.stopPropagation();
        },

        reprocessThread: function (model) {
            // only used when in thread mode
            if (!(this.app && this.app.isThreaded())) return;

            // get full thread objects (instead of cids)
            var threadlist = api.threads.get(model.cid);

            // up to date
            if (!model.get('thread') || threadlist.length === model.get('thread').length) return;

            // remove head property to avid accidently using old date when processThreadMessage
            _.each(threadlist, function (item) {
                delete item.head;
            });

            // generate updated data object (similar to server response structure)
            var obj = _.extend(model.toJSON(), threadlist[0], {
                thread: threadlist,
                threadSize: threadlist.length
            });

            // do the thread hokey-pokey-dance
            api.processThreadMessage(obj);

            // update model silently
            model.set(obj, { silent: true });
        },

        map: function (model) {
            // in case thread property has changed (e.g. latest mail of thread deleted)
            this.reprocessThread(model);

            // use head data for list view
            var data = api.threads.head(model.toJSON());
            // get thread with recent data
            var thread = api.threads.get(model.cid);
            // add proper picture
            var isThread = thread.length > 1,
                useRecipientAddress = !isThread && account.is('sent|drafts', data.folder_id),
                address = useRecipientAddress ? data.to : data.from;
            data.picture = address && address[0] && address[0][1];

            // not threaded?
            if (!(this.app && this.app.isThreaded())) return data;

            // get unseen flag for entire thread
            var unseen = _(thread).reduce(function (memo, obj) {
                return memo || util.isUnseen(obj);
            }, false);
            data.flags = unseen ? data.flags & ~32 : data.flags | 32;
            // get color_label for entire thread
            var color = _(thread).reduce(function (memo, obj) {
                return memo || parseInt(obj.color_label || 0, 10);
            }, 0);
            data.color_label = color;
            // set subject to first message in thread so a Thread has a constant subject
            data.subject = thread[thread.length - 1].subject;
            // done
            return data;
        },

        getCompositeKey: function (model) {
            return this.options.threaded ? 'thread.' + model.cid : model.cid;
        }
    });

    return MailListView;
});
