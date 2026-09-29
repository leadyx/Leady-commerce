/* Leady Commerce — production Supabase version */
const SUPABASE_URL = "https://mvexjrfjrzwxbrtsxujo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_L3wcqYX1tnCSQf3N7pndoQ_wPF-enzk";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const FAV_KEY = "leadyFavs";
const BUCKET = "horse-media";

function favs(){ try{return JSON.parse(localStorage.getItem(FAV_KEY)||"[]")}catch{return[]}}
function toggleFav(id){let a=favs();a=a.includes(id)?a.filter(x=>x!==id):a.concat(id);localStorage.setItem(FAV_KEY,JSON.stringify(a));return a}
function slug(s){return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function money(n){return n ? new Intl.NumberFormat("fr-FR").format(n)+" €" : "Prix sur demande"}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function toast(t){const x=document.getElementById("toast");if(!x)return;x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2400)}
function mediaFor(h,type="image"){return (h.horse_media||[]).filter(m=>m.media_type===type).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))}
function mainPhoto(h){const m=mediaFor(h,"image")[0];return m?.public_url||""}

async function fetchHorses(){
  const {data,error}=await sb.from("horses").select("*").order("created_at",{ascending:false});
  if(error) throw error;
  if(!data?.length)return [];
  const ids=data.map(h=>h.id);
  const {data:media,error:me}=await sb.from("horse_media").select("*").in("horse_id",ids).order("sort_order",{ascending:true});
  if(me) throw me;
  const by={};(media||[]).forEach(m=>(by[m.horse_id]??=[]).push(m));
  return data.map(h=>({...h,horse_media:by[h.id]||[]}));
}

function card(h){
 const active=favs().includes(h.id), photo=mainPhoto(h);
 const image=photo?`<img src="${esc(photo)}" alt="${esc(h.name)}">`:`<span class="photo-empty">PHOTO À AJOUTER</span>`;
 const status=h.status==="sold"?`<span class="status sold">VENDU</span>`:h.status==="reserved"?`<span class="status">RÉSERVÉ</span>`:"";
 return `<article class="horse-card"><div class="horse-photo">${image}</div><button class="fav ${active?"active":""}" data-fav="${esc(h.id)}" aria-label="Favori">${active?"♥":"♡"}</button><div class="horse-body">${status}<h3>${esc(h.name)}</h3><div class="meta">${h.age?`${esc(h.age)} ans · `:""}${esc(h.sex||"")}${h.discipline?` · ${esc(h.discipline)}`:""}</div><p class="desc">${esc(h.summary||"")}</p><div class="price">${money(h.price)}</div><a class="btn card-btn" href="horse.html?slug=${encodeURIComponent(h.slug||slug(h.name))}">Voir la fiche</a></div></article>`
}

async function renderHome(){
 const grid=document.getElementById("grid");if(!grid)return;
 try{
  const all=await fetchHorses();
  let list=all;
  const q=(document.getElementById("q")?.value||"").toLowerCase(),d=document.getElementById("discipline")?.value||"",s=document.getElementById("sex")?.value||"",a=document.getElementById("age")?.value||"",sort=document.getElementById("sort")?.value||"recent";
  list=list.filter(h=>`${h.name} ${h.discipline||""} ${h.breed||""} ${h.location||""}`.toLowerCase().includes(q)&&(!d||h.discipline===d)&&(!s||h.sex===s)&&(!a||(a==="0-5"&&h.age<=5)||(a==="6-10"&&h.age>=6&&h.age<=10)||(a==="11+"&&h.age>=11)));
  if(window.onlyFav)list=list.filter(h=>favs().includes(h.id));
  if(sort==="priceAsc")list.sort((x,y)=>(x.price||0)-(y.price||0));
  if(sort==="priceDesc")list.sort((x,y)=>(y.price||0)-(x.price||0));
  grid.innerHTML=list.map(card).join("");
  const empty=document.getElementById("empty");if(empty)empty.hidden=!!list.length;
  const fc=document.getElementById("favCount");if(fc)fc.textContent=favs().length;
  grid.querySelectorAll("[data-fav]").forEach(b=>b.onclick=()=>{toggleFav(b.dataset.fav);renderHome()});
 }catch(e){console.error(e);grid.innerHTML="<div class='empty'>Impossible de charger les annonces pour le moment.</div>"}
}

if(document.getElementById("grid")){
 ["q","discipline","sex","age","sort"].forEach(id=>document.getElementById(id)?.addEventListener("input",renderHome));
 document.getElementById("favOnly")?.addEventListener("click",()=>{window.onlyFav=!window.onlyFav;document.getElementById("favOnly").classList.toggle("active",window.onlyFav);renderHome()});
 renderHome();
}

