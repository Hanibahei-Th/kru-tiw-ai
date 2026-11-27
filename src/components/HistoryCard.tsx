import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { ChevronDown, ImageOff, Lightbulb, Trash2 } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { historyThumbnail, toSteps, type HistoryRow } from "@/db/api";
import { isSubjectKey, SUBJECT_LABEL, SUBJECT_COLORS } from "@/lib/subjects";

type Props = {
  row: HistoryRow;
  onDelete: (id: string) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} · ${hours}:${minutes}`;
}

export function HistoryCard({ row, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const steps = toSteps(row.steps);
  const thumbnail = historyThumbnail(row.image_url);
  const subjectKey = isSubjectKey(row.subject) ? row.subject : null;
  const subjectLabel = subjectKey ? SUBJECT_LABEL[subjectKey] : row.subject;
  const subjectColors = subjectKey ? SUBJECT_COLORS[subjectKey] : { soft: "#FDE7EF", solid: "#C43B70", text: "#8B294E" };
  const stepColors = ["#EC6F9E", "#FFC53D", "#58B994", "#64AEE0", "#A78BDA"];

  return (
    <View className="overflow-hidden rounded-[28px] border border-border bg-card">
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        className="flex-row items-center gap-3 p-3 active:opacity-80"
      >
        <View className="h-16 w-16 overflow-hidden rounded-xl bg-muted">
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} className="h-16 w-16" contentFit="cover" transition={150} />
          ) : (
            <View className="h-16 w-16 items-center justify-center">
              <ImageOff size={20} color="#64748B" />
            </View>
          )}
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <View style={{ backgroundColor: subjectColors.soft }} className="rounded-full px-2.5 py-1">
              <Text style={{ color: subjectColors.text }} className="text-[11px] font-bold">{subjectLabel}</Text>
            </View>
            <Text className="text-[11px] text-muted-foreground">{formatDate(row.created_at)}</Text>
          </View>
          <Text numberOfLines={2} className="text-sm text-foreground">
            {steps[0] ?? "ไม่มีรายละเอียด"}
          </Text>
        </View>

        <ChevronDown
          size={18}
          color="#64748B"
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {expanded && (
        <Animated.View entering={FadeInDown.duration(220)} className="gap-2 border-t border-border px-3 pb-3 pt-3">
          {steps.map((step, index) => (
            <View key={`${row.id}-${index}`} className="flex-row gap-2">
              <View style={{ backgroundColor: stepColors[index % stepColors.length] }} className="h-6 w-6 items-center justify-center rounded-full">
                <Text className="text-[10px] font-bold text-white">{index + 1}</Text>
              </View>
              <Text className="flex-1 text-sm leading-5 text-foreground">{step}</Text>
            </View>
          ))}

          {row.hint ? (
            <View className="mt-1 flex-row gap-2 rounded-xl bg-accent/10 p-3">
              <Lightbulb size={16} color="#D97706" />
              <Text className="flex-1 text-xs font-medium text-foreground">{row.hint}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => onDelete(row.id)}
            className="mt-1 flex-row items-center justify-center gap-2 rounded-2xl border border-[#F3C8C0] bg-[#FFF0ED] py-2.5 active:opacity-70"
          >
            <Trash2 size={14} color="#D94F43" />
            <Text className="text-xs font-semibold" style={{ color: "#C23E34" }}>ลบรายการนี้</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
