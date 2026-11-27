export type SubjectKey = "math" | "sci" | "eng";

export const SUBJECTS: { key: SubjectKey; label: string; emoji: string }[] = [
  { key: "math", label: "คณิตศาสตร์", emoji: "🔢" },
  { key: "sci", label: "วิทยาศาสตร์", emoji: "🔬" },
  { key: "eng", label: "ภาษาอังกฤษ", emoji: "🔤" },
];

export const SUBJECT_LABEL: Record<SubjectKey, string> = {
  math: "คณิตศาสตร์", sci: "วิทยาศาสตร์", eng: "ภาษาอังกฤษ",
};

export const SUBJECT_COLORS: Record<SubjectKey, { soft: string; solid: string; text: string }> = {
  math: { soft: "#FDE7EF", solid: "#C43B70", text: "#8B294E" },
  sci: { soft: "#DDF5E9", solid: "#248A68", text: "#176249" },
  eng: { soft: "#DFF2FF", solid: "#347CB4", text: "#245C89" },
};

export function isSubjectKey(value: string): value is SubjectKey {
  return value === "math" || value === "sci" || value === "eng";
}
