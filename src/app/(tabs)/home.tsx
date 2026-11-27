import { useCallback, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Lightbulb, Sparkles, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ensureSession, supabase } from "@/client/supabase";
import { StepCard } from "@/components/StepCard";
import { SubjectPicker } from "@/components/SubjectPicker";
import { getApiKey } from "@/lib/apiKey";
import { readFunctionError } from "@/lib/functionError";
import { prepareImage } from "@/lib/image";
import type { SubjectKey } from "@/lib/subjects";
import { uploadHomeworkImage } from "@/lib/upload";

const GENERIC_ERROR = "ครู AI ขัดข้องชั่วคราว ลองอีกครั้งนะ";

export default function TutorScreen() {
  const insets = useSafeAreaInsets();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [subject, setSubject] = useState<SubjectKey>("math");
  const [steps, setSteps] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const applyAsset = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    setError(null);
    setSteps([]);
    setHint("");
    try {
      const prepared = await prepareImage(asset);
      setImageUri(prepared.uri);
      setImageBase64(prepared.base64);
    } catch {
      setError("เตรียมรูปไม่สำเร็จ ลองเลือกใหม่อีกครั้งนะ");
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      await applyAsset(result.assets[0]);
    }
  }, [applyAsset]);

  const pickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      await applyAsset(result.assets[0]);
    }
  }, [applyAsset]);

  const reset = useCallback(() => {
    setImageUri(null);
    setImageBase64(null);
    setSteps([]);
    setHint("");
    setError(null);
  }, []);

  const explain = useCallback(async () => {
    if (!imageBase64 || !imageUri) {
      setError("กรุณาถ่ายรูปหรืออัปโหลดรูปการบ้านก่อนนะ");
      return;
    }

    setLoading(true);
    setError(null);
    setSteps([]);
    setHint("");

    try {
      const session = await ensureSession();
      const [imageUrl, apiKey] = await Promise.all([
        uploadHomeworkImage(imageUri, session.user.id),
        getApiKey(),
      ]);

      const { data, error: invokeError } = await supabase.functions.invoke("explainHomework", {
        body: { imageBase64, mimeType: "image/jpeg", subject, imageUrl, apiKey },
      });

      if (invokeError) {
        setError(await readFunctionError(invokeError, GENERIC_ERROR));
        return;
      }

      const result = data as { steps?: string[]; hint?: string; error?: string; code?: string } | null;
      if (result?.error) {
        if (result.code === "LOGIN_REQUIRED") { setError("ใช้ครบ 10 ครั้งสำหรับผู้ใช้ฟรีแล้ว เข้าสู่ระบบหรือสมัครสมาชิกเพื่อใช้ต่อ"); router.push("/account" as never); }
        else setError(result.error);
        return;
      }

      const nextSteps = Array.isArray(result?.steps) ? result.steps : [];
      if (nextSteps.length === 0) {
        setError(GENERIC_ERROR);
        return;
      }
      setSteps(nextSteps);
      setHint(result?.hint ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }, [imageBase64, imageUri, subject]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4 pb-10 gap-5" keyboardShouldPersistTaps="handled">
        <View style={{ height: insets.top + 12 }} />

        <View className="overflow-hidden rounded-[28px] border border-secondary bg-secondary p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm">
              <Text className="text-3xl">🌟</Text>
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-xl font-extrabold text-foreground">สวัสดีนักเรียนคนเก่ง! 👋</Text>
              <Text className="text-sm leading-5 text-muted-foreground">วันนี้มีการบ้านข้อไหน ให้ครูช่วยคิดด้วยกันนะ 💖</Text>
            </View>
          </View>
          <View className="mt-3 flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <Sparkles size={16} color="#FFFFFF" />
            </View>
            <Text className="text-sm font-bold text-foreground">ครูติว AI</Text>
            <Text className="flex-1 text-xs text-muted-foreground">ครูช่วยคิด ไม่เฉลย ✨</Text>
          </View>
        </View>

        {imageUri ? (
          <View className="gap-2">
            <View className="overflow-hidden rounded-2xl border border-border bg-card">
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: 240 }}
                contentFit="contain"
                transition={150}
              />
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={pickPhoto}
                style={{ elevation: 3, shadowColor: "#8B5369", shadowOpacity: 0.12, shadowRadius: 7, shadowOffset: { width: 0, height: 3 } }}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 active:opacity-70"
              >
                <ImagePlus size={16} color="#B83265" />
                <Text className="text-sm font-semibold text-foreground">เปลี่ยนรูป</Text>
              </Pressable>
              <Pressable
                onPress={reset}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 active:opacity-70"
              >
                <X size={16} color="#64748B" />
                <Text className="text-sm font-semibold text-muted-foreground">ลบ</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="items-center gap-3 rounded-[28px] border border-dashed border-[#EAC8D3] bg-card px-4 py-8 shadow-sm">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#FDE7EF]">
              <Camera size={26} color="#B83265" />
            </View>
            <Text className="text-center text-base font-semibold text-foreground">
              ถ่ายรูปการบ้านของหนู
            </Text>
            <Text className="text-center text-xs text-muted-foreground">
              รองรับ JPG / PNG · ย่อขนาดไม่เกิน 1024px ก่อนส่ง
            </Text>
            <View className="mt-1 w-full flex-row gap-2">
              <Pressable
                onPress={takePhoto}
                style={{ elevation: 4, shadowColor: "#B83265", shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4 active:opacity-80"
              >
                <Camera size={16} color="#FFFFFF" />
                <Text className="text-sm font-semibold text-primary-foreground">ถ่ายรูป</Text>
              </Pressable>
              <Pressable
                onPress={pickPhoto}
                style={{ elevation: 3, shadowColor: "#8B5369", shadowOpacity: 0.12, shadowRadius: 7, shadowOffset: { width: 0, height: 3 } }}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 active:opacity-70"
              >
                <ImagePlus size={16} color="#B83265" />
                <Text className="text-sm font-semibold text-foreground">เลือกรูป</Text>
              </Pressable>
            </View>
          </View>
        )}

        {permissionDenied ? (
          <Text className="text-sm text-destructive">
            ต้องอนุญาตให้แอปเข้าถึงกล้องและรูปภาพก่อนนะ ไปเปิดได้ที่ ตั้งค่า → แอป → ครูติว AI
          </Text>
        ) : null}

        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">เลือกวิชา</Text>
          <SubjectPicker value={subject} onChange={setSubject} />
        </View>

        <Pressable
          onPress={explain}
          disabled={loading}
          style={{ elevation: 5, shadowColor: "#B83265", shadowOpacity: 0.26, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }}
          className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 active:opacity-80 ${
            loading ? "bg-primary/60" : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Sparkles size={18} color="#FFFFFF" />
          )}
          <Text className="text-base font-bold text-primary-foreground">
            {loading ? "ครู AI กำลังดูการบ้าน..." : "ให้ครู AI อธิบาย"}
          </Text>
        </Pressable>

        {error ? (
          <View className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View className="gap-3">
            {[0, 1, 2].map((item) => (
              <View key={item} className="h-20 rounded-2xl bg-muted" />
            ))}
          </View>
        ) : null}

        {!loading && steps.length > 0 ? (
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">ลองคิดตามทีละขั้นนะ</Text>
            {steps.map((step, index) => (
              <StepCard key={`${index}-${step.slice(0, 10)}`} index={index} text={step} />
            ))}
            {hint ? (
              <View className="flex-row gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
                <Lightbulb size={18} color="#D97706" />
                <Text className="flex-1 text-sm font-medium text-foreground">{hint}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
