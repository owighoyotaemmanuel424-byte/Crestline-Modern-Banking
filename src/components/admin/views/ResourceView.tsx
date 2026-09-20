import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import { EmptyState } from '../EmptyState';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  Database,
  Printer
} from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';

export interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'currency';
}

export interface ResourceConfig {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  columns: ColumnDef[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface ResourceViewProps {
  config: ResourceConfig;
}

export const ResourceView: React.FC<ResourceViewProps> = ({ config }) => {
  const { setToast, adminToken } = useAdminStore();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      const res = await fetch(config.endpoint, { headers });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          setData(json);
        } else if (json && Array.isArray(json.data)) {
          setData(json.data);
        } else if (json && Array.isArray(json.items)) {
          setData(json.items);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${config.id}:`, err);
      // Fallback local state if backend is missing for this entity
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [config.endpoint, adminToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${config.endpoint}/${editingId}` : config.endpoint;
    
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setToast(`${config.title} saved successfully.`, 'success');
        setIsFormModalOpen(false);
        fetchData();
      } else {
        setToast(`Failed to save ${config.title}.`, 'error');
      }
    } catch (err) {
      setToast('Network error while saving.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      const res = await fetch(`${config.endpoint}/${deleteId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setToast('Record deleted securely.', 'success');
        fetchData();
      } else {
        setToast('Failed to delete record.', 'error');
      }
    } catch (err) {
      setToast('Network error while deleting.', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.error('Print dialog failed to open:', err);
      setToast('Unable to launch print dialog automatically. Use Ctrl+P / Cmd+P to print.', 'error');
    }
  };

  const openCreate = () => {
    setFormData({});
    setEditingId(null);
    setIsFormModalOpen(true);
  };

  const openEdit = (record: any) => {
    setFormData(record);
    setEditingId(record.id);
    setIsFormModalOpen(true);
  };

  const filteredData = data.filter(item => {
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const renderCell = (item: any, col: ColumnDef) => {
    const val = item[col.key];
    if (val === undefined || val === null) return '-';
    
    switch (col.type) {
      case 'boolean':
        return val ? 'Yes' : 'No';
      case 'currency':
        return `$${Number(val).toLocaleString()}`;
      case 'date':
        return new Date(val).toLocaleDateString();
      case 'badge':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 print:border-slate-300 print:text-slate-800">
            {String(val)}
          </span>
        );
      default:
        return String(val);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 print:space-y-4 print:pb-0">
      {/* Print-Only Header configured for table's current view */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 text-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              Crestline Capital
            </div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
              Administrative Resource Ledger &bull; Institutional Records
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-600 leading-tight">
            <div><strong>Printed On:</strong> {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            <div><strong>Clearance:</strong> Super Administrator (Tier 1)</div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-sm text-slate-900 capitalize">{config.title}</span>
            <span className="text-slate-500 ml-2">({config.description})</span>
          </div>
          <div className="font-semibold text-slate-700">
            {searchTerm.trim() ? (
              <span>Filter: &ldquo;{searchTerm}&rdquo; &bull; {filteredData.length} of {data.length} records</span>
            ) : (
              <span>Total Active Records: {filteredData.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
            {config.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {config.description}
          </p>
        </div>
        
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            id="resource-print-btn"
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors shadow-xs flex items-center space-x-2 text-xs font-semibold cursor-pointer"
            title="Print Current Table View"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Print Table</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {config.canCreate && (
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs print:hidden">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-xs whitespace-nowrap print:whitespace-normal">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800 print:bg-slate-100 print:text-slate-800">
              <tr>
                {config.columns.map(col => (
                  <th key={col.key} className="py-3 px-6">{col.label}</th>
                ))}
                {(config.canEdit || config.canDelete) && (
                  <th className="py-3 px-6 text-right print:hidden">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 print:text-slate-900">
              {isLoading ? (
                <tr>
                  <td colSpan={config.columns.length + 1} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                    {config.columns.map(col => (
                      <td key={col.key} className="py-3.5 px-6">
                        {renderCell(item, col)}
                      </td>
                    ))}
                    {(config.canEdit || config.canDelete) && (
                      <td className="py-3.5 px-6 text-right print:hidden">
                        <div className="flex items-center justify-end space-x-2">
                          {config.canEdit && (
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {config.canDelete && (
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={config.columns.length + 1} className="py-12 px-6">
                    <EmptyState
                      title="No Records Found"
                      description={`There are currently no records for ${config.title}.`}
                      icon={Database}
                      onAction={config.canCreate ? openCreate : undefined}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingId ? 'Edit Record' : 'Create New Record'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              {config.columns.map(col => (
                <div key={col.key}>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {col.label}
                  </label>
                  <input
                    type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                    value={formData[col.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              ))}
              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <div className="print:hidden">
        <ConfirmModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete Record"
          description="Are you sure you want to delete this record? This action cannot be undone and will be permanently removed from the database."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          variant="danger"
          icon={AlertTriangle}
        />
      </div>
    </div>
  );
};
