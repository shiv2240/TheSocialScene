'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, CheckCircle2, FileText, Image as ImageIcon, Loader2, MapPin, Save, Ticket, Upload, Users } from 'lucide-react';

type Category = { id: string; name: string; slug?: string };
type FormData = {
  title: string; slug: string; short_description: string; description: string;
  category_id: string; cover_image: string; start_at: string; end_at: string;
  venue_name: string; venue_address: string; venue_city: string; google_maps_url: string;
  capacity: number; registration_deadline: string; price: number; currency: string;
  registration_enabled: boolean; status: 'DRAFT' | 'PUBLISHED';
};

const emptyForm: FormData = {
  title: '', slug: '', short_description: '', description: '', category_id: '', cover_image: '',
  start_at: '', end_at: '', venue_name: '', venue_address: '', venue_city: 'Bengaluru', google_maps_url: '',
  capacity: 100, registration_deadline: '', price: 0, currency: 'INR', registration_enabled: true, status: 'DRAFT',
};

function toLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function toIso(value: string) { return value ? new Date(value).toISOString() : ''; }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 180); }

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [eventId, setEventId] = useState('');

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => setForm(current => ({ ...current, [field]: value }));

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { id } = await params;
        if (!active) return;
        setEventId(id);
        const [eventResponse, categoryResponse] = await Promise.all([
          fetch(`/api/events/${id}`, { credentials: 'include', cache: 'no-store' }),
          fetch('/api/categories', { credentials: 'include', cache: 'no-store' }),
        ]);
        const eventBody = await eventResponse.json().catch(() => ({}));
        const categoryBody = await categoryResponse.json().catch(() => ({}));
        if (!eventResponse.ok) throw new Error(eventBody.error || 'Unable to load event.');
        if (!categoryResponse.ok) throw new Error(categoryBody.error || 'Unable to load categories.');
        const event = eventBody.event;
        setCategories(categoryBody.categories ?? []);
        setForm({
          title: event.title ?? '', slug: event.slug ?? '', short_description: event.short_description ?? '', description: event.description ?? '',
          category_id: event.category_id ?? '', cover_image: event.cover_image ?? '',
          start_at: toLocalInput(event.start_at), end_at: toLocalInput(event.end_at),
          venue_name: event.venue?.name ?? '', venue_address: event.venue?.address ?? '', venue_city: event.venue?.city ?? '', google_maps_url: event.venue?.google_maps_url ?? '',
          capacity: Number(event.capacity ?? 0), registration_deadline: toLocalInput(event.registration_deadline), price: Number(event.price ?? 0), currency: event.currency ?? 'INR',
          registration_enabled: Boolean(event.registration_open), status: event.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        });
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Unable to load event.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [params]);

  const uploadImage = async (file: File) => {
    setError(''); setUploading(true);
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/events/upload-image', { method: 'POST', body, credentials: 'include' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to upload image.');
      update('cover_image', result.url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to upload image.'); }
    finally { setUploading(false); }
  };

  const validate = () => {
    if (!eventId) return 'Event ID is missing.';
    if (!form.title.trim() || form.short_description.trim().length < 10 || form.description.trim().length < 20) return 'Add a title, a short summary of at least 10 characters, and a description of at least 20 characters.';
    if (!form.category_id) return 'Select an event category.';
    if (!form.cover_image && form.status === 'PUBLISHED') return 'A cover image is required before publishing.';
    if (!form.start_at || !form.end_at) return 'Start and end date/time are required.';
    if (new Date(form.end_at) <= new Date(form.start_at)) return 'End time must be after start time.';
    if (form.registration_deadline && new Date(form.registration_deadline) > new Date(form.start_at)) return 'Registration deadline cannot be after the event starts.';
    if (!form.venue_name.trim() || !form.venue_address.trim() || !form.venue_city.trim()) return 'Venue name, address and city are required.';
    if (form.capacity < 1 || form.price < 0) return 'Capacity must be at least 1 and price cannot be negative.';
    return '';
  };

  const save = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(''); setSaving(true); setSaved(false);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slug: slugify(form.slug),
          category_id: form.category_id || null,
          cover_image: form.cover_image || null,
          google_maps_url: form.google_maps_url || null,
          start_at: toIso(form.start_at), end_at: toIso(form.end_at),
          registration_deadline: form.registration_deadline ? toIso(form.registration_deadline) : null,
          currency: form.currency.toUpperCase(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to update event.');
      setSaved(true);
      setForm(current => ({ ...current, ...result.event, status: result.event?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT' }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update event.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-12 flex items-center justify-center gap-2 text-sm text-gray-400"><Loader2 className="w-5 h-5 animate-spin"/>Loading event...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/events')} className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white" title="Back to events"><ArrowLeft className="w-4 h-4"/></button>
          <div><p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Event Management</p><h1 className="text-2xl font-extrabold text-white">Edit Event</h1><p className="text-xs text-gray-400 mt-1">Changes are saved directly to the production event database.</p></div>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${form.status === 'PUBLISHED' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border-amber-500/40'}`}>{form.status}</div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs font-semibold text-red-300">{error}</div>}
      {saved && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs font-semibold text-emerald-300">Event updated successfully.</div>}

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="dashboard-card rounded-3xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-purple-400"/>Basic Information</h2>
          <input value={form.title} onChange={e => { update('title', e.target.value); if (!form.slug) update('slug', slugify(e.target.value)); }} placeholder="Event title" className="field"/>
          <input value={form.slug} onChange={e => update('slug', slugify(e.target.value))} placeholder="event-url-slug" className="field font-mono"/>
          <input value={form.short_description} onChange={e => update('short_description', e.target.value)} placeholder="Short summary" className="field"/>
          <textarea rows={8} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Full event description" className="field"/>
          <label className="text-xs text-gray-400">Category<select value={form.category_id} onChange={e => update('category_id', e.target.value)} className="field mt-2"><option value="">Select a category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        </section>

        <section className="dashboard-card rounded-3xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><ImageIcon className="w-5 h-5 text-purple-400"/>Media & Cover</h2>
          <label className="block rounded-2xl border-2 border-dashed border-gray-700 hover:border-purple-500 p-8 text-center cursor-pointer"><Upload className="w-8 h-8 mx-auto text-gray-500 mb-3"/><span className="text-sm font-bold text-gray-300">{uploading ? 'Uploading…' : 'Replace cover image'}</span><p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP · maximum 5 MB</p><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void uploadImage(file); }}/></label>
          {form.cover_image ? <div className="rounded-2xl overflow-hidden border border-gray-800"><img src={form.cover_image} alt="Event cover" className="w-full max-h-80 object-cover"/></div> : <div className="rounded-2xl border border-gray-800 p-10 text-center text-xs text-gray-500">No cover image</div>}
        </section>

        <section className="dashboard-card rounded-3xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-400"/>Schedule & Timing</h2>
          <div className="grid sm:grid-cols-2 gap-4"><label className="text-xs text-gray-400">Start<input type="datetime-local" value={form.start_at} onChange={e => update('start_at', e.target.value)} className="field mt-2"/></label><label className="text-xs text-gray-400">End<input type="datetime-local" value={form.end_at} onChange={e => update('end_at', e.target.value)} className="field mt-2"/></label></div>
          <label className="text-xs text-gray-400">Registration deadline<input type="datetime-local" value={form.registration_deadline} onChange={e => update('registration_deadline', e.target.value)} className="field mt-2"/></label>
        </section>

        <section className="dashboard-card rounded-3xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-purple-400"/>Location & Venue</h2>
          <input value={form.venue_name} onChange={e => update('venue_name', e.target.value)} placeholder="Venue name" className="field"/>
          <input value={form.venue_address} onChange={e => update('venue_address', e.target.value)} placeholder="Full venue address" className="field"/>
          <input value={form.venue_city} onChange={e => update('venue_city', e.target.value)} placeholder="City" className="field"/>
          <input value={form.google_maps_url} onChange={e => update('google_maps_url', e.target.value)} placeholder="Google Maps URL" className="field"/>
        </section>

        <section className="dashboard-card rounded-3xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-purple-400"/>Capacity & Pricing</h2>
          <label className="text-xs text-gray-400">Capacity<input type="number" min={1} value={form.capacity} onChange={e => update('capacity', Number(e.target.value))} className="field mt-2"/></label>
          <div className="grid grid-cols-2 gap-4"><label className="text-xs text-gray-400">Price<input type="number" min={0} step="1" value={form.price} onChange={e => update('price', Number(e.target.value))} className="field mt-2"/></label><label className="text-xs text-gray-400">Currency<input value={form.currency} maxLength={3} onChange={e => update('currency', e.target.value.toUpperCase())} className="field mt-2"/></label></div>
          <div className="rounded-xl bg-gray-950 border border-gray-800 p-4 text-xs text-gray-400">Registered: <span className="font-bold text-white">This value is not editable</span>. Existing registrations are preserved.</div>
        </section>

        <section className="dashboard-card rounded-3xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Ticket className="w-5 h-5 text-purple-400"/>Registration & Publishing</h2>
          <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-950 border border-gray-800 text-sm text-gray-200"><input type="checkbox" checked={form.registration_enabled} onChange={e => update('registration_enabled', e.target.checked)} className="w-4 h-4"/>Allow users to register/book this event</label>
          <label className="text-xs text-gray-400">Event status<select value={form.status} onChange={e => update('status', e.target.value as FormData['status'])} className="field mt-2"><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option></select></label>
          <p className="text-xs text-gray-500">Publishing requires a cover image. Changing the status to Draft removes the event from the public published-event feed.</p>
        </section>
      </div>

      <div className="sticky bottom-4 flex flex-col sm:flex-row justify-end gap-3 p-4 rounded-2xl bg-gray-950/95 backdrop-blur border border-gray-800 shadow-2xl">
        <button onClick={() => router.push('/events')} className="px-5 py-3 rounded-xl border border-gray-700 text-sm font-bold text-gray-300 hover:text-white">Cancel</button>
        <button disabled={saving || uploading} onClick={() => void save()} className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"><Save className="w-4 h-4"/>{saving ? 'Saving changes…' : 'Save Changes'}</button>
      </div>

      <style jsx>{`.field{width:100%;padding:.75rem 1rem;border-radius:.75rem;background:#111827;border:1px solid #1f2937;color:white;font-size:.75rem;outline:none}.field:focus{border-color:#8b5cf6}`}</style>
    </div>
  );
}
