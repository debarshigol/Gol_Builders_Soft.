'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Product } from '@/types';
import {
  X,
  Plus,
  Package,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  FileText,
  Copy,
  Check,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const { addProduct, bulkAddProducts, products } = useApp();

  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single Item Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cement & Binders');
  const [price, setPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('Bag');
  const [imageEmoji, setImageEmoji] = useState('🏛️');
  const [error, setError] = useState('');

  // Bulk Upload State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<Array<Omit<Product, 'id'> & { isValid: boolean; isDuplicate?: boolean; errorMsg?: string }>>([]);
  const [bulkError, setBulkError] = useState<string>('');
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const existingCategories = Array.from(new Set(products.map(p => p.category)));
  const emojiOptions = ['🏛️', '🧱', '🏗️', '⚙️', '⏳', '🏖️', '🪨', '⏹️', '🪣', '⛓️', '🚰', '📐', '🛠️', '🪵', '📦'];

  // Single Product Submit
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a product name.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('Please enter a valid selling price.');
      return;
    }
    if (stock === '' || Number(stock) < 0) {
      setError('Please enter initial stock quantity.');
      return;
    }

    const generatedSku = sku.trim() || `SKU-${Date.now().toString().slice(-6)}`;

    addProduct({
      name: name.trim(),
      category,
      price: Number(price),
      costPrice: Number(costPrice) || Number(price) * 0.75,
      stock: Number(stock),
      sku: generatedSku,
      unit,
      imageEmoji,
    });

    resetSingleForm();
    onClose();
  };

  const resetSingleForm = () => {
    setName('');
    setPrice('');
    setCostPrice('');
    setStock('');
    setSku('');
    setError('');
  };

  const sampleCsvContent = `Product Name,Category,Selling Price (INR),Cost Price (INR),Initial Stock,Unit,SKU / Barcode,Emoji Icon
110mm PVC Drainage Pipe 6m,Pipes & Fittings,480,360,50,Length,SKU-PVC-110,🛠️
Brass Ball Valve 1/2 inch,Pipes & Fittings,220,160,120,Piece,SKU-VAL-050,🚰
CPVC Solvent Cement 250ml,Adhesives & Sealants,180,130,75,Can,SKU-ADH-CPVC250,🧪
SS Drain Strainer 4 inch,Kitchen & Bath,150,90,100,Piece,SKU-SNK-STR04,🪠
Teflon Thread Seal Tape 12mm,Hardware & Accessories,25,12,500,Roll,SKU-TAP-TEF12,🧵
Water Storage Tank 1000L,Water Storage,7500,5800,15,Unit,SKU-TNK-1000L,🪣
Submersible Cable 4.0 sq mm,Electrical & Wiring,120,95,300,Meter,SKU-CBL-SUB40,⚡
GI Binding Wire 12 Gauge,Hardware & Accessories,110,85,200,Kg,SKU-WIR-GI12,🪛
Submersible Water Pump 1.5 HP,Pumps & Motors,8500,6800,10,Unit,SKU-PMP-15HP,⚙️
HDPE Pipe 63mm PN6 (Coil),Pipes & Fittings,6200,4900,8,Coil,SKU-HDPE-63PN6,🌀
Chrome Plated Bib Cock Tap,Kitchen & Bath,450,320,40,Piece,SKU-TAP-CPBIB,🚿`;

  // Copy Template CSV Data to Clipboard
  const handleCopyTemplateText = () => {
    navigator.clipboard.writeText(sampleCsvContent);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Helper to robustly parse a CSV line without breaking on spaces inside fields
  const parseCsvLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ''));
    return result;
  };

  // Helper to validate & detect duplicate products against store inventory and intra-CSV duplicates
  const validateAndSetParsedProducts = (rawItems: Array<Omit<Product, 'id'>>) => {
    const existingNameSet = new Set(products.map(p => p.name.trim().toLowerCase()));
    const existingSkuSet = new Set(products.map(p => (p.sku ? p.sku.trim().toLowerCase() : '')));

    const csvNameCounts = new Map<string, number>();
    const csvSkuCounts = new Map<string, number>();

    rawItems.forEach(item => {
      const nKey = item.name.trim().toLowerCase();
      const sKey = item.sku ? item.sku.trim().toLowerCase() : '';
      if (nKey) csvNameCounts.set(nKey, (csvNameCounts.get(nKey) || 0) + 1);
      if (sKey) csvSkuCounts.set(sKey, (csvSkuCounts.get(sKey) || 0) + 1);
    });

    const parsed = rawItems.map(item => {
      let isValid = true;
      let isDuplicate = false;
      let errorMsg = '';

      const nKey = item.name.trim().toLowerCase();
      const sKey = item.sku ? item.sku.trim().toLowerCase() : '';

      if (!item.name || !item.name.trim()) {
        isValid = false;
        errorMsg = 'Missing Product Name';
      } else if (isNaN(item.price) || item.price <= 0) {
        isValid = false;
        errorMsg = 'Invalid Selling Price';
      } else if (isNaN(item.stock) || item.stock < 0) {
        isValid = false;
        errorMsg = 'Invalid Stock Quantity';
      } else if (existingNameSet.has(nKey)) {
        isValid = false;
        isDuplicate = true;
        errorMsg = 'Duplicate product name in inventory';
      } else if (sKey && existingSkuSet.has(sKey)) {
        isValid = false;
        isDuplicate = true;
        errorMsg = `Duplicate SKU (${item.sku}) in inventory`;
      } else if (nKey && (csvNameCounts.get(nKey) || 0) > 1) {
        isValid = false;
        isDuplicate = true;
        errorMsg = 'Duplicate product name in CSV file';
      } else if (sKey && (csvSkuCounts.get(sKey) || 0) > 1) {
        isValid = false;
        isDuplicate = true;
        errorMsg = `Duplicate SKU (${item.sku}) in CSV file`;
      }

      return {
        ...item,
        isValid,
        isDuplicate,
        errorMsg,
      };
    });

    setParsedProducts(parsed);
  };

  // Delete a single row from parsed preview list and re-evaluate
  const handleDeleteRow = (indexToDelete: number) => {
    const updatedRaw = parsedProducts
      .filter((_, i) => i !== indexToDelete)
      .map(p => ({
        name: p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice,
        stock: p.stock,
        unit: p.unit,
        sku: p.sku,
        imageEmoji: p.imageEmoji,
      }));
    validateAndSetParsedProducts(updatedRaw);
  };

  // Remove all duplicate rows with one click
  const handleRemoveAllDuplicates = () => {
    const nonDuplicateRaw = parsedProducts
      .filter(p => !p.isDuplicate)
      .map(p => ({
        name: p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice,
        stock: p.stock,
        unit: p.unit,
        sku: p.sku,
        imageEmoji: p.imageEmoji,
      }));
    validateAndSetParsedProducts(nonDuplicateRaw);
  };

  // Parse CSV File on Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setBulkError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setBulkError('The uploaded file is empty.');
          return;
        }

        // Parse CSV lines
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) {
          setBulkError('No product data rows found in the uploaded file.');
          return;
        }

        // Header column detection
        const headerCols = parseCsvLine(lines[0]).map(h => h.toLowerCase());
        
        let nameIdx = headerCols.findIndex(h => h.includes('name') || h.includes('item') || h.includes('product'));
        let catIdx = headerCols.findIndex(h => h.includes('cat'));
        let priceIdx = headerCols.findIndex(h => h.includes('sell') || (h.includes('price') && !h.includes('cost')));
        let costPriceIdx = headerCols.findIndex(h => h.includes('cost'));
        let stockIdx = headerCols.findIndex(h => h.includes('stock') || h.includes('qty') || h.includes('quantity'));
        let unitIdx = headerCols.findIndex(h => h.includes('unit'));
        let skuIdx = headerCols.findIndex(h => h.includes('sku') || h.includes('code') || h.includes('barcode'));
        let emojiIdx = headerCols.findIndex(h => h.includes('emoji') || h.includes('icon'));

        if (nameIdx === -1) nameIdx = 0;
        if (catIdx === -1) catIdx = 1;
        if (priceIdx === -1) priceIdx = 2;
        if (costPriceIdx === -1) costPriceIdx = 3;
        if (stockIdx === -1) stockIdx = 4;
        if (unitIdx === -1) unitIdx = 5;
        if (skuIdx === -1) skuIdx = 6;
        if (emojiIdx === -1) emojiIdx = 7;

        const rawItems: Array<Omit<Product, 'id'>> = [];

        for (let i = 1; i < lines.length; i++) {
          const rowText = lines[i];
          if (!rowText.trim()) continue;

          const cleanCols = parseCsvLine(rowText);

          const pName = cleanCols[nameIdx] || '';
          const pCat = cleanCols[catIdx] || 'Building Supplies';
          const pPrice = parseFloat(cleanCols[priceIdx]);
          const pCostPrice = parseFloat(cleanCols[costPriceIdx]);
          const pStock = parseInt(cleanCols[stockIdx], 10);
          const pUnit = cleanCols[unitIdx] || 'Pcs';
          const pSku = cleanCols[skuIdx] || `SKU-${Date.now().toString().slice(-6)}-${i}`;
          const pEmoji = cleanCols[emojiIdx] || '📦';

          rawItems.push({
            name: pName,
            category: pCat,
            price: isNaN(pPrice) ? 0 : pPrice,
            costPrice: isNaN(pCostPrice) ? (isNaN(pPrice) ? 0 : pPrice * 0.75) : pCostPrice,
            stock: isNaN(pStock) ? 0 : pStock,
            unit: pUnit,
            sku: pSku,
            imageEmoji: pEmoji,
          });
        }

        validateAndSetParsedProducts(rawItems);
      } catch (err) {
        setBulkError('Failed to parse CSV file. Please ensure it follows the template format.');
      }
    };
    reader.readAsText(file);
  };

  // Confirm Bulk Import
  const handleConfirmBulkImport = () => {
    const validItems = parsedProducts.filter(p => p.isValid);
    if (validItems.length === 0) {
      setBulkError('No valid items found to import.');
      return;
    }

    const itemsToImport: Array<Omit<Product, 'id'>> = validItems.map(p => ({
      name: p.name,
      category: p.category,
      price: p.price,
      costPrice: p.costPrice,
      stock: p.stock,
      unit: p.unit,
      sku: p.sku,
      imageEmoji: p.imageEmoji,
    }));

    bulkAddProducts(itemsToImport);

    // Reset Bulk State & Close Modal
    setBulkFile(null);
    setParsedProducts([]);
    setBulkError('');
    onClose();
  };

  const validParsedCount = parsedProducts.filter(p => p.isValid).length;
  const duplicateCount = parsedProducts.filter(p => p.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="glass-modal rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp text-slate-100 border border-slate-700/60">
        
        {/* Modal Header & Navigation Tabs */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Items to Inventory</h3>
              <p className="text-xs text-slate-400">Choose single item entry or bulk Excel/CSV file upload</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2 flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'single'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Single Product Add</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'bulk'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Excel / CSV Upload</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono uppercase">
              NEW
            </span>
          </button>
        </div>

        {/* 1. SINGLE PRODUCT ADD FORM */}
        {activeTab === 'single' && (
          <form onSubmit={handleSingleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-xl">
                {error}
              </div>
            )}

            {/* Emoji & Product Name */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3">
                <label className="block text-xs font-bold text-slate-300 mb-1">Icon</label>
                <select
                  value={imageEmoji}
                  onChange={e => setImageEmoji(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-xl focus:outline-none focus:border-indigo-500"
                >
                  {emojiOptions.map(emoji => (
                    <option key={emoji} value={emoji}>
                      {emoji}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-9">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Product Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. UltraTech Weather Plus Cement 50kg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Category & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {existingCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="General Building Material">General Building Material</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Unit Type</label>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Bag">Bag</option>
                  <option value="Ton">Ton</option>
                  <option value="Brass">Brass</option>
                  <option value="1000 Pcs">1000 Pcs</option>
                  <option value="Pcs">Pcs</option>
                  <option value="kg">kg</option>
                  <option value="Bucket">Bucket</option>
                  <option value="Length">Length</option>
                  <option value="Meter">Meter</option>
                  <option value="Sheet">Sheet</option>
                </select>
              </div>
            </div>

            {/* Selling Price, Cost Price, Stock */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Selling Price (₹) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="380"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cost Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="310"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Initial Stock <span className="text-amber-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={e => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="150"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* SKU Code (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                SKU Barcode / Code <span className="text-slate-500 font-normal">(Auto-generated if empty)</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. SKU-CEM-ULTRA"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. BULK EXCEL / CSV UPLOAD FORM */}
        {activeTab === 'bulk' && (
          <div className="p-6 space-y-6">
            
            {/* Step 1: Download / Copy Template Options */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Step 1: Get Excel / CSV Template</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Download our pre-formatted template file or copy the raw CSV structure to paste directly into Excel.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Direct Static Download */}
                <a
                  href="/gol_builders_inventory_bulk_template.csv"
                  download="gol_builders_inventory_bulk_template.csv"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center space-x-2 shadow-lg shadow-amber-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .CSV File</span>
                </a>

                {/* Data URI Fallback Download */}
                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent('\uFEFF' + sampleCsvContent)}`}
                  download="gol_builders_inventory_bulk_template.csv"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Alternative Download Link</span>
                </a>

                {/* Copy Raw CSV Button */}
                <button
                  type="button"
                  onClick={handleCopyTemplateText}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
                >
                  {copiedTemplate ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  <span>{copiedTemplate ? 'Copied to Clipboard!' : 'Copy Template Data'}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Upload CSV File */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Step 2: Upload Completed File (.csv format)
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition space-y-2 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>

                {bulkFile ? (
                  <div>
                    <span className="font-bold text-white text-xs block">{bulkFile.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{(bulkFile.size / 1024).toFixed(1)} KB • Ready for preview</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-slate-200 text-xs block">Click or Drag & Drop CSV File Here</span>
                    <span className="text-[11px] text-slate-500">Supports .csv files created in Microsoft Excel, Google Sheets, or Numbers</span>
                  </div>
                )}
              </div>

              {bulkError && (
                <div className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}
            </div>

            {/* Step 3: Parsed File Preview */}
            {parsedProducts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Step 3: Preview Parsed Items ({validParsedCount} Valid of {parsedProducts.length} Total)
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Check row validation & delete any duplicates
                  </span>
                </div>

                {duplicateCount > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Found <strong>{duplicateCount} duplicate item(s)</strong> (matches existing inventory or duplicate rows in CSV).</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveAllDuplicates}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-[11px] rounded-lg transition flex items-center space-x-1 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove All Duplicates</span>
                    </button>
                  </div>
                )}

                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 font-mono">
                      <tr>
                        <th className="px-3 py-2">Item Name</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2 text-right">Price (₹)</th>
                        <th className="px-3 py-2 text-center">Stock</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {parsedProducts.map((prod, idx) => (
                        <tr
                          key={idx}
                          className={
                            prod.isValid
                              ? 'hover:bg-slate-900/50'
                              : prod.isDuplicate
                              ? 'bg-amber-500/10 hover:bg-amber-500/15'
                              : 'bg-red-500/10 hover:bg-red-500/15'
                          }
                        >
                          <td className="px-3 py-2 font-sans font-medium text-white">
                            <span className="mr-1.5">{prod.imageEmoji}</span>
                            {prod.name || '<Empty Name>'}
                          </td>
                          <td className="px-3 py-2 text-slate-400">{prod.category}</td>
                          <td className="px-3 py-2 text-right font-bold text-amber-400">₹{prod.price}</td>
                          <td className="px-3 py-2 text-center text-slate-300">{prod.stock} {prod.unit}</td>
                          <td className="px-3 py-2 text-center">
                            {prod.isValid ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                Valid
                              </span>
                            ) : prod.isDuplicate ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold" title={prod.errorMsg}>
                                Duplicate
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 font-semibold" title={prod.errorMsg}>
                                {prod.errorMsg}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded transition"
                              title="Delete this row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Import Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmBulkImport}
                disabled={validParsedCount === 0}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center space-x-2 shadow-lg shadow-amber-500/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Confirm & Import {validParsedCount} Items to Inventory</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
