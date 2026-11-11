/* Personal edition wrapper. The game engine and its art retain their source attribution. */
(() => {
  const SAVE_KEY = 'umi-pokecatch-save-v1';
  const READY_KEY = 'umi.pokecatch.offline-ready-v1';
  const state = window.PokeOffline = { engine: null };
  window.__setInternalPoke = engine => { state.engine = engine; };
  window.SW_REG = 'serviceWorker' in navigator
    ? navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => null)
    : Promise.resolve(null);
  window.BOOT_FAIL = () => {
    const box = document.getElementById('loading-game');
    if (box) { box.textContent = 'Chưa mở được game. Kiểm tra mạng rồi tải lại trang.'; box.style.zIndex = '100010'; }
  };
  document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const dialog = $('personal-dialog'), download = $('download-offline');
    const status = $('offline-status'), progress = $('offline-progress');
    let installPrompt, downloading = false;
    $('personal-menu').onclick = () => dialog.showModal();
    dialog.addEventListener('click', event => { if (event.target === dialog && (event.offsetX < 0 || event.offsetY < 0 || event.offsetX > dialog.clientWidth || event.offsetY > dialog.clientHeight)) dialog.close(); });
    function ready() {
      status.textContent = 'Đã tải đầy đủ. Bạn có thể ngắt mạng và tiếp tục chơi trên thiết bị này.';
      download.textContent = 'Kiểm tra và tải tiếp tài nguyên';
      $('offline-dot').classList.add('ready');
    }
    if (localStorage.getItem(READY_KEY)) status.textContent = 'Đang kiểm tra các tài nguyên đã lưu trên thiết bị...';
    navigator.serviceWorker?.ready.then(registration => registration.active?.postMessage({ type: 'CHECK_OFFLINE' })).catch(() => {});
    if (!navigator.serviceWorker) {
      status.textContent = 'Trình duyệt này chưa hỗ trợ cài ngoại tuyến. Hãy dùng Safari hoặc Chrome và mở bằng HTTPS.';
      download.disabled = true;
    }
    navigator.serviceWorker?.addEventListener('message', event => {
      const data = event.data;
      if (!data?.type?.startsWith('OFFLINE_')) return;
      if (data.type === 'OFFLINE_CHECK') {
        if (data.total > 0 && !data.failed) ready();
        else if (localStorage.getItem(READY_KEY)) {
          localStorage.removeItem(READY_KEY);
          status.textContent = 'Gói ngoại tuyến chưa đủ. Bấm tải tiếp để khôi phục các tài nguyên còn thiếu.';
        }
        return;
      }
      progress.hidden = false; progress.max = data.total || 1; progress.value = data.done || 0;
      status.textContent = `Đã tải ${Number(data.done || 0).toLocaleString('vi-VN')}/${Number(data.total || 0).toLocaleString('vi-VN')} tệp${data.failed ? `, ${data.failed} tệp cần tải lại` : ''}. Giữ trang mở để hoàn tất.`;
      if (data.type === 'OFFLINE_READY' || data.type === 'OFFLINE_FAILED') {
        downloading = false; download.disabled = false;
        if (data.type === 'OFFLINE_READY') {
          localStorage.setItem(READY_KEY, String(Date.now())); ready();
          navigator.storage?.persist?.().catch(() => {});
        } else {
          localStorage.removeItem(READY_KEY); $('offline-dot').classList.remove('ready');
          status.textContent = `Còn ${data.failed} tệp chưa tải được. Kiểm tra mạng hoặc dung lượng và bấm tải tiếp; các tệp đã tải được giữ lại.`;
          download.textContent = 'Tải tiếp những tệp còn thiếu';
        }
      }
    });
    download.onclick = async () => {
      if (downloading) return;
      downloading = true; download.disabled = true; status.textContent = 'Đang chuẩn bị gói ngoại tuyến...';
      try {
        if (!navigator.onLine) throw Error('Cần có mạng để tải các tài nguyên còn thiếu.');
        const registration = await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(Error('Chưa khởi động được chế độ ngoại tuyến. Hãy tải lại trang.')), 15000))]);
        (registration.active || navigator.serviceWorker.controller).postMessage({ type: 'DOWNLOAD_OFFLINE' });
      } catch (error) { downloading = false; download.disabled = false; status.textContent = error.message; }
    };
    window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; $('install-game').hidden = false; });
    $('install-game').onclick = async () => { if (!installPrompt) return; await installPrompt.prompt(); installPrompt = null; $('install-game').hidden = true; };
    function validSave(save) {
      return save && typeof save === 'object' && !Array.isArray(save) && Array.isArray(save.mons) && Array.isArray(save.team) && Number.isFinite(save.money) && save.mons.length <= 100000 && save.team.length <= 6 && save.mons.every(mon => mon && typeof mon === 'object' && Number.isFinite(mon.id) && typeof mon.uid === 'string');
    }
    $('export-save').onclick = () => {
      try {
        state.engine?.Game?.save();
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) throw Error('Hãy bắt đầu trò chơi trước khi xuất bản lưu.');
        const save = JSON.parse(raw);
        const blob = new Blob([JSON.stringify({ format: 'umi-pokecatch', version: 1, exportedAt: new Date().toISOString(), save }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = `pokecatch-umi-${new Date().toISOString().slice(0,10)}.json`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        $('save-status').textContent = 'Đã xuất tệp lưu. Hãy cất một bản ở nơi an toàn.';
      } catch (error) { $('save-status').textContent = error.message; }
    };
    $('import-save').onclick = () => $('save-file').click();
    $('save-file').onchange = async event => {
      const file = event.target.files?.[0]; if (!file) return;
      try {
        if (file.size > 20 * 1024 * 1024) throw Error('Tệp quá lớn. Chọn bản lưu JSON nhỏ hơn 20 MB.');
        const data = JSON.parse(await file.text()), save = data.format === 'umi-pokecatch' ? data.save : data;
        if (!validSave(save)) throw Error('Tệp này không phải bản lưu PokéCatch hợp lệ.');
        if (!confirm('Nhập bản lưu này và thay tiến trình hiện tại? Bản hiện tại sẽ được giữ làm bản khôi phục trên thiết bị.')) return;
        const previous = localStorage.getItem(SAVE_KEY);
        if (previous) localStorage.setItem('umi.pokecatch.before-import', previous);
        state.engine?.Game?.stopSaving();
        localStorage.setItem(SAVE_KEY, JSON.stringify(save)); location.reload();
      } catch (error) { $('save-status').textContent = `Không nhập được: ${error.message}`; }
      finally { event.target.value = ''; }
    };
    const observer = new MutationObserver(() => {
      if (document.querySelector('.ti-go') || document.querySelector('.topbar')) $('loading-game')?.remove();
      const logo = document.querySelector('.ti-logo');
      if (logo && !document.querySelector('.umi-title-note')) {
        const note = document.createElement('p'); note.className = 'umi-title-note'; note.textContent = 'Bản riêng của Umi · Hành trình ngoại tuyến'; logo.after(note);
      }
      for (const item of document.querySelectorAll('[data-screen="friends"],[data-screen="market"],[data-screen="trade"],[data-screen="admin"],.ti-login,.ti-register')) item.hidden = true;
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
