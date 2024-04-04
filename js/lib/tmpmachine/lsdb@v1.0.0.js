/**
 * Minified by jsDelivr using Terser v5.17.1.
 * Original file: /gh/tmpmachine/lsdb.js@1.0.0/lsdb.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
!function(){const t=function(t,o,e={}){var i,s;this.root=JSON.parse(JSON.stringify(o)),this.storageName=t,this.data=JSON.parse((i=this.storageName,s=null,window.localStorage.getItem(i)?window.localStorage.getItem(i):s)),this.deepCheck(this.data,o.root,!0),this.saveResolver=[],this.options={isSaveDelayed:!1,isStoreData:!0};for(let t in e)void 0!==this.options[t]?this.options[t]=e[t]:console.log("lsdb.js:","Unkown option name:",t)};t.prototype.deepCheck=function(t,o,e){if(null===t)this.data=JSON.parse(JSON.stringify(this.root.root));else{for(const e in t)void 0===o[e]&&delete t[e];for(const e in o)void 0===t[e]&&(t[e]=o[e]);for(const i in t)if(Array.isArray(t[i]))for(let o=0;o<t[i].length;o++)"object"!=typeof t[i][o]||Array.isArray(t[i][o])||void 0!==this.root[i]&&this.deepCheck(t[i][o],this.root[i]);else null===t[i]||void 0===t[i]||"object"!=typeof t[i]||Array.isArray(t[i])||void 0===this.root.root[i]||(e?Object.keys(this.root.root[i]).length>0&&this.deepCheck(t[i],this.root.root[i],!1):Object.keys(this.root.root[i]).length>0&&this.deepCheck(t[i],o[i],e))}},t.prototype.save=function(){if(this.options.isStoreData)return this.options.isSaveDelayed?new Promise((t=>{this.saveResolver.push(t),window.clearTimeout(this.saveTimeout),this.saveTimeout=window.setTimeout(this.storeData.bind(this),50)})):void this.storeData()},t.prototype.storeData=function(){window.localStorage.setItem(this.storageName,JSON.stringify(this.data));for(let t of this.saveResolver)t();this.saveResolver.length=0},t.prototype.reset=function(){this.options.isStoreData&&window.localStorage.removeItem(this.storageName),this.data=JSON.parse(JSON.stringify(this.root.root))},t.prototype.new=function(t,o){const e=JSON.parse(JSON.stringify(this.root[t]));for(const t in o)e[t]=o[t];return e},t.prototype.saveTimeout=function(){},void 0===window.Lsdb?window.Lsdb=t:console.error("lsdb.js:","Failed to initialize. Duplicate variable exists.")}();
//# sourceMappingURL=/sm/29632bc8826968e175d0f0c423603364879fe08908895e58b11322f438a13b94.map