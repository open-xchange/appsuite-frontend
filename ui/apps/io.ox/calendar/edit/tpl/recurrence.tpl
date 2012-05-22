<div class='control-group'>
    <div class='controls tablerow'>
        <div style='width: 200px;' class="tablecell">
            <input type="radio" name="recurrence_type" value="1" id="{{=it.uid}}_daily"/>
            <label style="display: inline;" for="{{=it.uid}}_daily">{{= it.gt('Daily') }}</label>
        </div>
        <div style='width: 200px;' class="tablecell">
            <input type="radio" name="recurrence_type" value="2" id="{{=it.uid}}_weekly"/>
            <label style="display: inline;" for="{{=it.uid}}_weekly">{{= it.gt('Weekly') }}</label>
        </div>
        <div style='width: 200px;' class="tablecell">
            <input type="radio" name="recurrence_type" value="3" id="{{=it.uid}}_monthly"/>
            <label style="display: inline;" for="{{=it.uid}}_monthly">{{= it.gt('Monthly') }}</label>
        </div>
        <div style='width: 200px;' class="tablecell">
            <input type="radio" name="recurrence_type" value="4" id="{{=it.uid}}_yearly"/>
            <label style="display: inline;" for="{{=it.uid}}_yearly">{{= it.gt('Yearly') }}</label>
        </div>
    </div>
</div>

