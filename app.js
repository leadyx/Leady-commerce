const KEY="leadyCommerceHorses";
const DEMO=[];

function getHorses(){return JSON.parse(localStorage.getItem(KEY)||"[]").concat(DEMO)}
function saveCustom(arr){localStorage.setItem(KEY,JSON.stringify(arr))}
function customHorses(){return JSON.parse(localStorage.getItem(KEY)||"[]")}
function slug(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function money(n){return n?new Intl.NumberFormat("fr-FR").format(n)+" €":"Prix sur demande"}
function toast(t){const x=document.getElementById("toast");if(!x)return;x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
function favs(){return JSON.parse(localStorage.getItem("leadyFavs")||"[]")}
function toggleFav(id){let a=favs();a=a.includes(id)?a.filter(x=>x!==id):a.concat(id);localStorage.setItem("leadyFavs",JSON.stringify(a));return a}

function card(h){
 const active=favs().includes(h.id);
 const photo=h.photo?`<img src="${h.photo}" alt="${h.name}">`:`<span class="photo-empty">PHOTO À AJOUTER</span>`;
 const status=h.status==="sold"?`<span class="status sold">VENDU</span>`:h.status==="reserved"?`<span class="status">RÉSERVÉ</span>`:"";
 return `<article class="horse-card"><div class="horse-photo">${photo}</div><button class="fav ${active?"active":""}" data-fav="${h.id}" aria-label="Favori">${active?"♥":"♡"}</button><div class="horse-body">${status}<h3>${h.name}</h3><div class="meta">${h.age?`${h.age} ans · `:""}${h.sex||""}${h.discipline?` · ${h.discipline}`:""}</div><p class="desc">${h.summary||""}</p><div class="price">${money(h.price)}</div><a class="btn card-btn" href="horse.html?id=${encodeURIComponent(h.id)}">Voir la fiche</a></div></article>`
}
function renderHome(){
 const grid=document.getElementById("grid");if(!grid)return;
 let all=getHorses(); const q=document.getElementById("q").value.toLowerCase(),d=document.getElementById("discipline").value,s=document.getElementById("sex").value,a=document.getElementById("age").value,sort=document.getElementById("sort").value;
 let list=all.filter(h=>`${h.name} ${h.discipline||""}`.toLowerCase().includes(q)&&(!d||h.discipline===d)&&(!s||h.sex===s)&&(!a||(a==="0-5"?h.age<=5:a==="6-10"?h.age>=6&&h.age<=10:h.age>=11)));
 if(window.onlyFav)list=list.filter(h=>favs().includes(h.id));
 if(sort==="priceAsc")list.sort((x,y)=>(x.price||0)-(y.price||0));if(sort==="priceDesc")list.sort((x,y)=>(y.price||0)-(x.price||0));
 grid.innerHTML=list.map(card).join("");document.getElementById("empty").hidden=!!list.length;document.getElementById("favCount").textContent=favs().length;
 grid.querySelectorAll("[data-fav]").forEach(b=>b.onclick=()=>{toggleFav(b.dataset.fav);renderHome()})
}
if(document.getElementById("grid")){
 ["q","discipline","sex","age","sort"].forEach(id=>document.getElementById(id).oninput=renderHome);
 document.getElementById("favOnly").onclick=()=>{window.onlyFav=!window.onlyFav;document.getElementById("favOnly").classList.toggle("active",window.onlyFav);renderHome()};
 renderHome();
}
if(document.getElementById("detail")){
 const id=new URLSearchParams(location.search).get("id"),h=getHorses().find(x=>x.id===id)||getHorses().find(x=>slug(x.name)===id),el=document.getElementById("detail");
 if(!h){el.innerHTML="<h1>Cheval introuvable</h1><a class='btn' href='index.html'>Retour</a>"}else{
 const photo=h.photo?`<img src="${h.photo}" alt="${h.name}">`:`<span class="photo-empty">PHOTO À AJOUTER</span>`;
 const status=h.status==="sold"?'<span class="status sold">VENDU</span>':h.status==="reserved"?'<span class="status">RÉSERVÉ</span>':'<span class="status">DISPONIBLE</span>';
 el.innerHTML=`<div class="detail-grid"><div class="detail-photo">${photo}</div><div><div>${status}</div><h1>${h.name}</h1><div class="detail-price">${money(h.price)}</div><p class="desc">${h.summary||""}</p><div class="specs">${[["Âge",h.age?h.age+" ans":"—"],["Sexe",h.sex],["Taille",h.height?h.height+" m":"—"],["Race",h.breed],["Discipline",h.discipline],["Localisation",h.location]].map(x=>`<div class="spec"><small>${x[0]}</small><strong>${x[1]||"—"}</strong></div>`).join("")}</div><div class="detail-text">${h.description||""}</div><div class="share-row"><button class="btn" id="share">Partager</button><a class="outline" href="mailto:?subject=${encodeURIComponent("Cheval à vendre — "+h.name)}&body=${encodeURIComponent(location.href)}">Envoyer par e-mail</a></div></div></div>`;
 document.getElementById("share").onclick=async()=>{try{await navigator.share({title:h.name,text:"Découvrez "+h.name+" sur Leady Commerce",url:location.href})}catch(e){await navigator.clipboard?.writeText(location.href);alert("Lien copié.")}};
 }
}
function readFile(file){return new Promise((res,rej)=>{if(!file)return res("");const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}

const login=document.getElementById("login");
if(login){
 const PASS="LEADY2026";
 login.onclick=()=>{if(document.getElementById("pass").value===PASS){sessionStorage.setItem("lcAdmin","1");showAdmin()}else document.getElementById("loginMsg").textContent="Code incorrect."};
 if(sessionStorage.getItem("lcAdmin")==="1")showAdmin();
 document.getElementById("logout").onclick=()=>{sessionStorage.removeItem("lcAdmin");location.reload()};
 document.getElementById("reset").onclick=resetForm;
 document.getElementById("photo").onchange=async()=>{const f=document.getElementById("photo").files[0];if(f)document.getElementById("preview").innerHTML=`<img src="${await readFile(f)}">`};
 document.getElementById("form").onsubmit=async e=>{e.preventDefault();let arr=customHorses(),id=document.getElementById("editId").value||slug(document.getElementById("name").value)+"-"+Date.now(),old=arr.find(x=>x.id===id),file=document.getElementById("photo").files[0],photo=file?await readFile(file):(old?.photo||"");
 const h={id,name:document.getElementById("name").value,status:document.getElementById("status").value,age:+document.getElementById("age").value||0,sex:document.getElementById("sex").value,height:document.getElementById("height").value,breed:document.getElementById("breed").value,discipline:document.getElementById("discipline").value,price:+document.getElementById("price").value||0,location:document.getElementById("location").value,summary:document.getElementById("summary").value,description:document.getElementById("description").value,contact:document.getElementById("contact").value,photo};
 const i=arr.findIndex(x=>x.id===id);if(i>=0)arr[i]=h;else arr.push(h);saveCustom(arr);toast("Annonce enregistrée");resetForm();renderAdminList()};
}
function showAdmin(){document.getElementById("loginBox").hidden=true;document.getElementById("adminApp").hidden=false;renderAdminList()}
function resetForm(){document.getElementById("form").reset();document.getElementById("editId").value="";document.getElementById("preview").innerHTML=""}
function editHorse(id){const h=customHorses().find(x=>x.id===id);if(!h)return;["name","status","age","sex","height","breed","discipline","price","location","summary","description","contact"].forEach(k=>document.getElementById(k).value=h[k]??"");document.getElementById("editId").value=id;document.getElementById("preview").innerHTML=h.photo?`<img src="${h.photo}">`:"";scrollTo(0,0)}
function deleteHorse(id){if(confirm("Supprimer cette annonce ?")){saveCustom(customHorses().filter(x=>x.id!==id));renderAdminList();toast("Annonce supprimée")}}
function renderAdminList(){const el=document.getElementById("adminList");if(!el)return;const arr=customHorses();el.innerHTML=arr.length?arr.map(h=>`<div class="admin-item">${h.photo?`<img class="admin-thumb" src="${h.photo}">`:`<div class="admin-thumb"></div>`}<div><strong>${h.name}</strong><div class="meta">${h.status==="sold"?"Vendu":h.status==="reserved"?"Réservé":"Disponible"} · ${money(h.price)}</div></div><div class="admin-actions"><button onclick="editHorse('${h.id}')">Modifier</button><button class="delete" onclick="deleteHorse('${h.id}')">Supprimer</button></div></div>`).join(""):"<p class='meta'>Aucune annonce personnelle pour le moment.</p>"}
