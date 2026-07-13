const $ = s => document.querySelector(s);

const STOPWORDS = ['familia', 'família', 'sr', 'sra', 'sr.', 'sra.', 'dona', 'senhor', 'senhora', 'e'];

function fullName(p) { return `${p.first} ${p.last}`.trim() }

function normalize(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function significantWords(name) {
  return normalize(name).split(/\s+/).filter(w => w.length >= 2 && !STOPWORDS.includes(w));
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/`/g, '&#96;');
}

let rsvpsData = [];

async function renderAdmin() {
  const { data, error } = await sbClient.from('rsvps').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return }
  rsvpsData = data;
  const confirmed = data.filter(x => x.status === 'confirmed');
  const declined = data.filter(x => x.status === 'declined');
  const people = confirmed.flatMap(x => x.people || []);
  $('#stTotal').textContent = people.length;
  $('#stConfirmed').textContent = people.length;
  $('#stDeclined').textContent = declined.length;
  $('#stAdults').textContent = people.filter(p => p.type !== 'kid').length;
  $('#stKids').textContent = people.filter(p => p.type === 'kid').length;
  $('#stFamilies').textContent = confirmed.length;
  $('#adminRows').innerHTML = data.map(x => {
    const host = { first: x.host_first, last: x.host_last };
    return `<tr><td>${escapeHtml(fullName(host))}</td><td>${(x.people || []).slice(1).map(p => escapeHtml(fullName(p))).join(', ') || '-'}</td><td><span class="tag">${x.status === 'confirmed' ? 'Confirmado' : 'Não irá'}</span></td><td>${new Date(x.created_at).toLocaleString('pt-BR')}</td><td><button class="pr-del-btn" data-action="deletersvp" data-rsvp-id="${x.id}" title="Excluir esta confirmação">✕</button></td></tr>`;
  }).join('') || '<tr><td colspan="5">Nenhuma confirmação ainda.</td></tr>';
  renderPeopleTables();
  renderGuestList();
}

// -- tabela de convidados/crianças, editável --

function personRow(rsvpId, idx, p, hostName) {
  return `<tr>
    <td>${escapeHtml(fullName(p))}</td>
    <td>${p.type === 'kid' ? 'Criança até 7' : 'Adulto'}</td>
    <td>${escapeHtml(hostName)}</td>
    <td><button class="pr-edit-btn" data-action="editperson" data-rsvp-id="${rsvpId}" data-idx="${idx}" title="Editar">✎</button></td>
  </tr>`;
}

function renderPeopleTables() {
  const allRows = [];
  const kidRows = [];
  rsvpsData.filter(r => r.status === 'confirmed').forEach(r => {
    const hostName = fullName({ first: r.host_first, last: r.host_last });
    (r.people || []).forEach((p, idx) => {
      const row = personRow(r.id, idx, p, hostName);
      allRows.push(row);
      if (p.type === 'kid') kidRows.push(row);
    });
  });
  $('#peopleRowsAll').innerHTML = allRows.join('') || '<tr><td colspan="4">Ninguém confirmado ainda.</td></tr>';
  $('#peopleRowsKids').innerHTML = kidRows.join('') || '<tr><td colspan="4">Nenhuma criança confirmada ainda.</td></tr>';
}

function startEditPerson(rsvpId, idx) {
  const rsvp = rsvpsData.find(r => r.id === rsvpId);
  if (!rsvp) return;
  const p = rsvp.people[idx];
  const editHtml = `
    <td><input class="pr-name-input" data-field="first" value="${escapeAttr(p.first)}" placeholder="Nome"><input class="pr-name-input" style="margin-top:4px" data-field="last" value="${escapeAttr(p.last)}" placeholder="Sobrenome"></td>
    <td><select class="pr-type-select" data-field="type"><option value="adult" ${p.type !== 'kid' ? 'selected' : ''}>Adulto</option><option value="kid" ${p.type === 'kid' ? 'selected' : ''}>Criança até 7</option></select></td>
    <td>${escapeHtml(fullName({ first: rsvp.host_first, last: rsvp.host_last }))}</td>
    <td><div class="pr-actions"><button class="pr-save-btn" data-action="saveperson" data-rsvp-id="${rsvpId}" data-idx="${idx}">Salvar</button><button class="pr-cancel-btn" data-action="cancelperson">Cancelar</button></div></td>
  `;
  document.querySelectorAll(`[data-action="editperson"][data-rsvp-id="${rsvpId}"][data-idx="${idx}"]`).forEach(btn => {
    btn.closest('tr').innerHTML = editHtml;
  });
}

async function deleteRsvp(rsvpId) {
  if (!confirm('Excluir esta confirmação? Essa ação não pode ser desfeita.')) return;
  await sbClient.from('rsvps').delete().eq('id', rsvpId);
  await renderAdmin();
}

async function savePerson(rsvpId, idx, row) {
  const rsvp = rsvpsData.find(r => r.id === rsvpId);
  if (!rsvp) return;
  const first = row.querySelector('[data-field="first"]').value.trim();
  const last = row.querySelector('[data-field="last"]').value.trim();
  const type = row.querySelector('[data-field="type"]').value;
  if (!first) { alert('Nome não pode ficar vazio.'); return }
  const newPeople = [...rsvp.people];
  newPeople[idx] = { first, last, type };
  const patch = { people: newPeople };
  if (idx === 0) { patch.host_first = first; patch.host_last = last }
  await sbClient.from('rsvps').update(patch).eq('id', rsvpId);
  await renderAdmin();
}

// -- lista de convidados x confirmados, com confirmação manual --

function allConfirmedPeople() {
  return rsvpsData
    .filter(r => r.status === 'confirmed')
    .flatMap(r => (r.people || []).map(p => ({ rsvpId: r.id, personName: fullName(p), hostName: fullName({ first: r.host_first, last: r.host_last }), type: p.type === 'kid' ? 'Criança até 7' : 'Adulto' })));
}

// -- exportação da lista para o buffet --

function exportExcel() {
  const people = allConfirmedPeople();
  const rows = [['Nome', 'Tipo', 'Família (responsável)'], ...people.map(p => [p.personName, p.type, p.hostName])];
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lista-confirmados-raquel-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF() {
  const people = allConfirmedPeople().sort((a, b) => a.hostName.localeCompare(b.hostName));
  const adults = people.filter(p => p.type === 'Adulto').length;
  const kids = people.length - adults;
  const rowsHtml = people.map((p, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(p.personName)}</td><td>${p.type}</td><td>${escapeHtml(p.hostName)}</td></tr>`).join('');
  $('#printArea').innerHTML = `
    <h1>Lista de confirmados — 1 aninho da Raquel</h1>
    <p>26 de julho de 2026 · Buffet Zupaloo</p>
    <p><strong>Total: ${people.length}</strong> (${adults} adultos, ${kids} crianças até 7 anos)</p>
    <table><thead><tr><th>#</th><th>Nome</th><th>Tipo</th><th>Família</th></tr></thead><tbody>${rowsHtml}</tbody></table>
  `;
  window.print();
}

