import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  PlugZap,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ensureSession, supabase } from "@/client/supabase";
import { getApiKey, maskApiKey, saveApiKey } from "@/lib/apiKey";
import { readFunctionError } from "@/lib/functionError";

const AI_STUDIO_URL = "https://aistudio.google.com/apikey";
const GENERIC_ERROR = "ทดสอบไม่สำเร็จ ลองอีกครั้งนะ";

type TestState = {
  status: "idle" | "loading" | "ok" | "error";
  message: string;
  detail?: string;
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const [savedKey, setSavedKey] = useState("");
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [test, setTest] = useState<TestState>({ status: "idle", message: "" });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getApiKey().then((key) => {
        if (active) setSavedKey(key);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const canSubmit = input.trim().length > 0 && !saving;

  const onSave = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setSaving(true);
    setNotice(null);
    setTest({ status: "idle", message: "" });
    try {
      await saveApiKey(trimmed);
      setSavedKey(trimmed);
      setInput("");
      setVisible(false);
      setNotice("บันทึกคีย์เรียบร้อยแล้ว");
    } catch {
      setNotice("บันทึกคีย์ไม่สำเร็จ ลองอีกครั้งนะ");
    } finally {
      setSaving(false);
    }
  }, [input]);

  const onClear = useCallback(async () => {
    setSaving(true);
    setNotice(null);
    setTest({ status: "idle", message: "" });
    try {
      await saveApiKey("");
      setSavedKey("");
      setInput("");
      setNotice("ลบคีย์ออกแล้ว ระบบจะใช้คีย์สำรองของแอปแทน");
    } catch {
      setNotice("ลบคีย์ไม่สำเร็จ ลองอีกครั้งนะ");
    } finally {
      setSaving(false);
    }
  }, []);

  const onTest = useCallback(async () => {
    const keyToTest = input.trim() || savedKey;
    if (!keyToTest) {
      setTest({ status: "error", message: "ยังไม่มีคีย์ให้ทดสอบ ใส่คีย์ก่อนนะ" });
      return;
    }

    setTest({ status: "loading", message: "" });
    try {
      await ensureSession();
      const { data, error } = await supabase.functions.invoke("explainHomework", {
        body: { action: "verify", apiKey: keyToTest },
      });

      if (error) {
        setTest({ status: "error", message: await readFunctionError(error, GENERIC_ERROR) });
        return;
      }

      const result = data as { ok?: boolean; error?: string; detail?: string } | null;
      if (result?.ok) {
        setTest({ status: "ok", message: "คีย์ใช้งานได้แล้ว" });
      } else {
        setTest({
          status: "error",
          message: result?.error || GENERIC_ERROR,
          detail: result?.detail,
        });
      }
    } catch {
      setTest({ status: "error", message: GENERIC_ERROR });
    }
  }, [input, savedKey]);

  const openAiStudio = useCallback(() => {
    Linking.openURL(AI_STUDIO_URL).catch(() => {
      setNotice("เปิดลิงก์ไม่ได้ ลองคัดลอกไปเปิดในเบราว์เซอร์เองนะ");
    });
  }, []);

  const openAccount = () => router.push("/account" as never);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4 pb-10 gap-4" keyboardShouldPersistTaps="handled">
        <View style={{ height: insets.top + 12 }} />

        <View className="gap-1">
          <Text className="text-2xl font-bold text-foreground">ตั้งค่า</Text>
          <Text className="text-sm text-muted-foreground">
            ใส่คีย์ของคุณเอง (ไม่บังคับ) — แอปใช้งานได้เลยแม้ไม่ใส่คีย์
          </Text>
        </View>

        <Pressable onPress={openAccount} className="gap-2 rounded-2xl border border-secondary bg-secondary p-4">
          <Text className="font-bold text-foreground">สมาชิกและโควตาการใช้งาน</Text>
          <Text className="text-xs leading-5 text-muted-foreground">ผู้ใช้ทั่วไปใช้ AI ได้ 10 ครั้ง/วัน สมาชิกใช้ได้ 50 ครั้ง/วัน</Text>
          <Text className="font-semibold text-primary">เข้าสู่ระบบ / สมัครสมาชิก</Text>
        </Pressable>

        <View className="gap-3 rounded-2xl bg-muted p-4">
          <View className="flex-row items-center gap-2">
            <KeyRound size={16} color="#B83265" />
            <Text className="text-[15px] font-medium text-foreground">Google Gemini</Text>
          </View>

          <Text className="text-xs text-muted-foreground">
            {savedKey ? maskApiKey(savedKey) : "ยังไม่ได้ใส่คีย์ — ใช้ AI ของแอปให้อยู่แล้ว"}
          </Text>

          <View className="flex-row items-center rounded-lg border border-border bg-background px-3">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={savedKey ? maskApiKey(savedKey) : "วาง API Key ที่นี่"}
              placeholderTextColor="#94A3B8"
              secureTextEntry={!visible}
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 py-3 text-sm text-foreground"
            />
            <Pressable onPress={() => setVisible((prev) => !prev)} className="p-1 active:opacity-60">
              {visible ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
            </Pressable>
          </View>

          <Pressable
            onPress={onSave}
            disabled={!canSubmit}
            className={`self-end rounded-lg px-5 py-2.5 active:opacity-80 ${
              canSubmit ? "bg-primary" : "bg-border"
            }`}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                className={`text-sm font-semibold ${
                  canSubmit ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                บันทึก
              </Text>
            )}
          </Pressable>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={onTest}
            disabled={test.status === "loading"}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 active:opacity-70"
          >
            {test.status === "loading" ? (
              <ActivityIndicator color="#B83265" size="small" />
            ) : (
              <PlugZap size={16} color="#B83265" />
            )}
            <Text className="text-sm font-semibold text-foreground">ทดสอบคีย์</Text>
          </Pressable>

          {savedKey ? (
            <Pressable
              onPress={onClear}
              disabled={saving}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 active:opacity-70"
            >
              <Trash2 size={16} color="#DC2626" />
              <Text className="text-sm font-semibold text-destructive">ลบคีย์</Text>
            </Pressable>
          ) : null}
        </View>

        {test.status === "ok" ? (
          <View className="flex-row items-center gap-2 rounded-xl bg-secondary p-3">
            <CheckCircle2 size={16} color="#16A34A" />
            <Text className="flex-1 text-xs font-medium text-foreground">{test.message}</Text>
          </View>
        ) : null}

        {test.status === "error" ? (
          <View className="gap-1 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
            <View className="flex-row items-center gap-2">
              <XCircle size={16} color="#DC2626" />
              <Text className="flex-1 text-xs font-medium text-destructive">{test.message}</Text>
            </View>
            {test.detail ? (
              <Text className="text-[11px] leading-4 text-muted-foreground">{test.detail}</Text>
            ) : null}
          </View>
        ) : null}

        {notice ? <Text className="text-xs text-muted-foreground">{notice}</Text> : null}

        <View className="gap-2 rounded-[28px] border border-secondary bg-secondary p-4">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={17} color="#B83265" />
            <Text className="text-sm font-semibold text-foreground">คีย์ส่วนตัวมีไว้ทำอะไร?</Text>
          </View>
          <Text className="text-xs leading-5 text-muted-foreground">
            ถ้าใส่คีย์ของคุณเอง ระบบจะใช้โควตาของคุณแทนโควตาของแอป
            คีย์ถูกเก็บไว้ในเครื่องนี้เท่านั้น ไม่ถูกบันทึกลงฐานข้อมูล และไม่แสดงแบบเต็มหลังบันทึก
          </Text>
          <Pressable
            onPress={openAiStudio}
            className="mt-1 flex-row items-center gap-2 self-start active:opacity-70"
          >
            <ExternalLink size={14} color="#B83265" />
            <Text className="text-sm font-semibold text-primary">ไปรับคีย์ที่ Google AI Studio</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
