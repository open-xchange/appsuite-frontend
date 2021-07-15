/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/mail/listview', [
    'io.ox/mail/common-extensions',
    'io.ox/core/extensions',
    'io.ox/mail/util',
    'io.ox/mail/api',
    'io.ox/core/api/account',
    'io.ox/core/tk/list',
    'io.ox/core/tk/list-contextmenu',
    'io.ox/core/folder/api',
    'gettext!io.ox/mail',
    'io.ox/mail/view-options',
    'less!io.ox/mail/style'
], function (extensions, ext, util, api, account, ListView, Contextmenu, folderAPI, gt) {

    'use strict';

    function fixThreadSize(data) {
        if ('threadSize' in data) return;
        data.threadSize = Math.max(1, _(data.thread).reduce(function (sum, data) {
            return sum + (util.isDeleted(data) ? 0 : 1);
        }, 0));
    }

    // if the most recent mail in a thread is deleted remove that data and use the data of the first undeleted mail instead
    function removeDeletedMailThreadData(data) {
        // most recent mail is not deleted
        if (!util.isDeleted(data)) return;

        var firstUndeletedMail = _(data.thread).findWhere(function (mail) {
            return !util.isDeleted(mail);
        });
        // seems there is no undeleted mail
        if (!firstUndeletedMail) return;

        data = _.extend(data, firstUndeletedMail);
    }

    ext.point('io.ox/mail/listview/item').extend(
        {
            id: 'default',
            index: 100,
            draw: function (baton) {

                // fix missing threadSize (aparently only used by tests)
                fixThreadSize(baton.data);

                removeDeletedMailThreadData(baton.data);
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
            id: 'flagged',
            index: 115,
            draw: extensions.flaggedClass
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
                extensions.envelope.call(column, baton);
                this.append(column);
            }
        },
        {
            id: 'col2',
            index: 200,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-3">');
                extensions.paperClip.call(column, baton);
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
                extensions.answered.call(column, baton);
                if (column.children().length === 0) {
                    // horizontal view: only show forwarded icon if answered flag not set
                    extensions.forwarded.call(column, baton);
                }
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
        },
        {
            id: 'col7',
            index: 700,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-7">');
                ext.point('io.ox/mail/listview/item/small/col7').invoke('draw', column, baton);
                this.append(column);
            }
        }
    );

    ext.point('io.ox/mail/listview/item/small/col4').extend({
        id: 'from',
        index: 100,
        draw: extensions.from
    });

    ext.point('io.ox/mail/listview/item/small/col6').extend(
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
            id: 'optionalSize',
            index: 250,
            draw: extensions.size
        },
        {
            id: 'thread-size',
            index: 300,
            draw: extensions.threadSize
        },
        {
            id: 'shared-attachement',
            index: 450,
            draw: extensions.sharedAttachement
        },
        {
            id: 'colorflag',
            index: 200,
            draw: extensions.colorflag
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
        },
        {
            id: 'text-preview',
            index: 1100,
            draw: function (baton) {
                this.append(
                    $('<span class="text-preview inline gray">').text(baton.data.text_preview || '')
                );
            }
        }
    );

    ext.point('io.ox/mail/listview/item/small/col7').extend({
        id: 'date',
        index: 100,
        draw: extensions.date
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
            id: 'flagged',
            index: 115,
            draw: extensions.flaggedClass
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
        },
        {
            id: 'row3',
            index: 300,
            draw: function (baton) {
                if (!baton.app || !baton.app.useTextPreview) return;
                var row = $('<div class="list-item-row">');
                ext.point('io.ox/mail/listview/item/default/row3').invoke('draw', row, baton);
                this.append(row);
            }
        }
    );

    ext.point('io.ox/mail/listview/item/default/row1').extend(
        {
            id: 'date',
            index: 100,
            draw: extensions.date
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
            id: 'colorflag',
            index: 200,
            draw: extensions.colorflag
        },
        {
            id: 'flag',
            index: 210,
            draw: extensions.flag
        },
        {
            id: 'optionalSize',
            index: 250,
            draw: extensions.size
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
            id: 'shared-attachement',
            index: 350,
            draw: extensions.sharedAttachement
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

    ext.point('io.ox/mail/listview/item/default/row3').extend(
        {
            id: 'text-preview',
            index: 100,
            draw: function (baton) {
                this.append(
                    $('<div class="text-preview multiline gray">').text(baton.data.text_preview || '')
                );
            }
        }
    );

    ext.point('io.ox/mail/listview/notification/empty').extend({
        id: 'default',
        index: 100,
        draw: extensions.empty
    });

    ext.point('io.ox/mail/listview/notification/error').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {

            function retry(e) {
                e.data.baton.listView.load();
            }

            this.append(
                $('<i class="fa fa-exclamation-triangle" aria-hidden="true">'),
                $.txt(gt('Error: Failed to load messages')),
                $('<button type="button" class="btn btn-link">')
                    .text(gt('Retry'))
                    .on('click', { baton: baton }, retry)
            );
            // trigger event to count a user facing error
            ox.trigger('yell:error', baton.error);
        }
    });

    var MailListView = ListView.extend(Contextmenu).extend({

        ref: 'io.ox/mail/listview',

        initialize: function (options) {

            ListView.prototype.initialize.call(this, options);
            this.$el.addClass('mail-item');
            this.on('collection:load', this.lookForUnseenMessage);
            this.$el.on('click mousedown', '.selectable .seen-unseen-indicator', this.markRead.bind(this));

            // track some states
            if (options && options.app) {
                var props = options.app.props;
                _.extend(this.options, props.pick('thread', 'sort'));
                this.listenTo(props, 'change:sort', function (model, value) {
                    this.options.sort = value;
                });
            }

            this.$el.on('scrollend', this.fetchTextPreview.bind(this));
            this.on('collection:load collection:reload', this.fetchTextPreview);
            if (this.selection) {
                this.selection.resolve = function () {
                    return api.resolve(this.get(), this.view.app.isThreaded());
                };
            }
        },

        fetchTextPreview: function () {

            if (!this.app) return;
            if (!this.app.useTextPreview()) return;

            var top = this.el.scrollTop,
                bottom = top + this.el.offsetHeight,
                itemHeight = this.getItems().outerHeight(),
                start = Math.floor(0, top / itemHeight),
                stop = Math.ceil(bottom / itemHeight),
                models = this.collection.slice(start, stop),
                ids = [];

            // get models inside viewport that have no text preview yet
            models = _(models).filter(function (model) {
                var data = _(api.threads.get(model.cid)).first(),
                    lacksPreview = data && !data.text_preview;
                    // no need to request models that actually have no preview again and again (empty mails)
                if (lacksPreview && !model.hasNoPreview) ids.push(_(data).pick('id', 'folder_id'));
                return lacksPreview;
            });

            if (!ids.length) return;

            api.fetchTextPreview(ids).done(function (hash) {
                _(models).each(function (model) {
                    var msg = _(api.threads.get(model.cid)).first(), cid = _.cid(msg);
                    model.set('text_preview', hash[cid]);
                    // if a model has no preview mark it in the model, so we don't request it again all the time someone scrolls
                    // don't mark it as part of the attributes to avoid triggering change events and reloading stuff (refresh does still work)
                    if (hash[cid] === '') model.hasNoPreview = true;
                });
            });
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

            if (isUnseen) {
                api.markRead(thread);
            } else {
                api.markUnread(thread);
            }

            e.preventDefault();
            e.stopPropagation();
        },

        reprocessThread: function (model) {

            // get full thread objects (instead of cids)
            var threadlist = api.threads.get(model.cid);

            // return to avoid runtime errors if we have no thread data (see OXUI-304)
            if (!threadlist.length) return;

            // return if thread is up to date
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
            // only used when in thread mode
            if (!(this.app && this.app.isThreaded())) return model.toJSON();

            // in case thread property has changed (e.g. latest mail of thread deleted)
            this.reprocessThread(model);

            // use head data for list view
            var data = api.threads.head(model.toJSON());
            // get thread with recent data
            var thread = api.threads.get(model.cid);

            // get unseen flag for entire thread
            var unseen = _(thread).reduce(function (memo, obj) {
                return memo || util.isUnseen(obj);
            }, false);
            data.flags = unseen ? data.flags & ~32 : data.flags | 32;
            // get flagged flag for entire thread
            var flagged = _(thread).reduce(function (memo, obj) {
                return memo || util.isFlagged(obj);
            }, false);
            data.flags = flagged ? data.flags | 8 : data.flags & ~8;
            // get color_label for entire thread
            var color = _(thread).reduce(function (memo, obj) {
                return memo || parseInt(obj.color_label || 0, 10);
            }, 0);
            data.color_label = color;
            data.thread = thread.map(function (entry, index) {
                return _(entry).pick(_(data.thread[index]).keys());
            });
            // set subject to first message in thread so a Thread has a constant subject
            data.subject = api.threads.subject(data) || data.subject || '';
            // done
            return data;
        },

        getCompositeKey: function (model) {
            // seems that threaded option is used for tests only
            return this.options.threaded ? 'thread.' + model.cid : model.cid;
        },

        getContextMenuData: function (selection) {
            return this.app.getContextualData(selection);
        }
    });

    return MailListView;
});
