/**
 * Static OBD-II Diagnostic Trouble Code (DTC) reference.
 *
 * Educational only — a stored code points at the *system* a fault was
 * recorded in, never at a certain diagnosis. Always pair a lookup with a
 * qualified workshop scan when in doubt.
 */

export type DtcUrgency = "low" | "medium" | "high";

export interface DtcEntry {
  code: string;
  system: string;
  description: string;
  possibleCauses: string[];
  advice: string;
  urgency: DtcUrgency;
}

const DTC_DB: DtcEntry[] = [
  // ---- Powertrain: fuel & air ----
  {
    code: "P0101",
    system: "Engine — fuel & air",
    description: "Mass airflow (MAF) sensor circuit range/performance problem.",
    possibleCauses: [
      "Dirty or contaminated MAF sensor",
      "Clogged air filter",
      "Unmetered air entering the intake (vacuum leak)",
      "Faulty MAF sensor or wiring",
    ],
    advice: "A car with this code usually still runs, but may idle roughly or lose power. Have the intake and MAF checked before replacing parts.",
    urgency: "medium",
  },
  {
    code: "P0102",
    system: "Engine — fuel & air",
    description: "Mass airflow (MAF) sensor circuit low input.",
    possibleCauses: [
      "Faulty MAF sensor",
      "Open or shorted MAF circuit",
      "Poor connection at the sensor connector",
      "Clogged air filter",
    ],
    advice: "Drive with care; fuel trim may run rich. Book an inspection and code read.",
    urgency: "medium",
  },
  {
    code: "P0128",
    system: "Engine — cooling",
    description: "Coolant thermostat is below the regulating temperature (engine runs too cold).",
    possibleCauses: [
      "Stuck-open thermostat",
      "Faulty coolant temperature sensor",
      "Low coolant level",
      "Coolant temperature sensor wiring",
    ],
    advice: "The engine may warm up slowly and use more fuel. Not an emergency, but have the cooling system inspected soon — driving constantly cold can hide other problems.",
    urgency: "low",
  },
  {
    code: "P0171",
    system: "Engine — fuel & air",
    description: "System too lean (bank 1) — the engine is receiving too much air or too little fuel.",
    possibleCauses: [
      "Vacuum or intake air leak",
      "Faulty MAF or oxygen sensor",
      "Weak fuel pressure or clogged injector",
      "Exhaust leak before the oxygen sensor",
    ],
    advice: "A lean-running engine can misfire and overheat catalysts. Book a service; avoid heavy loads until then.",
    urgency: "medium",
  },
  {
    code: "P0172",
    system: "Engine — fuel & air",
    description: "System too rich (bank 1) — the engine is receiving too much fuel or too little air.",
    possibleCauses: [
      "Faulty oxygen or MAF sensor",
      "Fuel pressure regulator or leaking injector",
      "Clogged air filter",
      "Stuck fuel injector",
    ],
    advice: "Rich running wastes fuel and can damage the catalytic converter. Schedule an inspection.",
    urgency: "medium",
  },
  {
    code: "P0174",
    system: "Engine — fuel & air",
    description: "System too lean (bank 2).",
    possibleCauses: [
      "Vacuum or intake air leak on bank 2",
      "Faulty MAF or oxygen sensor",
      "Weak fuel pressure",
      "Exhaust leak",
    ],
    advice: "Same family as P0171 — book a service and avoid sustained heavy load until checked.",
    urgency: "medium",
  },

  // ---- Powertrain: ignition & misfire ----
  {
    code: "P0300",
    system: "Engine — ignition / misfire",
    description: "Random or multiple-cylinder misfire detected.",
    possibleCauses: [
      "Worn spark plugs or ignition coils",
      "Vacuum leak or faulty fuel injector",
      "Low compression",
      "Faulty crankshaft position sensor",
    ],
    advice: "A random misfire can damage the catalytic converter if driven long. Avoid hard acceleration and book a scan.",
    urgency: "high",
  },
  {
    code: "P0301",
    system: "Engine — ignition / misfire",
    description: "Cylinder 1 misfire detected.",
    possibleCauses: [
      "Faulty spark plug, coil or lead for cylinder 1",
      "Injector problem on cylinder 1",
      "Low compression on cylinder 1",
      "Vacuum leak near cylinder 1",
    ],
    advice: "A single-cylinder misfire usually still lets you drive gently, but repeated misfiring can overheat the catalyst. Book a service soon.",
    urgency: "high",
  },
  {
    code: "P0302",
    system: "Engine — ignition / misfire",
    description: "Cylinder 2 misfire detected.",
    possibleCauses: [
      "Faulty spark plug, coil or lead for cylinder 2",
      "Injector problem on cylinder 2",
      "Low compression on cylinder 2",
      "Vacuum leak near cylinder 2",
    ],
    advice: "Drive gently and book a service — a persistent misfire risks catalyst damage.",
    urgency: "high",
  },
  {
    code: "P0303",
    system: "Engine — ignition / misfire",
    description: "Cylinder 3 misfire detected.",
    possibleCauses: [
      "Faulty spark plug, coil or lead for cylinder 3",
      "Injector problem on cylinder 3",
      "Low compression on cylinder 3",
    ],
    advice: "Drive gently and book a service — a persistent misfire risks catalyst damage.",
    urgency: "high",
  },
  {
    code: "P0304",
    system: "Engine — ignition / misfire",
    description: "Cylinder 4 misfire detected.",
    possibleCauses: [
      "Faulty spark plug, coil or lead for cylinder 4",
      "Injector problem on cylinder 4",
      "Low compression on cylinder 4",
    ],
    advice: "Drive gently and book a service — a persistent misfire risks catalyst damage.",
    urgency: "high",
  },
  {
    code: "P0325",
    system: "Engine — ignition",
    description: "Knock sensor 1 circuit malfunction.",
    possibleCauses: [
      "Faulty knock sensor",
      "Damaged knock sensor wiring or connector",
      "Engine management fault",
    ],
    advice: "The engine may lose performance and fuel economy as the ECU uses a conservative ignition map. Book an inspection.",
    urgency: "medium",
  },
  {
    code: "P0335",
    system: "Engine — management",
    description: "Crankshaft position sensor circuit malfunction.",
    possibleCauses: [
      "Faulty crankshaft position sensor",
      "Damaged wiring or connector",
      "Sensor gap or tone ring damage",
    ],
    advice: "The engine may crank without starting or stall. If it runs, drive straight to a workshop; if it will not start, you need assistance.",
    urgency: "high",
  },
  {
    code: "P0340",
    system: "Engine — management",
    description: "Camshaft position sensor circuit malfunction.",
    possibleCauses: [
      "Faulty camshaft position sensor",
      "Damaged wiring or connector",
      "Timing chain/belt wear or timing issue",
    ],
    advice: "Starting may be poor and performance reduced. Book a scan promptly — some vehicles switch to a limited mode.",
    urgency: "medium",
  },

  // ---- Powertrain: emissions ----
  {
    code: "P0401",
    system: "Emissions — EGR",
    description: "Exhaust gas recirculation (EGR) flow is insufficient.",
    possibleCauses: [
      "Carbon build-up blocking the EGR valve or passages",
      "Faulty EGR valve or position sensor",
      "Blocked EGR hose",
    ],
    advice: "Usually affects emissions and fuel economy rather than safety. Book a service when convenient.",
    urgency: "low",
  },
  {
    code: "P0420",
    system: "Emissions — catalyst",
    description: "Catalyst system efficiency below threshold (bank 1).",
    possibleCauses: [
      "Aged or failed catalytic converter",
      "Faulty oxygen sensor(s)",
      "Engine running rich or misfiring (damaged the catalyst)",
      "Exhaust leak",
    ],
    advice: "Your vehicle may still pass a visual check but fail an emissions test. Have the converter and sensors diagnosed.",
    urgency: "low",
  },
  {
    code: "P0430",
    system: "Emissions — catalyst",
    description: "Catalyst system efficiency below threshold (bank 2).",
    possibleCauses: [
      "Aged or failed catalytic converter",
      "Faulty oxygen sensor(s)",
      "Engine running rich or misfiring",
      "Exhaust leak",
    ],
    advice: "Same family as P0420 on the other cylinder bank — book a diagnosis.",
    urgency: "low",
  },
  {
    code: "P0442",
    system: "Emissions — EVAP",
    description: "Small evaporative emissions system leak detected.",
    possibleCauses: [
      "Loose or missing fuel cap",
      "Cracked EVAP hose",
      "Faulty purge or vent valve",
      "Small leak in a fuel system line",
    ],
    advice: "Check the fuel cap first (tighten until it clicks). If it persists, it is a service item — no immediate safety concern.",
    urgency: "low",
  },
  {
    code: "P0446",
    system: "Emissions — EVAP",
    description: "EVAP system vent control circuit malfunction.",
    possibleCauses: [
      "Faulty vent solenoid",
      "Blocked or pinched vent hose",
      "Wiring or connector fault",
    ],
    advice: "May cause a fuel smell in some cases. If you notice a fuel smell, treat it as a priority; otherwise book a service.",
    urgency: "low",
  },
  {
    code: "P0455",
    system: "Emissions — EVAP",
    description: "Large evaporative emissions system leak detected.",
    possibleCauses: [
      "Missing or loose fuel cap",
      "Damaged fuel filler neck or seal",
      "Broken EVAP hose",
      "Failed purge/vent valve",
    ],
    advice: "Confirm the fuel cap is tight. A large leak can let fuel vapour escape — book an inspection.",
    urgency: "low",
  },

  // ---- Powertrain: sensors, voltage, module ----
  {
    code: "P0500",
    system: "Engine — sensors",
    description: "Vehicle speed sensor circuit malfunction.",
    possibleCauses: [
      "Faulty wheel/speed sensor",
      "Damaged wiring",
      "Speedometer drive issue",
    ],
    advice: "Speedometer and some driver aids may stop working. Have it checked — cruise control and ABS may be affected.",
    urgency: "medium",
  },
  {
    code: "P0507",
    system: "Engine — idle",
    description: "Idle control system — engine speed higher than expected.",
    possibleCauses: [
      "Vacuum leak",
      "Faulty idle air control valve",
      "Throttle body carbon build-up",
      "PCV system issue",
    ],
    advice: "Usually harmless at idle but can affect gear changes and economy. Book a service.",
    urgency: "low",
  },
  {
    code: "P0562",
    system: "Electrical — charging",
    description: "System voltage low — the charging system is not keeping voltage up.",
    possibleCauses: [
      "Weak or failing battery",
      "Faulty alternator or voltage regulator",
      "Loose or corroded battery terminals",
      "High resistance in charging wiring",
    ],
    advice: "Electrical system voltage dropping can cause erratic behaviour and a stall. Check battery terminals, then have the charging system tested.",
    urgency: "high",
  },
  {
    code: "P0563",
    system: "Electrical — charging",
    description: "System voltage high — charging output above normal range.",
    possibleCauses: [
      "Faulty voltage regulator or alternator",
      "Battery connection fault",
      "Sensing wire issue",
    ],
    advice: "Over-voltage can damage bulbs and electronics. Book a workshop check soon.",
    urgency: "medium",
  },
  {
    code: "P0601",
    system: "Engine — control module",
    description: "Internal control module memory checksum error.",
    possibleCauses: [
      "Control module (ECU/PCM) internal fault",
      "Low battery voltage during programming",
      "Corrosion or poor module power/ground",
    ],
    advice: "This needs a workshop with scan tools — the engine control module itself is suspect. Book a professional diagnosis.",
    urgency: "medium",
  },
  {
    code: "P0606",
    system: "Engine — control module",
    description: "PCM processor fault.",
    possibleCauses: [
      "Faulty PCM/ECU",
      "Wiring or connector problem at the module",
      "Software corruption",
    ],
    advice: "Drivability can be erratic. Book a professional scan; the module may need programming or replacement.",
    urgency: "medium",
  },
  {
    code: "P0688",
    system: "Engine — power",
    description: "ECM/PCM power relay sense circuit open.",
    possibleCauses: [
      "Faulty main relay",
      "Blown fuse or wiring fault",
      "Relay socket corrosion",
    ],
    advice: "May cause no-start or sudden power loss. Have it checked promptly.",
    urgency: "medium",
  },

  // ---- Powertrain: transmission ----
  {
    code: "P0700",
    system: "Transmission",
    description: "Transmission control system malfunction (the transmission has requested the engine light).",
    possibleCauses: [
      "Internal transmission fault",
      "Faulty transmission sensors or solenoids",
      "Low or degraded transmission fluid",
    ],
    advice: "Shift quality and safety can be affected. If the transmission slips or shifts harshly, stop driving and call a workshop.",
    urgency: "high",
  },
  {
    code: "P0715",
    system: "Transmission",
    description: "Turbine/input speed sensor circuit malfunction.",
    possibleCauses: [
      "Faulty input speed sensor",
      "Wiring or connector fault",
      "Internal transmission wear",
    ],
    advice: "Gear changes may become harsh or default to a safe mode. Book a transmission inspection.",
    urgency: "medium",
  },
  {
    code: "P0741",
    system: "Transmission",
    description: "Torque converter clutch circuit performance/stuck off.",
    possibleCauses: [
      "Faulty torque converter clutch solenoid",
      "Worn torque converter",
      "Low transmission fluid",
      "Wiring fault",
    ],
    advice: "Fuel economy drops and the gearbox may run hotter. Book a transmission check.",
    urgency: "medium",
  },
  {
    code: "P0750",
    system: "Transmission",
    description: "Shift solenoid A malfunction.",
    possibleCauses: [
      "Faulty shift solenoid",
      "Wiring or connector fault",
      "Low transmission fluid",
    ],
    advice: "Shifting may be rough or limited to certain gears. Book a transmission diagnosis.",
    urgency: "medium",
  },
  {
    code: "P0841",
    system: "Transmission",
    description: "Transmission fluid pressure sensor/switch circuit range/performance.",
    possibleCauses: [
      "Faulty fluid pressure sensor",
      "Wiring fault",
      "Low or degraded transmission fluid",
    ],
    advice: "Transmission behaviour may change. Book an inspection with a fluid check.",
    urgency: "medium",
  },

  // ---- Chassis: ABS / brakes ----
  {
    code: "C0035",
    system: "Brakes — ABS",
    description: "Left front wheel speed sensor circuit malfunction.",
    possibleCauses: [
      "Faulty wheel speed sensor",
      "Damaged sensor wiring or connector",
      "Dirty/corroded sensor ring",
    ],
    advice: "ABS and stability control may be disabled (warning light on). Braking still works but without ABS — avoid harsh braking and book a check.",
    urgency: "high",
  },
  {
    code: "C0040",
    system: "Brakes — ABS",
    description: "Right front wheel speed sensor circuit malfunction.",
    possibleCauses: [
      "Faulty wheel speed sensor",
      "Damaged sensor wiring or connector",
      "Dirty/corroded sensor ring",
    ],
    advice: "ABS/stability control disabled — drive with extra care and book a check.",
    urgency: "high",
  },
  {
    code: "C0045",
    system: "Brakes — ABS",
    description: "Left rear wheel speed sensor circuit malfunction.",
    possibleCauses: [
      "Faulty wheel speed sensor",
      "Damaged sensor wiring or connector",
      "Dirty/corroded sensor ring",
    ],
    advice: "ABS/stability control disabled — drive with extra care and book a check.",
    urgency: "high",
  },
  {
    code: "C0050",
    system: "Brakes — ABS",
    description: "Right rear wheel speed sensor circuit malfunction.",
    possibleCauses: [
      "Faulty wheel speed sensor",
      "Damaged sensor wiring or connector",
      "Dirty/corroded sensor ring",
    ],
    advice: "ABS/stability control disabled — drive with extra care and book a check.",
    urgency: "high",
  },
  {
    code: "C0121",
    system: "Brakes — ABS",
    description: "ABS valve relay circuit malfunction.",
    possibleCauses: [
      "Faulty ABS relay",
      "Blown fuse or wiring fault",
      "Faulty ABS module",
    ],
    advice: "ABS system is likely disabled. Braking still works, but book a workshop check without delay.",
    urgency: "high",
  },

  // ---- Body ----
  {
    code: "B1320",
    system: "Body — battery",
    description: "Battery voltage low in the body control system.",
    possibleCauses: [
      "Weak or old battery",
      "Parasitic drain while parked",
      "Charging system fault",
    ],
    advice: "Indicates a low-power condition that can cause odd electrical behaviour. Have the battery and charging system tested.",
    urgency: "medium",
  },

  // ---- Network ----
  {
    code: "U0100",
    system: "Network",
    description: "Lost communication with the engine control module (ECM/PCM).",
    possibleCauses: [
      "Faulty wiring or connectors on the CAN bus",
      "Failed ECM/PCM",
      "Low battery voltage",
      "Aftermarket electronics interfering with the bus",
    ],
    advice: "This can accompany a no-start or loss of dash functions. Have the vehicle professionally scanned — do not guess at wiring.",
    urgency: "high",
  },
  {
    code: "U0101",
    system: "Network",
    description: "Lost communication with the transmission control module (TCM).",
    possibleCauses: [
      "CAN bus wiring or connector fault",
      "Failed TCM",
      "Low battery voltage",
    ],
    advice: "Shifting may be affected. Book a professional scan.",
    urgency: "high",
  },
  {
    code: "U0121",
    system: "Network",
    description: "Lost communication with the ABS control module.",
    possibleCauses: [
      "CAN bus wiring or connector fault",
      "Failed ABS module",
      "Low battery voltage",
    ],
    advice: "ABS and stability systems may be offline. Braking still works but book a check promptly.",
    urgency: "high",
  },
];

