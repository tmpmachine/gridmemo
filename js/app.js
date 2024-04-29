let app = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    Init,
    SaveAsync,
    save: SaveAsync,
    BackupToCloud,
    RestoreFromCloud,
    GetDataManager,
    TaskExportDataToFile,
    TaskExportDataToBlob,
    TaskClearData,
    TaskImportDataFromFile,
    TaskImportDataFromJSON,
    Log,
    ListenAppUnload,
    UnlistenAppUnload,
  };
  
  // db config
  // todo: remove duplicate definitions in notes component
  const DB_NAME = 'app-MjU1MTUyNjA-db';
  const DB_VERSION = 1;
  
  async function SaveAsync() {
    
    uiDocPip.SetPipEditorData();
    
    for (let el of document.querySelectorAll('.notes')) {
      let id = el.dataset.id;
      let text = el.querySelector('.text');
      let titleEl = el.querySelector('[data-slot="title"]');
      let data = {
        id,
        windowWidth: text.dataset.windowWidth ? text.dataset.windowWidth : null, 
        windowHeight: text.dataset.windowHeight ? text.dataset.windowHeight : null, 
        color: titleEl?.dataset.color,
        title: titleEl?.textContent ?? '',
        content: text.value,
        editorSession: {
          foldData: el.querySelector('textarea')?.tempData?.editorSesionCustomFoldData,
        }
      };

      await compoNotes.UpdateAsync(data);
    }
    
    compoNotif.Pop('Saved');
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
      
	    if (await !windog.confirm('Are you sure?')) {
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
    
    await db.open();
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
    appData.GetComponentData('compoGsi', async (data) => {
      await utilAwaiter.WaitUntilAsync(() => typeof(compoGsi) != 'undefined');
      compoGsi.InitData(data);
    });
    appData.GetComponentData('compoTabManager', (data) => compoTabManager.Init(data) );

    ui.Init();
  
    hotkeys.filter = function(event) {
      var tagName = (event.target || event.srcElement).tagName;
      hotkeys.setScope(/^(TEXTAREA)$/.test(tagName) ? 'input' : 'other');
      return true;
    };
  
  }
  
  function ListenAppUnload() {
    window.addEventListener('beforeunload', handleBeforeUnloadEvent);
  }
  
  function UnlistenAppUnload() {
    window.removeEventListener('beforeunload', handleBeforeUnloadEvent);
  }
  
  function handleBeforeUnloadEvent(evt) {
    evt.preventDefault();
    evt.returnValue = true;
  }

  function Log(message) {
    $('#container-debug-log').innerHTML += `\n${message}`;
  }
  
  return SELF;
  
})();