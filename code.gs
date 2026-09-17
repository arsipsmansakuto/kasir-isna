/***** KSL POS / KASIRKU v9 *****/

const APP_NAME = 'KSL KasirKu POS';
const TZ = 'Asia/Jakarta';

/***** CUSTOM BRANDING *****/

const KSL_SIGNATURE = Object.freeze({
  name: 'Kucing Storia Labs',
  product: 'KSL KasirKu POS',
  text: 'Powered by dnr'
});

const BRAND_LOGO_FOLDER_NAME = 'KSL KasirKu - Logo Branding';
const BRAND_LOGO_MAX_BYTES = 600 * 1024;
const BRAND_LOGO_CHUNK_SIZE = 45000;

// PATCH VER 8.1 - GAMBAR PRODUK
const PRODUCT_IMAGE_FOLDER_NAME = 'KSL KasirKu - Gambar Produk';
const PRODUCT_IMAGE_MAX_BYTES = 500 * 1024;

const BRAND_DEFAULTS = Object.freeze({
  brandName: 'KSL KasirKu POS',
  brandShortName: 'KSL KasirKu',
  brandTagline: 'Point of Sale berbasis Google Sheets',
  brandLogoFileId: '',
  brandLogoUrl: '',
  brandAddress: '',
  brandPhone: '',
  brandReceiptFooter: 'Terima kasih atas kunjungan Anda',
  brandPrimaryColor: '#2563eb',
  showLoginLogo: 'YA',
  showReportLogo: 'YA',
  showReceiptLogo: 'YA'
});

const BRAND_SETTING_KEYS = Object.freeze({
  brandName: 'BRAND_NAME',
  brandShortName: 'BRAND_SHORT_NAME',
  brandTagline: 'BRAND_TAGLINE',
  brandLogoFileId: 'BRAND_LOGO_FILE_ID',
  brandLogoUrl: 'BRAND_LOGO_URL',
  brandAddress: 'BRAND_ADDRESS',
  brandPhone: 'BRAND_PHONE',
  brandReceiptFooter: 'BRAND_RECEIPT_FOOTER',
  brandPrimaryColor: 'BRAND_PRIMARY_COLOR',
  showLoginLogo: 'BRAND_SHOW_LOGIN_LOGO',
  showReportLogo: 'BRAND_SHOW_REPORT_LOGO',
  showReceiptLogo: 'BRAND_SHOW_RECEIPT_LOGO'
});

const SHEETS = {
  USERS: 'USERS',
  PRODUK: 'PRODUK',
  TRANSAKSI: 'TRANSAKSI',
  DETAIL: 'TRANSAKSI_DETAIL',
  SETTINGS: 'SETTINGS',
  PEMBELIAN: 'PEMBELIAN',
  PEMBELIAN_DETAIL: 'PEMBELIAN_DETAIL',
  LOGO_ASSET: 'LOGO_ASSET',
  UTANG_PIUTANG: 'UTANG_PIUTANG',
  PEMBAYARAN_UTANG_PIUTANG: 'PEMBAYARAN_UTANG_PIUTANG'
};

const HEADERS = {
  USERS: [
    'id',
    'email',
    'name',
    'passwordHash',
    'role',
    'status',
    'createdAt',
    'updatedAt'
  ],

  LOGO_ASSET: [
    'chunkIndex',
    'chunkData',
    'mimeType',
    'fileName',
    'updatedAt'
  ],

  PRODUK: [
    'id',
    'kode',
    'nama',
    'kategori',
    'hargaBeli',
    'hargaJual',
    'stok',
    'satuan',
    'status',
    'createdAt',
    'updatedAt',

    // KOLOM BARU - WAJIB PALING KANAN
    'tipeProduk',
    'wajibNomor',
    'labelNomor',
    'adminFee',
    'stokMode',
    'hargaManual',

    // PATCH VER 1.3 - PENJUALAN PECAHAN
    'jualPecahan',
    'langkahQty',

    // PATCH VER 8.1 - GAMBAR PRODUK (PALING KANAN)
    'gambarFileId',
    'gambarUrl'
  ],

  TRANSAKSI: [
    'id',
    'invoice',
    'tanggal',
    'kasirEmail',
    'kasirName',
    'subtotal',
    'diskon',
    'total',
    'bayar',
    'kembalian',
    'metode',
    'status',
    'createdAt',
    // PATCH VER 8 - PIUTANG CUSTOMER (PALING KANAN)
    'customer',
    'jatuhTempo',
    'sisaPiutang'
  ],

  DETAIL: [
    'id',
    'transaksiId',
    'invoice',
    'produkId',
    'kode',
    'nama',
    'qty',
    'harga',
    'subtotal',
    'createdAt',

    // KOLOM BARU - WAJIB PALING KANAN
    'adminFee',
    'nomorTujuan',
    'catatan',
    'tipeProduk'
  ],

  PEMBELIAN: [
    'id',
    'nomor',
    'tanggal',
    'supplier',
    'total',
    'catatan',
    'createdByEmail',
    'createdByName',
    'createdAt',
    // PATCH VER 8 - UTANG SUPPLIER (PALING KANAN)
    'metodePembayaran',
    'dibayar',
    'jatuhTempo',
    'sisaUtang'
  ],

  PEMBELIAN_DETAIL: [
    'id',
    'pembelianId',
    'nomor',
    'produkId',
    'kode',
    'nama',
    'qty',
    'hargaBeli',
    'subtotal',
    'createdAt'
  ],

  UTANG_PIUTANG: [
    'id','jenis','pihak','referensi','tanggal','jatuhTempo',
    'total','dibayar','sisa','status','catatan','createdAt','updatedAt'
  ],

  PEMBAYARAN_UTANG_PIUTANG: [
    'id','utangPiutangId','tanggal','nominal','metode','catatan',
    'createdByEmail','createdByName','createdAt'
  ],

  SETTINGS: [
    'key',
    'value',
    'updatedAt'
  ]
};

function doGet(e){
  ensureSetup_();

  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e){
  try{
    ensureSetup_();

    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;
    const payload = body.payload || {};

    const res = api(action, payload);

    return ContentService
      .createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);

  }catch(err){
    return ContentService
      .createTextOutput(JSON.stringify(err_(err)))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function api(action, p){
  try{
    p = p || {};

    console.log('API ACTION:', action);
    console.log('API PAYLOAD:', JSON.stringify(p));

    let res;

    switch(action){

      case 'auth.login':
        res = authLogin_(p);
        break;

      case 'me':
        res = getMe_(p);
        break;

      case 'branding.public':
        res = brandingPublic_(p);
        break;

      case 'branding.get':
        res = brandingGet_(p);
        break;

      case 'branding.save':
        res = brandingSave_(p);
        break;

      case 'branding.logo.upload':
        res = brandingLogoUpload_(p);
        break;

      case 'branding.logo.delete':
        res = brandingLogoDelete_(p);
        break;

      case 'dashboard.summary':
        res = dashboardSummary_(p);
        break;

      case 'produk.list':
        res = produkList_(p);
        break;

      case 'produk.save':
        res = produkSave_(p);
        break;

      case 'produk.delete':
        res = produkDelete_(p);
        break;

      case 'master.options':
        res = masterOptions_(p);
        break;

      case 'master.option.add':
        res = masterOptionAdd_(p);
        break;

      case 'transaksi.checkout':
        res = transaksiCheckout_(p);
        break;

      case 'transaksi.list':
        res = transaksiList_(p);
        break;

      case 'laporan.penjualan':
        res = laporanPenjualan_(p);
        break;

      case 'user.list':
        res = userList_(p);
        break;

      case 'user.save':
        res = userSave_(p);
        break;

      case 'user.delete':
        res = userDelete_(p);
        break;

      case 'pembelian.save':
        res = pembelianSave_(p);
        break;

      case 'pembelian.list':
        res = pembelianList_(p);
        break;

      // PATCH VER 8 - UTANG & PIUTANG
      case 'utangpiutang.list':
        res = utangPiutangList_(p);
        break;

      case 'utangpiutang.summary':
        res = utangPiutangSummary_(p);
        break;

      case 'utangpiutang.pay':
        res = utangPiutangPay_(p);
        break;

      default:
        res = fail_('Action tidak dikenal: ' + action);
        break;
    }

    if(!res){
      res = fail_('API tidak mengembalikan response untuk action: ' + action);
    }

    return safeJson_(res);

  }catch(err){
    console.error('API ERROR:', err);
    return safeJson_(err_(err));
  }
}

function safeJson_(obj){
  return JSON.parse(JSON.stringify(obj, function(key, value){
    if(value instanceof Date){
      return Utilities.formatDate(value, TZ, 'yyyy-MM-dd HH:mm:ss');
    }

    return value;
  }));
}

/***** SETUP *****/

function ensureSetup_(){
  const ss = SpreadsheetApp.getActive();

  ensureSheet_(ss, SHEETS.USERS, HEADERS.USERS);
  ensureSheet_(ss, SHEETS.PRODUK, HEADERS.PRODUK);
  ensureSheet_(ss, SHEETS.TRANSAKSI, HEADERS.TRANSAKSI);
  ensureSheet_(ss, SHEETS.DETAIL, HEADERS.DETAIL);
  ensureSheet_(ss, SHEETS.SETTINGS, HEADERS.SETTINGS);
  ensureSheet_(ss, SHEETS.PEMBELIAN, HEADERS.PEMBELIAN);
  ensureSheet_(ss, SHEETS.PEMBELIAN_DETAIL, HEADERS.PEMBELIAN_DETAIL);

  // PATCH VER 8.0.3 - rapikan duplikat sheet sebelum memastikan sheet canonical
  repairDuplicateNamedSheet_(ss, SHEETS.UTANG_PIUTANG, HEADERS.UTANG_PIUTANG);
  repairDuplicateNamedSheet_(ss, SHEETS.PEMBAYARAN_UTANG_PIUTANG, HEADERS.PEMBAYARAN_UTANG_PIUTANG);

  ensureSheet_(ss, SHEETS.UTANG_PIUTANG, HEADERS.UTANG_PIUTANG);
  ensureSheet_(ss, SHEETS.PEMBAYARAN_UTANG_PIUTANG, HEADERS.PEMBAYARAN_UTANG_PIUTANG);

  // Sheet penyimpanan logo Base64
  ensureSheet_(
    ss,
    SHEETS.LOGO_ASSET,
    HEADERS.LOGO_ASSET
  );

  ensureDefaultAdmin_();
  ensureSampleProduk_();
  ensureDefaultBranding_();
}

function ensureSheet_(ss, name, headers){
  let sh = ss.getSheetByName(name);

  if(!sh){
    sh = ss.insertSheet(name);
  }

  const lastCol = Math.max(sh.getLastColumn(), headers.length);
  const existing = sh.getRange(1, 1, 1, lastCol).getValues()[0];

  if(sh.getLastRow() === 0 || !existing[0]){
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    return sh;
  }

  const map = {};
  existing.forEach((h, i) => {
    if(h) map[String(h).trim()] = i + 1;
  });

  headers.forEach(h => {
    if(!map[h]){
      sh.getRange(1, sh.getLastColumn() + 1).setValue(h);
    }
  });

  sh.setFrozenRows(1);
  return sh;
}


// PATCH VER 8.0.3 - normalisasi nama sheet dan merge duplikat aman
function normalizeSheetName_(name){
  return String(name || '')
    .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function repairDuplicateNamedSheet_(ss, canonicalName, headers){
  const targetKey = normalizeSheetName_(canonicalName);
  const matches = ss.getSheets().filter(sh => normalizeSheetName_(sh.getName()) === targetKey);

  if(!matches.length) return null;

  let canonical = matches.find(sh => sh.getName() === canonicalName) || matches[0];
  if(canonical.getName() !== canonicalName){
    try{ canonical.setName(canonicalName); }catch(ignore){}
  }

  ensureSheet_(ss, canonicalName, headers);
  canonical = ss.getSheetByName(canonicalName) || canonical;

  const canonicalRows = getObjects_(canonical);
  const existingIds = {};
  canonicalRows.forEach(r => {
    const id = s_(r.id);
    if(id) existingIds[id] = true;
  });

  matches.forEach(sh => {
    if(sh.getSheetId() === canonical.getSheetId()) return;

    const rows = getObjects_(sh);
    rows.forEach(r => {
      const id = s_(r.id);
      if(id && existingIds[id]) return;

      const obj = {};
      headers.forEach(h => {
        const k = normalizeHeader_(h);
        if(r[k] !== undefined) obj[k] = r[k];
      });

      appendObjectRowToSheet_(canonical, obj);
      if(id) existingIds[id] = true;
    });

    try{
      ss.deleteSheet(sh);
    }catch(err){
      console.warn('Gagal menghapus sheet duplikat ' + sh.getName(), err);
    }
  });

  return canonical;
}

function appendObjectRowToSheet_(sh, obj){
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(h => normalizeHeader_(h));
  sh.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : ''));
}