function candidatesFor(guestName, usedKeys) {
  const words = significantWords(guestName);
  if (!words.length) return [];
  return allConfirmedPeople().filter(p => {
    const key = `${p.rsvpId}::${p.personName}`;
    if (usedKeys.has(key)) return false;
    return words.every(w => normalize(p.personName).includes(w));
  });
}

async function renderGuestList() {
  const { data, error } = await sbClient.from('guest_list').select('*').order('created_at', { ascending: true });
  if (error) { console.error(error); return }

  const usedKeys = new Set(data.filter(r => r.matched_rsvp_id).map(r => `${r.matched_rsvp_id}::${r.matched_person_name}`));

  $('#glTotal').textContent = data.length;
  $('#glConfirmed').textContent = data.filter(r => r.matched_rsvp_id).length;
  $('#glPending').textContent = data.filter(r => !r.matched_rsvp_id).length;

  $('#guestListRows').innerHTML = data.map(r => {
    const nameCell = escapeHtml(r.name);
    let statusCell;
    if (r.matched_rsvp_id) {
      statusCell = `<div class="gl-matched"><span class="gl-tag ok">✓ ${escapeHtml(r.matched_person_name)}</span><button class="gl-undo" data-action="unmatch" data-gl-id="${r.id}">Desfazer</button></div>`;
    } else {
      const candidates = candidatesFor(r.name, usedKeys);
      if (candidates.length) {
        statusCell = `<div class="gl-suggestions">${candidates.map(c => `<button class="gl-suggest-btn" data-action="confirm" data-gl-id="${r.id}" data-rsvp-id="${c.rsvpId}" data-person="${escapeAttr(c.personName)}">${escapeHtml(c.personName)} — confirmar</button>`).join('')}</div>`;
      } else {
        statusCell = `<span class="gl-none">Sem correspondência ainda</span>`;
      }
    }
    return `<tr><td>${nameCell}</td><td>${statusCell}</td><td><button class="gl-del" data-action="remove" data-gl-id="${r.id}" title="Remover da lista">✕</button></td></tr>`;
  }).join('') || '<tr><td colspan="3">Nenhum nome na lista ainda.</td></tr>';

  const pendingEntries = data.filter(r => !r.matched_rsvp_id);
  const pendingOptions = pendingEntries.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');

  const unmatchedPeople = allConfirmedPeople().filter(p => !usedKeys.has(`${p.rsvpId}::${p.personName}`));
  $('#unmatchedRows').innerHTML = unmatchedPeople.map(p => `<tr>
    <td>${escapeHtml(p.personName)}</td>
    <td>${escapeHtml(p.hostName)}</td>
    <td>
      <div class="gl-link-row">
        <select class="gl-link-select">
          <option value="">É um apelido de...</option>
          ${pendingOptions}
        </select>
        <button class="gl-link-btn" data-action="link" data-rsvp-id="${p.rsvpId}" data-person="${escapeAttr(p.personName)}">Vincular</button>
      </div>
    </td>
    <td><button class="gl-add-person-btn" data-action="addmatch" data-rsvp-id="${p.rsvpId}" data-person="${escapeAttr(p.personName)}" title="Adicionar como nome novo, já confirmado">+ novo</button></td>
  </tr>`).join('') || '<tr><td colspan="4">Todo mundo confirmado já está na sua lista.</td></tr>';
}

