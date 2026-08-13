import {
  BatteryWarning,
  CircleDotDashed,
  CircleGauge,
  Disc3,
  Droplets,
  Gauge,
  ShieldAlert,
  Thermometer,
  TriangleAlert,
  Waves,
  type LucideIcon,
} from "lucide-react";

/**
 * Warning-light guides content cluster.
 *
 * Each entry is a hand-written guide — the meaning, causes, costs, safe
 * actions and per-guide FAQ are unique per light, so the pages never look
 * like template-swapped variables. `relatedDtc` must only reference codes
 * that exist in `lib/dtc.ts` (links would otherwise 404), and
 * `relatedGuides` only reference slugs in this file.
 */

export type LightColor = "red" | "amber" | "blue";

export type GuideUrgency = "stop" | "soon" | "watch";

export interface WarningLightGuide {
  slug: string;
  /** Full name, e.g. "Brake warning light" — used in headings and titles. */
  name: string;
  /** Short label for cards, e.g. "Brake light". */
  shortName: string;
  icon: LucideIcon;
  /** The colour(s) the light usually shows on the dashboard. */
  colors: LightColor[];
  urgency: GuideUrgency;
  /** Chip label for the guide page, e.g. "Stop safely now". */
  urgencyLabel: string;
  title: string;
  description: string;
  /** Hero paragraph on the guide page. */
  summary: string;
  /** "What it looks like / appears as" section body. */
  appearsAs: string;
  meanings: string[];
  causes: string[];
  costs: Array<{ label: string; range: string }>;
  dos: string[];
  donts: string[];
  relatedDtc: string[];
  relatedGuides: string[];
  faq: Array<{ q: string; a: string }>;
}