function ensureDefaultAdmin_(){
  const sh = getSheet_(SHEETS.USERS);
  const rows = getObjects_(sh);

  if(rows.length) return;

  sh.appendRow([
    uid_('USR'),
    'admin@pos.local',
    'Administrator',
    hash_('admin123'),
    'ADMIN',
    'AKTIF',
    now_()
  ]);
}

function ensureSampleProduk_(){
  const sh = getSheet_(SHEETS.PRODUK);
  const rows = getObjects_(sh);

  if(rows.length) return;

  const now = now_();

  sh.appendRow([
    uid_('PRD'),
    'BRG001',
    'Air Mineral 600ml',
    'Minuman',
    2500,
    4000,
    50,
    'PCS',
    'AKTIF',
    now,
    now
  ]);

  sh.appendRow([
    uid_('PRD'),
    'BRG002',
    'Roti Coklat',
    'Makanan',
    5000,
    7500,
    30,
    'PCS',
    'AKTIF',
    now,
    now
  ]);
}

/***** BRANDING SETTINGS *****/

function ensureDefaultBranding_(){
  const sh = getSheet_(SHEETS.SETTINGS);
  const rows = getObjects_(sh);

  const existingKeys = {};

  rows.forEach(r => {
    const key = s_(r.key).toUpperCase();

    if(key){
      existingKeys[key] = true;
    }
  });

  const newRows = [];

  Object.keys(BRAND_SETTING_KEYS).forEach(field => {
    const key = BRAND_SETTING_KEYS[field];

    if(!existingKeys[key]){
      newRows.push([
        key,
        BRAND_DEFAULTS[field],
        now_()
      ]);
    }
  });

  if(newRows.length){
    sh.getRange(
      sh.getLastRow() + 1,
      1,
      newRows.length,
      HEADERS.SETTINGS.length
    ).setValues(newRows);
  }
}

function brandingPublic_(){
  ensureDefaultBranding_();

  const branding = readBrandingSettings_();

  branding.brandLogoDataUrl =
    getBrandLogoDataUrl_(
      branding.brandLogoFileId
    );

  return ok_({
    branding: branding,
    signature: KSL_SIGNATURE
  });
}

function brandingGet_(p){
  assertAdmin_(p);
  ensureDefaultBranding_();

  const branding = readBrandingSettings_();

  branding.brandLogoDataUrl =
    getBrandLogoDataUrl_(
      branding.brandLogoFileId
    );

  return ok_({
    branding: branding,
    signature: KSL_SIGNATURE
  });
}

function brandingSave_(p){
  assertAdmin_(p);

  const data = p && p.branding ? p.branding : p || {};
  const currentBranding = readBrandingSettings_();

  const branding = {
    brandName:
      cleanBrandText_(data.brandName, 100) ||
      BRAND_DEFAULTS.brandName,

    brandShortName:
      cleanBrandText_(data.brandShortName, 50) ||
      BRAND_DEFAULTS.brandShortName,

    brandTagline:
      cleanBrandText_(data.brandTagline, 150),

    brandLogoFileId:
      s_(
        data.brandLogoFileId !== undefined
          ? data.brandLogoFileId
          : currentBranding.brandLogoFileId
      ),

    brandLogoUrl:
      s_(
        data.brandLogoUrl !== undefined
          ? data.brandLogoUrl
          : currentBranding.brandLogoUrl
      ),

    brandAddress:
      cleanBrandText_(data.brandAddress, 250),

    brandPhone:
      cleanBrandText_(data.brandPhone, 50),

    brandReceiptFooter:
      cleanBrandMultiline_(data.brandReceiptFooter, 300) ||
      BRAND_DEFAULTS.brandReceiptFooter,

    brandPrimaryColor:
      normalizeHexColor_(
        data.brandPrimaryColor,
        BRAND_DEFAULTS.brandPrimaryColor
      ),

    showLoginLogo:
      normalizeYaTidak_(data.showLoginLogo, 'YA'),

    showReportLogo:
      normalizeYaTidak_(data.showReportLogo, 'YA'),

    showReceiptLogo:
      normalizeYaTidak_(data.showReceiptLogo, 'YA')
  };

  const lock = LockService.getScriptLock();

  try{
    lock.waitLock(20000);

    Object.keys(BRAND_SETTING_KEYS).forEach(field => {
      upsertSetting_(
        BRAND_SETTING_KEYS[field],
        branding[field]
      );
    });

  }finally{
    try{
      lock.releaseLock();
    }catch(ignore){}
  }

  branding.brandLogoDataUrl =
  getBrandLogoDataUrl_(
    branding.brandLogoFileId
  );

  return ok_({
    branding: branding,
    signature: KSL_SIGNATURE
  }, 'Pengaturan branding berhasil disimpan');
}

function brandingLogoUpload_(p){
  assertAdmin_(p);

  const fileName = cleanBrandFileName_(
    p.fileName || 'logo-usaha.png'
  );

  const mimeType = s_(p.mimeType).toLowerCase();
  const base64Data = extractBase64Data_(p.base64);

  const allowedMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
  ];

  if(!allowedMimeTypes.includes(mimeType)){
    return fail_(
      'Format logo harus PNG, JPG, JPEG, atau WEBP.'
    );
  }

  if(!base64Data){
    return fail_('Data logo tidak ditemukan');
  }

  let bytes;

  try{
    bytes = Utilities.base64Decode(base64Data);
  }catch(err){
    return fail_('Data logo tidak valid');
  }

  if(!bytes || !bytes.length){
    return fail_('File logo kosong');
  }

  if(bytes.length > BRAND_LOGO_MAX_BYTES){
    return fail_(
      'Ukuran logo setelah kompresi maksimal 600 KB'
    );
  }

  const lock = LockService.getScriptLock();

  try{
    lock.waitLock(20000);

    saveBrandLogoToSheet_({
      base64: base64Data,
      mimeType: mimeType,
      fileName: fileName
    });

    const fileId = 'SHEET_LOGO';

    upsertSetting_(
      BRAND_SETTING_KEYS.brandLogoFileId,
      fileId
    );

    upsertSetting_(
      BRAND_SETTING_KEYS.brandLogoUrl,
      ''
    );

    const branding = readBrandingSettings_();

    branding.brandLogoDataUrl =
      'data:' + mimeType + ';base64,' + base64Data;

    return ok_({
      fileId: fileId,
      logoUrl: '',
      branding: branding,
      signature: KSL_SIGNATURE
    }, 'Logo berhasil disimpan');

  }finally{
    try{
      lock.releaseLock();
    }catch(ignore){}
  }
}

