let compoTempWorkspace = (function() {
  
  let SELF = {
    StoreTempAsync,
    DeleteById,
    DeleteTempNotesById,
    GetAllItems,
    GetNotesByWorkspaceId,
    UpdateNoteContentById,
    CaptureNotesAsync,
    HasUnsavedChanges,
    HasUnsavedChangesById,
    CheckUnsavedChangesById,
    RecaptureCurrentWorkspaceAsync,
  };
  
  let data = {
    items: [],
  };
  
  async function RecaptureCurrentWorkspaceAsync() {
    let currentWorkspaceId = compoWorkspace.GetActiveId();
    
    DeleteById(currentWorkspaceId);
    await CaptureNotesAsync(currentWorkspaceId);
    
    // check if there's no unsaved changes
    if (!HasUnsavedChanges()) {
      app.UnlistenAppUnload();
    }
  }
  
  function UpdateNoteContentById(workspaceId, noteId, content) {
    let item = GetItemById(workspaceId);
    let note = item?.notes.find(x => x.id == noteId);
    
    if (note) {
      note.content = content;
    }
  }

  function countItems() {
    return data.items.length;
  }
  
  function DeleteById(id) {
    let delIndex = GetItemIndexById(id);
    if (delIndex < 0) return null;
    
    let item = data.items.splice(delIndex, 1);
    return item;
  }
  
  function DeleteTempNotesById(id) {
    let item = GetItemById(id);
    if (!item) return;
    
    delete item.notes;
  }
  
  function GetNotesByWorkspaceId(id) {
    let item = GetItemById(id);
    return item?.notes;
  }
  
  async function CaptureNotesAsync(workspaceId, gridNotesObj) {
    let itemIndex = GetItemIndexById(workspaceId);
    if (itemIndex >= 0) return;

    if (!gridNotesObj) {
      gridNotesObj = await compoWorkspace.GetNotesByWorkspaceIdAsync(workspaceId);
    }
    if (!gridNotesObj) return;
    
    data.items.push({
      captures: gridNotesObj.map(obj => {
        let {id, content} = obj;
        return {
          id,
          content,
        };
      }),
      id: workspaceId,
    });
  }
  
  function StoreTempAsync(workspaceId, gridNotesObj) {
    let itemIndex = GetItemIndexById(workspaceId);
    if (itemIndex < 0) return;
    
    let item = data.items[itemIndex];
    // let result = checkUnsavedChanges(gridNotesObj, item.captures);
    // if (!result.hasUnsavedChanges) return;
    
    item.notes = gridNotesObj;
  }
  
  function HasUnsavedChanges() {
    let items = GetAllItems();
    let hasUnsavedChanges = items.some(item => item.notes);
    return hasUnsavedChanges;
  }
  
  function HasUnsavedChangesById(id) {
    let items = GetAllItems();
    let hasUnsavedChanges = items.some(item => item.notes && item.id == id);
    return hasUnsavedChanges;
  }
  
  function CheckUnsavedChangesById(id) {
    let item = GetItemById(id);
    if (!item) return null;
    
    let checkResult = checkUnsavedChanges(item.notes, item.captures);
    return checkResult;
  }
  
  function checkUnsavedChanges(newData, oldData) {
    let hasUnsavedChanges = false;
    
    for  (let item of newData) {
      let matchedData = oldData.find(x => x.id == item.id);
      if (!matchedData) {
        hasUnsavedChanges = true;
        break;
      }
      
      if (matchedData.content !== item.content) {
        hasUnsavedChanges = true;
        break;
      }
    }
    
    return {
      hasUnsavedChanges,
    };
  }
  
  function GetItemById(id) {
    let item = data.items.find(x => x.id == id);
    if (item !== undefined) return item;
    
    return null;
  }
  
  function GetAllItems() {
    return data.items;
  }
  
  function GetItemIndexById(id) {
    let items = GetAllItems();
    return items.findIndex(item => item.id == id);
  }
  
  return SELF;
  
})();