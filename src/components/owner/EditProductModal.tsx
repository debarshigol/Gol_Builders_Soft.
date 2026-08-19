'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { useApp } from '@/context/AppContext';
import { CATEGORY_STRUCTURE, transformDriveImageUrl } from './AddProductModal';
import {
  X,
  Save,
  Package,
  Tag,
  IndianRupee,
  Layers,
  Hash,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface EditProductModalProps {
  product: Product | null;
  onClose: () => void;
}

const COMMON_EMOJIS = ['📦', '🧱', '🔩', '🪛', '🪚', '🔧', '🏗️', '🪝', '🔗', '🪣', '🧰', '⚙️', '🛢️', '🏠', '🚿', '🪟', '🚪', '💡', '🔌', '🪜'];

export const EditProductModal: React.FC<EditProductModalProps> = ({ product, onClose }) => {
  const { updateProductFull } = useApp();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    subCategory: '',
    costPrice: '',
    price: '',
    stock: '',
    unit: '',
    imageEmoji: '📦',
    imageUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        subCategory: product.subCategory || '',
        costPrice: String(product.costPrice),
        price: String(product.price),
        stock: String(product.stock),
        unit: product.unit,
        imageEmoji: product.imageEmoji || '📦',
        imageUrl: product.imageUrl || '',
      });
      setSaved(false);
      setError('');
    }
  }, [product]);

  if (!product) return null;

  const categories = Object.keys(CATEGORY_STRUCTURE);
  const subCategories = form.category ? (CATEGORY_STRUCTURE[form.category] ?? []).map(s => s.name) : [];

  const costPriceNum = parseFloat(form.costPrice) || 0;
  const sellPriceNum = parseFloat(form.price) || 0;
  const margin = costPriceNum > 0 ? (((sellPriceNum - costPriceNum) / costPriceNum) * 100).toFixed(1) : null;

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) { setError('Product name is required.'); return; }
    if (!form.sku.trim()) { setError('SKU is required.'); return; }
    if (!form.category) { setError('Category is required.'); return; }
    const cp = parseFloat(form.costPrice);
    const sp = parseFloat(form.price);
    const st = parseInt(form.stock, 10);
    if (isNaN(cp) || cp < 0) { setError('Enter a valid cost price.'); return; }
    if (isNaN(sp) || sp < 0) { setError('Enter a valid selling price.'); return; }
    if (isNaN(st) || st < 0) { setError('Enter a valid stock quantity.'); return; }

    setSaving(true);
    try {
      await updateProductFull(product.id, {
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        category: form.category,
        subCategory: form.subCategory || undefined,
        costPrice: cp,
        price: sp,
        stock: st,
        unit: form.unit.trim(),
        imageEmoji: form.imageEmoji,
        imageUrl: form.imageUrl.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-modal rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-scaleUp">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 sticky top-0 glass-modal z-10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg">
              {form.imageEmoji}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Edit Product</h2>
              <p className="text-[11px] text-slate-400 font-mono">{product.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Row 1: Name + SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                <Package className="w-3 h-3" /> Product Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Ambuja OPC 53 Cement"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                <Hash className="w-3 h-3" /> SKU *
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={e => set('sku', e.target.value.toUpperCase())}
                placeholder="e.g. AMB-CEM-OPC53"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Row 2: Category + Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Category *
              </label>
              <select
                value={form.category}
                onChange={e => { set('category', e.target.value); set('subCategory', ''); }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Select Category —</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Sub-Category
              </label>
              <select
                value={form.subCategory}
                onChange={e => {
                  const sub = e.target.value;
                  set('subCategory', sub);
                  if (sub && form.category) {
                    const spec = CATEGORY_STRUCTURE[form.category]?.find(s => s.name === sub);
                    if (spec) set('unit', spec.defaultUnit);
                  }
                }}
                disabled={!form.category || subCategories.length === 0}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-40"
              >
                <option value="">— Select Sub-Category —</option>
                {subCategories.map(sub => (
                  <option key={sub} value={sub} className="bg-slate-900">{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Cost Price + Selling Price + Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                <IndianRupee className="w-3 h-3" /> Cost Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">₹</span>
                <input
                  type="number" min="0" step="any" value={form.costPrice}
                  onChange={e => set('costPrice', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                <IndianRupee className="w-3 h-3" /> Selling Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">₹</span>
                <input
                  type="number" min="0" step="any" value={form.price}
                  onChange={e => set('price', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-sm text-emerald-400 font-mono font-extrabold focus:outline-none focus:border-emerald-500"
                />
              </div>
              {margin !== null && (
                <p className={`text-[10px] font-mono mt-1 ${parseFloat(margin) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Margin: {margin}%
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Stock Qty *</label>
              <input
                type="number" min="0" value={form.stock}
                onChange={e => set('stock', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 4: Unit + Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Unit of Measure *</label>
              <input
                type="text" value={form.unit}
                onChange={e => set('unit', e.target.value)}
                placeholder="e.g. Bags, Kilograms, Pieces"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Image URL (optional)
              </label>
              <input
                type="text" value={form.imageUrl}
                onChange={e => set('imageUrl', e.target.value)}
                placeholder="https:// or Google Drive link"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Row 5: Emoji Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Product Emoji Icon</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => set('imageEmoji', emoji)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                    form.imageEmoji === emoji
                      ? 'bg-indigo-600 border-indigo-400 scale-110 shadow-md'
                      : 'bg-slate-800 border-slate-700 hover:border-indigo-500/50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center space-x-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transformDriveImageUrl(form.imageUrl)}
                alt="Preview"
                className="w-12 h-12 object-contain rounded-lg border border-slate-700"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span className="text-3xl">{form.imageEmoji}</span>
            )}
            <div>
              <p className="text-xs font-bold text-white">{form.name || 'Product Name'}</p>
              <p className="text-[10px] text-slate-400 font-mono">{form.sku || '—'} · {form.unit || 'unit'}</p>
              <p className="text-[10px] text-emerald-400 font-mono font-bold">₹{form.price || '0'}</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-800/60 sticky bottom-0 glass-modal">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition ${
              saved
                ? 'bg-emerald-600 text-white border border-emerald-500'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-lg shadow-indigo-600/20'
            } disabled:opacity-60`}
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving…</span></>
            ) : saved ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /><span>Saved!</span></>
            ) : (
              <><Save className="w-3.5 h-3.5" /><span>Save Changes</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
