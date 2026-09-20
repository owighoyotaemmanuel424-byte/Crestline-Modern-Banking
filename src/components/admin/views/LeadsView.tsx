import React, { useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import {
  Plus,
  Search,
  Trash2,
  Mail,
  Building,
  X,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { LeadStatus } from '../../../types/admin';

export const LeadsView: React.FC = () => {
  const {
    leads,
    addLead,
    deleteLead,
    updateLeadStatus,
    clearLeads,
    seedSampleLeads,
  } = useAdminStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Add Lead
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [value, setValue] = useState('');
  const [source, setSource] = useState('Direct Signup');
  const [notes, setNotes] = useState('');

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addLead({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      status,
      value: value ? parseFloat(value) : 0,
      source: source || 'Direct Entry',
      notes: notes.trim() || undefined,
    });

    // Reset Form
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setStatus('New');
    setValue('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = filterStatus === 'ALL' || lead.status.toUpperCase() === filterStatus;
    const matchesQuery =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  const getStatusBadgeClass = (st: LeadStatus) => {
    switch (st) {
      case 'New':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Contacted':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Qualified':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Proposal':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Won':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Lost':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Content Header: Title & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Leads
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage incoming prospects, pipeline stages, and conversion metrics.
          </p>
        </div>

        {/* Prominent bright blue button labeled "Add lead" */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          type="button"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#00A3FF] hover:bg-[#008ADB] text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add lead</span>
        </button>
      </div>

      {/* 4. Controls & Filters (When leads exist or for testing) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lead by name, email, company..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#131C2E] border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center space-x-1 bg-[#131C2E] p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {['ALL', 'NEW', 'QUALIFIED', 'PROPOSAL', 'WON'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-colors capitalize text-[11px] font-bold ${
                  filterStatus === st
                    ? 'bg-[#00A3FF] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Quick Helper buttons for testing empty state vs mock data */}
          {leads.length > 0 ? (
            <button
              onClick={clearLeads}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-semibold transition-colors flex items-center space-x-1.5 shrink-0"
              title="Clear leads to view empty state"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Clear All</span>
            </button>
          ) : (
            <button
              onClick={seedSampleLeads}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors flex items-center space-x-1.5 shrink-0"
              title="Load demo sample leads"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Samples</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Main Body Content */}
      {leads.length === 0 ? (
        /* Empty State Card Required by Prompt:
           Subtle dark background (#131C2E), rounded container card, centered muted gray text (#64748B): "No leads yet." */
        <div className="flex-1 flex flex-col items-center justify-center min-h-[380px] rounded-3xl bg-[#131C2E] border border-slate-800/90 p-8 sm:p-12 text-center shadow-2xl transition-all my-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-center text-slate-600 mb-4 shadow-inner">
            <UserPlus className="w-8 h-8 stroke-[1.5]" />
          </div>

          {/* Prompt specified text */}
          <p className="text-[#64748B] text-base sm:text-lg font-medium tracking-tight mb-6">
            No leads yet.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              type="button"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#00A3FF] hover:bg-[#008ADB] text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add lead</span>
            </button>

            <button
              onClick={seedSampleLeads}
              type="button"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Demo Data</span>
            </button>
          </div>
        </div>
      ) : (
        /* Data Grid / Table when leads exist */
        <div className="space-y-4">
          <div className="bg-[#131C2E] rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Lead / Prospect</th>
                    <th className="py-4 px-6">Company</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Est. Value</th>
                    <th className="py-4 px-6">Source</th>
                    <th className="py-4 px-6">Created</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[#00A3FF] font-bold text-sm flex items-center justify-center shrink-0">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-[#00A3FF] transition-colors">
                              {lead.name}
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{lead.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-300 font-medium">
                        {lead.company ? (
                          <div className="flex items-center space-x-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            <span>{lead.company}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-italic">—</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all ${getStatusBadgeClass(
                            lead.status
                          )}`}
                        >
                          <option value="New" className="bg-slate-900 text-white">New</option>
                          <option value="Contacted" className="bg-slate-900 text-white">Contacted</option>
                          <option value="Qualified" className="bg-slate-900 text-white">Qualified</option>
                          <option value="Proposal" className="bg-slate-900 text-white">Proposal</option>
                          <option value="Negotiation" className="bg-slate-900 text-white">Negotiation</option>
                          <option value="Won" className="bg-slate-900 text-white">Won</option>
                          <option value="Lost" className="bg-slate-900 text-white">Lost</option>
                        </select>
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                        {lead.value && lead.value > 0 ? (
                          `$${lead.value.toLocaleString()}`
                        ) : (
                          <span className="text-slate-500 font-normal">$0</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-400 text-[11px]">
                        {lead.source || 'Direct'}
                      </td>

                      <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                        {lead.createdAt}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <a
                            href={`mailto:${lead.email}`}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Send Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            type="button"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-900/40 border-t border-slate-800 text-slate-400 text-xs flex items-center justify-between">
              <span>Showing {filteredLeads.length} of {leads.length} total leads</span>
              <span className="text-[11px] text-slate-500">Pipeline total value: <strong className="text-emerald-400">${leads.reduce((acc, l) => acc + (l.value || 0), 0).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131C2E] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#00A3FF]/10 text-[#00A3FF] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create New Lead</h3>
                  <p className="text-xs text-slate-400">Add a prospect to Crestline CRM pipeline.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">Lead Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jonathan Vance"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jonathan@company.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2831"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Company Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Capital Ltd"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Est. Deal Value ($)</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="150000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Pipeline Stage</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold">Lead Source</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Website Form, Referral"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-bold">Internal Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context or requirements..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00A3FF] hover:bg-[#008ADB] text-white font-bold text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
