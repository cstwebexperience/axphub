/* Fetch EasyBox locker locations from OpenStreetMap via Overpass API */
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400"); /* cache 24h pe Vercel */

  const query = `
[out:json][timeout:30];
area["ISO3166-1"="RO"]->.ro;
(
  node["amenity"="parcel_locker"]["operator"~"Sameday|EasyBox",i](area.ro);
  node["amenity"="parcel_locker"]["brand"~"EasyBox",i](area.ro);
  node["name"~"EasyBox",i]["amenity"="parcel_locker"](area.ro);
);
out body;
  `.trim();

  try {
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!r.ok) throw new Error(`Overpass error ${r.status}`);
    const data = await r.json();

    const lockers = data.elements.map((el) => ({
      id:   String(el.id),
      lat:  el.lat,
      lng:  el.lon,
      name: el.tags.name || el.tags["name:ro"] || "EasyBox",
      addr: [el.tags["addr:street"], el.tags["addr:housenumber"]]
              .filter(Boolean).join(" ") || "",
      city: el.tags["addr:city"] || el.tags["addr:county"] || "",
    }));

    res.json(lockers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
