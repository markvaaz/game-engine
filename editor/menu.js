import state from "./editor-state.js";
import { shell } from "electron";
import about from "./menu/about.js"

const menu = [
  {
    label: "File",
    submenu: [
      {
        label: "Open",
        accelerator: "CmdOrCtrl + O",
        click: () => {
          
        }
      },
      {
        label: "Save",
        accelerator: "CmdOrCtrl + S",
        click: () => {
          
        }
      },
      {
        label: "Projects"
      },
      { type: 'separator' },
      {
        label: "Import",
        accelerator: "CmdOrCtrl + I",
        click: () => {
          
        }
      },
      {
        label: "Export as...",
        submenu: [
          {
            label: "Project",
            click: () => {
              
            }
          },
          {
            label: "Full game",
            click: () => {
              
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: "Exit",
        click: () => {
          
        }
      }
    ]
  },
  {
    label: "Edit",
    submenu: [
      {
        label: "Undo",
        accelerator: "CmdOrCtrl + Z",
        click: () => {
          
        }
      },
      {
        label: "Redo",
        accelerator: "CmdOrCtrl + Shift + Z",
        click: () => {
          
        }
      }
    ]
  },
  {
    label: "Insert",
    submenu: []
  },
  {
    label: "Help",
    submenu: [
      {
        label: "Documentation",
        click: () => {
          // open in browser
          shell.openExternal('https://github.com/markvaaz/game-engine')
        }
      },
      {
        label: "About",
        click: about
      }
    ]
  }
]

export default menu;