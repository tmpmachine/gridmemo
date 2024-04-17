let appUID = 'app-MjU1MTUyNjA';
let pipWindow;

let app = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    Init,
    save,
    BackupToCloud,
    RestoreFromCloud,
    GetDataManager,
    
    TaskExportDataToFile,
    TaskExportDataToBlob,
    TaskClearData,
    TaskImportDataFromFile,
    TaskImportDataFromJSON,
    
    Log,
  };
  
  // db config
  // todo: remove duplicate definitions in notes component
  const DB_NAME = 'app-MjU1MTUyNjA-db';
  const DB_VERSION = 1;
  
  function save() {
    saveNotes();
  }
  
  async function TaskExportDataToFile() {
    let blob = await TaskExportDataToBlob();
    if (!blob) return;
    
    let el = document.createElement('a');
    let url = URL.createObjectURL(blob);
    el.href = url;
    el.download = 'gridmemo-backup-' + new Date().getTime();
    el.onclick = function() {
      el.remove();
    };
    document.body.append(el);
    el.click();
  }
  
  async function TaskClearData() {
    return new Promise(async resolve => {
      
	    if (!window.confirm('Are you sure?')) {
	      resolve(false);
	      return;
	    }
	    
      let db = new Dexie(DB_NAME);
      
      db.delete().then(() => {
	      appData.Reset();
        alert('Data cleared successfully.');
      }).catch(error => {
        console.log(error);
        alert('Failed. Check console.');
      });
      
    });
  }
  
  
  async function TaskImportDataFromFile() {
    
    let input = document.createElement('input');
    input.type ='file';
    input.accept ='.json';
    input.onchange = function() {
      this.files[0].text().then(async data => {
        TaskImportDataFromJSON(data);
      });
      input.remove();
    };
    input.onclick = function() {
      input.remove();
    };
    document.body.append(input);
    input.click();
      
  }
  
  async function TaskImportDataFromJSON(json) {
    let d = JSON.parse(json);
    
    // import labels
    for (let item of d.dbData.data.data) {
      if (item.tableName == 'notes') {
        for (let d of item.rows) {
          let result = await compoNotes.UpdateAsync(d);
        }
      } 
    }
    
    // import workspaces
    appData.SetWorkspace(d.storageData.workspaces);
    appData.SetComponentData('compoTabManager', d.storageData.components.compoTabManager);
    appData.Save();
  }
  
  async function TaskExportDataToBlob() {
    
    let dbBlob = await taskExportDbToBlob();
    
    let mergedData = await new Promise(resolve => {
      
      let reader = new FileReader();
      reader.onload = async function(evt) {
        
        try {
          let mergedData = {
            dbData: JSON.parse(reader.result),
            storageData: appData.GetDataCopy(),
          };
          resolve(mergedData);
        } catch (e) {
          console.log(e);
          resolve(null);
        }
        
      };
      reader.readAsText(dbBlob);
      
    });
    
    if (mergedData == null) {
      alert('Failed');
      return;
    }
    
    let blob = new Blob([JSON.stringify(mergedData)], { type: 'application/json' });
    return blob;
  }
  
  async function taskExportDbToBlob() {
    let db = new Dexie(DB_NAME);
    
    // db.version(DB_VERSION).stores({
    //   notes: 'notes', // Define your object store structure
    // });
    
    await db.open()
    let options = { prettyJson: true }; // Customize export options as needed
    let blob = await DexieExportImport.exportDB(db, options);
    return blob;
  }
  
  function GetDataManager() {
    return appData.Get();
  }
  
  function BackupToCloud() {
    compoBackup.TaskBackupAndUploadToCloud();
  }
  
  function RestoreFromCloud() {
    compoBackup.TaskRestore();
  }
  
  function Init() {
    // init components data
    compoWorkspace.InitData(appData.GetWorkspace());
    appData.GetComponentData('compoGsi', (data) => compoGsi.InitData(data) );
    appData.GetComponentData('compoTabManager', (data) => compoTabManager.Init(data) );

    ui.Init();
  }
  
  function Log(message) {
    $('#container-debug-log').innerHTML += `\n${message}`;
  }
  
  return SELF;
  
})();


let pipNoteEl;

function waitUntil(checkFunc) {
    return new Promise(resolve => {
      let interval = window.setInterval(() => {
        if (checkFunc()) {
            window.clearInterval(interval);
            resolve();
        }
      }, 1);
    });
}

