
<div class="control-group" data-extgroup="section" data-extid="head">
    <div class="controls">
        <label for="{{=it.uid}}_title">{{= it.strings.SUBJECT }}</label>
        <input type="text" class="discreet title" name="title" id="{{=it.uid}}_title"/>


        <label for="{{=it.uid}}_location">{{= it.strings.LOCATION }}</label>
        <input type="text" class="discreet location" name="location" id="{{=it.uid}}_location" data-extgroup="head" data-extid="location" />

        <a class="btn btn-primary save">Save</a>
    </div>
</div>

<div class="control-group" data-extgroup="section" data-extid="dates">
    <div class="controls tablerow">
        <div class="left">
            <label for="{{=it.uid}}_start_date">{{= it.strings.STARTS_ON }}</label>
            <input type="date" class="discreet startsat-date" id="{{=it.uid}}_start_date"/>
            <input type="time" class="discreet startsat-time" />
            <span class="label" data-original-title="">CEST</span>
        </div>
        <div class="right">
            <label for="{{=it.uid}}_end_date">{{= it.STRINGS_ENDS_ON }}</label>
            <input type="date" class="discreet endsat-date" id="{{=it.uid}}_end_date"/>
            <input type="time" class="discreet endsat-time" />
            <span class="label" data-original-title="">CEST</span>
        </div>
    </div>
</div>

<div class="control-group" data-extgroup="section" data-extid="extras">
    <div class="controls tablerow">
        <div class="left">
            <input type="checkbox" class="full_time" name="full_time" id="{{=it.uid}}_full_time"/>
            <label style="display: inline;" for="{{=it.uid}}_full_time">{{= it.strings.ALL_DAY }}</label>
            <div />
            <input type="checkbox" class="repeat" name="repeat" id="{{=it.uid}}_repeat"/>
            <label style="display: inline; margin-right: -4px;" for="{{=it.uid}}_repeat">{{= it.strings.REPEAT }}</label>
            <span name="recurrenceText"></span>
            <span class='editrecurrence_wrapper' style="display:none;">
            (<a class="editrecurrence">{{= it.strings.EDIT }}</a>)
            </span>
        </div>
        <div class="right">
            <div style="text-align: right;">
              <a class="edittimezone">{{= it.strings.CHANGE_TIMEZONE }}</a>

            </div>
        </div>
    </div>
</div>

<div class="control-group recurrence" data-extgroup="section" data-extid="recurrence">

</div>

<div class="control-group" data-extgroup="section" data-extid="description">
    <label class="control-label" for="{{=it.uid}}_note">{{= it.strings.DESCRIPTION }}</label>
    <div class="controls">
        <textarea class="note" name="note" id="{{=it.uid}}_note"></textarea>
    </div>
</div>

<div class="control-group tablerow" data-extgroup="section" data-extid="options">
    <div class="tablecell" style="width: 266px;">
        <label for="{{=it.uid}}_alarm">{{= it.strings.REMINDER}}</label>
        <select name="alarm" id="{{=it.uid}}_alarm">
            <option value="-1">{{= it.strings.NO_REMINDER }}</option>
            {{~ it.reminderList :item:index }}
            <option value="{{=item.value}}">{{=item.label}}</option>
            {{~}}
        </select>
    </div>
    <div class="tablecell" style="width: 266px;">
        <label for="shown_as">{{= it.strings.DISPLAY_AS}}</label>
        <select name="shown_as" id="{{=it.uid}}_shown_as">
            <option value="1" data-extgroup="shownas" data-extid="reserved">{{= it.strings.RESERVED }}</option>
            <option value="2" data-extgroup="shownas" data-extid="temporary">{{= it.strings.TEMPORARY }}</option>
            <option value="3" data-extgroup="shownas" data-extid="absent">{{= it.strings.ABSENT }}</option>
            <option value="4" data-extgroup="shownas" data-extid="free">{{= it.strings.FREE }}</option>
        </select>
    </div>
    <div class="tablecell" style="width: 266px;">
        <label for="{{=it.uid}}_private_flag">{{= it.strings.TYPE }}</label>
        <input type="checkbox" name="private_flag" id="{{=it.uid}}_private_flag"><span style="margin-left:4px;">{{= it.strings.PRIVATE}}</span>

    </div>
</div>

<div class="control-group" data-extgroup="section" data-extid="participants">
    <div class="control-grouphead tablerow">
        <div class="left">
            {{= it.strings.PARTICIPANTS}}
        </div>
        <div class="right">
            <div style="text-align: right;">
                <input type="checkbox" name="notification" id="{{=it.uid}}_notification"/>
                <label style="display:inline;" for="{{=it.uid}}_notification">{{= it.strings.NOTIFY_ALL}}</label>
            </div>
        </div>
    </div>
    <div style="clear:both;" id="participantsView"/>
    </div>
</div>
