/**
 * app.js — IDX Pro Analytics
 * Catatan jujur soal data (baca juga panel "Sumber Data" di aplikasi):
 *  - Candlestick & Fibonacci  : Yahoo Finance chart API (query1.finance.yahoo.com), gratis, tanpa API key.
 *  - Top Movers / Sector map  : Google Sheet (GOOGLEFINANCE) via CSV publish, ATAU fallback pindai Yahoo.
 *  - Accumulation/Distribution & Bandarmology & Retail Behavior : indikator teknikal (harga+volume),
 *    BUKAN data transaksi broker sesungguhnya — itu data berbayar milik IDX/vendor.
 *  - Net Foreign Flow riil    : hanya tampil jika Anda menyediakan kolom ForeignNetIDR di Google Sheet.
 */

const CONFIG = {
  refreshMs: 60000,
  sheetUrl: '',
};

const state = {
  ticker: 'BBCA',
  candles: [],
  chart: null,
  candleSeries: null,
  fibLines: [],
  adChart: null,
  adSeries: null,
  sheetRows: {},        // ticker -> row object from Google Sheet CSV
  moverList: [],         // last computed scanner result
  moverMode: 'gainer',
  refreshTimer: null,
};

/* ============================= UTILITIES ============================= */

function formatIDR(n){
  if(n==null || isNaN(n)) return '—';
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
}
function formatCompact(n){
  if(n==null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if(abs>=1e9) return (n/1e9).toFixed(2)+' M';
  if(abs>=1e6) return (n/1e6).toFixed(2)+' jt';
  if(abs>=1e3) return (n/1e3).toFixed(1)+' rb';
  return String(Math.round(n));
}
function formatPct(n){
  if(n==null || isNaN(n)) return '—';
  const sign = n>0? '+':'';
  return sign + n.toFixed(2) + '%';
}
function resolveTicker(raw){
  raw = (raw||'').trim().toUpperCase();
  const dashIdx = raw.indexOf(' —');
  if(dashIdx>-1) raw = raw.slice(0,dashIdx);
  return raw.replace(/\.JK$/,'').trim();
}
function findMeta(ticker){
  return IDX_WATCHLIST.find(w=>w.t===ticker) || { t:ticker, n:ticker, s:'—', sub:'—', g:'—' };
}
function chunkArray(arr, size){
  const out=[]; for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out;
}
function setStatus(text, mode){ // mode: 'live' | 'err' | undefined
  document.getElementById('statusText').textContent = text;
  const dot = document.getElementById('liveDot');
  dot.className = 'dot' + (mode? ' '+mode : '');
}

/* ============================= YAHOO FINANCE ============================= */

async function fetchYahooChart(ticker, range='6mo'){
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}.JK?range=${range}&interval=1d`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  const result = json.chart && json.chart.result && json.chart.result[0];
  if(!result) throw new Error((json.chart && json.chart.error && json.chart.error.description) || 'Data tidak ditemukan');
  const ts = result.timestamp || [];
  const q = result.indicators.quote[0];
  const candles = [];
  for(let i=0;i<ts.length;i++){
    if(q.open[i]==null || q.high[i]==null || q.low[i]==null || q.close[i]==null) continue;
    candles.push({
      time: new Date(ts[i]*1000).toISOString().slice(0,10),
      open:q.open[i], high:q.high[i], low:q.low[i], close:q.close[i], volume:q.volume[i]||0
    });
  }
  return { candles, meta: result.meta };
}

async function scanMoversViaYahoo(onProgress){
  const tickers = IDX_WATCHLIST.map(w=>w.t);
  const chunks = chunkArray(tickers, 8);
  const out = [];
  let done = 0;
  for(const chunk of chunks){
    const settled = await Promise.allSettled(chunk.map(t=>fetchYahooChart(t,'5d')));
    settled.forEach((r, idx)=>{
      const t = chunk[idx];
      if(r.status==='fulfilled' && r.value.candles.length>=2){
        const c = r.value.candles;
        const last=c[c.length-1], prev=c[c.length-2];
        out.push({ ticker:t, price:last.close, chgPct:(last.close-prev.close)/prev.close*100, volume:last.volume });
      }
    });
    done += chunk.length;
    if(onProgress) onProgress(done, tickers.length);
  }
  return out;
}

/* ============================= GOOGLE SHEET (CSV) ============================= */

function splitCsvLine(line){
  const out=[]; let cur=''; let q=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){ q=!q; }
    else if(ch===',' && !q){ out.push(cur); cur=''; }
    else cur+=ch;
  }
  out.push(cur);
  return out.map(s=>s.trim());
}
function parseCsv(text){
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if(lines.length<2) return [];
  const headers = splitCsvLine(lines[0]).map(h=>h.replace(/^"|"$/g,''));
  return lines.slice(1).map(line=>{
    const cols = splitCsvLine(line);
    const obj={};
    headers.forEach((h,i)=> obj[h] = (cols[i]||'').replace(/^"|"$/g,''));
    return obj;
  });
}
function numFrom(str){
  if(str==null) return null;
  const n = Number(String(str).replace(/[^0-9.\-]/g,''));
  return isNaN(n)? null : n;
}

async function fetchSheetRows(){
  if(!CONFIG.sheetUrl) return {};
  const res = await fetch(CONFIG.sheetUrl);
  if(!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  const rows = parseCsv(text);
  const map = {};
  rows.forEach(r=>{
    const t = resolveTicker(r.Ticker || r.ticker || r.Kode || '');
    if(t) map[t] = r;
  });
  return map;
}

/* ============================= FIBONACCI ============================= */

function computeFibonacci(candles){
  let hi=-Infinity, hiIdx=0, lo=Infinity, loIdx=0;
  candles.forEach((c,i)=>{
    if(c.high>hi){ hi=c.high; hiIdx=i; }
    if(c.low<lo){ lo=c.low; loIdx=i; }
  });
  const uptrend = loIdx <= hiIdx; // swing low terjadi lebih dulu dari swing high
  const diff = hi - lo;
  const retr = [0,0.236,0.382,0.5,0.618,0.786,1].map(r=>({
    ratio:r, kind:'retracement',
    price: uptrend ? hi - diff*r : lo + diff*r
  }));
  const ext = [1.272,1.618].map(r=>({
    ratio:r, kind:'extension',
    price: uptrend ? hi + diff*(r-1) : lo - diff*(r-1)
  }));
  return { levels:[...retr, ...ext], uptrend, hi, lo, hiIdx, loIdx };
}

/* ============================= INDICATORS ============================= */

function computeADLine(candles){
  let adl=0;
  return candles.map(c=>{
    const range = c.high - c.low;
    const mfm = range===0? 0 : ((c.close-c.low)-(c.high-c.close))/range;
    adl += mfm * c.volume;
    return { time:c.time, value:adl };
  });
}

function classifyAccDist(candles, adl){
  const n = Math.min(10, candles.length-1);
  const baseClose = candles[candles.length-1-n].close;
  const priceChange = candles[candles.length-1].close - baseClose;
  const adlChange = adl[adl.length-1].value - adl[adl.length-1-n].value;
  let label, cls, desc;
  if(adlChange>0 && priceChange<=0){ label='Akumulasi Tersembunyi'; cls='accum'; desc='Garis A/D naik walau harga stagnan/turun — indikasi ada pembelian yang menyerap supply tanpa mendorong harga naik signifikan.'; }
  else if(adlChange>0 && priceChange>0){ label='Akumulasi Berlanjut'; cls='accum'; desc='Garis A/D naik seiring harga naik — tekanan beli konsisten mendukung tren.'; }
  else if(adlChange<0 && priceChange>=0){ label='Distribusi Tersembunyi'; cls='distrib'; desc='Garis A/D turun walau harga stagnan/naik — indikasi ada pelepasan barang di balik kenaikan harga.'; }
  else if(adlChange<0 && priceChange<0){ label='Distribusi Berlanjut'; cls='distrib'; desc='Garis A/D turun seiring harga turun — tekanan jual konsisten.'; }
  else { label='Netral'; cls='neutral'; desc='Belum ada divergensi atau konfirmasi yang jelas antara harga dan volume.'; }
  const base = Math.abs(adl[adl.length-1].value) || 1;
  const strength = Math.max(6, Math.min(100, Math.abs(adlChange)/base*300));
  return { label, cls, desc, priceChange, adlChange, strength, baseClose };
}

function computeBandarmology(candles){
  const n = Math.min(20, candles.length-1);
  const recent = candles.slice(-n);
  const avgVol = recent.reduce((a,c)=>a+c.volume,0)/recent.length;
  const avgRange = recent.reduce((a,c)=>a+(c.high-c.low),0)/recent.length;
  const last = candles[candles.length-1];
  const volRatio = avgVol? last.volume/avgVol : 1;
  const range = last.high-last.low;
  const narrowRatio = avgRange? range/avgRange : 1;
  const closePos = range? (last.close-last.low)/range : 0.5;

  let label='Netral', cls='neutral', desc='Tidak ada pola volume/harga yang menonjol dibanding rata-rata 20 hari terakhir.';
  if(volRatio>1.8 && narrowRatio<0.85 && closePos>0.6){
    label='Indikasi Akumulasi Kuat'; cls='accum';
    desc='Volume melonjak >1.8x rata-rata namun rentang harga menyempit dan close dekat harga tertinggi hari ini — pola klasik pengumpulan barang oleh pemain besar.';
  } else if(volRatio>1.8 && closePos<0.4){
    label='Indikasi Distribusi Kuat'; cls='distrib';
    desc='Volume melonjak >1.8x rata-rata dengan close dekat harga terendah hari ini — indikasi pelepasan barang oleh pemain besar.';
  } else if(volRatio>1.2 && closePos>0.55){
    label='Indikasi Akumulasi Ringan'; cls='accum';
    desc='Volume di atas rata-rata dengan close di paruh atas rentang harga — minat beli mulai meningkat.';
  } else if(volRatio>1.2 && closePos<0.45){
    label='Indikasi Distribusi Ringan'; cls='distrib';
    desc='Volume di atas rata-rata dengan close di paruh bawah rentang harga — tekanan jual mulai meningkat.';
  }
  const confidence = Math.max(8, Math.min(100, Math.round(volRatio*30)));
  return { label, cls, desc, confidence, volRatio, closePos };
}

function computeRetailBehavior(candles){
  const n = Math.min(14, candles.length-1);
  const recent = candles.slice(-n-1);
  const rets = [];
  for(let i=1;i<recent.length;i++) rets.push((recent[i].close-recent[i-1].close)/recent[i-1].close);
  const mean = rets.reduce((a,b)=>a+b,0)/rets.length;
  const variance = rets.reduce((a,b)=>a+Math.pow(b-mean,2),0)/rets.length;
  const vol = Math.sqrt(variance)*100;
  const last = candles[candles.length-1], prev = candles[candles.length-2];
  const chgPct = prev? (last.close-prev.close)/prev.close*100 : 0;

  let label='Perilaku Normal', cls='neutral', desc='Tidak ada tanda perilaku spekulatif berlebih dalam 14 hari terakhir.';
  if(chgPct>3 && vol>3){ label='Pola FOMO Ritel Terdeteksi'; cls='distrib'; desc='Kenaikan tajam dalam satu hari disertai volatilitas tinggi 14 hari — ciri khas pengejaran harga oleh investor ritel, rawan koreksi balik.'; }
  else if(chgPct<-3 && vol>3){ label='Pola Panic-Sell Ritel Terdeteksi'; cls='accum'; desc='Penurunan tajam disertai volatilitas tinggi — momen panic-sell ritel sering menjadi peluang akumulasi bagi pemain besar.'; }
  else if(vol>4){ label='Volatilitas Tinggi'; cls='neutral'; desc='Fluktuasi harga di atas normal 14 hari terakhir — waspadai pergerakan spekulatif.'; }
  const confidence = Math.max(8, Math.min(100, Math.round(vol*12)));
  return { label, cls, desc, confidence, vol, chgPct };
}

/* ============================= RENDERING: CHART ============================= */

function ensureChart(){
  if(state.chart) return;
  const container = document.getElementById('chartContainer');
  state.chart = LightweightCharts.createChart(container, {
    layout: { background:{ color:'transparent' }, textColor:'#8B96A5', fontFamily:'JetBrains Mono, monospace' },
    grid: { vertLines:{ color:'#182130' }, horzLines:{ color:'#182130' } },
    rightPriceScale: { borderColor:'#232C39' },
    timeScale: { borderColor:'#232C39' },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    autoSize: true,
  });
  state.candleSeries = state.chart.addCandlestickSeries({
    upColor:'#16C784', downColor:'#E4453A', borderVisible:false,
    wickUpColor:'#16C784', wickDownColor:'#E4453A',
  });
  window.addEventListener('resize', ()=>{
    state.chart.resize(container.clientWidth, container.clientHeight);
  });
}

function ensureAdChart(){
  if(state.adChart) return;
  const container = document.getElementById('accdistChart');
  state.adChart = LightweightCharts.createChart(container, {
    layout:{ background:{ color:'transparent' }, textColor:'#8B96A5', fontFamily:'JetBrains Mono, monospace' },
    grid:{ vertLines:{ color:'#182130' }, horzLines:{ color:'#182130' } },
    rightPriceScale:{ borderColor:'#232C39' },
    timeScale:{ borderColor:'#232C39' },
    autoSize:true,
  });
  state.adSeries = state.adChart.addLineSeries({ color:'#D4A94E', lineWidth:2 });
  window.addEventListener('resize', ()=>{
    state.adChart.resize(container.clientWidth, container.clientHeight);
  });
}

function renderChart(candles){
  ensureChart();
  state.candleSeries.setData(candles.map(c=>({ time:c.time, open:c.open, high:c.high, low:c.low, close:c.close })));

  // clear old fib lines
  state.fibLines.forEach(l=>state.candleSeries.removePriceLine(l));
  state.fibLines = [];

  const fib = computeFibonacci(candles);
  const legend = document.getElementById('fibLegend');
  legend.innerHTML = '';
  fib.levels.forEach(lv=>{
    const isKey = [0.5,0.618,0.382].includes(lv.ratio);
    const color = lv.kind==='extension' ? '#8B96A5' : (isKey ? '#D4A94E' : '#3E4A5C');
    const line = state.candleSeries.createPriceLine({
      price: lv.price,
      color,
      lineWidth: isKey ? 2 : 1,
      lineStyle: lv.kind==='extension' ? LightweightCharts.LineStyle.Dotted : LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: true,
      title: (lv.ratio*100).toFixed(1)+'%',
    });
    state.fibLines.push(line);

    const item = document.createElement('div');
    item.className = 'fib-item';
    item.innerHTML = `<span class="swatch" style="background:${color}"></span>${(lv.ratio*100).toFixed(1)}% — ${formatIDR(lv.price)} ${lv.kind==='extension'?'(ekstensi)':''}`;
    legend.appendChild(item);
  });

  state.chart.timeScale().fitContent();
}

function renderAccDistChart(candles){
  ensureAdChart();
  const adl = computeADLine(candles);
  state.adSeries.setData(adl);
  state.adChart.timeScale().fitContent();
  return adl;
}

/* ============================= RENDERING: SIGNAL CARDS ============================= */

function renderSignalCard(containerId, data, metrics){
  const el = document.getElementById(containerId);
  el.className = 'signal-card ' + data.cls;
  const barColor = data.cls==='accum' ? '#16C784' : data.cls==='distrib' ? '#E4453A' : '#8B96A5';
  const metricsHtml = metrics.map(m=>`<div><label>${m.label}</label><span>${m.value}</span></div>`).join('');
  el.innerHTML = `
    <div class="signal-title ${data.cls}">${data.label}</div>
    <div class="signal-sub">${data.desc}</div>
    <div class="signal-bar-track"><div class="signal-bar-fill" style="width:${data.confidence||data.strength||0}%;background:${barColor}"></div></div>
    <div class="signal-metrics">${metricsHtml}</div>
  `;
}

function renderForeignFlow(ticker){
  const el = document.getElementById('foreignFlowCard');
  const row = state.sheetRows[ticker];
  const netIdr = row ? numFrom(row.ForeignNetIDR) : null;
  if(netIdr==null){
    el.className = 'signal-card neutral';
    el.innerHTML = `
      <div class="signal-title">Data belum terhubung</div>
      <div class="signal-sub">Tambahkan kolom <code>ForeignNetIDR</code> (opsional <code>ForeignNetPct</code>) untuk kode <b>${ticker}</b> di Google Sheet Anda, lalu simpan URL-nya di menu ⚙ Sumber Data.</div>`;
    return;
  }
  const netPct = numFrom(row.ForeignNetPct);
  const isBuy = netIdr >= 0;
  const cls = isBuy ? 'accum' : 'distrib';
  el.className = 'signal-card ' + cls;
  el.innerHTML = `
    <div class="signal-title ${cls}">${isBuy? 'Net Foreign Buy':'Net Foreign Sell'}</div>
    <div class="signal-sub">Berdasarkan kolom ForeignNetIDR pada Google Sheet yang Anda hubungkan.</div>
    <div class="signal-metrics">
      <div><label>Nilai Bersih</label><span>${formatIDR(Math.abs(netIdr))}</span></div>
      ${netPct!=null ? `<div><label>% dari Nilai Transaksi</label><span>${formatPct(netPct)}</span></div>` : ''}
    </div>`;
}

/* ============================= RENDERING: TABLES ============================= */

function enrichMoverRow(x){
  const meta = findMeta(x.ticker);
  return { ...x, name: meta.n, sector: meta.s, group: meta.g };
}

function renderMoversTable(){
  const tbody = document.querySelector('#moversTable tbody');
  const minPct = Number(document.getElementById('minMovePct').value) || 0;
  const sectorFilter = document.getElementById('moverSectorFilter').value;
  let rows = state.moverList.map(enrichMoverRow);

  if(sectorFilter) rows = rows.filter(r=>r.sector===sectorFilter);
  rows = rows.filter(r=>Math.abs(r.chgPct) >= minPct);
  rows.sort((a,b)=> state.moverMode==='gainer' ? b.chgPct-a.chgPct : a.chgPct-b.chgPct);
  rows = rows.slice(0, 30);

  tbody.innerHTML = rows.map(r=>`
    <tr onclick="loadTickerAndShowDashboard('${r.ticker}')">
      <td>${r.ticker}</td>
      <td>${r.name}</td>
      <td>${formatIDR(r.price)}</td>
      <td class="${r.chgPct>=0?'up':'down'}">${formatPct(r.chgPct)}</td>
      <td>${formatCompact(r.volume)}</td>
      <td>${r.sector}</td>
    </tr>`).join('') || `<tr><td colspan="6" style="color:var(--muted)">Belum ada data. Buka menu Sumber Data untuk menghubungkan Google Sheet, atau tunggu pemindaian selesai.</td></tr>`;
}

function renderSectorMap(){
  const rows = state.moverList.map(enrichMoverRow);
  function groupBy(key){
    const map = {};
    rows.forEach(r=>{
      const k = r[key] || '—';
      if(!map[k]) map[k] = { key:k, count:0, sum:0 };
      map[k].count++; map[k].sum += r.chgPct;
    });
    return Object.values(map).map(g=>({ ...g, avg: g.sum/g.count })).sort((a,b)=>b.avg-a.avg);
  }
  const sectorRows = groupBy('sector');
  const groupRows = groupBy('group');

  const renderRows = (list) => list.map(g=>`
    <tr>
      <td>${g.key}</td>
      <td>${g.count}</td>
      <td class="${g.avg>=1?'hot':(g.avg>=0?'up':'down')}">${formatPct(g.avg)}</td>
    </tr>`).join('') || `<tr><td colspan="3" style="color:var(--muted)">Belum ada data.</td></tr>`;

  document.querySelector('#sectorTable tbody').innerHTML = renderRows(sectorRows);
  document.querySelector('#groupTable tbody').innerHTML = renderRows(groupRows);
}

function renderClassification(filterText){
  const tbody = document.querySelector('#classTable tbody');
  const f = (filterText||'').toLowerCase();
  const rows = IDX_WATCHLIST.filter(w=>{
    if(!f) return true;
    return [w.t,w.n,w.s,w.sub,w.g].join(' ').toLowerCase().includes(f);
  });
  tbody.innerHTML = rows.map(w=>`
    <tr onclick="loadTickerAndShowDashboard('${w.t}')">
      <td>${w.t}</td><td>${w.n}</td><td>${w.s}</td><td>${w.sub}</td><td>${w.g}</td>
    </tr>`).join('');
}

/* ============================= MAIN FLOWS ============================= */

async function loadTicker(rawTicker){
  const ticker = resolveTicker(rawTicker);
  if(!ticker) return;
  state.ticker = ticker;
  const meta = findMeta(ticker);
  document.getElementById('qName').textContent = meta.n;
  document.getElementById('qCode').textContent = ticker + '.JK';
  document.getElementById('qSector').textContent = meta.s;
  document.getElementById('qGroup').textContent = meta.g;

  setStatus('Memuat data ' + ticker + '…');
  try{
    const range = document.querySelector('#rangeChips .chip.active')?.dataset.range || '6mo';
    const { candles } = await fetchYahooChart(ticker, range);
    if(candles.length < 5) throw new Error('Data candle tidak cukup');
    state.candles = candles;

    const last = candles[candles.length-1], prev = candles[candles.length-2];
    document.getElementById('qPrice').textContent = formatIDR(last.close);
    const chg = prev ? (last.close-prev.close)/prev.close*100 : 0;
    const chgEl = document.getElementById('qChange');
    chgEl.textContent = formatPct(chg);
    chgEl.className = 'quote-change ' + (chg>=0?'up':'down');
    document.getElementById('qVolume').textContent = formatCompact(last.volume);
    document.getElementById('qUpdated').textContent = new Date().toLocaleTimeString('id-ID');

    renderChart(candles);
    const adl = renderAccDistChart(candles);
    const accdist = classifyAccDist(candles, adl);
    renderSignalCard('accdistCard', accdist, [
      { label:'Perubahan Harga (periode)', value: formatPct(accdist.priceChange / accdist.baseClose * 100) },
    ]);
    const bandar = computeBandarmology(candles);
    renderSignalCard('bandarCard', bandar, [
      { label:'Rasio Volume vs Rata-rata 20D', value: bandar.volRatio.toFixed(2)+'x' },
      { label:'Posisi Close dlm Rentang', value: (bandar.closePos*100).toFixed(0)+'%' },
    ]);
    const retail = computeRetailBehavior(candles);
    renderSignalCard('retailCard', retail, [
      { label:'Volatilitas 14D', value: retail.vol.toFixed(2)+'%' },
      { label:'Perubahan Harian', value: formatPct(retail.chgPct) },
    ]);
    renderForeignFlow(ticker);

    setStatus('Live — ' + new Date().toLocaleTimeString('id-ID'), 'live');
  }catch(err){
    console.error(err);
    setStatus('Gagal memuat data (' + err.message + ')', 'err');
  }
}

function loadTickerAndShowDashboard(ticker){
  document.getElementById('tickerInput').value = ticker;
  document.getElementById('menuSelect').value = 'dashboard';
  switchPanel('dashboard');
  loadTicker(ticker);
}
window.loadTickerAndShowDashboard = loadTickerAndShowDashboard;

async function refreshScanner(){
  const table = document.querySelector('#moversTable tbody');
  try{
    if(CONFIG.sheetUrl){
      setStatus('Mengambil watchlist dari Google Sheet…');
      state.sheetRows = await fetchSheetRows();
      state.moverList = Object.keys(state.sheetRows).map(t=>{
        const r = state.sheetRows[t];
        return { ticker:t, price:numFrom(r.Price)||0, chgPct:numFrom(r.ChangePct)||0, volume:numFrom(r.Volume)||0 };
      });
    } else {
      table.innerHTML = `<tr><td colspan="6" style="color:var(--muted)">Memindai harga IDX via Yahoo Finance…</td></tr>`;
      state.moverList = await scanMoversViaYahoo((done,total)=> setStatus(`Memindai saham… ${done}/${total}`));
    }
    renderMoversTable();
    renderSectorMap();
    setStatus('Live — ' + new Date().toLocaleTimeString('id-ID'), 'live');
  }catch(err){
    console.error(err);
    setStatus('Gagal memindai data (' + err.message + ')', 'err');
  }
}

function switchPanel(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+name).classList.add('active');
  if((name==='movers' || name==='sectormap') && state.moverList.length===0){
    refreshScanner();
  }
}

/* ============================= SETTINGS PERSISTENCE ============================= */

function loadSettings(){
  CONFIG.sheetUrl = localStorage.getItem('idxpro_sheet_url') || '';
  CONFIG.refreshMs = Number(localStorage.getItem('idxpro_refresh_ms')) || 60000;
  document.getElementById('sheetCsvUrl').value = CONFIG.sheetUrl;
  document.getElementById('refreshIntervalSelect').value = String(CONFIG.refreshMs);
}
async function saveSheetSettings(){
  const url = document.getElementById('sheetCsvUrl').value.trim();
  const statusEl = document.getElementById('sheetStatus');
  CONFIG.sheetUrl = url;
  localStorage.setItem('idxpro_sheet_url', url);
  if(!url){ statusEl.textContent = 'Mode Google Sheet dinonaktifkan — scanner akan memindai langsung via Yahoo Finance.'; return; }
  statusEl.textContent = 'Menguji koneksi…';
  try{
    const rows = await fetchSheetRows();
    const n = Object.keys(rows).length;
    statusEl.textContent = `Berhasil terhubung — ${n} baris ditemukan.`;
    state.sheetRows = rows;
    state.moverList = [];
    refreshScanner();
  }catch(err){
    statusEl.textContent = 'Gagal terhubung: ' + err.message;
  }
}

function restartAutoRefresh(){
  if(state.refreshTimer) clearInterval(state.refreshTimer);
  state.refreshTimer = setInterval(()=>{
    loadTicker(state.ticker);
    const activePanel = document.querySelector('.panel.active').id;
    if(CONFIG.sheetUrl || activePanel==='movers' || activePanel==='sectormap'){
      refreshScanner();
    }
  }, CONFIG.refreshMs);
}

/* ============================= INIT ============================= */

function populateStaticUI(){
  const datalist = document.getElementById('tickerList');
  datalist.innerHTML = IDX_WATCHLIST.map(w=>`<option value="${w.t} — ${w.n}"></option>`).join('');

  const sectorFilter = document.getElementById('moverSectorFilter');
  sectorFilter.innerHTML = '<option value="">Semua Sektor</option>' + IDX_SECTORS.map(s=>`<option value="${s}">${s}</option>`).join('');

  renderClassification('');
}

function wireEvents(){
  document.getElementById('btnLoad').addEventListener('click', ()=> loadTicker(document.getElementById('tickerInput').value));
  document.getElementById('tickerInput').addEventListener('keydown', e=>{ if(e.key==='Enter') loadTicker(e.target.value); });

  document.getElementById('menuSelect').addEventListener('change', e=> switchPanel(e.target.value));

  document.querySelectorAll('#rangeChips .chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      document.querySelectorAll('#rangeChips .chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      loadTicker(state.ticker);
    });
  });

  document.querySelectorAll('[data-mover]').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      document.querySelectorAll('[data-mover]').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      state.moverMode = chip.dataset.mover;
      renderMoversTable();
    });
  });
  document.getElementById('minMovePct').addEventListener('input', renderMoversTable);
  document.getElementById('moverSectorFilter').addEventListener('change', renderMoversTable);

  document.getElementById('classSearch').addEventListener('input', e=> renderClassification(e.target.value));

  document.getElementById('btnSaveSheet').addEventListener('click', saveSheetSettings);
  document.getElementById('refreshIntervalSelect').addEventListener('change', e=>{
    CONFIG.refreshMs = Number(e.target.value);
    localStorage.setItem('idxpro_refresh_ms', String(CONFIG.refreshMs));
    restartAutoRefresh();
  });
  document.getElementById('btnSettings').addEventListener('click', ()=>{
    document.getElementById('menuSelect').value = 'settings';
    switchPanel('settings');
  });
}

window.addEventListener('DOMContentLoaded', ()=>{
  populateStaticUI();
  wireEvents();
  loadSettings();
  loadTicker(state.ticker);
  restartAutoRefresh();
});
