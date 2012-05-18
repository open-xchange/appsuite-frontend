<div>
    <div style='width: 20%; float: left; display: inline;'>
        <input type="radio" name="recurrence_type" value="0"/>
        <label style="display: inline;">{{= it.gt('Once') }}</label>
    </div>
    <div style='width: 20%; float: left; display: inline;'>
        <input type="radio" name="recurrence_type" value="1"/>
        <label style="display: inline;">{{= it.gt('Daily') }}</label>
    </div>
    <div style='width: 20%; float: left; display: inline;'>
        <input type="radio" name="recurrence_type" value="2"/>
        <label style="display: inline;">{{= it.gt('Weekly') }}</label>
    </div>
    <div style='width: 20%; float: left; display: inline;'>
        <input type="radio" name="recurrence_type" value="3"/>
        <label style="display: inline;">{{= it.gt('Monthly') }}</label>
    </div>
    <div style='width: 20%; float: left; display: inline;'>
        <input type="radio" name="recurrence_type" value="4"/>
        <label style="display: inline;">{{= it.gt('Yearly') }}</label>
    </div>
</div>
<div style='clear: both; margin: 20px; background-color: grey;'>
    <div class='recurrence_details daily'>
        {{= it.gt('Every') }}
        <input type="text" class="discreet short" name='interval'/>
        {{= it.gt('day') }}
    </div>

    <div class='recurrence_details weekly'>
        {{= it.gt('Every') }}
        <input type="text" class="discreet weeks short"/>
        {{= it.gt('weeks') }}
        <div>
            <input type='checkbox' name='day1'/>
            <label style="display: inline;">{{= it.gt('Monday') }}</label>

            <input type='checkbox' name='day2'/>
            <label style="display: inline;">{{= it.gt('Tuesday') }}</label>

            <input type='checkbox' name='day3'/>
            <label style="display: inline;">{{= it.gt('Wednesday') }}</label>

            <input type='checkbox' name='day4'/>
            <label style="display: inline;">{{= it.gt('Thursday') }}</label>

            <input type='checkbox' name='day5'/>
            <label style="display: inline;">{{= it.gt('Friday') }}</label>

            <input type='checkbox' name='day6'/>
            <label style="display: inline;">{{= it.gt('Saturday') }}</label>

            <input type='checkbox' name='day0'/>
            <label style="display: inline;">{{= it.gt('Sunday') }}</label>
        </div>
    </div>

    <div class='recurrence_details monthly'>
        <div>
            <input type='radio' name='monthlyoption'>
            {{= it.gt('at')}}
            <input type='text' name='day_in_month' class='discreet short'/>
            {{= it.gt('th day every')}}
            <input type='text' name='interval' class='discreet short'/>
            {{= it.gt('th month')}}
        </div>
        <div>
            <input type='radio' name='monthlyoption'>
            {{= it.gt('at')}}
            <select class='sequence'>
                <option>{{= it.gt('First')}}</option>
                <option>{{= it.gt('Second')}}</option>
                <option>{{= it.gt('Third')}}</option>
                <option>{{= it.gt('Fourth')}}</option>
                <option>{{= it.gt('Last')}}</option>
            </select>
            <select name='days' class='days'>
                <option>{{= it.gt('Monday')}}</option>
                <option>{{= it.gt('Tuessday')}}</option>
                <option>{{= it.gt('Wednesday')}}</option>
                <option>{{= it.gt('Thursday')}}</option>
                <option>{{= it.gt('Friday')}}</option>
                <option>{{= it.gt('Saturday')}}</option>
                <option>{{= it.gt('Sunday')}}</option>
            </select>
            {{= it.gt('every')}}
            <input type='text' name='interval' class='discreet short'/> {{= it.gt('th month')}}
        </div>
    </div>

    <div class='recurrence_details yearly'>
        <div>
            <input type='radio' name='yearlyoption'>
            {{= it.gt('Every')}}
            <input type='text' name='day_in_month' class='short'/>
            {{= it.gt('th')}}
            <select name='month' class='months'>
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
            <input type='radio' name='yearlyoption'>
            {{= it.gt('at')}}
            <select class='sequence'>
                <option>{{= it.gt('First')}}</option>
                <option>{{= it.gt('Second')}}</option>
                <option>{{= it.gt('Third')}}</option>
                <option>{{= it.gt('Fourth')}}</option>
                <option>{{= it.gt('Last')}}</option>
            </select>
            <select name='days' class='days'>
                <option>{{= it.gt('Monday')}}</option>
                <option>{{= it.gt('Tuessday')}}</option>
                <option>{{= it.gt('Wednesday')}}</option>
                <option>{{= it.gt('Thursday')}}</option>
                <option>{{= it.gt('Friday')}}</option>
                <option>{{= it.gt('Saturday')}}</option>
                <option>{{= it.gt('Sunday')}}</option>
            </select>
            {{= it.gt('in')}}
            <select name='month' class='months'>
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
<div style='clear: both;'>
    <div class="left">
        <label>{{= it.gt('Starts on')}}</label>
        <input type="text" class="discreet startsat-date" name='recurrence_start'/>
    </div>
    <div class="right">
        <label>{{= it.gt('Ends')}}</label>
        <input type="checkbox" /><span style='margin-left: 4px;'>{{= it.gt('on') }}</span>
        <input type="text" class="discreet until" name='until'/>
    </div>
</div>
