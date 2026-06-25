import { useEffect, useState } from "react";

export type ScholaportState = {
  onboardingComplete: boolean;
  transcriptUploaded: boolean;
  mappingReviewed: boolean;
  counselorMeetingBooked: boolean;
  completedRoadmapItems: string[];
  preferredLanguage: string;
};

const initialState: ScholaportState = {
  onboardingComplete: true,
  transcriptUploaded: true,
  mappingReviewed: false,
  counselorMeetingBooked: false,
  completedRoadmapItems: [],
  preferredLanguage: "English",
};

const STORAGE_KEY = "scholaport:mvp-state";

function readState(): ScholaportState {
  if (typeof window === "undefined") return initialState;
  try {
    return { ...initialState, ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return initialState;
  }
}

export function useScholaportState() {
  const [state, setState] = useState<ScholaportState>(readState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const update = (patch: Partial<ScholaportState>) =>
    setState((current) => ({ ...current, ...patch }));

  return { state, update };
}
