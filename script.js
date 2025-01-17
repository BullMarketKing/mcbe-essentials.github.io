//Load navigation bars
if(document.getElementById("left")){
  fetch('/navleft.html').then((response) => response.text()).then((data) => {
    document.getElementById("left").innerHTML = data;
    loadApps();
  });
}

if(document.getElementById("head")){
  fetch('/navtop.html').then((response) => response.text()).then((data) => {
    document.getElementById("head").innerHTML = data;
    if(location.hostname == "mcbe-essentials.glitch.me"){ 
      document.getElementById("head").innerHTML += "<span class='devviewstable' onclick='openDevWindow()'>Dev Tools</span>";
    }
  });
}

window.bridge = {
  connected: false,
  openedFile: undefined
};

//General code
if(window.location.href.includes("glitch.me") && window.localStorage.isDev != "true"){
  //Go to stable if "isDev" isn't specified in the localstorage.
  window.location.href = window.location.href.replace("glitch.me", "github.io");
}

if(window.location.host == "mcbe-essentials.glitch.me"){
  //Development mode quirks
  document.title = "[DEV BUILD] MCBE Essentials";
  //document.getElementById("head").innerHTML += "<span style='margin-left:12px;' class='devviewstable' onclick='window.location.href = window.location.href.replace(\"glitch.me\", \"github.io\");'>View Stable Page</span><span class='devviewstable' onclick='reloadCSS();'>Reload Styleshets</span><span class='devviewstable' onclick='reloadCSS();'>Reload Styleshets</span>";
}

var devWindow;
function openDevWindow(){
  devWindow = window.open("/console/", "DevWindow", "width=300,height=400");
  window.onerror = function(error, url, line) {
    //controller.sendLog({acc:'error', data:'ERR:'+error+' URL:'+url+' L:'+line});
    devWindow.newError({data: error, url: url, line: line});
  };
}

if(location.protocol != "https:"){
//window.location.href= (window.location.href).replaceAll("http:", "https:")
}

if(location.href[location.href.length-1] != "/" && location.pathname != "/loopr/" && !location.href.endsWith(".html")){
  window.location.href = location.href + "/";
}

function loadApps(){
  /*if(window.location.pathname == "/home" || window.location.pathname == "/"){
    document.getElementById("left-tools").style.display = "none";
    list = document.getElementsByTagName("tbody")[0];
    for(var i = 0; i < list.getElementsByTagName("td").length; i++){
      loadApp(apps[i], 'main', list.getElementsByTagName("td")[i]);
    }
  } else {
    var list = document.getElementById("left-tools");
    for(var i = 0; i < list.children.length; i++){
      loadApp(apps[i], 'list', list.children[i]);
    }
  }*/
  
  var idModifier = "";
  if(window.location.pathname == "/home" || window.location.pathname == "/"){
    idModifier = "-home";
  }
  for(let category of Object.keys(apps)){
    document.getElementById(category + idModifier).innerHTML = "";
    for(let app of apps[category]){
      var label = document.createElement("a");
      label.classList = ['app-label'];
      document.getElementById(category + idModifier).appendChild(label);
      loadApp(app, label, category);
      
      if(app.subapps){
        var subapplistcontainer = document.createElement("li");
        var subapplist = document.createElement("ul");
        
        for(let subapp of app.subapps){
          var subapplabel = document.createElement("a");
          subapplabel.classList = ['app-label'];
          subapplist.appendChild(subapplabel);
          loadApp(subapp, subapplabel, category);
        }
        
        subapplistcontainer.appendChild(subapplist);
        document.getElementById(category + idModifier).appendChild(subapplistcontainer);
      }
    }
  }
}

function reloadCSS(){
  var links = document.getElementsByTagName("link"); for (var i = 0; i < links.length;i++) { var link = links[i]; if (link.rel === "stylesheet") {link.href += "?"; }}
}

