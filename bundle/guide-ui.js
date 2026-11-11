/* Read-only strategy pages inside the game's existing handbook. */
(function (root) {
  'use strict';
  let engine, installed = false, chosenType = 'fire', secondType = '', mapKey;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const rules = () => root.UmiGuideRules;
  const fmt = value => Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  const typeName = type => rules().typeNames[type] || type;
  const badge = type => `<span class="umi-guide-type" style="--type-color:${esc(engine.TYPES[type]?.color || '#a8b2c8')}">${esc(typeName(type))}</span>`;
  function typeGroup(title, values, empty) {
    return `<section class="umi-guide-match"><h4>${title}</h4><div class="umi-guide-type-list">${values.map(value => `<span class="umi-guide-match-pair">${badge(value.type)}<b>×${fmt(value.multiplier)}</b></span>`).join('') || `<p>${empty}</p>`}</div></section>`;
  }
  function renderTypes(page) {
    const info = rules().typeInfo(chosenType, { defender2: secondType });
    page.innerHTML = `<article class="umi-guide-root"><h3>Hệ nào khắc hệ nào?</h3><p>Chọn hệ để xem khi tấn công và khi phòng thủ. Hệ số dùng đúng luật chiến đấu trong game.</p><div class="umi-guide-select-grid"><label>Hệ Pokémon<select data-guide-type>${rules().types.map(type => `<option value="${type.id}"${type.id === chosenType ? ' selected' : ''}>${esc(type.name)}</option>`).join('')}</select></label><label>Hệ thứ hai khi phòng thủ<select data-guide-second><option value="">Không có</option>${rules().types.filter(type => type.id !== chosenType).map(type => `<option value="${type.id}"${type.id === secondType ? ' selected' : ''}>${esc(type.name)}</option>`).join('')}</select></label></div><section class="umi-guide-section"><h4>Chiêu ${esc(info.name)} khi tấn công</h4><div class="umi-guide-match-grid">${typeGroup('Gây sát thương mạnh', info.attacking.filter(value => value.multiplier > 1), 'Không có hệ bị khắc.')}${typeGroup('Bị kháng', info.attacking.filter(value => value.multiplier > 0 && value.multiplier < 1), 'Không có hệ kháng.')}${typeGroup('Không có tác dụng', info.attacking.filter(value => value.multiplier === 0), 'Không có hệ miễn nhiễm.')}</div></section><section class="umi-guide-section"><h4>Pokémon ${info.types.map(type => esc(typeName(type))).join(' / ')} khi phòng thủ</h4><div class="umi-guide-match-grid">${typeGroup('Cần tránh đối đầu', info.defending.filter(value => value.multiplier > 1), 'Không có điểm yếu theo hệ.')}${typeGroup('Kháng tốt', info.defending.filter(value => value.multiplier > 0 && value.multiplier < 1), 'Không có hệ được kháng.')}${typeGroup('Miễn nhiễm', info.defending.filter(value => value.multiplier === 0), 'Không có hệ miễn nhiễm.')}</div></section><div class="umi-guide-explain"><p><b>×2:</b> sát thương gấp đôi · <b>×0,5:</b> còn một nửa · <b>×0:</b> không gây sát thương. Các hệ không liệt kê có hệ số ×1.</p><p>Pokémon có hai hệ sẽ nhân hai hệ số phòng thủ, nên có thể bị đánh ×4 hoặc chỉ nhận ×0,25. Ví dụ: Đá đánh Lửa/Bay ×${fmt(rules().matchup('rock', ['fire','flying']))}; Điện đánh Nước/Đất ×${fmt(rules().matchup('electric', ['water','ground']))}.</p><p>Hệ chỉ là một phần: cấp, chỉ số, chiêu thức, thời tiết và trạng thái vẫn ảnh hưởng trận đấu.</p></div></article>`;
  }
  function monRow(mon, index, threats, alternative = false) {
    const owned = (engine.Game.S.mons || []).find(value => value.uid === mon.uid);
    const art = owned ? engine.UI.monSrc(owned, owned.shiny) : `assets/pokemon/${mon.id}.png`;
    const best = [...mon.coverage].filter(value => value.move && value.move.multiplier > 1).sort((a,b) => (b.kind === 'boss') - (a.kind === 'boss') || b.weight * b.move.multiplier - a.weight * a.move.multiplier)[0];
    const foe = best && threats.find(value => value.id === best.id && value.kind === best.kind);
    const reason = best ? `Khắc ${foe?.name || engine.Game.DEX[best.id]?.name} bằng ${best.move.name} ×${fmt(best.move.multiplier)}.` : 'Bổ sung sức tấn công và độ phủ cho đội theo chỉ số, cấp hiện tại.';
    return `<li class="umi-guide-mon"><img src="${esc(art)}" alt=""><div class="umi-guide-mon-copy"><h4>${alternative ? '' : `${index + 1}. `}${esc(mon.name)} <small>Cấp ${fmt(mon.level)}</small></h4><div class="umi-guide-type-list">${mon.types.map(badge).join('')}</div><p>${esc(reason)}</p>${mon.note ? `<p class="umi-guide-note">${esc(mon.note)}</p>` : ''}${alternative && mon.source ? `<p class="umi-guide-source">Tìm tại: ${esc(mon.source)}</p>` : ''}</div></li>`;
  }
  function renderTeam(page) {
    const data = rules().snapshot(mapKey); mapKey = data.selected?.id;
    const regions = [...new Set(data.maps.map(map => map.region))];
    if (!data.selected) { page.innerHTML = '<article class="umi-guide-root"><h3>Đội theo bản đồ</h3><p>Chưa có dữ liệu bản đồ để gợi ý đội.</p></article>'; return; }
    const bosses = data.threats.filter(threat => threat.kind === 'boss');
    const shownThreats = [...bosses, ...data.threats.filter(threat => threat.kind !== 'boss')].slice(0, 8);
    page.innerHTML = `<article class="umi-guide-root"><h3>Xây đội từ Pokémon bạn đang có</h3><p>Chọn bản đồ để xem đội gợi ý theo đối thủ, chiêu đã học và sức mạnh hiện tại. Bạn tự quyết định cách xếp đội.</p><label class="umi-guide-map-label">Bản đồ / chương<select data-guide-map>${regions.map(region => `<optgroup label="${esc(region)}">${data.maps.filter(map => map.region === region).map(map => `<option value="${map.id}"${map.id === data.selected.id ? ' selected' : ''}>${esc(map.name)}${map.current ? ' · Đang chơi' : ''}${map.locked ? ' · Chưa mở' : ''}</option>`).join('')}</optgroup>`).join('')}</select></label><div class="umi-guide-map-summary"><b>${esc(data.selected.name)}</b><span>${esc(data.selected.description)}</span>${data.selected.locked ? '<span>Đang xem trước bản đồ chưa mở.</span>' : ''}</div><section class="umi-guide-section"><h4>Hệ tấn công nên có</h4><div class="umi-guide-type-list">${data.counters.filter(value => value.score > 1).map(value => badge(value.type)).join('') || '<p>Ưu tiên nhiều hệ để phủ các đối thủ.</p>'}</div></section><section class="umi-guide-section"><h4>Đội gợi ý của bạn (${data.owned.length}/6)</h4>${data.owned.length ? `<ol class="umi-guide-team">${data.owned.map((mon,index) => monRow(mon,index,data.threats)).join('')}</ol>` : '<p class="umi-guide-empty">Chưa có Pokémon phù hợp trong bộ sưu tập ở vùng này. Kiểm tra đội đang đi nhiệm vụ hoặc bắt thêm Pokémon.</p>'}</section><details class="umi-guide-details"><summary>Đối thủ đáng chú ý trên bản đồ</summary><ul class="umi-guide-threats">${shownThreats.map(mon => `<li><img src="assets/pokemon/${mon.id}.png" alt=""><div><b>${esc(mon.name)}</b><span>Cấp ${fmt(mon.level)} · ${esc(mon.source)}${mon.kind === 'boss' ? ' · Thủ lĩnh' : ''}</span><div class="umi-guide-type-list">${mon.types.map(badge).join('')}</div></div></li>`).join('') || '<li>Chưa có dữ liệu đối thủ.</li>'}</ul></details><details class="umi-guide-details"><summary>Có thể săn thêm ở nơi đã mở (${data.alternatives.length})</summary>${data.alternatives.length ? `<ul class="umi-guide-team">${data.alternatives.map((mon,index) => monRow(mon,index,data.threats,true)).join('')}</ul>` : '<p>Các loài phù hợp hiện có đã nằm trong bộ sưu tập, hoặc chưa có tuyến đường phù hợp đang mở.</p>'}</details><details class="umi-guide-details"><summary>Cách chọn đội và giới hạn gợi ý</summary>${data.notes.map(note => `<p>${esc(note)}</p>`).join('')}</details></article>`;
  }
  function attach(modal) {
    if (modal.dataset.umiGuideReady) return;
    const nav = modal.querySelector('.gd-nav'), page = modal.querySelector('.gd-page');
    if (!nav || !page || !modal.querySelector('.gd-read')) return;
    modal.dataset.umiGuideReady = 'true';
    function entries() {
      if (nav.querySelector('[data-umi-guide]')) return;
      const section = document.createElement('div'); section.className = 'umi-guide-nav-group';
      section.innerHTML = '<div class="gd-grp">Chiến thuật</div><button type="button" class="gd-item" data-umi-guide="types" style="--ic:var(--gold)"><span class="gd-ic"><img src="assets/items/adventure-guide.png" alt=""></span><span class="gd-lbl">Khắc hệ</span></button><button type="button" class="gd-item" data-umi-guide="team" style="--ic:var(--blue)"><span class="gd-ic"><img src="assets/ui/town-map.png" alt=""></span><span class="gd-lbl">Đội theo bản đồ</span></button>';
      nav.prepend(section);
    }
    entries(); new MutationObserver(entries).observe(nav, { childList: true });
    modal.addEventListener('click', event => {
      const button = event.target.closest('[data-umi-guide]');
      if (button) {
        const mode = button.dataset.umiGuide;
        modal.classList.add('umi-guide-mode'); modal.dataset.umiGuideMode = mode;
        nav.querySelectorAll('.gd-item').forEach(item => item.classList.toggle('on', item === button));
        modal.querySelector('.gd-read').textContent = '';
        button.scrollIntoView({block:'nearest',inline:'nearest'});
        if (mode === 'types') renderTypes(page); else renderTeam(page);
        page.scrollTop = 0;
      } else if (event.target.closest('.gd-item[data-i]')) {
        modal.classList.remove('umi-guide-mode'); delete modal.dataset.umiGuideMode;
      }
    });
    page.addEventListener('change', event => {
      const target = event.target;
      if (target.matches('[data-guide-map]')) { mapKey = target.value; renderTeam(page); page.querySelector('[data-guide-map]').focus({ preventScroll: true }); }
      else if (target.matches('[data-guide-type],[data-guide-second]')) {
        if (target.matches('[data-guide-type]')) { chosenType = target.value; if (chosenType === secondType) secondType = ''; } else secondType = target.value;
        const selector = target.matches('[data-guide-type]') ? '[data-guide-type]' : '[data-guide-second]';
        renderTypes(page); page.querySelector(selector).focus({ preventScroll: true });
      }
    });
    page.addEventListener('keydown', event => { if (event.target.closest('.umi-guide-root') && ['ArrowLeft','ArrowRight'].includes(event.key)) event.stopPropagation(); });
  }
  function install(value) {
    engine = value; rules().install(engine);
    if (installed) return; installed = true;
    const scan = () => document.querySelectorAll('.gd-modal:not(.opt-modal)').forEach(attach);
    new MutationObserver(scan).observe(document.getElementById('modal-root') || document.body, { childList: true, subtree: true });
    scan();
  }
  root.UmiGuideUI = { install };
  const previous = root.__setInternalPoke;
  root.__setInternalPoke = value => { previous?.(value); install(value); };
})(globalThis);