async function renderDetail(){
 const el=document.getElementById("detail");if(!el)return;
 const params=new URLSearchParams(location.search),wanted=params.get("slug")||params.get("id");
 try{
  let q=sb.from("horses").select("*").limit(1);
  q=wanted?.match(/^[0-9a-f-]{36}$/i)?q.eq("id",wanted):q.eq("slug",wanted||"");
  const {data,error}=await q;
  if(error)throw error;
  const h=data?.[0];
  if(!h){el.innerHTML="<h1>Cheval introuvable</h1><a class='btn' href='index.html'>Retour</a>";return}
  const {data:media,error:me}=await sb.from("horse_media").select("*").eq("horse_id",h.id).order("sort_order",{ascending:true});
  if(me)throw me;h.horse_media=media||[];
  const imgs=mediaFor(h,"image"),vids=mediaFor(h,"video");
  const first=imgs[0]?.public_url;
  const photo=first?`<img src="${esc(first)}" alt="${esc(h.name)}">`:`<span class="photo-empty">PHOTO À AJOUTER</span>`;
  const gallery=imgs.length>1?`<div class="media-grid">${imgs.map(m=>`<img src="${esc(m.public_url)}" alt="${esc(h.name)}">`).join("")}</div>`:"";
  const videos=vids.length?`<div class="video-list">${vids.map(m=>`<video controls preload="metadata" src="${esc(m.public_url)}"></video>`).join("")}</div>`:"";
  const status=h.status==="sold"?'<span class="status sold">VENDU</span>':h.status==="reserved"?'<span class="status">RÉSERVÉ</span>':'<span class="status">DISPONIBLE</span>';
  el.innerHTML=`<div class="detail-grid"><div><div class="detail-photo">${photo}</div>${gallery}${videos}</div><div><div>${status}</div><h1>${esc(h.name)}</h1><div class="detail-price">${money(h.price)}</div><p class="desc">${esc(h.summary||"")}</p><div class="specs">${[["Âge",h.age?h.age+" ans":"—"],["Sexe",h.sex],["Taille",h.height?h.height+" m":"—"],["Race",h.breed],["Origines",h.origins],["Discipline",h.discipline],["Niveau",h.level],["Localisation",h.location]].map(x=>`<div class="spec"><small>${x[0]}</small><strong>${esc(x[1]||"—")}</strong></div>`).join("")}</div><div class="detail-text">${esc(h.description||"")}</div><div class="share-row"><button class="btn" id="share">Partager</button><button class="outline" id="favBtn">${favs().includes(h.id)?"♥ Retirer des favoris":"♡ Ajouter aux favoris"}</button></div><div class="contact-box"><h2>Je suis intéressé(e)</h2><form id="contactForm"><input id="cName" required placeholder="Nom / prénom"><input id="cEmail" type="email" required placeholder="E-mail"><input id="cPhone" placeholder="Téléphone"><textarea id="cMessage" rows="4" placeholder="Votre message"></textarea><button class="btn" type="submit">Envoyer ma demande</button><p id="contactMsg" class="meta"></p></form></div></div></div>`;
  document.getElementById("share").onclick=async()=>{try{await navigator.share({title:h.name,text:"Découvrez "+h.name+" sur Leady Commerce",url:location.href})}catch(e){try{await navigator.clipboard.writeText(location.href);toast("Lien copié")}catch{}}};
  document.getElementById("favBtn").onclick=()=>{toggleFav(h.id);document.getElementById("favBtn").textContent=favs().includes(h.id)?"♥ Retirer des favoris":"♡ Ajouter aux favoris"};
  document.getElementById("contactForm").onsubmit=async e=>{e.preventDefault();const msg=document.getElementById("contactMsg");msg.textContent="Envoi…";const {error}=await sb.from("contact_requests").insert({horse_id:h.id,name:document.getElementById("cName").value,email:document.getElementById("cEmail").value,phone:document.getElementById("cPhone").value,message:document.getElementById("cMessage").value});if(error){console.error(error);msg.textContent="Impossible d’envoyer la demande. Réessayez."}else{msg.textContent="Votre demande a bien été envoyée. Merci !";e.target.reset()}};
 }catch(e){console.error(e);el.innerHTML="<div class='empty'>Impossible de charger cette fiche pour le moment.</div>"}
}
renderDetail();

function fileSafeName(name){return name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]+/g,"-")}
async function uploadMedia(horseId,file,sortOrder){
 const path=`horses/${horseId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${fileSafeName(file.name)}`;
 const {error}=await sb.storage.from(BUCKET).upload(path,file,{upsert:false,cacheControl:"31536000"});
 if(error)throw error;
 const {data}=sb.storage.from(BUCKET).getPublicUrl(path);
 const media_type=file.type.startsWith("video/")?"video":"image";
 const {error:ie}=await sb.from("horse_media").insert({horse_id:horseId,media_type,file_path:path,public_url:data.publicUrl,sort_order:sortOrder});
 if(ie){await sb.storage.from(BUCKET).remove([path]);throw ie}
}

