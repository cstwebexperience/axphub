/* EasyBox locker list — Sameday API (primar) + OSM fallback + mock dev */
const SAMEDAY_URL = process.env.SAMEDAY_API_URL || "https://sameday-api.demo.zitec.com";

let _token     = null;
let _tokenExp  = 0;
let _cache     = null;
let _cacheTime = 0;
const CACHE_TTL = 4 * 3600 * 1000;

async function getToken() {
  if (_token && Date.now() < _tokenExp) return _token;
  const r = await fetch(`${SAMEDAY_URL}/api/authenticate`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      username: process.env.SAMEDAY_USERNAME,
      password: process.env.SAMEDAY_PASSWORD,
      rememberMe: false,
    }),
  });
  if (!r.ok) throw new Error(`Sameday auth failed: ${r.status}`);
  const data = await r.json();
  _token    = data.token;
  _tokenExp = Date.now() + 23 * 3600 * 1000;
  return _token;
}

async function fetchFromSameday(token) {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;
  const r = await fetch(`${SAMEDAY_URL}/api/easybox`, {
    headers: { "X-Auth-Token": token, "Accept": "application/json" },
  });
  if (!r.ok) throw new Error(`Sameday easybox failed: ${r.status}`);
  const raw  = await r.json();
  const items = Array.isArray(raw) ? raw : (raw.data || raw.items || raw.easyboxes || []);
  _cache = items
    .map(el => ({
      id:     String(el.lockerId || el.id || el.lockId),
      name:   el.lockerName || el.name || "EasyBox",
      addr:   el.address    || el.addr || "",
      city:   el.city       || "",
      county: el.county     || "",
      lat:    parseFloat(el.lat || el.latitude  || 0),
      lng:    parseFloat(el.lng || el.longitude || el.lon || 0),
      slots:  el.lockersAvailableForDelivery || el.availableSlots || 0,
    }))
    .filter(l => l.lat && l.lng);
  _cacheTime = Date.now();
  return _cache;
}

/* Bounding box România — mai rapid decât interogarea pe area */
async function fetchFromOSM() {
  const bbox  = "43.6,20.2,48.3,29.7"; /* România */
  const query = `[out:json][timeout:25];(node["amenity"="parcel_locker"]["operator"~"Sameday|EasyBox",i](${bbox});node["amenity"="parcel_locker"]["brand"~"EasyBox",i](${bbox});node["name"~"EasyBox",i]["amenity"="parcel_locker"](${bbox}););out body;`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 28000);

  try {
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    `data=${encodeURIComponent(query)}`,
      signal:  controller.signal,
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`OSM error ${r.status}`);
    const data = await r.json();
    return data.elements.map(el => ({
      id:     String(el.id),
      lat:    el.lat,
      lng:    el.lon,
      name:   el.tags?.name || el.tags?.["name:ro"] || "EasyBox",
      addr:   [el.tags?.["addr:street"], el.tags?.["addr:housenumber"]].filter(Boolean).join(" ") || "",
      city:   el.tags?.["addr:city"] || el.tags?.["addr:county"] || "",
      county: el.tags?.["addr:county"] || "",
      slots:  0,
    }));
  } catch (err) {
    clearTimeout(t);
    throw err;
  }
}

