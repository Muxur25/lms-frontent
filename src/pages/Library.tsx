import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, FileText, Download, Eye, Search, Plus, X, Upload, Loader2, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { apiClient } from '@/api/axios';
import { useAuthStore } from '@/store/auth.store';
import BookReader from '@/components/BookReader';
import { customConfirm } from '@/shared/lib/toast-utils';

interface Book {
  id: string;
  title: string;
  description: string;
  type: string;
  size: string;
  url: string;
  views: number;
  downloadable: boolean;
  createdBy: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  language: string; // 'uz' or 'ru'
  createdBy: string;
  books: Book[];
}

const isLocalFile = (url: string) => {
  if (!url) return false;
  if (url.startsWith('/') || url.startsWith('api/v1')) return true;

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  try {
    const backendOrigin = new URL(apiBase).origin;
    return url.startsWith(backendOrigin);
  } catch (e) {
    return false;
  }
};

const getAbsoluteUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  try {
    const backendOrigin = new URL(apiBase).origin;
    const relativeUrl = url.startsWith('/') ? url : `/${url}`;
    return `${backendOrigin}${relativeUrl}`;
  } catch (e) {
    return url;
  }
};

const getRequestUrl = (url: string) => {
  if (!url) return '';

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  let cleanUrl = url;
  try {
    const backendOrigin = new URL(apiBase).origin;
    if (cleanUrl.startsWith(backendOrigin)) {
      cleanUrl = cleanUrl.substring(backendOrigin.length);
    }
  } catch (e) {
    // Ignore error
  }

  if (cleanUrl.startsWith('/api/v1')) {
    cleanUrl = cleanUrl.substring(7);
  } else if (cleanUrl.startsWith('api/v1')) {
    cleanUrl = cleanUrl.substring(6);
  }

  return cleanUrl;
};

