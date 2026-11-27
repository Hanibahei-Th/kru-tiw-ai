import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput } from 'react-native'
import { supabase, ensureSession } from '@/client/supabase'

export default function AccountScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (user && !user.is_anonymous) { setSignedInEmail(user.email ?? null); setMode('login') }
    })
  }, [])
  const submit = async () => {
    setBusy(true); setNotice('')
    try {
      const session = await ensureSession()
      const current = await supabase.auth.getUser()
      if (mode === 'signup' && current.data.user?.is_anonymous) {
        const { error } = await supabase.auth.updateUser({ email: email.trim(), password })
        if (error) throw error
        setNotice('ส่งลิงก์ยืนยันอีเมลแล้ว กรุณากดยืนยันจากกล่องจดหมาย บัญชีและประวัติเดิมจะยังอยู่')
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw error
        setNotice('สมัครแล้ว กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        router.replace('/home')
      }
      void session
    } catch (e) { setNotice(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ') }
    finally { setBusy(false) }
  }
  const signOut = async () => {
    setBusy(true)
    try { await supabase.auth.signOut(); await ensureSession(); setSignedInEmail(null); setMode('signup'); setNotice('ออกจากระบบแล้ว') }
    catch (e) { setNotice(e instanceof Error ? e.message : 'ออกจากระบบไม่สำเร็จ') }
    finally { setBusy(false) }
  }
  return <ScrollView className="flex-1 bg-background" contentContainerClassName="flex-grow justify-center gap-4 p-6">
    <Text className="text-2xl font-bold text-foreground">{signedInEmail ? 'บัญชีสมาชิก' : mode === 'signup' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</Text>
    {signedInEmail ? <><Text className="text-sm text-muted-foreground">เข้าสู่ระบบด้วย {signedInEmail}</Text><Pressable onPress={signOut} className="items-center rounded-xl border border-border py-3"><Text className="font-semibold text-foreground">ออกจากระบบ</Text></Pressable></> : null}
    {!signedInEmail ? <Text className="text-sm leading-6 text-muted-foreground">สมัครด้วยอีเมลเพื่อใช้ต่อหลังโควตาผู้ใช้ฟรี และเก็บประวัติการติวไว้กับบัญชี</Text> : null}
    {!signedInEmail ? <><TextInput value={email} onChangeText={setEmail} placeholder="อีเมล" keyboardType="email-address" autoCapitalize="none" className="rounded-xl border border-border bg-card px-4 py-3 text-foreground" />
    <TextInput value={password} onChangeText={setPassword} placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" secureTextEntry className="rounded-xl border border-border bg-card px-4 py-3 text-foreground" />
    <Pressable onPress={submit} disabled={busy || !email || password.length < 8} className="items-center rounded-xl bg-primary py-4">
      {busy ? <ActivityIndicator color="white" /> : <Text className="font-bold text-primary-foreground">{mode === 'signup' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</Text>}
    </Pressable>
    <Pressable onPress={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setNotice('') }}><Text className="text-center text-primary">{mode === 'signup' ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}</Text></Pressable></> : null}
    {notice ? <Text className="text-sm text-muted-foreground">{notice}</Text> : null}
    <Pressable onPress={() => router.back()}><Text className="self-center text-primary">กลับไปหน้าก่อน</Text></Pressable>
  </ScrollView>
}
