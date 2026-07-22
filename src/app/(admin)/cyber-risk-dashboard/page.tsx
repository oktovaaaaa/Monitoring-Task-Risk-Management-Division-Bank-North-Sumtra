"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { D } from "./data";

// Helper constants matching the original workbook
const C: Record<number, string> = {
  1: "#1a7a4f", // s1: strong / low
  2: "#5f9a2f", // s2: satisfactory / low to mod
  3: "#cf9c05", // s3: fair / moderate
  4: "#dd7a1f", // s4: marginal / mod to high
  5: "#c0392b", // s5: unsatisfactory / high
  0: "#a9b1a6", // s0: unrated
};

const NM: Record<string, Record<number, string>> = {
  inh: { 0: "BELUM DINILAI", 1: "LOW", 2: "LOW TO MODERATE", 3: "MODERATE", 4: "MODERATE TO HIGH", 5: "HIGH" },
  kpmr: { 0: "BELUM DINILAI", 1: "STRONG", 2: "SATISFACTORY", 3: "FAIR", 4: "MARGINAL", 5: "UNSATISFACTORY" },
  keta: { 0: "BELUM DINILAI", 1: "STRONG", 2: "SATISFACTORY", 3: "FAIR", 4: "MARGINAL", 5: "UNSATISFACTORY" },
  mat: { 0: "BELUM DINILAI", 1: "TINGKAT 1", 2: "TINGKAT 2", 3: "TINGKAT 3", 4: "TINGKAT 4", 5: "TINGKAT 5" },
  risk: { 0: "BELUM DINILAI", 1: "LOW", 2: "LOW TO MODERATE", 3: "MODERATE", 4: "MODERATE TO HIGH", 5: "HIGH" },
};

const SN: Record<number, string> = {
  0: "Belum dinilai",
  1: "Sangat Memadai",
  2: "Memadai",
  3: "Cukup Memadai",
  4: "Belum Memadai",
  5: "Belum Diterapkan",
};

const IN: Record<number, string> = {
  0: "Belum dinilai",
  1: "Low",
  2: "Low to Moderate",
  3: "Moderate",
  4: "Moderate to High",
  5: "High",
};

const CATS = [
  ["A", "Teknologi"],
  ["B", "Produk Bank"],
  ["C", "Karakteristik Organisasi"],
  ["D", "Rekam Jejak Insiden Siber"],
] as const;

const ALL_PARAMS = [...D.inh, ...D.kpmr, ...D.keta];
const TOT_PARAMS = ALL_PARAMS.length;

function band(n: number | null): 1 | 2 | 3 | 4 | 5 | 0 {
  if (n === null || isNaN(n)) return 0;
  if (n <= 1) return 1;
  if (n <= 2) return 2;
  if (n <= 3) return 3;
  if (n <= 4) return 4;
  return 5;
}