/** Normalize user input: uppercase, keep only alphanumerics (e.g. "p0 300" → "P0300"). */
export function normalizeDtcCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Look up a DTC by exact normalized code. Returns null when unknown. */
export function lookupDtc(input: string): DtcEntry | null {
  const code = normalizeDtcCode(input);
  if (code.length === 0) return null;
  return DTC_DB.find((entry) => entry.code === code) ?? null;
}

/** All known codes, for indexing/SEO or tests. */
export function listDtcCodes(): string[] {
  return DTC_DB.map((entry) => entry.code);
}

/** All known entries (data layer for the /obd-codes hub + sitemap). */
export function listDtcEntries(): DtcEntry[] {
  return DTC_DB;
}

/**
 * Codes genuinely related to the given one, for cross-linking. Prefers the
 * same system family (e.g. P0420 → P0430, P0300 → P0301–P0304); when that is
 * too small, widens to the same first-three-character family (e.g. P01xx).
 */
export function relatedDtcCodes(code: string): string[] {
  const entry = lookupDtc(code);
  if (!entry) return [];

  const candidates = listDtcEntries();
  const sameSystem = candidates
    .filter((item) => item.code !== code && item.system === entry.system)
    .map((item) => item.code);
  if (sameSystem.length >= 3) return sameSystem.slice(0, 4);

  // Tighter than a system match: same subsystem digit, e.g. P0300 → P0301–P0304.
  const sameSubsystem = candidates
    .filter((item) => item.code !== code && item.code.slice(0, 4) === entry.code.slice(0, 4))
    .map((item) => item.code);
  if (sameSubsystem.length > 0) return sameSubsystem.slice(0, 4);

  // Widest fallback: the three-character family (e.g. P01xx). Capped smaller
  // than before so cross-links stay visibly relevant.
  const prefix = entry.code.slice(0, 3);
  const widened = candidates
    .filter((item) => item.code !== code && (item.code.startsWith(prefix) || item.system === entry.system))
    .map((item) => item.code);
  return [...new Set(widened)].slice(0, 5);
}
