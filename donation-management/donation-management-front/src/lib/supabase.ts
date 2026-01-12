import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 環境変数が未設定の場合はエラーをthrow
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '環境変数VITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYが設定されていません。\n' +
    '.env.localファイルに実際のSupabaseプロジェクトのURLとキーを設定してください。\n' +
    '詳細は https://supabase.com を参照してください。'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)