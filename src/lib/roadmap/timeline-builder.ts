import type { RoadmapActionType, RoadmapPriority, TimelineUrgency, TimingBucket } from "./types.ts";

function numeric(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function determineTimelineUrgency(input: {
  gradeAtTransfer?: unknown;
  expectedGraduationYear?: unknown;
}): TimelineUrgency {
  const grade = numeric(input.gradeAtTransfer);
  const year = numeric(input.expectedGraduationYear);
  if (!year) return "unknown";
  if ((grade ?? 0) >= 12) return "urgent";
  if ((grade ?? 0) === 11) return "high";
  if ((grade ?? 0) === 10) return "medium";
  if ((grade ?? 0) === 9) return "low";
  const yearsLeft = year - new Date().getFullYear();
  if (yearsLeft <= 0) return "urgent";
  if (yearsLeft === 1) return "high";
  if (yearsLeft === 2) return "medium";
  return "low";
}

export function planningHorizon(input: {
  gradeAtTransfer?: unknown;
  expectedGraduationYear?: unknown;
}) {
  const grade = numeric(input.gradeAtTransfer);
  const year = numeric(input.expectedGraduationYear);
  if (grade && year) return `Grade ${grade} transfer through Class of ${year}`;
  if (grade) return `Grade ${grade} transfer planning`;
  if (year) return `Planning toward Class of ${year}`;
  return "Timeline needs expected graduation year";
}

export function suggestedTiming(input: {
  urgency: TimelineUrgency;
  priority: RoadmapPriority;
  actionType: RoadmapActionType;
}): TimingBucket {
  if (input.actionType === "counselor_question") return "counselor_meeting";
  if (input.actionType === "assessment_requirement") {
    return input.urgency === "urgent" ? "immediately" : "before_course_registration";
  }
  if (
    input.actionType === "summer_option" ||
    input.actionType === "online_option" ||
    input.actionType === "credit_recovery_option"
  ) {
    return "summer";
  }
  if (input.priority === "critical") {
    return input.urgency === "urgent" ? "immediately" : "before_course_registration";
  }
  if (input.priority === "high") {
    return input.urgency === "urgent" ? "before_graduation" : "before_course_registration";
  }
  if (input.urgency === "urgent") return "senior_year";
  if (input.urgency === "high") return "next_semester";
  if (input.urgency === "medium") return "next_semester";
  if (input.urgency === "low") return "ongoing";
  return "unknown";
}

export function dueWindowLabel(input: { timingBucket: TimingBucket; urgency: TimelineUrgency }) {
  if (input.timingBucket === "immediately") return "As soon as possible";
  if (input.timingBucket === "counselor_meeting") return "Next counselor meeting";
  if (input.timingBucket === "before_course_registration") return "Before course registration";
  if (input.timingBucket === "next_semester") return "Next semester planning";
  if (input.timingBucket === "summer") return "Ask before summer planning";
  if (input.timingBucket === "before_graduation") return "Before graduation deadlines";
  if (input.timingBucket === "ongoing") return "Ongoing planning";
  if (input.urgency === "unknown") return "Add graduation year to set timing";
  return "Planning window needs counselor confirmation";
}

export function timelineSummary(input: {
  urgency: TimelineUrgency;
  gradeAtTransfer?: unknown;
  expectedGraduationYear?: unknown;
}) {
  const year = numeric(input.expectedGraduationYear);
  const grade = numeric(input.gradeAtTransfer);
  if (input.urgency === "urgent") {
    return "This roadmap should be reviewed quickly because the selected timeline is close to graduation.";
  }
  if (input.urgency === "high") {
    return "This roadmap prioritizes counselor review before the next course-registration cycle.";
  }
  if (input.urgency === "medium") {
    return "This roadmap spreads planning across upcoming terms while keeping review items visible.";
  }
  if (input.urgency === "low") {
    return "This roadmap focuses on confirming transfer credits and course placement early.";
  }
  if (!year && grade)
    return "Add an expected graduation year so Scholaport can rank timing more precisely.";
  return "Timeline urgency is unknown until the profile has grade and graduation-year details.";
}
