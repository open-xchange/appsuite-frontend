define 'io.ox/calendar/edit/view-main',
      ['io.ox/calendar/edit/deps/Backbone',
       'io.ox/calendar/edit/deps/doT',
       'io.ox/calendar/edit/collection-participants',
       'io.ox/calendar/edit/view-participants',
       'io.ox/calendar/edit/view-recurrence',
       'io.ox/calendar/edit/binding-util'
       'io.ox/calendar/util',
       'text!io.ox/calendar/edit/tpl/common.tpl',
       'gettext!io.ox/calendar/edit/main'
      ], (Backbone, doT, ParticipantsCollection, ParticipantsView, RecurrenceView, BinderUtils, util, commontpl, gt) ->

          class CommonView extends Backbone.View
              RECURRENCE_NONE: 0
              tagName: 'div'
              className: 'io-ox-calendar-edit'
              _modelBinder: undefined
              events:
                  'click .editrecurrence': 'toggleRecurrence',
                  'click .save': 'onSave'
              initialize ->
                  @template = doT.template commontpl
                  @_modelBinder = new Backbone.ModelBinder()
                  @participantsCollection = new ParticipantsCollection (@model.get 'participants')
                  @participantsView = new ParticipantsView {collection: @participantsCollection}
                  @recurrenceView = new RecurrenceView {model: @model}

                  recurTextConverter (direction, valu, attribute, model) ->
                      util.getRecurrenceString model.attributes if direction == 'ModelToView' else model.get attribute

                  @bindings =
                      start_data: [
                          {
                              selector: '.startsat-date'
                              converter: BinderUtils.convertDate
                          },
                          {
                              selector: '.startsat-time'
                              converter: BinderUtils.convertTime
                          }
                      ]
                      end_date: [{
                        selector: '.endsat-date'
                        converter: BinderUtils.convertDate
                      }, {
                        selector: '.endsat-time'
                        converter: BinderUtils.convertTime
                      }]
                      recurrence_type: [{
                          select: '[name=repeat]'
                          converter: (direction, value, attribute, model) ->
                              if direction == 'ModelToView'
                                 if value == self.RECURRENCE_NONE
                                     false
                                 true
                              else
                                 if value == false
                                     self.RECURRENCE_NONE
                                 model.get attribute

                      }]
                      day_in_month: {selector: '[name=recurrenceText]', converter: recurTextConverter}
                      interval: {selector: '[name=recurrenceText]', converter: recurTextConverter}
                      days: {selector: '[name=recurrenceText]', converter: recurTextConverter}
                      month: {selector: '[name=recurrenceText]', converter: recurTextConverter}
              render ->
                @$el.empty().append(@template {gt: gt})
                @$('#participantsView').empty().append(@participantsView.render().el)
                defaultBindings = Backbone.ModelBinder.createDefaultBindings @el, 'name'
                bindings = _.extend(defaultBindings, @bindings)
                @_modelBinder.bind(@model, @el, bindings)
                @
              onSave ->
                @trigger('save')


