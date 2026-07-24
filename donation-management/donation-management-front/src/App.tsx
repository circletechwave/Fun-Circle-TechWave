import { useState } from 'react'
import AuthComponent from './components/Auth'
import DonationSearch from './components/DonationSearch'
import DonationForm from './components/DonationForm'
import DonationDetail from './components/DonationDetail'
import { AuditLogDashboard } from './components/admin/AuditLogDashboard'
import { MasterDataManagement } from './components/admin/MasterDataManagement'
import { useAuth } from './hooks/useAuth'
import type { Donation } from './types/donation'
import { donationApi } from './services/donationApi'
import './App.css'

type ViewType = 'list' | 'create' | 'edit' | 'detail' | 'admin' | 'admin-master-data'

function App() {
  const { session, userName, isAdmin, loading, signOut } = useAuth()
  const [currentView, setCurrentView] = useState<ViewType>('list')
  const [selectedDonation, setSelectedDonation] = useState<Donation | undefined>(undefined)
  const [selectedDonationId, setSelectedDonationId] = useState<string | undefined>(undefined)

  const handleAdminClick = () => {
    setCurrentView('admin')
  }

  const handleAdminBack = () => {
    setCurrentView('list')
  }

  const handleMasterDataClick = () => {
    setCurrentView('admin-master-data')
  }

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
      let result: { success: boolean; error?: string } | undefined
      if (currentView === 'create') {
        result = await donationApi.createDonation(data)
      } else if (currentView === 'edit' && selectedDonation) {
        result = await donationApi.updateDonation(selectedDonation.id, data)
      }
      if (result && !result.success) {
        alert(result.error || '保存に失敗しました')
        return
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
        const result = await donationApi.deleteDonation(selectedDonation.id)
        if (!result.success) {
          alert(result.error || '削除に失敗しました')
          return
        }
        setCurrentView('list')
      } catch (error) {
        console.error('Failed to delete donation:', error)
        alert('削除に失敗しました')
      }
    }
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
          <h1>HapInS Library</h1>
          <AuthComponent />
        </div>
      ) : (
        <div className="dashboard">
          <header className="app-header">
            <div className="header-content">
              <h1>HapInS Library</h1>
              <div className="user-info">
                <span>ログイン中: {userName || session.user.email}</span>
                {isAdmin && (
                  <>
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
                    <button
                      onClick={handleMasterDataClick}
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
                      マスタ管理
                    </button>
                  </>
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
            ) : currentView === 'admin-master-data' ? (
              <MasterDataManagement onBack={handleAdminBack} />
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
                currentUserId={session?.user?.id}
                isAdmin={isAdmin}
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
