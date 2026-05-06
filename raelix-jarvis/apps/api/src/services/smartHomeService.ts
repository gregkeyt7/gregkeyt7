export interface SmartHomeAdapter {
  name: "alexa" | "google-home" | "home-assistant" | "matter";
  status: "ready-for-integration";
}

export const smartHomeAdapters: SmartHomeAdapter[] = [
  { name: "alexa", status: "ready-for-integration" },
  { name: "google-home", status: "ready-for-integration" },
  { name: "home-assistant", status: "ready-for-integration" },
  { name: "matter", status: "ready-for-integration" },
];

export const parseSmartHomeCommand = (input: string): { action: string; location: string; level?: number } => {
  const lower = input.toLowerCase();
  if (lower.includes("turn off all")) {
    return { action: "turn_off_all_lights", location: "all" };
  }

  if (lower.includes("dim")) {
    const levelMatch = lower.match(/(\d+)/);
    return {
      action: "dim_light",
      location: lower.includes("bedroom") ? "bedroom" : "living room",
      level: levelMatch ? Number(levelMatch[1]) : 40,
    };
  }

  return {
    action: "turn_on_light",
    location: lower.includes("living room") ? "living room" : "home",
  };
};