async function openPiPNote() {
    
  let $ = document.querySelector.bind(document);
    
  if (!$('.active')) return;
    
  if (pipWindow) {
    pipWindow.close();
    await waitUntil(() => {
      return (pipWindow === null);
    });
  }
  
  pipNoteEl = $('.active');
  // const player = document.querySelector("#container-editor");
  
  // Open a Picture-in-Picture window.
  let presetWidth = pipNoteEl.querySelector('textarea').dataset.windowWidth;
  let presetHeight = pipNoteEl.querySelector('textarea').dataset.windowHeight;

  pipWindow = await documentPictureInPicture.requestWindow({
    width: presetWidth ? parseInt(presetWidth) : parseInt('350'),
    height: presetHeight ? parseInt(presetHeight) : parseInt('400'),
  });
  
  // Copy style sheets over from the initial document
  // so that the player looks the same.
  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
      const style = document.createElement('style');
  
      style.textContent = cssRules;
      pipWindow.document.head.appendChild(style);
    } catch (e) {
      const link = document.createElement('link');
  
      link.rel = 'stylesheet';
      link.type = styleSheet.type;
      link.media = styleSheet.media;
      link.href = styleSheet.href;
      pipWindow.document.head.appendChild(link);
      
    }
  });
  
  pipWindow.addEventListener("pagehide", (event) => {
    const playerContainer = document.querySelector('#container-editor-hidden');
    const pipPlayer = event.target.querySelector("#container-editor");
    playerContainer.append(pipPlayer);

    pipNoteEl.parentElement.classList.remove('pip');

    let pipTextarea = pipNoteEl.querySelector('textarea');
    pipTextarea.dataset.windowWidth = event.currentTarget.outerWidth;
    pipTextarea.dataset.windowHeight = event.currentTarget.outerHeight;

    pipTextarea.value = editor.getValue();
    
    pipTextarea.tempData = {
      editorSesionCustomFoldData: editor.session.getAllFolds().map(x => {
        return {
          placeholder: x.placeholder,
          foldRange: JSON.parse(JSON.stringify(x.range)),
        };
      }),
    };
    
    let js = ace.createEditSession('');
    editor.setSession(js);
    
        
    document.body.append(document.querySelector('#notif'));
    pipWindow = null;
  });
  
  // Move the player to the Picture-in-Picture window.
  let editorEl = document.querySelector('#container-editor');
  pipWindow.document.body.append(editorEl);
  editorEl.append(document.querySelector('#notif'));
  
  let pipTextarea = pipNoteEl.querySelector('textarea');
  let js = ace.createEditSession(pipTextarea.value);
  
  editor.setSession(js);
  // restore folds session
  if (pipTextarea.tempData?.editorSesionCustomFoldData != null) {
    for (let item of pipTextarea.tempData?.editorSesionCustomFoldData) {
      editor.session.addFold(item.placeholder, createAceRange(item.foldRange));
    }
  }
  editor.session.setUseWrapMode(_isWrapMode);
  editor.session.setMode("ace/mode/markdown");
  
  pipNoteEl.parentElement.classList.add('pip');
  
  // initPiPEditor();
} 

function createAceRange(positions) {
  let Range = ace.Range;

  if (!positions || !positions.start || !positions.end) {
      throw new Error('Invalid positions object. Requires start and end properties.');
  }

  let start = positions.start;
  let end = positions.end;

  return new Range(start.row, start.column, end.row, end.column);
}


let editor;
let _isWrapMode = true;

