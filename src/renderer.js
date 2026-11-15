const $ = (id) => document.getElementById(id);
const tabsEl = $("tabs"), webviewsEl = $("webviews"), startPage = $("startPage");
let tabs = [], activeId = null, nextId = 1, workspaces = ["Personal", "Creator", "Research"], activeWorkspace = "Personal";
let adBlockOn = true;
const socialDefaults = [
  ["Instagram","https://www.instagram.com"],["YouTube","https://www.youtube.com"],
  ["TikTok","https://www.tiktok.com"],["Discord","https://discord.com/app"],
  ["X","https://x.com"],["WhatsApp","https://web.whatsapp.com"]
];

function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
}
function normalizeAddress(value) {
  const text = value.trim(); if (!text) return null;
  if (/^(https?:\/\/)/i.test(text)) return text;
  if (/^localhost(:\d+)?/i.test(text) || /^[\w.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(text)) return "https://" + text;
  return "https://www.google.com/search?q=" + encodeURIComponent(text);
}
function activeTab() { return tabs.find(t => t.id === activeId); }
function createTab(url = null, activate = true) {
  const id = nextId++;
  const view = document.createElement("webview");
  view.setAttribute("partition", "persist:nexora");
  view.setAttribute("allowpopups", "true");
  view.setAttribute("webpreferences", "contextIsolation=yes, nodeIntegration=no, sandbox=yes");
  view.className = "browser-view";
  view.dataset.id = id;
  view.addEventListener("page-title-updated", e => { const t=tabs.find(x=>x.id===id); if(t){t.title=e.title||"New tab";renderTabs();} });
  view.addEventListener("did-navigate", e => { const t=tabs.find(x=>x.id===id); if(t){t.url=e.url; if(id===activeId) $("address").value=e.url;} });
  view.addEventListener("did-navigate-in-page", e => { const t=tabs.find(x=>x.id===id); if(t){t.url=e.url; if(id===activeId) $("address").value=e.url;} });
  view.addEventListener("did-start-loading", () => { const t=tabs.find(x=>x.id===id); if(t)t.loading=true;renderTabs(); });
  view.addEventListener("did-stop-loading", () => { const t=tabs.find(x=>x.id===id); if(t){t.loading=false;renderTabs();} });
  view.addEventListener("new-window", e => { createTab(e.url, true); });
  view.addEventListener("dom-ready", () => {
    // Keep the browser chrome outside the embedded page. Page scripts remain isolated.
  });
  webviewsEl.appendChild(view);
  const tab = {id, title:"New tab", url:null, view, workspace:activeWorkspace};
  tabs.push(tab);
  if (url) navigateTab(tab, url);
  if (activate) activateTab(id);
  renderTabs();
  return tab;
}
function navigateTab(tab, url) {
  const target = normalizeAddress(url); if (!target) return;
  tab.url = target; tab.title = "Loading…";
  tab.view.loadURL(target).catch(() => toast("This page could not be loaded."));
  if (tab.id === activeId) { $("address").value = target; startPage.style.display="none"; webviewsEl.style.display="block"; }
  renderTabs();
}
function activateTab(id) {
  activeId=id;
  const tab=activeTab();
  tabs.forEach(t=>{t.view.classList.toggle("active",t.id===id);});
  if(tab && tab.url){startPage.style.display="none";webviewsEl.style.display="block";$("address").value=tab.url;}
  else {startPage.style.display="block";webviewsEl.style.display="none";$("address").value="";}
  renderTabs();
}
function closeTab(id) {
  const index=tabs.findIndex(t=>t.id===id); if(index<0)return;
  tabs[index].view.remove(); tabs.splice(index,1);
  if(!tabs.length) createTab();
  else if(activeId===id) activateTab(tabs[Math.max(0,index-1)].id);
  renderTabs();
}
function renderTabs() {
  tabsEl.innerHTML="";
  tabs.filter(t=>t.workspace===activeWorkspace).forEach(t=>{
    const el=document.createElement("div");el.className="tab"+(t.id===activeId?" active":"");
    const title=document.createElement("span");title.className="tab-title";title.textContent=(t.loading?"◌ ":"")+t.title;
    const close=document.createElement("span");close.className="tab-close";close.textContent="×";close.title="Close tab";
    close.addEventListener("click",e=>{e.stopPropagation();closeTab(t.id);});
    el.append(title,close);el.addEventListener("click",()=>activateTab(t.id));tabsEl.appendChild(el);
  });
}
function go(url) { const tab=activeTab()||createTab(); navigateTab(tab,url); }
function showPanel(title, body) {
  $("panelContent").innerHTML=`<div class="panel-head"><h2>${title}</h2><button class="close-panel" id="closePanel">×</button></div>${body}`;
  $("panelOverlay").classList.remove("hidden");
  $("closePanel").onclick=()=> $("panelOverlay").classList.add("hidden");
}
$("panelOverlay").addEventListener("click",e=>{if(e.target===$("panelOverlay"))$("panelOverlay").classList.add("hidden");});
$("newTab").onclick=()=>createTab();
$("addressForm").onsubmit=e=>{e.preventDefault();go($("address").value);};
$("heroSearch").onsubmit=e=>{e.preventDefault();go($("heroInput").value);};
$("backBtn").onclick=()=>{const t=activeTab();if(t?.view.canGoBack())t.view.goBack();};
$("forwardBtn").onclick=()=>{const t=activeTab();if(t?.view.canGoForward())t.view.goForward();};
$("reloadBtn").onclick=()=>activeTab()?.view.reload();
$("homeBtn").onclick=()=>{const t=activeTab();if(t){t.url=null;t.title="New tab";}activateTab(activeId);};
$("bookmarkBtn").onclick=()=>{const t=activeTab();if(!t?.url)return toast("Open a page first.");let b=JSON.parse(localStorage.getItem("nexora-bookmarks")||"[]");if(!b.some(x=>x.url===t.url)){b.push({title:t.title,url:t.url});localStorage.setItem("nexora-bookmarks",JSON.stringify(b));toast("Bookmark saved.");}else toast("Already bookmarked.");};
$("pipBtn").onclick=async()=>{const t=activeTab();if(!t?.url)return toast("Open a video page first.");try{await t.view.executeJavaScript(`(async()=>{const v=[...document.querySelectorAll('video')].find(x=>x.readyState>=2);if(!v)throw Error('No video found');await v.requestPictureInPicture();return true})()`);toast("Picture-in-picture started.");}catch{toast("No playable video found on this page.");}};
$("sidebarToggle").onclick=()=>$("socialSidebar").classList.toggle("collapsed");
$("themeBtn").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("nexora-theme",document.body.classList.contains("light")?"light":"dark");};
if(localStorage.getItem("nexora-theme")==="light")document.body.classList.add("light");
document.querySelectorAll("[data-url]").forEach(el=>el.addEventListener("click",()=>go(el.dataset.url)));
document.querySelectorAll(".social-item").forEach(el=>el.addEventListener("click",()=>{document.querySelectorAll(".social-item").forEach(x=>x.classList.remove("active"));el.classList.add("active");go(el.dataset.url);}));
$("addSocial").onclick=()=>{showPanel("Add a social shortcut",`<p class="panel-copy">Add a website to your Social Space. Use a full website address.</p><label class="field-label">Name</label><input class="panel-input" id="socialName" placeholder="My community"><label class="field-label">Website URL</label><input class="panel-input" id="socialUrl" placeholder="https://example.com"><br><br><button class="primary-btn" id="saveSocial">Add shortcut</button>`);$("saveSocial").onclick=()=>{const name=$("socialName").value.trim(),url=normalizeAddress($("socialUrl").value);if(!name||!url)return toast("Enter a name and valid address.");addSocialItem(name,url);$("panelOverlay").classList.add("hidden");};};
function addSocialItem(name,url){const btn=document.createElement("button");btn.className="social-item";btn.innerHTML=`<span class="social-icon xx">✦</span><span></span>`;btn.querySelector("span:last-child").textContent=name;btn.onclick=()=>go(url);$("socialSidebar").insertBefore(btn,$("socialSidebar").querySelector(".side-bottom"));}

