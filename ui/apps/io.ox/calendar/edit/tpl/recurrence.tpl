<fieldset class="tablerow">
    <legend class="sectiontitle">Legend text</legend>
    <div class="left">
        <div class="control-group">
            <label for="{{=it.uid}}_recurrence_start" class="control-label">{{= it.strings.STARTS_ON }}</label>
            <div class="controls">
                <input id="{{=it.uid}}_recurrence_start" type="text" class="discreet startsat-date" name='recurrence_start'/>
            </div>
        </div>
    </div>
    <div class="right">
        <div class="control-group">
            <label for="{{=it.uid}}_recurrence_endings" class="control-label">{{= it.strings.ENDS }}</label>
            <div class="controls">
                <div>
                    <input type="radio" name='endingoption'/>
                    <label class="radio inline">{{= it.strings.NEVER }}</label>
                </div>
                <div>
                    <input id="{{=it.uid}}_recurrence_endings" type="radio" name='endingoption'/>
                    <label class="radio inline">
                       {{= it.strings.ON }}
                       <input type="text" class="discreet until" name='until'/>
                    </label>
                </div>
                <div>
                    <input type="radio" name='endingoption'/>
                    <label class="radio inline">
                        {{= it.strings.AFTER }}
                        <input type="text" class="discreet until short" name='occurrences'/>
                        <span class="help-inline">{{= it.strings.TIMES }}</span>
                    </label>
                </div>
            </div>
        </div>
    </div>
</fieldset>

<div class='control-group'>
    <legend class="sectiontitle">Legend text</legend>
    <div class='controls tablerow'>
        <div style='width: 200px;' class="tablecell">
            <input type="radio" name="recurrence_type" value="1" id="{{=it.uid}}_daily"/>
            <label style="display: inline;" for="{{=it.uid}}_daily">{{= it.strings.DAILY }}</label>
        </div>
        <div style='width: 200px;' class="tablecell">
            <input type="radio" name="recurrence_type" value="2" id="{{=it.uid}}_weekly"/>
            <label style="display: inline;" for="{{=it.uid}}_weekly">{{= it.strings.WEEKLY }}</label>
        </div>
        <div style='width: 200px;' class="tablecell">
            <input type="radio" name="recurrence_type" value="3" id="{{=it.uid}}_monthly"/>
            <label style="display: inline;" for="{{=it.uid}}_monthly">{{= it.strings.MONTHLY }}</label>
        </div>
        <div style='width: 200px;' class="tablecell">
            <input type="radio" name="recurrence_type" value="4" id="{{=it.uid}}_yearly"/>
            <label style="display: inline;" for="{{=it.uid}}_yearly">{{= it.strings.YEARLY }}</label>
        </div>
    </div>
</div>

<div>
    <div class='recurrence_details daily control-group'>
        <legend class="sectiontitle">Legend text</legend>
        <div class="controls">
            <label for="{{=it.uid}}_daily_interval">{{= it.strings.EVERY }}</label>
            <input type="text" class="discreet short" name='interval' id="{{=it.uid}}_daily_interval"/>
            <span class="help-inline">{{= it.strings.DAY }}</span>
        </div>
    </div>

    <div class='recurrence_details weekly control-group'>
        <legend class="sectiontitle">Legend text</legend>
        <div class="controls">
            <label for="{{=it.uid}}_weekly_interval">{{= it.strings.EVERY }}</label>
            <input type="text" name='interval' class="discreet weeks short" id="{{=it.uid}}_weekly_interval"/>
            <span class="help-inline">{{= it.strings.WEEKS }}</span>
            <div>
                {{~ it.weekDayList :item:index }}
                <input type='checkbox' name='day{{= item.value }}' id="{{=it.uid}}_weekly_days_monday"/>
                <label style="display: inline;" for="{{=it.uid}}_weekly_days_monday">{{= item.label }}</label>
                {{~}}
            </div>
        </div>
    </div>

    <div class='recurrence_details monthly control-group'>
            <legend class="sectiontitle">Legend text</legend>
            <div class="controls">
                <div>
                    <input type='radio' name='monthly_option' value='one'>
                    <span class='help-inline'>{{= it.strings.AT }}</span>
                    <input type='text' name='day_in_month' class='discreet short'/>
                    <span class='help-inline'>{{= it.strings.TH_DAY_EVERY }}</span>
                    <input type='text' name='interval' class='discreet short'/>
                    <span class='help-inline'>{{= it.strings.TH_MONTH }}</div>
                </div>
                <div>
                    <input type='radio' name='monthly_option' value='two'>
                    <span class='help-inline'>{{= it.strings.AT }}</span>
                    <select name='day_in_month'>
                        <option value='1'>{{= it.strings.FIRST }}</option>
                        <option value='2'>{{= it.strings.SECOND }}</option>
                        <option value='3'>{{= it.strings.THIRD }}</option>
                        <option value='4'>{{= it.strings.FOURTH }}</option>
                        <option value='5'>{{= it.strings.LAST }}</option>
                    </select>
                    <select name='days' class='days'>
                        {{~it.weekDayList :item:index }}
                        <option value='{{= item.value }}'>{{= item.label }}</option>
                        {{~}}
                    </select>
                    <span class='help-inline'>{{= it.strings.EVERY }}</span>
                    <input type='text' name='interval' class='discreet short'/><span class='help-inline'>{{= it.strings.TH_MONTH }}</span>
                </div>
            </div>
    </div>

    <div class='recurrence_details yearly control-group'>
        <legend class="sectiontitle">Legend text</legend>
        <div class='controls'>
            <div>
                <input type='radio' name='yearly_option' value='one'>
                <span class='help-inline'>{{= it.strings.EVERY }}</span>
                <input type='text' name='day_in_month' class='short'/>
                <span class='help-inline'>{{= it.strings.TH }}</span>
                <select name='month' class='month'>
                    {{~ it.monthList :item:index }}
                    <option value='{{= item.value }}'>{{= item.label }}</option>
                    {{~}}
                </select>
            </div>
            <div>
                <input type='radio' name='yearly_option' value='two'>
                <span class='help-inline'>{{= it.strings.AT }}</span>
                <select name='day_in_month'>
                    <option value='1'>{{= it.strings.FIRST }}</option>
                    <option value='2'>{{= it.strings.SECOND }}</option>
                    <option value='3'>{{= it.strings.THIRD }}</option>
                    <option value='4'>{{= it.strings.FOURTH }}</option>
                    <option value='5'>{{= it.strings.LAST }}</option>
                </select>
                <select name='days' class='days'>
                    {{~ it.weekDayList :item:index }}
                    <option value='{{= item.value }}'>{{= item.label }}</option>
                    {{~}}
                </select>
                <span class='help-inline'>{{= it.strings.IN }}</span>
                <select name='month' class='month'>
                    {{~ it.monthList :item:index }}
                    <option value='{{= item.value }}'>{{= item.label }}</option>
                    {{~}}
                </select>
            </div>
        </div>
    </div>
</div>

