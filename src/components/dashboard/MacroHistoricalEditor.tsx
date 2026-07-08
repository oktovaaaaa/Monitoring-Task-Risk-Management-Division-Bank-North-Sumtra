"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";

// ─── Types ────────────────────────────────────────────────────────────────────

const DEFAULT_DATA_TYPES = [
  "Suku Bunga The Fed",
  "Suku Bunga Acuan BI (BI Rate)",
  "Tingkat Bunga Penjaminan LPS",
  "Inflasi Indonesia",
  "Inflasi Sumut",
  "Cadangan Devisa",
];

export interface MacroDataPoint {
  id?: string;
  data_type: string;
  data_date: string; // ISO string
  value: string;
  is_auto_date: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// A period column — one per unique date in the data
interface PeriodColumn {
  date: string; // YYYY-MM-DD
  label: string; // formatted for display
  isAutoDate: boolean;
}

interface CellData {
  /** undefined means no data for this data_type on this date */
  point: MacroDataPoint | null;
  value: string;
  isDirty: boolean;
}

interface MacroHistoricalEditorProps {
  token: string | null;
  onSaveSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function toISODate(dateStr: string): string {
  // Returns YYYY-MM-DD from any date string
  try {
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  } catch {
    return dateStr;
  }
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MacroHistoricalEditor({ token, onSaveSuccess }: MacroHistoricalEditorProps) {
  const [allPoints, setAllPoints] = useState<MacroDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // cell edits: key = `${dataType}||${date}`, value = edited string
  const [edits, setEdits] = useState<Record<string, string>>({});
  // new points pending save (not yet in DB): same key scheme
  const [newPoints, setNewPoints] = useState<Record<string, { date: string; dataType: string; value: string; isAutoDate: boolean }>>({});
  // points to delete
  const [toDelete, setToDelete] = useState<string[]>([]);

  // popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [popupMsg, setPopupMsg] = useState("");

  // "Tambah Periode" modal
  const [addPeriodOpen, setAddPeriodOpen] = useState(false);
  const [newPeriodDate, setNewPeriodDate] = useState(todayISO());
  const [newPeriodIsAuto, setNewPeriodIsAuto] = useState(true);

  // "Tambah Sub-Nilai" modal for same-period updates (e.g. Inflasi)
  const [addSubOpen, setAddSubOpen] = useState(false);
  const [subDataType, setSubDataType] = useState("");
  const [subDate, setSubDate] = useState(todayISO());
  const [subValue, setSubValue] = useState("");
  const [subIsAuto, setSubIsAuto] = useState(true);

  // confirm delete period
  const [deletePeriodConfirm, setDeletePeriodConfirm] = useState<string | null>(null);

  const showPopup = (type: "success" | "error", msg: string) => {
    setPopupType(type);
    setPopupMsg(msg);
    setPopupOpen(true);
  };

  // ─── Fetch all data points from backend ───────────────────────────────────

  const fetchPoints = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/macro-data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAllPoints(data.data as MacroDataPoint[]);
      }
    } catch (err) {
      console.error("Gagal memuat data makro:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  // ─── Derive unique sorted periods (date columns) ──────────────────────────

  const periods: PeriodColumn[] = React.useMemo(() => {
    const dateSet = new Set<string>();

    allPoints.forEach((p) => dateSet.add(toISODate(p.data_date)));

    // Also include dates from newPoints
    Object.values(newPoints).forEach((np) => dateSet.add(np.date));

    return Array.from(dateSet)
      .sort() // ascending = oldest left, newest right
      .map((d) => ({
        date: d,
        label: formatDateLabel(d),
        isAutoDate: allPoints.find((p) => toISODate(p.data_date) === d)?.is_auto_date ?? false,
      }));
  }, [allPoints, newPoints]);

  // ─── Build grid cell data ─────────────────────────────────────────────────

  const getCellKey = (dataType: string, date: string) => `${dataType}||${date}`;

  /**
   * For each (dataType, date) combination returns all matching data points
   * sorted by created_at ascending. Used for displaying multiple inflation updates.
   */
  const getPointsForCell = (dataType: string, date: string): MacroDataPoint[] => {
    return allPoints.filter(
      (p) => p.data_type === dataType && toISODate(p.data_date) === date
    ).sort((a, b) => new Date(a.created_at ?? "").getTime() - new Date(b.created_at ?? "").getTime());
  };

  const getCellEditValue = (dataType: string, date: string): string => {
    const key = getCellKey(dataType, date);
    if (edits[key] !== undefined) return edits[key];
    // Return the latest value
    const pts = getPointsForCell(dataType, date);
    if (pts.length > 0) return pts[pts.length - 1].value;
    return newPoints[key]?.value ?? "";
  };

  const handleCellChange = (dataType: string, date: string, value: string) => {
    const key = getCellKey(dataType, date);
    const pts = getPointsForCell(dataType, date);

    setEdits((prev) => ({ ...prev, [key]: value }));

    // If no existing point, mark it as a new point
    if (pts.length === 0 && !newPoints[key]) {
      setNewPoints((prev) => ({
        ...prev,
        [key]: { date, dataType, value, isAutoDate: date === todayISO() },
      }));
    } else if (pts.length === 0 && newPoints[key]) {
      setNewPoints((prev) => ({ ...prev, [key]: { ...prev[key], value } }));
    }
  };

  // ─── Add new period (column) ──────────────────────────────────────────────

  const handleAddPeriod = () => {
    const isoDate = newPeriodDate;
    if (periods.some((p) => p.date === isoDate)) {
      showPopup("error", "Periode dengan tanggal tersebut sudah ada.");
      setAddPeriodOpen(false);
      return;
    }
    // We don't create DB records yet — they'll be created when user fills in values and hits Save
    // We just mark it in newPoints map so the column appears
    DEFAULT_DATA_TYPES.forEach((dt) => {
      const key = getCellKey(dt, isoDate);
      // Only add placeholder if not already present
      if (!newPoints[key]) {
        setNewPoints((prev) => ({
          ...prev,
          [key]: { date: isoDate, dataType: dt, value: "", isAutoDate: newPeriodIsAuto },
        }));
      }
    });
    setAddPeriodOpen(false);
    setNewPeriodDate(todayISO());
    setNewPeriodIsAuto(true);
  };

  // ─── Add sub-value for same data_type in same period ─────────────────────

  const handleAddSubValue = async () => {
    if (!token || !subValue.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("http://localhost:8080/api/macro-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          data_type: subDataType,
          data_date: subDate,
          value: subValue.trim(),
          is_auto_date: subIsAuto,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal menyimpan");
      showPopup("success", `Nilai baru untuk ${subDataType} berhasil ditambahkan.`);
      setAddSubOpen(false);
      setSubValue("");
      await fetchPoints();
    } catch (err: any) {
      showPopup("error", err.message ?? "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete a period column ────────────────────────────────────────────────

  const handleDeletePeriod = async (date: string) => {
    if (!token) return;
    setSaving(true);
    try {
      // Delete all DB points on this date
      const pointsOnDate = allPoints.filter((p) => toISODate(p.data_date) === date);
      await Promise.all(
        pointsOnDate.map((p) =>
          fetch(`http://localhost:8080/api/macro-data/${p.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      // Remove from newPoints
      const nextNew: typeof newPoints = {};
      Object.entries(newPoints).forEach(([key, val]) => {
        if (val.date !== date) nextNew[key] = val;
      });
      setNewPoints(nextNew);
      const nextEdits: Record<string, string> = {};
      Object.entries(edits).forEach(([key, val]) => {
        if (!key.includes(`||${date}`)) nextEdits[key] = val;
      });
      setEdits(nextEdits);
      setDeletePeriodConfirm(null);
      showPopup("success", `Periode ${formatDateLabel(date)} berhasil dihapus.`);
      await fetchPoints();
    } catch (err: any) {
      showPopup("error", err.message ?? "Terjadi kesalahan saat menghapus periode.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Save all changes ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);

    const batchCreate: { data_type: string; data_date: string; value: string; is_auto_date: boolean }[] = [];
    const batchUpdate: { id: string; data_type: string; data_date: string; value: string; is_auto_date: boolean }[] = [];

    // Process edits: update existing points with their latest value
    for (const [key, editedValue] of Object.entries(edits)) {
      const [dataType, date] = key.split("||");
      const pts = getPointsForCell(dataType, date);
      if (pts.length > 0) {
        const latestPt = pts[pts.length - 1];
        if (latestPt.id && latestPt.value !== editedValue) {
          batchUpdate.push({
            id: latestPt.id,
            data_type: dataType,
            data_date: date,
            value: editedValue,
            is_auto_date: latestPt.is_auto_date,
          });
        }
      } else if (newPoints[key] && editedValue.trim()) {
        batchCreate.push({
          data_type: dataType,
          data_date: date,
          value: editedValue,
          is_auto_date: newPoints[key].isAutoDate,
        });
      }
    }

    // Also create newPoints that were never edited (i.e. user typed in the newPoints state directly)
    for (const [key, np] of Object.entries(newPoints)) {
      const [dataType, date] = key.split("||");
      const alreadyInCreate = batchCreate.some((c) => c.data_type === dataType && c.data_date === date);
      if (!alreadyInCreate && edits[key] === undefined && np.value.trim()) {
        batchCreate.push({ data_type: np.dataType, data_date: np.date, value: np.value, is_auto_date: np.isAutoDate });
      }
    }

    try {
      if (batchCreate.length > 0) {
        const res = await fetch("http://localhost:8080/api/macro-data/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ points: batchCreate }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Gagal menyimpan data baru");
      }

      for (const u of batchUpdate) {
        const res = await fetch(`http://localhost:8080/api/macro-data/${u.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ data_type: u.data_type, data_date: u.data_date, value: u.value, is_auto_date: u.is_auto_date }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message ?? `Gagal update ID ${u.id}`);
        }
      }

      setEdits({});
      setNewPoints({});
      showPopup("success", "Data historis makro berhasil disimpan!");
      await fetchPoints();
      onSaveSuccess?.();
    } catch (err: any) {
      showPopup("error", err.message ?? "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
        <p className="text-sm text-gray-500">Memuat data historis makro...</p>
      </div>
    );
  }

  const isDirty = Object.keys(edits).length > 0 || Object.values(newPoints).some((np) => np.value.trim() !== "");

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Data Historis Makro Monitoring</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {periods.length} periode tersimpan · {allPoints.length} titik data
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setNewPeriodDate(todayISO());
              setNewPeriodIsAuto(true);
              setAddPeriodOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 rounded-lg cursor-pointer transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Periode
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg cursor-pointer transition disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Semua"}
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Table */}
      {periods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Belum Ada Data Historis</p>
          <p className="text-xs text-gray-400 mt-1">Klik "Tambah Periode" untuk mulai memasukkan data</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-brand-500 dark:bg-brand-600 text-white">
                {/* First column: Data Type label */}
                <th className="px-4 py-3 text-left font-bold whitespace-nowrap border-r border-white/20 min-w-[180px]">
                  Tipe Data
                </th>
                {/* Period columns — oldest left, newest right */}
                {periods.map((period) => (
                  <th
                    key={period.date}
                    className="px-3 py-2 text-center font-bold whitespace-nowrap border-r border-white/20 last:border-0 min-w-[140px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        {period.isAutoDate && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" title="Timestamp otomatis" />
                        )}
                        <span>{period.label}</span>
                        <button
                          type="button"
                          title="Hapus periode ini"
                          onClick={() => setDeletePeriodConfirm(period.date)}
                          className="ml-1 text-white/50 hover:text-white font-extrabold cursor-pointer transition text-xs leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <span className="text-[9px] font-normal text-white/60">{period.date}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800">
              {DEFAULT_DATA_TYPES.map((dataType) => (
                <tr key={dataType} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  {/* Data Type Label */}
                  <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.01] whitespace-nowrap">
                    {dataType}
                  </td>
                  {/* Values per period */}
                  {periods.map((period) => {
                    const key = getCellKey(dataType, period.date);
                    const pts = getPointsForCell(dataType, period.date);
                    const editVal = edits[key];
                    const displayVal = editVal !== undefined ? editVal : (pts.length > 0 ? pts[pts.length - 1].value : newPoints[key]?.value ?? "");
                    const isDevisa = dataType.toLowerCase().includes("devisa");
                    const hasMultiplePoints = pts.length > 1;

                    return (
                      <td
                        key={period.date}
                        className="px-2 py-1.5 border-r border-gray-100 dark:border-gray-800 last:border-0"
                      >
                        <div className="flex flex-col gap-1">
                          {/* Multiple sub-values badge */}
                          {hasMultiplePoints && (
                            <div className="flex flex-wrap gap-0.5 mb-0.5">
                              {pts.map((pt, idx) => (
                                <span
                                  key={pt.id ?? idx}
                                  className="px-1.5 py-0.5 text-[9px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-500/20"
                                  title={`Update ke-${idx + 1}: ${formatDateLabel(pt.data_date)}`}
                                >
                                  {pt.value}{isDevisa && !pt.value.toLowerCase().includes("m") ? " M" : ""}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Main editable input */}
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={displayVal}
                              onChange={(e) => handleCellChange(dataType, period.date, e.target.value)}
                              placeholder={pts.length > 1 ? "(terbaru)" : isDevisa ? "0.0 M" : "0.00%"}
                              className={`w-full min-w-[80px] bg-transparent focus:outline-none text-gray-750 dark:text-gray-250 py-1 px-2 rounded border transition ${
                                editVal !== undefined
                                  ? "border-brand-400 bg-brand-50/30 dark:bg-brand-500/5"
                                  : pts.length > 0
                                  ? "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                                  : "border-dashed border-gray-250 dark:border-gray-700"
                              } text-xs`}
                            />
                            {/* Add sub-value button for data that can update frequently (Inflasi) */}
                            {pts.length > 0 && (dataType.toLowerCase().includes("inflasi") || dataType.toLowerCase().includes("lps")) && (
                              <button
                                type="button"
                                title="Tambah nilai baru di periode yang sama"
                                onClick={() => {
                                  setSubDataType(dataType);
                                  setSubDate(period.date);
                                  setSubValue("");
                                  setSubIsAuto(period.date === todayISO());
                                  setAddSubOpen(true);
                                }}
                                className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-500/20 cursor-pointer transition text-[10px] font-bold"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-400 pt-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Timestamp Otomatis (hari ini)
        </span>
        <span className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-600 text-[9px]">val</span>
          Beberapa update dalam periode yang sama
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-px border-t border-dashed border-gray-300" />
          Sel belum diisi
        </span>
      </div>

      {/* ─── Modals ─── */}

      {/* Tambah Periode */}
      <Modal isOpen={addPeriodOpen} onClose={() => setAddPeriodOpen(false)} className="max-w-[420px] p-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Tambah Periode Baru</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1.5">
              Tanggal Periode
            </label>
            <input
              type="date"
              value={newPeriodDate}
              onChange={(e) => {
                setNewPeriodDate(e.target.value);
                setNewPeriodIsAuto(e.target.value === todayISO());
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
            />
            {newPeriodDate === todayISO() ? (
              <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Tanggal hari ini — timestamp akan otomatis
              </p>
            ) : (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                📅 Tanggal historis — Anda dapat memasukkan data masa lalu
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddPeriodOpen(false)}
              className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAddPeriod}
              className="flex-1 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl cursor-pointer transition"
            >
              Tambah Kolom Periode
            </button>
          </div>
        </div>
      </Modal>

      {/* Tambah Sub-Nilai */}
      <Modal isOpen={addSubOpen} onClose={() => setAddSubOpen(false)} className="max-w-[420px] p-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Tambah Update Nilai</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Menambah nilai baru untuk <strong>{subDataType}</strong> pada periode <strong>{formatDateLabel(subDate)}</strong>.
          Nilai sebelumnya tetap tersimpan dan akan tampil sebagai titik data terpisah di grafik.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1.5">Nilai Baru</label>
            <input
              type="text"
              placeholder={subDataType.toLowerCase().includes("devisa") ? "0.0 M" : "0.00%"}
              value={subValue}
              onChange={(e) => setSubValue(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1.5">
              Tanggal Aktual Update Ini
            </label>
            <input
              type="date"
              value={subDate}
              onChange={(e) => {
                setSubDate(e.target.value);
                setSubIsAuto(e.target.value === todayISO());
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddSubOpen(false)}
              className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAddSubValue}
              disabled={saving || !subValue.trim()}
              className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl cursor-pointer transition disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Nilai Baru"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Hapus Periode Konfirmasi */}
      <Modal isOpen={!!deletePeriodConfirm} onClose={() => setDeletePeriodConfirm(null)} className="max-w-[420px] p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 bg-error-50 dark:bg-error-500/10 text-error-500 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Hapus Periode?</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Periode <strong>{deletePeriodConfirm ? formatDateLabel(deletePeriodConfirm) : ""}</strong> beserta semua data titik-titik yang tersimpan pada periode ini akan dihapus secara permanen.
          </p>
          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={() => setDeletePeriodConfirm(null)}
              className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => deletePeriodConfirm && handleDeletePeriod(deletePeriodConfirm)}
              disabled={saving}
              className="flex-1 py-2 text-xs font-bold text-white bg-error-600 hover:bg-error-700 rounded-xl cursor-pointer transition disabled:opacity-60"
            >
              {saving ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Success/Error Popup */}
      <Modal isOpen={popupOpen} onClose={() => setPopupOpen(false)} className="max-w-[380px] p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${popupType === "success" ? "bg-success-50 text-success-500" : "bg-error-50 text-error-500"}`}>
            {popupType === "success" ? (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{popupType === "success" ? "Berhasil" : "Gagal"}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{popupMsg}</p>
          <button onClick={() => setPopupOpen(false)} className={`w-full py-2 rounded-xl text-white text-xs font-semibold transition cursor-pointer ${popupType === "success" ? "bg-brand-500 hover:bg-brand-600" : "bg-error-500 hover:bg-error-600"}`}>
            Tutup
          </button>
        </div>
      </Modal>
    </div>
  );
}
