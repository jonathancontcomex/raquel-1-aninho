const $ = s => document.querySelector(s);
const BUCKET = 'mural-fotos';
const MAX_SIZE_MB = 8;

let isAdmin = false;
let selectedFile = null;

function publicUrl(path) {
  return sbClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function setStatus(msg, isError) {
  const el = $('#uploadStatus');
  el.textContent = msg || '';
  el.classList.toggle('error', !!isError);
}

$('#photoInput').addEventListener('change', () => {
  const file = $('#photoInput').files[0];
  selectedFile = file || null;
  const label = $('#fileLabel');
  if (file) {
    label.classList.add('has-file');
    $('#fileLabelText').textContent = `✓ ${file.name}`;
  } else {
    label.classList.remove('has-file');
    $('#fileLabelText').textContent = '📷 Escolher ou tirar uma foto';
  }
  $('#sendPhoto').disabled = !file;
  setStatus('');
});

$('#sendPhoto').onclick = async () => {
  if (!selectedFile) return;
  if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
    setStatus(`Essa foto passa de ${MAX_SIZE_MB}MB. Tente uma menor.`, true);
    return;
  }
  const btn = $('#sendPhoto');
  btn.disabled = true;
  setStatus('Enviando...');
  const name = $('#guestName').value.trim();
  const ext = (selectedFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await sbClient.storage.from(BUCKET).upload(path, selectedFile, { contentType: selectedFile.type || 'image/jpeg' });
  if (uploadError) {
    setStatus('Não foi possível enviar. Verifique sua internet e tente de novo.', true);
    btn.disabled = false;
    return;
  }

  const { error: insertError } = await sbClient.from('mural_photos').insert([{ guest_name: name || null, storage_path: path }]);
  if (insertError) {
    setStatus('A foto subiu, mas houve um erro ao registrar. Tente de novo.', true);
    btn.disabled = false;
    return;
  }

  setStatus('Foto enviada! Obrigado por compartilhar 💗');
  $('#photoInput').value = '';
  selectedFile = null;
  $('#fileLabel').classList.remove('has-file');
  $('#fileLabelText').textContent = '📷 Escolher ou tirar uma foto';
  btn.disabled = true;
  loadGallery();
};

async function deletePhoto(id, path) {
  if (!confirm('Apagar essa foto do mural? Não dá pra desfazer.')) return;
  await sbClient.storage.from(BUCKET).remove([path]);
  await sbClient.from('mural_photos').delete().eq('id', id);
  loadGallery();
}
window.deletePhoto = deletePhoto;

async function loadGallery() {
  const { data, error } = await sbClient.from('mural_photos').select('*').order('created_at', { ascending: false });
  if (error) return;
  const grid = $('#muralGallery');
  $('#galleryEmpty').classList.toggle('hidden', data.length > 0);
  grid.innerHTML = data.map(p => `
    <div class="mural-tile">
      <img src="${publicUrl(p.storage_path)}" loading="lazy" alt="Foto de ${p.guest_name || 'convidado'}">
      ${p.guest_name ? `<div class="cap">${p.guest_name}</div>` : ''}
      ${isAdmin ? `<button class="del" title="Apagar" onclick="deletePhoto('${p.id}','${p.storage_path}')">✕</button>` : ''}
    </div>
  `).join('');
}

sbClient.auth.getSession().then(({ data: { session } }) => {
  isAdmin = !!session;
  loadGallery();
});
