"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formSizes, setFormSizes] = useState("100ml, 500ml, 1L");
  const [formAvailable, setFormAvailable] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newCat, setNewCat] = useState("groundnut");
  const [newSlug, setNewSlug] = useState("");
  const [newSizes, setNewSizes] = useState("100ml, 500ml, 1L");
  const [newAvailable, setNewAvailable] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = (p: any) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormPrice(p.price.toString());
    setFormSizes(Array.isArray(p.sizes) ? p.sizes.join(', ') : '100ml, 500ml, 1L');
    setFormAvailable(p.available !== undefined ? Boolean(p.available) : true);
    setFormFile(null);
  };

  const handleSaveProduct = async (id: number) => {
    // 1. Upload new image if exists
    let newImageUrl = null;
    if (formFile) {
       const fd = new FormData();
       fd.append('file', formFile);
       try {
         const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: fd });
         const uploadJson = await uploadRes.json();
         if (uploadJson.success) newImageUrl = uploadJson.url;
       } catch (e) {
         alert("Failed to upload image");
         return;
       }
    }

    // 2. Update DB
    const payload: any = {
      id,
      name: formName,
      price: parseInt(formPrice) || 0,
      sizes: formSizes.split(',').map((s) => s.trim()).filter(Boolean),
      available: formAvailable,
    };
    if (newImageUrl) payload.imageUrl = newImageUrl;

    try {
      await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setEditingId(null);
      fetchProducts();
    } catch (e) {
      alert("Failed to save product");
    }
  };

  const handleAddNewProduct = async () => {
    if (!formFile || !formName || !formPrice || !newSlug || !newSizes) {
      alert("Please fill all fields, include sizes, and upload an image!");
      return;
    }

    // 1. Upload Image
    const fd = new FormData();
    fd.append('file', formFile);
    const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const uploadJson = await uploadRes.json();
    
    if (!uploadJson.success) {
      alert("Image upload failed");
      return;
    }

    // 2. Add to DB
    const parsedSizes = newSizes.split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      name: formName,
      price: parseInt(formPrice) || 0,
      category: newCat,
      slug: newSlug,
      imageUrl: uploadJson.url,
      sizes: parsedSizes.length ? parsedSizes : ["100ml", "500ml", "1L"],
      available: newAvailable,
      description: "Admin added description",
      benefits: [],
      usage: "Admin added usage"
    };

    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setIsAdding(false);
      setFormFile(null);
      fetchProducts();
    } catch (e) {
      alert("Failed to add new product");
    }
  };

  return (
    <div className="p-6 md:p-10 flex-1 w-full bg-white sm:bg-transparent">
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-2xl font-bold text-foreground">Manage Products</h1>
         {!isAdding && (
           <button onClick={() => { setIsAdding(true); setFormName(""); setFormPrice("0"); setFormFile(null); }} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition shadow-md">
             + Add New Product
           </button>
         )}
      </div>

      {isAdding && (
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 mb-8 max-w-2xl border-l-4 border-l-primary">
            <h3 className="font-bold text-lg mb-4">Create New Product</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
               <div>
                 <label className="block text-sm text-neutral-500 mb-1">Product Name</label>
                 <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="e.g. Pure Almond Oil" />
               </div>
               <div>
                 <label className="block text-sm text-neutral-500 mb-1">Price (1L)</label>
                 <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full border p-2 rounded-lg" />
               </div>
               <div>
                 <label className="block text-sm text-neutral-500 mb-1">Available Sizes</label>
                 <input type="text" value={newSizes} onChange={e => setNewSizes(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="100ml, 250ml, 500ml, 1L" />
                 <p className="text-xs text-neutral-500 mt-1">Enter sizes separated by commas.</p>
               </div>
               <div>
                 <label className="block text-sm text-neutral-500 mb-1">Availability</label>
                 <div className="flex items-center gap-3">
                   <label className="flex items-center gap-2 text-sm text-neutral-600">
                     <input type="checkbox" checked={newAvailable} onChange={e => setNewAvailable(e.target.checked)} className="h-4 w-4 rounded border-neutral-300" />
                     In stock / available
                   </label>
                 </div>
               </div>
               <div>
                 <label className="block text-sm text-neutral-500 mb-1">Category / Type</label>
                 <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full border p-2 rounded-lg capitalize" />
               </div>
               <div>
                 <label className="block text-sm text-neutral-500 mb-1">URL Slug</label>
                 <input type="text" value={newSlug} onChange={e => setNewSlug(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="almond-oil" />
               </div>
               <div className="sm:col-span-2">
                 <label className="block text-sm text-neutral-500 mb-1">Upload Product Photo</label>
                 <input type="file" accept="image/*" onChange={e => setFormFile(e.target.files?.[0] || null)} className="w-full" />
               </div>
            </div>
            <div className="flex gap-4">
               <button onClick={handleAddNewProduct} className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-sm">Save New Product</button>
               <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-neutral-500 font-bold hover:bg-neutral-100 rounded-lg transition">Cancel</button>
            </div>
         </div>
      )}

      {loading ? (
         <p>Loading products...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100 flex flex-col gap-4 relative overflow-hidden group">
               {editingId === product.id ? (
                 <div className="space-y-4">
                   <h3 className="font-bold text-lg text-primary border-b pb-2">Editing: {product.name}</h3>
                   <div>
                     <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Name</label>
                     <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full border border-neutral-300 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Base Price / 1L</label>
                     <input type="number" value={formPrice} onChange={e => setFormPrice(e.target.value)} className="w-full border border-neutral-300 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Sizes</label>
                     <input type="text" value={formSizes} onChange={e => setFormSizes(e.target.value)} className="w-full border border-neutral-300 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" placeholder="100ml, 250ml, 500ml, 1L" />
                     <p className="text-xs text-neutral-500 mt-1">Enter sizes separated by commas.</p>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Availability</label>
                     <label className="flex items-center gap-2 text-sm text-neutral-600">
                       <input type="checkbox" checked={formAvailable} onChange={e => setFormAvailable(e.target.checked)} className="h-4 w-4 rounded border-neutral-300" />
                       In stock / available
                     </label>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Update Photo</label>
                     <input type="file" accept="image/*" onChange={e => setFormFile(e.target.files?.[0] || null)} className="text-sm" />
                   </div>
                   <div className="flex gap-2 pt-2">
                     <button onClick={() => handleSaveProduct(product.id)} className="flex-1 bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition shadow-sm">Save Changes</button>
                     <button onClick={() => setEditingId(null)} className="flex-1 bg-neutral-200 text-neutral-700 font-bold py-2 rounded-lg hover:bg-neutral-300 transition">Discard</button>
                   </div>
                 </div>
               ) : (
                 <>
                   <div className="w-full h-40 bg-neutral-50 rounded-xl relative overflow-hidden">
                     <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                   </div>
                   <div>
                     <div className="flex flex-wrap justify-between items-start mb-1 gap-2">
                        <h3 className="font-bold text-foreground text-lg leading-tight">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-500 text-xs rounded uppercase font-bold tracking-widest">{product.category}</span>
                          <span className={`px-2 py-1 text-xs font-bold rounded uppercase tracking-widest ${product.available === false ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {product.available === false ? 'Unavailable' : 'Available'}
                          </span>
                        </div>
                     </div>
                     <p className="text-xl font-extrabold text-secondary mt-2 mb-4">₹{product.price} <span className="text-sm text-neutral-400 font-normal">/ 1L</span></p>
                     <button onClick={() => handleEditClick(product)} className="w-full py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors">
                       Edit Product Details
                     </button>
                   </div>
                 </>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
