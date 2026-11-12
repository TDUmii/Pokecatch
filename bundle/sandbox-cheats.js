/* Explicit local sandbox actions. No action runs merely by opening the menu. */
(function(root){
  'use strict';
  let engine;
  const previousProtection=root.__pokeProtectMegaDuplicate;
  root.__pokeProtectMegaDuplicate=mon=>mon?.umiCheatMon===true || !!previousProtection?.(mon);
  const game=()=>engine.Game;
  const rules=()=>root.UmiArcadeRules?.ITEMS||{};
  const fail=message=>{throw new Error(message);};
  const state=()=>root.UmiArcade?.state?.()||(game().S.umiArcade||={items:{}});
  const integer=(value,min,max,label)=>{if(!Number.isSafeInteger(value)||value<min||value>max)fail(`${label} phải từ ${min} đến ${max}.`);return value;};
  const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d');
  const matches=(entry,query)=>normalize(`${entry.id} ${entry.name}`).includes(normalize(query));
  function catalogPokemon(query=''){
    return Object.values(game().DEX||{}).filter(mon=>Number.isSafeInteger(mon.id)).map(mon=>({id:mon.id,name:mon.name,types:[...mon.types],icon:engine.UI?.monSrc?.(mon.id,false)||`assets/pokemon/${mon.id}.png`})).filter(entry=>matches(entry,query));
  }
  function catalogItems(query=''){
    const custom=rules();return [...new Set([...Object.keys(engine.ITEM_NAMES||{}),...Object.keys(custom)])].map(id=>({id,name:custom[id]?.name||engine.UI?.itemName?.(id)||engine.ITEM_NAMES[id],icon:custom[id]?.icon||engine.UI?.itemSrc?.(id)||`assets/items/${id}.png`,custom:!!custom[id]})).filter(entry=>matches(entry,query));
  }
  function transact(action){
    if(!engine||!game().S?.trainer||!Array.isArray(game().S.mons))fail('Hãy vào game và chọn nhân vật trước.');
    if(engine.TabLock?.lost)fail('Game đang chạy ở cửa sổ khác.');
    let result;
    if(root.UmiArcade?.transact)result=root.UmiArcade.transact(action);
    else{
      const before=JSON.stringify(game().S);
      try{result=action();game().save();}catch(error){const save=game().S;for(const key of Object.keys(save))delete save[key];Object.assign(save,JSON.parse(before));throw error;}
    }
    try{engine.App?.refresh?.();}catch(error){/* The transaction is already committed. */}
    return result;
  }
  function grantPokemon({id,level=5,shiny=false,quantity=1,nature,megaKey}={}){
    integer(id,1,Number.MAX_SAFE_INTEGER,'Loài Pokémon');if(!game().DEX[id])fail('Pokémon không có trong dữ liệu game.');
    integer(level,1,engine.CONFIG?.MAX_LEVEL||100,'Cấp');integer(quantity,1,100,'Số lượng');if(typeof shiny!=='boolean')fail('Lựa chọn khác màu không hợp lệ.');
    if(nature!=null)integer(nature,0,(game().NATURES?.length||25)-1,'Tính cách');
    const form=megaKey&&root.UmiMega?.catalog.find(form=>form.key===megaKey&&form.base===id);if(megaKey&&!form)fail('Dạng Mega không phù hợp với Pokémon.');
    if(form){const info=root.UmiMega.progress();if(info.used+quantity>info.capacity)fail('Chưa đủ ô Mega để trang bị các Pokémon này.');}
    return transact(()=>{
      const G=game(),mons=[];
      if(form)root.UmiMega.unlock(form.key);
      for(let i=0;i<quantity;i++){
        const mon=G.makeMon(id,level,{shiny,...nature==null?{}:{nature}});
        mon.reg=G.currentRegion?.().key||G.homeHere?.()||'kanto';mon.umiCheatMon=true;
        if(form)mon.umiMegaKey=form.key;
        mon.hp=G.maxHp(mon);mon.where='Quà từ menu bí mật';
        const family=G.candyFamily?.(id);if(family!=null){G.S.keepDup||={};G.S.keepDup[family]=1;}
        G.S.mons.push(mon);G.registerDex(id,shiny);
        mons.push({uid:mon.uid,id,name:game().DEX[id].name,level,shiny});
      }
      return{ok:true,message:`Đã thêm ${quantity} ${game().DEX[id].name}${shiny?' khác màu':''} cấp ${level} vào PC.`,mons};
    });
  }
  function grantItem(id,qty){
    integer(qty,1,1000000,'Số lượng');const item=catalogItems().find(item=>item.id===id);if(!item)fail('Vật phẩm không có trong dữ liệu game.');
    return transact(()=>{if(root.UmiArcade?.grant)root.UmiArcade.grant({kind:'item',id,qty});else if(item.custom){const s=state(); s.items||={};s.items[id]=(s.items[id]||0)+qty;}else game().addItem(id,qty);return{ok:true,message:`Đã nhận ${qty} ${item.name}.`,items:[{id,qty}]};});
  }
  function grantCurrency({kind,amount}={}){
    integer(amount,1,1000000000,'Số lượng');if(!['money','coin','scrap','mega-shard'].includes(kind))fail('Loại tài nguyên không hợp lệ.');
    if(kind==='mega-shard'){if(!rules()['umi-mega-shard'])fail('Dữ liệu mảnh Mega chưa sẵn sàng.');return transact(()=>{const s=state();s.items||={};s.items['umi-mega-shard']=(s.items['umi-mega-shard']||0)+amount;return{ok:true,message:`Đã nhận ${amount.toLocaleString("vi-VN")} mảnh Mega.`};});}
    return transact(()=>{if(kind==='money')game().earn(amount);else if(kind==='coin')game().coinIn(amount);else{const s=state();s.scrap=(s.scrap||0)+amount;}return{ok:true,message:`Đã nhận ${amount.toLocaleString('vi-VN')} ${kind==='money'?'Pokédollar':kind==='coin'?'xu':'mảnh đổi quà'}.`};});
  }
  function healTeam(){return transact(()=>{const ids=new Set(game().S.team||[]);let count=0;for(const mon of game().S.mons){if(!ids.has(mon.uid))continue;mon.hp=game().maxHp(mon);if(engine.STATUS?.clear)engine.STATUS.clear(mon);else{delete mon.status;delete mon.sleep;delete mon.confused;}count++;}return{ok:true,message:`Đã hồi phục ${count} Pokémon trong đội.`,count};});}
  function unlockMega({forms=true,slots=true}={}){
    if(typeof forms!=='boolean'||typeof slots!=='boolean'||!forms&&!slots)fail('Chọn nội dung Mega muốn mở.');
    if(!root.UmiMega)fail('Dữ liệu Mega chưa sẵn sàng.');
    return transact(()=>{const s=state();if(forms)for(const form of root.UmiMega.catalog)root.UmiMega.unlock(form.key);if(slots)s.megaCapacity=6;return{ok:true,message:`Đã mở ${forms?'tất cả dạng Mega':''}${forms&&slots?' và ':''}${slots?'6 ô Mega':''}.`};});
  }
  root.UmiCheats={install(value){engine=value;},catalogPokemon,catalogItems,pokemon:catalogPokemon,items:catalogItems,grantPokemon,grantItem,grantCurrency,healTeam,unlockMega};
})(globalThis);