$("workspaceBtn").onclick=()=>{showPanel("Workspaces",`<p class="panel-copy">Separate your tabs by task. Switching workspaces keeps each set of tabs organized.</p><div class="workspace-list" id="workspaceList"></div><label class="field-label">Create workspace</label><div style="display:flex;gap:8px"><input class="panel-input" id="workspaceName" placeholder="e.g. School"><button class="primary-btn" id="createWorkspace">Create</button></div>`);renderWorkspaceList();$("createWorkspace").onclick=()=>{const name=$("workspaceName").value.trim();if(!name||workspaces.includes(name))return toast("Choose a new workspace name.");workspaces.push(name);renderWorkspaceList();};};
function renderWorkspaceList(){const list=$("workspaceList");if(!list)return;list.innerHTML="";workspaces.forEach(name=>{const b=document.createElement("button");b.className="workspace-choice"+(name===activeWorkspace?" active":"");b.textContent=(name===activeWorkspace?"✓  ":"")+name;b.onclick=()=>{activeWorkspace=name;const current=tabs.find(t=>t.id===activeId);if(current&&current.workspace!==name)activeId=null;let first=tabs.find(t=>t.workspace===name);if(!first)first=createTab(null,false),first.workspace=name;if(!activeId)activateTab(first.id);else activateTab(activeId);renderTabs();renderWorkspaceList();};list.appendChild(b);});}
$("settingsBtn").onclick=async()=>{showPanel("NEXORA settings",`<p class="panel-copy">Personalize your browser experience.</p><div class="panel-row"><span>Theme</span><select id="themeSelect"><option value="dark">Futuristic dark</option><option value="light">Light</option></select></div><div class="panel-row"><span>Built-in ad blocker</span><input type="checkbox" id="adBlockToggle" checked></div><div class="panel-row"><span>Search engine</span><select id="searchEngine"><option value="google">Google</option><option value="bing">Bing</option><option value="duck">DuckDuckGo</option></select></div><p class="panel-copy">Ad blocking uses a small built-in domain list. Some ads and trackers may still appear; certain sites may need the blocker disabled.</p>`);$("themeSelect").value=document.body.classList.contains("light")?"light":"dark";$("themeSelect").onchange=e=>{document.body.classList.toggle("light",e.target.value==="light");localStorage.setItem("nexora-theme",e.target.value);};$("adBlockToggle").checked=await window.nexora.getAdBlock();$("adBlockToggle").onchange=async e=>{adBlockOn=await window.nexora.setAdBlock(e.target.checked);toast(adBlockOn?"Ad blocker enabled":"Ad blocker disabled");};};
$("aiOpen").onclick=()=>{showPanel("NEXORA AI",`<p class="panel-copy">Ask questions, summarize text, or get help with your current task. Add your own OpenAI API key to enable live AI responses. Your key is stored only in this browser profile's local storage. API usage may incur charges.</p><label class="field-label">OpenAI API key</label><input class="panel-input" id="apiKey" type="password" placeholder="sk-..."><label class="field-label">Ask NEXORA</label><textarea class="panel-textarea" id="aiPrompt" placeholder="What can I help you with?"></textarea><br><br><button class="primary-btn" id="askAI">Ask AI</button><div id="aiAnswer" class="panel-copy" style="white-space:pre-wrap;margin-top:14px"></div>`);$("apiKey").value=localStorage.getItem("nexora-openai-key")||"";$("apiKey").onchange=e=>localStorage.setItem("nexora-openai-key",e.target.value.trim());$("askAI").onclick=askAI;};
async function askAI(){const key=$("apiKey").value.trim(),prompt=$("aiPrompt").value.trim(),answer=$("aiAnswer");if(!prompt)return toast("Write a question first.");if(!key){answer.textContent="Add an OpenAI API key above to enable the AI assistant. You can create a key from the OpenAI developer platform.";return;}answer.textContent="Thinking…";$("askAI").disabled=true;try{const res=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify({model:"gpt-4.1-mini",input:prompt})});const data=await res.json();if(!res.ok)throw Error(data.error?.message||"API request failed");answer.textContent=data.output?.flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n")||"No text response received.";}catch(e){answer.textContent="AI error: "+e.message;}finally{$("askAI").disabled=false;}}
$("notesOpen").onclick=()=>{showPanel("Quick notes",`<p class="panel-copy">Notes are saved locally on this device.</p><textarea class="panel-textarea" id="notesText" placeholder="Write something to remember…"></textarea><br><br><button class="primary-btn" id="saveNotes">Save notes</button>`);$("notesText").value=localStorage.getItem("nexora-notes")||"";$("saveNotes").onclick=()=>{localStorage.setItem("nexora-notes",$("notesText").value);toast("Notes saved.");$("panelOverlay").classList.add("hidden");};};
function updateClock(){const d=new Date();$("clock").textContent=d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});}
setInterval(updateClock,1000);updateClock();
createTab();
