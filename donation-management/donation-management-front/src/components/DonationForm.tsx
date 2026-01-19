import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Donation, Tag } from '../types/donation';
import { donationFormSchema, type DonationFormData } from '../lib/validation';
import { useCategories, useLocations, useTags } from '../hooks/useMasterData';

interface DonationFormProps {
    mode: 'create' | 'edit';
    initialData?: Donation;
    onSubmit: (data: Partial<Donation>) => void;
    onCancel: () => void;
    onDelete?: () => void;
}

export default function DonationForm({ mode, initialData, onSubmit, onCancel, onDelete }: DonationFormProps) {
    // React Queryでマスターデータを取得
    const { data: categoriesResult } = useCategories();
    const { data: locationsResult } = useLocations();
    const { data: tagsResult } = useTags();

    const categories = categoriesResult?.data || [];
    const locations = locationsResult?.data || [];
    const tags = tagsResult?.data || [];

    // 画像URLとタグの管理用ステート（配列フィールドはreact-hook-formで管理が複雑なため）
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

    // React Hook Form + Zodバリデーション
    const {
        register,
        handleSubmit: handleFormSubmit,
        formState: { errors, isSubmitting },
        watch,
        setValue,
    } = useForm<DonationFormData>({
        resolver: zodResolver(donationFormSchema),
        defaultValues: {
            title: '',
            category_id: '',
            sub_category_id: '',
            location_id: '',
            status: 'available',
            condition: '',
            description: '',
            donor_name: '',
            donated_date: new Date().toISOString().split('T')[0],
            isbn: '',
            author: '',
            publisher: '',
            published_year: undefined,
            manufacturer: '',
            model_number: '',
        },
    });

    // 編集モードの場合、初期データをセット
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setValue('title', initialData.title || '');
            setValue('category_id', initialData.category_id || '');
            setValue('sub_category_id', initialData.sub_category_id);
            setValue('location_id', initialData.location_id || '');
            setValue('status', initialData.status || 'available');
            setValue('condition', initialData.condition);
            setValue('description', initialData.description);
            setValue('donor_name', initialData.donor_name);
            setValue('donated_date', initialData.donated_date || '');
            setValue('isbn', initialData.isbn);
            setValue('author', initialData.author);
            setValue('publisher', initialData.publisher);
            setValue('published_year', initialData.published_year);
            setValue('manufacturer', initialData.manufacturer);
            setValue('model_number', initialData.model_number);

            setImageUrls(initialData.image_urls || (initialData.image_url ? [initialData.image_url] : []));
            setSelectedTags(initialData.tags || []);
        }
    }, [mode, initialData, setValue]);

    // フォーム送信ハンドラー
    const onFormSubmit = (data: DonationFormData) => {
        // 空文字列やNaNをundefinedに変換
        const cleanData = {
            ...data,
            sub_category_id: data.sub_category_id || undefined,
            condition: (data.condition && data.condition !== '') ? data.condition as 'new' | 'good' | 'fair' | 'poor' : undefined,
            description: data.description || undefined,
            donor_name: data.donor_name || undefined,
            isbn: data.isbn || undefined,
            author: data.author || undefined,
            publisher: data.publisher || undefined,
            published_year: (data.published_year && !isNaN(data.published_year)) ? data.published_year : undefined,
            manufacturer: data.manufacturer || undefined,
            model_number: data.model_number || undefined,
        };

        // 画像URLの配列を追加
        const firstImage = imageUrls.length > 0 ? imageUrls[0] : '';
        onSubmit({
            ...cleanData,
            image_url: firstImage,
            image_urls: imageUrls,
            tags: selectedTags,
        });
    };

    // カテゴリ変更の監視
    const watchedCategoryId = watch('category_id');
    const selectedCategory = categories.find(c => c.id === watchedCategoryId);
    const subCategories = selectedCategory?.sub_categories || [];

    return (
        <div className="donation-form-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>{mode === 'create' ? '新規寄贈登録' : '寄贈物編集'}</h2>

            <form onSubmit={handleFormSubmit(onFormSubmit)}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>タイトル *</label>
                    <input
                        type="text"
                        {...register('title')}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    {errors.title && (
                        <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.title.message}</p>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>カテゴリ *</label>
                        <select
                            {...register('category_id')}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="">選択してください</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.category_id && (
                            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.category_id.message}</p>
                        )}
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>サブカテゴリ</label>
                        <select
                            {...register('sub_category_id')}
                            disabled={!watchedCategoryId}
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
                        {...register('location_id')}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">選択してください</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                    {errors.location_id && (
                        <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.location_id.message}</p>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>状態 *</label>
                        <select
                            {...register('status')}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="available">利用可能</option>
                            <option value="lending">貸出中</option>
                            <option value="maintenance">メンテナンス中</option>
                            <option value="lost">紛失</option>
                        </select>
                        {errors.status && (
                            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.status.message}</p>
                        )}
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>コンディション</label>
                        <select
                            {...register('condition')}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="">選択してください</option>
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
                        {...register('description')}
                        rows={4}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    {errors.description && (
                        <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.description.message}</p>
                    )}
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>画像URL</label>
                    {imageUrls.map((url, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => {
                                    const newUrls = [...imageUrls];
                                    newUrls[index] = e.target.value;
                                    setImageUrls(newUrls);
                                }}
                                placeholder="https://example.com/image.jpg"
                                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const newUrls = imageUrls.filter((_, i) => i !== index);
                                    setImageUrls(newUrls);
                                }}
                                style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                削除
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            setImageUrls([...imageUrls, '']);
                        }}
                        style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        画像を追加
                    </button>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>タグ</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
                        {tags.map(tag => (
                            <label key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '4px 8px', backgroundColor: '#f8f9fa', borderRadius: '16px', border: '1px solid #ddd' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedTags.some(t => t.id === tag.id)}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        if (checked) {
                                            setSelectedTags([...selectedTags, tag]);
                                        } else {
                                            setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
                                        }
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
                                {...register('author')}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            {errors.author && (
                                <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.author.message}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>出版社</label>
                            <input
                                type="text"
                                {...register('publisher')}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            {errors.publisher && (
                                <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.publisher.message}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>出版年</label>
                            <input
                                type="number"
                                {...register('published_year', { valueAsNumber: true })}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            {errors.published_year && (
                                <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.published_year.message}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ISBN</label>
                            <input
                                type="text"
                                {...register('isbn')}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            {errors.isbn && (
                                <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.isbn.message}</p>
                            )}
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
                                {...register('manufacturer')}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            {errors.manufacturer && (
                                <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.manufacturer.message}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>型番</label>
                            <input
                                type="text"
                                {...register('model_number')}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            {errors.model_number && (
                                <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.model_number.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>寄贈者名</label>
                        <input
                            type="text"
                            {...register('donor_name')}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        {errors.donor_name && (
                            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.donor_name.message}</p>
                        )}
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>寄贈日 *</label>
                        <input
                            type="date"
                            {...register('donated_date')}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        {errors.donated_date && (
                            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.donated_date.message}</p>
                        )}
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
                            disabled={isSubmitting}
                            style={{ padding: '10px 20px', backgroundColor: isSubmitting ? '#6c757d' : '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                        >
                            {isSubmitting ? '処理中...' : mode === 'create' ? '登録する' : '更新する'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
