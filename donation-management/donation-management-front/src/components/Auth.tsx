import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthComponent() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        // パスワードのバリデーション検証（英数字と大文字1文字以上、8文字以上）
        const passwordRegex = /^(?=.*[A-Z])[a-zA-Z0-9]{8,}$/;
        if (!passwordRegex.test(password)) {
          throw new Error('パスワードは8文字以上で、英数字と大文字を少なくとも1つ含める必要があります');
        }

        // ドメイン制約の検証 (環境変数で制御)
        if (import.meta.env.VITE_REQUIRE_HAPINS_DOMAIN === 'true') {
          if (!email.endsWith('@hapins.net')) {
            throw new Error('登録できるメールアドレスは @hapins.net ドメインのみです');
          }
        }

        // メタデータとして名前を保存
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        })
        if (error) throw error
        setIsVerifying(true)
        setMessage('認証コードを送信しました。メールを確認してコードを入力してください。')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました'
      setMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      })
      if (error) throw error
      setMessage('認証が完了しました。ログインしました。')
      // 認証後は自動的にセッションが確立されるため、特別なリダイレクト処理等は
      // 親コンポーネントのセッション監視で処理されることを想定
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '認証に失敗しました'
      setMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '630px', margin: '0 auto', padding: '40px' }}>
      {isVerifying ? (
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="otp" style={{ display: 'block', marginBottom: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
              認証コード (6桁)
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.2rem',
                border: '1px solid #ccc',
                borderRadius: '8px',
                letterSpacing: '0.2em',
                textAlign: 'center'
              }}
            />
          </div>

          {message && (
            <div style={{
              padding: '16px',
              marginBottom: '24px',
              fontSize: '1.1rem',
              backgroundColor: message.includes('完了') ? '#d4edda' : '#f8d7da',
              color: message.includes('完了') ? '#155724' : '#721c24',
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
              marginBottom: '24px'
            }}
          >
            {loading ? '認証する' : '認証完了'}
          </button>

          <button
            type="button"
            onClick={() => setIsVerifying(false)}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.1rem',
              backgroundColor: 'transparent',
              color: '#666',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            戻る
          </button>
        </form>
      ) : (
        <>
          <form onSubmit={handleAuth}>
            {isSignUp && (
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  氏名
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
            )}

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <div style={{ marginBottom: '32px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                パスワード
              </label>
              <input
                id="password"
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
            </div>

            {message && (
              <div style={{
                padding: '16px',
                marginBottom: '24px',
                fontSize: '1.1rem',
                backgroundColor: message.includes('確認') ? '#d4edda' : '#f8d7da',
                color: message.includes('確認') ? '#155724' : '#721c24',
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
                marginBottom: '24px'
              }}
            >
              {loading ? '処理中...' : (isSignUp ? 'サインアップ' : 'ログイン')}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.1rem',
              backgroundColor: 'transparent',
              color: '#4CAF50',
              border: '2px solid #4CAF50',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            {isSignUp ? 'すでにアカウントをお持ちの方' : '新規登録はこちら'}
          </button>
        </>
      )}
    </div>
  )
}