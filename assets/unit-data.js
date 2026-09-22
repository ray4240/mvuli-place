// Mvuli Place — unit typology reference data
// -----------------------------------------------------------------
// Source: NACHU presentation (20260525_NACHU_Presentation_Mark_Hotel).
// 10 floors x 12 units/floor = 120 units, matching the typical floor
// plan note: "1 bedroom - 10 units, Studios - 2 units" per floor.
//
// Per-floor mix used to hit the building totals (Studio 20, A 60,
// B 20, C 10, D 10): 2 Studio + 6 A + 2 B + 1 C + 1 D = 12/floor.
// This distribution is Claude's assumption to give every unit a
// number for the admin panel — replace with the real unit register
// if/when NACHU or Placemakers shares one.
// -----------------------------------------------------------------

export const TYPOLOGIES = {
  Studio: { label: "Studio", sqm: 22, price: 2000000, totalUnits: 20 },
  "1BR-A": { label: "One Bedroom A", sqm: 35, price: 3500000, totalUnits: 60 },
  "1BR-B": { label: "One Bedroom B", sqm: 37, price: 3600000, totalUnits: 20 },
  "1BR-C": { label: "One Bedroom C", sqm: 43, price: 3800000, totalUnits: 10 },
  "1BR-D": { label: "One Bedroom D", sqm: 46, price: 3900000, totalUnits: 10 },
};

// Per-floor layout: 2 Studio, 6 x 1BR-A, 2 x 1BR-B, 1 x 1BR-C, 1 x 1BR-D
const FLOOR_LAYOUT = [
  "Studio", "Studio",
  "1BR-A", "1BR-A", "1BR-A", "1BR-A", "1BR-A", "1BR-A",
  "1BR-B", "1BR-B",
  "1BR-C",
  "1BR-D",
];

const FLOORS = 10;

export function generateUnitList() {
  const units = [];
  for (let floor = 1; floor <= FLOORS; floor++) {
    FLOOR_LAYOUT.forEach((typology, i) => {
      const unitNo = `F${String(floor).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      units.push({
        unitNo,
        floor,
        typology,
        price: TYPOLOGIES[typology].price,
        status: "available",
      });
    });
  }
  return units;
}
