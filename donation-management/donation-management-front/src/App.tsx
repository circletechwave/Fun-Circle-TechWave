import { useState } from 'react'
import AuthComponent from './components/Auth'
import DonationSearch from './components/DonationSearch'
import DonationForm from './components/DonationForm'
import DonationDetail from './components/DonationDetail'
import { AuditLogDashboard } from './components/admin/AuditLogDashboard'
import { useAuth } from './hooks/useAuth'
import type { Donation } from './types/donation'
import { donationApi } from './services/donationApi'
import './App.css'

type ViewType = 'list' | 'create' | 'edit' | 'detail' | 'admin'

function App() {
  const { session, isAdmin, loading, signOut } = useAuth()
  const [currentView, setCurrentView] = useState<ViewType>('list')
  const [selectedDonation, setSelectedDonation] = useState<Donation | undefined>(undefined)
  const [selectedDonationId, setSelectedDonationId] = useState<string | undefined>(undefined)

  const handleAdd = () => {
    setSelectedDonation(undefined)
    setCurrentView('create')
  }

  const handleEdit = (donation: Donation) => {
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
      if (currentView === 'create') {
        await donationApi.createDonation(data)
      } else if (currentView === 'edit' && selectedDonation) {
        await donationApi.updateDonation(selectedDonation.id, data)
      }
      setCurrentView('list')
    } catch (error) {
      alert('保存に失敗しました')
    }
  }

  const handleDelete = async () => {
    if (selectedDonation) {
      try {
        await donationApi.deleteDonation(selectedDonation.id)
        setCurrentView('list')
      } catch (error) {
        alert('削除に失敗しました')
      }
    }
  }

  const handleAdminClick = () => {
    setCurrentView('admin')
  }

  const handleAdminBack = () => {
    setCurrentView('list')
  }

  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <p>読み込み中...</p>
        </div>
      </div>
    )
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
                {isAdmin && (
                  <button
                    onClick={handleAdminClick}
                    className="admin-btn"
                    style={{
                      marginLeft: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#6f42c1',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    管理ダッシュボード
                  </button>
                )}
                <button onClick={signOut} className="sign-out-btn">
                  ログアウト
                </button>
              </div>
            </div>
          </header>
          <main className="app-main">
            {currentView === 'admin' ? (
              <AuditLogDashboard onBack={handleAdminBack} />
            ) : currentView === 'list' ? (
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
