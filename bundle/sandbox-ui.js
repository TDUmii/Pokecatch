(function(root){
 'use strict';
 let engine,installed=false,unlocked=false,taps=[],dialog,tab='pokemon',selection=null,items=[],message='';
 const key='umi-cheats-unlocked-v1',esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ready=()=>!!engine?.Game?.S?.trainer;
 function reveal(){
  document.querySelectorAll('.ti-menu').forEach(menu=>{if(menu.querySelector('.us-secret-entry'))return;const b=document.createElement('button');b.type='button';b.className='btn outline us-secret-entry';b.textContent='Phòng bí mật';b.onclick=open;menu.append(b)});
  const personal=document.getElementById('personal-dialog');if(personal&&!personal.querySelector('.us-secret-entry')){const section=document.createElement('section');section.innerHTML='<h3>Phòng bí mật</h3><button type="button" class="us-secret-entry">Mở phòng bí mật</button>';section.querySelector('button').onclick=()=>{personal.close();open()};personal.insertBefore(section,personal.querySelector('footer'))}
 }
 function unlock(){unlocked=true;try{localStorage.setItem(key,'1')}catch{}reveal();open()}
 function showResult(result){if(result?.ok===false)throw new Error(result.message);message=result?.message||'Đã lưu thay đổi.';dialog.querySelector('.us-status').textContent=message}
 function list(query=''){
  if(tab==='tools')return;
  items=(tab==='pokemon'?root.UmiCheats.catalogPokemon(query):root.UmiCheats.catalogItems(query));
  const select=dialog.querySelector('[data-picker]');select.innerHTML=items.slice(0,40).map(entry=>`<option value="${esc(entry.id)}">${tab==='pokemon'?'#'+entry.id+' · ':''}${esc(entry.name)}</option>`).join('');
  selection=items[0]||null;dialog.querySelector('.us-count').textContent=items.length?`${items.length} kết quả${items.length>40?' · Hiển thị 40, gõ thêm để thu hẹp':''}`:'Không tìm thấy. Thử tên khác hoặc mã số.';preview();
 }
 function preview(){const host=dialog.querySelector('.us-preview');if(!host)return;host.innerHTML=selection?`<img src="${esc(selection.icon)}" alt=""><div><b>${esc(selection.name)}</b><small>${tab==='pokemon'?'Pokémon số '+selection.id:'Vật phẩm sẽ được thêm vào túi'}</small></div>`:'<p>Chưa có lựa chọn.</p>';dialog.querySelector('[data-submit]').disabled=!ready()||!selection}
 function render(){
  const body=dialog.querySelector('.us-body');dialog.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));
  if(tab==='tools')body.innerHTML=`<section class="us-tools"><h3>Thêm tài nguyên</h3><div class="us-fields"><label>Loại tài nguyên<select name="kind"><option value="money">Pokédollar</option><option value="coin">Xu Sòng bạc</option><option value="scrap">Mảnh đổi thưởng</option><option value="mega-shard">Mảnh Mega</option></select></label><label>Số lượng<input name="amount" type="number" min="1" max="1000000000" value="10000" inputmode="numeric"></label></div><button type="button" data-tool="currency">Thêm tài nguyên</button><h3>Đội hình & Mega</h3><button type="button" data-tool="heal">Hồi phục toàn đội</button><button type="button" data-tool="mega">Mở 48 dạng Mega và 6 ô Mega</button></section>`;
  else body.innerHTML=`<label class="us-search">Tìm ${tab==='pokemon'?'Pokémon':'vật phẩm'}<input type="search" data-search placeholder="${tab==='pokemon'?'Tên hoặc số Pokédex':'Tên vật phẩm hoặc mã'}" autocomplete="off"></label><p class="us-count"></p><label>Chọn ${tab==='pokemon'?'Pokémon':'vật phẩm'}<select data-picker size="4" aria-label="Kết quả tìm kiếm"></select></label><div class="us-preview"></div><div class="us-fields">${tab==='pokemon'?'<label>Cấp độ<input name="level" type="number" min="1" max="100" value="5" inputmode="numeric"></label>':''}<label>Số lượng<input name="quantity" type="number" min="1" max="${tab==='pokemon'?'100':'1000000'}" value="1" inputmode="numeric"></label></div>${tab==='pokemon'?'<label class="us-shiny"><input name="shiny" type="checkbox"> Pokémon khác màu</label>':''}<button type="button" data-submit>${tab==='pokemon'?'Thêm Pokémon vào PC':'Thêm vật phẩm'}</button>`;
  dialog.querySelector('.us-not-ready').hidden=ready();body.querySelectorAll('button,input,select').forEach(el=>el.disabled=!ready());if(tab!=='tools'&&ready())list();dialog.querySelector('.us-status').textContent=message;
 }
 function open(){
  if(!unlocked)return;if(dialog?.open){dialog.focus();return}
  dialog=document.createElement('dialog');dialog.className='us-dialog';dialog.setAttribute('aria-labelledby','us-title');dialog.innerHTML='<header><div><h2 id="us-title">Phòng bí mật</h2><p>Chọn quà cho hành trình của bạn.</p></div><button type="button" class="us-close" aria-label="Đóng phòng bí mật">×</button></header><nav aria-label="Quà bí mật"><button type="button" data-tab="pokemon">Pokémon</button><button type="button" data-tab="items">Vật phẩm</button><button type="button" data-tab="tools">Tiện ích</button></nav><p class="us-not-ready">Hãy bắt đầu hoặc tiếp tục hành trình trước khi nhận quà.</p><div class="us-body"></div><p class="us-status" role="status" aria-live="polite"></p>';
  dialog.querySelector('.us-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();dialog=null});
  dialog.addEventListener('input',e=>{if(e.target.matches('[data-search]'))list(e.target.value)});dialog.addEventListener('change',e=>{if(e.target.matches('[data-picker]')){selection=items.find(item=>String(item.id)===e.target.value);preview()}});
  dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;try{if(b.dataset.tab){tab=b.dataset.tab;message='';render();return}if(!ready())return;const value=name=>dialog.querySelector(`[name="${name}"]`);if(b.hasAttribute('data-submit')&&selection)showResult(tab==='pokemon'?root.UmiCheats.grantPokemon({id:Number(selection.id),level:Number(value('level').value),quantity:Number(value('quantity').value),shiny:value('shiny').checked}):root.UmiCheats.grantItem(selection.id,Number(value('quantity').value)));if(b.dataset.tool==='currency')showResult(root.UmiCheats.grantCurrency({kind:value('kind').value,amount:Number(value('amount').value)}));if(b.dataset.tool==='heal')showResult(root.UmiCheats.healTeam());if(b.dataset.tool==='mega')showResult(root.UmiCheats.unlockMega())}catch(error){dialog.querySelector('.us-status').textContent=error.message||'Chưa thể nhận quà. Hãy thử lại.'}});
  document.body.append(dialog);render();dialog.showModal();
 }
 function install(value){if(installed)return;installed=true;engine=value;try{unlocked=localStorage.getItem(key)==='1'}catch{}
  const prepare=()=>{document.querySelectorAll('.title-fx .ti-logo').forEach(logo=>{if(logo.dataset.usSecret)return;logo.dataset.usSecret='1';logo.tabIndex=0;logo.setAttribute('role','button');logo.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();logo.click()}})});if(unlocked)reveal()};
  document.addEventListener('click',e=>{if(unlocked||!e.target.closest('.title-fx .ti-logo'))return;const now=Date.now();taps=taps.filter(at=>now-at<=4000);taps.push(now);if(taps.length>=7){taps=[];unlock()}});prepare();new MutationObserver(prepare).observe(document.body,{childList:true,subtree:true});
 }
 root.UmiSandboxUI={install,open};
 const previous=root.__setInternalPoke;
 root.__setInternalPoke=value=>{previous?.(value);root.UmiCheats.install(value);install(value)};
})(globalThis);
