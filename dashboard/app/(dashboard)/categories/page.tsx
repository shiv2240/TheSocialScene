'use client';

import React, { useEffect, useState } from 'react';
import { Tag, PlusCircle, Pencil, Power, X, RefreshCw } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  active_events: number;
};

type FormState = { id?: string; name: string; slug: string; icon: string; description: string; display_order: number };
const emptyForm: FormState = { name: '', slug: '', icon: '', description: '', display_order: 100 };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/categories', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to load categories.');
      setCategories(body.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load categories.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => { setForm(emptyForm); setError(''); setModalOpen(true); };
  const openEdit = (category: Category) => {
    setForm({ id: category.id, name: category.name, slug: category.slug, icon: category.icon ?? '', description: category.description ?? '', display_order: category.display_order ?? 100 });
    setError(''); setModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { name: form.name, slug: slugify(form.slug || form.name), icon: form.icon || null, description: form.description || null, display_order: Number(form.display_order) || 100 };
      const response = await fetch('/api/categories', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to save category.');
      setModalOpen(false); await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save category.');
    } finally { setSaving(false); }
  };

  const deactivate = async (category: Category) => {
    if (!window.confirm(`Deactivate “${category.name}”? It will no longer appear as an available category.`)) return;
    setError('');
    try {
      const response = await fetch('/api/categories', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: category.id, is_active: false }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to deactivate category.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deactivate category.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Tag className="w-6 h-6 text-[#c85a3c]" /> Event Categories</h1>
          <p className="text-xs text-gray-400 mt-1">Live categories from Supabase. Only active categories are shown to users.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} disabled={loading} className="p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white disabled:opacity-50" title="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button onClick={openCreate} className="px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-bold text-white shadow-lg flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Add Category</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">{error}</div>}

      <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden">
        {loading ? <div className="p-12 text-center text-xs text-gray-500">Loading categories…</div> : categories.length === 0 ? <div className="p-12 text-center text-xs text-gray-500">No active categories configured.</div> : <div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[760px]">
          <thead><tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10"><th className="p-4">Category Name</th><th className="p-4">URL Slug</th><th className="p-4">Active Events</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-white/5 text-xs">{categories.map(category => <tr key={category.id} className="hover:bg-white/5 transition-colors">
            <td className="p-4"><p className="font-bold text-white">{category.name}</p>{category.description && <p className="text-[10px] text-gray-500 mt-1 max-w-md">{category.description}</p>}</td>
            <td className="p-4 font-mono text-[#c85a3c]">/{category.slug}</td>
            <td className="p-4 font-bold text-white">{category.active_events} {category.active_events === 1 ? 'Event' : 'Events'}</td>
            <td className="p-4"><span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">Active</span></td>
            <td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(category)} className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20" title="Edit"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => void deactivate(category)} className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-red-300 hover:border-red-500/30" title="Deactivate"><Power className="w-3.5 h-3.5" /></button></div></td>
          </tr>)}</tbody>
        </table></div>}
      </div>

      {modalOpen && <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={event => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <form onSubmit={save} className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#15141b] shadow-2xl p-6 space-y-5">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-white">{form.id ? 'Edit Category' : 'Add Category'}</h2><p className="text-xs text-gray-500 mt-1">This updates the live event taxonomy.</p></div><button type="button" onClick={() => setModalOpen(false)} className="p-2 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button></div>
          <div className="space-y-3"><label className="block text-[11px] font-bold text-gray-400 uppercase">Name<input value={form.name} onChange={e => { const name = e.target.value; setForm(current => ({ ...current, name, slug: current.slug === slugify(current.name) || !current.slug ? slugify(name) : current.slug })); }} className="field mt-1.5" required /></label><label className="block text-[11px] font-bold text-gray-400 uppercase">Slug<input value={form.slug} onChange={e => setForm(current => ({ ...current, slug: slugify(e.target.value) }))} className="field mt-1.5 font-mono" required /></label><label className="block text-[11px] font-bold text-gray-400 uppercase">Description<textarea value={form.description} onChange={e => setForm(current => ({ ...current, description: e.target.value }))} rows={3} className="field mt-1.5 resize-none" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-[11px] font-bold text-gray-400 uppercase">Icon key<input value={form.icon} onChange={e => setForm(current => ({ ...current, icon: e.target.value }))} placeholder="music, users, palette" className="field mt-1.5" /></label><label className="block text-[11px] font-bold text-gray-400 uppercase">Order<input type="number" min={0} value={form.display_order} onChange={e => setForm(current => ({ ...current, display_order: Number(e.target.value) }))} className="field mt-1.5" /></label></div></div>
          {error && <p className="text-xs text-red-300">{error}</p>}
          <div className="flex gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-300">Cancel</button><button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl gradient-terracotta text-white text-sm font-bold disabled:opacity-50">{saving ? 'Saving…' : form.id ? 'Save Changes' : 'Create Category'}</button></div>
        </form>
      </div>}

      <style jsx>{`.field{width:100%;padding:.7rem .85rem;border-radius:.75rem;background:#0f1016;border:1px solid #2a2b34;color:white;font-size:.75rem;outline:none}.field:focus{border-color:#c85a3c}`}</style>
    </div>
  );
}