export default function CyberRiskDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Available submissions from DB
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Metadata states
  const [bankName, setBankName] = useState("PT Bank Pembangunan Daerah Sumatera Utara");
  const [assessor, setAssessor] = useState("Divisi Manajemen Risiko");

  // Assessment answers
  const [scores, setScores] = useState<Record<string, number>>({});
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [anz, setAnz] = useState<Record<string, string>>({ inh: "", mat: "", risk: "" });
  const [anzEd, setAnzEd] = useState<Record<string, boolean>>({ inh: false, mat: false, risk: false });
  const [matrices, setMatrices] = useState<Record<string, string[]>>({});
  const [editingCell, setEditingCell] = useState<{ matrixKey: string; index: number } | null>(null);
  const [tempEditValue, setTempEditValue] = useState("");

  // Year modal
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState("");

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"inh" | "kpmr" | "keta" | "rating" | "hasil" | "ref">("inh");

  // Notifications popup
  const [popup, setPopup] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showPopup = (type: "success" | "error", msg: string) => {
    setPopup({ type, message: msg });
    setTimeout(() => setPopup(null), 1000);
  };

  // Sync token & user
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch submissions from backend
  const fetchSubmissions = useCallback(async (tok: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/cyber-risk/submissions", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        const list = data.data || [];
        setSubmissions(list);
        if (list.length > 0) {
          // Default to latest year
          const latestYear = list[0].year;
          setActiveYear(latestYear);
        }
      }
    } catch (err: any) {
      showPopup("error", "Gagal memuat data dari server: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchSubmissions(token);
    }
  }, [token, fetchSubmissions]);

  // Load active submission or initialize template
  useEffect(() => {
    const activeSub = submissions.find((s) => s.year === activeYear);
    if (activeSub) {
      setBankName(activeSub.bank_name || "PT Bank Pembangunan Daerah Sumatera Utara");
      setAssessor(activeSub.assessor || "Divisi Manajemen Risiko");
      try {
        setScores(JSON.parse(activeSub.scores || "{}"));
        setRefs(JSON.parse(activeSub.refs || "{}"));
        setUnits(JSON.parse(activeSub.units || "{}"));
        setAnz(JSON.parse(activeSub.anz || '{"inh":"","mat":"","risk":""}'));
        setAnzEd(JSON.parse(activeSub.anz_ed || '{"inh":false,"mat":false,"risk":false}'));
        
        try {
          const parsedMatrices = JSON.parse(activeSub.matrices || "{}");
          const loadedMatrices: Record<string, string[]> = {};
          ["inheren", "kpmr", "ketahanan", "maturitas", "risiko"].forEach((key) => {
            if (Array.isArray(parsedMatrices[key])) {
              loadedMatrices[key] = parsedMatrices[key];
            } else {
              loadedMatrices[key] = (D.matrix as any)[key === "inheren" ? "inheren" : key].map((r: any) => r[1]);
            }
          });
          setMatrices(loadedMatrices);
        } catch (err) {
          console.error("Error parsing matrices", err);
          const defaultMatrices: Record<string, string[]> = {};
          defaultMatrices["inheren"] = D.matrix.inheren.map((r: any) => r[1]);
          defaultMatrices["kpmr"] = D.matrix.kpmr.map((r: any) => r[1]);
          defaultMatrices["ketahanan"] = D.matrix.ketahanan.map((r: any) => r[1]);
          defaultMatrices["maturitas"] = D.matrix.maturitas.map((r: any) => r[1]);
          defaultMatrices["risiko"] = D.matrix.risiko.map((r: any) => r[1]);
          setMatrices(defaultMatrices);
        }
      } catch (e) {
        console.error("Error parsing assessment JSON fields", e);
      }
    } else {
      // Template initialization
      const initScores: Record<string, number> = {};
      const initRefs: Record<string, string> = {};
      const initUnits: Record<string, string> = {};
      ALL_PARAMS.forEach((c) => {
        initScores[c.code] = 0;
        initRefs[c.code] = c.ref;
        initUnits[c.code] = c.unit;
      });
      setScores(initScores);
      setRefs(initRefs);
      setUnits(initUnits);
      setAnz({ inh: "", mat: "", risk: "" });
      setAnzEd({ inh: false, mat: false, risk: false });

      const defaultMatrices: Record<string, string[]> = {};
      defaultMatrices["inheren"] = D.matrix.inheren.map((r: any) => r[1]);
      defaultMatrices["kpmr"] = D.matrix.kpmr.map((r: any) => r[1]);
      defaultMatrices["ketahanan"] = D.matrix.ketahanan.map((r: any) => r[1]);
      defaultMatrices["maturitas"] = D.matrix.maturitas.map((r: any) => r[1]);
      defaultMatrices["risiko"] = D.matrix.risiko.map((r: any) => r[1]);
      setMatrices(defaultMatrices);
    }
  }, [activeYear, submissions]);

  // Score getter helper
  const getScore = useCallback((c: { code: string }) => {
    return scores[c.code] || 0;
  }, [scores]);

  // Calculation formulas
  const avg = useCallback((list: any[]) => {
    const vals = list.map(getScore).filter((s) => s >= 1 && s <= 5);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [getScore]);

  const doneCount = useCallback((list: any[]) => {
    return list.filter((c) => getScore(c) >= 1).length;
  }, [getScore]);

  const isFull = useCallback((list: any[]) => {
    return doneCount(list) === list.length;
  }, [doneCount]);

  const inhAvgVal = useMemo(() => {
    const cs = CATS.map(([cc]) => avg(D.inh.filter((x) => x.catCode === cc)));
    if (cs.some((v) => v === null)) {
      return { v: avg(D.inh), partial: true };
    }
    return { v: cs.reduce((a: number, b: any) => a + (b || 0), 0) / 4, partial: !isFull(D.inh) };
  }, [avg, isFull]);

  const kpmrAvgVal = useMemo(() => avg(D.kpmr), [avg]);
  const ketaAvgVal = useMemo(() => avg(D.keta), [avg]);

  const maturitasVal = useMemo(() => {
    return kpmrAvgVal !== null && ketaAvgVal !== null ? (kpmrAvgVal + ketaAvgVal) / 2 : null;
  }, [kpmrAvgVal, ketaAvgVal]);

  const finalRiskVal = useMemo(() => {
    return inhAvgVal.v !== null && maturitasVal !== null ? (inhAvgVal.v + maturitasVal) / 2 : null;
  }, [inhAvgVal.v, maturitasVal]);

  // Total answered params
  const totalAnswered = useMemo(() => {
    return ALL_PARAMS.filter((c) => getScore(c) >= 1).length;
  }, [getScore]);

  // Auto-drafting findings analysis
  const getFindings = useCallback(() => {
    const list: string[] = [];
    const det = avg(D.keta.filter((c) => ["3.a", "3.b", "3.c", "3.d", "3.e"].includes(c.code)));
    const track1 = getScore({ code: "4.1" });
    const track2 = getScore({ code: "4.2" });

    if ((track1 === 1 || track2 === 1) && det !== null && det >= 3) {
      list.push(
        `Rekam Jejak diskor 1 (tidak ada insiden signifikan) sementara rata-rata proses deteksi (Ketahanan 3.a–3.e) = ${det.toFixed(
          2
        )}. Pada deteksi yang lemah, nol insiden lebih mungkin berarti tidak terdeteksi, bukan tidak terjadi; skor ini hanya kredibel bila didukung register insiden dan bukti deteksi yang teruji.`
      );
    }

    const inh17 = getScore({ code: "1.7" });
    const keta2j = getScore({ code: "2.j" });
    if (inh17 >= 4 && keta2j >= 1 && keta2j <= 2) {
      list.push(
        `Inheren 1.7 (aset EOL) = ${inh17} sementara Ketahanan 2.j (patching) = ${keta2j}, padahal Penjelasan pada berkas menyatakan patching belum maksimal. Kedua angka ini tidak dapat benar bersamaan.`
      );
    }

    const tprm = avg(D.kpmr.filter((c) => ["2.3.g", "2.3.h", "2.3.i"].includes(c.code)));
    const ex = Math.max(
      getScore({ code: "1.10" }),
      getScore({ code: "1.5" }),
      getScore({ code: "2.2" }),
      getScore({ code: "2.5" })
    );
    if (ex >= 4 && tprm !== null && tprm <= 2) {
      list.push(
        `Eksposur pihak ketiga tertinggi = ${ex} (dari parameter 1.5/1.10/2.2/2.5) sementara KPMR 2.3.g–2.3.i (kebijakan dan standar minimum pihak ketiga) rata-rata ${tprm.toFixed(
          2
        )}. Penjelasan pada berkas menyatakan ketentuan turunan baru akan diterbitkan; ini gap struktural TPRM, bukan sekadar selisih skor.`
      );
    }

    if (inhAvgVal.v !== null && maturitasVal !== null && band(inhAvgVal.v) >= 4 && band(maturitasVal) <= 2) {
      list.push(
        `Risiko Inheren ${NM.inh[band(inhAvgVal.v)]} berpasangan dengan Maturitas ${NM.mat[band(maturitasVal)]}. Eksposur setinggi ini menuntut bukti kontrol yang jauh lebih tebal; kombinasi ini akan menjadi sasaran pengujian pertama pemeriksa.`
      );
    }

    const t31 = getScore({ code: "3.1" });
    const k32a = getScore({ code: "3.2.a" });
    if (t31 >= 1 && t31 <= 2 && k32a >= 4) {
      list.push(
        `Turnover SDM TI (3.1) = ${t31} namun kecukupan SDM (KPMR 3.2.a) = ${k32a}. Ini persoalan formasi, bukan retensi; rencana perbaikan harus menyasar penambahan headcount dan sertifikasi, bukan program retensi.`
      );
    }

    const t18 = getScore({ code: "1.8" });
    const t19 = getScore({ code: "1.9" });
    if (t18 >= 3 && t19 >= 4) {
      list.push(
        `BYOD luas (1.8 = ${t18}) sekaligus dapat menjangkau aplikasi kritikal (1.9 = ${t19}). Dua parameter ini berlipat, bukan menjumlah; pastikan MDM/MAM dan segmentasi tercermin pada Ketahanan 2.g.`
      );
    }

    const t33 = getScore({ code: "3.3" });
    const t110 = getScore({ code: "1.10" });
    if (t33 >= 3 && t110 >= 4) {
      list.push(
        `Privilege access dikelola di luar unit TI (3.3 = ${t33}) bersamaan dengan akses pihak ketiga substansial (1.10 = ${t110}) — jalur serangan rantai pasok klasik. Uji silang ke KPMR 2.3.i dan Ketahanan 2.g.`
      );
    }

    const flaggedOnes = [...D.kpmr, ...D.keta].filter((c) => c.flag && getScore(c) === 1);
    if (flaggedOnes.length > 0) {
      list.push(
        `Kontrol ${flaggedOnes.map((c) => c.code).join(", ")} diskor 1 (Sangat Memadai) padahal Penjelasan pada berkas mengakui bukti belum terbit atau kelemahan diakui. Skor 1 berarti tidak ada temuan.`
      );
    }

    return list;
  }, [getScore, avg, inhAvgVal.v, maturitasVal]);

  const topCats = useMemo(() => {
    return CATS.map(([cc, cn]) => ({
      cn,
      v: avg(D.inh.filter((x) => x.catCode === cc)),
    }))
      .filter((x) => x.v !== null)
      .sort((a, b) => (b.v || 0) - (a.v || 0));
  }, [avg]);

  const tmplRefsLeft = useMemo(() => {
    return ALL_PARAMS.filter((c) => refs[c.code] === c.ref).length;
  }, [refs]);

  // Draft text generation for analysis textareas
  const generateDraft = useCallback((kind: "inh" | "mat" | "risk") => {
    if (kind === "inh") {
      if (inhAvgVal.v === null) return "";
      const tc = topCats;
      const hi = D.inh.filter((c) => getScore(c) >= 4).map((c) => c.code);
      let t = `Peringkat Risiko Inheren ${NM.inh[band(inhAvgVal.v)]} (nilai ${inhAvgVal.v.toFixed(2)})${
        inhAvgVal.partial ? ", bersifat sementara karena penilaian belum lengkap" : ""
      }. `;
      if (tc.length) {
        t += `Kategori penyumbang eksposur tertinggi: ${tc[0].cn} (${tc[0].v?.toFixed(2)})${
          tc[1] ? `, diikuti ${tc[1].cn} (${tc[1].v?.toFixed(2)})` : ""
        }. `;
      }
      t += hi.length ? `Parameter dengan eksposur tinggi (skor ≥4): ${hi.join(", ")}. ` : `Tidak ada parameter dengan skor ≥4. `;
      t += `Nilai inheren dihitung berdasarkan rata-rata tertimbang dari masing-masing kategori (Teknologi, Produk Bank, Karakteristik Organisasi, dan Rekam Jejak Insiden). `;
      t += `Seluruh parameter inheren merupakan fakta terhitung dan wajib direkonsiliasi ke data sumber (topologi jaringan, CMDB, HRIS, register insiden), bukan penilaian pendapat.`;
      return t;
    }
    if (kind === "mat") {
      if (maturitasVal === null) return "";
      const wk = [...new Set(D.kpmr.map((c) => c.domain))]
        .map((d) => ({ d, v: avg(D.kpmr.filter((c) => c.domain === d)) }))
        .filter((x) => x.v !== null)
        .sort((x, y) => (y.v || 0) - (x.v || 0));
      const wt = [...new Set(D.keta.map((c) => c.domain))]
        .map((d) => ({ d, v: avg(D.keta.filter((c) => c.domain === d)) }))
        .filter((x) => x.v !== null)
        .sort((x, y) => (y.v || 0) - (x.v || 0));
      const fl = [...D.kpmr, ...D.keta].filter((c) => c.flag && getScore(c) === 1);
      let t = `Tingkat Maturitas ${NM.mat[band(maturitasVal)]} (nilai ${maturitasVal.toFixed(2)}) = rata-rata KPMR ${
        kpmrAvgVal !== null ? kpmrAvgVal.toFixed(2) : "—"
      } (${kpmrAvgVal === null ? "—" : NM.kpmr[band(kpmrAvgVal)]}) dan Kualitas Proses Ketahanan Siber ${
        ketaAvgVal !== null ? ketaAvgVal.toFixed(2) : "—"
      } (${ketaAvgVal === null ? "—" : NM.keta[band(ketaAvgVal)]})${
        !isFull(D.kpmr) || !isFull(D.keta) ? ", bersifat sementara karena penilaian belum lengkap" : ""
      }. `;
      if (wk.length) t += `Domain KPMR terlemah: ${wk[0].d} (${wk[0].v?.toFixed(2)}). `;
      if (wt.length) t += `Domain ketahanan terlemah: ${wt[0].d} (${wt[0].v?.toFixed(2)}). `;
      if (fl.length) t += `Perhatian: kontrol ${fl.map((c) => c.code).join(", ")} diskor Sangat Memadai padahal Penjelasan pada berkas mengakui bukti belum terbit. `;
      if (tmplRefsLeft) {
        t += `Sebanyak ${tmplRefsLeft} dari ${TOT_PARAMS} kolom Referensi Dokumen masih berisi template usulan dan belum diganti dengan nomor dokumen riil; selama itu belum dilakukan, skor belum didukung bukti.`;
      }
      return t;
    }
    if (kind === "risk") {
      if (finalRiskVal === null) return "";
      const F = getFindings();
      let t = `Peringkat Tingkat Risiko terkait Keamanan Siber ${NM.risk[band(finalRiskVal)]} (nilai ${finalRiskVal.toFixed(2)}), dihitung sebagai rata-rata Peringkat Risiko Inheren ${
        inhAvgVal.v !== null ? inhAvgVal.v.toFixed(2) : "—"
      } dan Peringkat Tingkat Maturitas ${maturitasVal !== null ? maturitasVal.toFixed(2) : "—"}. `;
      t += `Nilai tingkat risiko akhir dihitung sebagai rata-rata dari Peringkat Risiko Inheren dan Peringkat Tingkat Maturitas Keamanan Siber. Kedua faktor ini dilaporkan secara berdampingan untuk memberikan gambaran komprehensif atas profil risiko siber. `;
      if (F.length > 0) {
        t += `\n\nHasil uji silang antarkertas kerja menemukan ${F.length} inkonsistensi yang perlu diselesaikan sebelum peringkat ini difinalkan:\n`;
        F.forEach((f, i) => {
          t += `\n${i + 1}. ${f}\n`;
        });
      } else {
        t += `Tidak ditemukan inkonsistensi antarkertas kerja pada parameter yang telah diskor.`;
      }
      return t;
    }
    return "";
  }, [inhAvgVal, maturitasVal, finalRiskVal, getScore, kpmrAvgVal, ketaAvgVal, isFull, topCats, avg, tmplRefsLeft, getFindings]);

  // Handler for textareas values
  const getAnzValue = (kind: "inh" | "mat" | "risk") => {
    return anzEd[kind] ? anz[kind] : generateDraft(kind);
  };

  const handleAnzChange = (kind: "inh" | "mat" | "risk", value: string) => {
    setAnz((prev) => ({ ...prev, [kind]: value }));
    setAnzEd((prev) => ({ ...prev, [kind]: true }));
  };

  const handleRebuild = (kind: "inh" | "mat" | "risk") => {
    setAnzEd((prev) => ({ ...prev, [kind]: false }));
    setAnz((prev) => ({ ...prev, [kind]: generateDraft(kind) }));
  };

  // Add new assessment year
  const handleAddYear = () => {
    const yr = parseInt(newYearInput.trim());
    if (isNaN(yr) || yr < 2000 || yr > 2100) {
      showPopup("error", "Format tahun tidak valid (masukkan angka 2000-2100).");
      return;
    }
    if (submissions.some((s) => s.year === yr)) {
      showPopup("error", `Tahun ${yr} sudah terdaftar.`);
      return;
    }

    // Initialize in memory
    const newSub = {
      year: yr,
      bank_name: "PT Bank Pembangunan Daerah Sumatera Utara",
      assessor: "Divisi Manajemen Risiko",
      scores: "{}",
      refs: "{}",
      units: "{}",
      anz: '{"inh":"","mat":"","risk":""}',
      anz_ed: '{"inh":false,"mat":false,"risk":false}',
    };

    setSubmissions((prev) => [newSub, ...prev].sort((a, b) => b.year - a.year));
    setActiveYear(yr);
    setIsAddYearOpen(false);
    setNewYearInput("");
    showPopup("success", `Tahun ${yr} berhasil ditambahkan. Silakan isi penilaian.`);
  };

  // Delete assessment year
  const handleDeleteYear = async () => {
    setIsDeleteConfirmOpen(false);
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8080/api/cyber-risk/submissions/${activeYear}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        showPopup("success", `Penilaian tahun ${activeYear} berhasil dihapus.`);
        const nextSubmissions = submissions.filter((s) => s.year !== activeYear);
        setSubmissions(nextSubmissions);
        if (nextSubmissions.length > 0) {
          setActiveYear(nextSubmissions[0].year);
        } else {
          setActiveYear(new Date().getFullYear());
        }
      } else {
        showPopup("error", data.message || "Gagal menghapus data.");
      }
    } catch (err: any) {
      showPopup("error", "Gagal menghubungi server: " + err.message);
    }
  };

  // Save to DB
  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const bodyPayload = {
        year: activeYear,
        bank_name: bankName,
        assessor: assessor,
        scores: JSON.stringify(scores),
        refs: JSON.stringify(refs),
        units: JSON.stringify(units),
        anz: JSON.stringify({
          inh: getAnzValue("inh"),
          mat: getAnzValue("mat"),
          risk: getAnzValue("risk"),
        }),
        anz_ed: JSON.stringify(anzEd),
        matrices: JSON.stringify(matrices),
      };

      const res = await fetch("http://localhost:8080/api/cyber-risk/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        showPopup("success", "Penilaian berhasil disimpan ke database!");
        // Refresh submissions
        fetchSubmissions(token);
      } else {
        showPopup("error", data.message || "Gagal menyimpan data.");
      }
    } catch (err: any) {
      showPopup("error", "Gagal menghubungi server: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Excel Export Function (OJK Template Based with Style Preservation)
  const handleExportExcel = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:8080/api/cyber-risk/export/${activeYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || "Gagal mengunduh Excel dari server.");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Maturitas_Siber_PT_Bank_Sumut_${activeYear}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showPopup("success", "Kertas kerja Excel berhasil diekspor dengan format asli OJK!");
    } catch (err: any) {
      console.error(err);
      showPopup("error", "Gagal mengekspor Excel: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // PDF Export Function (xhtml2pdf Direct Download)
  const handleExportPDF = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:8080/api/cyber-risk/pdf/${activeYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || "Gagal mengunduh PDF dari server.");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Hasil_Penilaian_Risiko_Siber_PT_Bank_Sumut_${activeYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showPopup("success", "Laporan PDF berhasil diunduh!");
    } catch (err: any) {
      console.error(err);
      showPopup("error", "Gagal mengekspor PDF: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in print:p-0 print:m-0">
      {/* Print helper stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
          }
          
          /* Hide sidebar, header topbar, page navigation tabs, action buttons */
          header, 
          aside,
          .no-print,
          .tabs,
          .acts-container,
          .sidebar-container,
          .top-header-panel,
          .nav-sidebar,
          button,
          .btn-save,
          .no-print-element {
            display: none !important;
          }
          
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          
          .card {
            border: 1px solid #e2e8f0 !important;
            background: #fff !important;
            box-shadow: none !important;
          }

          .print-card-grid {
            display: grid !important;
            grid-template-columns: repeat(5, 1fr) !important;
            gap: 12px !important;
            margin-bottom: 20px !important;
          }

          .levels-grid {
            display: block !important;
          }

          .levels-grid button {
            border: 1px solid #ccc !important;
            color: #000 !important;
            margin-bottom: 3px !important;
          }

          /* Form/Textarea printing formatting to grow dynamically */
          textarea {
            display: none !important;
          }

          /* Force page break on main sections if printing all */
          .print-section {
            page-break-after: auto;
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 30px !important;
          }
        }
      `}</style>

      {/* Floating notifications */}
      {popup && (
        <div
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all ${
            popup.type === "success"
              ? "bg-emerald-500 text-white border border-emerald-400"
              : "bg-rose-500 text-white border border-rose-400"
          }`}
        >
          {popup.type === "success" ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="text-sm font-semibold">{popup.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-950 border border-emerald-900/40 p-6 shadow-theme-md md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Kertas Kerja Penilaian OJK
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
              Penilaian Risiko Keamanan Siber
            </h1>
            <p className="text-sm text-emerald-200 max-w-2xl font-light leading-relaxed">
              Kertas Kerja 100 Parameter (Risiko Inheren, Tata Kelola & KPMR, serta Proses Ketahanan Siber) PT Bank Sumut.
            </p>

            {/* Config Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 no-print">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">Nama Bank</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="bg-emerald-950/80 border border-emerald-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-emerald-600 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">Penilai / Unit</label>
                <input
                  type="text"
                  value={assessor}
                  onChange={(e) => setAssessor(e.target.value)}
                  className="bg-emerald-950/80 border border-emerald-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-emerald-600 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">Tahun / Periode</label>
                <div className="flex items-center gap-2">
                  <select
                    value={activeYear}
                    onChange={(e) => setActiveYear(parseInt(e.target.value))}
                    className="flex-1 bg-emerald-950/80 border border-emerald-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {submissions.length === 0 ? (
                      <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                    ) : (
                      submissions.map((s) => (
                        <option key={s.year} value={s.year}>
                          Tahun {s.year}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    onClick={() => setIsAddYearOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl p-1.5 text-xs font-bold transition-all flex items-center justify-center shrink-0 border border-emerald-500"
                    title="Tambah Tahun Penilaian"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0 no-print">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-theme-xs transition-all flex items-center gap-2 border border-emerald-500"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              Simpan ke Database
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-teal-650 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-theme-xs transition-all flex items-center gap-2 border border-teal-550"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Unduh Excel
            </button>
             <button
              onClick={handleExportPDF}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-theme-xs transition-all flex items-center gap-2 border border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Unduh PDF
            </button>
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="bg-rose-900/60 hover:bg-rose-800 text-rose-200 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border border-rose-800/40"
              title="Hapus tahun ini"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
      </div>

      {/* Main calculation scores board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 print-card-grid">
        {/* Risiko Inheren */}
        <div className="rounded-3xl border border-orange-200 dark:border-orange-950/20 bg-orange-50/10 p-5 shadow-theme-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
            <span>Risiko Inheren</span>
            <span className="opacity-60">(20 Parameter)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {inhAvgVal.v !== null ? inhAvgVal.v.toFixed(2) : "—"}
            </span>
            {inhAvgVal.v !== null && (
              <span
                style={{ backgroundColor: C[band(inhAvgVal.v)] }}
                className="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
              >
                {NM.inh[band(inhAvgVal.v)]}
              </span>
            )}
          </div>
          {/* Gauge meter */}
          {inhAvgVal.v !== null && (
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-3.5 overflow-hidden">
              <div
                style={{
                  width: `${((inhAvgVal.v - 1) / 4) * 100}%`,
                  backgroundColor: C[band(inhAvgVal.v)],
                }}
                className="h-full rounded-full transition-all duration-300"
              ></div>
            </div>
          )}
          {inhAvgVal.partial && (
            <div className="mt-3 text-[9px] font-bold text-orange-600 bg-orange-100/50 dark:bg-orange-550/10 px-2 py-0.5 rounded-md inline-block">
              PARSIAL
            </div>
          )}
        </div>

        {/* KPMR */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-white/[0.02] p-5 shadow-theme-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>KPMR Siber</span>
            <span className="opacity-60">(56 Parameter)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {kpmrAvgVal !== null ? kpmrAvgVal.toFixed(2) : "—"}
            </span>
            {kpmrAvgVal !== null && (
              <span
                style={{ backgroundColor: C[band(kpmrAvgVal)] }}
                className="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
              >
                {NM.kpmr[band(kpmrAvgVal)]}
              </span>
            )}
          </div>
          {/* Gauge meter */}
          {kpmrAvgVal !== null && (
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-3.5 overflow-hidden">
              <div
                style={{
                  width: `${((kpmrAvgVal - 1) / 4) * 100}%`,
                  backgroundColor: C[band(kpmrAvgVal)],
                }}
                className="h-full rounded-full transition-all duration-300"
              ></div>
            </div>
          )}
          {!isFull(D.kpmr) && kpmrAvgVal !== null && (
            <div className="mt-3 text-[9px] font-bold text-amber-600 bg-amber-100/50 dark:bg-amber-550/10 px-2 py-0.5 rounded-md inline-block">
              PARSIAL
            </div>
          )}
        </div>

        {/* Ketahanan Siber */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-white/[0.02] p-5 shadow-theme-xs">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <span>Ketahanan Siber</span>
            <span className="opacity-60">(24 Parameter)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {ketaAvgVal !== null ? ketaAvgVal.toFixed(2) : "—"}
            </span>
            {ketaAvgVal !== null && (
              <span
                style={{ backgroundColor: C[band(ketaAvgVal)] }}
                className="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
              >
                {NM.keta[band(ketaAvgVal)]}
              </span>
            )}
          </div>
          {/* Gauge meter */}
          {ketaAvgVal !== null && (
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-3.5 overflow-hidden">
              <div
                style={{
                  width: `${((ketaAvgVal - 1) / 4) * 100}%`,
                  backgroundColor: C[band(ketaAvgVal)],
                }}
                className="h-full rounded-full transition-all duration-300"
              ></div>
            </div>
          )}
          {!isFull(D.keta) && ketaAvgVal !== null && (
            <div className="mt-3 text-[9px] font-bold text-amber-600 bg-amber-100/50 dark:bg-amber-550/10 px-2 py-0.5 rounded-md inline-block">
              PARSIAL
            </div>
          )}
        </div>

        {/* Maturitas Siber */}
        <div className="rounded-3xl border border-emerald-250 dark:border-emerald-900/30 bg-emerald-50/10 dark:bg-emerald-950/5 p-5 shadow-theme-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              <span>Maturitas Siber</span>
              <span className="opacity-60">(Rata-rata)</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {maturitasVal !== null ? maturitasVal.toFixed(2) : "—"}
              </span>
              {maturitasVal !== null && (
                <span
                  style={{ backgroundColor: C[band(maturitasVal)] }}
                  className="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
                >
                  Tingkat {band(maturitasVal)}
                </span>
              )}
            </div>
            {/* Gauge meter */}
            {maturitasVal !== null && (
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mt-3.5 overflow-hidden">
                <div
                  style={{
                    width: `${((maturitasVal - 1) / 4) * 100}%`,
                    backgroundColor: C[band(maturitasVal)],
                  }}
                  className="h-full rounded-full transition-all duration-300"
                ></div>
              </div>
            )}
          </div>
          <div className="mt-4 text-[9px] text-emerald-700/80 dark:text-emerald-400/80 leading-normal font-light">
            Kriteria: T1 (≤1) · T2 (≤2) · T3 (≤3) · T4 (≤4) · T5 (&gt;4)
          </div>
        </div>

        {/* Peringkat Tingkat Risiko */}
        <div className="rounded-3xl bg-slate-900 text-white p-5 shadow-theme-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
              Tingkat Risiko Keamanan Siber (Akhir)
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {finalRiskVal !== null ? finalRiskVal.toFixed(2) : "—"}
              </span>
              {finalRiskVal !== null ? (
                <span
                  style={{ backgroundColor: C[band(finalRiskVal)] }}
                  className="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
                >
                  {NM.risk[band(finalRiskVal)]}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 px-2.5 py-0.5 rounded-full uppercase bg-slate-800">
                  BELUM LENGKAP
                </span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-4 leading-normal font-light">
            {finalRiskVal !== null
              ? `Nilai ${finalRiskVal.toFixed(2)} · Inheren ${
                  inhAvgVal.v !== null ? inhAvgVal.v.toFixed(2) : "—"
                } / Maturitas ${maturitasVal !== null ? maturitasVal.toFixed(2) : "—"}`
              : "Menunggu seluruh parameter dinilai"}
          </div>
        </div>
      </div>

      {/* Answer completion details progress bar */}
      <div className="bg-white border border-gray-250 dark:bg-white/[0.03] dark:border-gray-800 rounded-3xl p-5 shadow-theme-xs flex items-center gap-4 no-print">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
          Progress: {totalAnswered} / {TOT_PARAMS} Parameter Dinilai
        </span>
        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${(totalAnswered / TOT_PARAMS) * 100}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
          ></div>
        </div>
      </div>



      {/* Tabs Navigation */}
      <div className="tabs flex border-b border-gray-200 dark:border-gray-800 gap-1 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab("inh")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "inh"
              ? "text-orange-600 border-orange-600"
              : "text-gray-500 border-transparent hover:text-gray-800"
          }`}
        >
          Kertas Kerja A-D — Risiko Inheren
          <span className="ml-2 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[10px]">
            {doneCount(D.inh)}/{D.inh.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("kpmr")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "kpmr"
              ? "text-emerald-600 border-emerald-600"
              : "text-gray-500 border-transparent hover:text-gray-800"
          }`}
        >
          Kertas Kerja E — KPMR
          <span className="ml-2 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full text-[10px]">
            {doneCount(D.kpmr)}/{D.kpmr.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("keta")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "keta"
              ? "text-emerald-600 border-emerald-600"
              : "text-gray-500 border-transparent hover:text-gray-800"
          }`}
        >
          Kertas Kerja F — Ketahanan
          <span className="ml-2 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full text-[10px]">
            {doneCount(D.keta)}/{D.keta.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("rating")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "rating"
              ? "text-emerald-600 border-emerald-600"
              : "text-gray-500 border-transparent hover:text-gray-800"
          }`}
        >
          Rating Siber
        </button>
        <button
          onClick={() => setActiveTab("hasil")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "hasil"
              ? "text-emerald-600 border-emerald-600"
              : "text-gray-500 border-transparent hover:text-gray-800"
          }`}
        >
          Hasil Penilaian
        </button>
        <button
          onClick={() => setActiveTab("ref")}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === "ref"
              ? "text-emerald-600 border-emerald-600"
              : "text-gray-500 border-transparent hover:text-gray-800"
          }`}
        >
          Matriks Peringkat
        </button>
      </div>

      {/* Tabs Panels */}
      <div className="space-y-6">
        {/* Tab Panel 1: Risiko Inheren */}
        {activeTab === "inh" && (
          <div className="space-y-6 print-section print-full-width">
            {CATS.map(([cc, cn]) => {
              const catParams = D.inh.filter((x) => x.catCode === cc);
              const catAvg = avg(catParams);
              return (
                <div key={cc} className="bg-white border border-gray-200 dark:bg-white/[0.03] dark:border-gray-800 rounded-3xl p-6 shadow-theme-xs">
                  <div className="flex items-center justify-between border-b pb-3 mb-5 border-gray-100 dark:border-gray-800">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <span className="bg-orange-100 text-orange-700 dark:bg-orange-550/10 dark:text-orange-400 px-3 py-1 rounded-xl text-xs font-bold">
                        {cc}
                      </span>
                      {cn}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Rata-rata:</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {catAvg !== null ? catAvg.toFixed(2) : "—"}
                      </span>
                      {catAvg !== null && (
                        <span
                          style={{ backgroundColor: C[band(catAvg)] }}
                          className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full uppercase"
                        >
                          {IN[band(catAvg)]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {catParams.map((p) => {
                      const score = getScore(p);
                      const isTemplateRef = refs[p.code] === p.ref;
                      const isTemplateUnit = units[p.code] === p.unit;

                      return (
                        <div key={p.code} className="border border-gray-150 dark:border-gray-800/80 rounded-2xl p-4 space-y-4">
                          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-start gap-2.5">
                                <span className="bg-orange-50 text-orange-700 dark:bg-orange-550/5 dark:text-orange-450 border border-orange-200/50 dark:border-orange-800/20 px-2.5 py-1 rounded-xl text-xs font-extrabold shrink-0">
                                  {p.code}
                                </span>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                                  {p.title}
                                </div>
                              </div>
                              {p.note && (
                                <p className="text-xs text-slate-550 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-slate-800/30 p-2.5 rounded-xl font-light leading-normal mt-2">
                                  ⚑ Catatan interpretasi: {p.note}
                                </p>
                              )}
                            </div>

                            {/* Scoring Box */}
                            <div className="shrink-0 w-full lg:w-auto">
                              <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">
                                Hasil Penilaian
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {[1, 2, 3, 4, 5].map((val) => (
                                  <button
                                    key={val}
                                    onClick={() => setScores((prev) => ({ ...prev, [p.code]: val }))}
                                    style={{
                                      backgroundColor: score === val ? C[val] : "",
                                      borderColor: score === val ? "transparent" : "",
                                    }}
                                    className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all ${
                                      score === val
                                        ? "text-white shadow-theme-xs"
                                        : "bg-white border-gray-250 text-gray-600 hover:border-orange-500 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300"
                                    }`}
                                    title={IN[val as 1 | 2 | 3 | 4 | 5]}
                                  >
                                    {val}
                                  </button>
                                ))}
                                {score > 0 && (
                                  <button
                                    onClick={() => setScores((prev) => ({ ...prev, [p.code]: 0 }))}
                                    className="text-[10px] text-gray-400 hover:text-rose-500 underline ml-2 cursor-pointer no-print"
                                  >
                                    clear
                                  </button>
                                )}
                              </div>
                              <span className="block text-xs font-bold mt-2" style={{ color: score > 0 ? C[score] : "#94a3b8" }}>
                                {score > 0 ? `${score} · ${IN[score as 1 | 2 | 3 | 4 | 5]}` : "Belum dinilai"}
                              </span>
                            </div>
                          </div>

                          {/* Levels descriptions options select buttons */}
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 levels-grid">
                            {p.levels.map((lvlText, idx) => {
                              const lvlVal = idx + 1;
                              const isSelected = score === lvlVal;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setScores((prev) => ({ ...prev, [p.code]: lvlVal }))}
                                  style={{
                                    backgroundColor: isSelected ? C[lvlVal] : "",
                                    borderColor: isSelected ? "transparent" : "",
                                  }}
                                  className={`border text-left rounded-xl p-3 text-[10.5px] leading-relaxed transition-all cursor-pointer ${
                                    isSelected
                                      ? "text-white shadow-theme-sm font-semibold"
                                      : "bg-gray-50/50 hover:bg-white border-gray-200 text-gray-500 hover:border-orange-300 dark:bg-white/[0.01] dark:border-gray-800 dark:hover:bg-white/[0.03]"
                                  }`}
                                >
                                  <div className="font-mono text-[9px] font-extrabold tracking-wider opacity-60 uppercase mb-1">
                                    Peringkat {lvlVal}
                                  </div>
                                  <div>{lvlText}</div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Fields refs & units */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-dashed border-gray-150 dark:border-gray-850">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                  Referensi Dokumen
                                </label>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    isTemplateRef
                                      ? "bg-gray-100 text-gray-500 dark:bg-gray-800"
                                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                  }`}
                                >
                                  {isTemplateRef ? "template" : "✓ diisi bank"}
                                </span>
                              </div>
                              <textarea
                                value={refs[p.code] || ""}
                                onChange={(e) => setRefs((prev) => ({ ...prev, [p.code]: e.target.value }))}
                                className="w-full text-xs bg-gray-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 focus:outline-hidden focus:border-emerald-500 resize-y min-h-[50px] dark:bg-gray-900 dark:border-gray-850 dark:text-white"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                  Penanggung Jawab / Unit Kerja
                                </label>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    isTemplateUnit
                                      ? "bg-gray-100 text-gray-500 dark:bg-gray-800"
                                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                  }`}
                                >
                                  {isTemplateUnit ? "template" : "✓ diisi bank"}
                                </span>
                              </div>
                              <textarea
                                value={units[p.code] || ""}
                                onChange={(e) => setUnits((prev) => ({ ...prev, [p.code]: e.target.value }))}
                                className="w-full text-xs bg-gray-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 focus:outline-hidden focus:border-emerald-500 resize-y min-h-[50px] dark:bg-gray-900 dark:border-gray-850 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-gray-800 no-print">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-md transition-all flex items-center gap-2 border border-emerald-500 cursor-pointer"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
                Simpan Semua Kertas Kerja ({activeYear})
              </button>
            </div>
          </div>
        )}

        {/* Tab Panel 2: KPMR */}
        {activeTab === "kpmr" && (
          <div className="space-y-6 print-section print-full-width">
            {(() => {
              const domains = [...new Set(D.kpmr.map((c) => c.domain))];
              return domains.map((domain, i) => {
                const domainParams = D.kpmr.filter((c) => c.domain === domain);
                const domainAvg = avg(domainParams);
                return (
                  <div key={domain} className="bg-white border border-gray-200 dark:bg-white/[0.03] dark:border-gray-800 rounded-3xl p-6 shadow-theme-xs">
                    <div className="flex items-center justify-between border-b pb-3 mb-5 border-gray-100 dark:border-gray-800">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-550/10 dark:text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold">
                          {i + 1}
                        </span>
                        {domain}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">Rata-rata:</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {domainAvg !== null ? domainAvg.toFixed(2) : "—"}
                        </span>
                        {domainAvg !== null && (
                          <span
                            style={{ backgroundColor: C[band(domainAvg)] }}
                            className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full uppercase"
                          >
                            T{band(domainAvg)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subgroups mapping */}
                    <div className="space-y-8">
                      {(() => {
                        const subs = [...new Set(domainParams.map((c) => c.sub))];
                        return subs.map((sub) => {
                          const subParams = domainParams.filter((c) => c.sub === sub);
                          return (
                            <div key={sub} className="space-y-4">
                              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-l-4 border-emerald-500 pl-3">
                                {sub}
                              </h3>
                              <div className="space-y-4">
                                {subParams.map((p) => {
                                  const score = getScore(p);
                                  const isTemplateRef = refs[p.code] === p.ref;
                                  const isTemplateUnit = units[p.code] === p.unit;
                                  const hasWeaknessFlag = p.flag === "weak";
                                  const hasGapFlag = p.flag === "gap";

                                  return (
                                    <div
                                      key={p.code}
                                      className={`border rounded-2xl p-4 space-y-4 ${
                                        hasWeaknessFlag
                                          ? "border-rose-300 bg-rose-50/5"
                                          : hasGapFlag
                                          ? "border-orange-300 bg-orange-50/5"
                                          : "border-gray-150 dark:border-gray-800"
                                      }`}
                                    >
                                      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start">
                                        <div className="space-y-2 flex-1">
                                          <div className="flex items-start gap-2.5">
                                            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/20 px-2 py-0.5 rounded-md text-xs font-extrabold shrink-0">
                                              {p.code}
                                            </span>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                                              {p.kontrol}
                                            </div>
                                          </div>
                                          {hasWeaknessFlag && (
                                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                              ⚠ Kelemahan diakui pada Penjelasan
                                            </span>
                                          )}
                                          {hasGapFlag && (
                                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                                              ⚠ Bukti belum terbit — jangan skor 1
                                            </span>
                                          )}
                                        </div>

                                        {/* Scoring Box */}
                                        <div className="shrink-0 w-full lg:w-auto">
                                          <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">
                                            Penerapan Kontrol
                                          </span>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            {[1, 2, 3, 4, 5].map((val) => (
                                              <button
                                                key={val}
                                                onClick={() => setScores((prev) => ({ ...prev, [p.code]: val }))}
                                                style={{
                                                  backgroundColor: score === val ? C[val] : "",
                                                  borderColor: score === val ? "transparent" : "",
                                                }}
                                                className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all ${
                                                  score === val
                                                    ? "text-white shadow-theme-xs"
                                                    : "bg-white border-gray-250 text-gray-600 hover:border-emerald-500 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300"
                                                }`}
                                                title={SN[val as 1 | 2 | 3 | 4 | 5]}
                                              >
                                                {val}
                                              </button>
                                            ))}
                                            {score > 0 && (
                                              <button
                                                onClick={() => setScores((prev) => ({ ...prev, [p.code]: 0 }))}
                                                className="text-[10px] text-gray-400 hover:text-rose-500 underline ml-2 cursor-pointer no-print"
                                              >
                                                clear
                                              </button>
                                            )}
                                          </div>
                                          <span className="block text-xs font-bold mt-2" style={{ color: score > 0 ? C[score] : "#94a3b8" }}>
                                            {score > 0 ? `${score} · ${SN[score as 1 | 2 | 3 | 4 | 5]}` : "Belum dinilai"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Fields refs & units */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-dashed border-gray-150 dark:border-gray-850">
                                        <div className="flex flex-col gap-1.5">
                                          <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                              Referensi Dokumen
                                            </label>
                                            <span
                                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                isTemplateRef
                                                  ? "bg-gray-100 text-gray-500 dark:bg-gray-850"
                                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                              }`}
                                            >
                                              {isTemplateRef ? "template" : "✓ diisi bank"}
                                            </span>
                                          </div>
                                          <textarea
                                            value={refs[p.code] || ""}
                                            onChange={(e) => setRefs((prev) => ({ ...prev, [p.code]: e.target.value }))}
                                            className="w-full text-xs bg-gray-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 focus:outline-hidden focus:border-emerald-500 resize-y min-h-[50px] dark:bg-gray-900 dark:border-gray-850 dark:text-white"
                                          />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                          <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                              Penanggung Jawab / Unit Kerja
                                            </label>
                                            <span
                                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                isTemplateUnit
                                                  ? "bg-gray-100 text-gray-500 dark:bg-gray-850"
                                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                              }`}
                                            >
                                              {isTemplateUnit ? "template" : "✓ diisi bank"}
                                            </span>
                                          </div>
                                          <textarea
                                            value={units[p.code] || ""}
                                            onChange={(e) => setUnits((prev) => ({ ...prev, [p.code]: e.target.value }))}
                                            className="w-full text-xs bg-gray-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 focus:outline-hidden focus:border-emerald-500 resize-y min-h-[50px] dark:bg-gray-900 dark:border-gray-850 dark:text-white"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                );
              });
            })()}
            <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-gray-800 no-print">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-md transition-all flex items-center gap-2 border border-emerald-500 cursor-pointer"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
                Simpan Semua Kertas Kerja ({activeYear})
              </button>
            </div>
          </div>
        )}

        {/* Tab Panel 3: Ketahanan */}
        {activeTab === "keta" && (
          <div className="space-y-6 print-section print-full-width">
            {(() => {
              const domains = [...new Set(D.keta.map((c) => c.domain))];
              return domains.map((domain, i) => {
                const domainParams = D.keta.filter((c) => c.domain === domain);
                const domainAvg = avg(domainParams);
                return (
                  <div key={domain} className="bg-white border border-gray-200 dark:bg-white/[0.03] dark:border-gray-800 rounded-3xl p-6 shadow-theme-xs">
                    <div className="flex items-center justify-between border-b pb-3 mb-5 border-gray-100 dark:border-gray-800">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-550/10 dark:text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold">
                          {i + 1}
                        </span>
                        {domain}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">Rata-rata:</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {domainAvg !== null ? domainAvg.toFixed(2) : "—"}
                        </span>
                        {domainAvg !== null && (
                          <span
                            style={{ backgroundColor: C[band(domainAvg)] }}
                            className="text-[9px] font-bold text-white px-2 py-0.5 rounded-full uppercase"
                          >
                            T{band(domainAvg)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {domainParams.map((p) => {
                        const score = getScore(p);
                        const isTemplateRef = refs[p.code] === p.ref;
                        const isTemplateUnit = units[p.code] === p.unit;
                        const hasWeaknessFlag = p.flag === "weak";
                        const hasGapFlag = p.flag === "gap";

                        return (
                          <div
                            key={p.code}
                            className={`border rounded-2xl p-4 space-y-4 ${
                              hasWeaknessFlag
                                ? "border-rose-300 bg-rose-50/5"
                                : hasGapFlag
                                ? "border-orange-300 bg-orange-50/5"
                                : "border-gray-150 dark:border-gray-800"
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-start gap-2.5">
                                  <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/20 px-2 py-0.5 rounded-md text-xs font-extrabold shrink-0">
                                    {p.code}
                                  </span>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                                    {p.kontrol}
                                  </div>
                                </div>
                                {hasWeaknessFlag && (
                                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                    ⚠ Kelemahan diakui pada Penjelasan
                                  </span>
                                )}
                                {hasGapFlag && (
                                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                                    ⚠ Bukti belum terbit — jangan skor 1
                                  </span>
                                )}
                              </div>

                              {/* Scoring Box */}
                              <div className="shrink-0 w-full lg:w-auto">
                                <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">
                                  Penerapan Kontrol
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                      key={val}
                                      onClick={() => setScores((prev) => ({ ...prev, [p.code]: val }))}
                                      style={{
                                        backgroundColor: score === val ? C[val] : "",
                                        borderColor: score === val ? "transparent" : "",
                                      }}
                                      className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all ${
                                        score === val
                                          ? "text-white shadow-theme-xs"
                                          : "bg-white border-gray-250 text-gray-600 hover:border-emerald-500 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300"
                                      }`}
                                      title={SN[val as 1 | 2 | 3 | 4 | 5]}
                                    >
                                      {val}
                                    </button>
                                  ))}
                                  {score > 0 && (
                                    <button
                                      onClick={() => setScores((prev) => ({ ...prev, [p.code]: 0 }))}
                                      className="text-[10px] text-gray-400 hover:text-rose-500 underline ml-2 cursor-pointer no-print"
                                    >
                                      clear
                                    </button>
                                  )}
                                </div>
                                <span className="block text-xs font-bold mt-2" style={{ color: score > 0 ? C[score] : "#94a3b8" }}>
                                  {score > 0 ? `${score} · ${SN[score as 1 | 2 | 3 | 4 | 5]}` : "Belum dinilai"}
                                </span>
                              </div>
                            </div>

                            {/* Fields refs & units */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-dashed border-gray-150 dark:border-gray-850">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Referensi Dokumen
                                  </label>
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                      isTemplateRef
                                        ? "bg-gray-100 text-gray-500 dark:bg-gray-850"
                                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                    }`}
                                  >
                                    {isTemplateRef ? "template" : "✓ diisi bank"}
                                  </span>
                                </div>
                                <textarea
                                  value={refs[p.code] || ""}
                                  onChange={(e) => setRefs((prev) => ({ ...prev, [p.code]: e.target.value }))}
                                  className="w-full text-xs bg-gray-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 focus:outline-hidden focus:border-emerald-500 resize-y min-h-[50px] dark:bg-gray-900 dark:border-gray-850 dark:text-white"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Penanggung Jawab / Unit Kerja
                                  </label>
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                      isTemplateUnit
                                        ? "bg-gray-100 text-gray-500 dark:bg-gray-850"
                                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                    }`}
                                  >
                                    {isTemplateUnit ? "template" : "✓ diisi bank"}
                                  </span>
                                </div>
                                <textarea
                                  value={units[p.code] || ""}
                                  onChange={(e) => setUnits((prev) => ({ ...prev, [p.code]: e.target.value }))}
                                  className="w-full text-xs bg-gray-50 border border-gray-200 focus:bg-white rounded-xl p-2.5 focus:outline-hidden focus:border-emerald-500 resize-y min-h-[50px] dark:bg-gray-900 dark:border-gray-850 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
            <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-gray-800 no-print">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-md transition-all flex items-center gap-2 border border-emerald-500 cursor-pointer"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
                Simpan Semua Kertas Kerja ({activeYear})
              </button>
            </div>
          </div>
        )}

        {/* Tab Panel 4: Rating Siber */}
        {activeTab === "rating" && (
          <div className="bg-white border border-gray-200 dark:bg-white/[0.03] dark:border-gray-800 rounded-3xl p-6 shadow-theme-xs print-section print-full-width">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Peringkat Tingkat Risiko Keamanan Siber
            </h3>
            
            <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-2xl mb-6">
              <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-center w-12">No.</th>
                    <th scope="col" className="px-6 py-3.5">Faktor</th>
                    <th scope="col" className="px-6 py-3.5 text-center w-40">Nilai Rating</th>
                    <th scope="col" className="px-6 py-3.5 text-center w-60">Kualifikasi Rating</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800/80">
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                    <td className="px-6 py-4 text-center font-mono text-xs text-gray-400">1</td>
                    <td className="px-6 py-4 font-semibold text-gray-950 dark:text-white">Peringkat Risiko Inheren terkait Keamanan Siber</td>
                    <td className="px-6 py-4 text-center font-bold tracking-tight text-lg text-gray-900 dark:text-white">
                      {inhAvgVal.v !== null ? inhAvgVal.v.toFixed(2) : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {inhAvgVal.v !== null ? (
                        <span
                          style={{ backgroundColor: C[band(inhAvgVal.v)] }}
                          className="inline-block text-[11px] font-bold text-white px-3 py-1 rounded-full uppercase"
                        >
                          {NM.inh[band(inhAvgVal.v)]}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Belum dinilai</span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                    <td className="px-6 py-4 text-center font-mono text-xs text-gray-400">2</td>
                    <td className="px-6 py-4 font-semibold text-gray-950 dark:text-white">Peringkat Tingkat Maturitas Keamanan Siber</td>
                    <td className="px-6 py-4 text-center font-bold tracking-tight text-lg text-gray-900 dark:text-white">
                      {maturitasVal !== null ? maturitasVal.toFixed(2) : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {maturitasVal !== null ? (
                        <span
                          style={{ backgroundColor: C[band(maturitasVal)] }}
                          className="inline-block text-[11px] font-bold text-white px-3 py-1 rounded-full uppercase"
                        >
                          {NM.mat[band(maturitasVal)]}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Belum dinilai</span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-gray-50/50 dark:bg-white/[0.01] font-bold text-base">
                    <td className="px-6 py-4"></td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      Peringkat Tingkat Risiko terkait Keamanan Siber <span className="text-xs font-normal text-gray-500 dark:text-gray-400 block sm:inline sm:ml-2">(Inheren + Maturitas) / 2</span>
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold tracking-tight text-xl text-gray-900 dark:text-white">
                      {finalRiskVal !== null ? finalRiskVal.toFixed(2) : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {finalRiskVal !== null ? (
                        <span
                          style={{ backgroundColor: C[band(finalRiskVal)] }}
                          className="inline-block text-xs font-bold text-white px-4 py-1.5 rounded-full uppercase shadow-theme-xs"
                        >
                          {NM.risk[band(finalRiskVal)]}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Belum dinilai</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/15 dark:border-amber-900/30 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 space-y-2 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Peringatan Metodologis
              </p>
              <p className="font-light">
                Merata-ratakan Inheren dengan Maturitas menghilangkan informasi yang justru paling penting. Inheren 5 (High Risk) + Maturitas 1 (Strong Control) menghasilkan nilai 3. Inheren 1 (Low Risk) + Maturitas 5 (Unsatisfactory Control) juga menghasilkan nilai 3. Kedua kondisi siber ini berbeda secara fundamental dan memerlukan penanganan berlawanan arah. Angka rating siber di atas adalah <strong>titik awal diskusi komite</strong>, bukan kesimpulan tunggal. Rincian pembentuknya wajib dilaporkan secara berdampingan.
              </p>
            </div>
          </div>
        )}

        {/* Tab Panel 5: Hasil Penilaian */}
        {activeTab === "hasil" && (
          <div className="bg-white border border-gray-250 dark:bg-white/[0.03] dark:border-gray-800 rounded-3xl p-6 shadow-theme-xs print-section print-full-width">
            {/* Header hasil */}
            <div className="text-center border-b pb-4 mb-6 border-gray-150 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Hasil Penilaian Risiko Keamanan Siber
              </h2>
              <div className="text-xs text-gray-500 font-mono mt-1">
                {bankName} · Periode Penilaian Tahun {activeYear}
              </div>
            </div>

            {/* Assessment info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-gray-500 mb-6 border-b pb-4 dark:border-gray-800">
              <div>
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Nama Bank</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{bankName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Tahun Periode</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{activeYear}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Penilai / Unit</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{assessor}</span>
              </div>
            </div>

            {/* Inherent vs Maturitas comparison tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Inheren */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold bg-orange-550 dark:bg-orange-600 text-white px-4 py-2 rounded-xl uppercase tracking-wider">
                  Penilaian Risiko Inheren Keamanan Siber
                </h3>
                <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-2xl">
                  <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-center w-12">No.</th>
                        <th className="px-4 py-3">Faktor Penilaian</th>
                        <th className="px-4 py-3 text-center w-40">Peringkat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                      {CATS.map(([cc, cn], idx) => {
                        const val = avg(D.inh.filter((x) => x.catCode === cc));
                        return (
                          <tr key={cc} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                            <td className="px-4 py-3 text-center font-mono text-gray-450">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{cn}</td>
                            <td className="px-4 py-3 text-center">
                              {val !== null ? (
                                <span
                                  style={{ backgroundColor: C[band(val)] }}
                                  className="inline-block text-[9px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
                                >
                                  {NM.inh[band(val)]}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Belum dinilai</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50/50 dark:bg-white/[0.01] font-bold">
                        <td colSpan={2} className="px-4 py-4 text-gray-900 dark:text-white">
                          Peringkat Risiko Inheren Keamanan Siber
                          <span className="block text-[10px] font-normal text-gray-400 mt-1">
                            nilai {inhAvgVal.v !== null ? inhAvgVal.v.toFixed(2) : "—"} · bobot sama per kategori
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {inhAvgVal.v !== null ? (
                            <span
                              style={{ backgroundColor: C[band(inhAvgVal.v)] }}
                              className="inline-block text-[10px] font-bold text-white px-3 py-1 rounded-full uppercase"
                            >
                              {NM.inh[band(inhAvgVal.v)]}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Belum dinilai</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Analysis text box Inheren */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-gray-400">
                    <label className="font-semibold uppercase tracking-wider">
                      Analisis — Risiko Inheren
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${anzEd.inh ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}>
                        {anzEd.inh ? "✓ disunting" : "draf otomatis"}
                      </span>
                      {anzEd.inh && (
                        <button
                          onClick={() => handleRebuild("inh")}
                          className="text-[9px] text-emerald-600 hover:text-emerald-500 underline cursor-pointer"
                        >
                          bangun ulang draf
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={getAnzValue("inh")}
                    onChange={(e) => handleAnzChange("inh", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-250 focus:bg-white rounded-2xl p-3 focus:outline-hidden focus:border-emerald-500 resize-y min-h-[120px] leading-relaxed text-sm dark:bg-gray-900 dark:border-gray-800 dark:text-white print:hidden"
                  />
                  <div className="hidden print:block whitespace-pre-wrap text-sm leading-relaxed p-4 border border-gray-250 rounded-2xl bg-white min-h-[120px]">
                    {getAnzValue("inh")}
                  </div>
                </div>
              </div>

              {/* Maturitas */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold bg-slate-800 text-white px-4 py-2 rounded-xl uppercase tracking-wider">
                  Penilaian Tingkat Maturitas Keamanan Siber
                </h3>
                <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-2xl">
                  <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-center w-12">No.</th>
                        <th className="px-4 py-3">Faktor Penilaian</th>
                        <th className="px-4 py-3 text-center w-40">Peringkat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <td className="px-4 py-3 text-center font-mono text-gray-450">1</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Kualitas Penerapan Manajemen Risiko Siber (KPMR)</td>
                        <td className="px-4 py-3 text-center">
                          {kpmrAvgVal !== null ? (
                            <span
                              style={{ backgroundColor: C[band(kpmrAvgVal)] }}
                              className="inline-block text-[9px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
                            >
                              {NM.kpmr[band(kpmrAvgVal)]}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Belum dinilai</span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <td className="px-4 py-3 text-center font-mono text-gray-450">2</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Kualitas Penerapan Proses Ketahanan Siber</td>
                        <td className="px-4 py-3 text-center">
                          {ketaAvgVal !== null ? (
                            <span
                              style={{ backgroundColor: C[band(ketaAvgVal)] }}
                              className="inline-block text-[9px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
                            >
                              {NM.keta[band(ketaAvgVal)]}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Belum dinilai</span>
                          )}
                        </td>
                      </tr>
                      {/* Blank alignment row */}
                      <tr className="h-[29px] border-none"><td colSpan={3} className="border-none"></td></tr>
                      <tr className="bg-gray-50/50 dark:bg-white/[0.01] font-bold">
                        <td colSpan={2} className="px-4 py-4 text-gray-900 dark:text-white">
                          Peringkat Tingkat Maturitas Keamanan Siber
                          <span className="block text-[10px] font-normal text-gray-400 mt-1">
                            nilai {maturitasVal !== null ? maturitasVal.toFixed(2) : "—"} · (KPMR + Ketahanan) / 2
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {maturitasVal !== null ? (
                            <span
                              style={{ backgroundColor: C[band(maturitasVal)] }}
                              className="inline-block text-[10px] font-bold text-white px-3 py-1 rounded-full uppercase"
                            >
                              {NM.mat[band(maturitasVal)]}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Belum dinilai</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Analysis text box Maturitas */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-gray-400">
                    <label className="font-semibold uppercase tracking-wider">
                      Analisis — Tingkat Maturitas
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${anzEd.mat ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}>
                        {anzEd.mat ? "✓ disunting" : "draf otomatis"}
                      </span>
                      {anzEd.mat && (
                        <button
                          onClick={() => handleRebuild("mat")}
                          className="text-[9px] text-emerald-600 hover:text-emerald-500 underline cursor-pointer"
                        >
                          bangun ulang draf
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={getAnzValue("mat")}
                    onChange={(e) => handleAnzChange("mat", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-250 focus:bg-white rounded-2xl p-3 focus:outline-hidden focus:border-emerald-500 resize-y min-h-[120px] leading-relaxed text-sm dark:bg-gray-900 dark:border-gray-800 dark:text-white print:hidden"
                  />
                  <div className="hidden print:block whitespace-pre-wrap text-sm leading-relaxed p-4 border border-gray-250 rounded-2xl bg-white min-h-[120px]">
                    {getAnzValue("mat")}
                  </div>
                </div>
              </div>
            </div>

            {/* Final Rating Row */}
            <div className="mt-8 border-2 border-slate-900 rounded-3xl overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-4 font-bold flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="text-sm uppercase tracking-wider">Peringkat Tingkat Risiko terkait Keamanan Siber</div>
                  <div className="text-[10px] text-slate-400 font-light font-mono leading-none">
                    nilai {finalRiskVal !== null ? finalRiskVal.toFixed(2) : "—"} · (Inheren + Maturitas) / 2
                  </div>
                </div>
                <div className="shrink-0">
                  {finalRiskVal !== null ? (
                    <span
                      style={{ backgroundColor: C[band(finalRiskVal)] }}
                      className="inline-block text-xs font-bold text-white px-4 py-2 rounded-xl uppercase shadow-theme-xs border border-white/10"
                    >
                      {NM.risk[band(finalRiskVal)]}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 px-4 py-2 rounded-xl bg-slate-800 uppercase">
                      Belum dinilai
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5 bg-white dark:bg-gray-900/60 border-t border-slate-900">
                {/* Analysis text box Final Risk */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-gray-400">
                    <label className="font-semibold uppercase tracking-wider">
                      Analisis — Tingkat Risiko Keamanan Siber (Rating Akhir)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${anzEd.risk ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}>
                        {anzEd.risk ? "✓ disunting" : "draf otomatis"}
                      </span>
                      {anzEd.risk && (
                        <button
                          onClick={() => handleRebuild("risk")}
                          className="text-[9px] text-emerald-600 hover:text-emerald-500 underline cursor-pointer"
                        >
                          bangun ulang draf
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={getAnzValue("risk")}
                    onChange={(e) => handleAnzChange("risk", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-250 focus:bg-white rounded-2xl p-4 focus:outline-hidden focus:border-emerald-500 resize-y min-h-[140px] leading-relaxed text-sm dark:bg-gray-900 dark:border-gray-800 dark:text-white print:hidden"
                  />
                  <div className="hidden print:block whitespace-pre-wrap text-sm leading-relaxed p-4 border border-gray-250 rounded-2xl bg-white min-h-[140px]">
                    {getAnzValue("risk")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Panel 6: Matriks Peringkat */}
        {activeTab === "ref" && (
          <div className="space-y-6 print-section print-full-width">
            {/* Matriks table blocks */}
            {[
              { key: "inheren", title: "Matriks Penetapan Tingkat Risiko Inheren Keamanan Siber", rows: D.matrix.inheren, nm: NM.inh },
              { key: "kpmr", title: "Matriks Penetapan Kualitas Penerapan Manajemen Risiko (KPMR)", rows: D.matrix.kpmr, nm: NM.kpmr },
              { key: "ketahanan", title: "Matriks Penetapan Kualitas Penerapan Proses Ketahanan Siber", rows: D.matrix.ketahanan, nm: NM.keta },
              { key: "maturitas", title: "Matriks Penetapan Tingkat Maturitas Keamanan Siber", rows: D.matrix.maturitas, nm: NM.mat },
              { key: "risiko", title: "Peringkat Tingkat Risiko terkait Keamanan Siber (Definisi Sistem)", rows: D.matrix.risiko, nm: NM.risk },
            ].map((m, i) => (
              <div key={i} className="bg-white border border-gray-200 dark:bg-white/[0.03] dark:border-gray-800 rounded-3xl p-6 shadow-theme-xs">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2 mb-4 dark:border-gray-800">
                  {m.title}
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                  <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left text-xs">
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                      {m.rows.map((row: any, idx: number) => {
                        const currentVal = matrices[m.key]?.[idx] ?? row[1];
                        const isEditing = editingCell?.matrixKey === m.key && editingCell?.index === idx;
                        return (
                          <tr key={idx} className={`hover:bg-gray-50/50 dark:hover:bg-white/[0.01] group/row ${isEditing ? "bg-emerald-500/5 dark:bg-emerald-500/[0.02]" : ""}`}>
                            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap w-48 align-top">
                              <span
                                style={{ backgroundColor: C[idx + 1] }}
                                className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                              ></span>
                              {(m.nm as any)[idx + 1]} ({idx + 1})
                            </td>
                            <td className="px-4 py-2 text-gray-550 leading-relaxed font-light align-top">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={tempEditValue}
                                    onChange={(e) => setTempEditValue(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-250 focus:bg-white rounded-xl p-2.5 focus:outline-hidden focus:border-emerald-500 resize-y leading-relaxed text-xs dark:bg-gray-900 dark:border-gray-800 dark:text-white min-h-[80px]"
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setMatrices((prev) => {
                                          const nextRows = [...(prev[m.key] || m.rows.map((r: any) => r[1]))];
                                          nextRows[idx] = tempEditValue;
                                          return { ...prev, [m.key]: nextRows };
                                        });
                                        setEditingCell(null);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                      Simpan
                                    </button>
                                    <button
                                      onClick={() => setEditingCell(null)}
                                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-750 dark:text-gray-400 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-4 group">
                                  <div className="text-gray-700 dark:text-gray-300 text-xs py-1 whitespace-pre-line leading-relaxed font-light">
                                    {currentVal}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setTempEditValue(currentVal);
                                      setEditingCell({ matrixKey: m.key, index: idx });
                                    }}
                                    className="opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity text-slate-400 hover:text-emerald-500 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-850 shrink-0 self-center no-print cursor-pointer"
                                    title="Edit Deskripsi"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-gray-800 no-print">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-md transition-all flex items-center gap-2 border border-emerald-500 cursor-pointer"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
                Simpan Semua Kertas Kerja ({activeYear})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Year Adding Dialog Modal */}
      {isAddYearOpen && (
        <div className="fixed inset-0 z-999999 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tambah Tahun Penilaian</h3>
              <p className="text-xs text-gray-500 mt-1 font-light leading-normal">
                Masukkan tahun / periode penilaian baru. Data template parameter kosong akan diinisialisasi.
              </p>
            </div>
            <input
              type="text"
              placeholder="Contoh: 2027"
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-800 dark:bg-gray-950 px-3.5 py-2 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setIsAddYearOpen(false);
                  setNewYearInput("");
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-800 rounded-xl text-gray-650 hover:bg-gray-100 dark:hover:bg-gray-850 hover:text-gray-900 font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleAddYear}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold border border-emerald-500"
              >
                Inisialisasi
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Year Deletion Dialog Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-999999 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hapus Tahun Penilaian</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-light leading-normal">
              Apakah Anda yakin ingin menghapus data penilaian tahun <strong className="text-gray-800 dark:text-gray-200 font-semibold">{activeYear}</strong>? Tindakan ini akan menghapus semua skor dan penjelasan analisis tahun ini, serta tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-800 rounded-xl text-gray-650 hover:bg-gray-100 dark:hover:bg-gray-850 hover:text-gray-900 dark:text-gray-350 dark:hover:text-white font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteYear}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold border border-rose-500"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
