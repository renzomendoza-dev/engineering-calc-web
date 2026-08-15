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
];
