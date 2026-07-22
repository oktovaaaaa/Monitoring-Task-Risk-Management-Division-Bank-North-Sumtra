// Automatically extracted parameter data from Penilaian_Tingkat_Risiko_Keamanan_Siber_v3.html
export const D = {
  "inh": [
    {
      "code": "1.1",
      "catCode": "A",
      "cat": "Teknologi",
      "title": "Interkoneksi ke internet publik",
      "levels": [
        "Kurang atau sama dengan 2 koneksi",
        "4 koneksi",
        "6 koneksi",
        "8 koneksi",
        "Lebih atau sama dengan 10 koneksi"
      ],
      "ref": "Topologi jaringan & daftar link internet publik (per ISP/sirkuit); konfigurasi firewall edge; berita acara rekonsiliasi jumlah koneksi.",
      "unit": "Divisi TI — Bidang Jaringan & Infrastruktur",
      "note": "Skala asli lompat 2‑4‑6‑8‑≥10 — jumlah 3/5/7/9 koneksi tidak terdefinisi. Bulatkan ke atas (konservatif) & catat dasarnya."
    },
    {
      "code": "1.2",
      "catCode": "A",
      "cat": "Teknologi",
      "title": "Interkoneksi ke pihak ketiga (third party)",
      "levels": [
        "Lebih dari 80% total koneksi ke pihak ketiga menggunakan Application Programming Interface (API)",
        "Hingga 50% dari total koneksi ke pihak ketiga menggunakan API",
        "Lebih dari 80% total koneksi ke pihak ketiga menggunakan host to host",
        "Hingga 50% total koneksi ke pihak ketiga menggunakan host to host",
        "Lebih dari 50% total koneksi ke pihak ketiga menggunakan direct connection"
      ],
      "ref": "Register interkoneksi pihak ketiga beserta metode koneksi (API / host‑to‑host / direct); daftar PKS interkoneksi; hasil rekapitulasi persentase.",
      "unit": "Divisi TI — Bidang Jaringan & Infrastruktur",
      "note": "Skala asli tidak monotonik & berlubang: 50–80% API tidak masuk band manapun. Tetapkan aturan interpretasi tertulis sebelum skoring."
    },
    {
      "code": "1.3",
      "catCode": "A",
      "cat": "Teknologi",
      "title": "Akses ke aset TI Bank",
      "levels": [
        "Koneksi kabel hanya untuk pegawai",
        "Koneksi kabel untuk pegawai saja dan Wi-Fi untuk pihak ketiga terotorisasi",
        "Seluruh koneksi untuk pegawai dan pihak ketiga terotorisasi",
        "Seluruh koneksi untuk pegawai dan pihak ketiga terotorisasi, namun Wi-Fi untuk publik",
        "Seluruh koneksi untuk semua pihak"
      ],
      "ref": "Kebijakan akses jaringan; daftar SSID/Wi‑Fi & segmentasi VLAN; konfigurasi NAC; daftar guest network.",
      "unit": "Divisi TI — Bidang Jaringan & Infrastruktur",
      "note": ""
    },
    {
      "code": "1.4",
      "catCode": "A",
      "cat": "Teknologi",
      "title": "Jaringan intranet dari jaringan kantor Bank",
      "levels": [
        "Bank memiliki jaringan kantor Bank yang tersebar kurang dari 100 lokasi",
        "Bank memiliki jaringan kantor Bank yang tersebar di 100 hingga 300 lokasi",
        "Bank memiliki jaringan kantor Bank yang tersebar di lebih dari 300 hingga 500 lokasi",
        "Bank memiliki jaringan kantor Bank yang tersebar di lebih dari 500 hingga 700 lokasi",
        "Bank memiliki jaringan kantor Bank yang tersebar di lebih dari 700 lokasi"
      ],
      "ref": "Data resmi jaringan kantor (KP, KC, KCP, Kas, Payment Point) dari laporan jaringan kantor ke OJK; daftar lokasi terhubung intranet.",
      "unit": "Divisi Umum / Jaringan Kantor + Divisi TI — Bidang Jaringan & Infrastruktur",
      "note": ""
    },
    {
      "code": "1.5",
      "catCode": "A",
      "cat": "Teknologi",
      "title": "Penggunaan pihak penyedia jasa TI dalam penyelenggaraan pusat data",
      "levels": [
        "Tidak ada penggunaan jasa pihak penyedia jasa TI dalam penyelenggaraan pusat data",
        "Penggunaan jasa pihak penyedia jasa TI selain cloud service provider dalam penyelenggaraan pusat data",
        "Penggunaan jasa cloud service provider berupa SaaS",
        "Penggunaan jasa cloud service provider berupa PaaS",
        "Penggunaan jasa cloud service provider berupa IaaS"
      ],
      "ref": "PKS penyelenggaraan pusat data & DRC; daftar layanan cloud beserta model (SaaS/PaaS/IaaS); laporan penggunaan pihak penyedia jasa TI ke OJK.",
      "unit": "Divisi Teknologi Informasi + Divisi Pengadaan & Divisi Hukum",
      "note": ""
    },
    {
      "code": "1.6",
      "catCode": "A",
      "cat": "Teknologi",
      "title": "Pengelolaan perangkat lunak yang digunakan untuk mendukung kegiatan operasional Bank (termasuk kebutuhan back-office dan TI)",
      "levels": [
        "Seluruh perangkat lunak yang digunakan untuk mendukung kegiatan operasional Bank (termasuk kebutuhan back office & TI) dikelola (dikembangkan dan diselenggarakan) oleh tim TI Bank",
        "Lebih dari 70% perangkat lunak yang digunakan untuk mendukung kegiatan operasional Bank (termasuk kebutuhan back office & TI) dikelola (dikembangkan dan diselenggarakan) oleh tim TI Bank",
        "Lebih dari 50% perangkat lunak yang digunakan untuk mendukung kegiatan operasional Bank (termasuk kebutuhan back-office & TI) dikelola (dikembangkan dan diselenggarakan) oleh tim TI Bank",
        "Lebih dari 30% perangkat lunak yang digunakan untuk mendukung kegiatan operasional Bank (termasuk kebutuhan back office & TI) dikelola (dikembangkan dan diselenggarakan) oleh tim TI Bank",
        "Hingga 30% perangkat lunak yang digunakan untuk mendukung kegiatan operasional Bank (termasuk kebutuhan back-office dan TI) dikelola (dikembangkan dan diselenggarakan) oleh tim TI Bank"
      ],
      "ref": "Daftar aplikasi (application inventory) dengan status pengembang & penyelenggara (in‑house vs vendor); rekap persentase.",
      "unit": "Divisi TI — Bidang Pengembangan Aplikasi",
      "note": ""
    },
    {
      "code": "1.7",
      "catCode": "A",
      "cat": "Teknologi",
      "title": "Penggunaan perangkat keras dan/atau perangkat lunak yang sudah masuk/mendekati masa EOL",
      "levels": [
        "Tidak ada perangkat keras dan/atau perangkat lunak yang melebihi masa EOL atau mendekati masa EOL (2 tahun ke depan akan memasuki masa EOL)",
        "Hingga 30% perangkat keras dan/atau perangkat lunak melebihi masa EOL atau mendekati masa EOL (2 tahun ke depan akan memasuki masa EOL)",
        "Hingga 50% perangkat keras dan/atau perangkat lunak melebihi masa EOL atau mendekati masa EOL (2 tahun ke depan akan memasuki masa EOL)",
        "Hingga 70% perangkat keras dan/atau perangkat lunak melebihi masa EOL atau mendekati masa EOL (2 tahun ke depan akan memasuki masa EOL)",
        "Lebih dari 70% perangkat keras dan/atau perangkat lunak melebihi masa EOL atau mendekati masa EOL (2 tahun ke depan akan memasuki masa EOL)"
      ],
      "ref": "Daftar aset perangkat keras & lunak beserta tanggal EOL/EOS (dari CMDB); rekap persentase aset melewati/mendekati EOL.",
      "unit": "Divisi Teknologi Informasi",
      "note": "Silang: bila persentase EOL tinggi, klaim patching memadai pada Ketahanan 2.j tidak konsisten."
    },
    {
      "code": "1.8",
      "catCode": "A",
      "cat": "Teknologi",
      "title": "Jumlah pegawai yang memiliki akses koneksi perangkat pribadi ke jaringan Bank (Bring Your Own Device)",
      "levels": [
        "Tidak terdapat akses koneksi perangkat pribadi ke jaringan Bank",
        "Akses koneksi perangkat pribadi ke jaringan Bank dimiliki oleh kurang dari 5% pegawai",
        "Akses koneksi perangkat pribadi ke jaringan Bank dimiliki oleh kurang dari 10% pegawai",
        "Akses koneksi perangkat pribadi ke jaringan Bank dimiliki oleh kurang dari 25% pegawai",
        "Akses koneksi perangkat pribadi ke jaringan Bank dimiliki oleh 25% pegawai atau lebih"
      ],
      "ref": "Kebijakan BYOD; data MDM/NAC jumlah perangkat pribadi terdaftar; jumlah pegawai aktif (HRIS) sebagai penyebut.",
      "unit": "Divisi TI — Bidang Security IT / SOC + Divisi Sumber Daya Manusia",
      "note": ""
    },
    {
      "code": "1.9",
      "catCode": "A",
      "cat": "Teknologi",
      "title": "Perangkat lunak yang dapat diakses menggunakan perangkat pribadi ke jaringan Bank",
      "levels": [
        "Tidak terdapat perangkat lunak yang dapat diakses menggunakan perangkat pribadi",
        "Perangkat pribadi yang terhubung ke jaringan Bank hanya dapat mengakses surat elektronik",
        "Perangkat pribadi yang terhubung ke jaringan Bank hanya dapat mengakses surat elektronik dan aplikasi penunjang (tidak bersifat kritikal)",
        "Perangkat pribadi yang terhubung ke jaringan Bank dapat mengakses aplikasi kritikal",
        "Perangkat pribadi yang terhubung ke jaringan Bank dapat mengakses seluruh sistem/aplikasi (termasuk core banking system)"
      ],
      "ref": "Daftar aplikasi yang dapat diakses dari perangkat pribadi; konfigurasi MDM/MAM; matriks kanal akses.",
      "unit": "Divisi TI — Bidang Security IT / SOC",
      "note": ""
    },
    {
      "code": "1.10",
      "catCode": "A",
      "cat": "Teknologi",
      "title": "Pihak ketiga yang memiliki akses terhadap sistem internal Bank dan/atau informasi sensitif",
      "levels": [
        "Tidak terdapat pihak ketiga atau individu dari pihak ketiga yang memiliki akses terhadap sistem internal Bank dan/atau informasi sensitif",
        "Jumlah minimal (1 – 3 entitas atau kurang dari 10 individu) memiliki akses terhadap sistem internal Bank dan/atau informasi sensitif",
        "Jumlah sedang (4 – 6 entitas atau kurang dari 20 individu) memiliki akses terhadap sistem internal Bank dan/atau informasi sensitif",
        "Jumlah signifikan (7 – 10 entitas atau kurang dari 30 individu) memiliki akses terhadap sistem internal Bank dan/atau informasi sensitif",
        "Jumlah substansial (Lebih dari 10 entitas atau 30 individu atau lebih) memiliki akses terhadap sistem internal Bank dan/atau informasi sensitif"
      ],
      "ref": "Register pihak ketiga & individu yang memiliki akses ke sistem internal/informasi sensitif; hasil user access review berkala.",
      "unit": "Divisi TI — Bidang Security IT / SOC + Divisi Manajemen Risiko (Fungsi Keamanan Siber — 2LoD)",
      "note": "Silang: eksposur tinggi di sini tanpa kerangka TPRM (KPMR 2.3.g/h/i) = gap struktural, bukan sekadar skor."
    },
    {
      "code": "2.1",
      "catCode": "B",
      "cat": "Produk Bank",
      "title": "Penggunaan saluran daring dan mobile dalam memberikan layanan",
      "levels": [
        "Tidak ada aplikasi (baik back office maupun untuk nasabah) yang menggunakan saluran daring dan mobile",
        "Saluran daring dan mobile digunakan untuk penyampaian informasi umum Bank kepada masyarakat (antara lain notifikasi/berita, lokasi jaringan kantor, dan produk Bank yang tersedia)",
        "Saluran daring dan mobile digunakan untuk pelayanan transaksi perbankan (produk Bank) bagi nasabah badan usaha secara domestik",
        "Saluran daring dan mobile digunakan untuk pelayanan transaksi perbankan (produk Bank) bagi nasabah ritel secara domestik",
        "Saluran daring dan mobile digunakan untuk: 1. kebutuhan produk bagi nasabah badan usaha dan ritel termasuk remitansi luar negeri dan pertukaran mata uang; dan/atau 2. interkoneksi dengan ekosistem ekonomi digital (contoh: super app)"
      ],
      "ref": "Katalog produk & kanal digital (mobile/internet banking); surat izin/laporan produk & aktivitas baru ke OJK; daftar interkoneksi ekosistem digital.",
      "unit": "Divisi Dana, Jasa & Digital Banking + Divisi Teknologi Informasi",
      "note": ""
    },
    {
      "code": "2.2",
      "catCode": "B",
      "cat": "Produk Bank",
      "title": "Mekanisme pengelolaan ATM",
      "levels": [
        "Bank tidak memiliki layanan ATM",
        "Layanan ATM tersedia, namun Bank tidak memiliki mesin ATM sendiri",
        "Layanan ATM tersedia, mesin ATM dan proses pengisian uang dikelola sepenuhnya oleh Bank",
        "Layanan ATM tersedia, mesin ATM dan proses pengisian uang dikelola dengan kombinasi antara Bank dan pihak ketiga",
        "Layanan ATM tersedia, mesin ATM dan pengisian uang dikelola sepenuhnya oleh pihak ketiga"
      ],
      "ref": "Data jumlah & kepemilikan mesin ATM; PKS pengelolaan ATM dan cash replenishment (vendor CIT).",
      "unit": "Divisi Operasional + Divisi Teknologi Informasi",
      "note": ""
    },
    {
      "code": "2.3",
      "catCode": "B",
      "cat": "Produk Bank",
      "title": "Produk Bank berupa APMK",
      "levels": [
        "Bank tidak menerbitkan APMK",
        "Bank hanya menerbitkan APMK berupa kartu debit untuk mendukung layanan Bank tersebut",
        "Bank menerbitkan APMK (kartu debit dan APMK lainnya) hanya untuk mendukung layanan Bank tersebut",
        "Bank menerbitkan APMK untuk 1 hingga 5 bank lain/institusi keuangan lain",
        "Bank menerbitkan APMK untuk lebih dari 5 bank lain/institusi keuangan lain"
      ],
      "ref": "Data penerbitan APMK (kartu debit/lainnya); izin penyelenggaraan APMK; PKS issuing/acquiring dengan bank/institusi lain.",
      "unit": "Divisi Dana, Jasa & Digital Banking + Divisi Operasional",
      "note": ""
    },
    {
      "code": "2.4",
      "catCode": "B",
      "cat": "Produk Bank",
      "title": "Jenis produk Bank berbasis TI",
      "levels": [
        "Bank tidak memiliki produk Bank berbasis TI",
        "Bank memiliki produk Bank berbasis TI untuk penghimpunan dan/atau penyaluran dana",
        "Bank memiliki produk Bank berbasis TI untuk penghimpunan dana, penyaluran dana, dan/atau treasury",
        "Bank memiliki produk Bank berbasis TI untuk penghimpunan dana, penyaluran dana, treasury, dan/atau aktivitas sistem pembayaran dan investasi pasar modal untuk kebutuhan domestik",
        "Bank memiliki produk Bank berbasis TI untuk penghimpunan dana, penyaluran dana, treasury, dan/atau aktivitas sistem pembayaran termasuk jual beli mata uang dan investasi pasar modal untuk kebutuhan internasional"
      ],
      "ref": "Katalog produk berbasis TI per segmen (himpun dana, salur dana, treasury, sistem pembayaran, pasar modal); laporan produk & aktivitas baru.",
      "unit": "Divisi Perencanaan & Pengembangan + Divisi Kepatuhan",
      "note": ""
    },
    {
      "code": "2.5",
      "catCode": "B",
      "cat": "Produk Bank",
      "title": "Bank sebagai penyedia jasa TI",
      "levels": [
        "Bank tidak menjadi penyedia jasa TI untuk lembaga jasa keuangan lain",
        "Bank menjadi penyedia jasa TI untuk 1 atau 2 lembaga jasa keuangan lain",
        "Bank menjadi penyedia jasa TI untuk 3 lembaga jasa keuangan lain",
        "Bank menjadi penyedia jasa TI untuk 4 atau 5 lembaga jasa keuangan lain",
        "Bank menjadi penyedia jasa TI untuk lebih dari 5 lembaga jasa keuangan lain"
      ],
      "ref": "Daftar lembaga jasa keuangan yang dilayani Bank sebagai penyedia jasa TI; PKS terkait.",
      "unit": "Divisi Teknologi Informasi + Divisi Perencanaan & Pengembangan",
      "note": ""
    },
    {
      "code": "3.1",
      "catCode": "C",
      "cat": "Karakteristik Organisasi",
      "title": "Pergantian (turnover) pada SDM yang menangani TI/ketahanan dan keamanan siber",
      "levels": [
        "Persentase pergantian SDM yang menangani TI/ketahanan dan keamanan siber <5% dalam 1 tahun terakhir",
        "Persentase pergantian SDM yang menangani TI/ketahanan dan keamanan siber <10% dalam 1 tahun terakhir",
        "Persentase pergantian SDM yang menangani TI/ketahanan dan keamanan siber <15% dalam 1 tahun terakhir",
        "Persentase pergantian SDM yang menangani TI/ketahanan dan keamanan siber < 20% dalam 1 tahun terakhir",
        "Persentase pergantian SDM yang menangani TI/ketahanan dan keamanan siber ≥ 20% dalam 1 tahun terakhir"
      ],
      "ref": "Data mutasi/resign/rotasi pegawai TI & keamanan siber 12 bulan terakhir (HRIS); formasi & headcount awal periode sebagai penyebut.",
      "unit": "Divisi Sumber Daya Manusia + Divisi Teknologi Informasi",
      "note": "Silang: KPMR 3.2.a mengakui SDM siber terbatas — bila turnover diskor Low, buktikan dengan angka, bukan asumsi."
    },
    {
      "code": "3.2",
      "catCode": "C",
      "cat": "Karakteristik Organisasi",
      "title": "Perubahan di lingkungan TI",
      "levels": [
        "Kurang dari 3 implementasi sistem kritikal dalam 1 tahun terakhir",
        "3-5 implementasi sistem kritikal dalam 1 tahun terakhir",
        "6-8 implementasi sistem kritikal dalam 1 tahun terakhir",
        "9-11 implementasi sistem kritikal dalam 1 tahun terakhir",
        ">11 implementasi sistem kritikal dalam 1 tahun terakhir"
      ],
      "ref": "Daftar implementasi sistem kritikal 12 bulan terakhir; change management log & berita acara go‑live; laporan penerapan produk/aktivitas baru.",
      "unit": "Divisi TI — Bidang Pengembangan Aplikasi",
      "note": ""
    },
    {
      "code": "3.3",
      "catCode": "C",
      "cat": "Karakteristik Organisasi",
      "title": "Pengelolaan privilege access (administrator dan selevel administrator) di seluruh perangkat (host, jaringan,database, aplikasi, dan cloud)",
      "levels": [
        "Seluruh privilege access untuk seluruh tipe perangkat dikelola oleh unit TI",
        "Privilege access untuk 1 atau 2 tipe perangkat dikelola oleh pihak selain unit TI",
        "Privilege access untuk 3 tipe perangkat dikelola oleh pihak selain unit TI",
        "Privelege access untuk 4 tipe perangkat dikelola oleh pihak selain unit TI",
        "Privelege access untuk lebih dari 4 tipe perangkat dikelola oleh pihak selain unit TI"
      ],
      "ref": "Daftar akun privileged per tipe perangkat (host, jaringan, database, aplikasi, cloud) beserta pengelolanya; konfigurasi PAM; hasil review akun istimewa.",
      "unit": "Divisi TI — Bidang Security IT / SOC",
      "note": ""
    },
    {
      "code": "4.1",
      "catCode": "D",
      "cat": "Rekam Jejak Insiden Siber",
      "title": "Persentase insiden siber yang berdampak signifikan dalam 12 (dua belas) bulan terakhir",
      "levels": [
        "Tidak ada insiden siber yang berdampak signifikan",
        "Hingga 30% dari total insiden siber berdampak signifikan",
        "Hingga 50% dari total insiden siber berdampak signifikan",
        "Hingga 70% dari total insiden siber berdampak signifikan",
        "Lebih dari 70% dari total insiden siber berdampak signifikan"
      ],
      "ref": "Register insiden siber 12 bulan terakhir beserta klasifikasi dampak signifikan; laporan insiden siber ke OJK; kertas kerja penetapan signifikansi.",
      "unit": "Tim Tanggap Insiden Siber (CSIRT) + Divisi Manajemen Risiko (Fungsi Keamanan Siber — 2LoD)",
      "note": "Skor 1 = 'tidak ada insiden signifikan' adalah klaim negatif. Tanpa register insiden + deteksi yang teruji, angka nol berarti tidak terdeteksi, bukan tidak terjadi."
    },
    {
      "code": "4.2",
      "catCode": "D",
      "cat": "Rekam Jejak Insiden Siber",
      "title": "Cakupan dampak insiden siber dalam 12 (dua belas) bulan terakhir",
      "levels": [
        "Tidak terdapat dampak (tidak terdapat insiden siber)",
        "Insiden siber hanya berdampak pada internal Bank",
        "Insiden siber berdampak pada pihak ketiga selain nasabah",
        "Insiden siber berdampak pada ketersediaan produk Bank",
        "Insiden siber berdampak pada kerugian nasabah (contoh : kebocoran data pribadi nasabah)"
      ],
      "ref": "Laporan insiden & analisis dampak (internal / pihak ketiga / ketersediaan produk / kerugian nasabah); bukti notifikasi nasabah & OJK bila ada.",
      "unit": "Tim Tanggap Insiden Siber (CSIRT) + Divisi Manajemen Risiko (Fungsi Keamanan Siber — 2LoD) + Divisi Kepatuhan",
      "note": "Silang dengan Ketahanan 3.a–3.e: klaim nihil dampak hanya kredibel bila kapabilitas deteksi diskor kuat."
    }
  ],
  "kpmr": [
    {
      "code": "1.1.a",
      "domain": "Tata Kelola Risiko terkait Keamanan Siber",
      "sub": "1.1. Kecukupan Pengawasan Aktif oleh Direksi dan Dewan Komisaris",
      "kontrol": "Bank menetapkan wewenang dan tanggung jawab Direksi terkait dengan penerapan manajemen risiko terkait keamanan siber.",
      "penjelasan": "Bank telah memiliki ketentuan mengenai penerapan manajemen risiko terkait ketahanan dan keamanan siber",
      "ref": "Kebijakan/Pedoman Manajemen Risiko Keamanan & Ketahanan Siber (SK Direksi); uraian wewenang & tanggung jawab Direksi; risalah rapat Direksi penetapan.",
      "unit": "Direksi (penetapan) c.q. Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) (penyusun)",
      "flag": ""
    },
    {
      "code": "1.1.b",
      "domain": "Tata Kelola Risiko terkait Keamanan Siber",
      "sub": "1.1. Kecukupan Pengawasan Aktif oleh Direksi dan Dewan Komisaris",
      "kontrol": "Bank menetapkan wewenang dan tanggung jawab Dewan Komisaris terkait dengan penerapan manajemen risiko terkait keamanan siber.",
      "penjelasan": "Bank telah memiliki ketentuan mengenai penerapan manajemen risiko terkait keamanan siber",
      "ref": "Board Manual/Pedoman GCG; Piagam Dewan Komisaris; bagian pengawasan Dekom dalam Kebijakan KS; risalah rapat Dekom.",
      "unit": "Dewan Komisaris (c.q. Komite Pemantau Risiko)",
      "flag": ""
    },
    {
      "code": "1.2.a",
      "domain": "Tata Kelola Risiko terkait Keamanan Siber",
      "sub": "1.2. Perumusan Tingkat Risiko yang Akan Diambil (Risk Appetite) dan Toleransi Risiko (Risk Tolerance) terkait Keamanan Siber",
      "kontrol": "Direksi bertanggung jawab untuk menetapkan tingkat risiko yang diambil (risk appetite) terkait keamanan siber Bank.",
      "penjelasan": "saat ini ketahanan Siber menjadi salah satu parameter dalam Risk Appetite Bank",
      "ref": "Risk Appetite Statement (RAS) yang memuat parameter ketahanan/keamanan siber; SK penetapan RAS.",
      "unit": "Direksi c.q. Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "1.2.b",
      "domain": "Tata Kelola Risiko terkait Keamanan Siber",
      "sub": "1.2. Perumusan Tingkat Risiko yang Akan Diambil (Risk Appetite) dan Toleransi Risiko (Risk Tolerance) terkait Keamanan Siber",
      "kontrol": "Direksi bertanggung jawab untuk menetapkan toleransi risiko (risk tolerance) terkait keamanan siber Bank.",
      "penjelasan": "saat ini ketahanan Siber menjadi salah satu paramter dalam Risk Appetite Bank",
      "ref": "Dokumen Risk Tolerance/limit toleransi risiko siber dalam RAS/RAT.",
      "unit": "Direksi c.q. Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "1.3.a",
      "domain": "Tata Kelola Risiko terkait Keamanan Siber",
      "sub": "1.3. Budaya dan Kesadaran Risiko terkait Keamanan Siber",
      "kontrol": "Direksi mengembangkan budaya mengenai tanggung jawab terkait keamanan siber bagi pegawai di semua level.",
      "penjelasan": "secara umum Bank telah melakukan kampanye baik kepada nasabah maupun kepada internal Bank terkait dengan keamanan siber",
      "ref": "Program & bukti kampanye/awareness siber (internal & nasabah); kebijakan budaya risiko.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line), Divisi SDM, Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "1.3.b",
      "domain": "Tata Kelola Risiko terkait Keamanan Siber",
      "sub": "1.3. Budaya dan Kesadaran Risiko terkait Keamanan Siber",
      "kontrol": "Direksi membangun dan memelihara kesadaran dan komitmen yang kuat terhadap keamanan siber Bank.",
      "penjelasan": "secara umum Bank telah melakukan kampanye baik kepada nasabah maupun kepada internal Bank terkait dengan keamanan siber",
      "ref": "Materi komunikasi & bukti pemeliharaan kesadaran/komitmen siber.",
      "unit": "Direksi c.q. Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "1.3.c",
      "domain": "Tata Kelola Risiko terkait Keamanan Siber",
      "sub": "1.3. Budaya dan Kesadaran Risiko terkait Keamanan Siber",
      "kontrol": "Bank memastikan efektivitas pemahaman dan penerapan kebijakan keamanan siber bagi seluruh pegawai dan pemangku kepentingan terkait.",
      "penjelasan": "Melakukan sosialisasi simulasi kepada seluruh pegawai terkait pemahaman akan terjadi serangan siber",
      "ref": "Materi & hasil simulasi (mis. phishing drill/tabletop); laporan & absensi sosialisasi; hasil uji kesadaran pegawai.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "2.1.a",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.1. Strategi Manajemen Risiko terkait Keamanan Siber",
      "kontrol": "Bank merumuskan strategi manajemen risiko terkait keamanan siber yang sepadan dengan kerentanan dan tingkat eksposur Bank terhadap ancaman siber serta sejalan dengan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) terkait keamanan siber serta strategi bisnis secara keseluruhan.",
      "penjelasan": "Sudah memiliki ketentuan mengenai penerapan manajemen risiko keamanan siber, dan akan melakukan evaluasi sesuai dengan perkembangannya.",
      "ref": "Dokumen Strategi Manajemen Risiko Keamanan Siber; Pedoman KS; keterkaitan dengan RAS.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": "gap"
    },
    {
      "code": "2.1.b",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.1. Strategi Manajemen Risiko terkait Keamanan Siber",
      "kontrol": "Bank memastikan kejelasan seluruh peran dan tanggung jawab terkait keamanan siber dalam strategi manajemen risiko terkait keamanan siber.",
      "penjelasan": "Sudah memiliki fungsi siber yang independen dari fungsi TI Bank pada Divisi Manajemen Risiko, dan sudah memiliki ketentuan mengenai ketahanan dan keamanan siber serta secara internal Divisi Teknologi Informasi juga memiliki bidang security IT",
      "ref": "Struktur organisasi & uraian jabatan fungsi siber (SK/SE Struktur, mis. SE 033/2022); matriks RACI.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "2.1.c",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.1. Strategi Manajemen Risiko terkait Keamanan Siber",
      "kontrol": "Direksi mengomunikasikan strategi manajemen risiko terkait keamanan siber secara efektif kepada seluruh satuan kerja dan pegawai agar dipahami secara jelas.",
      "penjelasan": "Mendukung adanya sosialisasi terkait dengan keamanan siber, serta pertemuan untuk membahas mengenai siber dan akan melaksanakan risk awarness terkait keamanan siber",
      "ref": "Bukti sosialisasi strategi; risalah rapat; memo/edaran Direksi; rencana risk awareness.",
      "unit": "Direksi c.q. Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": "gap"
    },
    {
      "code": "2.1.d",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.1. Strategi Manajemen Risiko terkait Keamanan Siber",
      "kontrol": "Direksi melakukan kaji ulang strategi manajemen risiko terkait keamanan siber secara berkala untuk menentukan perlu atau tidaknya dilakukan perubahan terhadap strategi manajemen risiko tersebut.",
      "penjelasan": "Mendukung adanya sosialisasi terkait dengan keamanan siber, serta pertemuan untuk membahas mengenai siber dan akan melaksanakan risk awarness terkait keamanan siber",
      "ref": "Laporan kaji ulang/review strategi MR siber berkala; risalah.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": "gap"
    },
    {
      "code": "2.2.a",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.2. Kecukupan Perangkat Organisasi terkait Keamanan Siber",
      "kontrol": "Direksi memastikan struktur organisasi Bank telah disertai dengan kejelasan tugas dan tanggung jawab mengenai penerapan manajemen risiko terkait keamanan siber pada seluruh satuan kerja yang disesuaikan dengan tujuan dan kebijakan usaha serta ukuran dan kompleksitas kegiatan usaha Bank",
      "penjelasan": "Sudah memiliki fungsi siber yang independen dari fungsi TI bank pada Divisi Manajemen Risiko dan fungsi security IT pada Divisi Teknologi Informasi",
      "ref": "SK Struktur Organisasi & uraian tugas seluruh satuan kerja terkait KS.",
      "unit": "Direksi c.q. Divisi SDM & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "2.2.b",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.2. Kecukupan Perangkat Organisasi terkait Keamanan Siber",
      "kontrol": "Struktur organisasi dirancang untuk memastikan bahwa satuan kerja yang melakukan fungsi pengendalian intern terhadap manajemen risiko terkait keamanan siber memiliki independensi terhadap satuan kerja bisnis.",
      "penjelasan": "Sudah memiliki fungsi siber yang independen dari fungsi TI bank pada Divisi Manajemen Risiko",
      "ref": "SK Struktur yang menunjukkan independensi fungsi pengendalian siber dari unit bisnis.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "2.2.c",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.2. Kecukupan Perangkat Organisasi terkait Keamanan Siber",
      "kontrol": "Bank memastikan satuan kerja manajemen risiko memiliki fungsi yang menangani penerapan manajemen risiko terkait keamanan siber",
      "penjelasan": "Sudah memiliki fungsi siber yang independen dari fungsi TI bank pada Divisi Manajemen Risiko",
      "ref": "SK/uraian tugas fungsi keamanan siber pada SKMR.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "2.2.d",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.2. Kecukupan Perangkat Organisasi terkait Keamanan Siber",
      "kontrol": "Bank memiliki unit atau fungsi yang bertugas menangani ketahanan dan keamanan siber.",
      "penjelasan": "Sudah memiliki fungsi siber yang independen dari fungsi TI bank pada Divisi Manajemen Risiko",
      "ref": "SK pembentukan unit/fungsi ketahanan & keamanan siber (SOC di DTI; fungsi siber DMR); SK CSIRT.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "2.3.a",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Direksi menetapkan kebijakan dan prosedur yang dituangkan secara tertulis dalam menerapkan manajemen risiko terkait keamanan siber dan ketahanan siber.",
      "penjelasan": "Divisi Manajemen Risiko menerbitkan ketentuan mengenai katahanan dan keamanan siber",
      "ref": "Kebijakan & Prosedur MR Keamanan & Ketahanan Siber tertulis (SK Direksi).",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "2.3.b",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Bank mendesain dan mengimplementasikan kebijakan dan prosedur dengan memperhatikan karakteristik dan kompleksitas kegiatan usaha, tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance), profil risiko, serta peraturan yang ditetapkan otoritas terkait dengan keamanan siber.",
      "penjelasan": "Divisi Manajemen Risiko menerbitkan ketentuan mengenai katahanan dan keamanan siber serta menetapkan Risk Appetite Statement (RAS) dan melakukan pemantauan terhadap RAS dimaksud",
      "ref": "Kebijakan KS + RAS + laporan profil risiko + bukti pemantauan RAS.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "2.3.c",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Bank melakukan internalisasi kebijakan manajemen risiko terkait keamanan siber, termasuk strategi dan tujuan manajemen risiko terkait keamanan siber, ke dalam proses bisnis pada seluruh lini bisnis dan aktivitas pendukung, termasuk kebijakan yang bersifat spesifik sesuai dengan kebutuhan lini bisnis dan aktivitas pendukung Bank.",
      "penjelasan": "Divisi Manajemen Risiko menerbitkan ketentuan mengenai keamanan siber dan telah memiliki fungsi siber pada job desc, serta akan membentuk tim tanggap insiden siber",
      "ref": "Kebijakan turunan per lini bisnis; job desc fungsi siber; rencana pembentukan CSIRT.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & pemilik proses/Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": "gap"
    },
    {
      "code": "2.3.d",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Bank menyusun kebijakan manajemen risiko terkait keamanan siber yang memadai.",
      "penjelasan": "Bank telah memiliki ketentuan mengenai penerapan manajemen risiko terkait ketahanan dan keamanan siber",
      "ref": "Kebijakan MR Keamanan Siber yang memadai.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "2.3.e",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Bank memiliki prosedur yang merupakan turunan dari kebijakan manajemen risiko terkait keamanan siber, yang dapat berupa pengendalian yang bersifat umum pada seluruh lini bisnis dan aktivitas pendukung Bank dan kontrol yang bersifat spesifik pada masing-masing lini bisnis dan aktivitas pendukung Bank.",
      "penjelasan": "Bank akan menerbitkan ketentuan turunan untuk mendukung keamanan siber",
      "ref": "SOP/prosedur turunan keamanan siber (kontrol umum & spesifik per lini).",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": "gap"
    },
    {
      "code": "2.3.f",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Bank memiliki kebijakan dan prosedur keamanan siber yang digunakan untuk mengatur pelindungan aset TI.",
      "penjelasan": "Bank akan menerbitkan ketentuan turunan untuk mendukung keamanan siber",
      "ref": "Kebijakan/SOP Keamanan Informasi & pelindungan aset TI (berbasis ISO 27001).",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": "gap"
    },
    {
      "code": "2.3.g",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Bank memiliki kebijakan dan prosedur manajemen risiko terkait keamanan siber untuk pihak ketiga dan subkontraktor dari pihak ketiga yang mengatur tentang pengelolaan data/informasi digital milik Bank termasuk data nasabah yang dimiliki Bank) oleh pihak ketiga dan subkontraktor dari pihak ketiga.",
      "penjelasan": "Bank akan menerbitkan ketentuan turunan untuk mendukung keamanan siber",
      "ref": "Kebijakan/SOP Manajemen Risiko Pihak Ketiga (TPRM) untuk pengelolaan data digital Bank.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line), Divisi Pengadaan/Umum & Divisi Hukum, Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": "gap"
    },
    {
      "code": "2.3.h",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Bank menerapkan manajemen risiko terkait keamanan siber untuk pihak ketiga dan subkontraktor dari pihak ketiga.",
      "penjelasan": "Bank akan menerbitkan ketentuan turunan untuk mendukung keamanan siber",
      "ref": "TPRM scorecard/due diligence vendor; register pihak ketiga.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line), Divisi Teknologi Informasi (Security IT / SOC – 1st line), Divisi Pengadaan/Umum & Divisi Hukum",
      "flag": "gap"
    },
    {
      "code": "2.3.i",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Bank menetapkan standar minimum kendali keamanan siber bagi pihak ketiga dan subkontraktor dari pihak ketiga, yaitu: \n1) ketentuan kerahasiaan di kontrak kerja sama;\n2) ketersediaan tata kelola pengamanan siber di pihak ketiga dan subkontraktor dari pihak ketiga (kebijakan, prosedur, ketentuan, dan lainnya); dan\n3) pengelolaan risiko terkait keamanan siber termasuk manajemen insiden siber di pihak ketiga dan subkontraktor dari pihak ketiga",
      "penjelasan": "Bank akan menerbitkan ketentuan turunan untuk mendukung keamanan siber",
      "ref": "Klausul kerahasiaan pada PKS; bukti tata kelola pengamanan vendor; prosedur insiden vendor.",
      "unit": "Divisi Pengadaan/Umum & Divisi Hukum, Divisi Teknologi Informasi (Security IT / SOC – 1st line), Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": "gap"
    },
    {
      "code": "2.3.j",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Bank memiliki limit risiko terkait keamanan siber yang sesuai dengan tingkat risiko yang akan diambil (risk appetite), toleransi risiko (risk tolerance), dan strategi Bank terkait keamanan siber secara keseluruhan serta dengan memperhatikan kemampuan Bank untuk dapat menyerap eksposur risiko terkait keamanan siber atau kerugian yang timbul, pengalaman kerugian di masa lalu, kemampuan SDM, dan kepatuhan terhadap ketentuan eksternal yang berlaku.",
      "penjelasan": "Sudah memiliki ketentuan mengenai penerapan manajemen risiko keamanan siber, dan akan melakukan evaluasi sesuai dengan perkembangannya.",
      "ref": "Dokumen penetapan limit risiko siber; RAS/RAT; analisis kapasitas penyerapan risiko.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": "gap"
    },
    {
      "code": "2.3.k",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Kebijakan, prosedur, dan limit dalam penerapan manajemen risiko terkait keamanan siber harus didokumentasikan secara memadai dan dikomunikasikan kepada seluruh pegawai.",
      "penjelasan": "Sudah memiliki ketentuan mengenai penerapan manajemen risiko ketahanan dan keamanan siber, dan Insiden TI  serta melakukan evaluasi sesuai dengan perkembangannya.",
      "ref": "Repositori kebijakan/prosedur/limit; bukti dokumentasi & komunikasi ke pegawai.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "2.3.l",
      "domain": "Kerangka Manajemen Risiko terkait Keamanan Siber",
      "sub": "2.3. Kecukupan Kebijakan, Prosedur, dan Penetapan Limit Risiko terkait Keamanan Siber",
      "kontrol": "Direksi melakukan kaji ulang atas kebijakan, prosedur, dan limit dalam penerapan manajemen risiko terkait keamanan siber secara berkala untuk menyesuaikan dengan kondisi terkini.",
      "penjelasan": "Sudah dilakukan kaji ulang/review terhadap ketentuan siber diakhir tahun 2023",
      "ref": "Laporan kaji ulang ketentuan siber berkala (mis. review akhir 2023); risalah.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "3.1.a",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.1. Proses Manajemen Risiko terkait Keamanan Siber (Identifikasi, Pengukuran, Pemantauan, dan Pengendalian)",
      "kontrol": "Bank melaksanakan identifikasi seluruh risiko terkait keamanan siber secara berkala.",
      "penjelasan": "Bank melakukan analisa risiko siber pada produk digital/elektronik Bank",
      "ref": "Laporan identifikasi/analisa risiko siber berkala; risk register siber; hasil VA/PT.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "3.1.b",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.1. Proses Manajemen Risiko terkait Keamanan Siber (Identifikasi, Pengukuran, Pemantauan, dan Pengendalian)",
      "kontrol": "Bank memastikan tersedianya metode atau sistem untuk melakukan identifikasi risiko pada seluruh kegiatan Bank yang terkait dengan keamanan siber",
      "penjelasan": "Bank melakukan analisa risiko siber pada produk digital/elektronik Bank",
      "ref": "Metodologi identifikasi risiko siber; tools pendukung (SOC, VA).",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "3.1.c",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.1. Proses Manajemen Risiko terkait Keamanan Siber (Identifikasi, Pengukuran, Pemantauan, dan Pengendalian)",
      "kontrol": "Bank melakukan pengukuran risiko secara berkala untuk seluruh kegiatan Bank yang terkait dengan keamanan siber.",
      "penjelasan": "Bank melakukan analisa risiko siber pada produk digital/elektronik Bank",
      "ref": "Laporan pengukuran/scoring risiko siber berkala; profil risiko TI.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "3.1.d",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.1. Proses Manajemen Risiko terkait Keamanan Siber (Identifikasi, Pengukuran, Pemantauan, dan Pengendalian)",
      "kontrol": "Bank memiliki sistem pengukuran risiko untuk mengukur eksposur risiko terkait keamanan siber pada Bank sebagai acuan untuk melakukan pengendalian.",
      "penjelasan": "Bank melakukan analisa risiko siber pada produk digital/elektronik Bank",
      "ref": "Metodologi & tools pengukuran eksposur risiko siber; KRI dashboard.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "3.1.e",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.1. Proses Manajemen Risiko terkait Keamanan Siber (Identifikasi, Pengukuran, Pemantauan, dan Pengendalian)",
      "kontrol": "Bank melakukan evaluasi dan penyempurnaan atas sistem pengukuran risiko terkait keamanan siber secara berkala atau sewaktu-waktu dalam hal diperlukan untuk memastikan kesesuaian asumsi, akurasi, kewajaran dan integritas data, serta prosedur yang digunakan untuk mengukur risiko terkait keamanan siber.",
      "penjelasan": "Dalam proses untuk pengembangan terkait manajemen risiko teknologi informasi yang didalamnya terdapat ketahanan dan keamanan siber",
      "ref": "Roadmap pengembangan MR TI (mencakup ketahanan & keamanan siber); laporan evaluasi sistem pengukuran.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": "gap"
    },
    {
      "code": "3.1.f",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.1. Proses Manajemen Risiko terkait Keamanan Siber (Identifikasi, Pengukuran, Pemantauan, dan Pengendalian)",
      "kontrol": "Bank memiliki sistem dan prosedur pemantauan risiko terkait keamanan siber yang antara lain mencakup pemantauan risiko terkait keamanan siber terhadap besarnya eksposur risiko, toleransi risiko (risk tolerance), kepatuhan limit intern, dan hasil stress test maupun konsistensi pelaksanaan dengan kebijakan dan prosedur yang ditetapkan.",
      "penjelasan": "Dalam proses untuk pengembangan terkait manajemen risiko teknologi informasi yang didalamnya terdapat ketahanan dan keamanan siber",
      "ref": "Laporan pemantauan risiko siber; hasil stress test/skenario; pemantauan limit intern.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": "gap"
    },
    {
      "code": "3.1.g",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.1. Proses Manajemen Risiko terkait Keamanan Siber (Identifikasi, Pengukuran, Pemantauan, dan Pengendalian)",
      "kontrol": "Bank menyiapkan suatu sistem dan prosedur back-up yang efektif untuk mencegah terjadinya gangguan dalam proses pemantauan risiko terkait keamanan siber dan melakukan pengecekan serta penilaian kembali secara berkala terhadap sistem back-up tersebut.",
      "penjelasan": "Dalam proses untuk pengembangan terkait manajemen risiko teknologi informasi yang didalamnya terdapat ketahanan dan keamanan siber",
      "ref": "Prosedur & bukti back-up sistem pemantauan; hasil pengujian back-up berkala.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": "gap"
    },
    {
      "code": "3.1.h",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.1. Proses Manajemen Risiko terkait Keamanan Siber (Identifikasi, Pengukuran, Pemantauan, dan Pengendalian)",
      "kontrol": "Bank memiliki sistem pengendalian risiko terkait keamanan siber yang memadai dengan mengacu pada kebijakan dan prosedur yang telah ditetapkan.",
      "penjelasan": "Dalam proses untuk pengembangan terkait manajemen risiko teknologi informasi yang didalamnya terdapat ketahanan dan keamanan siber",
      "ref": "SOP pengendalian risiko siber; dokumentasi kontrol teknis mengacu kebijakan.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": "gap"
    },
    {
      "code": "3.2.a",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.2. Kecukupan SDM terkait Keamanan Siber",
      "kontrol": "Direksi memastikan kecukupan kuantitas dan kualitas SDM yang ada di Bank dan memastikan SDM dimaksud memahami tugas dan tanggung jawabnya dalam pelaksanaan manajemen risiko terkait keamanan siber, baik untuk unit bisnis, satuan kerja manajemen risiko, maupun unit pendukung yang bertanggung jawab atas pelaksanaan manajemen risiko terkait keamanan siber.",
      "penjelasan": "Saat ini SDM terkait keamanan siber masih terbatas, namun tetap melakukan peningkatan kualitas melalui diklat",
      "ref": "Formasi & analisis beban kerja SDM fungsi siber; rencana pemenuhan & diklat.",
      "unit": "Divisi SDM, Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line), Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": "weak"
    },
    {
      "code": "3.2.b",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.2. Kecukupan SDM terkait Keamanan Siber",
      "kontrol": "Direksi mengembangkan sistem penerimaan, pengembangan, dan pelatihan pegawai, termasuk rencana suksesi manajerial serta remunerasi yang memadai untuk memastikan tersedianya pegawai yang kompeten di bidang manajemen risiko terkait keamanan siber.",
      "penjelasan": "Melaksanakan sosialisasi dan diklat untuk menambah kompentensi SDM dibidang siber menambahkan standar kompetensi, sertifikasi",
      "ref": "Kebijakan SDM (rekrutmen, pengembangan, suksesi, remunerasi); program sertifikasi (mis. BNSP).",
      "unit": "Divisi SDM & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "3.2.c",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.2. Kecukupan SDM terkait Keamanan Siber",
      "kontrol": "Direksi memastikan bahwa seluruh SDM memiliki pemahaman yang memadai atas risiko terkait keamanan siber dan mampu mengomunikasikan implikasi risiko terkait keamanan siber kepada Direksi, Dewan Komisaris, manajemen, dan nasabah.",
      "penjelasan": "Melaksanakan sosialisasi dan diklat untuk menambah kompentensi SDM dibidang siber",
      "ref": "Bukti diklat/sosialisasi; laporan komunikasi implikasi risiko ke Direksi/Dekom/nasabah.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & Divisi SDM",
      "flag": ""
    },
    {
      "code": "3.2.d",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.2. Kecukupan SDM terkait Keamanan Siber",
      "kontrol": "Direksi memastikan agar seluruh SDM memahami strategi, tingkat risiko terkait keamanan siber yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) terkait keamanan siber, kerangka manajemen risiko terkait keamanan siber yang telah ditetapkan oleh Direksi dan disetujui oleh Dewan Komisaris, serta memastikan seluruh SDM menerapkannya secara konsisten dalam aktivitas yang ditangani.",
      "penjelasan": "",
      "ref": "Bukti sosialisasi kerangka MR & RAS siber; absensi; materi.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & Divisi SDM",
      "flag": "gap"
    },
    {
      "code": "3.2.e",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.2. Kecukupan SDM terkait Keamanan Siber",
      "kontrol": "Bank memiliki informasi yang utuh mengenai seluruh pegawai Bank, yang meliputi pengetahuan, keterampilan, kemampuan, dan karakter dari pegawai.",
      "penjelasan": "Sudah memiliki database pegawai, sebagai informasi pegawai menyeluruh dan Portal Divisi Teknologi Informasi terkait informasi",
      "ref": "Database/HRIS pegawai; portal DTI informasi kompetensi.",
      "unit": "Divisi SDM & Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "3.2.f",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.2. Kecukupan SDM terkait Keamanan Siber",
      "kontrol": "Bank mengembangkan dan mengimplementasikan program berkelanjutan untuk peningkatan kapasitas terkait keamanan siber kepada seluruh pegawai yang relevan, termasuk level Direksi, Dewan Komisaris, dan manajemen untuk memastikan bahwa setiap pegawai memiliki kompetensi dan keahlian untuk menjalankan peran dan tanggung jawab secara efektif.",
      "penjelasan": "Melaksanakan sosialisasi dan diklat untuk menambah kompentensi SDM dibidang siber",
      "ref": "Program pelatihan tahunan siber (termasuk Direksi/Dekom); kurikulum; bukti pelaksanaan.",
      "unit": "Divisi SDM & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "3.2.g",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.2. Kecukupan SDM terkait Keamanan Siber",
      "kontrol": "Bank melakukan analisis kesenjangan (gap analysis) untuk memahami tingkat pengetahuan dan kemampuan pegawai terkait keamanan siber dan menggunakan informasi tersebut untuk membuat rencana aksi peningkatan kapasitas pegawai.",
      "penjelasan": "Sudah dilakukan dengan metode test atau ujian yang diikuti oleh seluruh level pegawai",
      "ref": "Hasil test/asesmen kompetensi siber seluruh level; rencana aksi peningkatan kapasitas.",
      "unit": "Divisi SDM & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "3.3.a",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.3. Kecukupan Sistem Informasi Manajemen Risiko terkait Keamanan Siber",
      "kontrol": "Bank memiliki sistem informasi manajemen risiko terkait keamanan siber dan mengembangkannya sesuai dengan kebutuhan Bank dalam rangka penerapan manajemen risiko terkait keamanan siber yang efektif.",
      "penjelasan": "Bank memiliki tools perimeter security seperti next generation firewall, web application firewall, endpoint security. Bank juga memiliki tools detection & response atas security seperti SOC, FDS dll. Implementasi tools security dilakukan dalam rangka penerapan manajemen risiko terkait dengan pengamanan sistem dalam rangka keamanan siber yang efektif",
      "ref": "Dokumentasi tools security (NGFW, WAF, EDR, SOC, FDS); arsitektur SIM risiko siber.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "3.3.b",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.3. Kecukupan Sistem Informasi Manajemen Risiko terkait Keamanan Siber",
      "kontrol": "Bank memastikan sistem informasi manajemen risiko terkait keamanan siber dan informasi yang dihasilkan telah sesuai dengan karakteristik dan kompleksitas kegiatan usaha Bank serta adaptif terhadap perubahan.",
      "penjelasan": "Tools security yang saat ini dimiliki dinilai masih cukup efektif untuk skalabilitas dan kompleksitas kegiatan usaha bank dan dinilai adaptif terhadap perubahan",
      "ref": "Kajian kecukupan & skalabilitas tools terhadap kompleksitas usaha; roadmap adaptasi.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "3.3.c",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.3. Kecukupan Sistem Informasi Manajemen Risiko terkait Keamanan Siber",
      "kontrol": "Bank melakukan kaji ulang secara berkala atas kecukupan cakupan informasi yang dihasilkan dari sistem informasi manajemen risiko terkait keamanan siber untuk memastikan bahwa cakupan informasi tersebut telah memadai sesuai perkembangan tingkat kompleksitas kegiatan usaha Bank.",
      "penjelasan": "Tim IT secara rutin melakukan pemantauan dan evaluasi. Disamping itu, pembenahan tetap dilakukan secara rutin melalui rencana bisnis bank setiap tahunnya dalam rangka peningkatan ketahanan sistem dan keamanan siber",
      "ref": "Laporan pemantauan & evaluasi berkala tim IT; RBB terkait peningkatan ketahanan sistem.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "3.3.d",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.3. Kecukupan Sistem Informasi Manajemen Risiko terkait Keamanan Siber",
      "kontrol": "Sebagai bagian dari sistem informasi manajemen risiko terkait keamanan siber, laporan tingkat maturitas keamanan siber disusun secara berkala oleh unit atau fungsi yang bertugas menangani ketahanan dan keamanan siber Bank. Frekuensi penyampaian laporan tingkat maturitas keamanan siber kepada Direksi terkait dan komite manajemen risiko harus ditingkatkan sesuai kebutuhan terutama dalam hal terdapat perkembangan serangan dan ancaman siber yang berubah dengan cepat.",
      "penjelasan": "Laporan tingkat maturitas keamanan siber disusun secara berkala",
      "ref": "Laporan Tingkat Maturitas Keamanan Siber berkala; bukti penyampaian ke Direksi & Komite MR.",
      "unit": "Fungsi/Unit Keamanan Siber (Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line))",
      "flag": ""
    },
    {
      "code": "3.3.e",
      "domain": "Proses Manajemen Risiko, Kecukupan SDM, dan Kecukupan Sistem Informasi Manajemen Risiko, terkait Keamanan Siber",
      "sub": "3.3. Kecukupan Sistem Informasi Manajemen Risiko terkait Keamanan Siber",
      "kontrol": "Bank memastikan sistem informasi manajemen risiko terkait keamanan siber mendukung pelaksanaan pelaporan tingkat maturitas keamanan siber kepada Otoritas Jasa Keuangan.",
      "penjelasan": "Tools security yang dimiliki dinilai dapat mendukung pelaksanaan pelaporan tingkat maturitas keamanan siber",
      "ref": "Bukti pelaporan tingkat maturitas ke OJK (APOLO/portal OJK).",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "4.1.a",
      "domain": "Sistem Pengendalian Risiko terkait Keamanan Siber",
      "sub": "4.1. Kecukupan Sistem Pengendalian Intern",
      "kontrol": "Bank melaksanakan sistem pengendalian intern secara efektif dalam penerapan manajemen risiko terkait keamanan siber dengan mengacu pada kebijakan dan prosedur yang telah ditetapkan",
      "penjelasan": "Sudah melaksanakan pemeriksaan berdasarkan ketentuan baik internal maupun eksternal",
      "ref": "Laporan hasil audit intern/eksternal MR siber; kertas kerja SPI.",
      "unit": "Satuan Kerja Audit Intern (3rd line) & Divisi Kepatuhan",
      "flag": ""
    },
    {
      "code": "4.1.b",
      "domain": "Sistem Pengendalian Risiko terkait Keamanan Siber",
      "sub": "4.1. Kecukupan Sistem Pengendalian Intern",
      "kontrol": "Bank melaksanakan sistem pengendalian intern secara efektif dalam penerapan proses ketahanan siber dengan mengacu pada kebijakan dan prosedur yang telah ditetapkan.",
      "penjelasan": "Sudah melaksanakan pemeriksaan berdasarkan ketentuan baik internal maupun eksternal",
      "ref": "Laporan audit/pemeriksaan proses ketahanan siber.",
      "unit": "Satuan Kerja Audit Intern (3rd line)",
      "flag": ""
    },
    {
      "code": "4.1.c",
      "domain": "Sistem Pengendalian Risiko terkait Keamanan Siber",
      "sub": "4.1. Kecukupan Sistem Pengendalian Intern",
      "kontrol": "Satuan kerja audit intern melakukan pemantauan terhadap perbaikan hasil temuan. Temuan yang belum ditindaklanjuti harus dilaporkan kepada Direksi dan/atau Dewan Komisaris untuk diambil langkah yang diperlukan.",
      "penjelasan": "Seluruh temuan dilaporkan kepada Direksi/Komisaris",
      "ref": "Laporan pemantauan tindak lanjut temuan; laporan temuan belum ditindaklanjuti ke Direksi/Dekom.",
      "unit": "Satuan Kerja Audit Intern (3rd line)",
      "flag": ""
    },
    {
      "code": "4.1.d",
      "domain": "Sistem Pengendalian Risiko terkait Keamanan Siber",
      "sub": "4.1. Kecukupan Sistem Pengendalian Intern",
      "kontrol": "Bank memiliki sistem rotasi rutin untuk menghindari potensi self-dealing, persekongkolan atau penyembunyian suatu dokumentasi atau aktivitas yang tidak wajar.",
      "penjelasan": "Bank sudah menerapkan sistem rotasi/mutasi pada seluruh unit kerja",
      "ref": "Kebijakan & bukti rotasi/mutasi pegawai pada unit kerja.",
      "unit": "Divisi SDM",
      "flag": ""
    },
    {
      "code": "4.2.a",
      "domain": "Sistem Pengendalian Risiko terkait Keamanan Siber",
      "sub": "4.2. Kecukupan Kaji Ulang",
      "kontrol": "Bank melakukan kaji ulang dan evaluasi terhadap penerapan manajemen risiko terkait keamanan siber secara berkala sesuai dengan karakteristik dan kompleksitas Bank",
      "penjelasan": "Divisi Manajemen Risiko menerbitkan ketentuan mengenai katahanan dan keamanan siber",
      "ref": "Laporan kaji ulang & evaluasi penerapan MR siber berkala.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line) & Satuan Kerja Audit Intern (3rd line)",
      "flag": ""
    },
    {
      "code": "4.2.b",
      "domain": "Sistem Pengendalian Risiko terkait Keamanan Siber",
      "sub": "4.2. Kecukupan Kaji Ulang",
      "kontrol": "Bank memastikan satuan kerja yang menjalankan fungsi manajemen risiko terkait keamanan siber melakukan kaji ulang dan evaluasi secara memadai.",
      "penjelasan": "Menjadi objek pemantauan dan pemeriksaan",
      "ref": "Kertas kerja & laporan kaji ulang oleh fungsi MR siber.",
      "unit": "Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "4.2.c",
      "domain": "Sistem Pengendalian Risiko terkait Keamanan Siber",
      "sub": "4.2. Kecukupan Kaji Ulang",
      "kontrol": "Bank memastikan satuan kerja audit intern melakukan kaji ulang dan evaluasi secara memadai.",
      "penjelasan": "Menjadi objek pemantauan dan pemeriksaan",
      "ref": "Program & laporan audit intern siber.",
      "unit": "Satuan Kerja Audit Intern (3rd line)",
      "flag": ""
    },
    {
      "code": "4.2.d",
      "domain": "Sistem Pengendalian Risiko terkait Keamanan Siber",
      "sub": "4.2. Kecukupan Kaji Ulang",
      "kontrol": "Bank memastikan pihak yang melakukan kaji ulang dan evaluasi atas penerapan manajemen risiko terkait keamanan siber memiliki independensi dan kompetensi yang baik serta metode kaji ulang yang andal.",
      "penjelasan": "Menjadi objek pemantauan dan pemeriksaan",
      "ref": "Piagam SKAI; sertifikasi/kompetensi auditor; metodologi kaji ulang.",
      "unit": "Satuan Kerja Audit Intern (3rd line) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "4.2.e",
      "domain": "Sistem Pengendalian Risiko terkait Keamanan Siber",
      "sub": "4.2. Kecukupan Kaji Ulang",
      "kontrol": "Bank memastikan bahwa hasil kaji ulang dan evaluasi atas penerapan manajemen risiko terkait keamanan siber telah disampaikan kepada Direksi dan Dewan Komisaris untuk diambil langkah perbaikan dan/atau penyempurnaan manajemen risiko terkait keamanan siber",
      "penjelasan": "Seluruh temuan terkait siber akan dilaporkan kepada Direksi/Komisaris. Hasil kaji ulang disampaikan ke Direksi",
      "ref": "Laporan hasil kaji ulang; risalah penyampaian ke Direksi/Dekom; dokumentasi tindak lanjut.",
      "unit": "Satuan Kerja Audit Intern (3rd line) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    }
  ],
  "keta": [
    {
      "code": "1.a",
      "domain": "Proses Identifikasi Aset, Ancaman, dan Kerentanan",
      "kontrol": "Bank menerapkan manajemen aset melalui inventarisasi dan penilaian aset TI (antara lain perangkat keras, perangkat lunak, jaringan, dan infrastruktur) serta pencatatan konfigurasi secara efektif.",
      "penjelasan": "Aset teknologi informasi telah diinventarisir dan telah dinilai",
      "ref": "Inventaris aset TI (CMDB); hasil penilaian aset; baseline konfigurasi.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "1.b",
      "domain": "Proses Identifikasi Aset, Ancaman, dan Kerentanan",
      "kontrol": "Bank melakukan identifikasi kerentanan dan pemantauan terhadap perkembangan siber terkini untuk mengidentifikasi ancaman siber.",
      "penjelasan": "Bank telah mengimplementasikan SOC yang didalamnya sudah termasuk threat intelligence, melakukan vulnerability assessment dan penetration test",
      "ref": "Laporan SOC/threat intelligence; hasil VA; laporan PT.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "1.c",
      "domain": "Proses Identifikasi Aset, Ancaman, dan Kerentanan",
      "kontrol": "Bank melakukan pengujian keamanan siber secara berkala.",
      "penjelasan": "Bank telah melakukan vulnerability assessment dengan melaksanakan penetration test secara berkala. Disamping itu, Bank juga melakukan uji keamanan berdasarkan skenario table top dan cyber range exercise pada pelaksanaan live operasional DRC",
      "ref": "Laporan VA/PT berkala; hasil tabletop & cyber range exercise; berita acara live DRC.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "2.a",
      "domain": "Proses Pelindungan Aset",
      "kontrol": "Bank menerapkan pengendalian keamanan (security control) yang komprehensif sesuai dengan hasil identifikasi aset, ancaman, dan kerentanan.",
      "penjelasan": "Tools security sebagai perimeter security standar yang sudah diimplementasikan adalah firewall, web application firewall, endpoint security, antispam. Penguatan lainnya adalah Bank melakukan pengujian kehandalan dan keamanan dengan melakukan penetration test terhadap aplikasi-aplikasi critical",
      "ref": "Dokumentasi security control (FW, WAF, EDR, antispam); hasil PT aplikasi critical.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "2.b",
      "domain": "Proses Pelindungan Aset",
      "kontrol": "Bank melakukan pemeliharaan dan perbaikan terhadap pengendalian keamanan atas aset TI sesuai dengan kebijakan dan prosedur yang berlaku.",
      "penjelasan": "Secara rutin dilakukan pemantauan secara manual, pemantauan dengan layanan SOC. Bank juga melakukan update knowledge base tools security secara rutin seperti update firmware, definition, patching, serta secara rutin dan otomatis melakukan update IP yang berstatus bad reputation ataupun IP yang melakukan jenis atau pola serangan siber",
      "ref": "Log pemeliharaan; bukti update firmware/definition/patching; laporan SOC.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "2.c",
      "domain": "Proses Pelindungan Aset",
      "kontrol": "Bank menerapkan sistem pengamanan yang dikelola dengan baik sesuai kebijakan dan prosedur yang berlaku.",
      "penjelasan": "Tools security sebagai perimeter security standar yang sudah diimplementasikan adalah firewall, web application firewall, endpoint security, antispam. Penguatan lainnya adalah Bank melakukan pengujian kehandalan dan keamanan dengan melakukan penetration test terhadap aplikasi-aplikasi critical",
      "ref": "SOP pengelolaan sistem pengamanan; baseline konfigurasi perimeter.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "2.d",
      "domain": "Proses Pelindungan Aset",
      "kontrol": "Bank melakukan penginian pengendalian keamanannya secara berkala untuk memastikan kecukupan kontrol keamanan yang digunakan sesuai dengan hasil terkini dari proses identifikasi",
      "penjelasan": "Bank secara rutin melakukan update terhadap IP Bad Reputation, patching firmware firewall dan update endpoint security",
      "ref": "Log pengkinian kontrol (IP bad reputation, patch firmware, update EDR).",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "2.e",
      "domain": "Proses Pelindungan Aset",
      "kontrol": "Bank menerapkan manajemen keamanan data dan informasi serta memastikan bahwa data dan/atau informasi dikelola sesuai dengan strategi manajemen risiko terkait keamanan siber pada organisasi untuk melindungi kerahasiaan, integritas, serta ketersediaan data dan informasi",
      "penjelasan": "Bank telah menerapkan manajemen keamanan data dan informasi seperti mengimplementasikan infrastruktur keamanan, penggunaan protocol yang secure, hak akses control pada aplikasi, penggunaan secure network, penerapan two factor authentication",
      "ref": "Kebijakan klasifikasi & keamanan data (CIA); bukti 2FA, access control, enkripsi/secure protocol.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "2.f",
      "domain": "Proses Pelindungan Aset",
      "kontrol": "Bank menerapkan manajemen pelindungan terhadap jaringan, perangkat keras, dan perangkat lunak.",
      "penjelasan": "Perlindungan terhadap jaringan dilakukan dengan mengimplementasikan SOC, firewall, web application firewall",
      "ref": "Arsitektur keamanan jaringan; dokumentasi SOC/FW/WAF.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "2.g",
      "domain": "Proses Pelindungan Aset",
      "kontrol": "Bank menerapkan manajemen pelindungan terhadap akses dan pengguna untuk mencegah tindakan tidak terotorisasi pada perangkat, infrastruktur jaringan, dan komponen sistem yang dikelola oleh Bank.",
      "penjelasan": "Perlindungan terhadap akses dan penggunaan untuk mencegah tindakan terotorisasi dilakukan pada layer aplikasi berdasarkan user matriks access control",
      "ref": "User access matrix; IAM; bukti review hak akses berkala.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "2.h",
      "domain": "Proses Pelindungan Aset",
      "kontrol": "Bank menerapkan pelindungan yang memadai dalam pelaksanaan kerja sama antara Bank dengan pihak penyedia jasa TI, termasuk dalam penggunaan cloud.",
      "penjelasan": "Bank melakukan verifikasi terhadap perusahaan yang bekerjsaman dengan Bank dan membuat klausa perlindungan data pada perjanjian kerja sama",
      "ref": "PKS penyedia TI dengan klausul keamanan & pelindungan data; due diligence cloud; TPRM.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line), Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line), Divisi Pengadaan/Umum & Divisi Hukum",
      "flag": ""
    },
    {
      "code": "2.i",
      "domain": "Proses Pelindungan Aset",
      "kontrol": "Bank memastikan penerapan secure coding dalam pengembangan sistem dan aplikasi untuk meminimalisasi kerentanan atas sistem dan aplikasi.",
      "penjelasan": "Bank menerapkan proses SDLC yang memadai",
      "ref": "Kebijakan SDLC/secure coding; hasil code review/SAST. ⚠ Terkait gap PR2 (integrasi interface) pada struktur OPB.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": "gap"
    },
    {
      "code": "2.j",
      "domain": "Proses Pelindungan Aset",
      "kontrol": "Bank memastikan pelaksanaan patching berjalan dengan baik serta memastikan keandalan dan kemutakhiran seluruh komponen perangkat lunak, jaringan komunikasi, database, dan sistem operasi (operating system) Bank.",
      "penjelasan": "Patching belum dilakukan secara maksimal",
      "ref": "Kebijakan & log patch management; laporan kepatuhan patch. ⚠ Penjelasan menyatakan patching BELUM maksimal — skor tidak boleh 1.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": "weak"
    },
    {
      "code": "3.a",
      "domain": "Proses Deteksi Insiden Siber",
      "kontrol": "Bank memastikan ketersediaan dokumentasi kinerja dasar (baseline performance) atas fungsi kritis Bank dan sistem pendukung, agar setiap penyimpangan dapat dideteksi secara tepat waktu serta aktivitas dan kejadian anomali dapat ditandai untuk ditindaklanjuti.",
      "penjelasan": "Log atas aktifitas security pada layanan-layanan critical seperti server, firewall, waf, router, core switch telah diintegrasikan dengan log collector yang merupakan satu kesatuan layanan SOC. Layanan SOC juga memiliki dashboard yang dapat diakses secara jaringan dengan kondisi yang realtime",
      "ref": "Dokumen baseline performance fungsi kritis; integrasi log ke SOC; dashboard SOC realtime.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "3.b",
      "domain": "Proses Deteksi Insiden Siber",
      "kontrol": "Bank melakukan pemantauan atas aktivitas mencurigakan serta melakukan pengelolaan dan pengujian terhadap proses dan prosedur deteksi untuk memastikan aktivitas anomali dapat dideteksi secara tepat waktu.",
      "penjelasan": "Tools yang digunakan untuk monitoring dan deteksi adalah firewall (next generation firewall), web application firewall, antivirus, antispam. Disamping itu, Bank juga telah mengimplementasikan layanan SOC sebagai bagian tools security untuk monitoring dan mendeteksi serangan siber. Pada layanan SOC juga sudah dibekali dengan threat intelligence",
      "ref": "Bukti monitoring SOC & threat intelligence; hasil pengujian proses deteksi.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "3.c",
      "domain": "Proses Deteksi Insiden Siber",
      "kontrol": "Bank melakukan pemantauan atau deteksi secara berkelanjutan terhadap kerentanan untuk memastikan efektivitas upaya pelindungan yang telah diterapkan.",
      "penjelasan": "Tools yang digunakan untuk monitoring dan deteksi adalah firewall (next generation firewall), web application firewall, antivirus, antispam. Disamping itu, Bank juga telah mengimplementasikan layanan SOC sebagai bagian tools security untuk monitoring dan mendeteksi serangan siber. Pada layanan SOC juga sudah dibekali dengan threat intelligence",
      "ref": "Laporan VA berkelanjutan; laporan pemantauan kerentanan SOC.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "3.d",
      "domain": "Proses Deteksi Insiden Siber",
      "kontrol": "Bank memastikan ketersediaan proses untuk mendeteksi insiden siber secara memadai.",
      "penjelasan": "Bank telah mengimplementasikan Firewall, Web Application Firewall, SOC, Antispam, Endpoint Security, Access List dan network VPN",
      "ref": "Arsitektur & dokumentasi proses deteksi (FW/WAF/SOC/EDR/antispam/VPN/access list).",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line)",
      "flag": ""
    },
    {
      "code": "3.e",
      "domain": "Proses Deteksi Insiden Siber",
      "kontrol": "Bank melakukan analisis terhadap ancaman dan kerentanan dari suatu insiden siber untuk memastikan penanganan insiden secara efektif sehingga dapat mencegah terjadinya gangguan pada layanan dan/atau operasional Bank.",
      "penjelasan": "Bank melakukan analisis terhadap ancamanan dan kerentanan yang terjadi",
      "ref": "Laporan analisis ancaman & kerentanan per insiden; root cause analysis.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line) & Tim Tanggap Insiden Siber (CSIRT)",
      "flag": ""
    },
    {
      "code": "4.a",
      "domain": "Proses Penanggulangan dan Pemulihan Insiden Siber",
      "kontrol": "Bank menetapkan rencana penanggulangan dan pemulihan insiden siber untuk memastikan penanggulangan dan pengembalian layanan yang tepat waktu sesuai dengan risiko yang ditimbulkan, dengan dampak minimal.",
      "penjelasan": "Bank telah melakukan simulasi ketahanan siber yang dilakukan secara bersamaan dengan pelaksanaan live operasional DRC",
      "ref": "Rencana/SOP penanggulangan & pemulihan insiden siber; berita acara simulasi ketahanan + DRC.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line), Tim Tanggap Insiden Siber (CSIRT), Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "4.b",
      "domain": "Proses Penanggulangan dan Pemulihan Insiden Siber",
      "kontrol": "Bank menetapkan peran serta tugas dan tanggung jawab tim tanggap insiden siber untuk memastikan penanggulangan dan pemulihan insiden siber dilaksanakan dengan dampak minimal terhadap layanan dan operasional Bank.",
      "penjelasan": "Bank telah membentuk tim Keamanan Sistem Informasi, bank sudah membentuk Tim Tanggap Insiden Siber",
      "ref": "SK Tim Tanggap Insiden Siber (CSIRT); uraian peran, tugas & tanggung jawab.",
      "unit": "Tim Tanggap Insiden Siber (CSIRT)",
      "flag": ""
    },
    {
      "code": "4.c",
      "domain": "Proses Penanggulangan dan Pemulihan Insiden Siber",
      "kontrol": "Bank menerapkan prosedur pemulihan dan upaya untuk mencegah penyebaran dampak dari suatu insiden siber dengan memitigasi dampak dan menanggulangi insiden siber tersebut.",
      "penjelasan": "Bank telah memiliki ketentuan yang mengatur insiden siber",
      "ref": "Ketentuan/SOP insiden siber; playbook containment & pemulihan.",
      "unit": "Divisi Teknologi Informasi (Security IT / SOC – 1st line) & Tim Tanggap Insiden Siber (CSIRT)",
      "flag": ""
    },
    {
      "code": "4.d",
      "domain": "Proses Penanggulangan dan Pemulihan Insiden Siber",
      "kontrol": "Bank melakukan analisis untuk memastikan langkah penanggulangan dan pemulihan insiden siber dijalankan dengan tepat.",
      "penjelasan": "Bank senantiasa melakukan analisis terhadap insiden-insiden yang terjadi",
      "ref": "Laporan analisis ketepatan langkah penanggulangan & pemulihan.",
      "unit": "Tim Tanggap Insiden Siber (CSIRT) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    },
    {
      "code": "4.e",
      "domain": "Proses Penanggulangan dan Pemulihan Insiden Siber",
      "kontrol": "Bank melakukan eskalasi dan pelaporan atas insiden siber sesuai dengan jalur komunikasi yang telah ditetapkan",
      "penjelasan": "Bank telah memiliki prosedur pelaporan atas insiden siber",
      "ref": "SOP eskalasi & pelaporan insiden; jalur komunikasi; laporan insiden material ke OJK.",
      "unit": "Tim Tanggap Insiden Siber (CSIRT), Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line), Divisi Kepatuhan",
      "flag": ""
    },
    {
      "code": "4.f",
      "domain": "Proses Penanggulangan dan Pemulihan Insiden Siber",
      "kontrol": "Bank melakukan analisis pasca insiden sebagai bahan pelajaran terpetik (lesson learned) dalam penanggulangan dan pemulihan insiden siber untuk perbaikan berkelanjutan",
      "penjelasan": "Bank senantiasa melakukan analisis pasca insiden serta menjadikan bahan pembelajaran untuk diimplementasikan",
      "ref": "Laporan post-incident review; register lesson learned & tindak lanjut perbaikan.",
      "unit": "Tim Tanggap Insiden Siber (CSIRT) & Divisi Manajemen Risiko (Fungsi/Unit Keamanan Siber – 2nd line)",
      "flag": ""
    }
  ],
  "matrix": {
  "inheren": [
    [
      "LOW (1)",
      "Dengan mempertimbangkan aktivitas bisnis yang dilakukan Bank, kemungkinan kerugian yang dihadapi Bank dari risiko inheren terkait keamanan siber tergolong sangat rendah selama periode waktu tertentu pada masa depan.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Low (1):\na. Bank menggunakan TI yang sangat terbatas dan kerentanan terhadap serangan siber sangat rendah;\nb. tidak terdapat produk Bank yang disalurkan menggunakan TI dan/atau saluran daring dan mobile;\nc. pergantian (turnover) pada SDM yang menangani TI/ ketahanan dan keamanan siber sangat rendah;\nd. tidak terdapat insiden siber yang berdampak signifikan selama 12 (dua belas) bulan terakhir."
    ],
    [
      "LOW TO MODERATE (2)",
      "Dengan mempertimbangkan aktivitas bisnis yang dilakukan Bank, kemungkinan kerugian yang dihadapi Bank dari risiko inheren terkait keamanan siber tergolong rendah selama periode waktu tertentu pada masa depan.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Low to Moderate (2):\na. Bank menggunakan TI yang terbatas, kerentanan terhadap serangan siber rendah, dan Bank melakukan outsourcing TI dengan kompleksitas yang sangat rendah;\nb. jenis produk Bank yang disalurkan menggunakan TI dan/atau saluran daring dan mobile sangat terbatas;\nc. pergantian (turnover) pada SDM yang menangani TI/ketahanan dan keamanan siber rendah;\nd. persentase insiden siber yang berdampak signifikan selama 12 (dua belas) bulan terakhir sangat rendah serta berdampak hanya pada intern Bank."
    ],
    [
      "MODERATE (3)",
      "Dengan mempertimbangkan aktivitas bisnis yang dilakukan Bank, kemungkinan kerugian yang dihadapi Bank dari risiko inheren terkait keamanan siber tergolong cukup tinggi selama periode waktu tertentu pada masa depan.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Moderate (3):\na. Bank menggunakan TI yang cukup terbatas, kerentanan terhadap serangan siber cukup rendah, dan Bank melakukan outsourcing TI dengan kompleksitas yang rendah;\nb. jenis produk Bank yang disalurkan menggunakan TI dan/atau saluran daring dan mobile terbatas;\nc. pergantian (turnover) pada SDM yang menangani TI/ ketahanan dan keamanan siber cukup tinggi;\nd. persentase insiden siber yang berdampak signifikan selama 12 (dua belas) bulan terakhir rendah serta berdampak pada pihak ketiga selain nasabah."
    ],
    [
      "MODERATE TO HIGH (4)",
      "Dengan mempertimbangkan aktivitas bisnis yang dilakukan Bank, kemungkinan kerugian yang dihadapi Bank dari risiko inheren terkait keamanan siber tergolong tinggi selama periode waktu tertentu pada masa depan.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Moderate to High (4):\na. Bank menggunakan TI yang kompleks dalam hal cakupan dan kecanggihannya, kerentanan terhadap serangan siber cukup tinggi, dan Bank melakukan outsourcing TI kritikal dengan kompleksitas yang cukup tinggi;\nb. jenis produk Bank yang disalurkan menggunakan TI dan/atau saluran daring dan mobile cukup banyak;\nc. pergantian (turnover) pada SDM yang menangani TI/ ketahanan dan keamanan siber tinggi;\nd. persentase insiden siber yang berdampak signifikan selama 12 (dua belas) bulan terakhir cukup tinggi serta berdampak pada ketersediaan produk Bank."
    ],
    [
      "HIGH (5)",
      "Dengan mempertimbangkan aktivitas bisnis yang dilakukan Bank, kemungkinan kerugian yang dihadapi Bank dari risiko inheren terkait keamanan siber tergolong sangat tinggi selama periode waktu tertentu pada masa depan.\n\nContoh karakteristik Bank yang termasuk dalam peringkat High (5):\na. Bank menggunakan TI yang sangat kompleks dalam hal cakupan dan kecanggihannya, kerentanan terhadap serangan siber sangat tinggi, dan Bank melakukan outsourcing TI kritikal dengan kompleksitas yang tinggi;\nb. jenis produk Bank yang disalurkan menggunakan TI dan/atau saluran daring dan mobile sangat tinggi;\nc. pergantian (turnover) pada SDM yang menangani TI/ ketahanan dan keamanan siber sangat tinggi;\nd. persentase insiden siber yang berdampak signifikan selama 12 (dua belas) bulan terakhir sangat tinggi serta berdampak langsung pada kerugian nasabah."
    ]
  ],
  "kpmr": [
    [
      "STRONG (1)",
      "Kualitas penerapan manajemen risiko terkait keamanan siber sangat memadai. Meskipun terdapat kelemahan minor tetapi kelemahan tersebut tidak signifikan sehingga dapat diabaikan.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Strong (1):\na. pengawasan aktif oleh Direksi dan Dewan Komisaris secara keseluruhan sangat memadai;\nb. SDM sangat memadai, baik dari sisi kuantitas maupun kompetensi pada fungsi manajemen risiko terkait keamanan siber;\nc. struktur organisasi terkait penerapan manajemen risiko terkait keamanan siber pada seluruh satuan kerja telah berjalan dengan sangat baik;\nd. Direksi dan Dewan Komisaris memiliki kesadaran (awareness) dan pemahaman mengenai manajemen risiko terkait keamanan siber yang sangat baik;\ne. budaya dan kesadaran manajemen risiko terkait keamanan siber telah dikembangkan dan diimplementasikan dengan sangat baik di seluruh lingkungan organisasi Bank;\nf. program peningkatan kapasitas SDM di bidang keamanan informasi dan manajemen risiko terkait keamanan siber sangat memadai;\ng. penetapan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) sangat memadai serta sangat sesuai dengan sasaran strategis dan strategi bisnis Bank;\nh. strategi manajemen risiko terkait keamanan siber sangat sejalan dengan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) terkait keamanan siber;\ni. kebijakan dan prosedur manajemen risiko serta penetapan limit risiko terkait keamanan siber sangat memadai dan tersedia untuk seluruh area manajemen risiko terkait keamanan siber, sejalan dengan penerapan, dan dipahami dengan baik oleh pegawai;\nj. proses manajemen risiko terkait keamanan siber sangat memadai dalam mengidentifikasi, mengukur, memantau, dan mengendalikan risiko terkait keamanan siber;\nk. sistem informasi manajemen risiko terkait keamanan siber sangat baik sehingga menghasilkan laporan risiko terkait keamanan siber yang komprehensif dan terintegrasi kepada Direksi dan Dewan Komisaris;\nl. sistem pengendalian intern sangat efektif dalam mendukung pelaksanaan manajemen risiko terkait keamanan siber;\nm. pelaksanaan kaji ulang independen oleh satuan kerja audit intern dan satuan kerja yang menjalankan fungsi manajemen risiko terkait keamanan siber sangat memadai, baik dari sisi metodologi, frekuensi, maupun pelaporan kepada Direksi dan Dewan Komisaris;\nn. secara umum tidak terdapat kelemahan yang signifikan berdasarkan hasil kaji ulang independen;\no. tindak lanjut atas kaji ulang independen telah dilaksanakan dengan sangat memadai."
    ],
    [
      "SATISFACTORY (2)",
      "Kualitas penerapan manajemen risiko terkait keamanan siber memadai. Meskipun terdapat beberapa kelemahan minor, kelemahan tersebut dapat diselesaikan pada aktivitas bisnis normal.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Satisfactory (2):\na. pengawasan aktif oleh Direksi dan Dewan Komisaris secara keseluruhan memadai;\nb. SDM memadai, baik dari sisi kuantitas maupun kompetensi pada fungsi manajemen risiko terkait keamanan siber;\nc. struktur organisasi terkait penerapan manajemen risiko terkait keamanan siber pada seluruh satuan kerja telah berjalan dengan baik;\nd. Direksi dan Dewan Komisaris memiliki kesadaran (awareness) dan pemahaman mengenai manajemen risiko terkait keamanan siber yang baik;\ne. budaya dan kesadaran manajemen risiko terkait keamanan siber telah dikembangkan dan diimplementasikan dengan baik di seluruh lingkungan organisasi Bank;\nf. program peningkatan kapasitas SDM di bidang keamanan informasi dan manajemen risiko terkait keamanan siber memadai;\ng. penetapan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) memadai serta sesuai dengan sasaran strategis dan strategi bisnis Bank;\nh. strategi manajemen risiko terkait keamanan siber sejalan dengan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) terkait keamanan siber;\ni. kebijakan dan prosedur manajemen risiko serta penetapan limit risiko terkait keamanan siber memadai dan tersedia untuk seluruh area manajemen risiko terkait keamanan siber, sejalan dengan penerapan, dan dipahami dengan baik oleh pegawai meskipun terdapat kelemahan minor;\nj. proses manajemen risiko terkait keamanan siber memadai;\no. tindak lanjut atas kaji ulang independen telah dilaksanakan dengan memadai dalam mengidentifikasi, mengukur, memantau, dan mengendalikan risiko terkait keamanan siber;\nk. sistem informasi manajemen risiko terkait keamanan siber baik sehingga menghasilkan laporan risiko terkait keamanan siber yang komprehensif dan terintegrasi kepada Direksi dan Dewan Komisaris;\nl. sistem pengendalian intern efektif dalam mendukung pelaksanaan manajemen risiko terkait keamanan siber;\nm. pelaksanaan kaji ulang independen oleh satuan kerja audit intern dan satuan kerja yang menjalankan fungsi manajemen risiko terkait keamanan siber memadai, baik dari sisi metodologi, frekuensi, maupun pelaporan kepada Direksi dan Dewan Komisaris;\nn. terdapat kelemahan yang tidak signifikan berdasarkan hasil kaji ulang independen;\no. tindak lanjut atas kaji ulang independen telah dilaksanakan dengan memadai."
    ],
    [
      "FAIR (3)",
      "Kualitas penerapan manajemen risiko terkait keamanan siber cukup memadai. Meskipun persyaratan minimum terpenuhi, terdapat beberapa kelemahan yang membutuhkan perhatian manajemen.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Fair (3):\na. pengawasan aktif oleh Direksi dan Dewan Komisaris secara keseluruhan cukup memadai;\nb. SDM cukup memadai, baik dari sisi kuantitas maupun kompetensi pada fungsi manajemen risiko terkait keamanan siber;\nc. struktur organisasi terkait penerapan manajemen risiko terkait keamanan siber pada seluruh satuan kerja telah berjalan dengan cukup baik;\nd. Direksi dan Dewan Komisaris memiliki kesadaran (awareness) dan pemahaman mengenai manajemen risiko terkait keamanan siber yang cukup baik;\ne. budaya dan kesadaran manajemen risiko terkait keamanan siber telah dikembangkan dan diimplementasikan dengan cukup baik di seluruh lingkungan organisasi Bank;\nf. program peningkatan kapasitas SDM di bidang keamanan informasi dan manajemen risiko terkait keamanan siber cukup memadai;\ng. penetapan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) cukup memadai namun tidak selalu sesuai dengan sasaran strategis dan strategi bisnis Bank;\nh. strategi manajemen risiko terkait keamanan siber cukup sejalan dengan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) terkait keamanan siber;\ni. kebijakan dan prosedur manajemen risiko serta penetapan limit risiko terkait keamanan siber cukup memadai namun tidak selalu sejalan dengan penerapan;\nj. proses manajemen risiko terkait keamanan siber cukup memadai dalam mengidentifikasi, mengukur, memantau, dan mengendalikan risiko terkait keamanan siber;\nk. sistem informasi manajemen risiko terkait keamanan siber cukup baik, termasuk pelaporan risiko terkait keamanan siber yang komprehensif dan terintegrasi kepada Direksi dan Dewan Komisaris;\nl. sistem pengendalian intern cukup efektif dalam mendukung pelaksanaan manajemen risiko terkait keamanan siber;\nm. pelaksanaan kaji ulang independen oleh satuan kerja audit intern dan satuan kerja yang menjalankan fungsi manajemen risiko terkait keamanan siber cukup memadai, baik dari sisi metodologi, frekuensi, maupun pelaporan kepada Direksi dan Dewan Komisaris;\nn. terdapat kelemahan yang cukup signifikan berdasarkan hasil kaji ulang independen yang memerlukan perhatian manajemen;\no. tindak lanjut atas kaji ulang independen telah dilaksanakan dengan cukup memadai."
    ],
    [
      "MARGINAL (4)",
      "Kualitas penerapan manajemen risiko terkait keamanan siber kurang memadai. Terdapat kelemahan signifikan pada berbagai aspek manajemen risiko terkait keamanan siber yang memerlukan tindakan korektif segera.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Marginal (4):\na. pengawasan aktif oleh Direksi dan Dewan Komisaris secara keseluruhan kurang memadai, dan terdapat kelemahan pada berbagai aspek penilaian yang memerlukan perbaikan segera;\nb. SDM kurang memadai, baik dari sisi kuantitas maupun kompetensi pada fungsi manajemen risiko terkait keamanan siber;\nc. struktur organisasi terkait penerapan manajemen risiko terkait keamanan siber pada seluruh satuan kerja kurang berjalan dengan baik;\nd. kelemahan signifikan atas kesadaran (awareness) dan pemahaman Direksi dan Dewan Komisaris mengenai manajemen risiko terkait keamanan siber;\ne. budaya dan kesadaran manajemen risiko terkait keamanan siber kurang dikembangkan dan diimplementasikan dengan baik di seluruh lingkungan organisasi Bank;\nf. program peningkatan kapasitas SDM di bidang keamanan informasi dan manajemen risiko terkait keamanan siber kurang memadai;\ng. penetapan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) kurang memadai serta tidak sesuai dengan sasaran strategis dan strategi bisnis Bank;\nh. strategi manajemen risiko terkait keamanan siber kurang sejalan dengan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) terkait keamanan siber;\ni. kebijakan dan prosedur manajemen risiko serta penetapan limit risiko terkait keamanan siber kurang memadai dan tidak sejalan dengan penerapan;\nj. proses manajemen risiko terkait keamanan siber kurang memadai dalam mengidentifikasi, mengukur, memantau, dan mengendalikan risiko terkait keamanan siber; \nk. kelemahan signifikan pada sistem informasi manajemen risiko terkait keamanan siber, termasuk pelaporan risiko terkait keamanan siber kepada Direksi dan Dewan Komisaris, yang memerlukan perbaikan segera;\nl. sistem pengendalian intern kurang efektif dalam mendukung pelaksanaan manajemen risiko terkait keamanan siber;\nm. pelaksanaan kaji ulang independen oleh satuan kerja audit intern dan satuan kerja yang menjalankan fungsi manajemen risiko terkait keamanan siber kurang memadai, baik dari sisi metodologi, frekuensi, maupun pelaporan kepada Direksi dan Dewan Komisaris;\nn. terdapat kelemahan yang signifikan berdasarkan hasil kaji ulang independen yang memerlukan perbaikan segera;\no. tindak lanjut atas kaji ulang independen dilaksanakan dengan kurang memadai."
    ],
    [
      "UNSATISFACTORY (5)",
      "Kualitas penerapan manajemen risiko terkait keamanan siber tidak memadai. Terdapat kelemahan signifikan pada berbagai aspek manajemen risiko terkait keamanan siber yang tindakan penyelesaiannya di luar kemampuan manajemen.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Unsatisfactory (5):\na. pengawasan aktif oleh Direksi dan Dewan Komisaris secara keseluruhan tidak memadai serta terdapat kelemahan pada hampir seluruh aspek penilaian dan tindakan penyelesaiannya di luar kemampuan Bank;\nb. SDM tidak memadai, baik dari sisi kuantitas maupun kompetensi pada fungsi manajemen risiko terkait keamanan siber;\nc. struktur organisasi terkait penerapan manajemen risiko terkait keamanan siber pada seluruh satuan kerja tidak berjalan dengan baik;\nd. kesadaran (awareness) dan pemahaman Direksi dan Dewan Komisaris mengenai manajemen risiko terkait keamanan siber sangat lemah;\ne. budaya dan kesadaran manajemen risiko terkait keamanan siber tidak dikembangkan dan diimplementasikan di lingkungan organisasi Bank atau belum ada sama sekali;\nf. program peningkatan kapasitas SDM di bidang keamanan informasi dan manajemen risiko terkait keamanan siber tidak memadai;\ng. penetapan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) tidak memadai serta tidak terdapat kaitan dengan sasaran strategis dan strategi bisnis Bank;\nh. strategi manajemen risiko terkait keamanan siber tidak sejalan dengan tingkat risiko yang akan diambil (risk appetite) dan toleransi risiko (risk tolerance) terkait keamanan siber;\ni. kelemahan sangat signifikan pada kebijakan dan prosedur manajemen risiko serta penetapan limit risiko terkait keamanan siber;\nj. proses manajemen risiko terkait keamanan siber tidak memadai dalam mengidentifikasi, mengukur, memantau, dan mengendalikan risiko terkait keamanan siber;\nk. kelemahan fundamental pada sistem informasi manajemen risiko terkait keamanan siber;\nl. sistem pengendalian intern tidak efektif dalam mendukung pelaksanaan manajemen risiko terkait keamanan siber;\nm. pelaksanaan kaji ulang independen oleh satuan kerja audit intern dan satuan kerja yang menjalankan fungsi manajemen risiko terkait keamanan siber tidak memadai, serta terdapat kelemahan pada metodologi, frekuensi, dan/atau pelaporan kepada Direksi dan Dewan Komisaris yang memerlukan perbaikan fundamental;\nn. terdapat kelemahan yang sangat signifikan berdasarkan hasil kaji ulang independen yang memerlukan perbaikan segera;\no. tindak lanjut atas kaji ulang independen tidak memadai atau tidak ada."
    ]
  ],
  "ketahanan": [
    [
      "STRONG (1)",
      "Kualitas penerapan proses ketahanan siber sangat memadai. Meskipun terdapat kelemahan minor tetapi kelemahan tersebut tidak signifikan sehingga dapat diabaikan.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Strong (1):\na. proses identifikasi aset, ancaman dan kerentanan sangat memadai;\nb. proses pelindungan aset dilaksanakan dengan sangat baik;\nc. proses deteksi insiden siber sangat andal dan teruji;\nd. proses penanggulangan dan pemulihan insiden siber dilaksanakan dengan sangat baik dan tidak menimbulkan gangguan yang signifikan."
    ],
    [
      "SATISFACTORY (2)",
      "Kualitas penerapan proses ketahanan siber memadai. Meskipun terdapat beberapa kelemahan minor, kelemahan tersebut dapat diselesaikan pada aktivitas bisnis normal.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Satisfactory (2):\na. proses identifikasi aset, ancaman, dan kerentanan memadai;\nb. proses pelindungan aset dilaksanakan dengan baik;\nc. proses deteksi insiden siber andal dan teruji;\nd. proses penanggulangan dan pemulihan insiden siber dilaksanakan dengan baik meskipun terdapat gangguan namun tidak bersifat signifikan."
    ],
    [
      "FAIR (3)",
      "Kualitas penerapan proses ketahanan siber cukup memadai. Meskipun persyaratan minimum terpenuhi, terdapat beberapa kelemahan yang membutuhkan perhatian manajemen.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Fair (3):\na. proses identifikasi aset, ancaman, dan kerentanan cukup memadai;\nb. proses pelindungan aset dilaksanakan dengan cukup baik;\nc. proses deteksi insiden siber cukup andal dan teruji;\nd. proses penanggulangan dan pemulihan insiden siber dilaksanakan dengan cukup baik namun tetap menimbulkan gangguan yang bersifat minor."
    ],
    [
      "MARGINAL (4)",
      "Kualitas penerapan proses ketahanan siber kurang memadai. Terdapat kelemahan signifikan pada berbagai proses untuk menjaga ketahanan siber yang memerlukan tindakan korektif segera.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Marginal (4):\na. proses identifikasi aset, ancaman, dan kerentanan kurang memadai;\nb. proses pelindungan aset dilaksanakan dengan kurang baik;\nc. proses deteksi insiden siber kurang andal dan teruji;\nd. proses penanggulangan dan pemulihan insiden siber dilaksanakan dengan kurang baik dan menimbulkan gangguan yang signifikan."
    ],
    [
      "UNSATISFACTORY (5)",
      "Kualitas penerapan proses ketahanan siber tidak memadai. Terdapat kelemahan signifikan pada berbagai proses untuk menjaga ketahanan siber yang tindakan penyelesaiannya di luar kemampuan manajemen.\n\nContoh karakteristik Bank yang termasuk dalam peringkat Unsatisfactory (5):\na. proses identifikasi aset, ancaman, dan kerentanan tidak memadai;\nb. proses pelindungan aset tidak dilaksanakan dengan baik;\nc. proses deteksi insiden siber tidak andal dan teruji;\nd. proses penanggulangan dan pemulihan insiden siber tidak dilaksanakan dengan baik sehingga menimbulkan gangguan yang sangat signifikan."
    ]
  ],
  "maturitas": [
    [
      "TINGKAT 1",
      "Mencerminkan kondisi maturitas keamanan siber Bank yang secara umum sangat tinggi, tercermin dari penerapan manajemen risiko terkait keamanan siber dan penerapan proses ketahanan siber yang secara umum sangat baik. Dalam hal terdapat kelemahan maka secara umum kelemahan tersebut tidak signifikan."
    ],
    [
      "TINGKAT 2",
      "Mencerminkan kondisi maturitas keamanan siber Bank yang secara umum tinggi, tercermin dari penerapan manajemen risiko terkait keamanan siber dan penerapan proses ketahanan siber yang secara umum baik. Dalam hal terdapat kelemahan maka secara umum kelemahan tersebut kurang signifikan."
    ],
    [
      "TINGKAT 3",
      "Mencerminkan kondisi maturitas keamanan siber Bank yang secara umum cukup, tercermin dari penerapan manajemen risiko terkait keamanan siber dan penerapan proses ketahanan siber yang secara umum cukup baik. Dalam hal terdapat kelemahan maka secara umum kelemahan tersebut cukup signifikan dan apabila tidak berhasil diatasi dengan baik oleh manajemen dapat mengganggu kelangsungan usaha Bank."
    ],
    [
      "TINGKAT 4",
      "Mencerminkan kondisi maturitas keamanan siber Bank yang secara umum rendah, tercermin dari penerapan manajemen risiko terkait keamanan siber dan penerapan proses ketahanan siber yang secara umum kurang baik. Terdapat kelemahan yang secara umum signifikan dan tidak dapat diatasi dengan baik oleh manajemen serta mengganggu kelangsungan usaha Bank."
    ],
    [
      "TINGKAT 5",
      "Mencerminkan kondisi maturitas keamanan siber Bank yang secara umum sangat rendah, tercermin dari penerapan manajemen risiko terkait keamanan siber dan penerapan proses ketahanan siber yang secara umum kurang baik. Terdapat kelemahan yang secara umum sangat signifikan sehingga untuk mengatasinya diperlukan dukungan dana dari pemegang saham atau sumber dana dari pihak lain untuk memperkuat penerapan manajemen risiko terkait keamanan siber dan penerapan proses ketahanan siber pada Bank."
    ]
  ],
  "risiko": [
    [
      "LOW (1)",
      "Tingkat risiko keamanan siber sangat rendah: eksposur inheren rendah dan/atau diimbangi kualitas penerapan manajemen risiko serta proses ketahanan siber yang sangat memadai."
    ],
    [
      "LOW TO MODERATE (2)",
      "Tingkat risiko rendah: eksposur inheren terkendali dan kualitas penerapan memadai; kelemahan yang ada dapat diselesaikan pada aktivitas bisnis normal."
    ],
    [
      "MODERATE (3)",
      "Tingkat risiko cukup tinggi: terdapat ketidakseimbangan antara eksposur inheren dan kualitas penerapan yang memerlukan perhatian manajemen."
    ],
    [
      "MODERATE TO HIGH (4)",
      "Tingkat risiko tinggi: eksposur inheren tinggi tidak diimbangi kualitas penerapan yang memadai; memerlukan tindakan korektif segera."
    ],
    [
      "HIGH (5)",
      "Tingkat risiko sangat tinggi: eksposur inheren sangat tinggi disertai kelemahan signifikan pada penerapan manajemen risiko dan proses ketahanan siber."
    ]
  ]
}
};
