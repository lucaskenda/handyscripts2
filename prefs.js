const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Gio = imports.gi.Gio;

const Gettext = imports.gettext.domain("handyscripts2");
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const SCHEMA = "org.gnome.shell.extensions.handyscripts2";
const SCRIPTS_BUTTON_SHOW = "scripts-button-show";
const KEEP_TERMINAL_ALIVE = "keep-terminal-alive";
const SCRIPTS_FOLDER_PATH = "scripts-folder-path";
const BASH_COMMMAND = "bash-command";
const PYTHON_COMMMAND = "python-command";
const TERMINAL_COMMAND = "terminal-command";
const FILE_MANAGER = "file-manager";

const ScriptsDir = "scripts";

let settings;

function init() {
  settings = Convenience.getSettings(SCHEMA);
  Convenience.initTranslations("handyscripts2");
}

function buildPrefsWidget() {
  let frame = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    border_width: 10,
    margin: 20,
  });

  frame.set_spacing(10);

  let showScriptsButtonInMenuToggle = _createCheckBox(
    SCRIPTS_BUTTON_SHOW,
    _("Scripts folder link in menu"),
    _("Enable/Disable default Scripts folder path.")
  );

  let keepTerminalAliveToggle = _createCheckBox(
    KEEP_TERMINAL_ALIVE,
    _("Keep terminal alive when script ends"),
    _("Enable/Disable pause command to keep the script terminal alive.")
  );

  let scriptFolderEntry = _createEntry(
    SCRIPTS_FOLDER_PATH,
    _("Scripts folder path"),
    _("Path where are located the scripts."),
    "",
    true
  );

  let fileManagerEntry = _createEntry(
    FILE_MANAGER,
    _("File manager"),
    _("Command to execute file manager."),
    "",
    true
  );

  let terminalCommandEntry = _createEntry(
    TERMINAL_COMMAND,
    _("Terminal"),
    _("Terminal to execute the script."),
    "",
    true
  );

  let bashCommandEntry = _createEntry(
    BASH_COMMMAND,
    _("Bash command"),
    _("Command to execute bash scripts."),
    "",
    true
  );

  let pythonCommandEntry = _createEntry(
    PYTHON_COMMMAND,
    _("Python command"),
    _("Command to execute Python scripts."),
    "",
    true
  );

  frame.add(showScriptsButtonInMenuToggle);
  frame.add(keepTerminalAliveToggle);
  frame.add(scriptFolderEntry);
  frame.add(fileManagerEntry);
  frame.add(terminalCommandEntry);
  frame.add(bashCommandEntry);
  frame.add(pythonCommandEntry);
  frame.show_all();

  return frame;
}

function _createCheckBox(key, text, tooltip) {
  let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
  let widget = new Gtk.Switch({ active: settings.get_boolean(key) });

  widget.connect("notify::active", function (switch_widget) {
    settings.set_boolean(key, switch_widget.active);
  });

  box.pack_start(label, true, true, 0);
  box.add(widget);

  return box;
}

function _createLabel(text, tooltip) {
  let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
  return label;
}

function _createComboBox(key, text, tooltip, values) {
  let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
  let widget = new Gtk.ComboBoxText();

  Object.keys(values).forEach(function (i) {
    widget.append(i, values[i]);
  });

  widget.set_active_id(settings.get_string(key));
  widget.connect("changed", function (combo_widget) {
    settings.set_string(key, combo_widget.get_active_id());
  });

  box.pack_start(label, true, true, 0);
  box.add(widget);

  return box;
}

function _createButton(text, tooltip) {
  let widget = new Gtk.Button({ label: text });
  return widget;
}

function _createEntry(key, text, tooltip, placeholder, setVisibility) {
  let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
  let widget = new Gtk.Entry();

  widget.set_placeholder_text(placeholder);
  widget.set_visibility(setVisibility);
  widget.text = settings.get_string(key);
  widget.connect("changed", function () {
    settings.set_string(key, widget.get_text());
  });
  widget.set_width_chars(40);

  box.pack_start(label, true, true, 0);
  box.add(widget);

  return box;
}