async function saveGuestList() {
  const raw = $('#guestListInput').value;
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return;
  const { data: existing } = await sbClient.from('guest_list').select('name');
  const existingNormalized = new Set((existing || []).map(e => normalize(e.name)));
  const newNames = [...new Set(lines)].filter(l => !existingNormalized.has(normalize(l)));
  if (newNames.length) {
    await sbClient.from('guest_list').insert(newNames.map(name => ({ name })));
  }
  $('#guestListInput').value = '';
  renderGuestList();
}

async function confirmMatch(glId, rsvpId, personName) {
  await sbClient.from('guest_list').update({ matched_rsvp_id: rsvpId, matched_person_name: personName }).eq('id', glId);
  renderGuestList();
}

async function unmatchGuest(glId) {
  await sbClient.from('guest_list').update({ matched_rsvp_id: null, matched_person_name: null }).eq('id', glId);
  renderGuestList();
}

async function removeGuestListEntry(id) {
  await sbClient.from('guest_list').delete().eq('id', id);
  renderGuestList();
}

async function addAndMatch(rsvpId, personName) {
  await sbClient.from('guest_list').insert([{ name: personName, matched_rsvp_id: rsvpId, matched_person_name: personName }]);
  renderGuestList();
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'remove') removeGuestListEntry(btn.dataset.glId);
  else if (action === 'deletersvp') deleteRsvp(btn.dataset.rsvpId);
  else if (action === 'unmatch') unmatchGuest(btn.dataset.glId);
  else if (action === 'confirm') confirmMatch(btn.dataset.glId, btn.dataset.rsvpId, btn.dataset.person);
  else if (action === 'addmatch') addAndMatch(btn.dataset.rsvpId, btn.dataset.person);
  else if (action === 'link') {
    const select = btn.parentElement.querySelector('.gl-link-select');
    const glId = select.value;
    if (!glId) { alert('Escolha primeiro a qual nome da lista essa pessoa corresponde.'); return }
    confirmMatch(glId, btn.dataset.rsvpId, btn.dataset.person);
  }
  else if (action === 'editperson') startEditPerson(btn.dataset.rsvpId, Number(btn.dataset.idx));
  else if (action === 'saveperson') savePerson(btn.dataset.rsvpId, Number(btn.dataset.idx), btn.closest('tr'));
  else if (action === 'cancelperson') renderPeopleTables();
});

document.querySelectorAll('.side-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.side-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const tab = item.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.panel !== tab);
    });
  });
});

function unlock() {
  $('#gate').classList.add('hidden');
  $('#dashboard').classList.remove('hidden');
  renderAdmin();
}

function lock() {
  $('#dashboard').classList.add('hidden');
  $('#gate').classList.remove('hidden');
  $('#gatePassword').value = '';
}

async function tryLogin() {
  const email = $('#gateEmail').value.trim();
  const password = $('#gatePassword').value;
  const btn = $('#gateEnter');
  btn.disabled = true;
  const { error } = await sbClient.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  if (error) { $('#gateError').classList.remove('hidden'); return }
  $('#gateError').classList.add('hidden');
  unlock();
}

$('#gateEnter').onclick = tryLogin;
$('#gatePassword').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin() });
$('#refreshBtn').onclick = renderAdmin;
$('#logoutBtn').onclick = async () => { await sbClient.auth.signOut(); lock() };
$('#saveGuestList').onclick = saveGuestList;
$('#exportExcel').onclick = exportExcel;
$('#exportPDF').onclick = exportPDF;

sbClient.auth.getSession().then(({ data: { session } }) => { if (session) unlock() });
