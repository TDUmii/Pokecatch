import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { itemCatalog } from './item-catalog.mjs';
const origin='https://pokecatchvn.xyz/';
const files=['app.js','app.css','boot.js','original.html'];
const sources=await Promise.all(files.map(f=>fs.readFile('.research/'+f,'utf8')));
const js=sources[0], paths=new Map();
function add(p,reason){p=p.replace(/^\/+|[?#].*$/g,'');if(!/^(assets|intros)\/[\w./%-]+$/.test(p)||p.includes('..'))return;paths.set(p,[...new Set([...(paths.get(p)||[]),reason])]);}
function literals(s,reason){for(const m of s.matchAll(/assets\/[\w./%-]+\.(?:png|gif|webp|jpe?g|svg|woff2?|ttf|mp3|ogg|wav)/g))add(m[0],reason);for(const m of s.matchAll(/(?:items|ui|badges)\/[\w./%-]+\.(?:png|svg|gif)/g))add('assets/'+m[0],reason);}
sources.forEach((s,i)=>literals(s,files[i]));
// Evaluate the self-contained scene data only; its arrays generate Hoenn backgrounds.
const sceneStart=js.indexOf('t.SCENES=(()=>{')+'t.SCENES=(()=>{'.length;
const sceneEnd=js.indexOf('const ne={',sceneStart);
const scenes=vm.runInNewContext('(()=>{'+js.slice(sceneStart,sceneEnd)+'return a})()',{}, {timeout:2000});
for(const scene of Object.values(scenes))if(scene.src)add(scene.src,'SCENES data');
const ids=[...new Set([...js.matchAll(/"assets\/pokemon\/(\d+)\.png"/g)].map(m=>m[1]))];
for(const id of ids){add(`assets/pokemon/${id}.png`,'sprite IDs');add(`assets/pokemon/shiny/${id}.png`,'UI.mon source rule');if(+id>=20101&&+id<=20127)continue;for(const shiny of ['','shiny/']){add(`assets/pokemon/art/${shiny}${id}.gif`,'UI.art source rule');add(`assets/pokemon/art/${shiny}still/${id}.png`,'UI.art still source rule');}}
for(const m of js.matchAll(/(?:sprite|look):["']([\w-]+)["']/g)){add(`assets/trainers/${m[1]}.png`,'trainer data sprite');add(`assets/trainers/still/${m[1]}.png`,'trainer face rule');}
for(const m of js.matchAll(/scene:["']([\w-]+)["']/g))add(`assets/bg/scenes/${m[1]}-710x400.webp`,'scene property');
for(let n=1;n<=8;n++)add(`assets/badges/frlg-${n}.png`,'badgeSheet rule');
for(const k of ['exp-candy-s','exp-candy-m','exp-candy-xl','exp-candy-big','rare-candy'])for(const suffix of ['','-m'])add(`assets/ui/frame-candy/${k}${suffix}.png`,'frame-candy data');
for(const k of ['upbeat','sleepy-time','joyful','rowdy','zoned-out','charismatic','smiley','excited','teary'])add(`assets/ui/marks/${k}.png`,'Pension emotion data');

// Trainer wardrobe uses an explicit ordered array, beyond adventure opponents.
const wardrobeAt=js.indexOf('"kimonogirl-hgss"');
const wardrobeStart=js.lastIndexOf('[',wardrobeAt), wardrobeEnd=js.indexOf(']',wardrobeAt);
for(const k of vm.runInNewContext(js.slice(wardrobeStart,wardrobeEnd+1))){add(`assets/trainers/${k}.png`,'wardrobe array');add(`assets/trainers/still/${k}.png`,'wardrobe face rule');}
for(const k of ['gold','silver','bronze'])add(`assets/ui/medal-${k}.png`,'leaderboard medal data');
for(const k of ['flooded','volcanic','crystal','dark','ancient','galleries']){add(`assets/ui/underground/rock-${k}.png`,'underground explicit theme set');add(`assets/bg/underground/${k}.png`,'underground explicit theme set');}
for(const k of ['common','uncommon','rare','legendary'])add(`assets/ui/underground/geode-${k}.png`,'GeodeFx data');
for(const k of [...new Set([...js.matchAll(/types:\[([^\]]+)\]/g)].flatMap(m=>[...m[1].matchAll(/"(\w+)"/g)].map(x=>x[1])))])add(`assets/items/gem-${k}.png`,'GeodeFx type rule');

// Item icon renderer takes keys from the game's ITEM_NAMES dictionary.
for(const item of itemCatalog(js))add(item.path,'complete ITEM_NAMES icon rule');

// Public supplementary source is read solely for its Mega artwork mapping.
let megaSource='';try{megaSource=await fs.readFile('.research/admin-suite.js','utf8')}catch{}
literals(megaSource,'public supplementary source literals');
for(const m of megaSource.matchAll(/spriteKey:\s*"([\w-]+)"/g)){for(const shiny of ['','shiny/']){add(`assets/pokemon/mega/${shiny}${m[1]}.png`,'Mega spriteKey table');for(const back of ['','back/']){add(`assets/pokemon/mega/art/${back}${shiny}${m[1]}.gif`,'Mega art source rule');add(`assets/pokemon/mega/art/${back}${shiny}still/${m[1]}.png`,'Mega still source rule');}}}
add('intros/legend-intros.html','boot.js intro URL');
for(const f of await fs.readdir('assets/fonts').catch(()=>[]))add('assets/fonts/'+f,'localized intro fonts from Google Fonts CSS');
let done=0;const results=[];
function valid(p,b){if(b.subarray(0,4).equals(Buffer.from([80,75,67,1])))return 'pkc-packed';if(p.endsWith('.png'))return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':null;if(p.endsWith('.gif'))return /^GIF8[79]a$/.test(b.subarray(0,6).toString())?'gif':null;if(p.endsWith('.webp'))return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'webp':null;if(p.endsWith('.svg'))return b.toString('utf8',0,600).includes('<svg')?'svg':null;if(p.endsWith('.html'))return /<!doctype|<html/i.test(b.toString('utf8',0,600))?'html':null;return b.length>20&&!/<!doctype|<html/i.test(b.toString('utf8',0,100))?'binary':null;}
async function acquire(p,reason){let error;for(let attempt=0;attempt<3;attempt++){try{let b;try{b=await fs.readFile(p);if(!valid(p,b))b=null;}catch{}if(!b){const r=await fetch(new URL(p,origin),{headers:p.includes('/pokemon/mega/')?{'X-PKC-M':'9f4b2e'}:{},signal:AbortSignal.timeout(35000)});if(!r.ok)throw Error('HTTP '+r.status);b=Buffer.from(await r.arrayBuffer());const format=valid(p,b);if(!format)throw Error('invalid signature');await fs.mkdir(path.dirname(p),{recursive:true});await fs.writeFile(p,b);}let originalSha256; if(valid(p,b)==='pkc-packed'){originalSha256=createHash('sha256').update(b).digest('hex');const key=[250,225,233,245,231,239,237,235,245,252,155,245,152,154,152,156].map(n=>n^170);const decoded=Buffer.alloc(b.length-4);for(let i=4;i<b.length;i++)decoded[i-4]=b[i]^key[(i-4)&15];b=decoded;if(!valid(p,b))throw Error('invalid decoded signature');await fs.writeFile(p,b);}const format=valid(p,b);results.push({path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),format,...originalSha256?{originalSha256,decodedBy:"Public sw.js PKC1 response decoder"}:{},reasons:reason});if(p.endsWith('.html')){let html=b.toString();await fs.writeFile('.research/intro-source.html',html);literals(html,'intro dependencies');for(const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){let u=new URL(m[1],new URL(p,origin));if(u.origin===new URL(origin).origin&&/\.(?:js|css)$/.test(u.pathname)){let dep=await fetch(u).then(r=>r.text());await fs.mkdir(path.dirname(u.pathname.slice(1)),{recursive:true});await fs.writeFile(u.pathname.slice(1),dep);literals(dep,'intro script');}}}return;}catch(e){error=e.message;if(error==='HTTP 404'||error==='HTTP 403')break;await new Promise(r=>setTimeout(r,500*(attempt+1)));}}results.push({path:p,error,reasons:reason});}
let processed=new Set();while(true){let queue=[...paths].filter(([p])=>!processed.has(p));if(!queue.length)break;let cursor=0;await Promise.all(Array.from({length:5},async()=>{while(cursor<queue.length){const [p,r]=queue[cursor++];processed.add(p);await acquire(p,r);if(++done%100===0)console.log(`${done}/${paths.size}`);}}));}
// Keep packed-response provenance when re-running against already decoded local assets.
try{const previous=JSON.parse(await fs.readFile('assets-manifest.json','utf8'));for(const row of results){const old=previous.find(x=>x.path===row.path&&x.sha256===row.sha256);if(old?.originalSha256&&!row.originalSha256)Object.assign(row,{originalSha256:old.originalSha256,decodedBy:old.decodedBy});}}catch{}
results.sort((a,b)=>a.path.localeCompare(b.path));const report={origin,generatedAt:new Date().toISOString(),unsupportedAlternateUnownArt:108,unownNote:'Alternate Unown IDs 20101-20127 are outside UI.hasArt (not FORMS or SPECIALS); UI uses base/shiny PNG, so 108 unsuccessful speculative art expansions removed after source rule verification.',fallbacks:{'assets/bg/scenes/johto-route-glace-710x400.webp':'assets/bg/scenes/johto-route-glace-v2-710x400.webp','assets/ui/pokeball.png':'assets/items/poke-ball.png'},enumeration:'Literal asset references in app/boot/CSS/HTML, evaluated self-contained SCENES data arrays, sprite-bound IDs expanded through actual UI source rules, trainer sprite/look properties, badge/frame/emotion rules, intro dependencies.',total:results.length,downloaded:results.filter(x=>!x.error).length,missing:results.filter(x=>x.error),bytes:results.reduce((n,x)=>n+(x.bytes||0),0)};
await fs.writeFile('assets-manifest.json',JSON.stringify(results.filter(x=>!x.error),null,2));await fs.writeFile('.research/asset-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,missing:report.missing.length}));
