define("io.ox/participants/views",
        ['gettext!io.ox/calendar/edit/main',
         'less!io.ox/participants/participants.less'], function (gt) {
    "use strict";

    var getImageStyle = function (url) {
        return ((/api\/image/).test(url) === true) ? 'background-image: url("' + url + '");' : '';
    };

    var ParticipantEntryView = Backbone.View.extend({
        tagName: 'div',
        events: {
            'click .remove': 'onRemove'
        },
        initialize: function () {
            var self = this;
            this.model.on("change", function () {
                self.$el.empty();
                self.render();
            });
        },
        render: function () {
            this.$el.attr('data-cid', this.model.cid);
            var self = this,
                $wrapper = $('<div class="participant-wrapper">'),
                $img = $('<div>'),
                $text = $('<div>'),
                $mail = $('<div>'),
                $removeButton = $('<div class="remove">')
                    .append($('<div class="icon">')
                        .append($('<i class="icon-remove">'))
                    );
            self.nodes = {};
            self.nodes.$mail = $mail;
            self.nodes.$img = $img;
            // some paint magic
            $removeButton.on('mouseover', function () {
                $(this).find('i').addClass('icon-white');
            });
            $removeButton.on('mouseleave', function () {
                $(this).find('i').removeClass('icon-white');
            });

            // choose right contact image and subtext
            this.setTypeStyle();
            $img.attr('style', getImageStyle(this.model.getImage()));

            $wrapper.append($img,
                $text.text(this.model.getDisplayName()),
                $mail
            );

            if (this.options.closeButton || _.isUndefined(this.options.closeButton)) {
                if (this.model.get('ui_removable') !== false) {
                    $wrapper.append($removeButton);
                }
            }

            this.$el.append($wrapper);

            this.model.on('change', function () {
                $text.text(self.model.getDisplayName());
                self.setTypeStyle();
            });
            return this;
        },
        setTypeStyle: function  () {
            var type = this.model.get('type');
            this.nodes.$img.removeAttr('class');
            switch (type) {
            case 1:
                this.nodes.$img.addClass('contact-image');
                this.nodes.$mail.text(this.model.getEmail());
                break;
            case 2:
                this.nodes.$img.addClass('group-image');
                this.nodes.$mail.text(gt('Group'));
                break;
            case 3:
                this.nodes.$img.addClass('resource-image');
                this.nodes.$mail.text(gt('Resource'));
                break;
            case 4:
                this.nodes.$img.addClass('resource-image');
                this.nodes.$mail.text(gt('Resource group'));
                break;
            case 5:
                this.nodes.$img.addClass('external-user-image');
                this.nodes.$mail.text(this.model.getEmail() || gt('External user'));
                break;
            case 6:
                this.nodes.$img.addClass('group-image');
                this.nodes.$mail.text(this.model.getEmail() || gt('Distribution list'));
                break;
            }
        },
        onRemove: function (e) {
            // remove participant from model
            e.preventDefault();
            // get cid from parent node
            var itemid = $(e.currentTarget).closest('[data-cid]').attr('data-cid');
            // remove from collection by cid
            this.model.collection.remove(this.model.collection.getByCid(itemid));
        }
    });

    var UserContainer = Backbone.View.extend({
        tagName: 'div',
        className: 'participantsrow',
        initialize: function (options) {
            options.collection.on('add', _.bind(this.onAdd, this));
            options.collection.on('remove', _.bind(this.onRemove, this));
            options.collection.on('reset', _.bind(this.updateContainer, this));
        },
        render: function () {
            var self = this;
            this.nodes = {};
            this.collection.each(function (participant) {
                self.nodes[participant.id] = self.createParticipantNode(participant);
            });
            var row = null;
            var c = 0;
            _(this.nodes).chain().values().each(function (node) {
                if (c % 2 === 0) {
                    row = $('<div class="row-fluid">');
                    self.$el.append(row);
                }
                row.append(node);
                c++;
            });
            return this;
        },
        createParticipantNode: function (participant) {
            return new ParticipantEntryView({model: participant, className: 'span6'}).render().$el;
        },
        updateContainer: function () {
            this.nodes = {};
            this.$el.empty();
            this.render();
        },
        onAdd: function (participant, participants, options) {
            this.updateContainer();
        },
        onRemove: function (participant, participants, options) {
            this.updateContainer();
        }
    });

    return {
        ParticipantEntryView: ParticipantEntryView,
        UserContainer: UserContainer
    };
});

