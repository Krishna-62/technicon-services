import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Warehouse } from '../../api';

interface WarehouseFormData {
  id?: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
  isActive: boolean;
}

const emptyForm: WarehouseFormData = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  isDefault: false,
  isActive: true,
};

export default function WarehouseList() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<WarehouseFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadWarehouses = () => {
    setLoading(true);
    setError('');
    api.inventory
      .listWarehouses()
      .then(setWarehouses)
      .catch((err) => {
        console.error('Failed to load warehouses:', err);
        setError(err.message || 'Failed to load warehouses');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const openCreateModal = () => {
    setFormData(emptyForm);
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (wh: Warehouse) => {
    setFormData({
      id: wh.id,
      name: wh.name,
      code: wh.code,
      address: wh.address || '',
      city: wh.city || '',
      state: wh.state || '',
      isDefault: wh.is_default === 1,
      isActive: wh.is_active === 1,
    });
    setModalError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setModalError('Warehouse name and code are required');
      return;
    }

    setSaving(true);
    setModalError('');

    try {
      if (formData.id) {
        await api.inventory.updateWarehouse(formData.id, {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          isDefault: formData.isDefault,
          isActive: formData.isActive,
        });
      } else {
        await api.inventory.createWarehouse({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          isDefault: formData.isDefault,
        });
      }

      setModalOpen(false);
      loadWarehouses();
    } catch (err: any) {
      console.error('Error saving warehouse:', err);
      setModalError(err.message || 'Failed to save warehouse');
    } finally {
      setSaving(false);
    }
  };

  const filteredWarehouses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return warehouses;
    return warehouses.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q) ||
        (w.city && w.city.toLowerCase().includes(q)) ||
        (w.state && w.state.toLowerCase().includes(q))
    );
  }, [warehouses, search]);

  return (
    <div className="p-6 flex flex-col gap-6 bg-[#101312] text-[#F5F7F4] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-[#A5AEA8]">
            <Link to="/inventory" className="hover:text-[#B8F23A] transition-colors">
              Inventory
            </Link>
            <span>/</span>
            <span className="text-[#F5F7F4]">Warehouses</span>
          </div>
          <h1 className="margin-0 text-[32px] font-medium tracking-[-.02em] leading-[1.05]">
            Warehouse Facilities
          </h1>
          <p className="margin-0 text-[13.5px] text-[#A5AEA8]">
            Manage physical stock locations, distribution centers, and default order fulfillment hubs.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B8F23A] hover:bg-[#A6DD34] text-[#101312] font-semibold rounded-lg text-sm transition-colors shadow-sm"
        >
          <span>+</span>
          <span>New Warehouse</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#2A1515] border border-[#5A2424] text-[#F87171] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>⚠️</span>
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={loadWarehouses}
            className="px-3 py-1 bg-[#381B1B] hover:bg-[#482222] text-[#FCA5A5] rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search warehouse by name, code or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#171918] border border-[#292E2A] rounded-lg px-3.5 py-2 text-sm text-[#F5F7F4] placeholder-[#646D67] focus:outline-none focus:border-[#B8F23A] transition-colors"
          />
        </div>
        <div className="text-xs text-[#A5AEA8]">
          Showing {filteredWarehouses.length} of {warehouses.length} facilities
        </div>
      </div>

      {/* Warehouses Table / Grid */}
      <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-[#1B1F1D] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <span className="text-4xl">🏢</span>
            <p className="text-[#F5F7F4] font-medium text-base">No warehouses found</p>
            <p className="text-xs text-[#A5AEA8] max-w-sm">
              {search
                ? 'No warehouse matched your search criteria. Try a different query.'
                : 'No warehouses have been configured. Create a warehouse to track stock balances.'}
            </p>
            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-2 px-4 py-2 bg-[#B8F23A] text-[#101312] font-semibold text-xs rounded-lg"
              >
                Create First Warehouse
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#292E2A] text-xs text-[#A5AEA8] uppercase tracking-wider bg-[#141615]">
                  <th className="py-3.5 px-4 font-medium">Facility Code</th>
                  <th className="py-3.5 px-4 font-medium">Name</th>
                  <th className="py-3.5 px-4 font-medium">Location</th>
                  <th className="py-3.5 px-4 font-medium text-right">Products Stored</th>
                  <th className="py-3.5 px-4 font-medium text-right">Total Units</th>
                  <th className="py-3.5 px-4 font-medium text-center">Status</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202522]">
                {filteredWarehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-[#1C201E] transition-colors">
                    <td className="py-4 px-4 font-mono font-medium text-xs text-[#F5F7F4]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#202422] border border-[#2B312E] rounded text-[#B8F23A]">
                          {wh.code}
                        </span>
                        {wh.is_default === 1 && (
                          <span className="px-1.5 py-0.5 bg-[#1E2E20] text-[#71D88A] border border-[#2B4B32] rounded text-[10px] font-semibold tracking-wider">
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        to={`/inventory/warehouses/${wh.id}`}
                        className="text-sm font-semibold text-[#F5F7F4] hover:text-[#B8F23A] transition-colors"
                      >
                        {wh.name}
                      </Link>
                      {wh.address && (
                        <p className="text-xs text-[#7A837E] truncate max-w-[280px] mt-0.5">
                          {wh.address}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-[#A5AEA8]">
                      {[wh.city, wh.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-right text-[#F5F7F4]">
                      {wh.product_count || 0}
                    </td>
                    <td className="py-4 px-4 text-xs font-mono font-semibold text-right text-[#B8F23A]">
                      {Number(wh.total_on_hand || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {wh.is_active === 1 ? (
                        <span className="px-2 py-0.5 bg-[#1E2E20] text-[#71D88A] border border-[#2B4B32] rounded text-[11px] font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#252927] text-[#A5AEA8] border border-[#3A403D] rounded text-[11px] font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/inventory/warehouses/${wh.id}`}
                          className="px-2.5 py-1 bg-[#1F2421] hover:bg-[#282E2B] text-[#F5F7F4] border border-[#292E2A] rounded text-xs font-medium transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => openEditModal(wh)}
                          className="px-2.5 py-1 bg-[#1A1D1C] hover:bg-[#252927] text-[#A5AEA8] hover:text-[#F5F7F4] border border-[#292E2A] rounded text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Warehouse Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#171918] border border-[#292E2A] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#292E2A] flex items-center justify-between">
              <h3 className="font-semibold text-base text-[#F5F7F4]">
                {formData.id ? 'Edit Warehouse' : 'New Warehouse'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#A5AEA8] hover:text-[#F5F7F4] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              {modalError && (
                <div className="p-3 bg-[#2A1515] border border-[#5A2424] text-[#F87171] rounded-lg text-xs">
                  {modalError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#A5AEA8]">
                  Warehouse Name <span className="text-[#F87171]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad Central Warehouse"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#A5AEA8]">
                  Warehouse Code <span className="text-[#F87171]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HYD-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#F5F7F4] font-mono focus:outline-none focus:border-[#B8F23A]"
                />
                <span className="text-[11px] text-[#7A837E]">Short unique uppercase identifier</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#A5AEA8]">Address / Street</label>
                <textarea
                  rows={2}
                  placeholder="Street address, industrial estate..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#A5AEA8]">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#A5AEA8]">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Telangana"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="bg-[#121413] border border-[#292E2A] rounded-lg px-3 py-2 text-sm text-[#F5F7F4] focus:outline-none focus:border-[#B8F23A]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[#292E2A]">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#F5F7F4]">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-[#292E2A] text-[#B8F23A] focus:ring-0"
                  />
                  <span>Set as Default Warehouse</span>
                </label>

                {formData.id && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#F5F7F4]">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-[#292E2A] text-[#B8F23A] focus:ring-0"
                    />
                    <span>Active Warehouse (available for stock transactions)</span>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#292E2A]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 bg-[#1E2220] hover:bg-[#282D2A] text-[#A5AEA8] rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#B8F23A] hover:bg-[#A6DD34] disabled:opacity-50 text-[#101312] rounded-lg text-xs font-semibold transition-colors"
                >
                  {saving ? 'Saving...' : formData.id ? 'Update Warehouse' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
