import { useState, useEffect } from 'react';
import type { Donation, Category, Location, Tag } from '../types/donation';
import { donationApi } from '../services/donationApi';
import { storageService } from '../services/storageService';

interface DonationFormProps {
    mode: 'create' | 'edit';
    initialData?: Donation;
    onSubmit: (data: Partial<Donation>) => void;
    onCancel: () => void;
    onDelete?: () => void;
}

export default function DonationForm({ mode, initialData, onSubmit, onCancel, onDelete }: DonationFormProps) {
    const [formData, setFormData] = useState<Partial<Donation>>({
        title: '',
        category_id: '',
        sub_category_id: '',
        location_id: '',
        status: 'available',
        condition: 'good',
        description: '',
        image_urls: [],
        tags: [],
        donor_name: '',
        donated_date: new Date().toISOString().split('T')[0],
        isbn: '',
        author: '',
        publisher: '',
        published_year: undefined,
        manufacturer: '',
        model_number: '',
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        const loadMasterData = async () => {
            try {
                const [categoriesRes, locationsRes, tagsRes] = await Promise.all([
                    donationApi.getCategories(),
                    donationApi.getLocations(),
                    donationApi.getTags()
                ]);
                if (categoriesRes.success) setCategories(categoriesRes.data);
                if (locationsRes.success) setLocations(locationsRes.data);
                if (tagsRes.success) setTags(tagsRes.data);
            } catch (error) {
                console.error('Failed to load master data:', error);
            }
        };
        loadMasterData();
    }, []);

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            // リレーションデータや読み取り専用フィールドを除外してフォームデータを設定
            const donationWithMeta = initialData as Donation & {
                created_by?: string;
                updated_by?: string;
                deleted_at?: string;
                categories?: unknown;
                sub_categories?: unknown;
                locations?: unknown;
                donation_images?: unknown;
                donation_tags?: unknown;
            };
            const {
                category, sub_category, location,
                categories, sub_categories, locations,
                donation_images, donation_tags,
                created_by, updated_by, created_at, updated_at, deleted_at,
                ...cleanData
            } = donationWithMeta;
            setFormData({
                ...cleanData,
                // Ensure arrays are initialized
                image_urls: initialData.image_urls || [],
                tags: initialData.tags || []
            });
        }
    }, [mode, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // published_yearは数値型として処理
        if (name === 'published_year') {
            const numValue = value === '' ? undefined : parseInt(value, 10);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError(null);

        // 5MBチェック
        if (file.size > 5 * 1024 * 1024) {
            setUploadError(`ファイル「${file.name}」が5MBを超えています。`);
            return;
        }

        // 単一画像にするため、既存の選択とファイルをリセット
        if (previews[0]) URL.revokeObjectURL(previews[0]);
        setSelectedFiles([file]);
        setFormData(prev => ({ ...prev, image_urls: [] })); // ストレージ選択分をクリア

        // プレビュー作成
        setPreviews([URL.createObjectURL(file)]);
    };

    const removePreview = () => {
        setPreviews([]);
        setSelectedFiles([]);
        if (previews[0]) URL.revokeObjectURL(previews[0]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        setUploadError(null);

        try {
            let updatedImageUrls = [...(formData.image_urls || [])];

            // 新規ファイルのアップロードがある場合、それを優先（置換）
            if (selectedFiles.length > 0) {
                const url = await storageService.uploadImage(selectedFiles[0]);
                updatedImageUrls = [url];
            }

            // 最終的に1枚に絞る（安全策）
            if (updatedImageUrls.length > 1) {
                updatedImageUrls = [updatedImageUrls[updatedImageUrls.length - 1]];
            }

            onSubmit({ ...formData, image_urls: updatedImageUrls });
        } catch (error) {
            console.error('Submit error:', error);
            setUploadError(error instanceof Error ? error.message : '保存に失敗しました。');
        } finally {
            setIsUploading(false);
        }
    };

    const selectedCategory = categories.find(c => c.id === formData.category_id);
    const subCategories = selectedCategory?.sub_categories || [];

    return (
        <div className="donation-form-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>{mode === 'create' ? '新規寄贈登録' : '寄贈物編集'}</h2>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>タイトル *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>カテゴリ *</label>
                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="">選択してください</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>サブカテゴリ</label>
                        <select
                            name="sub_category_id"
                            value={formData.sub_category_id || ''}
                            onChange={handleChange}
                            disabled={!formData.category_id}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="">選択してください</option>
                            {subCategories.map(sc => (
                                <option key={sc.id} value={sc.id}>{sc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>保管場所 *</label>
                    <select
                        name="location_id"
                        value={formData.location_id}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">選択してください</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>状態 *</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="available">利用可能</option>
                            <option value="lending">貸出中</option>
                            <option value="maintenance">メンテナンス中</option>
                            <option value="lost">紛失</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>コンディション</label>
                        <select
                            name="condition"
                            value={formData.condition}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="new">新品同様</option>
                            <option value="good">良</option>
                            <option value="fair">可</option>
                            <option value="poor">難あり</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>説明</label>
                    <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        rows={4}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>画像</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input
                            type="text"
                            value={formData.image_urls?.[0] || ''}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, image_urls: [e.target.value] }));
                            }}
                            placeholder="https://example.com/image.jpg"
                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        {formData.image_urls?.[0] && (
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, image_urls: [] }))}
                                style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                削除
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <label
                            htmlFor="file-upload"
                            style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
                        >
                            PCからアップロード
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="file-upload"
                        />
                    </div>

                    {previews.length > 0 && (
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>アップロード予定:</p>
                            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                                <img src={previews[0]} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '2px solid #28a745' }} />
                                <button
                                    type="button"
                                    onClick={() => removePreview()}
                                    style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    {uploadError && (
                        <p style={{ color: '#dc3545', marginTop: '10px', fontSize: '14px' }}>{uploadError}</p>
                    )}
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>タグ</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
                        {tags.map(tag => (
                            <label key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '4px 8px', backgroundColor: '#f8f9fa', borderRadius: '16px', border: '1px solid #ddd' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.tags?.some(t => t.id === tag.id) || false}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormData(prev => {
                                            const currentTags = prev.tags || [];
                                            if (checked) {
                                                return { ...prev, tags: [...currentTags, tag] };
                                            } else {
                                                return { ...prev, tags: currentTags.filter(t => t.id !== tag.id) };
                                            }
                                        });
                                    }}
                                />
                                {tag.name}
                            </label>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>書籍情報 (書籍の場合のみ)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>著者</label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>出版社</label>
                            <input
                                type="text"
                                name="publisher"
                                value={formData.publisher || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>出版年</label>
                            <input
                                type="number"
                                name="published_year"
                                value={formData.published_year || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ISBN</label>
                            <input
                                type="text"
                                name="isbn"
                                value={formData.isbn || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>製品情報 (備品の場合のみ)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>メーカー</label>
                            <input
                                type="text"
                                name="manufacturer"
                                value={formData.manufacturer || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>型番</label>
                            <input
                                type="text"
                                name="model_number"
                                value={formData.model_number || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>寄贈者名</label>
                        <input
                            type="text"
                            name="donor_name"
                            value={formData.donor_name || ''}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>寄贈日</label>
                        <input
                            type="date"
                            name="donated_date"
                            value={formData.donated_date}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                    {mode === 'edit' && onDelete ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('本当に削除しますか？')) {
                                    onDelete();
                                }
                            }}
                            style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            削除
                        </button>
                    ) : <div></div>}

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            style={{ padding: '10px 20px', backgroundColor: isUploading ? '#ccc' : '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: isUploading ? 'not-allowed' : 'pointer' }}
                        >
                            {isUploading ? '保存中...' : (mode === 'create' ? '登録する' : '更新する')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
