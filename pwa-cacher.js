let pwaCacher = (function() {
  
  let $ = document.querySelector.bind(document);
  let cacheStatusLabelEl = $('#txt-pwa-cacher-cache-status-label');
  
  let cacheName = 'app-MjU1MTUyNjA';
  let versionStorageKey = `${cacheName}-cache-version`;
  let cacheConfigStoreKey = `${cacheName}-cache-config`;

  let SELF = {
    RemoveUpdate,
    ManualUpdate,
    Update,
    TaskCacheVersionChecking,
    
    ToggleAutoUpdate,
  };
  
  
  let data = {
    autoUpdateEnabled: true,
    updateTresholdMs: 60 * 60 * 1000, // 1 hour
    lastCheckUpdateTime: null,
    cacheStatus: '#0',
  };
  
  function initData() {
    let existingDataJSON = localStorage.getItem(cacheConfigStoreKey);
    if (existingDataJSON !== null) {
      try {
        data = JSON.parse(existingDataJSON);
      } catch (e) {}
    }
    
    updateCacheStatusLabel();
  }
  
  function clientUpdateHandler(message = 'New version available', primaryBtnText = 'Refresh') {
    return new Promise(function(resolve, reject) {
      $('#update-notif').classList.toggle('active', true);
      $('[data-js="message"]').innerHTML = message;
      $('[data-js="btn-refresh"]').textContent = primaryBtnText;
      $('[data-js="btn-refresh"]').onclick = () => {
        $('#update-notif').classList.toggle('active', false);
        resolve(true);
      };
      $('[data-js="btn-dismiss"]').onclick = () => {
        $('#update-notif').classList.toggle('active', false);
        resolve(false);
      };
    });
  }
  
  function updateCacheStatusLabel() {
    let label = '-';
    switch (data.cacheStatus) {
      case '#1': label = 'Offline ready'; break;
      case '#2': label = 'Partially cached'; break;
      case '#3': label = 'Not cached'; break;
    }
    cacheStatusLabelEl.textContent = label;
  }
  
  function updateCacheStatus(cacheStatus) {
    data.cacheStatus = cacheStatus;
  }
  
  function ToggleAutoUpdate() {
    data.autoUpdateEnabled = !data.autoUpdateEnabled;
    commit();
    return data.autoUpdateEnabled;
  }

  
  function extractUrlsFromJson(json) {
    let urls = [];
    for (let key in json) {
      if (Array.isArray(json[key])) {
        urls = urls.concat(json[key]);
      }
    }
    return urls;
  }
  
  async function RemoveUpdate() {
    
    let isConfirm = await windog.confirm('Are you sure?');
    if (!isConfirm) return;
    
    caches.delete(cacheName)
      .then(() => {
        
        clientUpdateHandler('App cache removed!<br><small>App will stay uncached untill you update the app manually. Reload to take effect.</small>', 'Reload').then((isConfirm) => {
            if (isConfirm) {
              location.reload();
            }
        });
        
        data.lastCheckUpdateTime = null;
        data.autoUpdateEnabled = false;
        updateCacheStatus('#3');
        commit();
        localStorage.removeItem(versionStorageKey);
        
        updateCacheStatusLabel();
      });
  }
  
  function ManualUpdate() {
    data.autoUpdateEnabled = true;
    updateLastCheckUpdateTime();
    startUpdate();
  }
  
  function Update() {
    if (!isAutomaticUpdate()) return;
    
    startUpdate();
  }
  
  function startUpdate() {
    fetch('manifest-cache.json')
    .then( res => res.json() )
    .then( json => readCacheFile(json) );
  }
  
  async function readCacheFile(json) {
    
    // check cache version
    let cacheVersion = json.version;
    let changeState = checkVersionUpdate(cacheVersion);
    
    if (changeState === -1) {
      alert('Update failed, invalid app version format. Try clearing the application cache.');
      return;
    } else if (changeState === 3) {
      let isConfirm = await clientUpdateHandler('Update Available<br><small>This update includes possible breaking changes! Please back up your data if there\'s an option to do so. Update the app now?</small>', 'Update');
      if (!isConfirm) return;
    } else if (changeState === 4) {
      windog.alert('No updates available');
      return;
    }
    
    // update the cache
    let hasError = false;
    let cacheURLs = extractUrlsFromJson(json);
    caches.delete(cacheName)
    .then(() => {
      caches.open(cacheName)
      .then(function(cache) {
        return Promise.all(
          cacheURLs.map(function(url) {
            return cache.add(url).catch(function(error) {
              hasError = true;
              console.error('Failed to cache URL:', url, error);
            });
          })
        );
      })
      .then(function() {
        if (data.lastCheckUpdateTime !== null) {
            clientUpdateHandler('App updated! Reload to take effect.', 'Reload').then((isConfirm) => {
              if (isConfirm) {
                location.reload();
              }
            });
        }

        if (hasError) {
          updateCacheStatus('#2');
        } else {
          updateCacheStatus('#1');
        }
        commit();
        updateLastCheckUpdateTime();
        updateAppCacheVersion(cacheVersion);
        
        updateCacheStatusLabel();
      })
      .catch(function(error) {
        console.log(error);
        updateCacheStatus('#0');
        updateCacheStatusLabel();
        commit();
      });
    });
    
  }
  
  function updateLastCheckUpdateTime() {
    data.lastCheckUpdateTime = new Date().getTime();
    commit();
  }
  
  function noticeUpToDate() {
    try {
      $('#txt-pwa-cacher-update-status').textContent = 'No updates available.';
    } catch (e) {
      console.error(e);
    }
  }
  
  function checkVersionUpdate(cacheVersion) {
    
    let myVersion = localStorage.getItem(versionStorageKey);
    if (myVersion === null) {
      return 0; // Initial setup, treat as breaking update
    }
    
    let semverRegex = /^(\d+)\.(\d+)\.(\d+)$/;

    if (!semverRegex.test(myVersion) || !semverRegex.test(cacheVersion)) {
        console.error('Invalid version format');
        return -1; // Error: Invalid version format
    }

    let [myMajor, myMinor, myPatch] = myVersion.match(semverRegex).slice(1).map(Number);
    let [cacheMajor, cacheMinor, cachePatch] = cacheVersion.match(semverRegex).slice(1).map(Number);

    

    if (cacheMajor > myMajor) {
      console.log('Breaking Update');
      return 3; // Breaking Update
    } else if (cacheMajor === myMajor && cacheMinor > myMinor) {
      console.log('Feature Update');
      return 2; // Feature Update
    } else if (cacheMajor === myMajor && cacheMinor === cacheMinor && cachePatch > myPatch) {
      console.log('Minor Update or Bug Fix');
      return 1; // Minor Update or Bug Fix
    } else if (cacheMajor === myMajor && cacheMinor === cacheMinor && cachePatch === myPatch) {
      noticeUpToDate()
      return 4; // Minor Update or Bug Fix
    } else {
      console.log('Recache');
      return 0;
    }
    
  }
  
  function updateAppCacheVersion(version) {
    localStorage.setItem(versionStorageKey, version);
  }
  
  
  function isAutomaticUpdate() {
    return data.autoUpdateEnabled
  }
  
  async function TaskCacheVersionChecking() {
    
    if (!isAutomaticUpdate()) return
      
    if (await __taskHasCache()) {
      checkPeriodicalUpdates()
      return
    }
    
    Update()
  }
  
  async function __taskHasCache() {
    return await caches.has(cacheName);
  }
  
  
  function checkPeriodicalUpdates() {
    
    let currentTime = new Date().getTime();
    
    if (data.lastCheckUpdateTime != null) {
      if ( ( currentTime - data.lastCheckUpdateTime ) < data.updateTresholdMs) return;
    }
    
    Update();
  }
  
  function commit() {
    localStorage.setItem(cacheConfigStoreKey, JSON.stringify(data));
  }
  
  initData();
  
  return SELF; 
  
})();