export const WARNING_LIGHT_GUIDES: WarningLightGuide[] = [
  /* ------------------------------------------------ Check engine */
  {
    slug: "check-engine-light",
    name: "Check engine light",
    shortName: "Check engine",
    icon: Gauge,
    colors: ["amber"],
    urgency: "soon",
    urgencyLabel: "Book service",
    title: "Check Engine Light: Meaning, Causes & What to Do",
    description:
      "Why is the check engine light on? Plain-English meaning, the most common causes (gas cap, O2 sensor, catalytic converter), typical repair costs, and whether you can keep driving.",
    summary:
      "The check engine light is the car's way of saying the engine computer has recorded a fault — usually in the emissions or engine-management systems. A steady light usually means you can drive for a while, but a flashing light means the engine is actively misfiring and needs attention now.",
    appearsAs:
      "An amber or yellow engine-shaped icon on the dashboard, often labelled 'Check engine' or 'Service engine soon'. It usually comes on steady; on some cars it flashes when the engine is actively misfiring.",
    meanings: [
      "The engine control unit has stored one or more diagnostic trouble codes (DTCs).",
      "An emissions-related fault — a loose fuel cap alone can trigger it.",
      "A sensor is reading out of range — for example oxygen sensors, mass airflow or coolant temperature.",
      "A flashing light means an active misfire that can damage the catalytic converter.",
    ],
    causes: [
      "Loose, missing or cracked fuel cap",
      "Failing oxygen (O₂) sensor",
      "Worn spark plugs or ignition coils",
      "Mass airflow (MAF) sensor fault",
      "Small EVAP-system leak (often the fuel cap)",
      "Catalytic converter efficiency below threshold",
      "Coolant thermostat stuck open (code P0128)",
    ],
    costs: [
      { label: "Diagnostic scan", range: "$50–$150" },
      { label: "Fuel cap (DIY fix often)", range: "$15–$40" },
      { label: "Spark plugs", range: "$100–$300" },
      { label: "Oxygen sensor", range: "$150–$450" },
      { label: "EVAP leak repair", range: "$100–$400" },
      { label: "Catalytic converter", range: "$800–$2,500" },
    ],
    dos: [
      "Check the fuel cap is tight — then give the light a few days to clear.",
      "Note when it came on and whether the car behaves differently.",
      "Get the codes read — most parts shops do it for free.",
      "Book a workshop if the light stays on.",
    ],
    donts: [
      "Don't ignore a flashing check engine light — pull over and call for help.",
      "Don't keep driving long distances with the light on without having the codes read.",
      "Don't assume it's 'just the sensor' — confirm with a scan.",
    ],
    relatedDtc: ["P0420", "P0300", "P0171", "P0455", "P0128"],
    relatedGuides: ["battery-light", "coolant-temperature-light", "oil-pressure-light"],
    faq: [
      {
        q: "Can I drive with the check engine light on?",
        a: "With a steady light, short trips are usually fine — but have the codes read and the fault diagnosed soon. With a flashing light the engine is actively misfiring; driving can damage the catalytic converter, so stop safely and arrange a tow.",
      },
      {
        q: "Why is the check engine light flashing?",
        a: "Flashing means a cylinder is misfiring badly enough that unburned fuel is reaching the catalytic converter. This can destroy an expensive converter quickly, so the safe move is to pull over, stop the engine and call for help.",
      },
      {
        q: "Will the check engine light go off by itself?",
        a: "Sometimes — after a loose gas cap is tightened or a minor fault stops occurring, the light may clear after several driving cycles. If the fault is still present it will return, so a light that goes off on its own is worth a scan anyway.",
      },
    ],
  },

  /* ------------------------------------------------ Brake */
  {
    slug: "brake-warning-light",
    name: "Brake warning light",
    shortName: "Brake light",
    icon: TriangleAlert,
    colors: ["red"],
    urgency: "stop",
    urgencyLabel: "Stop safely now",
    title: "Brake Warning Light: Meaning, Causes & What to Do",
    description:
      "The red brake warning light means a possible braking problem. Find out what it means, the most common causes (fluid level, pads, leaks), repair costs, and whether it's safe to drive.",
    summary:
      "The red brake warning light is one of the most important lights on the dashboard. It usually means the parking brake is on, the brake fluid is low, or the braking system has a fault. Because braking is safety-critical, a red brake light should never be ignored.",
    appearsAs:
      "A red circle with an exclamation mark or the word 'BRAKE', sometimes styled as a '(!)' or '( )' brake symbol. On some cars it shows the words 'BRAKE FLUID' or a red 'P' for the parking brake.",
    meanings: [
      "The parking (hand) brake is still engaged.",
      "Brake fluid level is low — pads are worn or there is a leak.",
      "The braking system has a fault detected by the ABS/ESC module.",
      "Brake pads have reached the wear sensor on some models.",
    ],
    causes: [
      "Parking brake left on or not fully released",
      "Low brake fluid (from worn pads or a leak)",
      "Leaking brake line, hose or caliper",
      "Failing brake master cylinder",
      "Worn brake pads tripping the wear sensor",
      "ABS module fault setting the light with the ABS light",
    ],
    costs: [
      { label: "Brake fluid top-up", range: "$30–$80" },
      { label: "Brake pads (front or rear axle)", range: "$150–$400" },
      { label: "Pads + rotors (one axle)", range: "$300–$700" },
      { label: "Brake line / hose repair", range: "$150–$400" },
      { label: "Master cylinder", range: "$300–$700" },
    ],
    dos: [
      "Check the parking brake is fully released first.",
      "If the light stays on, check the brake fluid level visually — but don't open the cap if the car has just been driven.",
      "If fluid is low or the light stays on, don't drive — arrange a tow.",
      "Have the braking system inspected by a qualified workshop.",
    ],
    donts: [
      "Don't drive with a red brake light on — braking may be seriously reduced.",
      "Don't just top up fluid and ignore it — the low level usually means a leak or worn parts.",
      "Don't ignore the brake and ABS lights together — that combination signals a real fault.",
    ],
    relatedDtc: ["C0035", "C0121", "P0500"],
    relatedGuides: ["abs-light", "tire-pressure-light"],
    faq: [
      {
        q: "Brake light is on but the fluid is full — what now?",
        a: "If the reservoir is full and the parking brake is off, the light usually means a genuine system fault — a failing master cylinder, a sensor or an ABS module issue. Have the car inspected rather than guessing, since braking faults are safety-critical.",
      },
      {
        q: "Why are the brake light and ABS light on together?",
        a: "Both lights together usually mean the ABS/ESC module has detected a fault in the braking system — for example a wheel speed sensor or low fluid. Normal braking may still work, but stability functions are off. Get it scanned and inspected soon.",
      },
      {
        q: "Can I drive with the brake light on?",
        a: "No — treat a red brake light as a reason not to drive. If it came on only because the parking brake is engaged, releasing it is enough. Otherwise stop safely, don't drive, and arrange a tow to a workshop.",
      },
    ],
  },

  /* ------------------------------------------------ Battery */
  {
    slug: "battery-light",
    name: "Battery warning light",
    shortName: "Battery light",
    icon: BatteryWarning,
    colors: ["red", "amber"],
    urgency: "soon",
    urgencyLabel: "Act soon",
    title: "Battery Warning Light: Meaning, Causes & What to Do",
    description:
      "The battery (charging) warning light means the car isn't charging the battery properly. Learn the common causes (alternator, belt, battery), repair costs, and how far you can safely drive.",
    summary:
      "The battery warning light means the charging system isn't keeping the battery topped up — usually a failing alternator, a worn drive belt, or a battery that has reached the end of its life. The car will keep running on battery power for a while, but when the battery drains, it will stall — and you'll lose power steering and brake assist with it.",
    appearsAs:
      "A red (sometimes amber) battery icon with a '+' and '−' terminal. Some cars show the word 'CHARGE' or 'GEN' (generator). It may come on while driving or flicker at low revs.",
    meanings: [
      "The alternator isn't charging the battery while the engine runs.",
      "The drive belt that turns the alternator is slipping or broken.",
      "The battery itself can no longer hold a charge.",
      "The charging voltage is out of range (too high or too low).",
    ],
    causes: [
      "Failed or failing alternator",
      "Worn, loose or broken alternator drive belt",
      "Battery at end of life (3–5 years old)",
      "Corroded or loose battery terminals",
      "Voltage regulator failure inside the alternator",
      "A heavy electrical drain from a failed component",
    ],
    costs: [
      { label: "Battery (replacement)", range: "$150–$350" },
      { label: "Battery terminals / cables", range: "$50–$150" },
      { label: "Drive belt replacement", range: "$150–$300" },
      { label: "Alternator replacement", range: "$400–$900" },
    ],
    dos: [
      "Check the battery terminals are clean and tight.",
      "Keep the car running and head to a nearby workshop — preferably not a long trip.",
      "Avoid using lights, heated seats and wipers unnecessarily to stretch battery life.",
      "Have the charging system tested (voltage and load test).",
    ],
    donts: [
      "Don't ignore it — the car can stall without warning and leave you stranded.",
      "Don't repeatedly jump-start and drive on — it hides the real fault.",
      "Don't keep driving on a long trip once the light comes on.",
    ],
    relatedDtc: ["P0562", "P0563", "B1320", "U0100"],
    relatedGuides: ["check-engine-light", "traction-control-light"],
    faq: [
      {
        q: "Battery light is on but the car drives fine — is it serious?",
        a: "Yes, treat it seriously. The engine keeps running off the battery, and once the battery is flat the engine stops — you then lose power steering and brake boost. Drive to the nearest workshop rather than continuing a long journey.",
      },
      {
        q: "How far can I drive with the battery light on?",
        a: "It depends on the battery's remaining charge — it can be anywhere from minutes to an hour. Don't gamble on a long trip; head to the nearest shop and have the charging system tested.",
      },
      {
        q: "I just fitted a new battery and the light is still on.",
        a: "A new battery won't help if the alternator or belt is the problem. Have the charging system tested — if the alternator isn't putting out around 13.5–14.5 V while running, it needs attention.",
      },
    ],
  },

  /* ------------------------------------------------ Oil pressure */
  {
    slug: "oil-pressure-light",
    name: "Oil pressure warning light",
    shortName: "Oil pressure light",
    icon: Droplets,
    colors: ["red"],
    urgency: "stop",
    urgencyLabel: "Stop now — engine damage risk",
    title: "Oil Pressure Warning Light: Meaning, Causes & What to Do",
    description:
      "The red oil pressure light means low engine oil pressure — a serious risk of engine damage. Learn the causes (low oil, leaks, pump failure), what to do immediately, and repair costs.",
    summary:
      "The oil pressure light means the engine is not getting the oil pressure it needs to protect internal parts. Driving on — even briefly — can cause catastrophic, expensive engine damage. This is one of the few lights that means 'stop now'.",
    appearsAs:
      "A red oil can icon with a dripping spout, sometimes with the word 'OIL'. It may come on steady while driving or flicker at idle, which is also a warning sign.",
    meanings: [
      "Engine oil pressure has dropped below the safe minimum.",
      "The oil level is critically low.",
      "The oil pump isn't building pressure.",
      "The oil pressure sensor itself has failed (less common, still worth checking).",
    ],
    causes: [
      "Very low engine oil level (consumed or leaking)",
      "Engine oil leak — sump, seals or lines",
      "Failed or worn oil pump",
      "Clogged oil filter or pick-up strainer",
      "Seriously worn engine bearings",
      "The wrong oil viscosity for the engine",
    ],
    costs: [
      { label: "Oil top-up (if just low)", range: "$10–$30" },
      { label: "Oil and filter change", range: "$50–$120" },
      { label: "Leak repair", range: "$150–$600" },
      { label: "Oil pump replacement", range: "$500–$1,200" },
      { label: "Engine repairs (worst case)", range: "$1,500–$5,000+" },
    ],
    dos: [
      "Stop safely as soon as possible and switch the engine off.",
      "Wait for the engine to cool, then check the oil level on level ground.",
      "Top up with the correct oil if it's low — then check the light before driving on.",
      "If the level is fine or the light stays on, don't drive — arrange a tow.",
    ],
    donts: [
      "Don't drive on with the oil light on — even a short distance can wreck the engine.",
      "Don't ignore an oil light that flickers at idle.",
      "Don't open the oil cap while the engine is hot or running.",
    ],
    relatedDtc: [],
    relatedGuides: ["coolant-temperature-light", "check-engine-light", "battery-light"],
    faq: [
      {
        q: "Oil light flickers at idle but goes off when I accelerate — is that OK?",
        a: "No — a flickering oil light at idle means the pressure is borderline when the engine is at its lowest revs. It's a warning that the pump, level or bearings are marginal. Have the oil level and pressure checked soon.",
      },
      {
        q: "The oil level is fine but the light is still on.",
        a: "That points to the pump, a blocked pick-up or a failed sensor rather than lack of oil. Don't keep driving — arrange a tow so the car can be inspected without risking engine damage.",
      },
      {
        q: "Can I drive just a few miles with the oil light on?",
        a: "No — oil pressure loss can damage the engine in a very short time. Stop safely, switch off, and get a tow. A few miles of driving could turn a cheap fix into an engine replacement.",
      },
    ],
  },

  /* ------------------------------------------------ Coolant temperature */
  {
    slug: "coolant-temperature-light",
    name: "Coolant temperature light",
    shortName: "Coolant light",
    icon: Thermometer,
    colors: ["red", "blue"],
    urgency: "stop",
    urgencyLabel: "Stop now — overheating risk",
    title: "Coolant Temperature Light: Meaning, Causes & What to Do",
    description:
      "What does the red coolant temperature light mean? Learn the signs of overheating, the common causes (coolant level, thermostat, water pump), repair costs, and exactly what to do.",
    summary:
      "The red coolant temperature light (or a gauge in the red zone) means the engine is overheating. An overheated engine can warp, crack or seize within minutes. Stop safely, let it cool, and don't drive on until it's checked.",
    appearsAs:
      "A red thermometer icon in wavy lines, or a temperature gauge needle in the red zone. Many cars also show a blue coolant light when the engine is cold — that one is informational, not a warning.",
    meanings: [
      "The engine is running hotter than it should — overheating risk.",
      "Coolant level is too low to cool the engine properly.",
      "Coolant isn't circulating (pump, thermostat or blockage).",
      "A blue coolant light instead means the engine is still cold — normal on cold starts.",
    ],
    causes: [
      "Low coolant level (leak or neglected top-up)",
      "Coolant leak from a hose, radiator, water pump or head gasket",
      "Failed thermostat stuck closed",
      "Failed water pump or drive belt",
      "Blocked or clogged radiator",
      "Cooling fan fault — common in slow traffic",
    ],
    costs: [
      { label: "Coolant top-up", range: "$20–$60" },
      { label: "Hose / leak repair", range: "$100–$400" },
      { label: "Thermostat replacement", range: "$150–$400" },
      { label: "Water pump replacement", range: "$400–$900" },
      { label: "Radiator replacement", range: "$400–$900" },
    ],
    dos: [
      "Stop safely, switch the engine off and let it cool completely.",
      "Never open the radiator cap while the engine is hot — it can spray boiling coolant.",
      "Once cool, check the coolant level and top up if needed.",
      "If the light returns or the level keeps dropping, arrange a tow.",
    ],
    donts: [
      "Don't keep driving with the temperature light on.",
      "Don't pour cold water onto a hot engine block.",
      "Don't open the coolant cap until the system is fully cooled.",
    ],
    relatedDtc: ["P0128"],
    relatedGuides: ["oil-pressure-light", "check-engine-light"],
    faq: [
      {
        q: "My car shows a blue coolant light — is that a problem?",
        a: "No — a blue or green coolant light just means the engine is still cold and warming up. It's informational and usually goes off within a couple of minutes. Drive gently until it does.",
      },
      {
        q: "Can I drive with the temperature light on?",
        a: "No. Overheating can permanently damage the engine — a warped head or seized engine costs thousands. Stop safely, let the engine cool, and have it checked before driving on.",
      },
      {
        q: "Coolant is full but the car still overheats — why?",
        a: "If the level is fine, the problem is circulation or airflow: a stuck thermostat, failing water pump, blocked radiator or a cooling fan that isn't coming on. These need a workshop inspection, not just a top-up.",
      },
    ],
  },

  /* ------------------------------------------------ ABS */
  {
    slug: "abs-light",
    name: "ABS warning light",
    shortName: "ABS light",
    icon: Disc3,
    colors: ["amber"],
    urgency: "soon",
    urgencyLabel: "Book service",
    title: "ABS Light: Meaning, Causes & What to Do",
    description:
      "The amber ABS light means the anti-lock braking system has a fault. Learn the common causes (wheel speed sensors, ABS module, fluid), repair costs, and whether normal braking still works.",
    summary:
      "The ABS light means the anti-lock braking system has detected a fault and switched itself off. Normal braking usually still works, but the car won't prevent wheel lock-up in an emergency stop — so braking distances on slippery roads can increase. Have it diagnosed soon.",
    appearsAs:
      "An amber 'ABS' symbol — usually the letters inside a circle flanked by wheel-slip lines. On some cars it reads 'ANTILOCK'.",
    meanings: [
      "The ABS module has stored a fault code and disabled anti-lock braking.",
      "A wheel speed sensor isn't reporting correctly.",
      "ABS hydraulic or valve fault detected.",
      "With the brake light also on: a broader braking-system fault.",
    ],
    causes: [
      "Faulty or dirty wheel speed sensor",
      "Damaged sensor wiring or connector",
      "Failed ABS module or pump",
      "Low brake fluid",
      "Blown ABS fuse",
      "Corroded wheel bearing (sensor ring) damage",
    ],
    costs: [
      { label: "Wheel speed sensor", range: "$100–$300" },
      { label: "ABS wiring / connector repair", range: "$80–$200" },
      { label: "Brake fluid service", range: "$80–$150" },
      { label: "ABS module repair or replacement", range: "$500–$1,500" },
    ],
    dos: [
      "Confirm normal braking still works — test gently at low speed.",
      "Have the ABS codes read and the sensors inspected.",
      "Book the repair soon, especially before winter or wet weather.",
      "Mention the ABS light when booking so the workshop scans the chassis codes.",
    ],
    donts: [
      "Don't assume the car will brake normally in an emergency — leave more distance.",
      "Don't ignore the ABS light and brake light together.",
      "Don't clear the code and hope it stays off — the fault will return.",
    ],
    relatedDtc: ["C0035", "C0040", "C0045", "C0050", "C0121"],
    relatedGuides: ["brake-warning-light", "tire-pressure-light", "traction-control-light"],
    faq: [
      {
        q: "Is it safe to drive with the ABS light on?",
        a: "Generally yes, with care — normal braking still works, but you lose anti-lock function, so wheels can lock in a hard stop and you have no stability-control assist. Drive defensively and book the repair soon.",
      },
      {
        q: "ABS light and brake light on at the same time — what does it mean?",
        a: "That combination usually means a genuine braking-system fault such as low fluid or a failed module, not just a wheel sensor. Have it inspected promptly — this one is worth not driving on if braking feels off.",
      },
      {
        q: "ABS light came on after I changed a wheel / hit a pothole — what now?",
        a: "A wheel-speed sensor or its wiring is often disturbed by wheel work or an impact. Have the sensor inspected and the code read — it's frequently a quick fix.",
      },
    ],
  },

  /* ------------------------------------------------ Airbag */
  {
    slug: "airbag-light",
    name: "Airbag warning light",
    shortName: "Airbag light",
    icon: ShieldAlert,
    colors: ["amber"],
    urgency: "soon",
    urgencyLabel: "Book service",
    title: "Airbag Light: Meaning, Causes & What to Do",
    description:
      "The airbag (SRS) warning light means the restraint system has a fault and airbags may not deploy. Learn the causes (seat connectors, clock spring, low battery), repair costs and what to do.",
    summary:
      "The airbag light — usually labelled 'SRS' or 'AIRBAG' — means the supplemental restraint system has detected a fault. In a crash, the airbags may not deploy, or could deploy unexpectedly. It's not a stop-now emergency, but it should be checked by a specialist soon.",
    appearsAs:
      "An amber (sometimes red) icon of a seated figure with a circle in front, often with the letters 'SRS' or 'AIRBAG' underneath. On some cars the text 'RESTRAINT' appears.",
    meanings: [
      "The airbag control unit has stored a fault code.",
      "A system component (sensor, connector, clock spring) is failing.",
      "Battery voltage was too low during a recent start, tripping the system.",
      "A previous crash has deployed airbags that were never reset.",
    ],
    causes: [
      "Loose or corroded connector under the driver's or passenger's seat",
      "Failing clock spring in the steering wheel",
      "Low battery voltage or recent jump-start upsetting the SRS module",
      "Crash sensor or occupant-seat sensor fault",
      "Airbag control module failure",
      "Airbags deployed previously and system never repaired",
    ],
    costs: [
      { label: "SRS diagnostic scan", range: "$80–$150" },
      { label: "Seat connector repair", range: "$50–$150" },
      { label: "Clock spring", range: "$200–$500" },
      { label: "Crash sensor", range: "$150–$400" },
      { label: "SRS control module", range: "$300–$800" },
    ],
    dos: [
      "Book an inspection with a specialist who can read SRS codes.",
      "Mention anything that happened recently (impact, seat work, jump-start).",
      "Keep the seatbelts worn — they work independently of the airbag system.",
    ],
    donts: [
      "Don't ignore it for long — airbags may not deploy when you need them.",
      "Don't poke around under the dash or steering column yourself — airbag circuits can deploy the bag.",
      "Don't try to 'reset' the light by disconnecting the battery — the fault will return.",
    ],
    relatedDtc: ["B1320", "U0101"],
    relatedGuides: ["battery-light", "check-engine-light"],
    faq: [
      {
        q: "Is it safe to drive with the airbag light on?",
        a: "Driving itself is fine — the car won't fail — but the airbags may not deploy in a crash, or may deploy without warning. That's a serious safety compromise, so book the repair promptly and don't put it off.",
      },
      {
        q: "Airbag light came on after a jump-start — why?",
        a: "Low battery voltage during starting can confuse the SRS module and store a voltage-related fault. Have the codes read — after a few clean starts the fault may clear, but it should still be confirmed.",
      },
      {
        q: "Can I reset the airbag light myself?",
        a: "Not safely. Resetting a code without fixing the fault means the light comes back — and if the real fault is a failing sensor or module, you've masked a safety problem. A specialist scan is the right way.",
      },
    ],
  },

  /* ------------------------------------------------ Tire pressure */
  {
    slug: "tire-pressure-light",
    name: "Tire pressure light (TPMS)",
    shortName: "Tire pressure light",
    icon: CircleDotDashed,
    colors: ["amber"],
    urgency: "watch",
    urgencyLabel: "Check tires soon",
    title: "Tire Pressure Light (TPMS): Meaning, Causes & What to Do",
    description:
      "Why is the tire pressure (TPMS) light on? Learn what a solid vs flashing light means, the common causes (slow leaks, cold weather, sensors), and how to fix it yourself.",
    summary:
      "The tire pressure monitoring system (TPMS) light means one or more tires is significantly underinflated — or, when flashing, that the system itself has a fault. An underinflated tire handles worse, wears faster and can overheat on the motorway. Checking pressures is usually a five-minute fix.",
    appearsAs:
      "An amber horseshoe-shaped icon with an exclamation mark inside, sometimes with a '!' only. A flashing light (usually for about a minute) then staying on means a system fault; a steady light means a low-pressure warning.",
    meanings: [
      "One or more tires is at least ~25% below the recommended pressure.",
      "Outside temperature dropped sharply, lowering tire pressures.",
      "A tire has a slow leak or a puncture.",
      "Flashing light: a TPMS sensor or the system itself has failed.",
    ],
    causes: [
      "Normal air loss over time (tires lose ~1 psi per month)",
      "Sharp temperature drop in autumn/winter",
      "Slow leak from a nail, valve or bead",
      "Dead TPMS sensor battery (usually after ~5–10 years)",
      "Sensor damaged after a tire change",
    ],
    costs: [
      { label: "Air top-up (self-service)", range: "$0" },
      { label: "Puncture / plug repair", range: "$20–$50" },
      { label: "TPMS sensor (per wheel)", range: "$50–$150" },
      { label: "New tire", range: "$100–$300" },
    ],
    dos: [
      "Check all four pressures (cold) against the sticker on the driver's door frame.",
      "Inflate to the recommended pressure and see if the light clears after a short drive.",
      "If a tire keeps losing pressure, have it inspected for a puncture.",
      "Reset the TPMS via the dash button if the car requires it.",
    ],
    donts: [
      "Don't keep driving on a visibly low or flat tire.",
      "Don't ignore a flashing TPMS light — the system needs a sensor check.",
      "Don't inflate to the number printed on the tire sidewall — use the door sticker.",
    ],
    relatedDtc: [],
    relatedGuides: ["abs-light", "brake-warning-light"],
    faq: [
      {
        q: "TPMS light is flashing, then stays on — what's different?",
        a: "A flashing light is a system-fault warning: a sensor is dead or missing, or the module can't receive signals. A steady light is the normal low-pressure warning. A flashing light needs a sensor/system check; a steady one usually just needs air.",
      },
      {
        q: "Tire pressure light is on but the tires look fine.",
        a: "Underinflation isn't always visible — a tire can be 10 psi low and still look normal. Check with a gauge on cold tires, and remember a sharp temperature drop can trigger the light overnight even without a leak.",
      },
      {
        q: "Why does the tire pressure light come on in winter?",
        a: "Cold air is denser — tire pressure drops roughly 1 psi for every 10°F (6°C) of temperature drop. That's usually enough to trigger the light on a cold morning. Top the tires up to the door-sticker pressure and it will clear.",
      },
    ],
  },

  /* ------------------------------------------------ Power steering */
  {
    slug: "power-steering-light",
    name: "Power steering warning light",
    shortName: "Power steering light",
    icon: CircleGauge,
    colors: ["red", "amber"],
    urgency: "soon",
    urgencyLabel: "Act soon",
    title: "Power Steering Warning Light: Meaning, Causes & What to Do",
    description:
      "The power steering warning light means steering assist has a fault and steering may feel heavy. Learn the causes (fluid, pump, EPS motor), repair costs, and whether you can still drive.",
    summary:
      "The power steering warning light — a steering wheel icon, often with an exclamation mark — means the steering assist system has a fault. On many cars the assist cuts out entirely, leaving heavy, hard-to-turn steering. It's not a 'stop now' light, but it is a 'drive carefully to the workshop' light.",
    appearsAs:
      "A red or amber steering-wheel icon, sometimes with '!' inside, or the letters 'EPS' (electric power steering) / 'PS'. On hydraulic systems it may be a steering wheel with a drop of fluid.",
    meanings: [
      "Power steering assist has been disabled by the control module.",
      "Hydraulic systems: low power steering fluid or failed pump.",
      "Electric systems (EPS): motor, torque sensor or module fault.",
      "Steering may become very heavy, especially at low speed.",
    ],
    causes: [
      "Low power steering fluid (hydraulic systems)",
      "Failed power steering pump or belt",
      "Failed EPS motor or torque sensor",
      "EPS control module fault or wiring",
      "Power steering line leak",
      "Fuse blown for the EPS system",
    ],
    costs: [
      { label: "Fluid top-up / flush", range: "$15–$100" },
      { label: "Steering line repair", range: "$150–$400" },
      { label: "Power steering pump", range: "$300–$700" },
      { label: "EPS motor / sensor", range: "$400–$1,000" },
      { label: "EPS control module", range: "$400–$1,200" },
    ],
    dos: [
      "If steering suddenly feels heavy, slow down and stop somewhere safe.",
      "Check the power steering fluid level (hydraulic systems) once cool.",
      "Drive carefully and directly to a workshop — low-speed maneuvering will be hardest.",
      "Have the steering system scanned for codes.",
    ],
    donts: [
      "Don't drive long distances with heavy steering — it's tiring and harder to control in an emergency.",
      "Don't ignore a red steering light, especially with other warning lights.",
      "Don't keep topping up fluid without finding the leak.",
    ],
    relatedDtc: [],
    relatedGuides: ["brake-warning-light", "abs-light", "traction-control-light"],
    faq: [
      {
        q: "Power steering light is on but the steering still works — why?",
        a: "Some faults only cut assist part-time, or the light can come on at a specific angle or speed. If steering still feels normal, the fault may be intermittent — but the warning is recorded, so have it scanned and diagnosed soon.",
      },
      {
        q: "What does EPS stand for on my dashboard?",
        a: "EPS is electric power steering — the assist comes from an electric motor rather than a hydraulic pump. EPS faults are usually electrical: motor, torque sensor, wiring or the module itself.",
      },
      {
        q: "Is it safe to drive with the power steering light on?",
        a: "You can drive, but steering will be heavy — worst at parking speeds — and a sudden loss of assist mid-corner is dangerous. Drive slowly and directly to a workshop rather than continuing a planned journey.",
      },
    ],
  },

  /* ------------------------------------------------ Traction control */
  {
    slug: "traction-control-light",
    name: "Traction control light",
    shortName: "Traction control light",
    icon: Waves,
    colors: ["amber"],
    urgency: "watch",
    urgencyLabel: "Check when convenient",
    title: "Traction Control Light: Meaning, Causes & What to Do",
    description:
      "Traction control (TCS/ESC) light on? Learn the difference between a flashing light (system working) and a steady light (system off or fault), common causes, and what to do.",
    summary:
      "The traction control light can mean two very different things. Flashing while you drive means the system is actively preventing wheelspin — that's normal. A steady light usually means the system is switched off or has a fault, so you lose the electronic stability net.",
    appearsAs:
      "An amber car icon with skid marks (S-curves) behind the wheels, sometimes with the letters 'TCS', 'ESC' or 'ESP'. It may flash briefly when the system intervenes.",
    meanings: [
      "Flashing: the system is actively reducing wheelspin on a slippery surface.",
      "Steady on: the system is switched off (button) or disabled by a fault.",
      "Steady on with the ABS light: usually a fault in the wheel-speed sensor network.",
      "May illuminate in snow, rain, gravel or heavy acceleration.",
    ],
    causes: [
      "Traction control switched off with the dash button",
      "Faulty wheel speed sensor",
      "Steering angle sensor out of calibration",
      "Low tire pressure affecting wheel-speed readings",
      "Brake or ABS system fault",
      "After winter wheels/tires with mismatched sizes",
    ],
    costs: [
      { label: "Tire pressure check / top-up", range: "$0–$20" },
      { label: "Wheel speed sensor", range: "$100–$300" },
      { label: "Steering angle sensor calibration", range: "$80–$200" },
      { label: "Wheel alignment", range: "$80–$150" },
      { label: "ESC module repair", range: "$300–$900" },
    ],
    dos: [
      "Check whether a dash button has switched traction control off.",
      "Check tire pressures and evenness across the axle.",
      "If the light is steady with the ABS light, scan the chassis codes.",
      "Have sensors inspected after any recent wheel, alignment or suspension work.",
    ],
    donts: [
      "Don't ignore a steady light that stays on with the ABS/brake lights.",
      "Don't assume the system is 'just being helpful' when the light is steady.",
      "Don't fit mismatched tire sizes across an axle — it confuses the sensors.",
    ],
    relatedDtc: ["C0040", "C0050", "C0035"],
    relatedGuides: ["abs-light", "tire-pressure-light", "brake-warning-light"],
    faq: [
      {
        q: "Traction control light flashes while I drive — is something wrong?",
        a: "No — a flashing traction control light is the system doing its job, briefly cutting power to stop wheelspin on snow, rain or gravel. It's only a concern if it flashes constantly in normal dry conditions, which suggests tires or alignment need attention.",
      },
      {
        q: "What's the difference between a flashing and a steady traction light?",
        a: "Flashing = the system is actively intervening to stop wheelspin. Steady = the system is switched off or has a fault. If a steady light stays on alongside the ABS light, get the codes read.",
      },
      {
        q: "Traction control light came on in the snow and won't go off.",
        a: "Cold weather, snow and low tire pressure all reduce grip and can trip the warning. Check the button isn't switched off, top up the tires, and if the light stays on once conditions improve, have the wheel-speed sensors checked.",
      },
    ],
  },
];

