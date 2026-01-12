import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { QueryClientProvider } from '@tanstack/react-query'
import { supabase } from './lib/supabase'
import { queryClient } from './lib/queryClient'
import { useCreateDonation, useUpdateDonation, useDeleteDonation } from './hooks/useDonations'
import AuthComponent from './components/Auth'
import DonationSearch from './components/DonationSearch'
import DonationForm from './components/DonationForm'
import type { Donation } from './types/donation'
import './App.css'

import DonationDetail from './components/DonationDetail'

function AppContent() {
  const [session, setSession] = useState<Session | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'detail'>('list')
  const [selectedDonation, setSelectedDonation] = useState<Donation | undefined>(undefined)
  const [selectedDonationId, setSelectedDonationId] = useState<string | undefined>(undefined)

  // React Queryのミューテーションフック
  const createMutation = useCreateDonation()
  const updateMutation = useUpdateDonation()
  const deleteMutation = useDeleteDonation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAdd = () => {
    setSelectedDonation(undefined)
    setCurrentView('create')
  }

  const handleEdit = (donation: Donation) => {
    setSelectedDonation(donation)
    setCurrentView('edit')
  }

  const handleDetail = (donation: Donation) => {
    setSelectedDonationId(donation.id)
    setCurrentView('detail')
  }

  const handleCancel = () => {
    setSelectedDonation(undefined)
    setSelectedDonationId(undefined)
    setCurrentView('list')
  }

  const handleSubmit = async (data: Partial<Donation>) => {
    try {
      if (currentView === 'create') {
        await createMutation.mutateAsync(data)
      } else if (currentView === 'edit' && selectedDonation) {
        await updateMutation.mutateAsync({ id: selectedDonation.id, data })
      }
      setCurrentView('list')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存に失敗しました'
      alert(errorMessage)
    }
  }

  const handleDelete = async () => {
    if (selectedDonation) {
      try {
        await deleteMutation.mutateAsync(selectedDonation.id)
        setCurrentView('list')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '削除に失敗しました'
        alert(errorMessage)
      }
    }
  }

  return (
    <div className="App">
      {!session ? (
        <div className="auth-container">
          <h1>Donation Management System</h1>
          <AuthComponent />
        </div>
      ) : (
        <div className="dashboard">
          <header className="app-header">
            <div className="header-content">
              <h1>社内寄贈物管理システム</h1>
              <div className="user-info">
                <span>ログイン中: {session.user.email}</span>
                <button onClick={() => supabase.auth.signOut()} className="sign-out-btn">
                  ログアウト
                </button>
              </div>
            </div>
          </header>
          <main className="app-main">
            {currentView === 'list' ? (
              <DonationSearch
                onCreate={handleAdd}
                onDetail={handleDetail}
              />
            ) : currentView === 'detail' && selectedDonationId ? (
              <DonationDetail
                donationId={selectedDonationId}
                onBack={handleCancel}
                onEdit={(donation) => handleEdit(donation)}
              />
            ) : (
              <DonationForm
                mode={currentView as 'create' | 'edit'}
                initialData={selectedDonation}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onDelete={currentView === 'edit' ? handleDelete : undefined}
              />
            )}
          </main>
        </div>
      )}
    </div>
  )
}

/**
 * Appコンポーネント
 *
 * React QueryのQueryClientProviderでアプリケーション全体をラップし、
 * データフェッチングのキャッシュ管理を提供します。
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
