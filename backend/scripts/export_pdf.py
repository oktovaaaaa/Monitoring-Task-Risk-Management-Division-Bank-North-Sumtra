import sys
import json
from xhtml2pdf import pisa

def main():
    if len(sys.argv) < 3:
        print("Usage: python export_pdf.py <output_path> <json_data>")
        sys.exit(1)
        
    output_path = sys.argv[1]
    json_data_str = sys.argv[2]
    
    try:
        data = json.loads(json_data_str)
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        sys.exit(1)
        
    bank_name = data.get("bank_name", "PT Bank Sumut")
    active_year = data.get("active_year", 2025)
    assessor = data.get("assessor", "Divisi Manajemen Risiko")
    scores = data.get("scores", {})
    anz = data.get("anz", {})

    # Helper to calculate average
    def get_avg(codes):
        vals = []
        for c in codes:
            v = scores.get(c)
            if v is not None:
                try:
                    val = float(v)
                    if 1 <= val <= 5:
                        vals.append(val)
                except ValueError:
                    pass
        return sum(vals) / len(vals) if vals else None

    def get_band(n):
        if n is None:
            return 0
        if n <= 1:
            return 1
        if n <= 2:
            return 2
        if n <= 3:
            return 3
        if n <= 4:
            return 4
        return 5

    # Names mapping
    inh_names = {0: "Belum Dinilai", 1: "Low", 2: "Low to Moderate", 3: "Moderate", 4: "Moderate to High", 5: "High"}
    kpmr_names = {0: "Belum Dinilai", 1: "Strong", 2: "Satisfactory", 3: "Fair", 4: "Marginal", 5: "Unsatisfactory"}
    keta_names = {0: "Belum Dinilai", 1: "Strong", 2: "Satisfactory", 3: "Fair", 4: "Marginal", 5: "Unsatisfactory"}
    mat_names = {0: "Belum Dinilai", 1: "Tingkat 1", 2: "Tingkat 2", 3: "Tingkat 3", 4: "Tingkat 4", 5: "Tingkat 5"}
    risk_names = {0: "Belum Dinilai", 1: "Low", 2: "Low to Moderate", 3: "Moderate", 4: "Moderate to High", 5: "High"}

    # Badge CSS classes mapping
    badge_map = {
        "LOW": "badge-low",
        "LOW TO MODERATE": "badge-lowmod",
        "MODERATE": "badge-mod",
        "MODERATE TO HIGH": "badge-modhigh",
        "HIGH": "badge-high",
        "BELUM DINILAI": "badge-unrated",
        "STRONG": "badge-strong",
        "SATISFACTORY": "badge-sat",
        "FAIR": "badge-fair",
        "MARGINAL": "badge-marginal",
        "UNSATISFACTORY": "badge-unsat",
        "TINGKAT 1": "badge-t1",
        "TINGKAT 2": "badge-t2",
        "TINGKAT 3": "badge-t3",
        "TINGKAT 4": "badge-t4",
        "TINGKAT 5": "badge-t5"
    }

    def get_badge_class(rating_str):
        if not rating_str:
            return "badge-unrated"
        return badge_map.get(rating_str.upper(), "badge-unrated")

    def get_rating_color(rating_str):
        if not rating_str:
            return "#94a3b8"
        r = rating_str.upper()
        if r in ["LOW", "STRONG", "SATISFACTORY", "TINGKAT 2"]:
            return "#10b981"
        if r in ["LOW TO MODERATE"]:
            return "#5f9a2f"
        if r in ["MODERATE", "FAIR", "TINGKAT 3"]:
            return "#cf9c05"
        if r in ["MODERATE TO HIGH", "MARGINAL", "TINGKAT 4"]:
            return "#dd7a1f"
        if r in ["HIGH", "UNSATISFACTORY", "TINGKAT 5", "TINGKAT 1"]:
            return "#c0392b"
        return "#64748b"

    # Averages
    avg_tek = get_avg([f"1.{i}" for i in range(1, 11)])
    avg_prod = get_avg([f"2.{i}" for i in range(1, 6)])
    avg_char = get_avg([f"3.{i}" for i in range(1, 4)])
    avg_rec = get_avg([f"4.{i}" for i in range(1, 3)])

    cs_list = [avg_tek, avg_prod, avg_char, avg_rec]
    if any(v is None for v in cs_list):
        avg_inh = get_avg([f"1.{i}" for i in range(1, 11)] + [f"2.{i}" for i in range(1, 6)] + [f"3.{i}" for i in range(1, 4)] + [f"4.{i}" for i in range(1, 3)])
    else:
        avg_inh = sum(cs_list) / 4

    kpmr_codes = [
        "1.1.a", "1.1.b", "1.2.a", "1.2.b", "1.3.a", "1.3.b", "1.3.c",
        "2.1.a", "2.1.b", "2.1.c", "2.1.d", "2.2.a", "2.2.b", "2.2.c", "2.2.d",
        "2.3.a", "2.3.b", "2.3.c", "2.3.d", "2.3.e", "2.3.f", "2.3.g", "2.3.h",
        "2.3.i", "2.3.j", "2.3.k", "2.3.l", "2.3.m",
        "3.1.a", "3.1.b", "3.1.c", "3.1.d", "3.1.e", "3.1.f", "3.1.g", "3.1.h",
        "3.2.a", "3.2.b", "3.2.c", "3.2.d", "3.2.e", "3.2.f", "3.2.g",
        "3.3.a", "3.3.b", "3.3.c", "3.3.d", "3.3.e",
        "4.1.a", "4.1.b", "4.1.c", "4.1.d",
        "4.2.a", "4.2.b", "4.2.c", "4.2.d", "4.2.e"
    ]
    avg_kpmr = get_avg(kpmr_codes)

    keta_codes = [
        "1.a", "1.b", "1.c",
        "2.a", "2.b", "2.c", "2.d", "2.e", "2.f", "2.g", "2.h", "2.i", "2.j",
        "3.a", "3.b", "3.c", "3.d", "3.e",
        "4.a", "4.b", "4.c", "4.d", "4.e", "4.f"
    ]
    avg_keta = get_avg(keta_codes)

    avg_mat = (avg_kpmr + avg_keta) / 2 if (avg_kpmr is not None and avg_keta is not None) else None
    avg_akhir = (avg_inh + avg_mat) / 2 if (avg_inh is not None and avg_mat is not None) else None

    # Ratings
    rating_tek = inh_names[get_band(avg_tek)]
    rating_prod = inh_names[get_band(avg_prod)]
    rating_char = inh_names[get_band(avg_char)]
    rating_rec = inh_names[get_band(avg_rec)]
    rating_inh = inh_names[get_band(avg_inh)]
    rating_kpmr = kpmr_names[get_band(avg_kpmr)]
    rating_keta = keta_names[get_band(avg_keta)]
    rating_mat = mat_names[get_band(avg_mat)]
    rating_akhir = risk_names[get_band(avg_akhir)]

    # HTML Template
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page {{
        size: A4 portrait;
        margin: 20mm 15mm 20mm 15mm;
        @frame footer {{
            -pdf-frame-content: footer_content;
            bottom: 10mm;
            left: 15mm;
            right: 15mm;
            height: 10mm;
        }}
    }}
    body {{
        font-family: 'Helvetica', 'Arial', sans-serif;
        color: #333333;
        font-size: 10pt;
        line-height: 1.5;
    }}
    .header-title {{
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        color: #0f172a;
        margin-bottom: 2px;
    }}
    .header-subtitle {{
        text-align: center;
        font-size: 10pt;
        color: #64748b;
        margin-bottom: 25px;
    }}
    .metadata-table {{
        width: 100%;
        margin-bottom: 25px;
        border-collapse: collapse;
    }}
    .metadata-table td {{
        padding: 4px 0;
        vertical-align: top;
    }}
    .metadata-label {{
        font-size: 8pt;
        text-transform: uppercase;
        color: #64748b;
        font-weight: bold;
    }}
    .metadata-value {{
        font-size: 10pt;
        color: #0f172a;
        font-weight: bold;
    }}
    
    .section-title {{
        font-size: 11pt;
        font-weight: bold;
        background-color: #1e293b;
        color: #ffffff;
        padding: 6px 12px;
        text-transform: uppercase;
        margin-top: 15px;
        margin-bottom: 10px;
        border-radius: 4px;
    }}
    
    .report-table {{
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
    }}
    .report-table th {{
        background-color: #f8fafc;
        border-bottom: 2px solid #e2e8f0;
        padding: 8px 10px;
        font-size: 8.5pt;
        text-transform: uppercase;
        font-weight: bold;
        color: #475569;
        text-align: left;
    }}
    .report-table td {{
        border-bottom: 1px solid #e2e8f0;
        padding: 8px 10px;
        vertical-align: middle;
        font-size: 9.5pt;
    }}
    .report-table .num-col {{
        width: 40px;
        text-align: center;
        color: #94a3b8;
    }}
    .report-table .rank-col {{
        width: 180px;
        text-align: right;
    }}
    
    .badge {{
        display: inline-block;
        padding: 4px 10px;
        font-size: 8.5pt;
        font-weight: bold;
        color: #ffffff;
        border-radius: 4px;
        text-transform: uppercase;
        text-align: center;
    }}
    .badge-low {{ background-color: #10b981; }}
    .badge-lowmod {{ background-color: #5f9a2f; }}
    .badge-mod {{ background-color: #cf9c05; }}
    .badge-modhigh {{ background-color: #dd7a1f; }}
    .badge-high {{ background-color: #c0392b; }}
    .badge-unrated {{ background-color: #94a3b8; }}
    
    .badge-strong {{ background-color: #10b981; }}
    .badge-sat {{ background-color: #5f9a2f; }}
    .badge-fair {{ background-color: #cf9c05; }}
    .badge-marginal {{ background-color: #dd7a1f; }}
    .badge-unsat {{ background-color: #c0392b; }}
    
    .badge-t1 {{ background-color: #c0392b; }}
    .badge-t2 {{ background-color: #5f9a2f; }}
    .badge-t3 {{ background-color: #cf9c05; }}
    .badge-t4 {{ background-color: #dd7a1f; }}
    .badge-t5 {{ background-color: #c0392b; }}

    .summary-row {{
        background-color: #f1f5f9;
        font-weight: bold;
    }}
    .summary-row td {{
        border-top: 1px solid #cbd5e1;
        border-bottom: 2px solid #cbd5e1;
    }}
    
    .analysis-container {{
        background-color: #f8fafc;
        border-left: 3px solid #0f172a;
        padding: 10px 12px;
        margin-bottom: 25px;
    }}
    .analysis-label {{
        font-size: 8pt;
        font-weight: bold;
        color: #475569;
        text-transform: uppercase;
        margin-bottom: 4px;
    }}
    .analysis-text {{
        font-size: 9.5pt;
        color: #334155;
        text-align: justify;
    }}
    
    .final-container {{
        border: 2px solid #0f172a;
        margin-top: 25px;
        margin-bottom: 20px;
        border-radius: 6px;
        overflow: hidden;
    }}
    .final-header-table {{
        width: 100%;
        border-collapse: collapse;
        background-color: #0f172a;
    }}
    .final-header-table td {{
        padding: 12px 15px;
    }}
    .final-body {{
        padding: 15px;
        background-color: #ffffff;
    }}
</style>
</head>
<body>
    <!-- Header -->
    <div class="header-title">HASIL PENILAIAN RISIKO KEAMANAN SIBER</div>
    <div class="header-subtitle">{bank_name} &middot; Periode Penilaian Tahun {active_year}</div>
    
    <!-- Metadata -->
    <table class="metadata-table">
        <tr>
            <td style="width: 40%">
                <div class="metadata-label">Nama Bank</div>
                <div class="metadata-value">{bank_name}</div>
            </td>
            <td style="width: 30%">
                <div class="metadata-label">Tahun Periode</div>
                <div class="metadata-value">{active_year}</div>
            </td>
            <td style="width: 30%">
                <div class="metadata-label">Penilai / Unit</div>
                <div class="metadata-value">{assessor}</div>
            </td>
        </tr>
    </table>
    
    <!-- KPI Dashboard Cards -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
            <!-- Card 1: Risiko Inheren -->
            <td style="width: 19%; padding: 0;">
                <table style="width: 100%; border: 1px solid #fed7aa; background-color: #fff7ed; border-radius: 6px; text-align: center;">
                    <tr>
                        <td style="padding: 10px 5px; text-align: center;">
                            <div style="font-size: 7.5pt; font-weight: bold; color: #c2410c; text-transform: uppercase;">Risiko Inheren</div>
                            <div style="font-size: 18pt; font-weight: bold; color: #1e293b; margin: 5px 0;">{f"{avg_inh:.2f}" if avg_inh is not None else "—"}</div>
                            <div style="font-size: 7.5pt; font-weight: bold; color: #ffffff; background-color: {get_rating_color(rating_inh)}; padding: 3px 6px; border-radius: 4px; display: inline-block; text-transform: uppercase;">{rating_inh}</div>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 1.25%;"></td>
            <!-- Card 2: KPMR Siber -->
            <td style="width: 19%; padding: 0;">
                <table style="width: 100%; border: 1px solid #cbd5e1; background-color: #ffffff; border-radius: 6px; text-align: center;">
                    <tr>
                        <td style="padding: 10px 5px; text-align: center;">
                            <div style="font-size: 7.5pt; font-weight: bold; color: #475569; text-transform: uppercase;">KPMR Siber</div>
                            <div style="font-size: 18pt; font-weight: bold; color: #1e293b; margin: 5px 0;">{f"{avg_kpmr:.2f}" if avg_kpmr is not None else "—"}</div>
                            <div style="font-size: 7.5pt; font-weight: bold; color: #ffffff; background-color: {get_rating_color(rating_kpmr)}; padding: 3px 6px; border-radius: 4px; display: inline-block; text-transform: uppercase;">{rating_kpmr}</div>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 1.25%;"></td>
            <!-- Card 3: Ketahanan Siber -->
            <td style="width: 19%; padding: 0;">
                <table style="width: 100%; border: 1px solid #cbd5e1; background-color: #ffffff; border-radius: 6px; text-align: center;">
                    <tr>
                        <td style="padding: 10px 5px; text-align: center;">
                            <div style="font-size: 7.5pt; font-weight: bold; color: #475569; text-transform: uppercase;">Ketahanan Siber</div>
                            <div style="font-size: 18pt; font-weight: bold; color: #1e293b; margin: 5px 0;">{f"{avg_keta:.2f}" if avg_keta is not None else "—"}</div>
                            <div style="font-size: 7.5pt; font-weight: bold; color: #ffffff; background-color: {get_rating_color(rating_keta)}; padding: 3px 6px; border-radius: 4px; display: inline-block; text-transform: uppercase;">{rating_keta}</div>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 1.25%;"></td>
            <!-- Card 4: Maturitas Siber -->
            <td style="width: 19%; padding: 0;">
                <table style="width: 100%; border: 1px solid #d1fae5; background-color: #ecfdf5; border-radius: 6px; text-align: center;">
                    <tr>
                        <td style="padding: 10px 5px; text-align: center;">
                            <div style="font-size: 7.5pt; font-weight: bold; color: #047857; text-transform: uppercase;">Maturitas Siber</div>
                            <div style="font-size: 18pt; font-weight: bold; color: #1e293b; margin: 5px 0;">{f"{avg_mat:.2f}" if avg_mat is not None else "—"}</div>
                            <div style="font-size: 7.5pt; font-weight: bold; color: #ffffff; background-color: {get_rating_color(rating_mat)}; padding: 3px 6px; border-radius: 4px; display: inline-block; text-transform: uppercase;">{rating_mat}</div>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 1.25%;"></td>
            <!-- Card 5: Risiko Akhir -->
            <td style="width: 19%; padding: 0;">
                <table style="width: 100%; border: 1px solid #0f172a; background-color: #0f172a; border-radius: 6px; text-align: center;">
                    <tr>
                        <td style="padding: 10px 5px; text-align: center;">
                            <div style="font-size: 7.5pt; font-weight: bold; color: #34d399; text-transform: uppercase;">Risiko Akhir</div>
                            <div style="font-size: 18pt; font-weight: bold; color: #ffffff; margin: 5px 0;">{f"{avg_akhir:.2f}" if avg_akhir is not None else "—"}</div>
                            <div style="font-size: 7.5pt; font-weight: bold; color: #ffffff; background-color: {get_rating_color(rating_akhir)}; padding: 3px 6px; border-radius: 4px; display: inline-block; text-transform: uppercase;">{rating_akhir}</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <!-- INHERENT RISK SECTION -->
    <div class="section-title">Penilaian Risiko Inheren terkait Keamanan Siber</div>
    <table class="report-table">
        <thead>
            <tr>
                <th class="num-col">No.</th>
                <th>Faktor Penilaian</th>
                <th class="rank-col" style="text-align: center;">Peringkat</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="num-col">1</td>
                <td>Teknologi</td>
                <td class="rank-col" style="text-align: center;"><span class="badge {get_badge_class(rating_tek)}">{rating_tek}</span></td>
            </tr>
            <tr>
                <td class="num-col">2</td>
                <td>Produk Bank</td>
                <td class="rank-col" style="text-align: center;"><span class="badge {get_badge_class(rating_prod)}">{rating_prod}</span></td>
            </tr>
            <tr>
                <td class="num-col">3</td>
                <td>Karakteristik Organisasi</td>
                <td class="rank-col" style="text-align: center;"><span class="badge {get_badge_class(rating_char)}">{rating_char}</span></td>
            </tr>
            <tr>
                <td class="num-col">4</td>
                <td>Rekam Jejak Insiden Siber</td>
                <td class="rank-col" style="text-align: center;"><span class="badge {get_badge_class(rating_rec)}">{rating_rec}</span></td>
            </tr>
            <tr class="summary-row">
                <td class="num-col">-</td>
                <td>Peringkat Risiko Inheren Keamanan Siber <span style="font-size: 8pt; font-weight: normal; color: #64748b;">(Nilai: {f"{avg_inh:.2f}" if avg_inh is not None else "—"})</span></td>
                <td class="rank-col" style="text-align: center;"><span class="badge {get_badge_class(rating_inh)}">{rating_inh}</span></td>
            </tr>
        </tbody>
    </table>
    
    <div class="analysis-container" style="border-left: 3px solid #dd7a1f;">
        <div class="analysis-label">Analisis - Risiko Inheren</div>
        <div class="analysis-text">{anz.get("inh", "")}</div>
    </div>
    
    <pdf:nextpage />

    <!-- MATURITY LEVEL SECTION -->
    <div class="section-title">Penilaian Tingkat Maturitas Keamanan Siber</div>
    <table class="report-table">
        <thead>
            <tr>
                <th class="num-col">No.</th>
                <th>Faktor Penilaian</th>
                <th class="rank-col" style="text-align: center;">Peringkat</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="num-col">1</td>
                <td>Kualitas Penerapan Manajemen Risiko Siber (KPMR)</td>
                <td class="rank-col" style="text-align: center;"><span class="badge {get_badge_class(rating_kpmr)}">{rating_kpmr}</span></td>
            </tr>
            <tr>
                <td class="num-col">2</td>
                <td>Kualitas Penerapan Proses Ketahanan Siber</td>
                <td class="rank-col" style="text-align: center;"><span class="badge {get_badge_class(rating_keta)}">{rating_keta}</span></td>
            </tr>
            <tr class="summary-row">
                <td class="num-col">-</td>
                <td>Peringkat Tingkat Maturitas Keamanan Siber <span style="font-size: 8pt; font-weight: normal; color: #64748b;">(Nilai: {f"{avg_mat:.2f}" if avg_mat is not None else "—"})</span></td>
                <td class="rank-col" style="text-align: center;"><span class="badge {get_badge_class(rating_mat)}">{rating_mat}</span></td>
            </tr>
        </tbody>
    </table>
    
    <div class="analysis-container" style="border-left: 3px solid #5f9a2f;">
        <div class="analysis-label">Analisis - Tingkat Maturitas</div>
        <div class="analysis-text">{anz.get("mat", "")}</div>
    </div>
    
    <!-- FINAL RISK RATING SECTION -->
    <div class="final-container">
        <table class="final-header-table">
            <tr>
                <td style="color: #ffffff; font-weight: bold; font-size: 11pt; vertical-align: middle;">
                    PERINGKAT TINGKAT RISIKO TERKAIT KEAMANAN SIBER (RATING AKHIR)
                    <div style="font-size: 8pt; font-weight: normal; color: #94a3b8; margin-top: 2px;">
                        Nilai: {f"{avg_akhir:.2f}" if avg_akhir is not None else "—"} &middot; (Risiko Inheren + Maturitas) / 2
                    </div>
                </td>
                <td style="text-align: right; vertical-align: middle; width: 180px;">
                    <span class="badge {get_badge_class(rating_akhir)}" style="font-size: 9.5pt; padding: 6px 14px;">{rating_akhir}</span>
                </td>
            </tr>
        </table>
        <div class="final-body">
            <div class="analysis-label">Analisis - Tingkat Risiko Keamanan Siber (Rating Akhir)</div>
            <div class="analysis-text" style="margin-top: 4px;">{anz.get("risk", "")}</div>
        </div>
    </div>

    <!-- Page Footer Content -->
    <div id="footer_content" style="text-align: center; font-size: 8pt; color: #94a3b8;">
        Laporan Hasil Penilaian Maturitas Risiko Siber - {bank_name} &middot; Halaman <pdf:pagenumber/> dari <pdf:pagecount/>
    </div>
</body>
</html>
"""

    try:
        with open(output_path, "wb") as result_file:
            pisa_status = pisa.CreatePDF(html_content, dest=result_file)
        
        if pisa_status.err:
            print(f"Error generating PDF: {pisa_status.err}")
            sys.exit(1)
        else:
            print("SUCCESS")
    except Exception as e:
        print(f"Error saving PDF: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
