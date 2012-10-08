define("io.ox/participants/views", ['less!io.ox/participants/participants.less'], function () {
    "use strict";

    var getImageStyle = function (url) {
        return 'background-image: url("' + url + '");';
    };

    var ParticipantEntryView = Backbone.View.extend({
        tagName: 'div',
        className: 'span6',
        events: {
            'click .remove': 'onRemove'
        },
        render: function () {
            this.$el.attr('data-cid', this.model.cid);
            var $wrapper = $('<div class="participant-wrapper">'),
                $img = $('<div>'),
                $text = $('<div>'),
                $mail = $('<div>'),
                $removeButton = $('<div class="remove">')
                    .append($('<div class="icon">')
                        .append($('<i class="icon-remove">')
                    )
                );
            // some paint magic
            $removeButton.on('mouseover', function () {
                $(this).find('i').addClass('icon-white');
            });
            $removeButton.on('mouseleave', function () {
                $(this).find('i').removeClass('icon-white');
            });

            $img.addClass('contact-image')
                .attr('style', getImageStyle(this.model.getImage()));

            $wrapper.append($img,
                $text.text(this.model.getDisplayName()),
                $mail.text(this.model.getEmail()),
                $removeButton
            );

            this.$el.append($wrapper);

            this.model.on('change', function () {
                $text.text(this.model.getDisplayName());
                $img.attr('style', getImageStyle(this.model.getImage()));
                $mail.text(this.model.getEmail());
            });
            return this;
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
            return new ParticipantEntryView({model: participant}).render().$el;
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

