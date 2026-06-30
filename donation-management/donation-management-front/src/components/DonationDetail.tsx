import { useCallback, useEffect, useState } from 'react';
import type { Donation, Lending } from '../types/donation';
import { donationApi } from '../services/donationApi';

interface DonationDetailProps {
    donationId: string;
    onBack: () => void;
    onEdit: (donation: Donation) => void;
    currentUserId?: string;
    isAdmin?: boolean;
}

const SafeImage = ({ src, alt, style }: { src: string; alt: string; style: React.CSSProperties }) => {
    const [imgError, setImgError] = useState(false);

    if (imgError) {
        return (
            <div style={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...style as any,
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888',
                height: '300px'
            }}>
                No Image
            </div>
        );
    }

    return <img src={src} alt={alt} style={style} onError={() => setImgError(true)} />;
};

export default function DonationDetail({ donationId, onBack, onEdit, currentUserId, isAdmin }: DonationDetailProps) {
    const [donation, setDonation] = useState<Donation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    
    // 貸出機能に関する状態
    const [activeLending, setActiveLending] = useState<Lending | null>(null);
    const [lendingLoading, setLendingLoading] = useState(false);
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [purpose, setPurpose] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchDonationDetails = useCallback(async () => {
        try {
            const result = await donationApi.getDonation(donationId);

            // 早期リターン: エラー時
            if (!result.success) {
                setError(result.error || '詳細の取得に失敗しました');
                return;
            }

            setDonation(result.data);

            // ステータスが貸出中でない場合は貸出情報をクリアして終了
            if (result.data.status !== 'lending') {
                setActiveLending(null);
                setLendingLoading(false);
                return;
            }

            // 貸出中の場合、アクティブな貸出レコードを取得
            setLendingLoading(true);
            const lendingResult = await donationApi.getActiveLending(donationId);
            setLendingLoading(false);

            if (!lendingResult.success) {
                setActiveLending(null);
                console.error('貸出情報の取得に失敗しました:', lendingResult.error);
                return;
            }

            setActiveLending(lendingResult.data);
        } catch {
            setError('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    }, [donationId]);

    useEffect(() => {
        fetchDonationDetails();
    }, [fetchDonationDetails]);

    const handleBorrowClick = () => {
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
        setDueDate(twoWeeksLater.toISOString().split('T')[0]);
        setPurpose('');
        setShowBorrowModal(true);
    };

    const handleBorrowSubmit = async () => {
        if (!dueDate) {
            alert('返却予定日を指定してください');
            return;
        }
        try {
            setActionLoading(true);
            const result = await donationApi.borrowDonation(donationId, dueDate, purpose);
            if (result.success) {
                alert('貸出処理が完了しました');
                setShowBorrowModal(false);
                await fetchDonationDetails();
            } else {
                alert(result.error || '貸出処理に失敗しました');
            }
        } catch (err) {
            console.error(err);
            alert('通信エラーが発生しました');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReturnClick = async () => {
        if (!activeLending) return;
        if (!confirm('返却処理を行います。よろしいですか？')) return;

        try {
            setActionLoading(true);
            const result = await donationApi.returnDonation(activeLending.id);
            if (result.success) {
                alert('返却処理が完了しました');
                await fetchDonationDetails();
            } else {
                alert(result.error || '返却処理に失敗しました');
            }
        } catch (err) {
            console.error(err);
            alert('通信エラーが発生しました');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>{error}</div>;
    if (!donation) return null;

    return (
        <div className="donation-detail" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <button
                onClick={onBack}
                style={{ marginBottom: '20px', padding: '8px 16px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
            >
                ← 一覧に戻る
            </button>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, fontSize: '24px' }}>{donation.title}</h1>
                    {(isAdmin || donation.created_by === currentUserId) && (
                        <button
                            onClick={() => onEdit(donation)}
                            style={{ padding: '8px 16px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            編集
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div>
                        <div>
                            {donation.image_urls && donation.image_urls.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {donation.image_urls.map((url, index) => (
                                        <SafeImage
                                            key={index}
                                            src={url}
                                            alt={`${donation.title} - ${index + 1}`}
                                            style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }}
                                        />
                                    ))}
                                </div>
                            ) : donation.image_url ? (
                                <SafeImage
                                    src={donation.image_url}
                                    alt={donation.title}
                                    style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '300px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: '#888' }}>
                                    No Image
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <span style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                backgroundColor: donation.status === 'available' ? '#d4edda' : 
                                                 donation.status === 'lending' ? '#fff3cd' : '#e2e3e5',
                                color: donation.status === 'available' ? '#155724' : 
                                       donation.status === 'lending' ? '#856404' : '#383d41',
                                marginBottom: '10px'
                            }}>
                                {donation.status === 'available' ? '利用可能' :
                                    donation.status === 'lending' ? '貸出中' :
                                        donation.status === 'maintenance' ? 'メンテナンス中' : '紛失'}
                            </span>

                            {/* 貸出・返却操作エリア */}
                            <div style={{ marginTop: '15px', marginBottom: '25px' }}>
                                {donation.status === 'available' && (
                                    <button
                                        onClick={handleBorrowClick}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 4px rgba(40,167,69,0.2)',
                                        }}
                                    >
                                        この品を借りる
                                    </button>
                                )}

                                {donation.status === 'lending' && (
                                    <div style={{
                                        border: '1px solid #ffeeba',
                                        backgroundColor: '#fff3cd',
                                        borderRadius: '6px',
                                        padding: '15px',
                                        fontSize: '14px'
                                    }}>
                                        {activeLending ? (
                                            <>
                                                <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '8px', fontSize: '15px' }}>
                                                    現在貸出中
                                                </div>
                                                <div style={{ color: '#495057', marginBottom: '6px' }}>
                                                    <strong>借用者:</strong> {activeLending.users?.name || activeLending.users?.email || '不明なユーザー'}
                                                </div>
                                                <div style={{ color: '#495057', marginBottom: '6px' }}>
                                                    <strong>返却期限:</strong> {activeLending.due_date}
                                                </div>
                                                {activeLending.purpose && (
                                                    <div style={{ color: '#6c757d', marginBottom: '12px', fontSize: '13px', fontStyle: 'italic' }}>
                                                        「{activeLending.purpose}」
                                                    </div>
                                                )}
                                                {(isAdmin || activeLending.user_id === currentUserId) && (
                                                    <button
                                                        onClick={handleReturnClick}
                                                        disabled={actionLoading}
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 4px rgba(220,53,69,0.2)'
                                                        }}
                                                    >
                                                        {actionLoading ? '返却処理中...' : '返却する'}
                                                    </button>
                                                )}
                                            </>
                                        ) : lendingLoading ? (
                                            <div style={{ color: '#856404', textAlign: 'center' }}>貸出情報を取得中...</div>
                                        ) : (
                                            <div style={{ color: '#856404', textAlign: 'center' }}>貸出情報が見つかりません</div>
                                        )}
                                    </div>
                                )}

                                {(donation.status === 'maintenance' || donation.status === 'lost') && (
                                    <button
                                        disabled
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '16px',
                                            cursor: 'not-allowed'
                                        }}
                                    >
                                        貸出不可
                                    </button>
                                )}
                            </div>

                            <div style={{ color: '#666', fontSize: '14px' }}>
                                カテゴリ: {donation.category?.name} {donation.sub_category ? `> ${donation.sub_category.name}` : ''}
                            </div>
                            <div style={{ color: '#666', fontSize: '14px' }}>
                                保管場所: {donation.location?.name}
                            </div>
                            {donation.tags && donation.tags.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {donation.tags.map(tag => (
                                        <span key={tag.id} style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: '#e9ecef', borderRadius: '12px', color: '#495057' }}>
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>基本情報</h3>
                            <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
                                <dt style={{ color: '#666' }}>寄贈者</dt>
                                <dd style={{ margin: 0 }}>{donation.donor_name || '-'}</dd>
                                <dt style={{ color: '#666' }}>寄贈日</dt>
                                <dd style={{ margin: 0 }}>{donation.donated_date}</dd>
                                <dt style={{ color: '#666' }}>状態</dt>
                                <dd style={{ margin: 0 }}>{donation.condition || '-'}</dd>
                            </dl>
                        </div>

                        {/* 書籍情報 */}
                        {(donation.isbn || donation.author || donation.publisher) && (
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>書籍情報</h3>
                                <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
                                    {donation.author && <><dt style={{ color: '#666' }}>著者</dt><dd style={{ margin: 0 }}>{donation.author}</dd></>}
                                    {donation.publisher && <><dt style={{ color: '#666' }}>出版社</dt><dd style={{ margin: 0 }}>{donation.publisher}</dd></>}
                                    {donation.published_year && <><dt style={{ color: '#666' }}>出版年</dt><dd style={{ margin: 0 }}>{donation.published_year}年</dd></>}
                                    {donation.isbn && <><dt style={{ color: '#666' }}>ISBN</dt><dd style={{ margin: 0 }}>{donation.isbn}</dd></>}
                                </dl>
                            </div>
                        )}

                        {/* 備品情報 */}
                        {(donation.manufacturer || donation.model_number) && (
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>製品情報</h3>
                                <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
                                    {donation.manufacturer && <><dt style={{ color: '#666' }}>メーカー</dt><dd style={{ margin: 0 }}>{donation.manufacturer}</dd></>}
                                    {donation.model_number && <><dt style={{ color: '#666' }}>型番</dt><dd style={{ margin: 0 }}>{donation.model_number}</dd></>}
                                </dl>
                            </div>
                        )}
                    </div>
                </div>

                {donation.description && (
                    <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>説明</h3>
                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#333' }}>{donation.description}</p>
                    </div>
                )}
            </div>

            {/* 貸出申請用モーダルダイアログ */}
            {showBorrowModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '8px',
                        width: '400px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>この品を借りる</h2>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>返却予定日 *</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>利用目的 (任意)</label>
                            <textarea
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="会議室での使用、技術調査など"
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', height: '80px', resize: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => setShowBorrowModal(false)}
                                style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleBorrowSubmit}
                                disabled={actionLoading}
                                style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                {actionLoading ? '処理中...' : '借りる'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
