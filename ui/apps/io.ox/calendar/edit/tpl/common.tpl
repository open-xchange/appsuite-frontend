
<div class='section'>
    <label for='title'>{{= it.gt('Subject') }}</label>
    <input type='text' class='discreet title' name='title' />

    <label for='location'>{{= it.gt('Location') }}</label>
    <input type='text' class='discreet location' name='location' />

    <a class="btn btn-primary save">Save</a>
</div>

<div class="section">
    <div class="left">
        <label>{{= it.gt('Start on') }}</label>
        <input type='date' class='discreet startsat-date' />
        <input type='time' class='discreet startsat-time' />
        <span class="label" data-original-title="">CEST</span>
    </div>
    <div class="right">
        <label>{{= it.gt('Ends on') }}</label>
        <input type='date' class='discreet endsat-date' />
        <input type='time' class='discreet endsat-time' />
        <span class="label" data-original-title="">CEST</span>
    </div>
</div>

<div class="section">
    <div class="left">
        <input type='checkbox' class='full_time' name='full_time'/>
        <label style='display: inline;'>{{= it.gt('All day') }}</label>
        <div />
        <input type='checkbox' class='repeat' name='repeat'/>
        <label style='display: inline;'>{{= it.gt('Repeat') }}:<span name='recurrenceText'></span></label>
        </div>
    <div class="right">
        <div style='text-align: right;'>
          <a class="inline edittimezone">{{= it.gt('Change Timezone') }}</a>
          <a class="inline editrecurrence">{{= it.gt('edit') }}</a>
        </div>
    </div>
</div>

<div class="section recurrence">

</div>



<div class="section">
    <label>{{= it.gt('Description') }}</label>
    <textarea class='note' name='note'></textarea>
</div>

<div class="section">
    <div style='width: 33%; float: left;'>
        <label>{{= it.gt('Reminder')}}</label>
        <select name='alarm'>
            <option value='-1'>{{= it.gt('no reminder') }}</option>

            <option value='0'>{{= it.gt('0 minutes') }}</option>
            <option value='15'>{{= it.gt('15 minutes') }}</option>
            <option value='30'>{{= it.gt('30 minutes') }}</option>
            <option value='45'>{{= it.gt('45 minutes') }}</option>
            <option value='60'>{{= it.gt('1 hour') }}</option>
            <option value='120'>{{= it.gt('2 hours') }}</option>
            <option value='240'>{{= it.gt('4 hours') }}</option>
            <option value='360'>{{= it.gt('6 hours') }}</option>
            <option value='420'>{{= it.gt('8 hours') }}</option>
            <option value='720'>{{= it.gt('12 hours') }}</option>
            <option value='1440'>{{= it.gt('1 day') }}</option>
            <option value='2880'>{{= it.gt('2 days') }}</option>
            <option value='4320'>{{= it.gt('3 days') }}</option>
            <option value='5760'>{{= it.gt('4 days') }}</option>
            <option value='7200'>{{= it.gt('5 days') }}</option>
            <option value='8640'>{{= it.gt('6 days') }}</option>
            <option value='10080'>{{= it.gt('1 week') }}</option>
            <option value='20160'>{{= it.gt('2 weeks') }}</option>
            <option value='30240'>{{= it.gt('3 weeks') }}</option>
            <option value='40320'>{{= it.gt('4 weeks') }}</option>
        </select>
    </div>
    <div style='width: 33%; float: left;'>
        <label>{{= it.gt('Display as')}}</label>
        <select name='shown_as'>
            <option value='1'>{{= it.gt('reserved') }}</option>
            <option value='2'>{{= it.gt('temporary') }}</option>
            <option value='3'>{{= it.gt('absent') }}</option>
            <option value='4'>{{= it.gt('free') }}</option>
        </select>
    </div>
    <div style='width: 33%; float: left;'>
        <label>{{= it.gt('Type')}}</label>
        <input type='checkbox' name='private_flag'><span style='margin-left:4px;'>Private</span>
    </div>
</div>

<div class="section">
    <div class="sectionhead">
        <div class="left">
            {{= it.gt('Participants')}}
        </div>
        <div class="right">
            <div style='text-align: right;'>
                <input type='checkbox' name='notification'/>
                <label style='display:inline;'>{{= it.gt('Notify all')}}</label>
            </div>
        </div>
    </div>
    <div style='clear:both;' id='participantsView'/>

    <div>

    </div>
</div>
