import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Product } from '../../lib/api';
import { Loader2, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Upload, Palette } from 'lucide-react';

export const Products: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [category, setCategory] = useState('');
  const [inStock, setInStock] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  
  // Custom Swatch State
  const [colors, setColors] = useState<Array<{ label: string; hex: string }>>([]);
  const [newColorLabel, setNewColorLabel] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authenticate Admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await api.products.list();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setCategory('');
    setInStock(true);
    setImages([]);
    setSelectedSizes([]);
    setColors([]);
    setNewColorLabel('');
    setNewColorHex('#000000');
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name_fr);
    setDescription(product.description_fr || '');
    setPrice(product.price.toString());
    setDiscountPrice(product.discount_price ? product.discount_price.toString() : '');
    setCategory(product.category || '');
    setInStock(product.in_stock);
    setImages(product.images || []);
    setSelectedSizes(product.sizes || []);
    setColors(product.colors || []);
    setIsModalOpen(true);
  };

  const handleToggleStock = async (id: string) => {
    try {
      await api.products.toggleStock(id);
      fetchProducts(); // reload
    } catch (err: any) {
      alert(err.message || 'Failed to toggle stock status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit ? This action is permanent.')) {
      return;
    }
    try {
      await api.products.delete(id);
      fetchProducts(); // reload
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 3) {
      alert('Vous pouvez téléverser un maximum de 3 images.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await api.upload.image(file);
      setImages((prev) => [...prev, res.url]);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const addColorSwatch = () => {
    if (!newColorLabel.trim()) {
      alert('Veuillez entrer un libellé pour la couleur.');
      return;
    }
    // Check duplication
    if (colors.some((c) => c.label.toLowerCase() === newColorLabel.trim().toLowerCase())) {
      alert('Cette couleur existe déjà.');
      return;
    }
    setColors((prev) => [...prev, { label: newColorLabel.trim(), hex: newColorHex }]);
    setNewColorLabel('');
    setNewColorHex('#000000');
  };

  const removeColorSwatch = (indexToRemove: number) => {
    setColors((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price || isNaN(Number(price))) {
      alert('Veuillez remplir les champs obligatoires (Nom et Prix).');
      return;
    }

    const payload: Partial<Product> = {
      name_en: name.trim(),
      name_fr: name.trim(),
      description_en: description.trim() || undefined,
      description_fr: description.trim() || undefined,
      price: Number(price),
      discount_price: discountPrice ? Number(discountPrice) : null,
      category: category.trim() || undefined,
      images,
      sizes: selectedSizes,
      colors,
      in_stock: inStock,
    };

    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, payload);
      } else {
        await api.products.create(payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        <p className="text-brand-gray text-sm">Vérification de la session...</p>
      </div>
    );
  }

  const sizesOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8 md:px-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-white">
            {t('admin.products_title')}
          </h1>
          <p className="text-brand-gray text-xs mt-1">
            Gérez vos t-shirts, modifiez les stocks, et ajoutez de nouveaux modèles.
          </p>
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-orange/15"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.add_product')}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Loading list state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
          <p className="text-brand-gray text-sm">Chargement des produits...</p>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
          {products.length === 0 ? (
            <div className="text-center py-16 text-brand-gray text-sm">
              Aucun produit trouvé. Cliquez sur "Ajouter un produit" pour commencer.
            </div>
          ) : (
            <>
              {/* Desktop Table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-brand-border text-brand-gray font-semibold text-xs uppercase bg-neutral-900/10">
                      <th className="py-4 px-6">Visuel</th>
                      <th className="py-4 px-6">Produit</th>
                      <th className="py-4 px-6">Prix</th>
                      <th className="py-4 px-6">Catégorie</th>
                      <th className="py-4 px-6">Stock</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {products.map((product) => {
                      const thumbUrl = product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=150&auto=format&fit=crop';
                      return (
                        <tr key={product.id} className="hover:bg-neutral-900/20 transition-colors">
                          {/* Thumbnail */}
                          <td className="py-4 px-6">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 border border-brand-border flex-shrink-0 flex items-center justify-center">
                              <img src={thumbUrl} alt={product.name_fr} className="w-full h-full object-cover" />
                            </div>
                          </td>
                          
                          {/* Title */}
                          <td className="py-4 px-6">
                            <span className="font-semibold text-white">{product.name_fr}</span>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-6 font-bold text-white">
                            {product.discount_price ? (
                              <div className="flex flex-col">
                                <span className="text-brand-orange">{product.discount_price.toLocaleString()} DZD</span>
                                <span className="text-xs text-brand-gray line-through font-normal">{product.price.toLocaleString()} DZD</span>
                              </div>
                            ) : (
                              <span>{product.price.toLocaleString()} DZD</span>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-4 px-6 text-brand-gray capitalize">
                            {product.category || '--'}
                          </td>

                          {/* Stock status toggle */}
                          <td className="py-4 px-6">
                            <button
                              type="button"
                              onClick={() => handleToggleStock(product.id)}
                              className="flex items-center gap-1.5 cursor-pointer text-xs"
                              title="Cliquez pour changer le statut du stock"
                            >
                              {product.in_stock ? (
                                <>
                                  <ToggleRight className="w-6 h-6 text-green-500" />
                                  <span className="text-green-400 font-medium">Disponible</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-6 h-6 text-red-500" />
                                  <span className="text-red-400 font-medium">Rupture</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => openEditModal(product)}
                                className="p-1.5 rounded-lg border border-brand-border hover:border-brand-orange text-brand-gray hover:text-white transition-all cursor-pointer"
                                title={t('admin.edit')}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-1.5 rounded-lg border border-brand-border hover:border-red-500 text-brand-gray hover:text-red-400 transition-all cursor-pointer"
                                title={t('admin.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card view */}
              <div className="md:hidden flex flex-col divide-y divide-brand-border">
                {products.map((product) => {
                  const thumbUrl = product.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=150&auto=format&fit=crop';
                  return (
                    <div key={product.id} className="p-4 flex gap-4 items-center">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-900 border border-brand-border flex-shrink-0 flex items-center justify-center">
                        <img src={thumbUrl} alt={product.name_fr} className="w-full h-full object-cover" />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-grow flex flex-col gap-1 min-w-0">
                        <span className="font-semibold text-white truncate text-sm">{product.name_fr}</span>
                        <div className="flex items-baseline gap-2">
                          {product.discount_price ? (
                            <>
                              <span className="text-brand-orange font-bold text-sm">{product.discount_price.toLocaleString()} DZD</span>
                              <span className="text-xs text-brand-gray line-through">{product.price.toLocaleString()} DZD</span>
                            </>
                          ) : (
                            <span className="text-white font-bold text-sm">{product.price.toLocaleString()} DZD</span>
                          )}
                        </div>
                        {product.category && (
                          <span className="text-[10px] text-brand-gray capitalize bg-neutral-900/50 px-2 py-0.5 rounded border border-brand-border/40 w-fit">
                            {product.category}
                          </span>
                        )}
                      </div>

                      {/* Actions / Stock */}
                      <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(product.id)}
                          className="cursor-pointer"
                        >
                          {product.in_stock ? (
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold rounded-lg uppercase">En Stock</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold rounded-lg uppercase">Rupture</span>
                          )}
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-lg border border-brand-border text-brand-gray hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 rounded-lg border border-brand-border text-brand-gray hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/85 backdrop-blur-[4px]">
          <div className="relative w-full max-w-2xl bg-brand-card rounded-2xl border border-brand-border shadow-2xl overflow-hidden h-full max-h-[95vh] sm:max-h-[90vh] flex flex-col my-4 sm:my-8 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-brand-border">
              <h3 className="text-white font-heading font-bold text-lg">
                {editingProduct ? 'Modifier le produit' : 'Créer un nouveau produit'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-brand-gray hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
              
              {/* Product Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-brand-gray">Nom du produit / Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: T-shirt Vintage"
                  className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-4 py-2.5 text-white transition-all outline-none text-sm"
                />
              </div>

              {/* Price, Promo Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-brand-gray">{t('product_form.price')} *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 2200"
                    className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-4 py-2.5 text-white transition-all outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-brand-gray">Prix Promo / Discount Price (Optional)</label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="Ex: 1800"
                    className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-4 py-2.5 text-white transition-all outline-none text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-brand-gray">{t('product_form.category')}</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Vintage, Sport, Custom"
                    className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-4 py-2.5 text-white transition-all outline-none text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-brand-gray">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du produit..."
                  className="w-full bg-brand-dark border border-brand-border focus:border-brand-orange rounded-xl px-4 py-2.5 text-white transition-all outline-none text-sm resize-none"
                />
              </div>

              {/* Image Upload Block */}
              <div className="flex flex-col gap-2 border-t border-brand-border pt-4">
                <label className="text-xs font-semibold text-brand-gray">{t('product_form.images')}</label>
                
                <div className="flex flex-wrap gap-4 mt-2">
                  {/* Image previews */}
                  {images.map((imgUrl, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-brand-border bg-neutral-900 flex items-center justify-center">
                      <img src={imgUrl} alt={`Uploaded preview ${index}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Trigger Box */}
                  {images.length < 3 && (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-brand-border hover:border-brand-orange flex flex-col items-center justify-center text-brand-gray hover:text-white transition-all cursor-pointer bg-brand-dark disabled:bg-neutral-800"
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 text-brand-orange animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span className="text-[9px] mt-1">Upload</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Sizes Selector */}
              <div className="flex flex-col gap-2 border-t border-brand-border pt-4">
                <label className="text-xs font-semibold text-brand-gray mb-1">{t('product_form.sizes')}</label>
                <div className="flex flex-wrap gap-3">
                  {sizesOptions.map((size) => {
                    const isChecked = selectedSizes.includes(size);
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isChecked
                            ? 'bg-brand-orange border-brand-orange text-white'
                            : 'bg-brand-dark border-brand-border text-brand-gray hover:border-brand-gray'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors Swatches Creator */}
              <div className="flex flex-col gap-3 border-t border-brand-border pt-4">
                <label className="text-xs font-semibold text-brand-gray flex items-center gap-1">
                  <Palette className="w-4 h-4 text-brand-orange" />
                  <span>{t('product_form.colors')}</span>
                </label>
                
                {/* Active Swatches List */}
                <div className="flex flex-wrap gap-2.5 mb-2">
                  {colors.map((color, idx) => (
                    <div
                      key={`${color.label}-${idx}`}
                      className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-brand-dark border border-brand-border text-xs text-white"
                    >
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} />
                      <span>{color.label}</span>
                      <button
                        type="button"
                        onClick={() => removeColorSwatch(idx)}
                        className="p-0.5 rounded-full text-brand-gray hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Swatch Creator Inputs */}
                <div className="flex flex-col sm:flex-row items-end gap-3 bg-brand-dark p-4 rounded-xl border border-brand-border">
                  <div className="flex-grow flex flex-col gap-1.5 w-full">
                    <span className="text-[10px] text-brand-gray">{t('product_form.color_label')}</span>
                    <input
                      type="text"
                      value={newColorLabel}
                      onChange={(e) => setNewColorLabel(e.target.value)}
                      placeholder="Ex: Noir Vintage, Blanc"
                      className="bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-white outline-none text-xs w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-[70px]">
                    <span className="text-[10px] text-brand-gray">{t('product_form.color_hex')}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        className="w-8 h-8 rounded border-0 outline-none cursor-pointer bg-transparent"
                      />
                      <span className="text-[10px] font-mono text-white">{newColorHex}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addColorSwatch}
                    className="px-3.5 py-2 bg-brand-card hover:bg-neutral-800 border border-brand-border text-white text-xs font-bold rounded-lg cursor-pointer flex-shrink-0"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* In Stock Status Toggle */}
              <div className="flex items-center justify-between border-t border-brand-border pt-4 mt-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-white">{t('product_form.in_stock')}</span>
                  <span className="text-[10px] text-brand-gray">Rendre le produit disponible à la vente</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInStock(!inStock)}
                  className="cursor-pointer"
                >
                  {inStock ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-brand-gray" />
                  )}
                </button>
              </div>

              {/* Form Actions (Sticky at bottom) */}
              <div className="border-t border-brand-border pt-6 mt-4 flex gap-3 justify-end sticky bottom-0 bg-brand-card pb-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-neutral-900 border border-brand-border hover:border-brand-gray text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-brand-orange/15"
                >
                  {editingProduct ? t('product_form.submit_update') : t('product_form.submit_create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
