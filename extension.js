const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Soup = imports.gi.Soup;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const DefaultFolder = GLib.build_filenamev([
  global.userdatadir,
  "extensions/handyscripts2@lucaskenda.com.ar",
]);

const SCHEMA = "org.gnome.shell.extensions.handyscripts2";
const SCRIPTS_BUTTON_SHOW = "scripts-button-show";
const KEEP_TERMINAL_ALIVE = "keep-terminal-alive";
const SCRIPTS_DEFAULT_PATH_ENABLEDISABLE = "scripts-default-path-enabled";
const SCRIPTS_FOLDER_PATH = "scripts-folder-path";
const BASH_COMMMAND = "bash-command";
const PYTHON_COMMMAND = "python-command";
const TERMINAL_COMMAND = "terminal-command";
const FILE_MANAGER = "file-manager";

function compare(a, b) {
  if (a.name > b.name) return 1;
  if (b.name > a.name) return -1;
  return 0;
}

// Status menu
const Menu = new Lang.Class({
  Name: "Menu.Menu",
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(1, "MainPopupMenu", false);

    this._settings = Convenience.getSettings(SCHEMA);

    let box = new St.BoxLayout();
    let icon = new St.Icon({
      icon_name: "utilities-terminal-symbolic",
      style_class: "system-status-icon",
    });
    let toplabel = new St.Label({
      text: "",
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
    });

    box.add(icon);
    box.add(toplabel);

    this.actor.add_child(box);
    this.actor.connect(
      "button_press_event",
      Lang.bind(this, this._refreshMenu)
    );

    this._renderMenu();
  },

  _executeScript: function (fileName) {
    let bashCommand = this._settings.get_string(BASH_COMMMAND);
    let pythonCommand = this._settings.get_string(PYTHON_COMMMAND);
    let terminalCommand = this._settings.get_string(TERMINAL_COMMAND);
    let keepTerminalAlive = this._settings.get_boolean(KEEP_TERMINAL_ALIVE);
    let sleepCommand = "sleep 2";

    // If keep alive is true then execute sleep infinity.
    if (keepTerminalAlive == true) {
      sleepCommand = "sleep infinity";
    }

    try {
      if (fileName.endsWith(".py") || fileName.endsWith(".pyw")) {
        // Python
        Util.trySpawnCommandLine(
          terminalCommand +
            ' sh -c "' +
            pythonCommand +
            " '" +
            fileName +
            "';" +
            sleepCommand +
            '"'
        );
      } else {
        // Bash
        Util.trySpawnCommandLine(
          terminalCommand +
            ' sh -c "' +
            bashCommand +
            " '" +
            fileName +
            "';" +
            sleepCommand +
            '"'
        );
      }
    } catch (err) {
      Main.notify("Error: " + err);
    }
  },

  _executeTweakAcces: function () {
    try {
      Util.trySpawnCommandLine("gnome-tweaks");
    } catch (err) {
      Main.notify("Error: " + err);
    }
  },

  _openFolder: function () {
    let fileManager = this._settings.get_string(FILE_MANAGER);
    Util.trySpawnCommandLine(fileManager + " '" + this.folder + "'");
  },

  _refreshMenu: function () {
    if (this.menu.isOpen) {
      this.menu.removeAll();
      this._renderMenu();
    }
  },

  _renderMenu: function () {
    let file, fileName;
    let folderArray = [];
    let filesArray = [];
    let isEmpty = true;

    // Check if the folder hast a value.
    if (this._settings.get_string(SCRIPTS_FOLDER_PATH) == "") {
      let popupMenuItem = new PopupMenu.PopupMenuItem(
        "You must configure a folder in GNOME Tweaks!"
      );
      popupMenuItem.connect("activate", this._executeTweakAcces.bind(this));
      this.menu.addMenuItem(popupMenuItem);
    } else {
      this.folder = this._settings.get_string(SCRIPTS_FOLDER_PATH);
      this.folder = this.folder.replace(/\/?$/, "/");

      let dir = Gio.file_new_for_path(this.folder);

      if (dir.query_exists(null)) {
        let files = dir.enumerate_children(
          Gio.FILE_ATTRIBUTE_STANDARD_NAME,
          Gio.FileQueryInfoFlags.NONE,
          null
        );

        while ((file = files.next_file(null))) {
          let fileName = file.get_name();

          // Push folders to array.
          if (file.get_file_type() == Gio.FileType.DIRECTORY) {
            let menu = new PopupMenu.PopupSubMenuMenuItem(fileName, true);
            menu.icon.icon_name = "folder-symbolic";

            folderArray.push({
              name: fileName,
              path: this.folder + fileName,
              submenu: menu,
            });

            isEmpty = false;
          } else {
            // Push first level files to array.
            if (file.get_file_type() == Gio.FileType.REGULAR) {
              if (
                fileName.endsWith(".sh") ||
                fileName.endsWith(".py") ||
                fileName.endsWith(".pyw")
              ) {
                let popupMenuItem = new PopupMenu.PopupImageMenuItem(
                  fileName.split(".")[0],
                  "media-playback-start-symbolic"
                );
                popupMenuItem.connect(
                  "activate",
                  this._executeScript.bind(this, this.folder + fileName)
                );

                filesArray.push({
                  name: fileName,
                  popupMenuItem: popupMenuItem,
                });

                isEmpty = false;
              }
            }
          }
        }

        // Sort first level files.
        filesArray.sort(compare);

        // Sort folders.
        folderArray.sort(compare);

        // For each folder list files that ends with .sh and add them to the menu array.
        for (var i = 0; i < folderArray.length; i++) {
          dir = Gio.file_new_for_path(folderArray[i].path);
          files = dir.enumerate_children(
            Gio.FILE_ATTRIBUTE_STANDARD_NAME,
            Gio.FileQueryInfoFlags.NONE,
            null
          );

          let file;
          let subfilesArray = [];

          while ((file = files.next_file(null))) {
            let fileName = file.get_name();

            if (
              fileName.endsWith(".sh") ||
              fileName.endsWith(".py") ||
              fileName.endsWith(".pyw")
            ) {
              let popupMenuItem = new PopupMenu.PopupImageMenuItem(
                fileName.split(".")[0],
                "media-playback-start-symbolic"
              );
              popupMenuItem.connect(
                "activate",
                this._executeScript.bind(
                  this,
                  folderArray[i].path + "/" + fileName
                )
              );

              subfilesArray.push({
                name: fileName,
                popupMenuItem: popupMenuItem,
              });
            }
          }

          // Sort second level files and show in menu.
          subfilesArray.sort(compare);

          for (let j = 0; j < subfilesArray.length; j++) {
            folderArray[i].submenu.menu.addMenuItem(
              subfilesArray[j].popupMenuItem
            );
          }

          this.menu.addMenuItem(folderArray[i].submenu);
        }

        // Add files to menu.
        for (let i = 0; i < filesArray.length; i++) {
          this.menu.addMenuItem(filesArray[i].popupMenuItem);
        }

        if (isEmpty) {
          // If is empty.
          let Scripts = new PopupMenu.PopupMenuItem("Can't find scripts!");
          this.menu.addMenuItem(Scripts);
        }

        // Scripts Folder menu.
        if (this._settings.get_boolean(SCRIPTS_BUTTON_SHOW) == true) {
          this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
          let Scripts = new PopupMenu.PopupImageMenuItem(
            "Scripts",
            "system-run-symbolic"
          );
          this.menu.addMenuItem(Scripts);
          Scripts.connect("activate", this._openFolder.bind(this));
        }
      } else {
        // If folder does not exists.
        let Scripts = new PopupMenu.PopupMenuItem(
          "Folder path does not exists!"
        );
        this.menu.addMenuItem(Scripts);
      }
    }

    this.actor.show();
  },
});

// Menu variable
let menu;
let settings;

function init() {
  log(`Initializing ${Me.metadata.name} version ${Me.metadata.version}`);
  this._settings = Convenience.getSettings(
    "org.gnome.shell.extensions.handyscripts2"
  );
}

function enable() {
  log(`Enabling ${Me.metadata.name} version ${Me.metadata.version}`);
  menu = new Menu();
  Main.panel.addToStatusArea("handy-scripts2", menu, 0, "right");
}

function disable() {
  log(`Disabling ${Me.metadata.name} version ${Me.metadata.version}`);
  menu.destroy();
}
