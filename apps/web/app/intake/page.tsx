'use client';

import { useState } from 'react';

const PILLARS = [
  { value: 'ai-automation', label: 'AI & Automation' },
  { value: 'consulting', label: 'Consulting Insights' },
  { value: 'industry-news', label: 'Industry News' },
  { value: 'digital-assets', label: 'Digital Assets' },
];

export default function IntakePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({ topic: '', pillar: '', notes: '', email: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setForm({ topic: '', pillar: '', notes: '', email: '' });
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="container-blog py-16">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Request a Blog Post
        </h1>
        <p className="text-gray-600 text-lg">
          Have a topic you'd like us to cover? Submit your idea and we'll turn it into a
          published article.
        </p>
      </div>

      {status === 'success' ? (
        <div className="border-2 border-gray-900 p-10 text-center">
          <div className="w-12 h-12 bg-gray-900 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request received</h2>
          <p className="text-gray-600 mb-6">We'll review your topic and get it published soon.</p>
          <button
            onClick={() => setStatus('idle')}
            className="px-6 py-2 border-2 border-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Submit another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 border-2 border-gray-900 p-8">
          {/* Topic */}
          <div>
            <label htmlFor="topic" className="block text-sm font-semibold text-gray-900 mb-2">
              Topic <span className="text-red-500">*</span>
            </label>
            <input
              id="topic"
              type="text"
              required
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. How to automate invoice processing with Claude AI"
              className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            />
          </div>

          {/* Pillar */}
          <div>
            <label htmlFor="pillar" className="block text-sm font-semibold text-gray-900 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="pillar"
              required
              value={form.pillar}
              onChange={(e) => setForm((f) => ({ ...f, pillar: e.target.value }))}
              className="w-full border-2 border-gray-900 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              <option value="">Select a category</option>
              {PILLARS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
              Additional notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any specific angle, audience, or points you want covered..."
              className="w-full border-2 border-gray-900 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
              Your email <span className="text-gray-400 font-normal">(optional — we'll notify you when it's live)</span>
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full border-2 border-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            />
          </div>

          {status === 'error' && (
            <p className="text-red-600 text-sm font-medium">
              Something went wrong. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-gray-900 text-white py-3 text-sm font-semibold border-2 border-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      )}
    </div>
  );
}