function initPiPEditor() {
  editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/markdown");
  editor.session.setUseWrapMode(_isWrapMode);
  editor.setOption("scrollPastEnd", 1);
    
  if (localStorage.getItem('MjA3MzcwNjI-pipnote-default')) {
    var sessionText = ace.createEditSession(localStorage.getItem('MjA3MzcwNjI-pipnote-default'));
    editor.setSession(sessionText);
  } 
  
  // pip window
  editor.commands.addCommand({
    name: "custom-cmd-open-pip-window",
    bindKey: {win:"Alt-P"},
    exec: function() {
      openApp();
    }
  });
  
  // save editor data
  editor.commands.addCommand({
    name: "save",
    bindKey: {win:"Ctrl-S"},
    exec: function() {
      event.preventDefault();
        
      saveNotes()
      
      // localStorage.setItem('MjA3MzcwNjI-pipnote-default', editor.getValue());
      notifikasi.pop('Saved');
    }
  });
  
  // save editor data
  editor.commands.addCommand({
    name: "custom-cmd-toggle-wrap",
    bindKey: {win:"Alt-Z"},
    exec: function() {
      _isWrapMode = !editor.session.getUseWrapMode();
      editor.session.setUseWrapMode(_isWrapMode);
    }
  });
    
    
  editor.commands.addCommand({
    name: "movelinesup",
    bindKey: {win:"Ctrl-Shift-Up"},
    exec: function(editor) {
      editor.moveLinesUp();
    }
  });
  editor.commands.addCommand({
    name: "movelinesdown",
    bindKey: {win:"Ctrl-Shift-Down"},
    exec: function(editor) {
      editor.moveLinesDown();
    }
  });
  editor.commands.addCommand({
    name: "select-or-more-after",
    bindKey: {win:"Ctrl-D"},
    exec: function(editor) {
      if (editor.selection.isEmpty()) {
        editor.selection.selectWord();
      } else {
        editor.execCommand("selectMoreAfter");
      }
    }
  });
  editor.commands.addCommand({
    name: "removeline",
    bindKey: {win: "Ctrl-Shift-K"},
    exec: function(editor) {
      editor.removeLines();
    }
  });
  
  editor.commands.addCommand({
    name: "custom-copy",
    bindKey: {win: "Ctrl-C"},
    exec: function(editor) {
      let selection = editor.getSelectionRange();
      if (selection.start.row == selection.end.row && selection.start.column == selection.end.column) {
        let row = selection.start.row;
        let col = selection.start.column;
        editor.selection.setSelectionRange({start:{row,column:0},end:{row:row+1,column:0}});
        if (pipWindow) {
          pipWindow.document.execCommand('copy');
        } else {
          document.execCommand('copy');
        }
        editor.clearSelection();
        editor.moveCursorTo(row, col);
      } else {
        if (pipWindow) {
          pipWindow.document.execCommand('copy');
        } else {
          document.execCommand('copy');
        }
      }
    }
  });
  
  editor.commands.addCommand({
    name: "custom-cut",
    bindKey: {win: "Ctrl-X"},
    exec: function(editor) {
      let selection = editor.getSelectionRange();
      if (selection.start.row == selection.end.row && selection.start.column == selection.end.column) {
        let row = selection.start.row;
        editor.selection.setSelectionRange({start:{row,column:0},end:{row:row+1,column:0}});
        if (pipWindow) {
          pipWindow.document.execCommand('cut');
        } else {
          document.execCommand('cut');
        }
      } else {
        if (pipWindow) {
          pipWindow.document.execCommand('cut');
        } else {
          document.execCommand('cut');
        }
      }
    }
  });
  
}

function saveNotes() {
  if (pipWindow && pipNoteEl) {
    
    let pipTextarea = pipNoteEl.querySelector('textarea');
    
    pipTextarea.value = editor.getValue();
    pipTextarea.dataset.windowWidth = pipWindow.outerWidth;
    pipTextarea.dataset.windowHeight = pipWindow.outerHeight;
    pipTextarea.tempData = {
      editorSesionCustomFoldData: editor.session.getAllFolds().map(x => {
        return {
          placeholder: x.placeholder,
          foldRange: JSON.parse(JSON.stringify(x.range)),
        };
      }),
    };
    
  }
  message.save();
}

hotkeys.filter = function(event) {
  var tagName = (event.target || event.srcElement).tagName;
  hotkeys.setScope(/^(TEXTAREA)$/.test(tagName) ? 'input' : 'other');
  return true;
};

function copyCell() {
  this.previousElementSibling.select();
  document.execCommand('copy');
  notifikasi.pop();
}

function generateNotes() {
  let i = 0;
  while (i < 12) {
    let d = document.createElement('div');
    let d2 = document.createElement('div');
    let t = document.createElement('textarea');
    let b = document.createElement('button');
    // b.innerHTML = 'Copy';
    // b.classList.toggle('btn-copy')
    // b.addEventListener('click', copyCell);
    t.addEventListener('click', toggleRGB)
    t.classList.toggle('text')
    t.spellcheck = false;
    d.classList.toggle('notes')
    d2.classList.toggle('notes-inner')
    d2.append(t);
    d.append(d2);
    // d.append(b);
    $('#wrapper').append(d);
    i++;
  }
}