export function listGuideSlugs(): string[] {
  return WARNING_LIGHT_GUIDES.map((guide) => guide.slug);
}

export function getGuide(slug: string): WarningLightGuide | undefined {
  return WARNING_LIGHT_GUIDES.find((guide) => guide.slug === slug);
}

/** Resolve related guides to full entries, skipping any that don't exist. */
export function relatedGuidesFor(slug: string): WarningLightGuide[] {
  const guide = getGuide(slug);
  if (!guide) return [];
  return guide.relatedGuides
    .map((relatedSlug) => getGuide(relatedSlug))
    .filter((entry): entry is WarningLightGuide => Boolean(entry));
}

/** Hub groups keyed by urgency, in display order. */
export const GUIDE_URGENCY_GROUPS: Array<{
  urgency: GuideUrgency;
  title: string;
  blurb: string;
  chip: string;
}> = [
  {
    urgency: "stop",
    title: "Red lights — act now",
    blurb:
      "Safety-critical. These mean stop safely soon, switch off and get professional help before driving on.",
    chip: "bg-red-500/15 text-red-600 ring-red-500/40 dark:text-red-400",
  },
  {
    urgency: "soon",
    title: "Red & amber — act soon",
    blurb:
      "Serious enough to act on without delay: a short drive to the workshop is usually fine, a long trip isn't.",
    chip: "bg-amber-500/15 text-amber-600 ring-amber-500/40 dark:text-amber-400",
  },
  {
    urgency: "watch",
    title: "Amber — check when convenient",
    blurb:
      "Usually driveable, but worth understanding and checking soon — several of these hint at tire or brake issues.",
    chip: "bg-sky-500/15 text-sky-600 ring-sky-500/40 dark:text-sky-400",
  },
];