/* Date demo — acoperire completă România, ~300 lockere */
function getMockLockers() {
  return [
    // ── BUCUREȘTI ──
    { id:"b1",  name:"EasyBox Băneasa Shopping City",       addr:"Calea Bucovinei 1D",              city:"București", county:"București", lat:44.5037, lng:26.0832, slots:8 },
    { id:"b2",  name:"EasyBox Mega Mall București",          addr:"Bd. Pierre de Coubertin 3",       city:"București", county:"București", lat:44.4377, lng:26.1287, slots:6 },
    { id:"b3",  name:"EasyBox AFI Cotroceni",                addr:"Bd. Vasile Milea 4",              city:"București", county:"București", lat:44.4278, lng:26.0619, slots:5 },
    { id:"b4",  name:"EasyBox Sun Plaza",                    addr:"Calea Văcărești 391",             city:"București", county:"București", lat:44.3893, lng:26.0972, slots:7 },
    { id:"b5",  name:"EasyBox ParkLake",                     addr:"Calea Vitan 217",                 city:"București", county:"București", lat:44.4248, lng:26.1557, slots:4 },
    { id:"b6",  name:"EasyBox Promenada Mall",               addr:"Calea Floreasca 246B",            city:"București", county:"București", lat:44.4583, lng:26.0906, slots:3 },
    { id:"b7",  name:"EasyBox Veranda Mall",                 addr:"Calea Obor 1-3",                  city:"București", county:"București", lat:44.4693, lng:26.1348, slots:5 },
    { id:"b8",  name:"EasyBox Militari Shopping Center",     addr:"Calea Crângași 2A",               city:"București", county:"București", lat:44.4358, lng:25.9987, slots:6 },
    { id:"b9",  name:"EasyBox Plaza România",                addr:"Bd. Timișoara 26",                city:"București", county:"București", lat:44.4356, lng:25.9873, slots:4 },
    { id:"b10", name:"EasyBox Carrefour Titan",              addr:"Str. Liviu Rebreanu 4",           city:"București", county:"București", lat:44.4121, lng:26.1548, slots:3 },
    { id:"b11", name:"EasyBox Kaufland Berceni",             addr:"Calea Berceni 104",               city:"București", county:"București", lat:44.3818, lng:26.0824, slots:4 },
    { id:"b12", name:"EasyBox Kaufland Floreasca",           addr:"Calea Floreasca 101",             city:"București", county:"București", lat:44.4703, lng:26.1043, slots:6 },
    { id:"b13", name:"EasyBox Kaufland Drumul Taberei",      addr:"Bd. Timișoara 75",                city:"București", county:"București", lat:44.4123, lng:26.0312, slots:3 },
    { id:"b14", name:"EasyBox Kaufland Colentina",           addr:"Str. Colentina 2",                city:"București", county:"București", lat:44.4598, lng:26.1523, slots:4 },
    { id:"b15", name:"EasyBox Kaufland Rahova",              addr:"Calea Rahovei 198",               city:"București", county:"București", lat:44.4023, lng:26.0423, slots:3 },
    { id:"b16", name:"EasyBox Carrefour Orhideea",           addr:"Str. Orhideelor 2",               city:"București", county:"București", lat:44.4433, lng:26.0512, slots:4 },
    { id:"b17", name:"EasyBox Kaufland Dristor",             addr:"Bd. Camil Ressu 1",               city:"București", county:"București", lat:44.4232, lng:26.1345, slots:5 },
    { id:"b18", name:"EasyBox Kaufland Crângași",            addr:"Calea Crângași 68",               city:"București", county:"București", lat:44.4412, lng:25.9923, slots:3 },
    { id:"b19", name:"EasyBox Penny Iancului",               addr:"Str. Iancului 64",                city:"București", county:"București", lat:44.4389, lng:26.1198, slots:4 },
    { id:"b20", name:"EasyBox Lidl Pantelimon",              addr:"Șos. Pantelimon 283",             city:"București", county:"București", lat:44.4567, lng:26.1634, slots:3 },
    { id:"b21", name:"EasyBox Kaufland Aviației",            addr:"Bd. Aviatorilor 8",               city:"București", county:"București", lat:44.4876, lng:26.0989, slots:5 },
    { id:"b22", name:"EasyBox Lidl Berceni",                 addr:"Calea Berceni 82",                city:"București", county:"București", lat:44.3734, lng:26.0756, slots:3 },
    { id:"b23", name:"EasyBox OMV Grozăvești",               addr:"Calea Grozăvești 112",            city:"București", county:"București", lat:44.4389, lng:26.0489, slots:4 },
    { id:"b24", name:"EasyBox Kaufland Vitan",               addr:"Calea Vitan 55-59",               city:"București", county:"București", lat:44.4167, lng:26.1212, slots:3 },
    { id:"b25", name:"EasyBox Carrefour Feeria",             addr:"Calea Văcărești 187",             city:"București", county:"București", lat:44.4012, lng:26.1023, slots:4 },
    // ── ILFOV ──
    { id:"if1", name:"EasyBox Colosseum Chitila",            addr:"Calea Chitilei 283C",             city:"Chitila",          county:"Ilfov", lat:44.5362, lng:26.0234, slots:8 },
    { id:"if2", name:"EasyBox Voluntari Pallady",            addr:"Str. Erou Iancu Nicolae 45",      city:"Voluntari",        county:"Ilfov", lat:44.4971, lng:26.1868, slots:5 },
    { id:"if3", name:"EasyBox Popești-Leordeni",             addr:"Calea București 232",             city:"Popești-Leordeni", county:"Ilfov", lat:44.3594, lng:26.1497, slots:3 },
    { id:"if4", name:"EasyBox Pantelimon Auchan",            addr:"Șos. Pantelimon 1",               city:"Pantelimon",       county:"Ilfov", lat:44.4498, lng:26.1877, slots:5 },
    { id:"if5", name:"EasyBox Buftea",                       addr:"Str. Republicii 8",               city:"Buftea",           county:"Ilfov", lat:44.5712, lng:25.9434, slots:2 },
    { id:"if6", name:"EasyBox Otopeni",                      addr:"Calea Bucureștilor 224",          city:"Otopeni",          county:"Ilfov", lat:44.5489, lng:26.0712, slots:3 },
    { id:"if7", name:"EasyBox Bragadiru",                    addr:"Str. Alexandriei 158",            city:"Bragadiru",        county:"Ilfov", lat:44.3812, lng:25.9987, slots:3 },
    { id:"if8", name:"EasyBox Măgurele",                     addr:"Str. Atomistilor 4",              city:"Măgurele",         county:"Ilfov", lat:44.3534, lng:26.0234, slots:2 },
    // ── CLUJ ──
    { id:"cj1", name:"EasyBox Vivo Cluj-Napoca",             addr:"Calea Baciului 2A",               city:"Cluj-Napoca", county:"Cluj", lat:46.7513, lng:23.5498, slots:5 },
    { id:"cj2", name:"EasyBox Iulius Mall Cluj",             addr:"Str. Alexandru Vaida Voevod 53A", city:"Cluj-Napoca", county:"Cluj", lat:46.7762, lng:23.5943, slots:4 },
    { id:"cj3", name:"EasyBox Polus Center Cluj",            addr:"Calea Dorobanților 148",          city:"Cluj-Napoca", county:"Cluj", lat:46.7884, lng:23.6287, slots:7 },
    { id:"cj4", name:"EasyBox Kaufland Mănăștur",            addr:"Calea Mănăștur 12",               city:"Cluj-Napoca", county:"Cluj", lat:46.7648, lng:23.5612, slots:3 },
    { id:"cj5", name:"EasyBox Kaufland Gheorgheni",          addr:"Calea Turzii 178",                city:"Cluj-Napoca", county:"Cluj", lat:46.7512, lng:23.6012, slots:4 },
    { id:"cj6", name:"EasyBox Kaufland Zorilor",             addr:"Str. Observatorului 12",          city:"Cluj-Napoca", county:"Cluj", lat:46.7434, lng:23.5723, slots:3 },
    { id:"cj7", name:"EasyBox Carrefour Iris",               addr:"Calea Dorobanților 80",           city:"Cluj-Napoca", county:"Cluj", lat:46.7812, lng:23.6134, slots:4 },
    { id:"cj8", name:"EasyBox Lidl Baciu",                   addr:"Str. Ogorului 8",                 city:"Cluj-Napoca", county:"Cluj", lat:46.7623, lng:23.5234, slots:3 },
    { id:"cj9", name:"EasyBox Dej",                          addr:"Str. 1 Mai 15",                   city:"Dej",          county:"Cluj", lat:47.1389, lng:23.8712, slots:2 },
    { id:"cj10",name:"EasyBox Turda",                        addr:"Str. Republicii 32",              city:"Turda",        county:"Cluj", lat:46.5687, lng:23.7923, slots:2 },
    { id:"cj11",name:"EasyBox Câmpia Turzii",                addr:"Bd. Muncii 2",                    city:"Câmpia Turzii",county:"Cluj", lat:46.5512, lng:23.8734, slots:2 },
    // ── TIMIȘ ──
    { id:"tm1", name:"EasyBox Shopping City Timișoara",      addr:"Calea Torontalului 541/A",        city:"Timișoara", county:"Timiș", lat:45.7396, lng:21.2087, slots:6 },
    { id:"tm2", name:"EasyBox Iulius Town Timișoara",        addr:"Bd. Revoluției din 1989 5",       city:"Timișoara", county:"Timiș", lat:45.7481, lng:21.2298, slots:5 },
    { id:"tm3", name:"EasyBox Kaufland Lipovei",             addr:"Calea Lipovei 118",               city:"Timișoara", county:"Timiș", lat:45.7612, lng:21.2456, slots:4 },
    { id:"tm4", name:"EasyBox Kaufland Circumvalațiunii",    addr:"Str. Circumvalațiunii 6",         city:"Timișoara", county:"Timiș", lat:45.7443, lng:21.2178, slots:3 },
    { id:"tm5", name:"EasyBox Carrefour Timișoara",          addr:"Calea Șagului 100",               city:"Timișoara", county:"Timiș", lat:45.7312, lng:21.2398, slots:4 },
    { id:"tm6", name:"EasyBox Kaufland Freidorf",            addr:"Str. Brașov 4",                   city:"Timișoara", county:"Timiș", lat:45.7198, lng:21.2234, slots:3 },
    { id:"tm7", name:"EasyBox Lidl Calea Bogdăneștilor",     addr:"Calea Bogdăneștilor 6",           city:"Timișoara", county:"Timiș", lat:45.7567, lng:21.2534, slots:3 },
    { id:"tm8", name:"EasyBox Lugoj",                        addr:"Str. Bocșei 1",                   city:"Lugoj",     county:"Timiș", lat:45.6912, lng:21.9023, slots:2 },
    { id:"tm9", name:"EasyBox Sânnicolau Mare",              addr:"Str. Victoriei 14",               city:"Sânnicolau Mare", county:"Timiș", lat:46.0723, lng:20.6298, slots:2 },
    // ── IAȘI ──
    { id:"is1", name:"EasyBox Iulius Mall Iași",             addr:"Bd. Socola 56",                   city:"Iași", county:"Iași", lat:47.1448, lng:27.5953, slots:5 },
    { id:"is2", name:"EasyBox Palas Mall Iași",              addr:"Str. Palat 6A",                   city:"Iași", county:"Iași", lat:47.1534, lng:27.5978, slots:6 },
    { id:"is3", name:"EasyBox Felicia Shopping Iași",        addr:"Bd. Tudor Vladimirescu 54",       city:"Iași", county:"Iași", lat:47.1723, lng:27.5687, slots:4 },
    { id:"is4", name:"EasyBox Moldova Mall Iași",            addr:"Bd. Ștefan cel Mare 22",          city:"Iași", county:"Iași", lat:47.1598, lng:27.5843, slots:3 },
    { id:"is5", name:"EasyBox Kaufland Bucium",              addr:"Str. Bucium 36",                  city:"Iași", county:"Iași", lat:47.1312, lng:27.6123, slots:5 },
    { id:"is6", name:"EasyBox Kaufland Iași Tatarași",       addr:"Bd. Poitiers 14",                 city:"Iași", county:"Iași", lat:47.1623, lng:27.5712, slots:4 },
    { id:"is7", name:"EasyBox Carrefour Iași",               addr:"Str. Anastasie Panu 27",          city:"Iași", county:"Iași", lat:47.1534, lng:27.6012, slots:3 },
    { id:"is8", name:"EasyBox Lidl Copou",                   addr:"Bd. Carol I 22",                  city:"Iași", county:"Iași", lat:47.1789, lng:27.5823, slots:3 },
    { id:"is9", name:"EasyBox Pașcani",                      addr:"Str. Ștefan cel Mare 24",         city:"Pașcani",  county:"Iași", lat:47.2512, lng:26.7234, slots:2 },
    // ── BRAȘOV ──
    { id:"bv1", name:"EasyBox Coresi Shopping Resort",       addr:"Calea Feldioarei 130",            city:"Brașov", county:"Brașov", lat:45.6468, lng:25.5904, slots:7 },
    { id:"bv2", name:"EasyBox AFI Brașov",                   addr:"Str. Lungă 200",                  city:"Brașov", county:"Brașov", lat:45.6538, lng:25.6312, slots:4 },
    { id:"bv3", name:"EasyBox Kaufland Bartolomeu",          addr:"Str. Bartolomeu 4",               city:"Brașov", county:"Brașov", lat:45.6709, lng:25.6198, slots:3 },
    { id:"bv4", name:"EasyBox Kaufland Tractorul",           addr:"Bd. Gării 2",                     city:"Brașov", county:"Brașov", lat:45.6398, lng:25.6543, slots:5 },
    { id:"bv5", name:"EasyBox Carrefour Brașov",             addr:"Calea Bucureștilor 101",          city:"Brașov", county:"Brașov", lat:45.6623, lng:25.5812, slots:4 },
    { id:"bv6", name:"EasyBox Lidl Brașov Noua",             addr:"Str. Carpaților 12",              city:"Brașov", county:"Brașov", lat:45.6234, lng:25.6087, slots:3 },
    { id:"bv7", name:"EasyBox Făgăraș",                      addr:"Str. Republicii 14",              city:"Făgăraș", county:"Brașov", lat:45.8423, lng:24.9712, slots:2 },
    { id:"bv8", name:"EasyBox Zărnești",                     addr:"Str. Mitropolit Șaguna 2",        city:"Zărnești", county:"Brașov", lat:45.5634, lng:25.3512, slots:2 },
    { id:"bv9", name:"EasyBox Codlea",                       addr:"Str. Lungă 1",                    city:"Codlea",   county:"Brașov", lat:45.7012, lng:25.4534, slots:2 },
    // ── CONSTANȚA ──
    { id:"ct1", name:"EasyBox City Park Mall Constanța",     addr:"Bd. Aurel Vlaicu 200",            city:"Constanța", county:"Constanța", lat:44.1598, lng:28.6348, slots:5 },
    { id:"ct2", name:"EasyBox Tom Mall Constanța",           addr:"Bd. Alexandru Lăpușneanu 116C",   city:"Constanța", county:"Constanța", lat:44.1765, lng:28.6234, slots:4 },
    { id:"ct3", name:"EasyBox Carrefour Constanța",          addr:"Bd. Tomis 391",                   city:"Constanța", county:"Constanța", lat:44.1689, lng:28.6187, slots:3 },
    { id:"ct4", name:"EasyBox Kaufland Constanța",           addr:"Str. Soveja 88",                  city:"Constanța", county:"Constanța", lat:44.1834, lng:28.6423, slots:4 },
    { id:"ct5", name:"EasyBox Lidl Constanța Brătianu",      addr:"Bd. I.C. Brătianu 4",             city:"Constanța", county:"Constanța", lat:44.1712, lng:28.6512, slots:3 },
    { id:"ct6", name:"EasyBox Mangalia",                     addr:"Str. Matei Basarab 3",            city:"Mangalia",  county:"Constanța", lat:43.8098, lng:28.5823, slots:2 },
    { id:"ct7", name:"EasyBox Medgidia",                     addr:"Str. Independenței 2",            city:"Medgidia",  county:"Constanța", lat:44.2534, lng:28.2678, slots:2 },
    { id:"ct8", name:"EasyBox Năvodari",                     addr:"Bd. Mamaia Nord 2",               city:"Năvodari",  county:"Constanța", lat:44.3312, lng:28.6023, slots:2 },
    // ── BIHOR ──
    { id:"bh1", name:"EasyBox Era Shopping Park Oradea",     addr:"Calea Borșului 29B",              city:"Oradea", county:"Bihor", lat:47.0458, lng:21.9189, slots:5 },
    { id:"bh2", name:"EasyBox Lotus Center Oradea",          addr:"Calea Clujului 221",              city:"Oradea", county:"Bihor", lat:47.0521, lng:21.9348, slots:4 },
    { id:"bh3", name:"EasyBox Kaufland Nufărul",             addr:"Str. Nufărului 30",               city:"Oradea", county:"Bihor", lat:47.0398, lng:21.9456, slots:3 },
    { id:"bh4", name:"EasyBox Kaufland Oradea Decebal",      addr:"Bd. Decebal 50",                  city:"Oradea", county:"Bihor", lat:47.0612, lng:21.9234, slots:3 },
    { id:"bh5", name:"EasyBox Carrefour Oradea",             addr:"Calea Borșului 50",               city:"Oradea", county:"Bihor", lat:47.0512, lng:21.9123, slots:4 },
    { id:"bh6", name:"EasyBox Beiuș",                        addr:"Str. Republicii 1",               city:"Beiuș",  county:"Bihor", lat:46.6712, lng:22.3545, slots:2 },
    { id:"bh7", name:"EasyBox Salonta",                      addr:"Str. Mihai Viteazu 2",            city:"Salonta", county:"Bihor", lat:46.8023, lng:21.6534, slots:2 },
    // ── SIBIU ──
    { id:"sb1", name:"EasyBox Shopping City Sibiu",          addr:"Bd. Corneliu Coposu 3",           city:"Sibiu",  county:"Sibiu", lat:45.8073, lng:24.1568, slots:6 },
    { id:"sb2", name:"EasyBox Promenada Sibiu",              addr:"Calea Dumbrăvii 118",             city:"Sibiu",  county:"Sibiu", lat:45.7989, lng:24.1456, slots:4 },
    { id:"sb3", name:"EasyBox Kaufland Sibiu Mihai Viteazu", addr:"Str. Mihai Viteazu 2",            city:"Sibiu",  county:"Sibiu", lat:45.8012, lng:24.1723, slots:3 },
    { id:"sb4", name:"EasyBox Kaufland Sibiu Rahovei",       addr:"Str. Rahovei 34",                 city:"Sibiu",  county:"Sibiu", lat:45.7923, lng:24.1634, slots:3 },
    { id:"sb5", name:"EasyBox Carrefour Sibiu",              addr:"Calea Șurii Mici 43",             city:"Sibiu",  county:"Sibiu", lat:45.8112, lng:24.1489, slots:4 },
    { id:"sb6", name:"EasyBox Mediaș",                       addr:"Piața Regele Ferdinand I 12",     city:"Mediaș", county:"Sibiu", lat:46.1598, lng:24.3534, slots:2 },
    // ── DOLJ ──
    { id:"dj1", name:"EasyBox Electroputere Mall Craiova",   addr:"Calea București 97A",             city:"Craiova", county:"Dolj", lat:44.3274, lng:23.7887, slots:6 },
    { id:"dj2", name:"EasyBox Kaufland Craiova Brestei",     addr:"Str. Brestei 2",                  city:"Craiova", county:"Dolj", lat:44.3198, lng:23.8123, slots:5 },
    { id:"dj3", name:"EasyBox Auchan Craiova",               addr:"Str. Nicolae Titulescu 1",        city:"Craiova", county:"Dolj", lat:44.3345, lng:23.7965, slots:4 },
    { id:"dj4", name:"EasyBox Kaufland Craiova Rovine",      addr:"Calea Severinului 20",            city:"Craiova", county:"Dolj", lat:44.3423, lng:23.7712, slots:3 },
    { id:"dj5", name:"EasyBox Carrefour Craiova",            addr:"Calea București 40",              city:"Craiova", county:"Dolj", lat:44.3156, lng:23.7834, slots:4 },
    { id:"dj6", name:"EasyBox Băilești",                     addr:"Str. 1 Decembrie 1918 5",         city:"Băilești", county:"Dolj", lat:44.0212, lng:23.3478, slots:2 },
    // ── PRAHOVA ──
    { id:"ph1", name:"EasyBox AFI Ploiești",                 addr:"Str. Găgeni 88",                  city:"Ploiești", county:"Prahova", lat:44.9456, lng:26.0189, slots:6 },
    { id:"ph2", name:"EasyBox Winmarkt Ploiești",            addr:"Str. Republicii 2",               city:"Ploiești", county:"Prahova", lat:44.9512, lng:26.0312, slots:4 },
    { id:"ph3", name:"EasyBox Kaufland Ploiești Vest",       addr:"Bd. București 9",                 city:"Ploiești", county:"Prahova", lat:44.9398, lng:26.0423, slots:3 },
    { id:"ph4", name:"EasyBox Kaufland Ploiești Malu Roșu",  addr:"Calea Câmpinei 44",               city:"Ploiești", county:"Prahova", lat:44.9623, lng:26.0534, slots:3 },
    { id:"ph5", name:"EasyBox Carrefour Ploiești",           addr:"Str. Mihai Bravu 18",             city:"Ploiești", county:"Prahova", lat:44.9345, lng:26.0289, slots:4 },
    { id:"ph6", name:"EasyBox Câmpina",                      addr:"Bd. Carol I 12",                  city:"Câmpina",  county:"Prahova", lat:45.1298, lng:25.7423, slots:2 },
    { id:"ph7", name:"EasyBox Sinaia",                       addr:"Bd. Carol I 4",                   city:"Sinaia",   county:"Prahova", lat:45.3512, lng:25.5523, slots:2 },
    // ── ARGEȘ ──
    { id:"ag1", name:"EasyBox Trivale Mall Pitești",         addr:"Calea Câmpulung 1",               city:"Pitești", county:"Argeș", lat:44.8587, lng:24.8692, slots:5 },
    { id:"ag2", name:"EasyBox Kaufland Pitești Bd. Republicii",addr:"Bd. Republicii 70",             city:"Pitești", county:"Argeș", lat:44.8623, lng:24.8789, slots:4 },
    { id:"ag3", name:"EasyBox Kaufland Pitești Calea Drăgășani",addr:"Calea Drăgășani 2A",           city:"Pitești", county:"Argeș", lat:44.8654, lng:24.8754, slots:4 },
    { id:"ag4", name:"EasyBox Carrefour Pitești",            addr:"Calea Drăgășani 14",              city:"Pitești", county:"Argeș", lat:44.8698, lng:24.8823, slots:5 },
    { id:"ag5", name:"EasyBox Auchan Pitești",               addr:"Calea Câmpulung 120",             city:"Pitești", county:"Argeș", lat:44.8712, lng:24.8912, slots:4 },
    { id:"ag6", name:"EasyBox Lidl Pitești Găvana",          addr:"Str. Găvana 38",                  city:"Pitești", county:"Argeș", lat:44.8467, lng:24.8867, slots:3 },
    { id:"ag7", name:"EasyBox Lidl Pitești Exercițiu",       addr:"Str. Exercițiu 12",               city:"Pitești", county:"Argeș", lat:44.8634, lng:24.8934, slots:3 },
    { id:"ag8", name:"EasyBox Penny Pitești Trivale",        addr:"Str. Trivale 22",                 city:"Pitești", county:"Argeș", lat:44.8556, lng:24.8534, slots:3 },
    { id:"ag9", name:"EasyBox Selgros Pitești",              addr:"Calea București 4",               city:"Pitești", county:"Argeș", lat:44.8723, lng:24.9056, slots:4 },
    { id:"ag10",name:"EasyBox OMV Pitești Nord",             addr:"Calea Câmpulung 244",             city:"Pitești", county:"Argeș", lat:44.8798, lng:24.8612, slots:3 },
    { id:"ag11",name:"EasyBox Mioveni",                      addr:"Str. Unirii 4",                   city:"Mioveni",         county:"Argeș", lat:44.9587, lng:24.9512, slots:2 },
    { id:"ag12",name:"EasyBox Curtea de Argeș",              addr:"Str. Negru Vodă 2",               city:"Curtea de Argeș", county:"Argeș", lat:45.1412, lng:24.6812, slots:2 },
    { id:"ag13",name:"EasyBox Costești",                     addr:"Str. Republicii 14",              city:"Costești",        county:"Argeș", lat:44.6712, lng:24.8834, slots:2 },
    // ── GALAȚI ──
    { id:"gl1", name:"EasyBox Galați Mall",                  addr:"Str. Brăilei 220",                city:"Galați", county:"Galați", lat:45.4354, lng:28.0432, slots:5 },
    { id:"gl2", name:"EasyBox Maxi Galați",                  addr:"Str. Traian 247",                 city:"Galați", county:"Galați", lat:45.4512, lng:28.0521, slots:3 },
    { id:"gl3", name:"EasyBox Kaufland Galați",              addr:"Str. Brăilei 154",                city:"Galați", county:"Galați", lat:45.4289, lng:28.0621, slots:4 },
    { id:"gl4", name:"EasyBox Carrefour Galați",             addr:"Calea Galați 2",                  city:"Galați", county:"Galați", lat:45.4412, lng:28.0312, slots:4 },
    { id:"gl5", name:"EasyBox Tecuci",                       addr:"Str. 1 Decembrie 1918 2",         city:"Tecuci",  county:"Galați", lat:45.8487, lng:27.4234, slots:2 },
    // ── ARAD ──
    { id:"ar1", name:"EasyBox Atrium Mall Arad",             addr:"Bd. General Vasile Milea 4",      city:"Arad", county:"Arad", lat:46.1598, lng:21.3123, slots:5 },
    { id:"ar2", name:"EasyBox Kaufland Arad Mică",           addr:"Bd. 1 Decembrie 1918 22",         city:"Arad", county:"Arad", lat:46.1712, lng:21.3234, slots:4 },
    { id:"ar3", name:"EasyBox Kaufland Arad Aurel Vlaicu",   addr:"Str. Aurel Vlaicu 8",             city:"Arad", county:"Arad", lat:46.1823, lng:21.3312, slots:3 },
    { id:"ar4", name:"EasyBox Carrefour Arad",               addr:"Bd. Revoluției 81",               city:"Arad", county:"Arad", lat:46.1534, lng:21.3234, slots:4 },
    { id:"ar5", name:"EasyBox Ineu",                         addr:"Str. 1 Decembrie 1918 6",         city:"Ineu",  county:"Arad", lat:46.4312, lng:21.8534, slots:2 },
    // ── BACĂU ──
    { id:"bc1", name:"EasyBox Arena Mall Bacău",             addr:"Str. Ștefan cel Mare 8",          city:"Bacău",    county:"Bacău", lat:46.5698, lng:26.9021, slots:5 },
    { id:"bc2", name:"EasyBox Kaufland Bacău",               addr:"Str. Milcov 6",                   city:"Bacău",    county:"Bacău", lat:46.5612, lng:26.9123, slots:4 },
    { id:"bc3", name:"EasyBox Carrefour Bacău",              addr:"Str. Calea Republicii 212",       city:"Bacău",    county:"Bacău", lat:46.5512, lng:26.9234, slots:4 },
    { id:"bc4", name:"EasyBox Lidl Bacău",                   addr:"Str. Republicii 44",              city:"Bacău",    county:"Bacău", lat:46.5789, lng:26.9156, slots:3 },
    { id:"bc5", name:"EasyBox Onești",                       addr:"Bd. Oituz 16",                    city:"Onești",   county:"Bacău", lat:46.2512, lng:26.7234, slots:2 },
    { id:"bc6", name:"EasyBox Moinești",                     addr:"Str. 1 Decembrie 1918 4",         city:"Moinești", county:"Bacău", lat:46.4712, lng:26.4823, slots:2 },
    // ── BUZĂU ──
    { id:"bz1", name:"EasyBox Unic Shopping Buzău",          addr:"Bd. Nicolae Bălcescu 3",          city:"Buzău", county:"Buzău", lat:45.1498, lng:26.8312, slots:4 },
    { id:"bz2", name:"EasyBox Kaufland Buzău",               addr:"Str. Dorobanților 22",            city:"Buzău", county:"Buzău", lat:45.1612, lng:26.8423, slots:3 },
    { id:"bz3", name:"EasyBox Carrefour Buzău",              addr:"Bd. Unirii 218",                  city:"Buzău", county:"Buzău", lat:45.1423, lng:26.8234, slots:3 },
    { id:"bz4", name:"EasyBox Râmnicu Sărat",                addr:"Str. Independenței 14",           city:"Râmnicu Sărat", county:"Buzău", lat:45.3834, lng:27.0534, slots:2 },
    // ── SUCEAVA ──
    { id:"sv1", name:"EasyBox Iulius Mall Suceava",          addr:"Str. Universității 17",           city:"Suceava",                county:"Suceava", lat:47.6521, lng:26.2543, slots:5 },
    { id:"sv2", name:"EasyBox Shopping City Suceava",        addr:"Calea Unirii 30",                 city:"Suceava",                county:"Suceava", lat:47.6398, lng:26.2421, slots:4 },
    { id:"sv3", name:"EasyBox Kaufland Suceava",             addr:"Str. Calea Unirii 6",             city:"Suceava",                county:"Suceava", lat:47.6612, lng:26.2634, slots:3 },
    { id:"sv4", name:"EasyBox Fălticeni",                    addr:"Str. Sucevei 2",                  city:"Fălticeni",              county:"Suceava", lat:47.4612, lng:26.2912, slots:2 },
    { id:"sv5", name:"EasyBox Câmpulung Moldovenesc",        addr:"Str. Republicii 5",               city:"Câmpulung Moldovenesc",  county:"Suceava", lat:47.5312, lng:25.5612, slots:2 },
    { id:"sv6", name:"EasyBox Rădăuți",                      addr:"Piața Unirii 4",                  city:"Rădăuți",                county:"Suceava", lat:47.8469, lng:25.9181, slots:2 },
    { id:"sv7", name:"EasyBox Vatra Dornei",                 addr:"Str. Mihai Eminescu 2",           city:"Vatra Dornei",           county:"Suceava", lat:47.3512, lng:25.3634, slots:2 },
    // ── MUREȘ ──
    { id:"ms1", name:"EasyBox Plaza Mureș",                  addr:"Str. Gheorghe Doja 238",          city:"Târgu Mureș", county:"Mureș", lat:46.5298, lng:24.5543, slots:4 },
    { id:"ms2", name:"EasyBox Kaufland Târgu Mureș",         addr:"Str. Gheorghe Doja 107",          city:"Târgu Mureș", county:"Mureș", lat:46.5412, lng:24.5621, slots:3 },
    { id:"ms3", name:"EasyBox Carrefour Târgu Mureș",        addr:"Bd. 1 Decembrie 1918 219",        city:"Târgu Mureș", county:"Mureș", lat:46.5534, lng:24.5712, slots:4 },
    { id:"ms4", name:"EasyBox Sighișoara",                   addr:"Str. 1 Decembrie 1918 9",         city:"Sighișoara",  county:"Mureș", lat:46.2198, lng:24.7912, slots:2 },
    { id:"ms5", name:"EasyBox Reghin",                       addr:"Str. Mihai Viteazu 6",            city:"Reghin",      county:"Mureș", lat:46.7712, lng:24.7034, slots:2 },
    { id:"ms6", name:"EasyBox Luduș",                        addr:"Str. Câmpiei 2",                  city:"Luduș",       county:"Mureș", lat:46.4734, lng:24.0923, slots:2 },
    // ── VÂLCEA ──
    { id:"vl1", name:"EasyBox Shopping City Vâlcea",         addr:"Calea lui Traian 186",            city:"Râmnicu Vâlcea", county:"Vâlcea", lat:45.1098, lng:24.3621, slots:4 },
    { id:"vl2", name:"EasyBox Kaufland Vâlcea",              addr:"Str. Știrbei Vodă 73",            city:"Râmnicu Vâlcea", county:"Vâlcea", lat:45.1012, lng:24.3712, slots:3 },
    { id:"vl3", name:"EasyBox Carrefour Vâlcea",             addr:"Calea lui Traian 40",             city:"Râmnicu Vâlcea", county:"Vâlcea", lat:45.1156, lng:24.3534, slots:3 },
    { id:"vl4", name:"EasyBox Drăgășani",                    addr:"Str. Traian 22",                  city:"Drăgășani",      county:"Vâlcea", lat:44.6598, lng:24.2612, slots:2 },
    // ── VRANCEA ──
    { id:"vn1", name:"EasyBox Vrancea Shopping City",        addr:"Bd. Unirii 4",                    city:"Focșani", county:"Vrancea", lat:45.6998, lng:27.1823, slots:3 },
    { id:"vn2", name:"EasyBox Kaufland Focșani",             addr:"Str. Milcov 6",                   city:"Focșani", county:"Vrancea", lat:45.6912, lng:27.1923, slots:3 },
    { id:"vn3", name:"EasyBox Carrefour Focșani",            addr:"Calea Munteniei 8",               city:"Focșani", county:"Vrancea", lat:45.7056, lng:27.1756, slots:3 },
    { id:"vn4", name:"EasyBox Adjud",                        addr:"Str. 1 Decembrie 1918 2",         city:"Adjud",   county:"Vrancea", lat:46.1034, lng:27.1798, slots:2 },
    // ── MARAMUREȘ ──
    { id:"mm1", name:"EasyBox Kaufland Baia Mare",           addr:"Bd. Independenței 34",            city:"Baia Mare",         county:"Maramureș", lat:47.6498, lng:23.5843, slots:4 },
    { id:"mm2", name:"EasyBox Shopping City Baia Mare",      addr:"Bd. Decebal 38",                  city:"Baia Mare",         county:"Maramureș", lat:47.6612, lng:23.5934, slots:3 },
    { id:"mm3", name:"EasyBox Carrefour Baia Mare",          addr:"Bd. București 71",                city:"Baia Mare",         county:"Maramureș", lat:47.6734, lng:23.6012, slots:3 },
    { id:"mm4", name:"EasyBox Sighetu Marmației",            addr:"Str. Bogdan Vodă 2",              city:"Sighetu Marmației", county:"Maramureș", lat:47.9312, lng:23.8912, slots:2 },
    { id:"mm5", name:"EasyBox Borșa",                        addr:"Str. Libertății 4",               city:"Borșa",             county:"Maramureș", lat:47.6567, lng:24.6634, slots:2 },
    // ── SATU MARE ──
    { id:"sm1", name:"EasyBox Shopping City Satu Mare",      addr:"Str. Careului 14A",               city:"Satu Mare", county:"Satu Mare", lat:47.7912, lng:22.8923, slots:4 },
    { id:"sm2", name:"EasyBox Kaufland Satu Mare",           addr:"Str. 1 Decembrie 1918 4",         city:"Satu Mare", county:"Satu Mare", lat:47.7823, lng:22.8834, slots:3 },
    { id:"sm3", name:"EasyBox Carrefour Satu Mare",          addr:"Bd. Lucian Blaga 2",              city:"Satu Mare", county:"Satu Mare", lat:47.7734, lng:22.8712, slots:3 },
    { id:"sm4", name:"EasyBox Carei",                        addr:"Str. 1 Decembrie 1918 7",         city:"Carei",     county:"Satu Mare", lat:47.6834, lng:22.4712, slots:2 },
    // ── HUNEDOARA ──
    { id:"hd1", name:"EasyBox Corvin Mall Deva",             addr:"Bd. Iuliu Maniu 12",              city:"Deva",       county:"Hunedoara", lat:45.8812, lng:22.9123, slots:4 },
    { id:"hd2", name:"EasyBox Kaufland Deva",                addr:"Str. Mărăști 2",                  city:"Deva",       county:"Hunedoara", lat:45.8923, lng:22.9234, slots:3 },
    { id:"hd3", name:"EasyBox Petroșani",                    addr:"Str. 1 Decembrie 1918 50",        city:"Petroșani",  county:"Hunedoara", lat:45.4112, lng:23.3698, slots:2 },
    { id:"hd4", name:"EasyBox Orăștie",                      addr:"Str. Aurel Vlaicu 4",             city:"Orăștie",    county:"Hunedoara", lat:45.8312, lng:23.1923, slots:2 },
    { id:"hd5", name:"EasyBox Hunedoara",                    addr:"Str. 22 Decembrie 1989 14",       city:"Hunedoara",  county:"Hunedoara", lat:45.7523, lng:22.9112, slots:2 },
    // ── ALBA ──
    { id:"ab1", name:"EasyBox Parc Mall Alba Iulia",         addr:"Calea Moților 135",               city:"Alba Iulia", county:"Alba", lat:46.0598, lng:23.5712, slots:4 },
    { id:"ab2", name:"EasyBox Kaufland Alba Iulia",          addr:"Str. Lalelelor 3",                city:"Alba Iulia", county:"Alba", lat:46.0712, lng:23.5823, slots:3 },
    { id:"ab3", name:"EasyBox Carrefour Alba Iulia",         addr:"Bd. 1 Decembrie 1918 4",          city:"Alba Iulia", county:"Alba", lat:46.0823, lng:23.5934, slots:3 },
    { id:"ab4", name:"EasyBox Sebeș",                        addr:"Str. Lucian Blaga 14",            city:"Sebeș",      county:"Alba", lat:45.9612, lng:23.5698, slots:2 },
    { id:"ab5", name:"EasyBox Aiud",                         addr:"Str. Tudor Vladimirescu 16",      city:"Aiud",       county:"Alba", lat:46.3198, lng:23.7212, slots:2 },
    // ── BISTRIȚA-NĂSĂUD ──
    { id:"bn1", name:"EasyBox Shopping City Bistrița",       addr:"Calea Moldovei 2A",               city:"Bistrița", county:"Bistrița-Năsăud", lat:47.1312, lng:24.5034, slots:4 },
    { id:"bn2", name:"EasyBox Kaufland Bistrița",            addr:"Str. 1 Decembrie 1918 8",         city:"Bistrița", county:"Bistrița-Năsăud", lat:47.1423, lng:24.5123, slots:3 },
    { id:"bn3", name:"EasyBox Năsăud",                       addr:"Str. Republicii 6",               city:"Năsăud",   county:"Bistrița-Năsăud", lat:47.2912, lng:24.4034, slots:2 },
    // ── MEHEDINȚI ──
    { id:"mh1", name:"EasyBox Shopping City Severin",        addr:"Str. Crișan 2A",                  city:"Drobeta-Turnu Severin", county:"Mehedinți", lat:44.6312, lng:22.6543, slots:3 },
    { id:"mh2", name:"EasyBox Kaufland Severin",             addr:"Bd. Carol I 18",                  city:"Drobeta-Turnu Severin", county:"Mehedinți", lat:44.6198, lng:22.6434, slots:2 },
    { id:"mh3", name:"EasyBox Strehaia",                     addr:"Str. Independenței 4",            city:"Strehaia",              county:"Mehedinți", lat:44.6212, lng:23.1934, slots:2 },
    // ── OLT ──
    { id:"ot1", name:"EasyBox Slatina Shopping Center",      addr:"Bd. Alexandru Ioan Cuza 6",       city:"Slatina",  county:"Olt", lat:44.4312, lng:24.3698, slots:3 },
    { id:"ot2", name:"EasyBox Kaufland Slatina",             addr:"Str. Cuza Vodă 2",                city:"Slatina",  county:"Olt", lat:44.4423, lng:24.3812, slots:3 },
    { id:"ot3", name:"EasyBox Caracal",                      addr:"Str. Antonius Caracalla 2",       city:"Caracal",  county:"Olt", lat:44.1198, lng:24.3498, slots:2 },
    { id:"ot4", name:"EasyBox Balș",                         addr:"Str. Crișan 4",                   city:"Balș",     county:"Olt", lat:44.3612, lng:24.0934, slots:2 },
    // ── TELEORMAN ──
    { id:"tr1", name:"EasyBox Shopping City Alexandria",     addr:"Str. Libertății 1",               city:"Alexandria",     county:"Teleorman", lat:43.9812, lng:25.3498, slots:3 },
    { id:"tr2", name:"EasyBox Kaufland Alexandria",          addr:"Bd. Dunării 8",                   city:"Alexandria",     county:"Teleorman", lat:43.9923, lng:25.3598, slots:3 },
    { id:"tr3", name:"EasyBox Roșiori de Vede",              addr:"Str. 1 Decembrie 1918 16",        city:"Roșiori de Vede", county:"Teleorman", lat:44.1112, lng:24.9823, slots:2 },
    // ── SĂLAJ ──
    { id:"sj1", name:"EasyBox Zalău Shopping Center",        addr:"Bd. Mihai Viteazu 14",            city:"Zalău",          county:"Sălaj", lat:47.1912, lng:23.0623, slots:3 },
    { id:"sj2", name:"EasyBox Kaufland Zalău",               addr:"Str. Simion Bărnuțiu 6",          city:"Zalău",          county:"Sălaj", lat:47.1823, lng:23.0512, slots:2 },
    { id:"sj3", name:"EasyBox Șimleu Silvaniei",             addr:"Str. 1 Decembrie 1918 2",         city:"Șimleu Silvaniei",county:"Sălaj", lat:47.2334, lng:22.7923, slots:2 },
    // ── COVASNA ──
    { id:"cv1", name:"EasyBox Mall Sfântu Gheorghe",         addr:"Str. 1 Decembrie 1918 40",        city:"Sfântu Gheorghe", county:"Covasna", lat:45.8712, lng:25.7898, slots:3 },
    { id:"cv2", name:"EasyBox Kaufland Sfântu Gheorghe",     addr:"Calea Buzăului 14",               city:"Sfântu Gheorghe", county:"Covasna", lat:45.8823, lng:25.8012, slots:2 },
    { id:"cv3", name:"EasyBox Târgu Secuiesc",               addr:"Str. Kossuth Lajos 4",            city:"Târgu Secuiesc",  county:"Covasna", lat:46.0034, lng:26.1434, slots:2 },
    // ── CARAȘ-SEVERIN ──
    { id:"cs1", name:"EasyBox Plaza Reșița",                 addr:"Bd. Muncii 6",                    city:"Reșița",      county:"Caraș-Severin", lat:45.2912, lng:21.8898, slots:3 },
    { id:"cs2", name:"EasyBox Kaufland Reșița",              addr:"Str. Trandafirilor 2",            city:"Reșița",      county:"Caraș-Severin", lat:45.3023, lng:21.8989, slots:2 },
    { id:"cs3", name:"EasyBox Caransebeș",                   addr:"Str. Mihai Viteazu 6",            city:"Caransebeș",  county:"Caraș-Severin", lat:45.4148, lng:22.2198, slots:2 },
    // ── IALOMIȚA ──
    { id:"il1", name:"EasyBox Slobozia Shopping Center",     addr:"Str. Lacului 2A",                 city:"Slobozia", county:"Ialomița", lat:44.5612, lng:27.3723, slots:3 },
    { id:"il2", name:"EasyBox Kaufland Slobozia",            addr:"Str. Matei Basarab 44",           city:"Slobozia", county:"Ialomița", lat:44.5723, lng:27.3834, slots:2 },
    { id:"il3", name:"EasyBox Fetești",                      addr:"Bd. Republicii 4",                city:"Fetești",  county:"Ialomița", lat:44.3712, lng:27.8312, slots:2 },
    // ── GIURGIU ──
    { id:"gr1", name:"EasyBox Giurgiu Shopping",             addr:"Șos. București 2",                city:"Giurgiu", county:"Giurgiu", lat:43.9012, lng:25.9698, slots:3 },
    { id:"gr2", name:"EasyBox Kaufland Giurgiu",             addr:"Str. Sloboziei 12",               city:"Giurgiu", county:"Giurgiu", lat:43.9123, lng:25.9812, slots:2 },
    // ── DÂMBOVIȚA ──
    { id:"db1", name:"EasyBox Shopping City Târgoviște",     addr:"Calea Ialomiței 4",               city:"Târgoviște", county:"Dâmbovița", lat:44.9212, lng:25.4598, slots:3 },
    { id:"db2", name:"EasyBox Kaufland Târgoviște",          addr:"Str. Laminorului 4",              city:"Târgoviște", county:"Dâmbovița", lat:44.9312, lng:25.4712, slots:3 },
    { id:"db3", name:"EasyBox Carrefour Târgoviște",         addr:"Calea Câmpulung 200",             city:"Târgoviște", county:"Dâmbovița", lat:44.9423, lng:25.4634, slots:3 },
    { id:"db4", name:"EasyBox Moreni",                       addr:"Bd. Independenței 22",            city:"Moreni",     county:"Dâmbovița", lat:44.9823, lng:25.6434, slots:2 },
    // ── CĂLĂRAȘI ──
    { id:"cl1", name:"EasyBox Kaufland Călărași",            addr:"Str. București 52",               city:"Călărași", county:"Călărași", lat:44.2012, lng:27.3312, slots:3 },
    { id:"cl2", name:"EasyBox Shopping Center Călărași",     addr:"Str. 1 Decembrie 1918 8",         city:"Călărași", county:"Călărași", lat:44.2123, lng:27.3423, slots:3 },
    { id:"cl3", name:"EasyBox Oltenița",                     addr:"Str. Argeșului 14",               city:"Oltenița", county:"Călărași", lat:44.0798, lng:26.6134, slots:2 },
    // ── NEAMȚ ──
    { id:"nt1", name:"EasyBox Shopping City Piatra-Neamț",   addr:"Bd. Decebal 104",                 city:"Piatra-Neamț", county:"Neamț", lat:46.9212, lng:26.3698, slots:4 },
    { id:"nt2", name:"EasyBox Kaufland Piatra-Neamț",        addr:"Str. Petru Rareș 2",              city:"Piatra-Neamț", county:"Neamț", lat:46.9312, lng:26.3798, slots:3 },
    { id:"nt3", name:"EasyBox Carrefour Piatra-Neamț",       addr:"Bd. Traian 22",                   city:"Piatra-Neamț", county:"Neamț", lat:46.9123, lng:26.3612, slots:3 },
    { id:"nt4", name:"EasyBox Roman",                        addr:"Bd. Roman Mușat 4",               city:"Roman",        county:"Neamț", lat:46.9198, lng:26.9212, slots:2 },
    // ── HARGHITA ──
    { id:"hr1", name:"EasyBox Kaufland Miercurea Ciuc",      addr:"Str. Kossuth Lajos 2",            city:"Miercurea Ciuc",    county:"Harghita", lat:46.3567, lng:25.7986, slots:3 },
    { id:"hr2", name:"EasyBox Odorheiu Secuiesc",            addr:"Piața Primăriei 4",               city:"Odorheiu Secuiesc", county:"Harghita", lat:46.3023, lng:25.2987, slots:2 },
    { id:"hr3", name:"EasyBox Toplița",                      addr:"Str. Libertății 2",               city:"Toplița",           county:"Harghita", lat:46.9212, lng:25.3434, slots:2 },
    // ── TULCEA ──
    { id:"tl1", name:"EasyBox Tulcea Shopping Center",       addr:"Str. Babadag 2",                  city:"Tulcea", county:"Tulcea", lat:45.1834, lng:28.7912, slots:3 },
    { id:"tl2", name:"EasyBox Kaufland Tulcea",              addr:"Str. Isaccei 108",                city:"Tulcea", county:"Tulcea", lat:45.1923, lng:28.8023, slots:2 },
    { id:"tl3", name:"EasyBox Măcin",                        addr:"Str. Republicii 6",               city:"Măcin",  county:"Tulcea", lat:45.2498, lng:28.1298, slots:2 },
    // ── GORJ ──
    { id:"gj1", name:"EasyBox Shopping City Târgu Jiu",      addr:"Bd. Ecaterina Teodoroiu 2",       city:"Târgu Jiu", county:"Gorj", lat:45.0312, lng:23.2812, slots:3 },
    { id:"gj2", name:"EasyBox Kaufland Târgu Jiu",           addr:"Str. Victoriei 14",               city:"Târgu Jiu", county:"Gorj", lat:45.0423, lng:23.2934, slots:2 },
    { id:"gj3", name:"EasyBox Motru",                        addr:"Str. Tineretului 2",              city:"Motru",     county:"Gorj", lat:44.8023, lng:22.9712, slots:2 },
    // ── VASLUI ──
    { id:"vs1", name:"EasyBox Shopping City Vaslui",         addr:"Bd. Ștefan cel Mare 44",          city:"Vaslui",  county:"Vaslui", lat:46.6423, lng:27.7323, slots:3 },
    { id:"vs2", name:"EasyBox Kaufland Vaslui",              addr:"Str. Dorobanților 6",             city:"Vaslui",  county:"Vaslui", lat:46.6512, lng:27.7412, slots:2 },
    { id:"vs3", name:"EasyBox Bârlad",                       addr:"Str. Republicii 4",               city:"Bârlad",  county:"Vaslui", lat:46.2312, lng:27.6623, slots:2 },
    { id:"vs4", name:"EasyBox Huși",                         addr:"Str. 1 Decembrie 1918 8",         city:"Huși",    county:"Vaslui", lat:46.6912, lng:28.0534, slots:2 },
    // ── BOTOȘANI ──
    { id:"bt1", name:"EasyBox Shopping City Botoșani",       addr:"Calea Națională 65",              city:"Botoșani", county:"Botoșani", lat:47.7423, lng:26.6734, slots:4 },
    { id:"bt2", name:"EasyBox Kaufland Botoșani",            addr:"Str. Calea Națională 120",        city:"Botoșani", county:"Botoșani", lat:47.7312, lng:26.6823, slots:3 },
    { id:"bt3", name:"EasyBox Carrefour Botoșani",           addr:"Calea Națională 2",               city:"Botoșani", county:"Botoșani", lat:47.7534, lng:26.6912, slots:3 },
    { id:"bt4", name:"EasyBox Dorohoi",                      addr:"Str. 1 Decembrie 1918 2",         city:"Dorohoi",  county:"Botoșani", lat:47.9512, lng:26.3923, slots:2 },
    // ── BRĂILA ──
    { id:"br1", name:"EasyBox Brăila Mall",                  addr:"Calea Galați 1",                  city:"Brăila", county:"Brăila", lat:45.2823, lng:27.9698, slots:4 },
    { id:"br2", name:"EasyBox Kaufland Brăila",              addr:"Calea Călărașilor 2",             city:"Brăila", county:"Brăila", lat:45.2712, lng:27.9823, slots:3 },
    { id:"br3", name:"EasyBox Carrefour Brăila",             addr:"Calea Călărașilor 118",           city:"Brăila", county:"Brăila", lat:45.2634, lng:27.9712, slots:3 },
  ];
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600");

  const hasCredentials = process.env.SAMEDAY_USERNAME && process.env.SAMEDAY_PASSWORD;

  /* 1. Sameday API official */
  if (hasCredentials) {
    try {
      const token   = await getToken();
      const lockers = await fetchFromSameday(token);
      res.json(lockers);
      return;
    } catch (err) {
      console.error("[lockers] Sameday API:", err.message);
    }
  }

  /* 2. OpenStreetMap fallback */
  try {
    const lockers = await fetchFromOSM();
    if (lockers.length > 0) { res.json(lockers); return; }
  } catch (err) {
    console.error("[lockers] OSM fallback:", err.message);
  }

  /* 3. Mock data pentru development */
  if (process.env.NODE_ENV !== "production") {
    res.json(getMockLockers());
    return;
  }

  res.status(500).json({ error: "Nu s-a putut încărca lista de lockere." });
};
