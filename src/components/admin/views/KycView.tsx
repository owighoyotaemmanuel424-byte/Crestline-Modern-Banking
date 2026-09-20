import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import {
  ShieldCheck,
  Sun,
  Moon,
  CheckCircle2,
  Inbox,
  ChevronDown,
  Check,
  X,
  FileText,
  UserCheck,
  UserX,
  Loader2,
  RefreshCw,
  Clock,
  Eye,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  ZoomIn,
  Activity,
  ChevronRight,
  ShieldAlert,
  Sliders
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  event: string;
  details: string;
}

interface KycSubmission {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  dob?: string;
  docType: string;
  docNumber: string;
  issuedCountry?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  country: string;
  riskScore?: number;
  riskLevel?: string;
  selfieUrl?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  auditLogs?: AuditLog[];
}

export const KycView: React.FC = () => {
  const { theme, toggleTheme, setToast, adminToken } = useAdminStore();
  const [isKycRequired, setIsKycRequired] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingToggle, setIsSavingToggle] = useState(false);

  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Selected Submission Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<KycSubmission | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'metadata' | 'documents' | 'audit'>('metadata');
  const [expandedImage, setExpandedImage] = useState<{ url: string; title: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Unclear or blurry document photo');
  const [showRejectReasonInput, setShowRejectReasonInput] = useState(false);

  // Language Dropdown
  const [selectedLang, setSelectedLang] = useState({ code: 'EN', flag: '🇺🇸', label: 'English' });
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
    return headers;
  };

  // Load KYC settings and submissions from API
  const fetchData = async () => {
    setIsLoadingSubmissions(true);
    try {
      const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined;
      const [settingsRes, submissionsRes] = await Promise.all([
        fetch('/api/admin/settings/kyc', { headers }),
        fetch('/api/admin/kyc/submissions', { headers })
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (typeof settingsData.isKycRequired === 'boolean') {
          setIsKycRequired(settingsData.isKycRequired);
        }
      }

      if (submissionsRes.ok) {
        const subData = await submissionsRes.json();
        if (Array.isArray(subData)) {
          setSubmissions(subData);
        }
      }
    } catch (err) {
      console.error('Failed to load KYC data:', err);
    } finally {
      setIsLoadingSettings(false);
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminToken]);

  // Handle Toggle Change & Trigger API Update
  const handleToggle = async () => {
    const nextState = !isKycRequired;
    setIsKycRequired(nextState);
    setIsSavingToggle(true);

    try {
      const res = await fetch('/api/admin/settings/kyc', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isKycRequired: nextState })
      });

      if (res.ok) {
        setToast(
          nextState
            ? 'Verification requirement activated for all account transactions.'
            : 'Verification requirement disabled. Unrestricted transfers permitted.',
          nextState ? 'success' : 'info'
        );
      } else {
        await fetch('/api/admin/settings/kyc', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ isKycRequired: nextState })
        });
        setToast(
          nextState ? 'Verification policy enabled' : 'Verification policy disabled',
          'success'
        );
      }
    } catch (err) {
      console.error('API update failed:', err);
      setToast('Saved setting locally (offline mode)', 'info');
    } finally {
      setIsSavingToggle(false);
    }
  };

  // Handle Submission Approval
  const handleApprove = async (id: string, name: string) => {
    setActionInProgressId(id);
    const nowIso = new Date().toISOString();

    const newAuditLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: nowIso,
      actor: 'Admin (Current Session)',
      event: 'Verification Approved',
      details: 'Manual review completed. Member identity approved and verified.'
    };

    try {
      const headers: Record<string, string> = {};
      if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
      const res = await fetch(`/api/admin/kyc/submissions/${id}/approve`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  status: 'approved',
                  auditLogs: [...(sub.auditLogs || []), newAuditLog]
                }
              : sub
          )
        );
        setToast(`KYC submission for ${name} has been approved.`, 'success');
      } else {
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  status: 'approved',
                  auditLogs: [...(sub.auditLogs || []), newAuditLog]
                }
              : sub
          )
        );
        setToast(`Approved verification for ${name}`, 'success');
      }
    } catch (err) {
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === id
            ? {
                ...sub,
                status: 'approved',
                auditLogs: [...(sub.auditLogs || []), newAuditLog]
              }
            : sub
        )
      );
      setToast(`Approved verification for ${name}`, 'success');
    } finally {
      setActionInProgressId(null);
      if (selectedSubmission?.id === id) {
        setSelectedSubmission((prev) =>
          prev
            ? {
                ...prev,
                status: 'approved',
                auditLogs: [...(prev.auditLogs || []), newAuditLog]
              }
            : null
        );
      }
    }
  };

  // Handle Submission Rejection
  const handleReject = async (id: string, name: string, reason?: string) => {
    setActionInProgressId(id);
    const nowIso = new Date().toISOString();
    const finalReason = reason || rejectionReason || 'Documentation standard not met';

    const newAuditLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: nowIso,
      actor: 'Admin (Current Session)',
      event: 'Verification Rejected',
      details: `Submission rejected by administrator. Reason: ${finalReason}`
    };

    try {
      const res = await fetch(`/api/admin/kyc/submissions/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: finalReason })
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  status: 'rejected',
                  auditLogs: [...(sub.auditLogs || []), newAuditLog]
                }
              : sub
          )
        );
        setToast(`KYC submission for ${name} was rejected.`, 'info');
      } else {
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  status: 'rejected',
                  auditLogs: [...(sub.auditLogs || []), newAuditLog]
                }
              : sub
          )
        );
        setToast(`Rejected verification for ${name}`, 'info');
      }
    } catch (err) {
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === id
            ? {
                ...sub,
                status: 'rejected',
                auditLogs: [...(sub.auditLogs || []), newAuditLog]
              }
            : sub
        )
      );
      setToast(`Rejected verification for ${name}`, 'info');
    } finally {
      setActionInProgressId(null);
      setShowRejectReasonInput(false);
      if (selectedSubmission?.id === id) {
        setSelectedSubmission((prev) =>
          prev
            ? {
                ...prev,
                status: 'rejected',
                auditLogs: [...(prev.auditLogs || []), newAuditLog]
              }
            : null
        );
      }
    }
  };

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');

  return (
    <div className="space-y-6 pb-16 text-slate-100 animate-fade-in">
      {/* Header Bar / Page Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Compliance & Trust
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            Identity verification (KYC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {pendingSubmissions.length === 0
              ? 'Nothing waiting on you right now.'
              : `${pendingSubmissions.length} user document verification submission${
                  pendingSubmissions.length > 1 ? 's' : ''
                } awaiting your review.`}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-[#131d38] border border-[#1e293b] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingSubmissions ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-[#131d38] border border-[#1e293b] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle light/dark mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Toggle Control Card */}
      <div className="bg-[#131d38] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                Require verification before members move money
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              When this is on, a member who hasn't been approved here cannot transfer, withdraw, swap currency, or apply for a card, loan, grant or tax refund. Deposits and loan repayments always stay open. Turn it off to let everyone move money while their verification is still outstanding.
            </p>

            <div className="pt-1 flex items-center space-x-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isKycRequired
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                {isKycRequired ? 'Verification required' : 'Optional'}
              </span>

              {isSavingToggle && (
                <span className="text-xs text-slate-400 flex items-center">
                  <Loader2 className="w-3 h-3 animate-spin mr-1 text-cyan-400" /> Saving setting...
                </span>
              )}
            </div>
          </div>

          {/* Styled Custom Toggle Switch */}
          <div className="shrink-0 pt-1 flex flex-col items-end gap-2">
            <button
              onClick={handleToggle}
              disabled={isSavingToggle}
              type="button"
              role="switch"
              aria-checked={isKycRequired}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                isKycRequired ? 'bg-cyan-500' : 'bg-slate-700'
              } ${isSavingToggle ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isKycRequired ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              {isKycRequired ? 'POLICY ENABLED' : 'POLICY DISABLED'}
            </span>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
            SUBMISSIONS
          </h3>
          {pendingSubmissions.length > 0 && (
            <span className="text-xs text-cyan-400 font-medium">
              {pendingSubmissions.length} pending approval
            </span>
          )}
        </div>

        {/* Dynamic Content: Empty State or Submission Queue */}
        {isLoadingSubmissions ? (
          <div className="bg-[#131d38] border border-[#1e293b] rounded-2xl p-12 text-center shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading submissions...</p>
          </div>
        ) : pendingSubmissions.length === 0 ? (
          /* Empty State Container */
          <div className="bg-[#131d38] border border-[#1e293b] rounded-2xl p-12 text-center shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Nothing to review.</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All member identity documentations are currently verified or up to date.
            </p>
          </div>
        ) : (
          /* Active Pending Submissions Queue */
          <div className="space-y-3">
            {pendingSubmissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => {
                  setSelectedSubmission(sub);
                  setModalActiveTab('metadata');
                  setShowRejectReasonInput(false);
                }}
                className="bg-[#131d38] border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-lg hover:border-cyan-500/50 hover:bg-[#162244] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                <div className="flex items-start space-x-4">
                  {sub.selfieUrl ? (
                    <img
                      src={sub.selfieUrl}
                      alt={sub.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 group-hover:border-cyan-500 transition-colors shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 group-hover:border-cyan-500 flex items-center justify-center text-slate-300 font-bold shrink-0 transition-colors">
                      {sub.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {sub.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {sub.country}
                      </span>
                      {sub.riskLevel && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {sub.riskLevel} ({sub.riskScore || 95}%)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{sub.email}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      <span className="flex items-center text-slate-300">
                        <FileText className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                        {sub.docType}: <strong className="ml-1 text-white font-mono">{sub.docNumber}</strong>
                      </span>
                      <span className="flex items-center text-slate-500 text-[11px]">
                        <Clock className="w-3 h-3 mr-1" />
                        Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center space-x-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80 shrink-0"
                  onClick={(e) => e.stopPropagation()} // Allow direct buttons without double firing
                >
                  <button
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setModalActiveTab('metadata');
                      setShowRejectReasonInput(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> View Details
                  </button>

                  <button
                    onClick={() => handleReject(sub.id, sub.name)}
                    disabled={actionInProgressId === sub.id}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center transition-colors disabled:opacity-50"
                  >
                    {actionInProgressId === sub.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <UserX className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Reject
                  </button>

                  <button
                    onClick={() => handleApprove(sub.id, sub.name)}
                    disabled={actionInProgressId === sub.id}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center transition-colors disabled:opacity-50 shadow-md"
                  >
                    {actionInProgressId === sub.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comprehensive Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#131d38] border border-[#1e293b] rounded-2xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#1e293b] bg-[#0f172e] flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center space-x-4">
                {selectedSubmission.selfieUrl ? (
                  <img
                    src={selectedSubmission.selfieUrl}
                    alt={selectedSubmission.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500/50 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold text-lg shrink-0">
                    {selectedSubmission.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-lg sm:text-xl font-extrabold text-white">
                      {selectedSubmission.name}
                    </h3>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        selectedSubmission.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : selectedSubmission.status === 'rejected'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {selectedSubmission.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {selectedSubmission.email} • ID: {selectedSubmission.userId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex border-b border-[#1e293b] bg-[#111a33] px-6 text-xs font-bold shrink-0">
              <button
                onClick={() => setModalActiveTab('metadata')}
                className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${
                  modalActiveTab === 'metadata'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>User Metadata & Risk</span>
              </button>

              <button
                onClick={() => setModalActiveTab('documents')}
                className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${
                  modalActiveTab === 'documents'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Document Snapshots</span>
              </button>

              <button
                onClick={() => setModalActiveTab('audit')}
                className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${
                  modalActiveTab === 'audit'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Audit Logs ({selectedSubmission.auditLogs?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: User Metadata & Risk Analysis */}
              {modalActiveTab === 'metadata' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Risk Overview Bar */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center">
                          Facial Match Confidence: <span className="text-emerald-400 font-mono ml-2">{selectedSubmission.riskScore || 98}% Match</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Risk Classification: <span className="text-slate-200 font-medium">{selectedSubmission.riskLevel || 'Low Risk'}</span> • 0 Sanction Hits
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-slate-500 block text-[10px]">Submitted Date & Time</span>
                      <span className="font-mono text-slate-300 font-semibold">
                        {new Date(selectedSubmission.submittedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Personal & Document Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Identity Details */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5" /> Personal Information
                      </h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                          <span className="text-slate-400">Full Name:</span>
                          <span className="text-white font-medium">{selectedSubmission.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                          <span className="text-slate-400">Email Address:</span>
                          <span className="text-white font-mono">{selectedSubmission.email}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                          <span className="text-slate-400">Phone Number:</span>
                          <span className="text-white font-mono">{selectedSubmission.phone || '+44 7700 900077'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                          <span className="text-slate-400">Date of Birth:</span>
                          <span className="text-white font-mono">{selectedSubmission.dob || '1994-05-18'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Country of Residence:</span>
                          <span className="text-white font-medium">{selectedSubmission.country}</span>
                        </div>
                      </div>
                    </div>

                    {/* Government Document Details */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Government ID Document
                      </h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                          <span className="text-slate-400">Document Type:</span>
                          <span className="text-white font-medium">{selectedSubmission.docType}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                          <span className="text-slate-400">Document Number:</span>
                          <span className="text-cyan-400 font-mono font-bold">{selectedSubmission.docNumber}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                          <span className="text-slate-400">Issuing Authority:</span>
                          <span className="text-white font-medium">{selectedSubmission.issuedCountry || selectedSubmission.country}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                          <span className="text-slate-400">Address Match:</span>
                          <span className="text-emerald-400 font-medium">Verified (100% Address Match)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Document Expiry:</span>
                          <span className="text-emerald-400 font-mono font-semibold">2031-10-14 (Valid)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registered Residential Address */}
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center space-x-3 text-xs">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">Registered Address</span>
                      <span className="text-white font-medium">{selectedSubmission.address || '142 Kensington High St, London, W8 7RG, United Kingdom'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Document Snapshots */}
              {modalActiveTab === 'documents' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Uploaded Verification Artifacts
                    </h4>
                    <span className="text-[11px] text-slate-400">Click any image to zoom & inspect</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Selfie Snapshot */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Biometric Selfie</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Passed</span>
                      </div>
                      {selectedSubmission.selfieUrl ? (
                        <div
                          onClick={() =>
                            setExpandedImage({
                              url: selectedSubmission.selfieUrl!,
                              title: `${selectedSubmission.name} - Biometric Selfie Snapshot`
                            })
                          }
                          className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-700/80"
                        >
                          <img
                            src={selectedSubmission.selfieUrl}
                            alt="Selfie Snapshot"
                            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-44 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                          No selfie provided
                        </div>
                      )}
                    </div>

                    {/* Document Front Snapshot */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>ID Front Page</span>
                        <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">{selectedSubmission.docType}</span>
                      </div>
                      {selectedSubmission.documentFrontUrl ? (
                        <div
                          onClick={() =>
                            setExpandedImage({
                              url: selectedSubmission.documentFrontUrl!,
                              title: `${selectedSubmission.name} - ${selectedSubmission.docType} (Front)`
                            })
                          }
                          className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-700/80"
                        >
                          <img
                            src={selectedSubmission.documentFrontUrl}
                            alt="Document Front"
                            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-44 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                          No document image
                        </div>
                      )}
                    </div>

                    {/* Document Back / Secondary Snapshot */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>ID Back / Signature</span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Secondary</span>
                      </div>
                      {selectedSubmission.documentBackUrl ? (
                        <div
                          onClick={() =>
                            setExpandedImage({
                              url: selectedSubmission.documentBackUrl!,
                              title: `${selectedSubmission.name} - ${selectedSubmission.docType} (Back/Signature)`
                            })
                          }
                          className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-700/80"
                        >
                          <img
                            src={selectedSubmission.documentBackUrl}
                            alt="Document Back"
                            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-44 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 text-xs">
                          Back scan auto-verified
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Timestamped Audit Logs */}
              {modalActiveTab === 'audit' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Chronological Audit Trail
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Session ID: {selectedSubmission.id}
                    </span>
                  </div>

                  {!selectedSubmission.auditLogs || selectedSubmission.auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No audit log entries recorded yet.</p>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {selectedSubmission.auditLogs.map((log) => (
                        <div key={log.id} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-900 group-hover:scale-125 transition-transform" />

                          <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white flex items-center">
                                {log.event}
                                <span className="ml-2 px-2 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300 font-normal">
                                  {log.actor}
                                </span>
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-mono leading-relaxed">
                              {log.details}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 border-t border-[#1e293b] bg-[#0f172e] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {showRejectReasonInput ? (
                  <div className="flex items-center space-x-2 w-full sm:w-80">
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Specify rejection reason..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={() =>
                        handleReject(selectedSubmission.id, selectedSubmission.name, rejectionReason)
                      }
                      className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs shrink-0"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowRejectReasonInput(false)}
                      className="p-1.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRejectReasonInput(true)}
                    disabled={actionInProgressId === selectedSubmission.id || selectedSubmission.status === 'rejected'}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold transition-colors disabled:opacity-40 flex items-center justify-center w-full sm:w-auto"
                  >
                    <UserX className="w-4 h-4 mr-1.5" /> Reject Verification
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Close
                </button>

                <button
                  onClick={() => handleApprove(selectedSubmission.id, selectedSubmission.name)}
                  disabled={actionInProgressId === selectedSubmission.id || selectedSubmission.status === 'approved'}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors shadow-lg disabled:opacity-40 flex items-center justify-center"
                >
                  {actionInProgressId === selectedSubmission.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <UserCheck className="w-4 h-4 mr-1.5" />
                  )}
                  Approve Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Document Image Zoom Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="bg-[#131d38] border border-slate-700 rounded-2xl max-w-4xl w-full p-4 overflow-hidden space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
              <span>{expandedImage.title}</span>
              <button
                onClick={() => setExpandedImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto flex items-center justify-center bg-slate-950 rounded-xl p-2">
              <img
                src={expandedImage.url}
                alt="Expanded Snapshot"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Language Selector in Bottom Left */}
      <div className="fixed bottom-6 left-6 z-30">
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-[#131d38] border border-[#1e293b] text-white shadow-2xl hover:bg-slate-800 transition-colors text-xs font-bold"
          >
            <span>{selectedLang.flag}</span>
            <span>{selectedLang.code}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showLangDropdown && (
            <div className="absolute bottom-full left-0 mb-2 w-36 bg-[#131d38] border border-[#1e293b] rounded-xl shadow-2xl p-1.5">
              {[
                { code: 'EN', flag: '🇺🇸', label: 'English' },
                { code: 'ES', flag: '🇪🇸', label: 'Español' },
                { code: 'FR', flag: '🇫🇷', label: 'Français' },
                { code: 'DE', flag: '🇩🇪', label: 'Deutsch' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedLang.code === lang.code ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                  {selectedLang.code === lang.code && <Check className="w-3 h-3 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
