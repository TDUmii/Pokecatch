/* Personal reward arcade. All currency and rewards belong to the local game save. */
(() => {
  'use strict';
  const R = window.UmiArcadeRules;
  let engine, busy = false, normalizedState;
  const G = () => engine.Game;
  const integer = (value, max = 1e9) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;
  const fail = message => { throw new Error(message); };
  const state = () => {
    const save = G().S;
    if (save.umiArcade && save.umiArcade === normalizedState) return normalizedState;
    save.umiArcade = R.normalize(save.umiArcade);
    const s = save.umiArcade;
    s.items = s.items && typeof s.items === 'object' && !Array.isArray(s.items) ? s.items : {};
    for (const id of Object.keys(R.ITEMS)) s.items[id] = integer(s.items[id]);
    s.scrap = integer(s.scrap);
    s.lootUntil = integer(s.lootUntil, Number.MAX_SAFE_INTEGER);
    s.lootWins = integer(s.lootWins);
    s.eggs = Array.isArray(s.eggs) ? s.eggs.filter(egg => egg && G().DEX[egg.id] && typeof egg.key === 'string').slice(0, 20) : [];
    s.megaUnlocks = Array.isArray(s.megaUnlocks) ? s.megaUnlocks.filter(key => window.UmiMega.catalog.some(form => form.key === key)) : [];
    s.nativeFree = integer(s.nativeFree);
    s.nativeReceipts = s.nativeReceipts && typeof s.nativeReceipts === 'object' ? s.nativeReceipts : {};
    if (!s.casinoMerged) {
      s.nativeFree += s.bonus.length;
      s.bonus = [];
      s.casinoMerged = true;
    }
    if (!s.welcomed) {
      s.items['umi-spin-ticket'] += 3;
      s.items['umi-supply-crate'] += 1;
      s.welcomed = true;
    }
    normalizedState = s;
    return s;
  };
  const quantity = id => R.ITEMS[id] ? state().items[id] : integer(G().itemCount(id));
  const itemName = id => R.ITEMS[id]?.name || engine.UI.itemName(id);
  const itemIcon = id => R.ITEMS[id]?.icon || engine.UI.itemSrc(id);
  function add(id, amount) {
    if (!Number.isSafeInteger(amount) || amount === 0 || !R.ITEMS[id] && !engine.ITEM_NAMES[id]) fail('Vật phẩm không hợp lệ.');
    if (quantity(id) + amount < 0) fail(`Bạn chưa có đủ ${itemName(id)}.`);
    if (R.ITEMS[id]) state().items[id] += amount;
    else G().addItem(id, amount);
  }
  function apply(reward) {
    if (reward.kind === 'money') {
      if (!Number.isSafeInteger(reward.amount) || reward.amount <= 0) fail('Phần thưởng tiền không hợp lệ.');
      G().earn(reward.amount);
    } else add(reward.id, reward.qty);
  }
  function refresh() {
    engine.App?.refreshHeader?.();
    if (engine.App?.current === 'casino') window.UmiCasinoUI?.render?.();
  }
  function transact(action) {
    if (busy) fail('Đang xử lý phần thưởng, hãy đợi một chút.');
    if (engine.TabLock?.lost) fail('Game đang chạy ở cửa sổ khác. Hãy chuyển về cửa sổ đang chơi.');
    busy = true;
    state();
    const previous = JSON.stringify(G().S);
    let result;
    try {
      result = action();
      G().save();
    } catch (error) {
      const target = G().S;
      for (const key of Object.keys(target)) delete target[key];
      Object.assign(target, JSON.parse(previous));
      normalizedState = undefined;
      throw error;
    } finally { busy = false; }
    refresh();
    return result;
  }

  function spendMoney(amount) {
    if (!Number.isSafeInteger(amount) || amount < 0 || G().S.money < amount) fail('Chưa đủ Pokédollar cho lượt quay này.');
    if (amount) G().spend(amount, 'casino');
  }
  function spin(machineId, count = 1, payment = 'money') {
    if (!R.MACHINES[machineId] || !(payment === 'bonus' ? Number.isInteger(count)&&count>=1&&count<=10 : [1,10].includes(count))) fail('Lựa chọn lượt quay không hợp lệ.');
    return transact(() => {
      const machine = R.MACHINES[machineId], s = state();
      const bonus = payment === 'bonus';
      if (bonus) {
        if (s.bonus.filter(id => id === machineId).length < count) fail('Chưa đủ lượt miễn phí của máy này.');
        for (let i = 0; i < count; i++) s.bonus.splice(s.bonus.indexOf(machineId), 1);
      } else if (payment === 'ten-ticket') {
        if (machineId !== 'pokemon' || count !== 10) fail('Vé 10 lượt dùng cho máy Pokémon.');
        add('umi-ten-ticket', -1);
      } else if (payment === 'ticket' || machineId === 'pokemon') add('umi-spin-ticket', -count);
      else if (payment === 'money') spendMoney(machine.price * count);
      else fail('Cách thanh toán không hợp lệ.');
      const results = [];
      for (let i = 0; i < count; i++) {
        const result = R.spin(s, machineId, { bonus });
        result.at = Date.now();
        result.rewards.forEach(apply);
        for (let n = 0; n < result.bonusSpins && s.bonus.length < 100; n++) s.bonus.push(machineId);
        const record = s.history[s.history.length - 1];
        record.at = result.at;
        results.push(result);
      }
      return results;
    });
  }
  function buyTickets(count = 1) {
    if (![1, 10].includes(count)) fail('Số lượng vé không hợp lệ.');
    return transact(() => {
      spendMoney(count === 10 ? 45000 : 5000);
      add('umi-spin-ticket', count);
      return { message: `Đã nhận ${count} vé quay Pokémon.` };
    });
  }
  const EVOLUTION = ['fire-stone','water-stone','thunder-stone','leaf-stone','moon-stone','sun-stone','shiny-stone','dusk-stone','dawn-stone','ice-stone','kings-rock','metal-coat','dragon-scale','up-grade','link-cable','soothe-bell'];
  const choiceRewards = [
    { id: 'training', name: 'Bộ huấn luyện', icon: 'assets/items/exp-candy-xl.png', description: '2 kẹo EXP XL', rewards: [{ kind:'item', id:'exp-candy-xl', qty:2 }] },
    { id: 'evolution', name: 'Rương tiến hóa', icon: R.ITEMS['umi-evolution-chest'].icon, description: 'Tự chọn một vật phẩm tiến hóa', rewards: [{ kind:'item', id:'umi-evolution-chest', qty:1 }] },
    { id: 'tickets', name: 'Bộ vé miễn phí', icon: R.ITEMS['umi-spin-ticket'].icon, description: '3 lượt quay Sòng bạc miễn phí', rewards: [{ kind:'item', id:'umi-spin-ticket', qty:3 }] }
  ];
  function region() { return G().currentRegion(); }
  function speciesPool({ missing = false, shiny = false } = {}) {
    const current = region(), cap = G().levelCap();
    const reserved = new Set(state().eggs.map(egg => egg.id));
    return Object.values(G().DEX).filter(mon => Number.isInteger(mon.id) && mon.id >= current.dex[0] && mon.id <= current.dex[1] && !mon.legendary && !mon.mythical && G().minLevelFor(mon.id) <= cap && !reserved.has(mon.id) &&
      !(missing ? G().S.dex[mon.id] : shiny ? G().ownedMons().some(owned => owned.id === mon.id && owned.shiny) : G().isDup({ id: mon.id, shiny:false, reg:current.key })));
  }
  function pokemonChoices(itemId) {
    const s = state(), missing = itemId === 'umi-missing-pass', shiny = itemId === 'umi-shiny-selector';
    let pool = speciesPool({ missing, shiny });
    if (itemId === 'umi-selected-egg') {
      const ids = new Set(pool.map(mon => mon.id));
      if (!Array.isArray(s.eggOffer) || !s.eggOffer.length || s.eggOffer.some(id => !ids.has(id))) {
        const sample = [...pool];
        s.eggOffer = [];
        while (sample.length && s.eggOffer.length < 3) s.eggOffer.push(sample.splice(Math.floor(Math.random() * sample.length), 1)[0].id);
        G().save();
      }
      pool = s.eggOffer.map(id => G().DEX[id]);
    }
    return pool.map(mon => ({ id:String(mon.id), name:mon.name, icon:`assets/pokemon/${shiny?'shiny/':''}${mon.id}.png`, description:engine.UI.types(mon.id).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim() }));
  }
  function choices(itemId) {
    if (itemId === 'umi-choice-ticket') return choiceRewards.map(({rewards,...entry}) => entry);
    if (itemId === 'umi-evolution-chest') return EVOLUTION.filter(id => engine.ITEM_NAMES[id]).map(id => ({id,name:itemName(id),icon:itemIcon(id),description:'Nhận 1 vật phẩm để dùng từ thẻ Pokémon.'}));
    if (itemId === 'umi-mega-selector') return window.UmiMega.catalog.filter(form => !window.UmiMega.unlocked().includes(form.key)).map(form => ({id:form.key,name:form.name,icon:form.src,description:'Mở khóa vĩnh viễn; trang bị cho đúng Pokémon trong mục Mega.'}));
    if (['umi-selected-egg','umi-missing-pass','umi-shiny-selector'].includes(itemId)) return pokemonChoices(itemId);
    if (!R.ITEMS[itemId]) {
      if (engine.CONFIG.BUFF_BERRIES[itemId]) return [];
      if (engine.CONFIG.EXP_CANDIES[itemId] || itemId === 'rare-candy') return G().S.mons.filter(mon => !G().capped(mon)).map(mon => ({id:mon.uid,name:G().DEX[mon.id].name,icon:engine.UI.monSrc(mon,mon.shiny),description:`Cấp ${mon.level} · tăng EXP, áp dụng giới hạn cấp hiện tại.`}));
      return G().S.mons.flatMap(mon => G().itemEvolutions(mon).filter(evo => evo.item === itemId).map(evo => ({id:`${mon.uid}:${evo.to}`,name:G().DEX[mon.id].name,icon:engine.UI.monSrc(mon,mon.shiny),description:`Tiến hóa thành ${G().DEX[evo.to].name}`})));
    }
    return [];
  }
  function receive(id, shiny, source) {
    const game = G(), home = region().key;
    const mon = game.makeMon(id, Math.min(5,game.levelCap()), { shiny });
    mon.reg = home;
    mon.hp = game.maxHp(mon);
    mon.where = source;
    if (game.isDup(mon)) fail('Họ Pokémon này đã đủ chỗ. Vé được giữ lại, hãy chọn loài khác.');
    const received = game.receive(mon,{ home, ask:false });
    if (!game.S.mons.some(owned => owned.uid === mon.uid)) fail('Chưa thể nhận Pokémon này. Phần thưởng được giữ lại.');
    return received;
  }
  function claim(itemId, selected) {
    if (quantity(itemId) < 1) fail('Bạn chưa có vật phẩm này.');
    const options = choices(itemId);
    const option = options.find(entry => String(entry.id) === String(selected));
    const needsChoice = ['umi-choice-ticket','umi-evolution-chest','umi-mega-selector','umi-selected-egg','umi-missing-pass','umi-shiny-selector'].includes(itemId) || !R.ITEMS[itemId] && !engine.CONFIG.BUFF_BERRIES[itemId];
    if (needsChoice && !option) fail(options.length ? 'Hãy chọn phần thưởng trước.' : 'Hiện chưa có lựa chọn phù hợp. Vật phẩm vẫn được giữ trong kho.');
    return transact(() => {
      const s = state();
      let result = { message: `Đã dùng ${itemName(itemId)}.` };
      if (itemId === 'umi-spin-ticket') { result.message='Vé sẽ tự dùng khi bạn nhấn QUAY ở máy Sòng bạc. Không trừ tiền cho lượt đó.'; }
      else if (itemId === 'umi-ten-ticket') { add(itemId,-1); add('umi-spin-ticket',10); result.message='Đã nhận 10 lượt quay miễn phí cho máy Sòng bạc.'; }
      else if (itemId === 'umi-gold-ingot') { add(itemId,-1);G().earn(5000);result.message='Đã đổi thỏi vàng lấy 5.000 ₽.'; }
      else if (itemId === 'umi-supply-crate') {
        add(itemId,-1);
        for (const [id,qty] of [['exp-candy-m',3],['razz-berry',3],['pinap-berry',3]]) add(id,qty);
        result.message='Đã mở thùng: 3 kẹo EXP M, 3 quả Razz và 3 quả Pinap.';
      } else if (itemId === 'umi-choice-ticket') { add(itemId,-1);choiceRewards.find(entry=>entry.id===option.id).rewards.forEach(apply);result.message=`Đã nhận ${option.name}.`; }
      else if (itemId === 'umi-evolution-chest') { add(itemId,-1);add(option.id,1);result.message=`Đã nhận ${option.name}.`; }
      else if (itemId === 'umi-mega-shard') { if(quantity(itemId)<20)fail('Cần 20 mảnh Mega để đổi một vé chọn Đá Mega.');add(itemId,-20);add('umi-mega-selector',1);result.message='Đã đổi 20 mảnh Mega thành một vé chọn Đá Mega.'; }
      else if (itemId === 'umi-mega-selector') { if(!window.UmiMega.unlock(option.id))fail('Dạng Mega này đã được mở. Vé được giữ lại.');add(itemId,-1);result.message=`Đã mở khóa ${option.name}. Vào mục Mega để trang bị.`; }
      else if (itemId === 'umi-selected-egg') {
        if(s.eggs.length>=20)fail('Bạn đang ấp đủ 20 trứng. Hãy nhận trứng đã nở trước.');
        const id=+option.id;
        s.eggs.push({key:`egg-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,id,readyAt:Date.now()+180000,winAt:integer(G().S.stats.wins)+5,shiny:false,reg:region().key});
        delete s.eggOffer;add(itemId,-1);result.message=`Đang ấp trứng ${option.name}: nở sau 3 phút hoặc 5 trận thắng.`;
      } else if (itemId === 'umi-missing-pass') {
        if(s.pendingEncounter)fail('Bạn đã có một vé săn đang chờ. Hoàn thành lần gặp đó trước.');
        s.pendingEncounter={id:+option.id,reg:region().key};add(itemId,-1);result.message=`Sẽ gặp ${option.name} ở lần chạm trán hoang dã phù hợp tiếp theo tại ${engine._t(region().name)}. Tỷ lệ bắt áp dụng như bình thường.`;
      } else if (itemId === 'umi-shiny-selector') {
        const award=receive(+option.id,true,'Sòng bạc của Umi');add(itemId,-1);result={message:`Đã nhận ${option.name} khác màu!`,mon:award.mon};
      } else if (itemId === 'umi-loot-charm') {
        const active=s.lootUntil>Date.now();s.lootUntil=Math.max(Date.now(),s.lootUntil)+3600000;
        if(!active)s.lootWins=integer(G().S.stats.wins);
        add(itemId,-1);result.message='Bùa đã kích hoạt: mỗi 5 trận thắng nhận thêm vật phẩm trong 60 phút. Dùng thêm sẽ cộng thời gian.';
      } else if (engine.CONFIG.BUFF_BERRIES[itemId]) {
        if (!G().useBuffBerry(itemId)) fail('Chưa thể dùng quả mọng này; hiệu lực có thể đã đạt tối đa.');
      } else {
        const [uid,to]=String(option.id).split(':');
        const used=G().useItem(uid,itemId,to?+to:undefined);
        if(!used)fail('Chưa thể dùng vật phẩm cho Pokémon này. Vật phẩm được giữ lại.');
        if(used.evolve){G().evolveMon(used.evolve.uid,used.evolve.to);result.evolve=used.evolve;}
        result.message=`${option.name}: đã dùng ${itemName(itemId)}.`;
      }
      return result;
    });
  }
  function claimEgg(key) {
    return transact(() => {
      const s=state(),egg=s.eggs.find(value=>value.key===key);
      if(!egg)fail('Trứng này đã được nhận hoặc không còn trong kho.');
      if(Date.now()<egg.readyAt&&integer(G().S.stats.wins)<egg.winAt)fail('Trứng chưa sẵn sàng nở.');
      if(region().key!==egg.reg)fail('Hãy trở lại vùng đã nhận trứng để ấp nở.');
      if(G().isDup({id:egg.id,shiny:egg.shiny,reg:egg.reg})){
        s.eggs.splice(s.eggs.indexOf(egg),1);add('umi-selected-egg',1);
        return{message:'Họ Pokémon này đã đủ chỗ. Đã trả lại Trứng tự chọn để bạn chọn loài khác.'};
      }
      const result=receive(egg.id,egg.shiny,'Trứng tự chọn Umi');
      s.eggs.splice(s.eggs.indexOf(egg),1);G().S.stats.hatched=integer(G().S.stats.hatched)+1;
      return {message:`Trứng đã nở thành ${G().DEX[egg.id].name}!`,mon:result.mon};
    });
  }
  function scrapItem(id, qty=1) {
    if(!Number.isSafeInteger(qty)||qty<1||qty>1000000)fail('Số lượng đổi không hợp lệ.');
    const recyclable=!!engine.CONFIG.EXP_CANDIES[id]||id==='rare-candy'||!!engine.CONFIG.BUFF_BERRIES[id]||EVOLUTION.includes(id);
    const value=R.ITEMS[id]?.scrap||(recyclable?Math.max(1,Math.min(100,Math.floor((G().sellPrice(id)||100)/100))):0);
    if(!value)fail('Không thể đổi vật phẩm này.');
    return transact(()=>{add(id,-qty);state().scrap=integer(state().scrap+value*qty);return {message:`Đã nhận ${value*qty} mảnh đổi quà.`};});
  }
  function redeem(id) {
    if(!R.ITEMS[id])fail('Phần thưởng đổi không hợp lệ.');
    return transact(()=>{const s=state(),cost=R.ITEMS[id].cost;if(s.scrap<cost)fail('Chưa đủ mảnh đổi quà.');s.scrap-=cost;add(id,1);return{message:`Đã đổi ${itemName(id)}.`};});
  }
  function setGoal(id) {
    if(!R.ITEMS[id])fail('Mục tiêu không hợp lệ.');
    return transact(()=>{state().goal=id;return{message:`Mục tiêu: ${itemName(id)}.`};});
  }
  function lootTick() {
    if(!engine?.Game?.S||busy)return;
    const s=state(),wins=integer(G().S.stats.wins);
    if(s.lootUntil<=Date.now())return;
    const count=Math.min(100,Math.floor(Math.max(0,wins-s.lootWins)/5));
    if(!count)return;
    transact(()=>{s.lootWins+=count*5;for(let i=0;i<count;i++)add(i%3?'pinap-berry':'exp-candy-s',1);});
    engine.UI.toast(`Bùa chiến lợi phẩm: +${count} vật phẩm.`);
  }
  function snapshot() {
    const s=state();
    const inventory=Object.keys(G().S.items||{}).filter(id=>!R.ITEMS[id]&&quantity(id)>0&&engine.ITEM_NAMES[id]).map(id=>{const usable=!!engine.CONFIG.EXP_CANDIES[id]||id==='rare-candy'||!!engine.CONFIG.BUFF_BERRIES[id]||EVOLUTION.includes(id);return{id,name:itemName(id),icon:itemIcon(id),qty:quantity(id),usable,scrappable:usable}});
    return {state:s,money:G().S.money,items:Object.values(R.ITEMS).map(item=>({...item,qty:quantity(item.id)})),machines:R.MACHINES,rarities:R.RARITIES,inventory,customBonusRemaining:s.nativeFree+quantity('umi-spin-ticket'),
      eggs:s.eggs.map(egg=>({...egg,name:G().DEX[egg.id].name,icon:`assets/pokemon/${egg.id}.png`,ready:Date.now()>=egg.readyAt||integer(G().S.stats.wins)>=egg.winAt,remainingMs:Math.max(0,egg.readyAt-Date.now()),winsLeft:Math.max(0,egg.winAt-integer(G().S.stats.wins))})),
      pendingEncounter:s.pendingEncounter?{...s.pendingEncounter,name:G().DEX[s.pendingEncounter.id]?.name,icon:`assets/pokemon/${s.pendingEncounter.id}.png`}:null,
      lootRemainingMs:Math.max(0,s.lootUntil-Date.now())};
  }
  function megaOptions(){return{forms:window.UmiMega.catalog,unlocked:window.UmiMega.unlocked(),mons:G().S.mons.filter(mon=>window.UmiMega.catalog.some(form=>form.base===mon.id)).map(mon=>({uid:mon.uid,id:mon.id,name:G().DEX[mon.id].name,level:mon.level,megaKey:mon.umiMegaKey||null,icon:engine.UI.monSrc(mon,mon.shiny)}))};}
  function install(value) {
    engine=value;window.UmiMega.install(engine);
    window.UmiCasinoRewards.install(engine, api);
    window.UmiCasinoUI.install(engine, api);
    window.__umiArcadeEncounter=(original,node)=>{
      const s=state(),pending=s.pendingEncounter;
      if(!pending||(!node?.ch&&node?.ch!==0)||region().key!==pending.reg)return original;
      if(engine.STORY?.regionOf && engine.STORY.regionOf(node.ch)?.key!==pending.reg)return original;
      const mon=G().DEX[pending.id];
      if(!mon||G().isLegend(mon.id)||G().S.dex[mon.id]){
        s.pendingEncounter=null;add('umi-missing-pass',1);G().save();
        engine.UI.toast('Loài đã chọn không còn thiếu. Vé săn được trả lại trong Túi quà.');return original;
      }
      if(G().minLevelFor(mon.id)>G().levelCap())return original;
      s.lastEncounter={id:pending.id,at:Date.now()};s.pendingEncounter=null;G().save();return mon.id;
    };
    setInterval(lootTick,2500);
  }
  const api=window.UmiArcade={state,snapshot,spin,buyTickets,choices,claim,claimEgg,scrapItem,redeem,setGoal,megaOptions,quantity,itemName,itemIcon,transact,grant:apply,
    equipMega:(uid,key)=>window.UmiMega.equip(uid,key),unequipMega:uid=>window.UmiMega.unequip(uid),
    open:()=>engine.App.show('casino'),install};
  const previous=window.__setInternalPoke;
  window.__setInternalPoke=value=>{previous?.(value);install(value)};
})();
