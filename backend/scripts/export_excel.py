import sys
import json
import xlrd
from xlutils.copy import copy

def set_cell_with_style(out_sheet, row, col, value):
    row_obj = out_sheet._Worksheet__rows.get(row)
    previous_cell = None
    if row_obj:
        previous_cell = row_obj._Row__cells.get(col)
    
    out_sheet.write(row, col, value)
    
    if previous_cell:
        new_row_obj = out_sheet._Worksheet__rows.get(row)
        new_cell = new_row_obj._Row__cells.get(col)
        if new_cell:
            new_cell.xf_idx = previous_cell.xf_idx

def main():
    if len(sys.argv) < 4:
        print("Usage: python export_excel.py <template_path> <output_path> <json_data>")
        sys.exit(1)
        
    template_path = sys.argv[1]
    output_path = sys.argv[2]
    json_data_str = sys.argv[3]
    
    try:
        data = json.loads(json_data_str)
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        sys.exit(1)
        
    bank_name = data.get("bank_name", "PT Bank Sumut")
    active_year = data.get("active_year", 2025)
    scores = data.get("scores", {})
    refs = data.get("refs", {})
    units = data.get("units", {})
    anz = data.get("anz", {})
    
    try:
        rb = xlrd.open_workbook(template_path, formatting_info=True)
        wb = copy(rb)
    except Exception as e:
        print(f"Error opening workbook: {e}")
        sys.exit(1)
        
    sheet_names = rb.sheet_names()

    # Disable Page Break Preview for all sheets to remove watermarks
    for i in range(len(sheet_names)):
        try:
            ws = wb.get_sheet(i)
            ws.set_page_preview(False)
            ws.show_page_breaks = False
            ws.show_auto_page_breaks = False
        except Exception:
            pass
    
    # 1. Update Inheren parameters
    # A. Teknologi (1.1 - 1.10) -> H4 - H13
    if "Teknologi" in sheet_names:
        sheet_idx = sheet_names.index("Teknologi")
        w_sheet = wb.get_sheet(sheet_idx)
        for i in range(1, 11):
            code = f"1.{i}"
            score = scores.get(code)
            if score is not None:
                try:
                    score_val = int(score)
                    if 1 <= score_val <= 5:
                        row_idx = i + 3
                        set_cell_with_style(w_sheet, row_idx, 7, score_val)
                except ValueError:
                    pass
                    
    # B. Produk Bank (2.1 - 2.5) -> H4 - H8
    if "Produk Bank" in sheet_names:
        sheet_idx = sheet_names.index("Produk Bank")
        w_sheet = wb.get_sheet(sheet_idx)
        for i in range(1, 6):
            code = f"2.{i}"
            score = scores.get(code)
            if score is not None:
                try:
                    score_val = int(score)
                    if 1 <= score_val <= 5:
                        row_idx = i + 3
                        set_cell_with_style(w_sheet, row_idx, 7, score_val)
                except ValueError:
                    pass

    # C. Karakter Organisasi (3.1 - 3.3) -> H4 - H6
    if "Karakter Organisasi" in sheet_names:
        sheet_idx = sheet_names.index("Karakter Organisasi")
        w_sheet = wb.get_sheet(sheet_idx)
        for i in range(1, 4):
            code = f"3.{i}"
            score = scores.get(code)
            if score is not None:
                try:
                    score_val = int(score)
                    if 1 <= score_val <= 5:
                        row_idx = i + 3
                        set_cell_with_style(w_sheet, row_idx, 7, score_val)
                except ValueError:
                    pass

    # D. Rekam Jejak (4.1 - 4.2) -> H4 - H5
    if "Rekam Jejak" in sheet_names:
        sheet_idx = sheet_names.index("Rekam Jejak")
        w_sheet = wb.get_sheet(sheet_idx)
        for i in range(1, 3):
            code = f"4.{i}"
            score = scores.get(code)
            if score is not None:
                try:
                    score_val = int(score)
                    if 1 <= score_val <= 5:
                        row_idx = i + 3
                        set_cell_with_style(w_sheet, row_idx, 7, score_val)
                except ValueError:
                    pass

    # 2. Update KPMR parameters
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
    if "KPMR" in sheet_names:
        sheet_idx = sheet_names.index("KPMR")
        w_sheet = wb.get_sheet(sheet_idx)
        for idx, code in enumerate(kpmr_codes):
            row_idx = idx + 3
            
            score = scores.get(code)
            if score is not None:
                try:
                    score_val = int(score)
                    if 1 <= score_val <= 5:
                        set_cell_with_style(w_sheet, row_idx, 4, score_val)
                except ValueError:
                    pass
            
            ref_val = refs.get(code, "")
            set_cell_with_style(w_sheet, row_idx, 6, ref_val)
            
            unit_val = units.get(code, "")
            set_cell_with_style(w_sheet, row_idx, 7, unit_val)

    # 3. Update Kualitas Ketahanan parameters
    keta_codes = [
        "1.a", "1.b", "1.c",
        "2.a", "2.b", "2.c", "2.d", "2.e", "2.f", "2.g", "2.h", "2.i", "2.j",
        "3.a", "3.b", "3.c", "3.d", "3.e",
        "4.a", "4.b", "4.c", "4.d", "4.e", "4.f"
    ]
    if "Kualitas Ketahanan" in sheet_names:
        sheet_idx = sheet_names.index("Kualitas Ketahanan")
        w_sheet = wb.get_sheet(sheet_idx)
        for idx, code in enumerate(keta_codes):
            row_idx = idx + 3
            
            score = scores.get(code)
            if score is not None:
                try:
                    score_val = int(score)
                    if 1 <= score_val <= 5:
                        set_cell_with_style(w_sheet, row_idx, 3, score_val)
                except ValueError:
                    pass
            
            ref_val = refs.get(code, "")
            set_cell_with_style(w_sheet, row_idx, 5, ref_val)
            
            unit_val = units.get(code, "")
            set_cell_with_style(w_sheet, row_idx, 6, unit_val)

    # 4. Calculate ratings and update HASIL PENILAIAN sheet
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

    inh_names = {0: "Belum Dinilai", 1: "Low", 2: "Low to Moderate", 3: "Moderate", 4: "Moderate to High", 5: "High"}
    kpmr_names = {0: "Belum Dinilai", 1: "Strong", 2: "Satisfactory", 3: "Fair", 4: "Marginal", 5: "Unsatisfactory"}
    keta_names = {0: "Belum Dinilai", 1: "Strong", 2: "Satisfactory", 3: "Fair", 4: "Marginal", 5: "Unsatisfactory"}
    mat_names = {0: "Belum Dinilai", 1: "Tingkat 1", 2: "Tingkat 2", 3: "Tingkat 3", 4: "Tingkat 4", 5: "Tingkat 5"}
    risk_names = {0: "Belum Dinilai", 1: "Low", 2: "Low to Moderate", 3: "Moderate", 4: "Moderate to High", 5: "High"}

    avg_tek = get_avg([f"1.{i}" for i in range(1, 11)])
    avg_prod = get_avg([f"2.{i}" for i in range(1, 6)])
    avg_char = get_avg([f"3.{i}" for i in range(1, 4)])
    avg_rec = get_avg([f"4.{i}" for i in range(1, 3)])

    cs_list = [avg_tek, avg_prod, avg_char, avg_rec]
    if any(v is None for v in cs_list):
        avg_inh = get_avg([f"1.{i}" for i in range(1, 11)] + [f"2.{i}" for i in range(1, 6)] + [f"3.{i}" for i in range(1, 4)] + [f"4.{i}" for i in range(1, 3)])
    else:
        avg_inh = sum(cs_list) / 4

    avg_kpmr = get_avg(kpmr_codes)
    avg_keta = get_avg(keta_codes)
    avg_mat = (avg_kpmr + avg_keta) / 2 if (avg_kpmr is not None and avg_keta is not None) else None
    avg_akhir = (avg_inh + avg_mat) / 2 if (avg_inh is not None and avg_mat is not None) else None

    if "HASIL PENILAIAN" in sheet_names:
        sheet_idx = sheet_names.index("HASIL PENILAIAN")
        w_sheet = wb.get_sheet(sheet_idx)
        
        # Nama Bank -> Row 4, Col 2 (C5)
        set_cell_with_style(w_sheet, 4, 2, f"Nama Bank   : {bank_name}")
        # Tahun -> Row 5, Col 2 (C6)
        set_cell_with_style(w_sheet, 5, 2, f"Tahun            : {active_year}")
        
        # Teknologi Peringkat -> Row 10, Col 3 (D11)
        set_cell_with_style(w_sheet, 10, 3, inh_names[get_band(avg_tek)])
        # Produk Bank Peringkat -> Row 11, Col 3 (D12)
        set_cell_with_style(w_sheet, 11, 3, inh_names[get_band(avg_prod)])
        # Karakteristik Organisasi -> Row 12, Col 3 (D13)
        set_cell_with_style(w_sheet, 12, 3, inh_names[get_band(avg_char)])
        # Rekam Jejak -> Row 13, Col 3 (D14)
        set_cell_with_style(w_sheet, 13, 3, inh_names[get_band(avg_rec)])
        
        # Peringkat Risiko Inheren -> Row 14, Col 3 (D15)
        set_cell_with_style(w_sheet, 14, 3, inh_names[get_band(avg_inh)])
        
        # KPMR -> Row 10, Col 7 (H11)
        set_cell_with_style(w_sheet, 10, 7, kpmr_names[get_band(avg_kpmr)])
        # Ketahanan -> Row 12, Col 7 (H13)
        set_cell_with_style(w_sheet, 12, 7, keta_names[get_band(avg_keta)])
        # Peringkat Maturitas -> Row 14, Col 7 (H15)
        set_cell_with_style(w_sheet, 14, 7, mat_names[get_band(avg_mat)])
        
        # Peringkat Akhir -> Row 26, Col 4 (E27)
        set_cell_with_style(w_sheet, 26, 4, risk_names[get_band(avg_akhir)])
        
        # Analysis comments:
        # Inheren Analisis -> Row 16, Col 1 (B17)
        set_cell_with_style(w_sheet, 16, 1, anz.get("inh", ""))
        # Maturitas Analisis -> Row 16, Col 5 (F17)
        set_cell_with_style(w_sheet, 16, 5, anz.get("mat", ""))
        # Akhir Analisis -> Row 29, Col 1 (B30)
        set_cell_with_style(w_sheet, 29, 1, anz.get("risk", ""))

    try:
        wb.save(output_path)
        print("SUCCESS")
    except Exception as e:
        print(f"Error saving workbook: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
