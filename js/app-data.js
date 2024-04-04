let appData = (function() {
  
  let storageName = 'appsettings-MjU1MTUyNjA';
  let lsdb = new Lsdb(storageName, {
    root: {
      version: 1,
      
      workspaces: [],
      
      // components
      components: {
        compoGsi: {},
        compoTabManager: {},
      }
    },
  });
  
  let SELF = {
    Save,
    Reset,
    GetDataCopy,
    SetWorkspace,
    GetWorkspace,
    SetComponentData,
    GetComponentData,
  };
  
  function GetDataCopy() {
    return clearReference(lsdb.data);
  }
  
  function SetWorkspace(workspaces) {
    lsdb.data.workspaces = clearReference(workspaces);
  }
  
  function GetWorkspace() {
    return clearReference(lsdb.data.workspaces);
  }
  
  function Save() {
    lsdb.save();
  }
  
  function Reset() {
    lsdb.reset();
  }
  
  function clearReference(data) {
    return JSON.parse(JSON.stringify(data));
  }
  
  function SetComponentData(componentKey, noReferenceData) {
    if (!lsdb.data.components[componentKey]) return;
    
    lsdb.data.components[componentKey] = noReferenceData;
  }
  
  function GetComponentData(componentKey, callback) {
    if (!lsdb.data.components[componentKey]) return;
    
    callback(clearReference(lsdb.data.components[componentKey]));
  }
  
  return SELF;
  
})();
