import React, { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, ExternalLink, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';

export interface UserRow {
  id: string;
  email: string;
  status: string; // 'active' | 'blocked' | 'suspended'
  kycStatus: string; // 'verified' | 'pending' | 'unverified' | 'rejected'
  createdAt: string;
}

export interface UsersTableProps {
  users: UserRow[];
  onViewAll?: () => void;
  onSelectUser?: (userId: string) => void;
  title?: string;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onViewAll,
  onSelectUser,
  title = 'Recent Users'
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered customer accounts, risk status, and compliance verification
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-44 sm:w-56"
            />
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1 shrink-0"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-6">Email</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">KYC Status</th>
              <th className="py-3.5 px-6">Date Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isBlocked = u.status === 'blocked' || u.status === 'suspended';
                const isVerified = u.kycStatus === 'verified';
                const isPending = u.kycStatus === 'pending' || u.kycStatus === 'unverified';

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectUser && onSelectUser(u.id)}
                  >
                    {/* Column 1: Email */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {u.email}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>

                    {/* Column 2: Status (Green = Active, Red = Blocked) */}
                    <td className="py-4 px-6">
                      {!isBlocked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
                          Blocked
                        </span>
                      )}
                    </td>

                    {/* Column 3: KYC Status (Green = Verified, Yellow = Pending/Unverified) */}
                    <td className="py-4 px-6">
                      {isVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <ShieldAlert className="w-3 h-3 mr-1 text-amber-400" />
                          Pending KYC
                        </span>
                      )}
                    </td>

                    {/* Column 4: Date Created */}
                    <td className="py-4 px-6 font-mono text-slate-400 text-xs">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                  No matching user accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
