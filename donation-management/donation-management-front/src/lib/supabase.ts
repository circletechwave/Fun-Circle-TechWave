import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ダミーのURLを使用（開発用）
const validUrl = (supabaseUrl && supabaseUrl !== 'your_supabase_project_url') 
  ? supabaseUrl 
  : 'https://xyzcompany.supabase.co'

const validKey = (supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key')
  ? supabaseAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeGNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwNTIwNDAwMCwiZXhwIjoxOTIwNzgwMDAwfQ.DUMMY_KEY_FOR_DEVELOPMENT'

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
  console.warn('⚠️ Supabase環境変数が設定されていません。')
  console.warn('📝 .envファイルに実際のSupabaseプロジェクトのURLとキーを設定してください。')
  console.warn('🔗 https://supabase.com でプロジェクトを作成できます。')
}

export const supabase = createClient(validUrl, validKey, {
  auth: {
    autoRefreshToken: true,      // トークン自動更新を有効化
    persistSession: true,         // セッションをローカルストレージに保存
    detectSessionInUrl: true      // URLからセッション検出（OAuth用）
  }
})