export type CalculatorStatus = "available" | "coming-soon";

export interface CalculatorConfig {
  name: string;
  description: string;
  category: string;
  href: string;
  status: CalculatorStatus;
}

export const calculators: CalculatorConfig[] = [
  {
    name: "Voltage Drop",
    description: "Calculate voltage drop across a conductor run for a given load and length.",
    category: "Electrical",
    href: "/electrical/voltage-drop",
    status: "available",
  },
  {
    name: "Wire Sizing",
    description: "Determine minimum conductor size for a load based on ampacity and derating.",
    category: "Electrical",
    href: "/electrical/wire-sizing",
    status: "available",
  },
  {
    name: "Conduit Fill",
    description: "Check conduit fill percentage against code-allowed fill for a set of conductors.",
    category: "Electrical",
    href: "/electrical/conduit-fill",
    status: "available",
  },
  {
    name: "Locked Rotor Current",
    description: "Estimate locked rotor current for a motor from nameplate horsepower and voltage.",
    category: "Electrical",
    href: "/electrical/locked-rotor",
    status: "available",
  },
  {
    name: "Motor FLC",
    description: "Look up full-load current for a motor by horsepower and voltage.",
    category: "Electrical",
    href: "/electrical/motor-flc",
    status: "available",
  },
  {
    name: "Pipe Velocity / Sizing",
    description: "Check flow velocity through a pipe, or size a pipe for a target velocity.",
    category: "Mechanical",
    href: "/mechanical/pipe-velocity",
    status: "available",
  },
  {
    name: "Pipe Pressure Loss",
    description: "Compute Darcy-Weisbach head and pressure loss for a pipe run.",
    category: "Mechanical",
    href: "/mechanical/pipe-pressure-loss",
    status: "available",
  },
  {
    name: "Duct Sizing",
    description: "Size round or rectangular ducts by equal-friction or velocity method.",
    category: "Mechanical",
    href: "/mechanical/duct/sizing",
    status: "available",
  },
  {
    name: "Fire Pump Sizing",
    description: "Demand, capacity resolution, curve validation, and driver power sizing for fire pumps.",
    category: "Mechanical",
    href: "/mechanical/firepump",
    status: "available",
  },
  {
    name: "Pump TDH",
    description: "Total Dynamic Head for a pump from static lift, suction/discharge piping, and residual pressure.",
    category: "Mechanical",
    href: "/mechanical/pump/tdh",
    status: "available",
  },
  {
    name: "Pump Power",
    description: "Hydraulic and shaft power, plus recommended motor size, from flow and TDH.",
    category: "Mechanical",
    href: "/mechanical/pump/power",
    status: "available",
  },
  {
    name: "Distance Attenuation",
    description: "Sound pressure level at a target distance from a reference SPL and distance (inverse-square law).",
    category: "Acoustics",
    href: "/acoustics/distance-attenuation",
    status: "available",
  },
  {
    name: "Fire Alarm Audibility",
    description: "Check notification appliance audibility against NFPA 72 public/private/sleeping-area thresholds.",
    category: "Acoustics",
    href: "/acoustics/fire-alarm-audibility",
    status: "available",
  },
  {
    name: "Smoke Production (Plume) Calculator",
    description: "Axisymmetric plume smoke production and volumetric flow rate per NFPA 92.",
    category: "Mechanical",
    href: "/smoke-control/plume",
    status: "available",
  },
  {
    name: "t-Squared Fire Growth Smoke Production Calculator",
    description: "Time-varying t-squared fire growth smoke production at a single evaluation time, per NFPA 92.",
    category: "Mechanical",
    href: "/smoke-control/plume-tsquared",
    status: "available",
  },
  {
    name: "Natural Smoke Vent Area Calculator",
    description: "Required natural smoke vent area from smoke volumetric flow rate and temperature, per NFPA 92/204.",
    category: "Mechanical",
    href: "/smoke-control/vent-area",
    status: "available",
  },
  {
    name: "Domestic Water Storage",
    description: "Required domestic water storage volume from occupant count or fixture units, plus storage duration.",
    category: "Mechanical",
    href: "/mechanical/storage/domestic",
    status: "available",
  },
  {
    name: "Fire Water Storage",
    description: "Required fire water storage volume from rated pump flow and NFPA 13 hazard classification duration.",
    category: "Mechanical",
    href: "/mechanical/storage/fire",
    status: "available",
  },
];