<div>
    <div class='recurrence_details daily control-group'>
        <div class="controls">
            <label for="{{=it.uid}}_daily_interval">{{= it.gt('Every') }}</label>
            <input type="text" class="discreet short" name='interval' id="{{=it.uid}}_daily_interval"/>
            <span class="help-inline">{{= it.gt('day') }}</span>
        </div>
    </div>

    <div class='recurrence_details weekly control-group'>
        <div class="controls">
            <label for="{{=it.uid}}_weekly_interval">{{= it.gt('Every') }}</label>
            <input type="text" name='interval' class="discreet weeks short" id="{{=it.uid}}_weekly_interval"/>
            <span class="help-inline">{{= it.gt('weeks') }}</span>
            <div>
                <input type='checkbox' name='day{{= it.daybits.DAYS_MONDAY }}' id="{{=it.uid}}_weekly_days_monday"/>
                <label style="display: inline;" for="{{=it.uid}}_weekly_days_monday">{{= it.gt('Monday') }}</label>

                <input type='checkbox' name='day{{= it.daybits.DAYS_TUESDAY }}' id="{{=it.uid}}_weekly_days_tuesday"/>
                <label style="display: inline;" for="{{=it.uid}}_weekly_days_tuesday">{{= it.gt('Tuesday') }}</label>

                <input type='checkbox' name='day{{= it.daybits.DAYS_WEDNESDAY }}' id="{{=it.uid}}_weekly_days_wednesday"/>
                <label style="display: inline;" id="{{=it.uid}}_weekly_days_wednesday">{{= it.gt('Wednesday') }}</label>

                <input type='checkbox' name='day{{= it.daybits.DAYS_THURSDAY }}' id="{{=it.uid}}_weekly_days_thursday"/>
                <label style="display: inline;" id="{{=it.uid}}_weekly_days_thursday">{{= it.gt('Thursday') }}</label>

                <input type='checkbox' name='day{{= it.daybits.DAYS_FRIDAY }}' id="{{=it.uid}}_weekly_days_friday"/>
                <label style="display: inline;" id="{{=it.uid}}_weekly_days_friday">{{= it.gt('Friday') }}</label>

                <input type='checkbox' name='day{{= it.daybits.DAYS_SATURDAY }}' id="{{=it.uid}}_weekly_days_saturday"/>
                <label style="display: inline;" id="{{=it.uid}}_weekly_days_saturday">{{= it.gt('Saturday') }}</label>

                <input type='checkbox' name='day{{= it.daybits.DAYS_SUNDAY }}' id="{{=it.uid}}_weekly_days_sunday"/>
                <label style="display: inline;" id="{{=it.uid}}_weekly_days_sunday">{{= it.gt('Sunday') }}</label>
            </div>
        </div>
    </div>

    <div class='recurrence_details monthly control-group'>
        <div class="controls">
            <div>
                <input type='radio' name='monthly_option' value='one'>
                <span class='help-inline'>{{= it.gt('at')}}</span>
                <input type='text' name='day_in_month' class='discreet short'/>
                <span class='help-inline'>{{= it.gt('th day every')}}</span>
                <input type='text' name='interval' class='discreet short'/>
                <span class='help-inline'>{{= it.gt('th month')}}</div>
            </div>
            <div>
                <input type='radio' name='monthly_option' value='two'>
                <span class='help-inline'>{{= it.gt('at')}}</span>
                <select name='day_in_month'>
                    <option value='1'>{{= it.gt('First')}}</option>
                    <option value='2'>{{= it.gt('Second')}}</option>
                    <option value='3'>{{= it.gt('Third')}}</option>
                    <option value='4'>{{= it.gt('Fourth')}}</option>
                    <option value='5'>{{= it.gt('Last')}}</option>
                </select>
                <select name='days' class='days'>
                    <option value='{{= it.daybits.DAYS_MONDAY }}'>{{= it.gt('Monday')}}</option>
                    <option value='{{= it.daybits.DAYS_TUESDAY }}'>{{= it.gt('Tuesday')}}</option>
                    <option value='{{= it.daybits.DAYS_WEDNESDAY }}'>{{= it.gt('Wednesday')}}</option>
                    <option value='{{= it.daybits.DAYS_THURSDAY }}'>{{= it.gt('Thursday')}}</option>
                    <option value='{{= it.daybits.DAYS_FRIDAY }}'>{{= it.gt('Friday')}}</option>
                    <option value='{{= it.daybits.DAYS_SATURDAY }}'>{{= it.gt('Saturday')}}</option>
                    <option value='{{= it.daybits.DAYS_SUNDAY }}'>{{= it.gt('Sunday')}}</option>
                </select>
                <span class='help-inline'>{{= it.gt('every')}}</span>
                <input type='text' name='interval' class='discreet short'/><span class='help-inline'>{{= it.gt('th month')}}</span>
            </div>
        </div>
    </div>

    <div class='recurrence_details yearly control-group'>
        <div class='controls'>
            <div>
                <input type='radio' name='yearly_option' value='one'>
                <span class='help-inline'>{{= it.gt('Every')}}</span>
                <input type='text' name='day_in_month' class='short'/>
                <span class='help-inline'>{{= it.gt('th')}}</span>
                <select name='month' class='month'>
                    <option value='0'>{{= it.gt('January')}}</option>
                    <option value='1'>{{= it.gt('February')}}</option>
                    <option value='2'>{{= it.gt('March')}}</option>
                    <option value='3'>{{= it.gt('April')}}</option>
                    <option value='4'>{{= it.gt('Mai')}}</option>
                    <option value='5'>{{= it.gt('June')}}</option>
                    <option value='6'>{{= it.gt('July')}}</option>
                    <option value='7'>{{= it.gt('August')}}</option>
                    <option value='8'>{{= it.gt('September')}}</option>
                    <option value='9'>{{= it.gt('October')}}</option>
                    <option value='10'>{{= it.gt('November')}}</option>
                    <option value='11'>{{= it.gt('December')}}</option>
                </select>
            </div>
            <div>
                <input type='radio' name='yearly_option' value='two'>
                <span class='help-inline'>{{= it.gt('at')}}</span>
                <select name='day_in_month'>
                    <option value='1'>{{= it.gt('First')}}</option>
                    <option value='2'>{{= it.gt('Second')}}</option>
                    <option value='3'>{{= it.gt('Third')}}</option>
                    <option value='4'>{{= it.gt('Fourth')}}</option>
                    <option value='5'>{{= it.gt('Last')}}</option>
                </select>
                <select name='days' class='days'>
                    <option value='{{= it.daybits.DAYS_MONDAY }}'>{{= it.gt('Monday')}}</option>
                    <option value='{{= it.daybits.DAYS_TUESDAY }}'>{{= it.gt('Tuesday')}}</option>
                    <option value='{{= it.daybits.DAYS_WEDNESDAY }}'>{{= it.gt('Wednesday')}}</option>
                    <option value='{{= it.daybits.DAYS_THURSDAY }}'>{{= it.gt('Thursday')}}</option>
                    <option value='{{= it.daybits.DAYS_FRIDAY }}'>{{= it.gt('Friday')}}</option>
                    <option value='{{= it.daybits.DAYS_SATURDAY }}'>{{= it.gt('Saturday')}}</option>
                    <option value='{{= it.daybits.DAYS_SUNDAY }}'>{{= it.gt('Sunday')}}</option>
                </select>
                <span class='help-inline'>{{= it.gt('in')}}</span>
                <select name='month' class='month'>
                    <option value='0'>{{= it.gt('January')}}</option>
                    <option value='1'>{{= it.gt('February')}}</option>
                    <option value='2'>{{= it.gt('March')}}</option>
                    <option value='3'>{{= it.gt('April')}}</option>
                    <option value='4'>{{= it.gt('Mai')}}</option>
                    <option value='5'>{{= it.gt('June')}}</option>
                    <option value='6'>{{= it.gt('July')}}</option>
                    <option value='7'>{{= it.gt('August')}}</option>
                    <option value='8'>{{= it.gt('September')}}</option>
                    <option value='9'>{{= it.gt('October')}}</option>
                    <option value='10'>{{= it.gt('November')}}</option>
                    <option value='11'>{{= it.gt('December')}}</option>
                </select>
            </div>
        </div>
    </div>
</div>
<div class='control-group' style='margin-top: 20px;'>
    <div class='controls tablerow'>
        <div class="left">
            <label for="{{=it.uid}}_recurrence_start">{{= it.gt('Starts on')}}</label>
            <input id="{{=it.uid}}_recurrence_start" type="text" class="discreet startsat-date" name='recurrence_start'/>
        </div>
        <div class="right">
            <label for="{{=it.uid}}_recurrence_endings">{{= it.gt('Ends')}}</label>
            <input id="{{=it.uid}}_recurrence_endings" type="radio" name='endingoption'/><span class='help-inline'>{{= it.gt('on') }}</span>
            <input type="text" class="discreet until" name='until'/>
            <br />
            <input type="radio" name='endingoption'/><span class='help-inline'>{{= it.gt('after') }}</span>
            <input type="text" class="discreet until short" name='occurrences'/>
            <span class="help-inline">{{= it.gt('times')}}</span>
            <br />
            <input type="radio" name='endingoption'/><span style='margin-left: 4px;'>
            <span class="help-inline">{{= it.gt('Never') }}</span>
        </div>
    </div>
</div>
