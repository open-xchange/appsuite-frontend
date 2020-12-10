/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/system-message', ['gettext!io.ox/chat'], function (gt) {

    'use strict';

    var data = {};

    function render(model) {

        var content = model.get('data');
        var json;

        try {
            json = JSON.parse(content);
        } catch (e) {
            console.error('Could not parse system message', content, e);
            return '';
        }

        var originator = model.get('sender');
        var me = originator === data.user.email;
        var members;
        var context = {
            members: getMembers(json),
            model: model,
            originator: originator,
            room: getRoom(model),
            type: json.type
        };

        switch (deriveType(context)) {
            case 'room:created':
                if (me) return gt('You created this conversation');
                //#. %1$s: name of the creator
                return gt('%1$s created this conversation', getOriginatorName(context));
            case 'channel:joined':
                if (me) return gt('You joined the conversation');
                //#. %1$s: name of the new participant
                return gt('%1$s joined the conversation', getNames(context.members));
            case 'members:added':
                members = getDifference(context);
                //#. %1$s: name of the added participant or participants and can be a single name or a comma separated list of names
                if (me) return gt.ngettext('You added %1$s to the conversation', 'You added %1$s to the conversation', members.count, members.names);
                //#. %1$s: name of the participant that added the new participant
                //#. %2$s: name of the added participant or participants and can be a single name or a comma separated list of names
                return gt.ngettext('%1$s added %2$s to the conversation', '%1$s added %2$s to the conversation', members.count, getOriginatorName(context), members.names);
            case 'members:removed':
                members = getDifference(context);
                //#. %1$s: name of the removed participant or participants and can be a single name or a comma separated list of names
                if (me) return gt.ngettext('You removed %1$s from the conversation', 'You removed %1$s from the conversation', members.count, members.names);
                //#. %1$s: name of the participant that removed the other participant
                //#. %2$s: name of the removed participant or participants and can be a single name or a comma separated list of names
                return gt.ngettext('%1$s removed %2$s from the conversation', '%1$s removed %2$s from the conversation', members.count, getOriginatorName(context), members.names);
            case 'image:changed':
                if (me) return gt('You changed the group image');
                //#. %1$s: name of a chat participant
                return gt('%1$s changed the group image', getOriginatorName(context));
            case 'title:changed':
                if (me) return gt('You changed the group title to "%1$s"', json.title);
                //#. %1$s: name of a chat participant
                //#. %2$s: the new title
                return gt('%1$s changed the group title to "%2$s"', getOriginatorName(context), json.title);
            case 'chat:deleted':
                if (me) return gt('You deleted this chat');
                //#. %1$s: name of a chat participant
                //#. %2$s: the new title
                return gt('This chat has been deleted by "%1$s"', getOriginatorName(context));
            case 'changeDescription':
                if (me) return gt('You changed the group description to "%1$s"', json.description);
                //#. %1$s: name of a chat participant
                //#. %2$s: the new description
                return gt('%1$s changed the group description to "%2$s"', getOriginatorName(context), json.description);
            case 'room:left':
                if (me) return gt('You left the conversation');
                //#. %1$s: name of a chat participant
                return gt('%1$s left the conversation', getOriginatorName(context));
            case 'me':
                // no need to translate this
                return getOriginatorName(context) + ' ' + json.message;
            case 'text':
                return json.message;
            case 'decryption:failed':
                //#. If it fails to load and decrypt a chat message a system message will be shown
                return gt('Message could not be loaded');
            default:
                //#. %1$s: messagetext
                return model.getContent() || gt('Unknown system message: %1$s', json.type);
        }
    }

    //
    // Helpers
    //

    function getMembers(json) {
        var members = json.members || [];
        // TBD: we should NOT have to clean this up
        if (!_.isArray(members) && _.isObject(members)) return Object.keys(members);
        return members;
    }

    function getRoom(model) {
        var roomId = model.get('roomId');
        // also support unjoined channels
        return data.chats.get(roomId) || data.channels.get(roomId);
    }

    function deriveType(context) {
        if (context.room.get('type') === 'channel' && context.type === 'members:added') return 'channel:joined';
        if (context.type === 'members:removed' && context.members.length === 1 && context.members[0] === context.originator) return 'room:left';
        return context.type;
    }

    function getOriginatorName(context) {
        return getName(context.originator);
    }

    function getDifference(context) {
        var diff = _.difference(context.members, [context.originator]);
        return { names: getNames(diff), count: diff.length };
    }

    function getName(email) {
        return getNames([email]);
    }

    function getNames(list) {

        list = list.map(function (email) {
            var model = data.users.getByMail(email);
            return '<span class="name">' + _.escape(model ? model.getName() : email) + '</span>';
        });

        if (list.length <= 1) return list[0] || '';

        //#. %1$s is a name or multiple comma-separated names
        return gt('%1$s and %2$s', _(list).initial().join(', '), _(list).last());
    }

    return {
        render: render,
        pass: function (_data) { data = _data; }
    };
});
