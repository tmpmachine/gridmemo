let compoNotes = (function() {
  
  'use strict';
  
  let SELF = {
    GetByIdAsync,
    AddAsync,
    UpdateAsync,
    DeleteById,
    GetAllByIdsAsync,
    UpdateColorByIdAsync,
  };
  
  // idb config
  const DB_NAME = 'app-MjU1MTUyNjA-db';
  window.DB_NAME = DB_NAME;
  const DB_VERSION = 1;
  const OBJECT_STORE_NAME = 'notes';
  // const LABELS_STORE_NAME = 'workspaces';
  
  const defaultGroupId = '';
  let data = {
    activeGroupId: defaultGroupId,
    missionGroup: [],
  };
  
  async function UpdateColorByIdAsync(id, hex) {
    let { data } = await GetByIdAsync(id);
    let noRefData = JSON.parse(JSON.stringify(data));
    
    noRefData.color = hex;
    
    await compoNotes.UpdateAsync(noRefData);
  }
  
  async function GetAllByIdsAsync(noteIds) {
    let noteObjs = [];
    
    for (let noteId of noteIds) {
      let result = await GetByIdAsync(noteId);
      if (!result.success) continue;
      
      noteObjs.push(result.data);
    }
    
    return noteObjs;
  }
  
  function AddAsync(content) {
    
    let id = generateId();
    let data = {
      id,
      content,
    };
    
    return new Promise(async (resolve, reject) => {
      
      let db = await OpenDatabase();
      let transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');
      let objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      
      let request = objectStore.add(data);
      
      request.onerror = () => {
        reject({
          success: false,
          error: request.error,
        });
      };
      
      request.onsuccess = () => {
        resolve({
          success: true,
          data: request.result,
        });
      };
      
    });
  }
  
  function UpdateAsync(data) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      let transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');
      let objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      
      try {
        let request = objectStore.put(data);
        
        request.onerror = () => {
          reject({
            success: false,
            error: request.error,
          });
        };
        
        request.onsuccess = () => {
          resolve({
            success: true,
            data: request.result,
          });
        };
      } catch (e) {
        resolve({
          success: false,
          error: e,
        });
        console.error(e);  
      }
      
    });
  }
  
  function GetByIdAsync(id) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(OBJECT_STORE_NAME);

      const request = store.get(id);
  
      request.onsuccess = () => {
        resolve({
          success: (request.result !== undefined),
          data: request.result,
        });
      };

      request.onerror = () => {
        reject({
          success: false,
          error: request.error,
        });
      };
      
    });
  }
  
  function DeleteById(id) {
    return new Promise(async (resolve, reject) => {
      let db = await OpenDatabase();
      let transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');
      let objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      
      let request = objectStore.delete(id);
      
      request.onsuccess = () => {
        resolve({
          success: true,
        });
      };

      request.onerror = () => {
        reject({
          success: false,
          error: request.error,
        });
      };
      
    });
  }
  
  function OpenDatabase() {
    return new Promise((resolve, reject) => {
      let request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onupgradeneeded = (event) => {
        
        let db = request.result;
        let snippetsStore;
        
        if (db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
          snippetsStore = event.target.transaction.objectStore(OBJECT_STORE_NAME);
        } else {
          snippetsStore = db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
        }
        
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
  
  function AddGroup(title) {
    let id = generateId();
    let group = {
      id,
      title,
      items: [],
    };
    data.missionGroup.push(group);
    
    return group;
  }
  
  function SetActiveGroupById(id) {
    let group = GetGroupById(id);
    if (group == null) return false;
  
    data.activeGroupId = id;
    
    return true;
  }
  
  function GetGroupByName(name) {
    let group = data.missionGroup.find(item => item.title == name);
    if (group !== undefined) return group;
    
    return null;
  }
  
  function DeleteGroupById(id) {
    let delIndex = getGroupIndexById(id);
    if (delIndex < 0) return null;
    
    let group = data.missionGroup.splice(delIndex, 1);
    
    return group;
  }
  
  function getGroupIndexById(id) {
    return data.missionGroup.findIndex(item => item.id == id);
  }
  
  function generateId() {
    return uuidv4Util.Generate();
  }
  
  const __idGenerator = (function() {
      
      function generator() {
        // generate incremental id : #0, #1, #2 .. and so on
        let count = 0; 
      
        return function () {
          return `#${++count}`;
        };
      }
      
      return {
        generate: generator(),
      };
      
  })();
    
  function UpdateGroupTitle(id, title) {
    
    let group = GetGroupById(id);
    if (group == null) return false;
    
    group.title = title;
    commitData();
    
    return true;
  }
  
  function AddMission(missionData) {
    let group = GetActiveGroup();
    if (group == null) return false;
    
    group.missionIds.push(missionData);
    commitData();
  }
  
  function GetMissions() {
    let group = GetActiveGroup();
    return group.missionIds;
  }
  
  function Init() {
    checkDataIntegrity();
    initData();
  }
    
  function checkDataIntegrity() {
    runDataMigration9Nov23();
  }
  
  function initData() {
    let appDataManager = app.GetDataManager();
    data = clearReference(appDataManager.data.compoMission);
  }
  
  function runDataMigration9Nov23() {
    let appDataManager = app.GetDataManager();
    if (Object.keys(appDataManager.data.compoMission).length > 0) return;
    
    let group = GetGroupById(defaultGroupId);
    group.missionIds = clearReference(appDataManager.data.missionIds);
    commitData();
  }
  
  function getAppData() {
    return lsdb.data.compoMission;
  }
  
  function clearReference(data) {
    return JSON.parse(JSON.stringify(data));
  }
  
  function GetGroupById(id) {
    let group = data.missionGroup.find(x => x.id == id);
    if (group !== undefined) return group;
    
    return null;
  }
  
  function commitData() {
    let appDataManager = app.GetDataManager();
    appDataManager.data.compoMission = clearReference(data);
  }
  
  function Commit() {
    commitData();
  }
  
    
  function RemoveMissionById(id) {
    let activeGroupId = GetActiveGroupId();
    let isSuccess = RemoveMissionByIdFromGroup(id, activeGroupId);
    return isSuccess;
  }
  
  function GetGroups() {
    return data.missionGroup;
  }
  
  function IsExistsMissionId(missionId) {
    let groupId = GetActiveGroupId();
    return IsExistsMissionInGroup(missionId, groupId);
  }
  
  function IsExistsMissionInGroup(missionId, groupId) {
    
    let group = GetGroupById(groupId);
    if (group == null) {
      console.log('group not found');
      return false;
    }
    
    let findIndex = group.missionIds.findIndex(item => item.id == missionId);
    let isExists = (findIndex >= 0);
    return isExists;
  }
  
  function GetMissionById(id) {
    let group = GetActiveGroup();
    let mission = group.missionIds.find(item => item.id == id);
    return mission;
  }
  
  function GetActiveGroup() {
    return GetGroupById(GetActiveGroupId());
  }
  
  function GetActiveGroupId() {
    return data.activeGroupId;
  }
    
  function RemoveMissionByIdFromGroup(missionId, groupId) {
    let group = GetGroupById(groupId);
    if (group == null) {
      console.log('group not found');
      return false;
    }
    
    let delIndex = group.missionIds.findIndex(x => x.id == missionId);
    if (delIndex < 0) return false;
    
    group.missionIds.splice(delIndex, 1);
    commitData();

    return true;
  }

    
  return SELF;
  
})();