async function checkAdmin(){const {data,error}=await sb.rpc("is_admin");if(error)throw error;return data===true}
async function showAdmin(){document.getElementById("loginBox").hidden=true;document.getElementById("adminApp").hidden=false;await renderAdminList();await renderRequests()}

async function initAdmin(){
 const login=document.getElementById("login");if(!login)return;
 const {data:{session}}=await sb.auth.getSession();
 if(session){try{if(await checkAdmin())await showAdmin();else await sb.auth.signOut()}catch(e){console.error(e)}}
 login.onclick=async()=>{const email=document.getElementById("email").value.trim(),password=document.getElementById("pass").value;const msg=document.getElementById("loginMsg");msg.textContent="Connexion…";const {error}=await sb.auth.signInWithPassword({email,password});if(error){msg.textContent="E-mail ou mot de passe incorrect.";return}try{if(await checkAdmin()){msg.textContent="";await showAdmin()}else{await sb.auth.signOut();msg.textContent="Ce compte n’a pas accès à la gestion."}}catch(e){console.error(e);msg.textContent="Erreur de vérification du compte."}};
 document.getElementById("logout")?.addEventListener("click",async()=>{await sb.auth.signOut();location.reload()});
 document.getElementById("reset")?.addEventListener("click",resetForm);
 document.getElementById("media")?.addEventListener("change",previewMedia);
 document.getElementById("form")?.addEventListener("submit",saveHorse);
}

async function previewMedia(){const box=document.getElementById("preview"),files=[...(document.getElementById("media")?.files||[])];box.innerHTML="";for(const f of files){const url=URL.createObjectURL(f);box.insertAdjacentHTML("beforeend",f.type.startsWith("video/")?`<video controls src="${url}"></video>`:`<img src="${url}" alt="Aperçu">`)}}
function resetForm(){
  const fields = [
    "name","age","breed","origins","character",
    "location","summary","description","level",
    "health","discipline","price"
  ];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = "";
  });

  const status = document.getElementById("status");
  if(status) status.value = "available";

  const sex = document.getElementById("sex");
  if(sex) sex.value = "";

  const editId = document.getElementById("editId");
  if(editId) editId.value = "";

  const preview = document.getElementById("preview");
  if(preview) preview.innerHTML = "";

  const existingMedia = document.getElementById("existingMedia");
  if(existingMedia) existingMedia.innerHTML = "";

  const title = document.querySelector("#form h3");
  if(title) title.textContent = "Nouvelle annonce";

  window.scrollTo({top:0,behavior:"smooth"});
}
async function saveHorse(e){
 e.preventDefault();
 const btn=e.submitter;btn.disabled=true;btn.textContent="Enregistrement…";
 try{
  const editId=document.getElementById("editId").value;
  const name=document.getElementById("name").value.trim();
  const baseSlug=slug(name)||"cheval";
  let horseId=editId;
  if(editId){
   const {data:old,error:oe}=await sb.from("horses").select("slug").eq("id",editId).single();if(oe)throw oe;
   const {error}=await sb.from("horses").update({name,slug:old.slug===baseSlug?old.slug:`${baseSlug}-${Date.now().toString().slice(-6)}`,status:document.getElementById("status").value,age:+document.getElementById("age").value||null,sex:document.getElementById("sex").value,height:document.getElementById("height").value.trim(),breed:document.getElementById("breed").value.trim(),origins:document.getElementById("origins").value.trim(),discipline:document.getElementById("discipline").value.trim(),level:document.getElementById("level").value.trim(),character:document.getElementById("character").value.trim(),health:document.getElementById("health").value.trim(),price:+document.getElementById("price").value||null,location:document.getElementById("location").value.trim(),summary:document.getElementById("summary").value.trim(),description:document.getElementById("description").value.trim(),updated_at:new Date().toISOString()}).eq("id",editId);if(error)throw error;
  }else{
   const newSlug=`${baseSlug}-${Date.now().toString().slice(-6)}`;
   const {data,error}=await sb.from("horses").insert({name,slug:newSlug,status:document.getElementById("status").value,age:+document.getElementById("age").value||null,sex:document.getElementById("sex").value,height:document.getElementById("height").value.trim(),breed:document.getElementById("breed").value.trim(),origins:document.getElementById("origins").value.trim(),discipline:document.getElementById("discipline").value.trim(),level:document.getElementById("level").value.trim(),character:document.getElementById("character").value.trim(),health:document.getElementById("health").value.trim(),price:+document.getElementById("price").value||null,location:document.getElementById("location").value.trim(),summary:document.getElementById("summary").value.trim(),description:document.getElementById("description").value.trim()}).select().single();if(error)throw error;horseId=data.id;
  }
  const files=[...(document.getElementById("media")?.files||[])];
  if(files.length){const {count}=await sb.from("horse_media").select("id",{count:"exact",head:true}).eq("horse_id",horseId);let order=count||0;for(const f of files){await uploadMedia(horseId,f,order++);}}
  toast("Annonce enregistrée");resetForm();await renderAdminList();
 }catch(err){console.error(err);alert("Erreur : "+(err.message||"enregistrement impossible"))}finally{btn.disabled=false;btn.textContent="Enregistrer l’annonce"}
}

