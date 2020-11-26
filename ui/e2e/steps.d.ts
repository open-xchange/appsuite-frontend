/// <reference types='codeceptjs' />
type steps_file = typeof import('./actor');
type users = typeof import('./users');
type contexts = typeof import('./contexts');
type contacts = typeof import('./pageobjects/contacts');
type calendar = typeof import('./pageobjects/calendar');
type chat = typeof import('./pageobjects/chat');
type mail = typeof import('./pageobjects/mail');
type portal = typeof import('./pageobjects/portal');
type drive = typeof import('./pageobjects/drive');
type settings = typeof import('./pageobjects/settings');
type tasks = typeof import('./pageobjects/tasks');
type dialogs = typeof import('./pageobjects/dialogs');
type autocomplete = typeof import('./widgetobjects/contact-autocomplete');
type contactpicker = typeof import('./widgetobjects/contact-picker');
type mailfilter = typeof import('./widgetobjects/settings-mailfilter');
type search = typeof import('./widgetobjects/search');
type toolbar = typeof import('./widgetobjects/toolbar');
type OpenXchange = import('./helper');

declare namespace CodeceptJS {
  interface SupportObject { I: CodeceptJS.I, users: users, contexts: contexts, contacts: contacts, calendar: calendar, mail: mail, portal: portal, drive: drive, settings: settings, tasks: tasks, dialogs: dialogs, autocomplete: autocomplete, contactpicker: contactpicker, mailfilter: mailfilter, search: search, toolbar: toolbar, chat: chat }
  interface CallbackOrder { [0]: CodeceptJS.I; [1]: users; [2]: contexts; [3]: contacts; [4]: calendar; [5]: mail; [6]: portal; [7]: drive; [8]: settings; [9]: tasks; [10]: dialogs; [11]: autocomplete; [12]: contactpicker; [13]: mailfilter; [14]: search; [15]: toolbar; [16]: chat }
  interface Methods extends CodeceptJS.Puppeteer, OpenXchange {}
  interface I extends ReturnType<steps_file> {}
  namespace Translation {
    interface Actions {}
  }
}
