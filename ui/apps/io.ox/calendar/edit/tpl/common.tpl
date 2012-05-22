
<div class="control-group">
    <div class="controls">
        <label for="{{=it.uid}}_title">{{= it.gt("Subject") }}</label>
        <input type="text" class="discreet title" name="title" id="{{=it.uid}}_title"/>


        <label for="{{=it.uid}}_location">{{= it.gt("Location") }}</label>
        <input type="text" class="discreet location" name="location" id="{{=it.uid}}_location" />

        <a class="btn btn-primary save">Save</a>
    </div>
</div>

<div class="control-group">
    <div class="controls tablerow">
        <div class="left">
            <label id="{{=it.uid}}_start_date">{{= it.gt("Start on") }}</label>
            <input type="date" class="discreet startsat-date" id="{{=it.uid}}_start_date"/>
            <input type="time" class="discreet startsat-time" />
            <span class="label" data-original-title="">CEST</span>
        </div>
        <div class="right">
            <label id="{{=it.uid}}_end_date">{{= it.gt("Ends on") }}</label>
            <input type="date" class="discreet endsat-date" id="{{=it.uid}}_end_date"/>
            <input type="time" class="discreet endsat-time" />
            <span class="label" data-original-title="">CEST</span>
        </div>
    </div>
</div>

<div class="control-group">
    <div class="controls tablerow">
        <div class="left">
            <input type="checkbox" class="full_time" name="full_time" id="{{=it.uid}}_full_time"/>
            <label style="display: inline;" for="{{=it.uid}}_full_time">{{= it.gt("All day") }}</label>
            <div />
            <input type="checkbox" class="repeat" name="repeat" id="{{=it.uid}}_repeat"/>
            <label style="display: inline;" for="{{=it.uid}}_repeat">{{= it.gt("Repeat") }}:

            </label>
                            <span name="recurrenceText"></span>
                <span class='editrecurrence_wrapper' style="display:none;">
                  (<a class="editrecurrence">{{= it.gt("edit") }}</a>)
                </span>
        </div>
        <div class="right">
            <div style="text-align: right;">
              <a class="edittimezone">{{= it.gt("Change Timezone") }}</a>

            </div>
        </div>
    </div>
</div>

<div class="control-group recurrence">

</div>



<div class="control-group">
    <label class="control-label" for="{{=it.uid}}_note">{{= it.gt("Description") }}</label>
    <div class="controls">
        <textarea class="note" name="note" id="{{=it.uid}}_note"></textarea>
    </div>
</div>

<div class="control-group tablerow">
    <div class="tablecell" style="width: 266px;">
        <label for="{{=it.uid}}_alarm">{{= it.gt("Reminder")}}</label>
        <select name="alarm" id="{{=it.uid}}_alarm">
            <option value="-1">{{= it.gt("no reminder") }}</option>
            <option value="0">{{= it.gt("0 minutes") }}</option>
            <option value="15">{{= it.gt("15 minutes") }}</option>
            <option value="30">{{= it.gt("30 minutes") }}</option>
            <option value="45">{{= it.gt("45 minutes") }}</option>
            <option value="60">{{= it.gt("1 hour") }}</option>
            <option value="120">{{= it.gt("2 hours") }}</option>
            <option value="240">{{= it.gt("4 hours") }}</option>
            <option value="360">{{= it.gt("6 hours") }}</option>
            <option value="420">{{= it.gt("8 hours") }}</option>
            <option value="720">{{= it.gt("12 hours") }}</option>
            <option value="1440">{{= it.gt("1 day") }}</option>
            <option value="2880">{{= it.gt("2 days") }}</option>
            <option value="4320">{{= it.gt("3 days") }}</option>
            <option value="5760">{{= it.gt("4 days") }}</option>
            <option value="7200">{{= it.gt("5 days") }}</option>
            <option value="8640">{{= it.gt("6 days") }}</option>
            <option value="10080">{{= it.gt("1 week") }}</option>
            <option value="20160">{{= it.gt("2 weeks") }}</option>
            <option value="30240">{{= it.gt("3 weeks") }}</option>
            <option value="40320">{{= it.gt("4 weeks") }}</option>
        </select>
    </div>
    <div class="tablecell" style="width: 266px;">
        <label for="shown_as">{{= it.gt("Display as")}}</label>
        <select name="shown_as" id="{{=it.uid}}_shown_as">
            <option value="1">{{= it.gt("reserved") }}</option>
            <option value="2">{{= it.gt("temporary") }}</option>
            <option value="3">{{= it.gt("absent") }}</option>
            <option value="4">{{= it.gt("free") }}</option>
        </select>
    </div>
    <div class="tablecell" style="width: 266px;">
        <label for="{{=it.uid}}_private_flag">{{= it.gt("Type")}}</label>
        <input type="checkbox" name="private_flag" id="{{=it.uid}}_private_flag"><span style="margin-left:4px;">{{= it.gt("Private")}}</span>

    </div>
</div>

<div class="control-group ">
    <div class="control-grouphead tablerow">
        <div class="left">
            {{= it.gt("Participants")}}
        </div>
        <div class="right">
            <div style="text-align: right;">
                <input type="checkbox" name="notification" id="{{=it.uid}}_notification"/>
                <label style="display:inline;" for="{{=it.uid}}_notification">{{= it.gt("Notify all")}}</label>
            </div>
        </div>
    </div>
    <div style="clear:both;" id="participantsView"/>

    </div>
</div>