async function renderAdminList(){
 const el=document.getElementById("adminList");if(!el)return;
 try{const arr=await fetchHorses();el.innerHTML=arr.length?arr.map(h=>{const p=mainPhoto(h);return `<div class="admin-item">${p?`<img class="admin-thumb" src="${esc(p)}">`:`<div class="admin-thumb"></div>`}<div><strong>${esc(h.name)}</strong><div class="meta">${h.status==="sold"?"Vendu":h.status==="reserved"?"Réservé":"Disponible"} · ${money(h.price)}</div></div><div class="admin-actions"><button onclick="editHorse('${h.id}')">Modifier</button><button class="delete" onclick="deleteHorse('${h.id}')">Supprimer</button></div></div>`}).join(""):"<p class='meta'>Aucune annonce pour le moment.</p>"}catch(e){console.error(e);el.innerHTML="<p class='error'>Impossible de charger les annonces.</p>"}
}

async function editHorse(id){
 try{const {data:h,error}=await sb.from("horses").select("*").eq("id",id).single();if(error)throw error;const {data:media,error:me}=await sb.from("horse_media").select("*").eq("horse_id",id).order("sort_order",{ascending:true});if(me)throw me;
 ["name","status","age","sex","height","breed","origins","discipline","level","character","health","price","location","summary","description"].forEach(k=>{const el=document.getElementById(k);if(el)el.value=h[k]??""});document.getElementById("editId").value=id;document.getElementById("preview").innerHTML="";document.getElementById("existingMedia").innerHTML=(media||[]).map(m=>`<div class="existing-media"><${m.media_type==="video"?`video controls src="${esc(m.public_url)}"`:`img src="${esc(m.public_url)}" alt="${esc(h.name)}"`} class="media-thumb"></${m.media_type==="video"?"video":"img"}><button type="button" onclick="deleteMedia('${m.id}','${esc(m.file_path)}')">Supprimer</button></div>`).join("");document.querySelector("#form h3")?.replaceChildren(document.createTextNode("Modifier l’annonce"));window.scrollTo({top:0,behavior:"smooth"})}catch(e){console.error(e);alert("Impossible de charger l’annonce.")}
}
async function deleteMedia(id,path){if(!confirm("Supprimer ce média ?"))return;try{await sb.storage.from(BUCKET).remove([path]);const {error}=await sb.from("horse_media").delete().eq("id",id);if(error)throw error;await renderAdminList();alert("Média supprimé.");location.reload()}catch(e){console.error(e);alert("Impossible de supprimer ce média.")}}
async function deleteHorse(id){if(!confirm("Supprimer cette annonce et ses médias ?"))return;try{const {data:media}=await sb.from("horse_media").select("file_path").eq("horse_id",id);const paths=(media||[]).map(x=>x.file_path);if(paths.length)await sb.storage.from(BUCKET).remove(paths);const {error}=await sb.from("horses").delete().eq("id",id);if(error)throw error;toast("Annonce supprimée");await renderAdminList()}catch(e){console.error(e);alert("Impossible de supprimer l’annonce.")}}

async function renderRequests(){
 const el=document.getElementById("requests");if(!el)return;try{const {data,error}=await sb.from("contact_requests").select("*, horses(name)").order("created_at",{ascending:false});if(error)throw error;el.innerHTML=data?.length?data.map(r=>`<div class="request-item"><strong>${esc(r.name)}</strong><div class="meta">${esc(r.horses?.name||"Demande générale")} · ${new Date(r.created_at).toLocaleString("fr-FR")}</div><div>${esc(r.email)}${r.phone?` · ${esc(r.phone)}`:""}</div><p>${esc(r.message||"")}</p></div>`).join(""):"<p class='meta'>Aucune demande reçue.</p>"}catch(e){console.error(e);el.innerHTML="<p class='error'>Impossible de charger les demandes.</p>"}}

window.editHorse=editHorse;window.deleteHorse=deleteHorse;window.deleteMedia=deleteMedia;
initAdmin();
const leadyMenuBtn = document.getElementById("menuBtn");
const leadyNav = document.querySelector("header.nav nav");

if(leadyMenuBtn && leadyNav){
  leadyMenuBtn.addEventListener("click",()=>{
    leadyNav.style.display =
      leadyNav.style.display === "flex" ? "none" : "flex";
  });
}
