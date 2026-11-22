const search = document.querySelector('#search');
const category = document.querySelector('#category');
const grid = document.querySelector('#grid');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');
const detail = document.querySelector('#detail');
const nameLabel = document.querySelector('#name');
const unicode = document.querySelector('#unicode');
const preview = document.querySelector('#preview');
const copyStatus = document.querySelector('#copy-status');
const manualCopy = document.querySelector('#manual-copy');

const groups = [
  ['system', 'Sistema y seguridad', /system|settings|control panel|update|defender|shield|security|lock|power|battery|task manager|terminal|command|accessibility|ease of access|windows|brightness/],
  ['messages', 'Mensajes y llamadas', /\b(?:mail|email|chat|message|messaging|call|voicemail|phone|video call|conversation|reply|send|inbox|contact)\b/],
  ['files', 'Archivos y carpetas', /\b(?:file|folder|document|archive|save|copy|paste|clipboard|download|upload|recycle|trash|delete|library|page|print|printer)\b/],
  ['media', 'Multimedia', /\b(?:music|audio|video|camera|photo|picture|image|play|pause|record|media|volume|speaker|microphone|mic|headphone|headphones|movie|film|playlist|mute)\b/],
  ['navigation', 'Navegación y acciones', /\b(?:arrow|back|forward|chevron|caret|home|menu|nav|navigation|add|remove|cancel|close|up|down|left|right|undo|redo|search|zoom|sort|filter|refresh|sync|share|link|check)\b/],
  ['devices', 'Dispositivos y conexión', /wifi|wi fi|bluetooth|network|ethernet|cellular|signal|usb|keyboard|mouse|device|touchpad|monitor|screen|laptop|desktop|tablet|connect|wireless|hotspot|router/],
  ['people', 'Personas y accesibilidad', /\b(?:person|people|user|account|contact|profile|family|accessibility|fingerprint|face|emoji)\b|ease of access|sign language|narrator/],
  ['editing', 'Edición y diseño', /\b(?:edit|pen|ink|inking|draw|pencil|crop|color|format|text|font|bold|italic|underline|eraser|paint|brush|align|rotate|resize|layout)\b/],
  ['places', 'Mapas y transporte', /\b(?:map|location|pin|compass|car|bus|train|airplane|flight|walk|traffic|parking|globe|route|directions)\b/],
  ['time', 'Tiempo y calendario', /\b(?:calendar|clock|alarm|time|timer|date|schedule|stopwatch|reminder|history)\b/],
];

for (const [value, label] of [...groups, ['other', 'Otros']]) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  category.append(option);
}

const aliases = {
  folder: 'carpeta', home: 'inicio casa', search: 'buscar lupa',
  mail: 'correo email', delete: 'borrar eliminar papelera',
  settings: 'ajustes configuración', save: 'guardar',
  camera: 'cámara', calendar: 'calendario', heart: 'corazón',
  arrow: 'flecha', lock: 'candado', wifi: 'red inalámbrica',
  print: 'imprimir impresora', person: 'persona usuario',
  download: 'descargar', star: 'estrella', play: 'reproducir',
};

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

const entries = glyphs.map(([code, name]) => {
  const plainName = normalize(name);
  const words = name
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
  const keywords = Object.entries(aliases)
    .filter(([english]) => plainName.includes(english))
    .map(([, spanish]) => spanish);
  const groupIds = groups
    .filter(([, , pattern]) => pattern.test(normalize(words)))
    .map(([id]) => id);
  if (groupIds.length === 0) groupIds.push('other');
  return { code, name, groupIds, keywords: normalize([name, words, code, ...keywords].join(' ')) };
});

function openDetail({ code, name }) {
  preview.textContent = String.fromCodePoint(parseInt(code, 16));
  nameLabel.textContent = name;
  unicode.textContent = 'U+' + code;
  copyStatus.textContent = '';
  manualCopy.hidden = true;
  detail.showModal();
}

function renderCatalog() {
  const batch = document.createDocumentFragment();
  for (const entry of entries) {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.title = entry.name;

    const icon = document.createElement('span');
    icon.className = 'glyph';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = String.fromCodePoint(parseInt(entry.code, 16));

    const name = document.createElement('span');
    name.className = 'tile-name';
    name.textContent = entry.name;

    const code = document.createElement('code');
    code.textContent = 'U+' + entry.code;
    tile.append(icon, name, code);
    tile.addEventListener('click', () => openDetail(entry));
    entry.tile = tile;
    batch.append(tile);
  }

  grid.append(batch);
}

function filter() {
  let query = search.value.trim();
  if ([...query].length === 1 && /\p{Co}/u.test(query)) {
    query = query.codePointAt(0).toString(16);
  }
  const tokens = normalize(query).replace(/^(?:u\+|0x|&#x|\\u)([\da-f]+);?$/, '$1')
    .split(/\s+/).filter(Boolean);

  const selected = category.value;
  let matches = 0;
  for (const { groupIds, keywords, tile } of entries) {
    const visible = (!selected || groupIds.includes(selected))
      && tokens.every(token => keywords.includes(token));
    tile.hidden = !visible;
    if (visible) matches++;
  }
  count.textContent = matches.toLocaleString('es-AR') + (matches === 1 ? ' glifo' : ' glifos');
  empty.hidden = matches > 0;
}

async function copy(value) {
  manualCopy.hidden = true;
  try {
    await navigator.clipboard.writeText(value);
    copyStatus.textContent = 'Copiado';
  } catch {
    manualCopy.value = value;
    manualCopy.hidden = false;
    manualCopy.select();
    copyStatus.textContent = 'Presioná Ctrl+C para copiar.';
  }
}

search.addEventListener('input', filter);
category.addEventListener('change', filter);
document.querySelector('#copy-glyph').addEventListener('click', () => copy(preview.textContent));
document.querySelector('#copy-code').addEventListener('click', () => copy(unicode.textContent));
document.fonts.load('24px "Local Fluent"', '\uE700').catch(() => {
  document.querySelector('#font-help').hidden = false;
});
renderCatalog();
filter();