function brandingLogoDelete_(p){
  assertAdmin_(p);

  const lock = LockService.getScriptLock();

  try{
    lock.waitLock(20000);

    clearBrandLogoSheet_();

    upsertSetting_(
      BRAND_SETTING_KEYS.brandLogoFileId,
      ''
    );

    upsertSetting_(
      BRAND_SETTING_KEYS.brandLogoUrl,
      ''
    );

    const branding = readBrandingSettings_();
    branding.brandLogoDataUrl = '';

    return ok_({
      branding: branding,
      signature: KSL_SIGNATURE
    }, 'Logo berhasil dihapus');

  }finally{
    try{
      lock.releaseLock();
    }catch(ignore){}
  }
}





function getBrandLogoDataUrl_(){
  try{
    const sh = getSheet_(SHEETS.LOGO_ASSET);
    const rows = getObjects_(sh);

    if(!rows.length){
      return '';
    }

    rows.sort((a, b) =>
      Number(a.chunkindex || a.chunkIndex || 0) -
      Number(b.chunkindex || b.chunkIndex || 0)
    );

    const base64 = rows
      .map(r => s_(r.chunkdata || r.chunkData))
      .join('');

    if(!base64){
      return '';
    }

    const mimeType =
      s_(rows[0].mimetype || rows[0].mimeType) ||
      'image/png';

    return 'data:' +
      mimeType +
      ';base64,' +
      base64;

  }catch(err){
    console.warn(
      'Gagal membaca logo dari sheet:',
      err
    );

    return '';
  }
}

function saveBrandLogoToSheet_(payload){
  payload = payload || {};

  const base64 = s_(payload.base64);
  const mimeType = s_(payload.mimeType);
  const fileName = s_(payload.fileName);

  if(!base64){
    throw new Error('Data logo kosong');
  }

  const sh = getSheet_(SHEETS.LOGO_ASSET);

  if(sh.getLastRow() > 1){
    sh.getRange(
      2,
      1,
      sh.getLastRow() - 1,
      sh.getLastColumn()
    ).clearContent();
  }

  const chunks = [];

  for(
    let i = 0;
    i < base64.length;
    i += BRAND_LOGO_CHUNK_SIZE
  ){
    chunks.push(
      base64.substring(
        i,
        i + BRAND_LOGO_CHUNK_SIZE
      )
    );
  }

  const now = now_();

  const values = chunks.map((chunk, index) => [
    index,
    chunk,
    mimeType,
    fileName,
    now
  ]);

  if(values.length){
    sh.getRange(
      2,
      1,
      values.length,
      HEADERS.LOGO_ASSET.length
    ).setValues(values);
  }
}

function clearBrandLogoSheet_(){
  const sh = getSheet_(SHEETS.LOGO_ASSET);

  if(sh.getLastRow() <= 1){
    return;
  }

  sh.getRange(
    2,
    1,
    sh.getLastRow() - 1,
    sh.getLastColumn()
  ).clearContent();
}

function extractBase64Data_(value){
  const text = value === null || value === undefined
    ? ''
    : String(value);

  if(!text){
    return '';
  }

  const commaIndex = text.indexOf(',');

  if(text.startsWith('data:') && commaIndex >= 0){
    return text.substring(commaIndex + 1);
  }

  return text;
}

function cleanBrandFileName_(value){
  let fileName = s_(value)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  if(!fileName){
    fileName = 'logo-usaha.png';
  }

  if(fileName.length > 120){
    fileName = fileName.substring(
      fileName.length - 120
    );
  }

  return fileName;
}

function readBrandingSettings_(){
  const rows = getObjects_(getSheet_(SHEETS.SETTINGS));
  const values = {};

  rows.forEach(r => {
    const key = s_(r.key).toUpperCase();

    if(key){
      values[key] = s_(r.value);
    }
  });

  const result = {};

  Object.keys(BRAND_SETTING_KEYS).forEach(field => {
    const key = BRAND_SETTING_KEYS[field];

    result[field] =
      values[key] !== undefined && values[key] !== ''
        ? values[key]
        : BRAND_DEFAULTS[field];
  });

  result.brandPrimaryColor = normalizeHexColor_(
    result.brandPrimaryColor,
    BRAND_DEFAULTS.brandPrimaryColor
  );

  result.showLoginLogo = normalizeYaTidak_(
    result.showLoginLogo,
    'YA'
  );

  result.showReportLogo = normalizeYaTidak_(
    result.showReportLogo,
    'YA'
  );

  result.showReceiptLogo = normalizeYaTidak_(
    result.showReceiptLogo,
    'YA'
  );

  return result;
}

function upsertSetting_(key, value){
  const sh = getSheet_(SHEETS.SETTINGS);
  const rows = getObjects_(sh);
  const map = headerMap_(sh);

  const keyCol = col_(map, ['key']);
  const valueCol = col_(map, ['value']);
  const updatedAtCol = col_(map, ['updatedAt', 'updatedat']);

  if(!keyCol || !valueCol){
    throw new Error('Header key/value pada sheet SETTINGS tidak ditemukan');
  }

  const normalizedKey = s_(key).toUpperCase();

  const existing = rows.find(r =>
    s_(r.key).toUpperCase() === normalizedKey
  );

  if(existing){
    sh.getRange(existing.__rowNum, valueCol).setValue(value);

    if(updatedAtCol){
      sh.getRange(existing.__rowNum, updatedAtCol).setValue(now_());
    }

    return;
  }

  const row = new Array(sh.getLastColumn()).fill('');

  row[keyCol - 1] = normalizedKey;
  row[valueCol - 1] = value;

  if(updatedAtCol){
    row[updatedAtCol - 1] = now_();
  }

  sh.appendRow(row);
}

