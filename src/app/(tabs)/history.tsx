import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { NotebookPen } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HistoryCard } from "@/components/HistoryCard";
import { deleteHistoryItem, fetchHistory, type HistoryRow } from "@/db/api";
import { getDeviceId } from "@/lib/device";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchHistory(getDeviceId());
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดประวัติไม่สำเร็จ");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const onDelete = useCallback(
    async (id: string) => {
      setRows((prev) => prev.filter((row) => row.id !== id));
      try {
        await deleteHistoryItem(id);
      } catch {
        load();
      }
    },
    [load],
  );

  return (
    <View className="flex-1 bg-background">
      <View style={{ height: insets.top + 12 }} />

      <View className="gap-1 px-4 pb-4">
        <Text className="text-2xl font-bold text-foreground">ประวัติการถาม</Text>
        <Text className="text-sm text-muted-foreground">
          ย้อนดูคำอธิบายที่ครู AI เคยให้ไว้ได้เลย
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B83265" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-10 gap-3"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B83265" />
          }
          renderItem={({ item }) => <HistoryCard row={item} onDelete={onDelete} />}
          ListHeaderComponent={
            error ? (
              <View className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                <Text className="text-sm text-destructive">{error}</Text>
                <Pressable onPress={load} className="mt-2 self-start active:opacity-70">
                  <Text className="text-sm font-semibold text-primary">ลองอีกครั้ง</Text>
                </Pressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center gap-3 rounded-2xl border border-dashed border-input bg-card px-4 py-12">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <NotebookPen size={24} color="#B83265" />
              </View>
              <Text className="text-base font-semibold text-foreground">ยังไม่มีประวัติ</Text>
              <Text className="text-center text-xs text-muted-foreground">
                กลับไปที่หน้าติวการบ้าน แล้วให้ครู AI ช่วยดูการบ้านข้อแรกกันเลย
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
