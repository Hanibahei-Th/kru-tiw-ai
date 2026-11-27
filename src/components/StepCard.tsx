import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const STEP_COLORS = ["#EC6F9E", "#FFC53D", "#58B994", "#64AEE0", "#A78BDA"];

type Props = { index: number; text: string };

export function StepCard({ index, text }: Props) {
  const color = STEP_COLORS[index % STEP_COLORS.length];
  return (
    <Animated.View entering={FadeInDown.delay(index * 150).duration(320)}>
      <View className="flex-row gap-3 rounded-3xl border border-border bg-card p-4">
        <View style={{ backgroundColor: color }} className="h-7 w-7 items-center justify-center rounded-full">
          <Text className="text-xs font-bold text-white">{index + 1}</Text>
        </View>
        <Text className="flex-1 text-base leading-6 text-foreground">{text}</Text>
      </View>
    </Animated.View>
  );
}