export default function Library() {
  const { i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [activeReaderBook, setActiveReaderBook] = useState<Book | null>(null);

  const tabsRef = useRef<HTMLDivElement>(null);

  // Auth role checks
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'trainer';

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);

  // Category Form State
  const [catFormData, setCatFormData] = useState({
    name: '',
    description: '',
    language: 'uz',
  });
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catErrors, setCatErrors] = useState<Record<string, string>>({});

  // Edit Category Form State
  const [editCatFormData, setEditCatFormData] = useState({
    id: '',
    name: '',
    description: '',
    language: 'uz',
  });
  const [editCatSubmitting, setEditCatSubmitting] = useState(false);
  const [editCatErrors, setEditCatErrors] = useState<Record<string, string>>({});

  // Book Form State
  const [bookFormData, setBookFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: 'PDF',
    url: '',
    size: '',
    downloadable: true,
  });
  const [bookSubmitting, setBookSubmitting] = useState(false);
  const [bookErrors, setBookErrors] = useState<Record<string, string>>({});

  // Edit Book Form State
  const [editBookFormData, setEditBookFormData] = useState({
    id: '',
    title: '',
    description: '',
    category: '',
    type: 'PDF',
    url: '',
    size: '',
    downloadable: true,
  });
  const [editBookSubmitting, setEditBookSubmitting] = useState(false);
  const [editBookErrors, setEditBookErrors] = useState<Record<string, string>>({});

  // File Upload State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isRu = i18n.language === 'ru';

  const fetchLibraryData = () => {
    apiClient.get('/library')
      .then(res => {
        const fetched = res.data?.data || res.data || [];
        setCategories(Array.isArray(fetched) ? fetched : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching library data:', err);
        setError(isRu ? 'Ошибка при загрузке библиотеки' : 'Kutubxona ma\'lumotlarini yuklashda xatolik yuz berdi');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLibraryData();
  }, [isRu]);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !bookFormData.category) {
      setBookFormData(prev => ({ ...prev, category: categories[0].id }));
    }
  }, [categories]);

  const canManageCategory = (cat: Category) => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    return cat.createdBy === user.id;
  };

  const canManageBook = (book: Book, catId: string) => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    if (book.createdBy === user.id) return true;

    // Check if user created the category
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.createdBy === user.id) return true;

    return false;
  };

  const handleOpenReader = async (book: Book) => {
    setActiveReaderBook(book);
    try {
      await apiClient.patch(`/library/books/${book.id}/view`);
      setCategories(prev => prev.map(cat => ({
        ...cat,
        books: cat.books.map(b => b.id === book.id ? { ...b, views: (b.views || 0) + 1 } : b)
      })));
    } catch (err) {
      console.error('Error incrementing book views:', err);
    }
  };

  const handleCloseReader = () => {
    setActiveReaderBook(null);
  };

  const handleDownloadBook = async (e: React.MouseEvent, book: Book) => {
    e.preventDefault();
    const url = book.url;
    if (!url) return;

    try {
      await apiClient.patch(`/library/books/${book.id}/view`);
      setCategories(prev => prev.map(cat => ({
        ...cat,
        books: cat.books.map(b => b.id === book.id ? { ...b, views: (b.views || 0) + 1 } : b)
      })));
    } catch (err) {
      console.error('Error incrementing book views:', err);
    }

    if (isLocalFile(url)) {
      try {
        const cleanUrl = getRequestUrl(url);
        const response = await apiClient.get(cleanUrl, {
          responseType: 'blob'
        });

        const extension = book.type ? book.type.toLowerCase() : 'pdf';
        const filename = book.title ? `${book.title}.${extension}` : 'download';

        const contentType = response.headers['content-type'] ? String(response.headers['content-type']) : 'application/octet-stream';
        const blob = new Blob([response.data], { type: contentType });
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error('Error downloading local file:', err);
        window.open(getAbsoluteUrl(url), '_blank');
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('visibility', 'public');

    try {
      const response: any = await apiClient.post('/uploads/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 0, // Disable timeout for uploads
      });

      const fileData = response.data?.data || response.data || response;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      const urlVal = fileData.url || `/api/v1/uploads/presigned/${fileData.id}`;

      if (isEdit) {
        setEditBookFormData(prev => ({
          ...prev,
          url: urlVal,
          size: sizeStr,
        }));
      } else {
        setBookFormData(prev => ({
          ...prev,
          url: urlVal,
          size: sizeStr,
        }));
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(isRu ? 'Ошибка при загрузке файла' : 'Faylni yuklashda xatolik yuz berdi');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!catFormData.name.trim()) newErrors.name = isRu ? 'Укажите название' : 'Bo\'lim nomini kiriting';

    if (Object.keys(newErrors).length > 0) {
      setCatErrors(newErrors);
      return;
    }

    setCatErrors({});
    setCatSubmitting(true);

    try {
      await apiClient.post('/library/categories', catFormData);
      setIsCategoryModalOpen(false);
      setCatFormData({
        name: '',
        description: '',
        language: 'uz',
      });
      fetchLibraryData();
    } catch (err: any) {
      console.error('Error creating category:', err);
      setCatErrors({ api: err.message || 'Xatolik yuz berdi' });
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!editCatFormData.name.trim()) newErrors.name = isRu ? 'Укажите название' : 'Bo\'lim nomini kiriting';

    if (Object.keys(newErrors).length > 0) {
      setEditCatErrors(newErrors);
      return;
    }

    setEditCatErrors({});
    setEditCatSubmitting(true);

    try {
      await apiClient.patch(`/library/categories/${editCatFormData.id}`, editCatFormData);
      setIsEditCategoryModalOpen(false);
      fetchLibraryData();
    } catch (err: any) {
      console.error('Error updating category:', err);
      setEditCatErrors({ api: err.message || 'Xatolik yuz berdi' });
    } finally {
      setEditCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const confirmMsg = isRu
      ? 'Вы уверены, что хотите удалить этот раздел и все документы внутри него?'
      : 'Haqiqatan ham ushbu bo\'limni va uning ichidagi barcha hujjatlarni o\'chirmoqchimisiz?';

    customConfirm(confirmMsg, async () => {
      try {
        await apiClient.delete(`/library/categories/${catId}`);
        setSelectedCategory('all');
        fetchLibraryData();
      } catch (err) {
        console.error('Error deleting category:', err);
      }
    });
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!bookFormData.title.trim()) newErrors.title = isRu ? 'Укажите название' : 'Kitob nomini kiriting';
    if (!bookFormData.category) newErrors.category = isRu ? 'Выберите раздел' : 'Bo\'limni tanlang';
    if (!bookFormData.url.trim()) newErrors.url = isRu ? 'Загрузите file yoki havola kiriting' : 'Fayl yuklang yoki havolani kiriting';

    if (Object.keys(newErrors).length > 0) {
      setBookErrors(newErrors);
      return;
    }

    setBookErrors({});
    setBookSubmitting(true);

    try {
      await apiClient.post('/library/books', bookFormData);
      setIsBookModalOpen(false);
      setBookFormData({
        title: '',
        description: '',
        category: categories[0]?.id || '',
        type: 'PDF',
        url: '',
        size: '',
        downloadable: true,
      });
      fetchLibraryData();
    } catch (err: any) {
      console.error('Error creating book:', err);
      setBookErrors({ api: err.message || 'Xatolik yuz berdi' });
    } finally {
      setBookSubmitting(false);
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!editBookFormData.title.trim()) newErrors.title = isRu ? 'Укажите название' : 'Kitob nomini kiriting';
    if (!editBookFormData.category) newErrors.category = isRu ? 'Выберите раздел' : 'Bo\'limni tanlang';
    if (!editBookFormData.url.trim()) newErrors.url = isRu ? 'Fayl yuklang yoki havolani kiriting' : 'Fayl yuklang yoki havolani kiriting';

    if (Object.keys(newErrors).length > 0) {
      setEditBookErrors(newErrors);
      return;
    }

    setEditBookErrors({});
    setEditBookSubmitting(true);

    try {
      await apiClient.patch(`/library/books/${editBookFormData.id}`, editBookFormData);
      setIsEditBookModalOpen(false);
      fetchLibraryData();
    } catch (err: any) {
      console.error('Error updating book:', err);
      setEditBookErrors({ api: err.message || 'Xatolik yuz berdi' });
    } finally {
      setEditBookSubmitting(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    const confirmMsg = isRu
      ? 'Вы уверены, что хотите удалить этот документ?'
      : 'Ushbu hujjatni o\'chirishni tasdiqlaysizmi?';

    customConfirm(confirmMsg, async () => {
      try {
        await apiClient.delete(`/library/books/${bookId}`);
        fetchLibraryData();
      } catch (err) {
        console.error('Error deleting book:', err);
      }
    });
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Flatten and prepare book list
  const allBooks = categories.flatMap(cat =>
    (cat.books || []).map(b => ({
      ...b,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryLanguage: cat.language
    }))
  );

  const filteredBooks = allBooks.filter(book => {
    const title = book.title || '';
    const desc = book.description || '';
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase()) || desc.toLowerCase().includes(search.toLowerCase());

    let matchesCategory = false;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'lang_uz') {
      matchesCategory = book.categoryLanguage === 'uz';
    } else if (selectedCategory === 'lang_ru') {
      matchesCategory = book.categoryLanguage === 'ru';
    } else {
      matchesCategory = book.categoryId === selectedCategory;
    }

    return matchesSearch && matchesCategory;
  });

  // Categories matching current UI language for the tabs
  const activeLanguageCategories = categories.filter(cat =>
    isRu ? cat.language === 'ru' : cat.language === 'uz'
  );

  const selectedCatObj = categories.find(cat => cat.id === selectedCategory);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="skeleton w-16 h-16 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }} className="fade-in">
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{error}</h3>
        <button className="btn btn-primary" onClick={() => { setLoading(true); setError(null); fetchLibraryData(); }}>
          {isRu ? 'Повторить попытку' : 'Qayta urinib ko\'rish'}
        </button>
      </div>
    );
  }

  if (activeReaderBook) {
    return (
      <BookReader
        book={activeReaderBook}
        onClose={handleCloseReader}
        isRu={isRu}
        onDownload={handleDownloadBook}
      />
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen color="var(--cyan-400)" size={24} />
            {isRu ? 'Корпоративная Библиотека' : 'Korporativ Kutubxona'}
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>
            {isRu ? 'Все учебные материалы, правила и официальные документы' : 'Barcha o\'quv materiallari, qoidalar va rasmiy hujjatlar'}
          </p>
        </div>

        {canManage && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Category Admin actions */}
            {selectedCatObj && canManageCategory(selectedCatObj) && (
              <div style={{ display: 'flex', gap: 8, marginRight: 8, paddingRight: 16, borderRight: '1px solid var(--border-2)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: 'var(--amber-600)', color: 'var(--amber-400)' }}
                  onClick={() => {
                    setEditCatFormData({
                      id: selectedCatObj.id,
                      name: selectedCatObj.name,
                      description: selectedCatObj.description || '',
                      language: selectedCatObj.language,
                    });
                    setIsEditCategoryModalOpen(true);
                  }}
                >
                  <Pencil size={12} /> {isRu ? 'Изменить раздел' : 'Bo\'limni tahrirlash'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: 'var(--red-600)', color: 'var(--red-400)' }}
                  onClick={() => handleDeleteCategory(selectedCatObj.id)}
                >
                  <Trash2 size={12} /> {isRu ? 'Удалить раздел' : 'Bo\'limni o\'chirish'}
                </button>
              </div>
            )}

            <button className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(true)}>
              <Plus size={15} /> {isRu ? 'Новый раздел' : 'Yangi bo\'lim'}
            </button>
            <button className="btn btn-primary" onClick={() => setIsBookModalOpen(true)}>
              <Plus size={15} /> {isRu ? 'Добавить книгу' : 'Kitob qo\'shish'}
            </button>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="card" style={{ marginBottom: 24, padding: 16, display: 'flex', gap: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={16} />
          </div>
          <input
            type="text"
            className="input"
            style={{ paddingLeft: 40, width: '100%' }}
            placeholder={isRu ? 'Поиск по названию или теме документа...' : 'Hujjat nomi yoki mavzusi bo\'yicha qidirish...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category Tabs with Scroll Arrows */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, background: 'var(--bg-1)', borderRadius: 12, padding: '4px 8px' }}>
        <button
          className="btn btn-icon btn-ghost"
          onClick={() => scrollTabs('left')}
          style={{ minWidth: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={isRu ? 'Назад' : 'Orqaga'}
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={tabsRef}
          style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', flex: 1, paddingBottom: 2, paddingRight: 4, scrollbarWidth: 'none' }}
          className="hide-scrollbar"
        >
          <button
            className={clsx('btn btn-sm', selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary')}
            onClick={() => setSelectedCategory('all')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', borderRadius: 8, height: 34 }}
          >
            <BookOpen size={14} />
            {isRu ? 'Все' : 'Barchasi'}
          </button>

          <button
            className={clsx('btn btn-sm', selectedCategory === 'lang_uz' ? 'btn-primary' : 'btn-secondary')}
            onClick={() => setSelectedCategory('lang_uz')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', borderRadius: 8, height: 34 }}
          >
            {isRu ? 'Узбекские' : 'O\'zbekcha'}
          </button>

          <button
            className={clsx('btn btn-sm', selectedCategory === 'lang_ru' ? 'btn-primary' : 'btn-secondary')}
            onClick={() => setSelectedCategory('lang_ru')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', borderRadius: 8, height: 34 }}
          >
            {isRu ? 'Русские' : 'Ruscha'}
          </button>

          {activeLanguageCategories.map(cat => (
            <button
              key={cat.id}
              className={clsx('btn btn-sm', selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary')}
              onClick={() => setSelectedCategory(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', borderRadius: 8, height: 34 }}
            >
              <BookOpen size={14} />
              {cat.name}
            </button>
          ))}
        </div>

        <button
          className="btn btn-icon btn-ghost"
          onClick={() => scrollTabs('right')}
          style={{ minWidth: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={isRu ? 'Вперед' : 'Oldinga'}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Books Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border-1)', textAlign: 'left' }}>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isRu ? 'Название документа' : 'Hujjat nomi'}
                </th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isRu ? 'Формат / Размер' : 'Format / Hajm'}
                </th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isRu ? 'Раздел' : 'Bo\'lim'}
                </th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isRu ? 'Дата добавления' : 'Yuklangan sana'}
                </th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isRu ? 'Просмотры' : 'Ko\'rishlar'}
                </th>
                <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                  {isRu ? 'Действия' : 'Harakatlar'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.length > 0 ? (
                filteredBooks.map((doc, idx) => (
                  <tr key={doc.id} style={{ borderBottom: idx !== filteredBooks.length - 1 ? '1px solid var(--border-1)' : 'none', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6,182,212,0.1)', color: 'var(--cyan-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                            {doc.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {doc.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className="badge badge-blue" style={{ marginBottom: 6, display: 'inline-block' }}>{doc.type}</span>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{doc.size}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {doc.categoryName} ({doc.categoryLanguage.toUpperCase()})
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {formatDate(doc.createdAt)}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {doc.views || 0} {isRu ? 'раз' : 'marta'}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          className="btn btn-icon btn-ghost"
                          title={isRu ? 'Открыть' : 'O\'qish'}
                          onClick={() => handleOpenReader(doc)}
                        >
                          <Eye size={16} />
                        </button>
                        {doc.downloadable && (
                          <button
                            className="btn btn-icon btn-ghost"
                            title={isRu ? 'Скачать' : 'Yuklab olish'}
                            onClick={(e) => handleDownloadBook(e, doc)}
                          >
                            <Download size={16} />
                          </button>
                        )}
                        {/* Book Admin actions */}
                        {canManageBook(doc, doc.categoryId) && (
                          <>
                            <button
                              className="btn btn-icon btn-ghost"
                              title={isRu ? 'Редактировать' : 'Tahrirlash'}
                              style={{ color: 'var(--amber-400)' }}
                              onClick={() => {
                                setEditBookFormData({
                                  id: doc.id,
                                  title: doc.title,
                                  description: doc.description || '',
                                  category: doc.categoryId,
                                  type: doc.type,
                                  url: doc.url,
                                  size: doc.size,
                                  downloadable: doc.downloadable,
                                });
                                setIsEditBookModalOpen(true);
                              }}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="btn btn-icon btn-ghost"
                              title={isRu ? 'Удалить' : 'O\'chirish'}
                              style={{ color: 'var(--red-400)' }}
                              onClick={() => handleDeleteBook(doc.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    {isRu ? 'Документы не найдены' : 'Hujjatlar topilmadi'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Create Modal */}
      {isCategoryModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card modal-animate" style={{ width: '100%', maxWidth: 500, background: 'var(--bg-2)', border: '1px solid var(--border-3)', padding: 28, position: 'relative' }}>
            <button onClick={() => setIsCategoryModalOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
              {isRu ? 'Создать новый раздел' : 'Yangi bo\'lim qo\'shish'}
            </h2>
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">{isRu ? 'Язык раздела *' : 'Bo\'lim tili *'}</label>
                <select className="input" value={catFormData.language} onChange={e => setCatFormData(prev => ({ ...prev, language: e.target.value }))}>
                  <option value="uz">O'zbekcha (UZ)</option>
                  <option value="ru">Русский (RU)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">{isRu ? 'Название раздела *' : 'Bo\'lim nomi *'}</label>
                <input type="text" className="input" placeholder={isRu ? 'Например: Правила' : 'Masalan: Qoidalar'} value={catFormData.name} onChange={e => setCatFormData(prev => ({ ...prev, name: e.target.value }))} />
                {catErrors.name && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{catErrors.name}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">{isRu ? 'Описание раздела' : 'Bo\'lim tavsifi'}</label>
                <textarea className="input" rows={2} style={{ resize: 'none' }} placeholder={isRu ? 'Описание...' : 'Tavsif...'} value={catFormData.description} onChange={e => setCatFormData(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              {catErrors.api && <div style={{ color: 'var(--red-400)', fontSize: 13 }}>{catErrors.api}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(false)} disabled={catSubmitting}>
                  {isRu ? 'Отмена' : 'Bekor qilish'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={catSubmitting}>
                  {catSubmitting ? (isRu ? 'Сохранение...' : 'Saqlanmoqda...') : (isRu ? 'Создать' : 'Yaratish')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Category Edit Modal */}
      {isEditCategoryModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card modal-animate" style={{ width: '100%', maxWidth: 500, background: 'var(--bg-2)', border: '1px solid var(--border-3)', padding: 28, position: 'relative' }}>
            <button onClick={() => setIsEditCategoryModalOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
              {isRu ? 'Редактировать раздел' : 'Bo\'limni tahrirlash'}
            </h2>
            <form onSubmit={handleUpdateCategory} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">{isRu ? 'Язык раздела *' : 'Bo\'lim tili *'}</label>
                <select className="input" value={editCatFormData.language} onChange={e => setEditCatFormData(prev => ({ ...prev, language: e.target.value }))}>
                  <option value="uz">O'zbekcha (UZ)</option>
                  <option value="ru">Русский (RU)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">{isRu ? 'Название раздела *' : 'Bo\'lim nomi *'}</label>
                <input type="text" className="input" placeholder="Nomi" value={editCatFormData.name} onChange={e => setEditCatFormData(prev => ({ ...prev, name: e.target.value }))} />
                {editCatErrors.name && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{editCatErrors.name}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">{isRu ? 'Описание раздела' : 'Bo\'lim tavsifi'}</label>
                <textarea className="input" rows={2} style={{ resize: 'none' }} placeholder="Tavsif" value={editCatFormData.description} onChange={e => setEditCatFormData(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              {editCatErrors.api && <div style={{ color: 'var(--red-400)', fontSize: 13 }}>{editCatErrors.api}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditCategoryModalOpen(false)} disabled={editCatSubmitting}>
                  {isRu ? 'Отмена' : 'Bekor qilish'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={editCatSubmitting}>
                  {editCatSubmitting ? (isRu ? 'Сохранение...' : 'Saqlanmoqda...') : (isRu ? 'Saqlash' : 'Saqlash')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Book Create Modal */}
      {isBookModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, overflowY: 'auto' }}>
          <div className="card modal-animate" style={{ width: '100%', maxWidth: 550, background: 'var(--bg-2)', border: '1px solid var(--border-3)', padding: 28, position: 'relative' }}>
            <button onClick={() => setIsBookModalOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
              {isRu ? 'Добавить книгу / документ' : 'Yangi kitob / hujjat qo\'shish'}
            </h2>
            <form onSubmit={handleCreateBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">{isRu ? 'Название документа *' : 'Hujjat nomi *'}</label>
                <input type="text" className="input" placeholder={isRu ? 'Название' : 'Nomi'} value={bookFormData.title} onChange={e => setBookFormData(prev => ({ ...prev, title: e.target.value }))} />
                {bookErrors.title && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{bookErrors.title}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">{isRu ? 'Описание документа' : 'Hujjat tavsifi'}</label>
                <textarea className="input" rows={2} style={{ resize: 'none' }} placeholder={isRu ? 'Описание...' : 'Tavsif...'} value={bookFormData.description} onChange={e => setBookFormData(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">{isRu ? 'Раздел *' : 'Bo\'lim *'}</label>
                  <select className="input" value={bookFormData.category} onChange={e => setBookFormData(prev => ({ ...prev, category: e.target.value }))}>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name} ({cat.language.toUpperCase()})</option>
                    ))}
                  </select>
                  {bookErrors.category && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{bookErrors.category}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">{isRu ? 'Формат *' : 'Format *'}</label>
                  <select className="input" value={bookFormData.type} onChange={e => setBookFormData(prev => ({ ...prev, type: e.target.value }))}>
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                    <option value="XLSX">XLSX</option>
                    <option value="PPTX">PPTX</option>
                  </select>
                </div>
              </div>

              {/* File Upload Field */}
              <div className="input-group">
                <label className="input-label">{isRu ? 'Файл документа *' : 'Hujjat fayli *'}</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                    {uploadingFile ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    {isRu ? 'Выбрать файл' : 'Faylni tanlash'}
                    <input type="file" accept=".pdf,.docx,.xlsx,.pptx" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, false)} disabled={uploadingFile} />
                  </label>
                  {bookFormData.size && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {isRu ? `Файл готов (${bookFormData.size})` : `Fayl tayyor (${bookFormData.size})`}
                    </span>
                  )}
                </div>
                {uploadError && <span style={{ color: 'var(--red-400)', fontSize: 12, marginTop: 4, display: 'block' }}>{uploadError}</span>}
              </div>

              <div className="input-group">
                <label className="input-label">{isRu ? 'Ссылка на файл *' : 'Fayl havolasi (URL) *'}</label>
                <input type="text" className="input" placeholder="Havola" value={bookFormData.url} onChange={e => setBookFormData(prev => ({ ...prev, url: e.target.value }))} />
                {bookErrors.url && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{bookErrors.url}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">{isRu ? 'Размер файла' : 'Fayl hajmi'}</label>
                  <input type="text" className="input" placeholder="Masalan: 2.4 MB" value={bookFormData.size} onChange={e => setBookFormData(prev => ({ ...prev, size: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <input type="checkbox" id="downloadable" checked={bookFormData.downloadable} onChange={e => setBookFormData(prev => ({ ...prev, downloadable: e.target.checked }))} />
                  <label htmlFor="downloadable" style={{ fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    {isRu ? 'Разрешить скачивание' : 'Yuklab olishga ruxsat berish'}
                  </label>
                </div>
              </div>

              {bookErrors.api && <div style={{ color: 'var(--red-400)', fontSize: 13 }}>{bookErrors.api}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsBookModalOpen(false)} disabled={bookSubmitting}>
                  {isRu ? 'Отмена' : 'Bekor qilish'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={bookSubmitting || uploadingFile}>
                  {bookSubmitting ? (isRu ? 'Сохранение...' : 'Saqlanmoqda...') : (isRu ? 'Создать' : 'Yaratish')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Book Edit Modal */}
      {isEditBookModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, overflowY: 'auto' }}>
          <div className="card modal-animate" style={{ width: '100%', maxWidth: 550, background: 'var(--bg-2)', border: '1px solid var(--border-3)', padding: 28, position: 'relative' }}>
            <button onClick={() => setIsEditBookModalOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
              {isRu ? 'Редактировать документ' : 'Hujjatni tahrirlash'}
            </h2>
            <form onSubmit={handleUpdateBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">{isRu ? 'Название документа *' : 'Hujjat nomi *'}</label>
                <input type="text" className="input" placeholder="Nomi" value={editBookFormData.title} onChange={e => setEditBookFormData(prev => ({ ...prev, title: e.target.value }))} />
                {editBookErrors.title && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{editBookErrors.title}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">{isRu ? 'Описание документа' : 'Hujjat tavsifi'}</label>
                <textarea className="input" rows={2} style={{ resize: 'none' }} placeholder="Tavsif" value={editBookFormData.description} onChange={e => setEditBookFormData(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">{isRu ? 'Раздел *' : 'Bo\'lim *'}</label>
                  <select className="input" value={editBookFormData.category} onChange={e => setEditBookFormData(prev => ({ ...prev, category: e.target.value }))}>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name} ({cat.language.toUpperCase()})</option>
                    ))}
                  </select>
                  {editBookErrors.category && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{editBookErrors.category}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">{isRu ? 'Формат *' : 'Format *'}</label>
                  <select className="input" value={editBookFormData.type} onChange={e => setEditBookFormData(prev => ({ ...prev, type: e.target.value }))}>
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                    <option value="XLSX">XLSX</option>
                    <option value="PPTX">PPTX</option>
                  </select>
                </div>
              </div>

              {/* File Upload Field */}
              <div className="input-group">
                <label className="input-label">{isRu ? 'Файл документа' : 'Hujjat fayli'}</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                    {uploadingFile ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    {isRu ? 'Выбрать новый файл' : 'Yangi faylni tanlash'}
                    <input type="file" accept=".pdf,.docx,.xlsx,.pptx" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, true)} disabled={uploadingFile} />
                  </label>
                  {editBookFormData.size && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {isRu ? `Файл готов (${editBookFormData.size})` : `Fayl tayyor (${editBookFormData.size})`}
                    </span>
                  )}
                </div>
                {uploadError && <span style={{ color: 'var(--red-400)', fontSize: 12, marginTop: 4, display: 'block' }}>{uploadError}</span>}
              </div>

              <div className="input-group">
                <label className="input-label">{isRu ? 'Ссылка на файл *' : 'Fayl havolasi (URL) *'}</label>
                <input type="text" className="input" placeholder="Havola" value={editBookFormData.url} onChange={e => setEditBookFormData(prev => ({ ...prev, url: e.target.value }))} />
                {editBookErrors.url && <span style={{ color: 'var(--red-400)', fontSize: 12 }}>{editBookErrors.url}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">{isRu ? 'Размер файла' : 'Fayl hajmi'}</label>
                  <input type="text" className="input" placeholder="Hajmi" value={editBookFormData.size} onChange={e => setEditBookFormData(prev => ({ ...prev, size: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <input type="checkbox" id="edit-downloadable" checked={editBookFormData.downloadable} onChange={e => setEditBookFormData(prev => ({ ...prev, downloadable: e.target.checked }))} />
                  <label htmlFor="edit-downloadable" style={{ fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    {isRu ? 'Разрешить скачивание' : 'Yuklab olishga ruxsat berish'}
                  </label>
                </div>
              </div>

              {editBookErrors.api && <div style={{ color: 'var(--red-400)', fontSize: 13 }}>{editBookErrors.api}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditBookModalOpen(false)} disabled={editBookSubmitting}>
                  {isRu ? 'Отмена' : 'Bekor qilish'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={editBookSubmitting || uploadingFile}>
                  {editBookSubmitting ? (isRu ? 'Сохранение...' : 'Saqlanmoqda...') : (isRu ? 'Saqlash' : 'Saqlash')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
