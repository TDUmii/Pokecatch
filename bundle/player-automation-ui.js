/* Responsive utility screen for opt-in player helpers and quick actions. */
(() => {
  'use strict';
  const root = window;
  const labels = {
    'razz-berry': 'Quả Razz', 'golden-razz-berry': 'Quả Razz vàng', 'nanab-berry': 'Quả Nanab',
    'enigma-berry': 'Quả Enigma', 'pinap-berry': 'Quả Pinap', 'lansat-berry': 'Quả Lansat',
    'starf-berry': 'Quả Starf', 'exp-candy-s': 'Kẹo EXP S', 'exp-candy-m': 'Kẹo EXP M',
    'exp-candy-xl': 'Kẹo EXP XL', 'exp-candy-big': 'Kẹo EXP lớn', 'rare-candy': 'Kẹo Hiếm'
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number = value => Number(value || 0).toLocaleString('vi-VN');
  let engine;
  let screen;
  let view = 'items';
  let timer;
  let feedback = '';
  let failed = false;
  const automation = () => root.UmiPlayerAutomation;
  const localLabel = id => labels[id] || id;
  const itemName = rule => localLabel(rule.itemId) === rule.itemId ? rule.label : localLabel(rule.itemId);

  function shortcuts() {
    return '<section class="pu-section"><h3>Lối tắt</h3><p class="pu-muted">Mở nhanh những chỗ dùng thường xuyên trong game.</p><div class="pu-shortcuts">' +
      [['adventure','Phiêu lưu','assets/ui/town-map.png'],['workshop','Xưởng chế tạo','assets/ui/explorer-kit.png'],
        ['pension','Nhà trẻ','assets/ui/berry-oran.png'],['casino','Sòng bạc','assets/ui/coin-case.png'],
        ['pc','Đội hình và PC','assets/ui/box-link.png'],['pokedex','Pokédex','assets/ui/pokedex-red.png']].map(([id, name, icon]) =>
          '<button type="button" class="pu-shortcut" data-pu-go="' + id + '"><img src="' + icon + '" alt=""><span>' + name + '</span></button>').join('') +
      '</div><div class="pu-actions"><button type="button" class="pu-secondary" data-pu-action="heal">Hồi phục đội</button><button type="button" class="pu-secondary" data-pu-action="save">Lưu ngay</button><button type="button" class="pu-secondary" data-pu-action="save-dialog">Xuất / nhập bản lưu</button></div></section>';
  }

  function itemRule(rule) {
    return '<div class="pu-rule" data-pu-rule="' + esc(rule.id) + '"><div class="pu-rule-icon"><img src="' + esc(rule.icon) + '" alt=""></div><div class="pu-rule-copy"><label><input type="checkbox" data-pu-enabled="' + esc(rule.id) + '"' + (rule.enabled ? ' checked' : '') + '> <b>' + esc(itemName(rule)) + '</b></label><p>' + esc(rule.description) + '</p><small>Còn ' + number(rule.available) + ' · Giữ lại <input type="number" min="0" max="99" step="1" value="' + rule.reserve + '" data-pu-reserve="' + esc(rule.id) + '"> món</small></div></div>';
  }

  function itemView(status) {
    const berries = status.rules.filter(rule => rule.kind === 'berry');
    const candies = status.rules.filter(rule => rule.kind === 'candy');
    const target = status.targets.find(mon => mon.uid === status.target);
    return '<section class="pu-section"><h3>Tự dùng vật phẩm</h3><p class="pu-muted">Các mục đều tắt mặc định. Game chỉ chạy tự động khi bạn đang ở Phiêu lưu, không trong trận và vẫn giữ số dự trữ đã chọn.</p>' +
      '<h4>Quả tăng hiệu ứng</h4><div class="pu-rules">' + berries.map(itemRule).join('') + '</div>' +
      '<h4>Kẹo EXP</h4><div class="pu-target"><label>Pokémon nhận kẹo<select data-pu-target><option value="">Chưa chọn</option>' +
      status.targets.map(mon => '<option value="' + esc(mon.uid) + '"' + (mon.uid === status.target ? ' selected' : '') + '>' + esc(mon.name) + ' · Cấp ' + number(mon.level) + '</option>').join('') +
      '</select></label><small>' + (target ? 'Kẹo chỉ dùng cho Pokémon đang ở đội.' : 'Chọn một Pokémon trong đội để bật tự dùng kẹo.') + '</small></div>' +
      '<div class="pu-rules">' + candies.map(itemRule).join('') + '</div>' +
      '<p class="pu-note">Bộ tự dùng không ném Poké Ball, không tự tiến hóa và không tiêu vật phẩm khi bạn đang ở màn khác.</p>' +
      (status.lastAction ? '<p class="pu-last">Lần gần nhất: ' + esc(status.lastAction.label) + '</p>' : '') + '</section>';
  }

  function render() {
    if (!screen || !automation()) return;
    const status = automation().status();
    if (!status.ready) { screen.innerHTML = '<div class="pu-shell"><p>Hãy bắt đầu hành trình để dùng Tiện ích.</p></div>'; return; }
    screen.innerHTML = '<div class="pu-shell"><header class="pu-head"><div><h2>Tiện ích người chơi</h2><p>Điều khiển tự động có giới hạn và các lối tắt của bản offline.</p></div><span class="pu-mark">⚙</span></header><nav class="pu-tabs" aria-label="Nhóm tiện ích"><button type="button" data-pu-view="items" aria-pressed="' + (view === 'items') + '">Tự dùng vật phẩm</button><button type="button" data-pu-view="shortcuts" aria-pressed="' + (view === 'shortcuts') + '">Lối tắt</button></nav><p class="pu-status' + (failed ? ' is-error' : '') + '" role="status" aria-live="polite">' + esc(feedback) + '</p>' + (view === 'items' ? itemView(status) : shortcuts()) + '</div>';
  }

  function act(event) {
    const target = event.target;
    const viewButton = target.closest('[data-pu-view]');
    if (viewButton) { view = viewButton.dataset.puView; feedback = ''; failed = false; render(); return; }
    const go = target.closest('[data-pu-go]');
    if (go) { engine.App.show(go.dataset.puGo); return; }
    const action = target.closest('[data-pu-action]')?.dataset.puAction;
    if (!action) return;
    failed = false;
    try {
      if (action === 'heal') {
        const result = root.UmiArcade.transact(() => { engine.Game.healTeam(); return {ok: true, message: 'Đã hồi phục đội.'}; });
        feedback = result.message;
      } else if (action === 'save') { engine.Game.save(); feedback = 'Đã lưu tiến trình trên thiết bị.'; }
      else if (action === 'save-dialog') { document.getElementById('personal-menu')?.click(); feedback = 'Đã mở bảng lưu và ngoại tuyến.'; }
    } catch (error) { feedback = error.message; failed = true; }
    render();
  }

  function change(event) {
    const target = event.target;
    try {
      if (target.matches('[data-pu-enabled]')) {
        const reserve = Number(target.closest('.pu-rule')?.querySelector('[data-pu-reserve]')?.value || 2);
        const result = automation().configure(target.dataset.puEnabled, {enabled: target.checked, reserve});
        feedback = result.message || ''; failed = result.ok === false;
      } else if (target.matches('[data-pu-reserve]')) {
        const id = target.dataset.puReserve;
        const enabled = target.closest('.pu-rule')?.querySelector('[data-pu-enabled]')?.checked === true;
        const result = automation().configure(id, {enabled, reserve: Number(target.value)});
        feedback = result.message || ''; failed = result.ok === false;
      } else if (target.matches('[data-pu-target]')) {
        const result = automation().selectTarget(target.value);
        feedback = result.message || ''; failed = result.ok === false;
      }
    } catch (error) { feedback = error.message; failed = true; }
    render();
  }

  function init() {
    screen = document.getElementById('screen-utilities');
    if (!screen || screen.dataset.playerUtilitiesReady) return;
    screen.dataset.playerUtilitiesReady = 'true';
    screen.addEventListener('click', act);
    screen.addEventListener('change', change);
  }
  function enter() { init(); render(); clearInterval(timer); timer = setInterval(() => { if (!document.hidden && !screen?.querySelector(':focus')) render(); }, 3000); }
  function leave() { clearInterval(timer); }
  function install(value) { engine = value; engine.Screens.utilities = {init, render, enter, leave}; }
  root.UmiPlayerUtilityUI = {install};
  const previous = root.__setInternalPoke;
  root.__setInternalPoke = value => { previous?.(value); install(value); };
})();