function shiftLine(event) {
  
  let node = event.target;
  if (!node.matches('textarea')) {
    return;
  }
  textarea = node;
  
  if (event.ctrlKey && event.shiftKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
    event.preventDefault();
    
    const textarea = event.target;
    const value = textarea.value;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const lines = value.split("\n");

    // Calculate the index of the line to shift
    let lineIndex = value.substr(0, selectionStart).split("\n").length - 1;
    if (event.key === "ArrowUp") {
      // Make sure the line index is within bounds
      if (lineIndex < 0 || lineIndex >= lines.length) {
        return;
      }
      // lineIndex--;
    } else {
      // Make sure the line index is within bounds
      if (lineIndex < 0 || lineIndex >= lines.length) {
        return;
      }
    }

    // Remove the line to be shifted from the array
    const lineToShift = lines.splice(lineIndex, 1)[0];

    // Calculate the index of the line to insert the shifted line
    let insertIndex = lineIndex;
    if (event.key === "ArrowDown") {
      insertIndex++;
    } else {
      insertIndex--;
    }

    // Make sure the insert index is within bounds
    if (insertIndex < 0) {
      insertIndex = 0;
    } else if (insertIndex > lines.length) {
      insertIndex = lines.length;
    }
    // Insert the shifted line into the array
    lines.splice(insertIndex, 0, lineToShift);

    // Update the textarea value and selection position
    textarea.value = lines.join("\n");

    let result = lines.reduce((acc, curr, index) => {
      if (event.key === "ArrowDown" && index <= lineIndex) {
        return acc + curr.length + 1;
      } else if (event.key === "ArrowUp" && index < lineIndex) {
        return acc + curr.length + 1;
      } 
      return acc;
    }, 0);
    
    if (event.key === "ArrowUp") {
      result -= lineToShift.length + 1;
      result = Math.max(0, result);
    } 
    
    textarea.setSelectionRange(result, result);
  }
}




let notifikasi = (function() {
  let timeout = null;
  function pop(text = 'Text copied') {
    let host = pipWindow ? pipWindow.document : document;
    let notif = host.querySelector('#notif');
    notif.querySelector('.notif').textContent = text;
    notif.classList.add('_active');
    window.clearTimeout(timeout);
    timeout = window.setTimeout(close, 2000);
  }
  function close() {
    let host = pipWindow ? pipWindow.document : document;
    let notif = host.querySelector('#notif');
    notif.classList.remove('_active');
  }
  return {pop};
})();


let message = (function() {
  
  let $ = document.querySelector.bind(document);
  let $$ = document.querySelectorAll.bind(document);
  
  let mode = 'edit';
  
  Object.defineProperty(this, 'mode', {
    get: () => mode,
    set: _mode => mode = _mode,
  });
  
  function copyText() {
    if (mode == 'edit') return;
    this.select();
    document.execCommand('copy');
  }
  
  function loadMessages(data) {
    let messages;
    if (typeof(data) != 'undefined') {
      messages = data;
    } else {
      messages = localStorage.getItem(appUID);
    }
    
    if (messages == null) return;
    
    messages = JSON.parse(messages);
  
    for (let i=0; i<$$('.text').length; i++) {
      
      let textEl = $$('.text')[i];
      
      if (typeof(messages[i]) == 'string') {
        messages[i] = {
          content: messages[i]
        };
      }
      
      textEl.value = messages[i].content;
      if (messages[i].windowWidth) {
        textEl.dataset.windowWidth = messages[i].windowWidth;
      }
      if (messages[i].windowHeight) {
        textEl.dataset.windowHeight = messages[i].windowHeight;
      }
    }
  }

  
  this.reset = function() {
    localStorage.removeItem(appUID);
  };
  
  this.save = async function() {
    // let messages = [];
    for (let el of $$('.notes')) {
      let id = el.dataset.id;
      let text = el.querySelector('.text');
      // messages.push();
      let data = {
        id,
        windowWidth: text.dataset.windowWidth ? text.dataset.windowWidth : null, 
        windowHeight: text.dataset.windowHeight ? text.dataset.windowHeight : null, 
        content: text.value,
        editorSession: {
          foldData: el.querySelector('textarea')?.tempData?.editorSesionCustomFoldData,
        }
      };
      await compoNotes.UpdateAsync(data);
      // console.log(data)
    }
    // localStorage.setItem(appUID,JSON.stringify(messages));
    notifikasi.pop('Saved');
  };
  
  this.copy = function(targetEl) {
    targetEl.select();
    document.execCommand('copy');
    notifikasi.pop('Copied');
  };
  
  return this;
  
})();