import type { Donation } from '../types/donation';
import { useDonation } from '../hooks/useDonations';

interface DonationDetailProps {
    donationId: string;
    onBack: () => void;
    onEdit: (donation: Donation) => void;
}

export default function DonationDetail({ donationId, onBack, onEdit }: DonationDetailProps) {
    // React Queryで寄贈物詳細を取得
    const { data: result, isLoading, error } = useDonation(donationId);

    if (isLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>エラーが発生しました</div>;
    if (!result?.success || !result.data) return null;

    const donation = result.data;

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
                    <button
                        onClick={() => onEdit(donation)}
                        style={{ padding: '8px 16px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        編集
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div>
                        <div>
                            {donation.image_urls && donation.image_urls.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {donation.image_urls.map((url, index) => (
                                        <img
                                            key={index}
                                            src={url}
                                            alt={`${donation.title} - ${index + 1}`}
                                            style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }}
                                        />
                                    ))}
                                </div>
                            ) : donation.image_url ? (
                                <img
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
                                backgroundColor: donation.status === 'available' ? '#d4edda' : '#fff3cd',
                                color: donation.status === 'available' ? '#155724' : '#856404',
                                marginBottom: '10px'
                            }}>
                                {donation.status === 'available' ? '利用可能' :
                                    donation.status === 'lending' ? '貸出中' :
                                        donation.status === 'maintenance' ? 'メンテナンス中' : '紛失'}
                            </span>

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
        </div>
    );
}
