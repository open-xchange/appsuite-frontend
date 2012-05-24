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
