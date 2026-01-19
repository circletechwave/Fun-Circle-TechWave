import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import AuthComponent from './components/Auth'
import DonationSearch from './components/DonationSearch'
import DonationForm from './components/DonationForm'
import type { Donation } from './types/donation'
import { donationApi } from './services/donationApi'
import './App.css'

import DonationDetail from './components/DonationDetail'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'detail'>('list')
  const [selectedDonation, setSelectedDonation] = useState<Donation | undefined>(undefined)
  const [selectedDonationId, setSelectedDonationId] = useState<string | undefined>(undefined)

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
    // リレーションデータを除外してクリーンなオブジェクトのみを保持
    const cleanDonation: Donation = {
      ...donation,
      category: undefined,
      sub_category: undefined,
      location: undefined,
    }
    setSelectedDonation(cleanDonation)
    setSelectedDonationId(undefined)
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
      console.log('App.handleSubmit - received data:', data);
      console.log('App.handleSubmit - data keys:', Object.keys(data));

      if (currentView === 'create') {
        await donationApi.createDonation(data)
      } else if (currentView === 'edit' && selectedDonation) {
        console.log('App.handleSubmit - updating with ID:', selectedDonation.id);
        await donationApi.updateDonation(selectedDonation.id, data)
      }
      setCurrentView('list')
    } catch (error) {
      console.error('Failed to save donation:', error)
      alert('保存に失敗しました')
    }
  }

  const handleDelete = async () => {
    if (selectedDonation) {
      try {
        await donationApi.deleteDonation(selectedDonation.id)
        setCurrentView('list')
      } catch (error) {
        console.error('Failed to delete donation:', error)
        alert('削除に失敗しました')
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

export default App
