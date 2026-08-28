'use client';

import { useEffect, useState } from 'react';

type Tag = { id: string; name: string; slug: string };

export function EventTagsPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/event-tags', { cache: 'no-store' })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (response.ok) setTags(body.tags ?? []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter(item => item !== id) : [...value, id]);

  return <div className="space-y-3"><div><p className="text-xs font-bold text-gray-300">Event tags</p><p className="text-[11px] text-gray-500 mt-1">Select all interests that describe this event. These signals power future recommendations.</p></div>{loading ? <p className="text-xs text-gray-500">Loading tags…</p> : tags.length === 0 ? <p className="text-xs text-gray-500">No active event tags configured.</p> : <div className="flex flex-wrap gap-2">{tags.map(tag => <label key={tag.id} className={`cursor-pointer px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${value.includes(tag.id) ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-600'}`}><input type="checkbox" checked={value.includes(tag.id)} onChange={() => toggle(tag.id)} className="sr-only" />{tag.name}</label>)}</div>}<p className="text-[10px] text-gray-600">{value.length} tag{value.length === 1 ? '' : 's'} selected</p></div>;
}