/** Color dot styling for guide cards. */
export const LIGHT_COLOR_DOT: Record<LightColor, string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  blue: "bg-sky-500",
};

export const HUB_FAQ = [
  {
    question: "What do the warning light colours mean?",
    answer:
      "As a general rule: red lights mean stop or act immediately — brake, oil pressure and coolant temperature warnings are in this group. Amber/yellow lights mean something needs attention soon, like the check engine, ABS or tire pressure light. Blue or green lights are informational, like high-beam or cold-engine indicators.",
  },
  {
    question: "Why does the same light look different on my car?",
    answer:
      "Manufacturers use their own icon sets, so the brake warning might be a '(!)', the word 'BRAKE', or a red 'P'. If you're unsure what a symbol means, check the owner's manual — and when in doubt about a red light, treat it as safety-critical.",
  },
  {
    question: "Is a warning light a diagnosis?",
    answer:
      "No — a warning light points at a system, not a single part. For example, the check engine light can be set by dozens of different faults. These guides explain what each light usually means; describing your exact symptoms to Garage Ghost gives a safety-first reading, and a workshop confirms the fix.",
  },
  {
    question: "Which lights mean I must stop immediately?",
    answer:
      "Treat these as stop-now: the brake warning light, oil pressure light, and coolant temperature (overheating) light. Combined with smoke, a fuel smell, loss of braking or steering, or a burning electrical smell — stop safely and call for help regardless of which light is showing.",
  },
];
