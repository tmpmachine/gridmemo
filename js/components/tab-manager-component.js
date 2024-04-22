let compoTabManager = (function() {
  
  'use strict';
  
  let SELF = {
    Init,
    GetActive,
    GetActiveId,
    GetAll,
    GetById,
    GetNext,
    GetPrevious,
    SetActiveById,
    GetIndexById,
    UnsetActive,
    Commit,
    Add,
    CountAll,
    DeleteById,
    ReplaceTemp,
    SetDirtyById,
    HasTemp,
    IsDirty,
  };
  
  let data = {
    activeId: null,
    items: [],
    /* items[]
      {
        id: '',
        title: '',
        isDirty: false,
      }
    */
  };
  
  let local = {
    componentStorageKey: 'compoTabManager',
    dirtyIds: [],
  };
  
  function IsDirty(id) {
    return local.dirtyIds.includes(id);
  }
  
  function SetDirtyById(id, isDirty = false) {
    let item = GetById(id);
    if (item == null) return false;
    
    if (isDirty) {
      local.dirtyIds.push(id);
    } else {
      local.dirtyIds = local.dirtyIds.filter(_id => _id != id);
    }
  }  
  
  function Init(noReferenceData) {
    initData(noReferenceData);
  }
  
  function initData(noReferenceData) {
    if (Object.keys(noReferenceData).length == 0) return;
    
    data = noReferenceData;
  }
  
  function RemoveTempItem() {
    data.tempItem = null;
  }
  
  function Add(id, title, isTemp = false) {
    let group = {
      id,
      title,
      isTemp,
    };
    data.items.push(group);
    
    return group;
  }
  
  function SetActiveById(id) {
    let group = GetById(id);
    if (group == null) return false;
  
    data.activeId = id;
    
    return true;
  }
  
  function DeleteById(id) {
    let delIndex = getItemIndexById(id);
    if (delIndex < 0) return null;
    
    let item = data.items.splice(delIndex, 1);
    let activeId = GetActiveId();
    
    if (data.items.length == 0 || item[0].id == activeId) {
      UnsetActive();
    }
    
    return item;
  }
  
  function UnsetActive() {
    data.activeId = null;
  }
  
  function getItemIndexById(id) {
    return data.items.findIndex(item => item.id == id);
  }
  
  function generateId() {
    return (new Date()).getTime().toString();
  }
    
  function clearReference(data) {
    return JSON.parse(JSON.stringify(data));
  }
  
  function GetById(id) {
    let group = data.items.find(x => x.id == id);
    if (group !== undefined) return group;
    
    return null;
  }
    
  function GetAll() {
    return data.items;
  }
  
  function HasTemp() {
    return (getTemp() != undefined);
  }
  
  function getTemp() {
    return GetAll().find(x => x.isTemp);
  }
  
  function ReplaceTemp(id, title) {
    let item = GetAll().find(x => x.isTemp);
    item.id = id;
    item.title = title;
  }
  
  function GetActive() {
    return GetById(GetActiveId());
  }
  
  function isEmpty() {
    return (GetAll().length == 0);
  }
  
  function CountAll() {
    return data.items.length;
  }
  
  function GetActiveId() {
    return data.activeId;
  }
  
  function GetNext() {
    
    if (isEmpty()) return null;
    
    let item = GetActive();
    if (item == null) {
      return GetByIndex(0);
    }
      
    let activeItemIndex = GetIndexById(item.id);
    let lastItemIndex = CountAll() - 1;
    let nextItemIndex = Math.min(lastItemIndex, activeItemIndex + 1);
    if (activeItemIndex + 1 > lastItemIndex) {
      nextItemIndex = 0;
    }
    let nextItem = GetByIndex(nextItemIndex);
      
    return nextItem;
  }
  
  function GetPrevious() {
    
    if (isEmpty()) return null;
    
    let item = GetActive();
    if (item == null) {
      let lastItemIndex = CountAll() - 1;
      return GetByIndex(lastItemIndex);
    }
      
    let activeItemIndex = GetIndexById(item.id);
    let prevItemIndex = Math.max(0, activeItemIndex - 1);
    if (activeItemIndex - 1 < 0) {
      prevItemIndex = CountAll() - 1;
    }
    let prevItem = GetByIndex(prevItemIndex);
      
    return prevItem;
  }
  
  function GetByIndex(index) {
    let items = GetAll();
    return items[index];
  }
  
  function GetIndexById(id) {
    let items = GetAll();
    return items.findIndex(item => item.id == id);
  }
  
  function Commit() {
    appData.SetComponentData(local.componentStorageKey, clearReference(data));
  }
    
  return SELF;
  
})();