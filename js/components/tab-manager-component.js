let compoTabManager = (function() {
  
  'use strict';
  
  let SELF = {
    
    // # generic methods
    
    Init,
    GetActive,
    GetActiveId,
    GetAll,
    GetById,
    GetNext,
    GetPrevious,
    SetActiveById,
    GetIndexById,
    // ToggleActiveById,
    UnsetActive,
    Commit,
    Add,
    CountAll,
    // UpdateById,
    DeleteById,
    
    ReplaceTemp,
    HasTemp,
  };
  
  let data = {
    activeId: null,
    items: [],
    /* items[]
      {
        id: '',
        title: '',
      }
    */
  };
  
  let local = {
    componentStorageKey: 'compoTabManager',
  };
  
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
  
  function ToggleActiveById(id) {
    let activeId = GetActiveId();
    if (activeId === id) {
      UnsetActive();
    } else {
      return SetActiveById(id);
    }
    
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
  
  function UpdateById(incomingData, id) {
    let item = GetById(id);
    if (!item) return null;
    
    for (let key in incomingData) {
      if (typeof(item[key]) != 'undefined' && typeof(item[key]) == typeof(incomingData[key])) {
        item[key] = incomingData[key];
      }
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