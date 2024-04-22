let compoTempWorkspace = (function() {
  
  let SELF = {
    StoreTempAsync,
    DeleteById,
    StashAsync,
    GetNotesByWorkspaceId,
    UpdateNoteContentById,
  };
  
  let data = {
    items: [],
  };
  
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
    
    // check if there's no unsaved changes
    let itemsCount = countItems();
    if (itemsCount === 0) {
      app.UnlistenAppUnload();
    }
    
    return data.items.splice(delIndex, 1);
  }
  
  function GetNotesByWorkspaceId(id) {
    let item = GetItemById(id);
    return item?.notes;
  }
  
  function StoreTempAsync(workspaceId, gridNotesObj) {
    let itemIndex = GetItemIndexById(workspaceId);
    
    if (itemIndex < 0) {
      data.items.push({
        notes: gridNotesObj.map(obj => {
          let {id, content} = obj;
          return {
            id,
            content,
          };
        }),
        id: workspaceId,
      });
    } else {
      data.items[itemIndex].notes = gridNotesObj;
    }

    app.ListenAppUnload();
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
  
  async function StashAsync(workspaceObj) {
    // draft
    
    /*let {id: workspaceId} = workspaceObj;
    let notes = await compoWorkspace.GetNotesByWorkspaceIdAsync(workspaceId);
    let itemIndex = GetItemIndexById(workspaceId);
    
    if (itemIndex < 0) {
      data.items.push({
        notes: notes.map(obj => {
          let {id, content} = obj;
          return {
            id,
            content,
          };
        }),
        id: workspaceId,
      });
    } else {
      data.items[itemIndex].notes = notes;
    }*/
  }
  
  return SELF;
  
})();