function cleanBrandText_(value, maxLength){
  let text = s_(value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if(maxLength && text.length > maxLength){
    text = text.substring(0, maxLength);
  }

  return text;
}

function cleanBrandMultiline_(value, maxLength){
  let text = value === null || value === undefined
    ? ''
    : String(value);

  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();

  if(maxLength && text.length > maxLength){
    text = text.substring(0, maxLength);
  }

  return text;
}

function cleanBrandUrl_(value){
  const url = s_(value);

  if(!url){
    return '';
  }

  if(!/^https?:\/\//i.test(url)){
    throw new Error('URL logo harus diawali http:// atau https://');
  }

  if(url.length > 1000){
    throw new Error('URL logo terlalu panjang');
  }

  return url;
}

function normalizeHexColor_(value, fallback){
  const color = s_(value);

  if(/^#[0-9a-f]{6}$/i.test(color)){
    return color.toLowerCase();
  }

  return fallback || '#2563eb';
}

function normalizeYaTidak_(value, fallback){
  const result = s_(value).toUpperCase();

  if(result === 'YA' || result === 'TIDAK'){
    return result;
  }

  return fallback || 'TIDAK';
}

/***** AUTH *****/

function authLogin_(p){
  const email = s_(p.email).toLowerCase();
  const password = s_(p.password);

  if(!email) return fail_('Email wajib diisi');
  if(!password) return fail_('Password wajib diisi');

  const users = getObjects_(getSheet_(SHEETS.USERS));

  console.log('LOGIN EMAIL:', email);
  console.log('USERS READ:', JSON.stringify(users));

  const user = users.find(r =>
    s_(r.email).toLowerCase() === email &&
    s_(r.status).toUpperCase() === 'AKTIF'
  );

  if(!user){
    return fail_('User tidak ditemukan atau tidak aktif');
  }

  const savedHash =
    s_(user.passwordHash) ||
    s_(user.passwordhash) ||
    s_(user.PASSWORDHASH);

  const inputHash = hash_(password);

  console.log('SAVED HASH:', savedHash);
  console.log('INPUT HASH:', inputHash);

  if(savedHash !== inputHash){
    return fail_('Password salah');
  }

  const token = Utilities.getUuid();
  const cache = CacheService.getScriptCache();

  cache.put(
    'TOKEN_' + token,
    JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role
    }),
    21600
  );

  return ok_({
    token: token,
    me: {
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}

function requireAuth_(p){
  const token = s_(p.token);

  if(!token){
    throw new Error('Token tidak ditemukan. Silakan login ulang.');
  }

  const cache = CacheService.getScriptCache();
  const raw = cache.get('TOKEN_' + token);

  if(!raw){
    throw new Error('Sesi sudah habis. Silakan login ulang.');
  }

  return JSON.parse(raw);
}

function getMe_(p){
  const me = requireAuth_(p);
  return ok_(me);
}

/***** USERS CRUD *****/

function assertAdmin_(p){
  const me = requireAuth_(p);

  if(s_(me.role).toUpperCase() !== 'ADMIN'){
    throw new Error('Hanya ADMIN yang dapat mengakses menu Users');
  }

  return me;
}

function userList_(p){
  assertAdmin_(p);

  const q = s_(p.q).toLowerCase();

  let rows = getObjects_(getSheet_(SHEETS.USERS));

  rows = rows.filter(r =>
    s_(r.status).toUpperCase() !== 'HAPUS'
  );

  if(q){
    rows = rows.filter(r =>
      s_(r.email).toLowerCase().includes(q) ||
      s_(r.name).toLowerCase().includes(q) ||
      s_(r.role).toLowerCase().includes(q) ||
      s_(r.status).toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) =>
    s_(a.name).localeCompare(s_(b.name)) ||
    s_(a.email).localeCompare(s_(b.email))
  );

  const safeRows = rows.map(r => ({
    id: s_(r.id),
    email: s_(r.email),
    name: s_(r.name),
    role: s_(r.role),
    status: s_(r.status),
    createdAt: r.createdat || r.createdAt || '',
    updatedAt: r.updatedat || r.updatedAt || ''
  }));

  return ok_(safeRows);
}

function userSave_(p){
  const me = assertAdmin_(p);

  const sh = getSheet_(SHEETS.USERS);
  const rows = getObjects_(sh);
  const map = headerMap_(sh);

  const id = s_(p.id) || uid_('USR');
  const email = s_(p.email).toLowerCase();
  const name = s_(p.name);
  const password = s_(p.password);
  const role = s_(p.role).toUpperCase();
  const status = s_(p.status).toUpperCase() || 'AKTIF';

  if(!email) return fail_('Email wajib diisi');
  if(!name) return fail_('Nama wajib diisi');

  if(!['ADMIN', 'KASIR'].includes(role)){
    return fail_('Role tidak valid');
  }

  if(!['AKTIF', 'NONAKTIF'].includes(status)){
    return fail_('Status tidak valid');
  }

  const existing = rows.find(r => s_(r.id) === id);

  if(!existing && !password){
    return fail_('Password wajib diisi untuk user baru');
  }

  const duplicate = rows.find(r =>
    s_(r.email).toLowerCase() === email &&
    s_(r.id) !== id &&
    s_(r.status).toUpperCase() !== 'HAPUS'
  );

  if(duplicate){
    return fail_('Email sudah digunakan user lain');
  }

  const now = now_();

  const obj = {
    id: id,
    email: email,
    name: name,
    role: role,
    status: status,
    createdat: existing ? existing.createdat : now,
    updatedat: now
  };

  if(password){
    obj.passwordhash = hash_(password);
  }else if(existing){
    obj.passwordhash = existing.passwordhash;
  }

  if(existing){
    const rowNum = existing.__rowNum;

    Object.keys(obj).forEach(k => {
      if(map[k]){
        sh.getRange(rowNum, map[k]).setValue(obj[k]);
      }
    });

  }else{
    const headers = sh
      .getRange(1, 1, 1, sh.getLastColumn())
      .getValues()[0]
      .map(h => normalizeHeader_(h));

    const newRow = headers.map(h =>
      obj[h] !== undefined ? obj[h] : ''
    );

    sh.appendRow(newRow);
  }

  return ok_({
    id: id,
    email: email,
    name: name,
    role: role,
    status: status
  }, 'User berhasil disimpan');
}

function userDelete_(p){
  const me = assertAdmin_(p);

  const id = s_(p.id);
  if(!id) return fail_('ID user wajib diisi');

  const sh = getSheet_(SHEETS.USERS);
  const rows = getObjects_(sh);
  const map = headerMap_(sh);

  const row = rows.find(r => s_(r.id) === id);
  if(!row) return fail_('User tidak ditemukan');

  if(s_(row.email).toLowerCase() === s_(me.email).toLowerCase()){
    return fail_('User yang sedang login tidak boleh menghapus dirinya sendiri');
  }

  if(!map.status){
    return fail_('Kolom status tidak ditemukan di sheet USERS');
  }

  sh.getRange(row.__rowNum, map.status).setValue('HAPUS');

  if(map.updatedat){
    sh.getRange(row.__rowNum, map.updatedat).setValue(now_());
  }

  return ok_(null, 'User berhasil dihapus');
}

/***** DASHBOARD *****/

function dashboardSummary_(p){
  requireAuth_(p);

  const trx = getObjects_(getSheet_(SHEETS.TRANSAKSI));
  const produk = getObjects_(getSheet_(SHEETS.PRODUK));

  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');

  const last7Days = makeLastDays_(7);

  const dailyMap = {};
  last7Days.forEach(d => {
    dailyMap[d.ymd] = {
      tanggal: d.ymd,
      label: d.label,
      total: 0,
      transaksi: 0
    };
  });

  let totalHariIni = 0;
  let transaksiHariIni = 0;

  trx.forEach(r => {
    const tgl = normalizeDateYmd_(getField_(r, [
      'tanggal',
      'TANGGAL'
    ]));

    const status = s_(getField_(r, [
      'status',
      'STATUS'
    ])).toUpperCase();

    const total = num_(getField_(r, [
      'total',
      'TOTAL'
    ]));

    if(status !== 'SELESAI'){
      return;
    }

    if(tgl === today){
      transaksiHariIni++;
      totalHariIni += total;
    }

    if(dailyMap[tgl]){
      dailyMap[tgl].transaksi++;
      dailyMap[tgl].total += total;
    }
  });

  const rekapHarian7 = last7Days.map(d => dailyMap[d.ymd]);

  const total7Hari = rekapHarian7.reduce((sum, r) => sum + num_(r.total), 0);
  const transaksi7Hari = rekapHarian7.reduce((sum, r) => sum + num_(r.transaksi), 0);

  const hariTerbaik = rekapHarian7.reduce((best, r) => {
    if(!best || num_(r.total) > num_(best.total)){
      return r;
    }

    return best;
  }, null);

  const rataRataHarian = Math.round(total7Hari / 7);

  const stokMenipis = produk.filter(r => {
    const status = s_(getField_(r, [
      'status',
      'STATUS'
    ])).toUpperCase();

    const stok = num_(getField_(r, [
      'stok',
      'STOK'
    ]));

    return status === 'AKTIF' && stok <= 5;
  }).length;

  const jumlahProduk = produk.filter(r => {
    const status = s_(getField_(r, [
      'status',
      'STATUS'
    ])).toUpperCase();

    return status !== 'HAPUS';
  }).length;

  return ok_({
    totalHariIni: totalHariIni,
    transaksiHariIni: transaksiHariIni,
    jumlahProduk: jumlahProduk,
    stokMenipis: stokMenipis,

    total7Hari: total7Hari,
    transaksi7Hari: transaksi7Hari,
    rataRataHarian: rataRataHarian,
    hariTerbaik: hariTerbaik,
    rekapHarian7: rekapHarian7
  });
}

/***** PRODUK *****/

function produkList_(p){
  requireAuth_(p);
  p = p || {};

  const q = s_(p.q).toLowerCase();
  let rows = getObjects_(getSheet_(SHEETS.PRODUK));

  rows = rows.filter(r => s_(r.status).toUpperCase() !== 'HAPUS');

  if(q){
    rows = rows.filter(r =>
      s_(r.nama).toLowerCase().includes(q) ||
      s_(r.kode).toLowerCase().includes(q) ||
      s_(r.kategori).toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => s_(a.nama).localeCompare(s_(b.nama)));

  // Tanpa parameter page/pageSize: tetap kompatibel untuk modul Kasir/Pembelian.
  const usePagination = p.page !== undefined || p.pageSize !== undefined;
  if(!usePagination){
    return ok_(rows);
  }

  const pageSize = Math.max(5, Math.min(100, Math.floor(num_(p.pageSize) || 10)));
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const page = Math.max(1, Math.min(totalPages, Math.floor(num_(p.page) || 1)));
  const startIndex = (page - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  return ok_({
    rows: pageRows,
    page: page,
    pageSize: pageSize,
    totalRows: totalRows,
    totalPages: totalPages,
    start: totalRows ? startIndex + 1 : 0,
    end: Math.min(startIndex + pageRows.length, totalRows)
  });
}

function produkSave_(p){
  const me = requireAuth_(p);

  if(s_(me.role).toUpperCase() !== 'ADMIN'){
    return fail_('Hanya ADMIN yang dapat menyimpan produk');
  }

  const sh = getSheet_(SHEETS.PRODUK);
  const rows = getObjects_(sh);
  const map = headerMap_(sh);

  const id = s_(p.id) || uid_('PRD');
  const kode = s_(p.kode);
  const nama = s_(p.nama);
  const kategori = s_(p.kategori);
  const tipeProduk = s_(p.tipeProduk).toUpperCase() || 'FISIK';
  const wajibNomor = s_(p.wajibNomor).toUpperCase() || 'TIDAK';
  const labelNomor = s_(p.labelNomor) || 'Nomor Tujuan';
  const adminFee = num_(p.adminFee);
  const stokMode = s_(p.stokMode).toUpperCase() || 'POTONG_STOK';
  const hargaManual = s_(p.hargaManual).toUpperCase() || 'TIDAK';

  // PATCH PECAHAN
  const jualPecahan = s_(p.jualPecahan).toUpperCase() || 'TIDAK';
  const langkahQtyRaw = num_(p.langkahQty);
  const langkahQty = langkahQtyRaw > 0 ? langkahQtyRaw : 0.01;

  const hargaBeli = num_(p.hargaBeli);
  const hargaJual = num_(p.hargaJual);
  const stok = num_(p.stok);
  const satuan = s_(p.satuan) || 'PCS';

  // PATCH VER 8.1 - GAMBAR PRODUK
  const gambarBase64 = extractBase64Data_(p.gambarBase64);
  const gambarMimeType = s_(p.gambarMimeType).toLowerCase();
  const gambarFileName = s_(p.gambarFileName);
  const hapusGambar = String(p.hapusGambar || '').toUpperCase() === 'YA';

  if(!kode) return fail_('Kode produk wajib diisi');
  if(!nama) return fail_('Nama produk wajib diisi');
  if(hargaJual <= 0) return fail_('Harga jual wajib lebih dari 0');
  if(stok < 0) return fail_('Stok tidak boleh negatif');

  if(!['FISIK', 'DIGITAL'].includes(tipeProduk)) return fail_('Tipe produk tidak valid');
  if(!['YA', 'TIDAK'].includes(wajibNomor)) return fail_('Wajib nomor tidak valid');
  if(!['POTONG_STOK', 'TANPA_STOK'].includes(stokMode)) return fail_('Mode stok tidak valid');
  if(!['YA', 'TIDAK'].includes(hargaManual)) return fail_('Harga manual tidak valid');
  if(!['YA', 'TIDAK'].includes(jualPecahan)) return fail_('Mode penjualan pecahan tidak valid');

  const duplicate = rows.find(r =>
    s_(r.kode).toUpperCase() === kode.toUpperCase() &&
    s_(r.id) !== id &&
    s_(r.status).toUpperCase() !== 'HAPUS'
  );
  if(duplicate) return fail_('Kode produk sudah digunakan');

  const existing = rows.find(r => s_(r.id) === id);
  const now = now_();

  let gambarFileId = existing ? s_(getField_(existing, ['gambarFileId','gambarfileid'])) : '';
  let gambarUrl = existing ? s_(getField_(existing, ['gambarUrl','gambarurl'])) : '';

  if(hapusGambar && gambarFileId){
    trashProductImage_(gambarFileId);
    gambarFileId = '';
    gambarUrl = '';
  }

  if(gambarBase64){
    const uploaded = saveProductImageToDrive_({
      productId: id,
      productCode: kode,
      base64: gambarBase64,
      mimeType: gambarMimeType,
      fileName: gambarFileName
    });

    if(gambarFileId && gambarFileId !== uploaded.fileId){
      trashProductImage_(gambarFileId);
    }

    gambarFileId = uploaded.fileId;
    gambarUrl = uploaded.url;
  }

  const obj = {
    id, kode, nama, kategori,
    hargabeli: hargaBeli,
    hargajual: hargaJual,
    stok: tipeProduk === 'DIGITAL' ? 999999 : roundQty_(stok),
    satuan,
    status: 'AKTIF',
    createdat: existing ? existing.createdat : now,
    updatedat: now,
    tipeproduk: tipeProduk,
    wajibnomor: wajibNomor,
    labelnomor: labelNomor,
    adminfee: adminFee,
    stokmode: stokMode,
    hargamanual: hargaManual,
    jualpecahan: tipeProduk === 'DIGITAL' ? 'TIDAK' : jualPecahan,
    langkahqty: langkahQty,
    gambarfileid: gambarFileId,
    gambarurl: gambarUrl
  };

  if(existing){
    Object.keys(obj).forEach(k => {
      if(map[k]) sh.getRange(existing.__rowNum, map[k]).setValue(obj[k]);
    });
  }else{
    const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(h => normalizeHeader_(h));
    sh.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : ''));
  }

  return ok_(obj, 'Produk berhasil disimpan');
}

// PATCH VER 8.1 - SIMPAN GAMBAR PRODUK KE GOOGLE DRIVE
function saveProductImageToDrive_(payload){
  payload = payload || {};

  const base64 = extractBase64Data_(payload.base64);
  const mimeType = s_(payload.mimeType).toLowerCase();
  const productId = s_(payload.productId) || 'PRODUK';
  const productCode = s_(payload.productCode) || productId;

  const allowed = ['image/png','image/jpeg','image/jpg','image/webp'];
  if(!allowed.includes(mimeType)){
    throw new Error('Format gambar produk harus PNG, JPG, JPEG, atau WEBP');
  }

  if(!base64) throw new Error('Data gambar produk kosong');

  let bytes;
  try{ bytes = Utilities.base64Decode(base64); }
  catch(err){ throw new Error('Data gambar produk tidak valid'); }

  if(!bytes || !bytes.length) throw new Error('File gambar produk kosong');
  if(bytes.length > PRODUCT_IMAGE_MAX_BYTES){
    throw new Error('Ukuran gambar produk maksimal 500 KB setelah kompresi');
  }

  const folders = DriveApp.getFoldersByName(PRODUCT_IMAGE_FOLDER_NAME);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(PRODUCT_IMAGE_FOLDER_NAME);

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const safeCode = productCode.replace(/[^a-zA-Z0-9_-]/g, '-').substring(0, 50) || productId;
  const fileName = productId + '-' + safeCode + '-' + new Date().getTime() + '.' + ext;

  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = folder.createFile(blob);

  // Agar <img> pada Web App dapat membaca file. Pada Workspace yang melarang
  // public-link, setSharing dapat gagal dan pesan akan dijelaskan ke pengguna.
  try{
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }catch(err){
    try{ file.setTrashed(true); }catch(ignore){}
    throw new Error('Gambar gagal dipublikasikan. Izinkan berbagi Anyone with the link pada Google Drive akun ini.');
  }

  return {
    fileId: file.getId(),
    url: 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(file.getId()) + '&sz=w600'
  };
}

function trashProductImage_(fileId){
  fileId = s_(fileId);
  if(!fileId) return;
  try{
    DriveApp.getFileById(fileId).setTrashed(true);
  }catch(err){
    console.warn('Gagal menghapus gambar produk lama:', fileId, err);
  }
}

function produkDelete_(p){
  const me = requireAuth_(p);

  if(me.role !== 'ADMIN'){
    return fail_('Hanya ADMIN yang dapat menghapus produk');
  }

  const id = s_(p.id);
  if(!id) return fail_('ID produk wajib diisi');

  const sh = getSheet_(SHEETS.PRODUK);
  const rows = getObjects_(sh);
  const map = headerMap_(sh);

  const row = rows.find(r => s_(r.id) === id);
  if(!row) return fail_('Produk tidak ditemukan');

  const gambarFileId = s_(getField_(row, ['gambarFileId','gambarfileid']));
  if(gambarFileId) trashProductImage_(gambarFileId);

  sh.getRange(row.__rowNum, map.status).setValue('HAPUS');
  sh.getRange(row.__rowNum, map.updatedAt).setValue(now_());

  return ok_(null, 'Produk berhasil dihapus');
}

/***** PEMBELIAN / BELANJA STOK *****/

function pembelianSave_(p){
  const me = requireAuth_(p);

  if(s_(me.role).toUpperCase() !== 'ADMIN'){
    return fail_('Hanya ADMIN yang dapat input pembelian barang');
  }

  const supplier = s_(p.supplier);
  const catatan = s_(p.catatan);
  const items = Array.isArray(p.items) ? p.items : [];
  const metodePembayaran = s_(p.metodePembayaran).toUpperCase() || 'LUNAS';
  let dibayar = num_(p.dibayar);
  const jatuhTempo = s_(p.jatuhTempo);

  if(!items.length){
    return fail_('Item pembelian masih kosong');
  }

  const produkSh = getSheet_(SHEETS.PRODUK);
  const produkRows = getObjects_(produkSh);
  const produkMap = headerMap_(produkSh);

  const stokCol = col_(produkMap, ['stok']);
  const hargaBeliCol = col_(produkMap, ['hargaBeli', 'hargabeli']);
  const updatedAtCol = col_(produkMap, ['updatedAt', 'updatedat']);

  if(!stokCol){
    return fail_('Kolom stok tidak ditemukan di sheet PRODUK');
  }

  const finalItems = [];
  let total = 0;

  items.forEach(item => {
    const produkId = s_(item.produkId);
    const qty = num_(item.qty);
    const hargaBeli = num_(item.hargaBeli);

    if(!produkId){
      throw new Error('Produk wajib dipilih');
    }

    if(qty <= 0){
      throw new Error('Qty beli wajib lebih dari 0');
    }

    if(hargaBeli <= 0){
      throw new Error('Harga beli wajib lebih dari 0');
    }

    const produk = produkRows.find(r =>
      s_(r.id) === produkId &&
      s_(r.status).toUpperCase() === 'AKTIF'
    );

    if(!produk){
      throw new Error('Produk tidak ditemukan atau tidak aktif');
    }

    const tipeProduk = s_(getField_(produk, [
      'tipeProduk',
      'tipeproduk'
    ])).toUpperCase() || 'FISIK';

    const stokMode = s_(getField_(produk, [
      'stokMode',
      'stokmode'
    ])).toUpperCase() || 'POTONG_STOK';

    if(tipeProduk === 'DIGITAL' || stokMode === 'TANPA_STOK'){
      throw new Error('Produk ' + produk.nama + ' tidak menggunakan stok fisik');
    }

    const subtotal = qty * hargaBeli;
    total += subtotal;

    finalItems.push({
      produk: produk,
      qty: qty,
      hargaBeli: hargaBeli,
      subtotal: subtotal
    });
  });

  if(metodePembayaran === 'TEMPO'){
    if(!supplier) return fail_('Supplier wajib diisi untuk pembelian tempo');
    if(dibayar < 0) dibayar = 0;
    if(dibayar > total) dibayar = total;
  }else{
    dibayar = total;
  }

  const sisaUtang = Math.max(0, total - dibayar);

  const pembelianId = uid_('BELI');
  const nomor = makePembelianNomor_();
  const tanggal = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const createdAt = now_();

  appendObjectRow_(SHEETS.PEMBELIAN, {
    id: pembelianId,
    nomor: nomor,
    tanggal: tanggal,
    supplier: supplier,
    total: total,
    catatan: catatan,
    createdbyemail: me.email,
    createdbyname: me.name,
    createdat: createdAt,
    metodepembayaran: metodePembayaran,
    dibayar: dibayar,
    jatuhtempo: jatuhTempo,
    sisautang: sisaUtang
  });

  if(sisaUtang > 0){
    appendObjectRow_(SHEETS.UTANG_PIUTANG, {
      id: uid_('UP'),
      jenis: 'UTANG',
      pihak: supplier,
      referensi: nomor,
      tanggal: tanggal,
      jatuhtempo: jatuhTempo,
      total: total,
      dibayar: dibayar,
      sisa: sisaUtang,
      status: dibayar > 0 ? 'SEBAGIAN' : 'BELUM LUNAS',
      catatan: catatan,
      createdat: createdAt,
      updatedat: createdAt
    });
  }

  finalItems.forEach(it => {
    appendObjectRow_(SHEETS.PEMBELIAN_DETAIL, {
      id: uid_('BELIDTL'),
      pembelianid: pembelianId,
      nomor: nomor,
      produkid: it.produk.id,
      kode: it.produk.kode,
      nama: it.produk.nama,
      qty: it.qty,
      hargabeli: it.hargaBeli,
      subtotal: it.subtotal,
      createdat: createdAt
    });

    const rowNum = it.produk.__rowNum;
    const stokLama = num_(it.produk.stok);
    const stokBaru = roundQty_(stokLama + it.qty);

    produkSh.getRange(rowNum, stokCol).setValue(stokBaru);

    if(hargaBeliCol){
      produkSh.getRange(rowNum, hargaBeliCol).setValue(it.hargaBeli);
    }

    if(updatedAtCol){
      produkSh.getRange(rowNum, updatedAtCol).setValue(createdAt);
    }
  });

  return ok_({
    id: pembelianId,
    nomor: nomor,
    tanggal: tanggal,
    supplier: supplier,
    total: total,
    items: finalItems.map(it => ({
      produkId: it.produk.id,
      kode: it.produk.kode,
      nama: it.produk.nama,
      qty: it.qty,
      hargaBeli: it.hargaBeli,
      subtotal: it.subtotal
    }))
  }, 'Pembelian berhasil disimpan dan stok otomatis bertambah');
}

function pembelianList_(p){
  const me = requireAuth_(p);

  if(s_(me.role).toUpperCase() !== 'ADMIN'){
    return fail_('Hanya ADMIN yang dapat melihat pembelian');
  }

  const q = s_(p.q).toLowerCase();

  let rows = getObjects_(getSheet_(SHEETS.PEMBELIAN));

  if(q){
    rows = rows.filter(r =>
      s_(r.nomor).toLowerCase().includes(q) ||
      s_(r.supplier).toLowerCase().includes(q) ||
      s_(r.createdbyname).toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) =>
    s_(b.createdat).localeCompare(s_(a.createdat))
  );

  return ok_(rows.slice(0, 100));
}

function makePembelianNomor_(){
  const date = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return 'PB-' + date + '-' + rand;
}

/***** TRANSAKSI *****/

function transaksiCheckout_(p){
  const me = requireAuth_(p);

  const items = Array.isArray(p.items) ? p.items : [];
  const bayar = num_(p.bayar);
  const diskon = num_(p.diskon);
  const metode = s_(p.metode).toUpperCase() || 'CASH';
  const customer = s_(p.customer);
  const jatuhTempo = s_(p.jatuhTempo);

  if(!items.length){
    return fail_('Keranjang masih kosong');
  }

  const produkSh = getSheet_(SHEETS.PRODUK);
  const produkRows = getObjects_(produkSh);
  const produkMap = headerMap_(produkSh);

  let subtotal = 0;
  const finalItems = [];

  items.forEach(item => {
    const produkId = s_(item.produkId);
    const qty = num_(item.qty);
    const nomorTujuan = s_(item.nomorTujuan);
    const catatan = s_(item.catatan);
    const hargaInput = num_(item.hargaInput);

    if(!produkId || qty <= 0){
      throw new Error('Item transaksi tidak valid');
    }

    const produk = produkRows.find(r =>
      s_(r.id) === produkId &&
      s_(r.status).toUpperCase() === 'AKTIF'
    );

    if(!produk){
      throw new Error('Produk tidak ditemukan');
    }

    const tipeProduk = s_(getField_(produk, [
      'tipeProduk',
      'tipeproduk',
      'TIPEPRODUK'
    ])).toUpperCase() || 'FISIK';

    const wajibNomor = s_(getField_(produk, [
      'wajibNomor',
      'wajibnomor',
      'WAJIBNOMOR'
    ])).toUpperCase() || 'TIDAK';

    const labelNomor = s_(getField_(produk, [
      'labelNomor',
      'labelnomor',
      'LABELNOMOR'
    ])) || 'Nomor Tujuan';

    const adminFee = num_(getField_(produk, [
      'adminFee',
      'adminfee',
      'ADMINFEE'
    ]));

    const stokMode = s_(getField_(produk, [
      'stokMode',
      'stokmode',
      'STOKMODE'
    ])).toUpperCase() || 'POTONG_STOK';

    const hargaManual = s_(getField_(produk, [
      'hargaManual',
      'hargamanual',
      'HARGAMANUAL'
    ])).toUpperCase() || 'TIDAK';

    if(tipeProduk === 'DIGITAL' && wajibNomor === 'YA' && !nomorTujuan){
      throw new Error(labelNomor + ' wajib diisi untuk ' + produk.nama);
    }

    if(tipeProduk !== 'DIGITAL' && stokMode !== 'TANPA_STOK'){
      const stok = num_(produk.stok);

      if((stok + 0.000000001) < qty){
        throw new Error('Stok produk ' + produk.nama + ' tidak cukup. Tersedia ' + stok + ' ' + s_(produk.satuan));
      }
    }

    let harga = getProdukHargaJual_(produk);

    if(tipeProduk === 'DIGITAL' && hargaManual === 'YA'){
      harga = hargaInput;
    }

    if(harga <= 0){
      throw new Error('Harga produk ' + produk.nama + ' tidak valid');
    }

    const itemSubtotal = (harga * qty) + adminFee;

    subtotal += itemSubtotal;

    finalItems.push({
      produk: produk,
      tipeProduk: tipeProduk,
      wajibNomor: wajibNomor,
      labelNomor: labelNomor,
      adminFee: adminFee,
      stokMode: stokMode,
      hargaManual: hargaManual,
      nomorTujuan: nomorTujuan,
      catatan: catatan,
      qty: qty,
      harga: harga,
      subtotal: itemSubtotal
    });
  });

  const total = subtotal - diskon;

  if(total <= 0){
    return fail_('Total transaksi tidak valid');
  }

  const isKredit = metode === 'KREDIT';
  if(isKredit && !customer){
    return fail_('Nama customer wajib diisi untuk transaksi kredit');
  }
  if(!isKredit && bayar < total){
    return fail_('Nominal bayar kurang');
  }

  const bayarEfektif = isKredit ? Math.max(0, Math.min(bayar, total)) : bayar;

  const transaksiId = uid_('TRX');
  const invoice = makeInvoice_();
  const tanggal = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const createdAt = now_();
  const kembalian = isKredit ? 0 : (bayarEfektif - total);
  const sisaPiutang = isKredit ? Math.max(0, total - bayarEfektif) : 0;

  appendObjectRow_(SHEETS.TRANSAKSI, {
    id: transaksiId,
    invoice: invoice,
    tanggal: tanggal,
    kasiremail: me.email,
    kasirname: me.name,
    subtotal: subtotal,
    diskon: diskon,
    total: total,
    bayar: bayarEfektif,
    kembalian: kembalian,
    metode: metode,
    status: 'SELESAI',
    createdat: createdAt,
    customer: customer,
    jatuhtempo: jatuhTempo,
    sisapiutang: sisaPiutang
  });

  if(sisaPiutang > 0){
    appendObjectRow_(SHEETS.UTANG_PIUTANG, {
      id: uid_('UP'),
      jenis: 'PIUTANG',
      pihak: customer,
      referensi: invoice,
      tanggal: tanggal,
      jatuhtempo: jatuhTempo,
      total: total,
      dibayar: bayarEfektif,
      sisa: sisaPiutang,
      status: bayarEfektif > 0 ? 'SEBAGIAN' : 'BELUM LUNAS',
      catatan: 'Piutang dari transaksi ' + invoice,
      createdat: createdAt,
      updatedat: createdAt
    });
  }

  finalItems.forEach(it => {
    appendObjectRow_(SHEETS.DETAIL, {
      id: uid_('DTL'),
      transaksiid: transaksiId,
      invoice: invoice,
      produkid: it.produk.id,
      kode: it.produk.kode,
      nama: it.produk.nama,
      qty: it.qty,
      harga: it.harga,
      subtotal: it.subtotal,
      createdat: createdAt,

      // KOLOM BARU - DI PALING KANAN
      adminfee: it.adminFee,
      nomortujuan: it.nomorTujuan,
      catatan: it.catatan,
      tipeproduk: it.tipeProduk
    });

    if(it.tipeProduk !== 'DIGITAL' && it.stokMode !== 'TANPA_STOK'){
      const rowNum = it.produk.__rowNum;
      const stokBaru = roundQty_(num_(it.produk.stok) - it.qty);

      const stokCol = col_(produkMap, ['stok']);
      const updatedAtCol = col_(produkMap, ['updatedAt', 'updatedat']);

      if(!stokCol){
        throw new Error('Kolom stok tidak ditemukan di sheet PRODUK');
      }

      produkSh.getRange(rowNum, stokCol).setValue(stokBaru);

      if(updatedAtCol){
        produkSh.getRange(rowNum, updatedAtCol).setValue(createdAt);
      }
    }
  });

  return ok_({
    transaksiId: transaksiId,
    invoice: invoice,
    tanggal: tanggal,
    createdAt: createdAt,
    kasirEmail: me.email,
    kasirName: me.name,
    subtotal: subtotal,
    diskon: diskon,
    total: total,
    bayar: bayarEfektif,
    kembalian: kembalian,
    metode: metode,
    items: finalItems.map(function(it){
      return {
        produkId: it.produk.id,
        kode: it.produk.kode,
        nama: it.produk.nama,
        tipeProduk: it.tipeProduk,
        nomorTujuan: it.nomorTujuan,
        catatan: it.catatan,
        qty: it.qty,
        harga: it.harga,
        adminFee: it.adminFee,
        subtotal: it.subtotal
      };
    })
  }, 'Transaksi berhasil disimpan');
}

function transaksiList_(p){
  requireAuth_(p);

  const q = s_(p.q).toLowerCase();
  const rows = getObjects_(getSheet_(SHEETS.TRANSAKSI));

  let data = rows;

  if(q){
    data = data.filter(r =>
      s_(r.invoice).toLowerCase().includes(q) ||
      s_(r.kasirName).toLowerCase().includes(q) ||
      s_(r.metode).toLowerCase().includes(q)
    );
  }

  data.sort((a, b) => s_(b.createdAt).localeCompare(s_(a.createdAt)));

  return ok_(data.slice(0, 100));
}

function laporanPenjualan_(p){
  requireAuth_(p);

  p = p || {};

  const start = normalizeDateYmd_(p.start || p.startDate || '');
  const end = normalizeDateYmd_(p.end || p.endDate || '');

  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');

  const startDate = start || today;
  const endDate = end || today;

  if(startDate > endDate){
    return fail_('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
  }

  const rows = getObjects_(getSheet_(SHEETS.TRANSAKSI));

  let totalSubtotal = 0;
  let totalDiskon = 0;
  let totalPenjualan = 0;
  let totalBayar = 0;
  let totalKembalian = 0;

  const metodeMap = {};
  const harianMap = {};

  const data = rows
    .map(r => {
      const tanggal = normalizeDateYmd_(getField_(r, [
        'tanggal',
        'TANGGAL'
      ]));

      const status = s_(getField_(r, [
        'status',
        'STATUS'
      ])).toUpperCase();

      const subtotal = num_(getField_(r, [
        'subtotal',
        'SUBTOTAL'
      ]));

      const diskon = num_(getField_(r, [
        'diskon',
        'DISKON'
      ]));

      const total = num_(getField_(r, [
        'total',
        'TOTAL'
      ]));

      const bayar = num_(getField_(r, [
        'bayar',
        'BAYAR'
      ]));

      const kembalian = num_(getField_(r, [
        'kembalian',
        'KEMBALIAN'
      ]));

      const metode = s_(getField_(r, [
        'metode',
        'METODE'
      ])) || '-';

      return {
        invoice: s_(getField_(r, [
          'invoice',
          'INVOICE'
        ])),
        tanggal: tanggal,
        kasirName: s_(getField_(r, [
          'kasirName',
          'kasirname',
          'KASIRNAME'
        ])),
        subtotal: subtotal,
        diskon: diskon,
        total: total,
        bayar: bayar,
        kembalian: kembalian,
        metode: metode,
        status: status,
        createdAt: getField_(r, [
          'createdAt',
          'createdat',
          'CREATEDAT'
        ]) || ''
      };
    })
    .filter(r =>
      r.tanggal &&
      r.tanggal >= startDate &&
      r.tanggal <= endDate &&
      r.status === 'SELESAI'
    );

  data.forEach(r => {
    totalSubtotal += num_(r.subtotal);
    totalDiskon += num_(r.diskon);
    totalPenjualan += num_(r.total);
    totalBayar += num_(r.bayar);
    totalKembalian += num_(r.kembalian);

    if(!metodeMap[r.metode]){
      metodeMap[r.metode] = {
        metode: r.metode,
        transaksi: 0,
        total: 0
      };
    }

    metodeMap[r.metode].transaksi++;
    metodeMap[r.metode].total += num_(r.total);

    if(!harianMap[r.tanggal]){
      harianMap[r.tanggal] = {
        tanggal: r.tanggal,
        transaksi: 0,
        total: 0
      };
    }

    harianMap[r.tanggal].transaksi++;
    harianMap[r.tanggal].total += num_(r.total);
  });

  data.sort((a, b) =>
    s_(a.tanggal).localeCompare(s_(b.tanggal)) ||
    s_(a.createdAt).localeCompare(s_(b.createdAt))
  );

  const metode = Object.keys(metodeMap)
    .map(k => metodeMap[k])
    .sort((a, b) => num_(b.total) - num_(a.total));

  const harian = Object.keys(harianMap)
    .map(k => harianMap[k])
    .sort((a, b) => s_(a.tanggal).localeCompare(s_(b.tanggal)));

  return ok_({
    start: startDate,
    end: endDate,
    rows: data,
    summary: {
      jumlahTransaksi: data.length,
      totalSubtotal: totalSubtotal,
      totalDiskon: totalDiskon,
      totalPenjualan: totalPenjualan,
      totalBayar: totalBayar,
      totalKembalian: totalKembalian,
      metode: metode,
      harian: harian
    }
  });
}

/***** HELPERS *****/

function getSheet_(name){
  return SpreadsheetApp.getActive().getSheetByName(name);
}

function getObjects_(sh){
  const values = sh.getDataRange().getValues();

  if(values.length < 2) return [];

  const headers = values[0].map(h => normalizeHeader_(h));

  return values.slice(1)
    .filter(r => r.some(c => c !== '' && c !== null))
    .map((r, i) => {
      const obj = {
        __rowNum: i + 2
      };

      headers.forEach((h, idx) => {
        if(!h) return;

        const incoming = r[idx];
        const current = obj[h];

        // PATCH VER 1.3.1:
        // Jika ada header duplikat, nilai kosong di kolom berikutnya
        // tidak boleh menimpa nilai yang sudah terisi.
        const incomingEmpty = incoming === '' || incoming === null || incoming === undefined;
        const currentFilled = current !== '' && current !== null && current !== undefined;

        if(currentFilled && incomingEmpty) return;
        if(currentFilled) return; // prioritaskan kolom pertama yang terisi

        obj[h] = incoming;
      });

      return obj;
    });
}

function headerMap_(sh){
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const map = {};

  headers.forEach((h, i) => {
    const key = normalizeHeader_(h);
    if(key && !map[key]){
      // PATCH VER 1.3.1: gunakan kemunculan header pertama.
      map[key] = i + 1;
    }
  });

  return map;
}

function getProdukHargaJual_(produk){
  return num_(getField_(produk, [
    'hargaJual',
    'hargajual',
    'HARGAJUAL'
  ]));
}

function appendObjectRow_(sheetName, obj){
  const sh = getSheet_(sheetName);

  const headers = sh
    .getRange(1, 1, 1, sh.getLastColumn())
    .getValues()[0]
    .map(h => normalizeHeader_(h));

  const row = headers.map(h => {
    return obj[h] !== undefined ? obj[h] : '';
  });

  sh.appendRow(row);
}



function normalizeHeader_(v){
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function ok_(data, message){
  return {
    ok: true,
    message: message || 'OK',
    data: data === undefined ? null : data
  };
}

function fail_(message){
  return {
    ok: false,
    message: message || 'Gagal'
  };
}

function err_(err){
  return {
    ok: false,
    message: err && err.message ? err.message : String(err || 'Terjadi kesalahan')
  };
}

function s_(v){
  return v === null || v === undefined ? '' : String(v).trim();
}

function num_(v){
  const n = Number(String(v || 0).replace(/[^\d.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function now_(){
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
}

function uid_(prefix){
  return prefix + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function makeInvoice_(){
  const d = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmmss');
  return 'INV-' + d;
}

function hash_(text){
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    text,
    Utilities.Charset.UTF_8
  );

  return raw.map(b => {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function testProdukList(){
  const res = produkList_({
    token: ''
  });

  Logger.log(JSON.stringify(res, null, 2));
}

function testProdukSheet(){
  ensureSetup_();

  const sh = getSheet_(SHEETS.PRODUK);
  const rows = getObjects_(sh);

  Logger.log('JUMLAH PRODUK: ' + rows.length);
  Logger.log(JSON.stringify(rows, null, 2));
}

function masterOptions_(p){
  requireAuth_(p);

  const rows = getObjects_(getSheet_(SHEETS.SETTINGS));

  let kategori = [];
  let satuan = [];

  rows.forEach(r => {
    const key = s_(r.key).toUpperCase();
    const value = s_(r.value);

    if(!value) return;

    if(key === 'KATEGORI_PRODUK'){
      kategori.push(value);
    }

    if(key === 'SATUAN_PRODUK'){
      satuan.push(value);
    }
  });

  if(!kategori.length){
    kategori = ['Makanan', 'Minuman', 'Obat', 'ATK', 'Lainnya'];
  }

  if(!satuan.length){
    satuan = ['PCS', 'BOTOL', 'PACK', 'BOX', 'DUS', 'STRIP', 'TABLET'];
  }

  kategori = uniqueSort_(kategori);
  satuan = uniqueSort_(satuan);

  return ok_({
    kategori: kategori,
    satuan: satuan
  });
}

function masterOptionAdd_(p){
  const me = requireAuth_(p);

  if(me.role !== 'ADMIN'){
    return fail_('Hanya ADMIN yang dapat menambahkan master data');
  }

  const type = s_(p.type).toUpperCase();
  const value = s_(p.value);

  if(!type){
    return fail_('Tipe master wajib diisi');
  }

  if(!value){
    return fail_('Nama pilihan wajib diisi');
  }

  let key = '';

  if(type === 'KATEGORI'){
    key = 'KATEGORI_PRODUK';
  }else if(type === 'SATUAN'){
    key = 'SATUAN_PRODUK';
  }else{
    return fail_('Tipe master tidak valid');
  }

  const sh = getSheet_(SHEETS.SETTINGS);
  const rows = getObjects_(sh);

  const exists = rows.some(r =>
    s_(r.key).toUpperCase() === key &&
    s_(r.value).toUpperCase() === value.toUpperCase()
  );

  if(exists){
    return fail_('Data sudah ada');
  }

  sh.appendRow([
    key,
    value,
    now_()
  ]);

  return ok_({
    type: type,
    value: value
  }, 'Data berhasil ditambahkan');
}

function uniqueSort_(arr){
  const map = {};

  arr.forEach(v => {
    const val = s_(v);
    if(val){
      map[val.toUpperCase()] = val;
    }
  });

  return Object.keys(map)
    .sort()
    .map(k => map[k]);
}

function getProdukHargaJual_(row){
  row = row || {};

  return num_(
    row.hargaJual ||
    row.hargajual ||
    row.HARGAJUAL ||
    0
  );
}

function getProdukHargaBeli_(row){
  row = row || {};

  return num_(
    row.hargaBeli ||
    row.hargabeli ||
    row.HARGABELI ||
    0
  );
}

function col_(map, names){
  names = Array.isArray(names) ? names : [names];

  for(var i = 0; i < names.length; i++){
    var name = names[i];

    if(map[name]){
      return map[name];
    }

    var normalized = normalizeHeader_(name);

    if(map[normalized]){
      return map[normalized];
    }
  }

  return null;
}

function getField_(row, names){
  row = row || {};
  names = Array.isArray(names) ? names : [names];

  for(var i = 0; i < names.length; i++){
    var name = names[i];

    if(row[name] !== undefined && row[name] !== null && row[name] !== ''){
      return row[name];
    }

    var normalized = normalizeHeader_(name);

    if(row[normalized] !== undefined && row[normalized] !== null && row[normalized] !== ''){
      return row[normalized];
    }
  }

  return '';
}

function normalizeDateYmd_(value){
  if(!value){
    return '';
  }

  if(Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)){
    return Utilities.formatDate(value, TZ, 'yyyy-MM-dd');
  }

  const text = s_(value);

  if(!text){
    return '';
  }

  // Jika sudah format yyyy-MM-dd
  const m1 = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m1){
    return m1[1] + '-' + m1[2] + '-' + m1[3];
  }

  // Jika format dd/MM/yyyy
  const m2 = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if(m2){
    const dd = ('0' + m2[1]).slice(-2);
    const mm = ('0' + m2[2]).slice(-2);
    const yyyy = m2[3];

    return yyyy + '-' + mm + '-' + dd;
  }

  // Fallback parse date
  const d = new Date(text);

  if(!isNaN(d.getTime())){
    return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  }

  return text;
}

function makeLastDays_(days){
  days = Number(days || 7);

  const today = new Date();
  const arr = [];

  for(let i = days - 1; i >= 0; i--){
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const ymd = Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
    const label = Utilities.formatDate(d, TZ, 'dd/MM');

    arr.push({
      ymd: ymd,
      label: label
    });
  }

  return arr;
}

/***** PATCH VER 1.3 - UTILITAS ANGKA PECAHAN *****/
function roundQty_(value){
  const n = Number(value || 0);
  if(!isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 1000000) / 1000000;
}


/***** PATCH KSL KASIRKU VER 8 — UTANG & PIUTANG *****/

function utangPiutangList_(p){
  assertAdmin_(p);

  const q = s_(p.q).toLowerCase();
  const jenis = s_(p.jenis).toUpperCase();
  const status = s_(p.status).toUpperCase();
  const page = Math.max(1, parseInt(p.page, 10) || 1);
  const allowedPageSizes = [10,25,50];
  let pageSize = parseInt(p.pageSize, 10) || 10;
  if(!allowedPageSizes.includes(pageSize)) pageSize = 10;

  const allRows = getObjects_(getSheet_(SHEETS.UTANG_PIUTANG));

  // Summary dihitung dari semua data aktif, bukan hanya hasil filter halaman.
  const summary = {
    totalPiutang: 0,
    totalUtang: 0,
    customerBelumLunas: 0,
    supplierBelumLunas: 0,
    jatuhTempo: 0
  };
  const customer = {};
  const supplier = {};
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');

  allRows.forEach(r => {
    const rowJenis = s_(r.jenis).toUpperCase();
    const sisa = Math.max(0, num_(r.sisa));
    if(!sisa) return;

    if(rowJenis === 'PIUTANG'){
      summary.totalPiutang += sisa;
      const pihak = s_(r.pihak);
      if(pihak) customer[pihak] = true;
    }else if(rowJenis === 'UTANG'){
      summary.totalUtang += sisa;
      const pihak = s_(r.pihak);
      if(pihak) supplier[pihak] = true;
    }

    const due = s_(r.jatuhtempo || r.jatuhTempo);
    if(due && due < today) summary.jatuhTempo++;
  });

  summary.customerBelumLunas = Object.keys(customer).length;
  summary.supplierBelumLunas = Object.keys(supplier).length;

  let rows = allRows.slice();

  if(jenis && jenis !== 'SEMUA'){
    rows = rows.filter(r => s_(r.jenis).toUpperCase() === jenis);
  }
  if(status && status !== 'SEMUA'){
    rows = rows.filter(r => s_(r.status).toUpperCase() === status);
  }
  if(q){
    rows = rows.filter(r =>
      s_(r.pihak).toLowerCase().includes(q) ||
      s_(r.referensi).toLowerCase().includes(q) ||
      s_(r.catatan).toLowerCase().includes(q)
    );
  }

  rows.sort((a,b) => {
    const sa = num_(a.sisa), sb = num_(b.sisa);
    if((sa > 0) !== (sb > 0)) return sb > 0 ? 1 : -1;
    return s_(b.createdat || b.createdAt).localeCompare(s_(a.createdat || a.createdAt));
  });

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedRows = rows.slice(start, start + pageSize);

  return ok_({
    rows: pagedRows,
    summary: summary,
    pagination: {
      page: safePage,
      pageSize: pageSize,
      totalRows: totalRows,
      totalPages: totalPages,
      from: totalRows ? start + 1 : 0,
      to: totalRows ? Math.min(start + pageSize, totalRows) : 0
    }
  });
}

function utangPiutangSummary_(p){
  assertAdmin_(p);
  const rows = getObjects_(getSheet_(SHEETS.UTANG_PIUTANG));
  const result = {
    totalPiutang: 0,
    totalUtang: 0,
    customerBelumLunas: 0,
    supplierBelumLunas: 0,
    jatuhTempo: 0
  };
  const customer = {};
  const supplier = {};
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');

  rows.forEach(r => {
    const jenis = s_(r.jenis).toUpperCase();
    const sisa = Math.max(0, num_(r.sisa));
    if(!sisa) return;

    if(jenis === 'PIUTANG'){
      result.totalPiutang += sisa;
      customer[s_(r.pihak)] = true;
    }else if(jenis === 'UTANG'){
      result.totalUtang += sisa;
      supplier[s_(r.pihak)] = true;
    }

    const due = s_(r.jatuhtempo);
    if(due && due < today) result.jatuhTempo++;
  });

  result.customerBelumLunas = Object.keys(customer).filter(Boolean).length;
  result.supplierBelumLunas = Object.keys(supplier).filter(Boolean).length;
  return ok_(result);
}

function utangPiutangPay_(p){
  const me = assertAdmin_(p);
  const id = s_(p.id);
  const nominal = num_(p.nominal);
  const metode = s_(p.metode).toUpperCase() || 'CASH';
  const catatan = s_(p.catatan);

  if(!id) return fail_('Data utang/piutang tidak ditemukan');
  if(nominal <= 0) return fail_('Nominal pembayaran wajib lebih dari 0');

  const sh = getSheet_(SHEETS.UTANG_PIUTANG);
  const rows = getObjects_(sh);
  const map = headerMap_(sh);
  const row = rows.find(r => s_(r.id) === id);
  if(!row) return fail_('Data utang/piutang tidak ditemukan');

  const sisaLama = Math.max(0, num_(row.sisa));
  if(sisaLama <= 0) return fail_('Tagihan sudah lunas');
  if(nominal > sisaLama) return fail_('Nominal pembayaran melebihi sisa tagihan');

  const dibayarBaru = num_(row.dibayar) + nominal;
  const sisaBaru = Math.max(0, num_(row.total) - dibayarBaru);
  const statusBaru = sisaBaru <= 0 ? 'LUNAS' : 'SEBAGIAN';
  const now = now_();

  const dibayarCol = col_(map, ['dibayar']);
  const sisaCol = col_(map, ['sisa']);
  const statusCol = col_(map, ['status']);
  const updatedCol = col_(map, ['updatedAt','updatedat']);

  sh.getRange(row.__rowNum, dibayarCol).setValue(dibayarBaru);
  sh.getRange(row.__rowNum, sisaCol).setValue(sisaBaru);
  sh.getRange(row.__rowNum, statusCol).setValue(statusBaru);
  if(updatedCol) sh.getRange(row.__rowNum, updatedCol).setValue(now);

  appendObjectRow_(SHEETS.PEMBAYARAN_UTANG_PIUTANG, {
    id: uid_('PAYUP'),
    utangpiutangid: id,
    tanggal: Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'),
    nominal: nominal,
    metode: metode,
    catatan: catatan,
    createdbyemail: me.email,
    createdbyname: me.name,
    createdat: now
  });

  // Sinkronkan saldo ke transaksi sumber agar data utama ikut terbaca.
  const jenis = s_(row.jenis).toUpperCase();
  const ref = s_(row.referensi);

  if(jenis === 'PIUTANG'){
    syncSourceBalance_(SHEETS.TRANSAKSI, 'invoice', ref, {
      bayar: dibayarBaru,
      sisapiutang: sisaBaru
    });
  }else if(jenis === 'UTANG'){
    syncSourceBalance_(SHEETS.PEMBELIAN, 'nomor', ref, {
      dibayar: dibayarBaru,
      sisautang: sisaBaru
    });
  }

  return ok_({
    id:id, dibayar:dibayarBaru, sisa:sisaBaru, status:statusBaru
  }, statusBaru === 'LUNAS' ? 'Pembayaran berhasil. Tagihan sudah LUNAS.' : 'Pembayaran berhasil dicatat.');
}

function syncSourceBalance_(sheetName, keyName, keyValue, values){
  try{
    const sh = getSheet_(sheetName);
    const rows = getObjects_(sh);
    const map = headerMap_(sh);
    const row = rows.find(r => s_(getField_(r,[keyName])).toUpperCase() === s_(keyValue).toUpperCase());
    if(!row) return;

    Object.keys(values || {}).forEach(k => {
      const c = col_(map, [k]);
      if(c) sh.getRange(row.__rowNum, c).setValue(values[k]);
    });
  }catch(err){
    console.warn('SYNC SOURCE BALANCE:', err);
  }
}
