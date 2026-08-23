import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { authLogger } from '../services/authLogger'

interface ResetPasswordProps {
  // 新しいパスワードの設定が完了した際に呼び出す（呼び出し元でリカバリー状態を解除する）
  onComplete: () => void
}

/**
 * パスワード再設定用フォーム
 * メールのリセットリンクからアクセスすると、Supabaseが一時セッションを確立した状態で
 * このコンポーネントが表示される（App.tsx側でPASSWORD_RECOVERYイベントを検知して切り替え）
 */
export default function ResetPassword({ onComplete }: ResetPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // パスワードのバリデーション検証（サインアップ時と同じ規則。英数字と大文字1文字以上、8文字以上。記号も許可）
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W_]{8,}$/;
      if (!passwordRegex.test(password)) {
        throw new Error('パスワードは8文字以上で、英数字と大文字を少なくとも1つ含める必要があります');
      }
      if (password !== confirmPassword) {
        throw new Error('パスワードが一致しません');
      }

      const { data, error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setMessage('パスワードを再設定しました。')
      // 監査ログに記録（非同期、エラーは無視）
      authLogger.logPasswordResetComplete(data.user?.email ?? null).catch(() => {
        // エラーは無視
      })
      onComplete()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'パスワードの再設定に失敗しました'
      setMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '630px', margin: '0 auto', padding: '40px' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="new-password" style={{ display: 'block', marginBottom: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
            新しいパスワード
          </label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.2rem',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'white' }}>
            ※ 8文字以上（大文字・小文字・数字を含む）で入力してください。記号も使用可能です。
          </p>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label htmlFor="confirm-password" style={{ display: 'block', marginBottom: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
            新しいパスワード（確認）
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.2rem',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
          />
        </div>

        {message && (
          <div style={{
            padding: '16px',
            marginBottom: '24px',
            fontSize: '1.1rem',
            backgroundColor: message.includes('再設定しました') ? '#d4edda' : '#f8d7da',
            color: message.includes('再設定しました') ? '#155724' : '#721c24',
            borderRadius: '8px'
          }}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '処理中...' : 'パスワードを再設定する'}
        </button>
      </form>
    </div>
  )
}
