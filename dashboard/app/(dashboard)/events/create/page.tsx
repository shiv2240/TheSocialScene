'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Users,
  Ticket,
  CheckSquare,
  User,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const wizardSteps = [
  { id: 1, title: 'Basic Information', icon: FileText },
  { id: 2, title: 'Media & Cover', icon: ImageIcon },
  { id: 3, title: 'Schedule & Timing', icon: Calendar },
  { id: 4, title: 'Location & Venue', icon: MapPin },
  { id: 5, title: 'Capacity & Deadlines', icon: Users },
  { id: 6, title: 'Ticketing & Pricing', icon: Ticket },
  { id: 7, title: 'Registration Rules', icon: CheckSquare },
  { id: 8, title: 'Assign Host', icon: User },
  { id: 9, title: 'Publishing & Preview', icon: Globe },
];

export default function EventCreateWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    category_id: 'cat-001',
    cover_image: '',
    gallery_images: '',
    start_at: '',
    end_at: '',
    venue_name: '',
    venue_address: '',
    google_maps_url: '',
    capacity: 100,
    registration_deadline: '',
    is_paid: false,
    price: 0,
    currency: 'INR',
    registration_enabled: true,
    waitlist_enabled: true,
    host_name: 'The Social Scene Hosts',
    status: 'DRAFT',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'title') {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      return updated;
    });
  };

  const handleFinish = (publishStatus: 'DRAFT' | 'PUBLISHED') => {
    // Save event & redirect to /events
    alert(`Event saved successfully as ${publishStatus}!`);
    router.push('/events');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
          Step {currentStep} of {wizardSteps.length}
        </span>
        <h1 className="text-2xl font-extrabold text-white">Multi-Section Event Creator</h1>
        <p className="text-xs text-gray-400 mt-1">
          Configure all metadata before publishing to the public website.
        </p>
      </div>

      {/* Progress Bar / Step Nav */}
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
        {wizardSteps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                isActive
                  ? 'gradient-bg text-white border-purple-500 shadow-lg shadow-purple-500/20'
                  : isCompleted
                  ? 'bg-gray-900 text-emerald-400 border-emerald-500/40'
                  : 'bg-gray-950 text-gray-500 border-gray-800 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-bold truncate w-full hidden sm:block">
                {step.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Wizard Form Card */}
      <div className="dashboard-card p-8 rounded-3xl border border-gray-800 space-y-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" /> Basic Information
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase">Event Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Acoustic Rooftop Session & Social"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase">URL Slug (Generated)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-xs font-mono text-purple-300 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase">Short Summary</label>
              <input
                type="text"
                value={formData.short_description}
                onChange={(e) => handleChange('short_description', e.target.value)}
                placeholder="Brief one-line summary for discovery cards"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase">Full Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Comprehensive breakdown of event agenda, guidelines, and what to expect..."
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Media */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" /> Media & Cover Artwork
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase">Cover Image URL</label>
              <input
                type="text"
                value={formData.cover_image}
                onChange={(e) => handleChange('cover_image', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none"
              />
            </div>

            {formData.cover_image && (
              <div className="h-48 w-full rounded-2xl overflow-hidden border border-gray-800">
                <img src={formData.cover_image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Schedule */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" /> Schedule & Timing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => handleChange('start_at', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => handleChange('end_at', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Location */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" /> Venue & Location
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase">Venue Name</label>
              <input
                type="text"
                value={formData.venue_name}
                onChange={(e) => handleChange('venue_name', e.target.value)}
                placeholder="The Social House Indiranagar"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase">Address & Google Maps Link</label>
              <input
                type="text"
                value={formData.google_maps_url}
                onChange={(e) => handleChange('google_maps_url', e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 5: Capacity */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" /> Capacity Management
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase">Maximum Capacity (Seats)</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 6: Ticketing */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-purple-400" /> Ticketing & Pricing
            </h2>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_paid}
                  onChange={(e) => handleChange('is_paid', e.target.checked)}
                  className="rounded bg-gray-900 border-gray-700 text-purple-600 focus:ring-0 w-4 h-4"
                />
                Is Paid Event (Requires Payment Integration)
              </label>
            </div>

            {formData.is_paid && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase">Ticket Price (INR ₹)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 7: Registration Rules */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-purple-400" /> Registration & Waitlist Policy
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.registration_enabled}
                  onChange={(e) => handleChange('registration_enabled', e.target.checked)}
                  className="rounded bg-gray-900 border-gray-700 text-purple-600 w-4 h-4"
                />
                Allow User Registration
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.waitlist_enabled}
                  onChange={(e) => handleChange('waitlist_enabled', e.target.checked)}
                  className="rounded bg-gray-900 border-gray-700 text-purple-600 w-4 h-4"
                />
                Enable Waitlist when capacity reaches 100%
              </label>
            </div>
          </div>
        )}

        {/* Step 8: Host */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" /> Assign Host Profile
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase">Primary Host</label>
              <select
                value={formData.host_name}
                onChange={(e) => handleChange('host_name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none"
              >
                <option value="Bengaluru Runners Club">Bengaluru Runners Club</option>
                <option value="Acoustic Underground">Acoustic Underground</option>
                <option value="Tech Collective India">Tech Collective India</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 9: Publishing & Preview */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-400" /> Final Review & Publish
            </h2>

            <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-2 text-xs">
              <p className="text-gray-300"><strong className="text-white">Title:</strong> {formData.title || 'Untitled Event'}</p>
              <p className="text-gray-300"><strong className="text-white">Slug:</strong> /{formData.slug}</p>
              <p className="text-gray-300"><strong className="text-white">Capacity:</strong> {formData.capacity} Seats</p>
              <p className="text-gray-300"><strong className="text-white">Price:</strong> ₹{formData.price}</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => handleFinish('DRAFT')}
                className="flex-1 py-3.5 rounded-xl bg-gray-800 text-gray-300 font-bold text-xs hover:text-white border border-gray-700"
              >
                Save as Draft
              </button>

              <button
                onClick={() => handleFinish('PUBLISHED')}
                className="flex-1 py-3.5 rounded-xl gradient-bg text-white font-bold text-xs shadow-xl shadow-purple-500/20 hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Publish Event Instantly
              </button>
            </div>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800/80">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-40 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {currentStep < 9 && (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(9, prev + 1))}
              className="px-6 py-2.5 rounded-xl gradient-bg text-xs font-bold text-white shadow-md flex items-center gap-2"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