function loadApp(path, elem, category){
  //main;list
  if(!path) return;
  var svg = '<svg viewBox="0 0 24 24" class="' + path.icon.class.list + '">' + path.icon.data + "</svg>";
  elem.innerHTML += svg;
  
  var link = path.link;
  if(location.host == "mcbe-essentials.glitch.me"){
    link = link.replaceAll("github.io", "glitch.me");
    if(path.subapps){
      for(var a = 0; a < path.subapps.length; a++){
        path.subapps[a].link = path.subapps[a].link.replaceAll("github.io", "glitch.me");
      }
    }
  }
  
  if(path.hideEmbedded){
    elem.classList.toggle("hide-embedded", true)
  }
  
  if(window.location.href == link){
    elem.setAttribute("class", "app-label selected");
    document.title = path.name + " - MCBE Essentials";
    document.getElementById(category).parentNode.open = true;
    document.getElementById(category).parentNode.children[0].style.pointerEvents = 'none';
    
    if(document.getElementsByTagName("h1").length !== 0)
    document.getElementsByTagName("h1")[0].innerHTML = '<svg viewBox="0 0 24 24" style="height: 48px; vertical-align: middle;">' + path.icon.data + "</svg> " + path.name;
    
    if(path.discontinued){
      if(typeof path.discontinued == 'string'){
        snackbar(path.discontinued, 0, true)
      } else {
        snackbar('<span style="color:red">This app has been discontinued and is no longer recieving updates.</span>', 0, true)
      }
    }
    
    if(path.confirmUnload){
      doUnload();
    }
  } else {
    if(!path.tba){
      elem.setAttribute("href", link);
    }
  }
  
  var span = document.createElement("span");
  span.innerHTML = path.name;
  
  if(path.tba == true){
    span.innerHTML = "TBA";
  } //Old tag handling
  /*
  if(path.beta == true){
    span.innerHTML += ' <tag class="smalltag" style="background-color:red;color:white;">BETA</tag>';
  }
  if(path.bridge == true){
    span.innerHTML += ' <tag class="smalltag" style="background-color:#0096c7;color:white;">BRIDGE</tag>';
  }*/
  
  if(path.beta || path.bridge || path.hasOwnProperty("tags")){
    let taggroup = document.createElement("div");
    taggroup.classList = ["small-tag-group"];
    
    //Create tags
    if(path.beta){
      let newtag = document.createElement("tag");
      newtag.classList = ["smalltag"];
      newtag.innerHTML = "BETA";
      newtag.style = "background-color:red;color:white;"
      taggroup.appendChild(newtag);
    }
    
    if(path.bridge){
      let newtag = document.createElement("tag");
      newtag.classList = ["smalltag"];
      newtag.innerHTML = "BRIDGE";
      newtag.style = "background-color:#0096c7;color:white;";
      taggroup.appendChild(newtag);
    }
    
    if(path.hasOwnProperty("tags") && path.tags.constructor == Array){
      for(let tag of path.tags){
        let tagtitle = tag.title || "BETA";
        let tagbg = tag.backgroundcolor || "red";
        let tagcol = tag.fontcolor || "white";
        let conditions = tag.conditions || []
        
        let newtag = document.createElement("tag");
        newtag.classList = ["smalltag"];
        if(conditions.includes("!selected")) newtag.classList.toggle("hide-selected", true)
        if(conditions.includes("selected")) newtag.classList.toggle("show-selected", true)
        newtag.innerHTML = tagtitle;
        newtag.style.color = tagcol;
        newtag.style.backgroundColor = tagbg;
        taggroup.appendChild(newtag);
      }
    }
    
    span.appendChild(taggroup);
  }
  
  elem.appendChild(span);
}

//Force disable spellcheck
for(let el of document.getElementsByTagName('textarea')) el.spellcheck = false;
for(let el of document.getElementsByTagName('input')) el.spellcheck = false;

function toggleMenu(btn){
  document.body.classList.toggle("mobile-menu-visible");
}

if(document.getElementById("head")){
  document.getElementById("head").addEventListener("click", function(e){
    if(e.target.hasAttribute('class') && e.target.getAttribute("class").includes("imgicon") && !document.body.classList.contains("embedded-frame")){
      window.location.href="/";
    } else if(document.body.classList.contains("embedded-frame")){
      snackbar("MCBE Essentials is created and maintained by ReBrainerTV. If you've found a bug, join the MCBE Essentials discord server to report it!");
    }
  });
}

if(window.localStorage.lastSavedData){
  delete window.localStorage.lastSavedData;
}

function doUnload(){
  window.addEventListener('beforeunload', function (e) {
    // Cancel the event
    e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
    // Chrome requires returnValue to be set
    e.returnValue = '';
  });
}

/* 
window.onerror = function(error, url, line) {
    controller.sendLog({acc:'error', data:'ERR:'+error+' URL:'+url+' L:'+line});
};
*/

//Detect if page is embedded
if(window.parent != window){
  console.log("Page is operating as an embedded frame.");
  document.body.classList.toggle("embedded-frame", true);
}

function sterilizeJSON(jsonString){
  jsonString = jsonString.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
  return jsonString;
}

//Append snackbar
let snackbarel = document.createElement("snackbar");
snackbarel.id = "snackbar";
document.body.appendChild(snackbarel);
function snackbar(message, delay = 3000, permanent = false) {
  var x = document.getElementById("snackbar");
  x.innerHTML = message;
  if(permanent){
    x.style.visibility = "visible";
  } else if(x.className != "show"){ //Prevent adding an additional delay if snackbar is already visible
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, delay);
  }
}