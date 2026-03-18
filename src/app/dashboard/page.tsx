/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Database, LayoutGrid, Link as LinkIcon, Image as ImageIcon, 
  Search, Plus, Edit3, Trash2, X, Loader2, 
  Calendar, Folder, ExternalLink, Globe
} from 'lucide-react';

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU CHUẨN (Hết lỗi Any) ---
interface Item {
  _id: string;
  title: string;
  description: string;
  url?: string;
  imageUrl: string;
  type: 'LINK' | 'IMAGE';
  tags: string[];
  createdAt: string;
}

interface PreviewData {
  _id?: string;
  title: string;
  description: string;
  url?: string;
  imageUrl: string;
  type?: 'LINK' | 'IMAGE';
}

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([]); 
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [currentTab, setCurrentTab] = useState<'ALL' | 'LINK' | 'IMAGE'>('ALL');
  const [currentCollection, setCurrentCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
        const tags = new Set<string>();
        data.data.forEach((item: Item) => item.tags?.forEach((t) => tags.add(t)));
        setAllTags(Array.from(tags));
      }
    } catch { console.error("Lỗi lấy dữ liệu"); } 
    finally { setLoadingItems(false); }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesTab = currentTab === 'ALL' || item.type === currentTab;
      const matchesCollection = !currentCollection || item.tags?.includes(currentCollection);
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        (item.title?.toLowerCase().includes(query)) || 
        (item.description?.toLowerCase().includes(query));

      return matchesTab && matchesCollection && matchesSearch;
    });
  }, [items, currentTab, currentCollection, searchQuery]);

  const handleFetchPreview = async () => {
    if (!urlInput) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput, action: 'FETCH_PREVIEW' }),
      });
      const data = await res.json();
      if (data.success) setPreviewData(data.preview);
    } catch { alert("Lỗi kết nối"); } 
    finally { setLoadingAction(false); }
  };

  const handleSaveItem = async () => {
    if (!previewData) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...previewData, action: 'SAVE_ITEM', type: previewData.type || 'LINK' }),
      });
      const data = await res.json();
      if (data.success) { toggleModal(); fetchItems(); }
    } catch { } finally { setLoadingAction(false); }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Tuấn có chắc muốn xóa không?")) return;
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'DELETE_ITEM' }),
      });
      const data = await res.json();
      if (data.success) { fetchItems(); setSelectedItem(null); }
    } catch { }
  };

  const handleUpdateItem = async () => {
    if (!previewData) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: previewData._id || selectedItem?._id,
          action: 'UPDATE_ITEM',
          title: previewData.title,
          description: previewData.description,
        }),
      });
      const data = await res.json();
      if (data.success) { toggleModal(); fetchItems(); setSelectedItem(null); }
    } catch { } finally { setLoadingAction(false); }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setLoadingAction(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setPreviewData({ title: file.name, imageUrl: data.url, type: 'IMAGE', description: 'Uploaded image' });
      }
    } catch { } finally { setLoadingAction(false); }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    setPreviewData(null);
    setUrlInput("");
    setIsEditMode(false);
  };

  return (
    <div className="flex h-screen bg-[#F8F6F6] text-slate-900 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-6 h-full">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#ec5b13] rounded-xl flex items-center justify-center text-white shadow-lg">
            <Database className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">DataStore</span>
        </div>
        <nav className="space-y-2 flex-1 overflow-y-auto">
          <button onClick={() => {setCurrentTab('ALL'); setCurrentCollection(null)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${currentTab === 'ALL' && !currentCollection ? 'bg-[#ec5b13]/10 text-[#ec5b13]' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutGrid className="w-5 h-5" /> ALL ITEMS
          </button>
          <button onClick={() => {setCurrentTab('LINK'); setCurrentCollection(null)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${currentTab === 'LINK' ? 'bg-[#ec5b13]/10 text-[#ec5b13]' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LinkIcon className="w-5 h-5" /> LINKS
          </button>
          <button onClick={() => {setCurrentTab('IMAGE'); setCurrentCollection(null)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${currentTab === 'IMAGE' ? 'bg-[#ec5b13]/10 text-[#ec5b13]' : 'text-slate-400 hover:bg-slate-50'}`}>
            <ImageIcon className="w-5 h-5" /> IMAGES
          </button>
          <div className="pt-6 pb-2 px-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest">Collections</div>
          {allTags.map(tag => (
            <button key={tag} onClick={() => {setCurrentCollection(tag); setCurrentTab('ALL');}} className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all ${currentCollection === tag ? 'text-[#ec5b13] font-bold bg-orange-50/50' : 'text-slate-500 hover:text-[#ec5b13]'}`}>
              <Folder className="w-4 h-4" /> {tag}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        <header className="flex justify-between items-center p-10 sticky top-0 bg-[#F8F6F6]/90 backdrop-blur-md z-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Library</h1>
            <p className="text-slate-400 text-sm">Found {filteredItems.length} items</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-10 pr-4 py-2 bg-white border-none rounded-xl w-64 shadow-sm focus:ring-2 focus:ring-[#ec5b13] outline-none" 
                placeholder="Search title or desc..." 
              />
            </div>
            <button onClick={toggleModal} className="bg-[#ec5b13] text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-[#ec5b13]/20 flex items-center gap-2 hover:bg-[#d44d0f] transition-all">
              <Plus className="w-5 h-5" /> Add New Item
            </button>
          </div>
        </header>

        <div className="px-10 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loadingItems ? (
             <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-[#ec5b13]" /></div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-400">Không tìm thấy kết quả nào cho "{searchQuery}"</div>
          ) : filteredItems.map(item => (
            <article 
              key={item._id} 
              onClick={() => setSelectedItem(item)}
              className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="aspect-[4/3] bg-slate-50 rounded-[24px] mb-4 overflow-hidden relative">
                <img className="w-full h-full object-cover" src={item.imageUrl || `https://www.google.com/s2/favicons?domain=${item.url}&sz=128`} alt="thumb" />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-sm hover:bg-red-50" onClick={e => handleDelete(item._id, e)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{item.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
              <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-slate-300">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                <span className={`px-2 py-1 rounded-md uppercase ${item.type === 'LINK' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-[#ec5b13]'}`}>{item.type}</span>
              </div>
            </article>
          ))}
        </div>

        {/* SIDE PANEL */}
        {selectedItem && (
          <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20" onClick={() => setSelectedItem(null)} />
            <aside className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-30 flex flex-col border-l animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b flex justify-between items-center">
                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-50 rounded-full"><X className="w-6 h-6" /></button>
                <div className="flex gap-2">
                  <button onClick={() => {setIsEditMode(true); setPreviewData(selectedItem); setIsModalOpen(true);}} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><Edit3 className="w-5 h-5"/></button>
                  <button onClick={() => handleDelete(selectedItem._id)} className="p-2 hover:bg-red-50 rounded-full text-red-400"><Trash2 className="w-5 h-5"/></button>
                </div>
              </div>
              <div className="p-8 space-y-8 overflow-y-auto flex-1">
                <img className="w-full aspect-[4/3] object-cover rounded-[24px] shadow-md" src={selectedItem.imageUrl || `https://www.google.com/s2/favicons?domain=${selectedItem.url}&sz=128`} alt="cover" />
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{selectedItem.title}</h2>
                  {selectedItem.url && (
                    <a href={selectedItem.url} target="_blank" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200">
                      <ExternalLink className="w-5 h-5" /> Open Link
                    </a>
                  )}
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <Calendar className="w-5 h-5" /> <span>Added: {new Date(selectedItem.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedItem.url && (
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <Globe className="w-5 h-5" /> <span className="truncate">{new URL(selectedItem.url).hostname}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 pb-10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedItem.description || "No description provided."}</p>
                </div>
              </div>
            </aside>
          </>
        )}
      </main>

      {/* MODAL (ADD/EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-900">{isEditMode ? "Edit Item" : "Add New Item"}</h2>
                <button onClick={toggleModal} className="text-slate-400 hover:text-slate-600 p-2"><X className="w-8 h-8" /></button>
              </div>

              {!isEditMode && !previewData ? (
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <button onClick={() => setPreviewData({ title: '', description: '', imageUrl: '', type: 'LINK' })} className="p-8 rounded-[32px] border-2 border-slate-100 hover:border-[#ec5b13] hover:bg-orange-50/50 transition-all text-left group">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100"><LinkIcon className="text-blue-500" /></div>
                    <h3 className="font-bold text-lg">Add a Link</h3>
                    <p className="text-xs text-slate-400 mt-1">Save articles or websites.</p>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-8 rounded-[32px] border-2 border-slate-100 hover:border-[#ec5b13] hover:bg-orange-50/50 transition-all text-left group">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-100"><ImageIcon className="text-[#ec5b13]" /></div>
                    <h3 className="font-bold text-lg">Upload Image</h3>
                    <p className="text-xs text-slate-400 mt-1">Store local photos.</p>
                  </button>
                  <input type="file" hidden ref={fileInputRef} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                </div>
              ) : (
                <div className="space-y-6">
                  {previewData?.type === 'LINK' && !isEditMode && !previewData.title && (
                    <div className="flex gap-2">
                      <input value={urlInput} onChange={e => setUrlInput(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#ec5b13]" placeholder="Paste link ở đây..." />
                      <button onClick={handleFetchPreview} className="bg-slate-900 text-white px-8 rounded-2xl font-bold">Fetch</button>
                    </div>
                  )}
                  {previewData && (
                    <div className="p-6 bg-slate-50 rounded-[32px] flex gap-6 border border-slate-100">
                      <img src={previewData.imageUrl || `https://www.google.com/s2/favicons?domain=${previewData.url}&sz=128`} className="w-24 h-24 rounded-2xl object-cover shadow-sm bg-white" alt="p" />
                      <div className="flex-1 space-y-2">
                        <input value={previewData.title} onChange={(e) => setPreviewData({ ...previewData, title: e.target.value })} className="font-bold bg-transparent border-none w-full p-0 focus:ring-0 text-lg text-slate-800" placeholder="Tiêu đề..." />
                        <textarea value={previewData.description} onChange={(e) => setPreviewData({ ...previewData, description: e.target.value })} className="text-sm text-slate-400 bg-transparent border-none w-full p-0 focus:ring-0 h-20 resize-none" placeholder="Mô tả..." />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 flex justify-end gap-3">
                <button onClick={toggleModal} className="px-6 py-4 font-bold text-slate-400 hover:text-slate-600">Hủy</button>
                <button 
                  onClick={isEditMode ? handleUpdateItem : handleSaveItem} 
                  disabled={loadingAction || (!previewData?.title)}
                  className="bg-[#ec5b13] text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-[#ec5b13]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {loadingAction ? <Loader2 className="animate-spin" /> : (isEditMode ? "Cập nhật" : "Lưu vào Library")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}