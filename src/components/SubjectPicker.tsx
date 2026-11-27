import { Pressable, Text, View } from "react-native";

import { SUBJECTS, SUBJECT_COLORS, type SubjectKey } from "@/lib/subjects";

type Props = { value: SubjectKey; onChange: (key: SubjectKey) => void };

export function SubjectPicker({ value, onChange }: Props) {
  return (
    <View className="flex-row gap-2">
      {SUBJECTS.map((subject) => {
        const active = subject.key === value;
        const colors = SUBJECT_COLORS[subject.key];
        return (
          <Pressable
            key={subject.key}
            onPress={() => onChange(subject.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{ backgroundColor: active ? colors.solid : colors.soft, borderColor: colors.solid }}
            className={`flex-1 items-center gap-1 rounded-2xl border px-2 py-3.5 active:opacity-80 ${active ? "" : "border-transparent"}`}
          >
            <Text className="text-lg">{subject.emoji}</Text>
            <Text numberOfLines={1} style={{ color: active ? "#FFFFFF" : colors.text }} className="text-xs font-bold">
              {subject.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
