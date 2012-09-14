define("io.ox/participants/views", function () {
    "use strict";

    var ParticipantEntryView = Backbone.View.extend({
        tagName: 'div',
        className: 'span6',
        render: function () {
            var self = this;
            this.$el.text(this.model.getDisplayName());
            this.model.on('change', function () {
                self.$el.text(this.model.getDisplayName());
            });
            return this;
        }
    });

    var UserContainer = Backbone.View.extend({
        tagName: 'div',
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
                console.log(participant.id);
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

