import type { InteractiveModulePayload } from '@flashlearn/shared';
import type { SimpleSlideDef } from './bridging_deck_html';

export interface SeedInteractiveModuleDef {
  slug: string;
  title: string;
  summary: string;
  readingTimeMinutes: number;
  payload: InteractiveModulePayload;
  slides: SimpleSlideDef[];
}

export const BRIDGING_MODULES: SeedInteractiveModuleDef[] = [
  {
    slug: 'enkripsi-asimetris-bridging',
    title: 'Enkripsi Asimetris: Dari Kotak Gembok ke Kunci Publik',
    summary: 'Pahami cara kerja public-private key dengan langsung mencoba kotak transparan bergembok sebelum menyentuh rumus.',
    readingTimeMinutes: 6,
    slides: [
      { id: 's1-anomali', kicker: 'Langkah 1 · Masalah Nyata', title: 'Satu Kunci Saja Tidak Cukup', lead: 'Mengirim kunci rahasia lewat kurir umum sama saja membuka peluang penyadap menggandakannya.', bullets: ['Kurir bisa menyalin kunci sebelum pesan pertama terkirim', 'Solusi butuh pemisahan antara mengunci dan membuka'], theme: 'dark' },
      { id: 's2-anchor', kicker: 'Langkah 2 · Fase Anchoring', title: 'Kotak Transparan & Gembok Klik', lead: 'Siapa saja bisa menekan gembok hingga terkunci, tetapi hanya pemegang anak kunci tunggal yang bisa membukanya.', bullets: ['Mengunci = klik sekali (tanpa anak kunci)', 'Membuka = wajib pakai anak kunci pribadi'], theme: 'accent' },
      { id: 's3-bridge', kicker: 'Langkah 3 · Fase Bridging', title: 'Gembok = Public Key, Anak Kunci = Private Key', lead: 'Membagikan gembok terbuka secara publik tidak pernah membahayakan isi kotak.', bullets: ['Public Key dibagikan bebas untuk enkripsi', 'Private Key tetap tersimpan rapat untuk dekripsi', 'Batas analogi: versi digital memakai fungsi matematika satu arah'], theme: 'light' },
      { id: 's4-contract', kicker: 'Langkah 4 · Kontrak Simbol', title: 'C = Enc(M, K_pub) | M = Dec(C, K_priv)', lead: 'Rumus ini hanyalah singkatan tertulis dari aturan kotak gembok yang baru kamu coba.', bullets: ['Enc menggunakan K_pub (boleh disalin siapa saja)', 'Dec wajib menggunakan K_priv (tidak pernah dikirim)'], theme: 'dark' },
    ],
    payload: {
      schemaVersion: 'uila-v2',
      knowledgeProfile: 'bridging_understand',
      estimatedMinutes: 6,
      learningObjective: 'Menjelaskan mengapa menyebarkan Public Key secara terbuka tetap menjaga kerahasiaan pesan terenkripsi.',
      unitMeta: {
        unitCode: 'U01',
        unitTitle: 'Pertemuan 1: Fondasi Bridging Analogies',
        unitOrder: 1,
        moduleOrder: 1,
        targetLectureMinutes: 25,
      },
      hingeCheck: {
        prompt: 'Sebelum masuk ke notasi rumus: jika 1.000 orang menyalin gembok klik milik Budi, siapa yang bisa membuka kotak yang sudah dikunci?',
        options: [
          { id: 'h_a', text: 'Hanya Budi yang memegang anak kunci pribadinya.', isCorrect: true, feedback: 'Tepat: menyalin gembok terbuka hanya memberi kemampuan mengunci, bukan membuka.' },
          { id: 'h_b', text: 'Siapa saja dari 1.000 orang tersebut yang ikut menekan gemboknya.', isCorrect: false, feedback: 'Belum tepat: mekanisme klik satu arah membuat pengunci pun tidak bisa membuka lagi tanpa anak kunci.' },
        ],
        remediationCard: 'Ingat pemisahan peran: gembok = fungsi mengunci (boleh disalin bebas), anak kunci = fungsi membuka (hanya 1 pemilik).',
        slideIndex: 3,
      },
      summarySlideIndex: 6,
      uila: {
        groundingDecision: {
          mode: 'experiential_anchor_bridge',
          priorKnowledgeAssumed: 'none',
          setupCostSeconds: 20,
          rationale: 'Peserta awam belum punya pengalaman langsung dengan kriptografi asimetris; simulasi kotak bergembok membangun jangkar intuitif dalam 20 detik.',
        },
        block1_anomaly: {
          groundState: 'Kamu ingin mengirim dokumen rahasia ke rekan di kota lain lewat jaringan internet terbuka.',
          oldWay: 'Mengunci dokumen dengan satu kata sandi (kunci simetris) lalu mengirim kata sandi itu ke rekanmu.',
          breakdownPoint: 'Jika penyadap mengintip jalur pengiriman kata sandi pertama kali, seluruh pesan berikutnya langsung terbaca.',
          quickPrediction: {
            prompt: 'Jika kamu dan rekanmu belum pernah bertemu dan hanya bisa lewat kurir yang bisa mengintip, bisakah kalian memakai 1 kata sandi yang sama?',
            options: [
              { id: 'qp1', text: 'Bisa, cukup kirim kata sandinya dulu lalu kirim pesannya.' },
              { id: 'qp2', text: 'Tidak aman, karena penyadap bisa menyalin kata sandi di kiriman pertama.' },
            ],
            revealsMisconception: 'Itulah dilema distribusi kunci: kunci tunggal tidak bisa dikirim aman di jalur yang belum aman.',
          },
          slideIndex: 0,
        },
        block2_grounding: {
          anchoringLab: {
            labId: 'asymmetric-lockbox-lab',
            title: 'Coba Sendiri: Kotak Transparan & Gembok Klik',
            instructionPrompt: 'Tekan tombol sebagai Pengirim untuk mengunci, lalu uji apakah Penyadap bisa membukanya.',
            ahaObservation: 'Pengirim dan penyadap sama-sama bisa mengunci, tetapi hanya pemegang anak kunci tunggal yang mampu membuka kotak.',
            timeToAhaSeconds: 20,
            tier: 'native_primitive',
            nativeKind: 'state_machine_sandbox',
            nativeConfig: {
              kind: 'state_machine_sandbox',
              initialStateId: 'open',
              states: [
                { id: 'open', label: 'Kotak Masih Terbuka', description: 'Pesan diletakkan di dalam kotak. Gembok klik masih terbuka.', tone: 'open' },
                { id: 'locked', label: 'Terkunci Rapat', description: 'Gembok sudah ditekan. Menekan ulang tidak akan membukanya.', tone: 'locked' },
                { id: 'unlocked', label: 'Terbuka Aman oleh Penerima', description: 'Anak kunci pribadi membuka gembok dengan mulus.', tone: 'open' },
              ],
              actions: [
                { id: 'lock', label: 'Tekan Gembok Klik', actor: 'Pengirim', fromStates: ['open'], toState: 'locked', resultMessage: 'Klik! Kotak langsung terkunci tanpa butuh anak kunci.' },
                { id: 'sniff', label: 'Coba Buka Tanpa Anak Kunci', actor: 'Penyadap', fromStates: ['locked'], toState: 'locked', resultMessage: 'Tertolak. Meski penyadap punya salinan gemboknya, ia tetap tidak bisa membuka.', triggersAha: true },
                { id: 'open_key', label: 'Buka dengan Anak Kunci Pribadi', actor: 'Penerima', fromStates: ['locked'], toState: 'unlocked', resultMessage: 'Berhasil! Anak kunci tidak pernah dikirim lewat kurir.' },
              ],
              requiredActionIdsForAha: ['lock', 'sniff'],
            },
          },
          bridgingChain: [
            {
              stepTitle: 'Menghubungkan Gembok ke Kunci Digital',
              bridgeScenario: 'Penerima mencetak ribuan salinan gembok terbuka (Public Key) dan menyimpannya di internet, sementara satu anak kunci (Private Key) tidak pernah keluar dari perangkatnya.',
              invariantPreserved: 'Aksi mengunci dan aksi membuka dipisahkan menjadi dua jalur satu arah.',
              structuralMapping: [
                { anchorElement: 'Gembok klik terbuka', targetConcept: 'Public Key (K_pub)', whyItMatches: 'Boleh disalin siapa saja agar orang lain bisa mengunci pesan untukmu.' },
                { anchorElement: 'Anak kunci tunggal di saku', targetConcept: 'Private Key (K_priv)', whyItMatches: 'Satu-satunya alat untuk membuka kembali pesan yang terkunci.' },
              ],
            },
          ],
          analogyBreakpoint: {
            whereItBreaks: 'Gembok fisik tidak bisa membuktikan siapa yang menulis pesan dan bisa dirusak secara mekanis.',
            realMechanismInstead: 'Kriptografi asimetris digital menggunakan fungsi matematika satu arah (seperti kurva eliptik) yang jauh lebih cepat dikunci daripada dibalik, sekaligus mendukung tanda tangan digital.',
          },
          slideIndex: 1,
        },
        block3_coreMechanics: {
          invariantProperty: 'Informasi yang dipakai untuk mengenkripsi (Public Key) tidak cukup untuk membalikkan proses dekripsi.',
          variableComponents: ['Pesan Asli (Plaintext)', 'Public Key', 'Private Key', 'Ciphertext'],
          contrastingCases: [
            { beginnerMisconception: 'Kalau Public Key bocor ke publik, semua pesan ikut bocor.', physicalReality: 'Public Key memang dirancang untuk dibagikan terbuka; hanya Private Key yang wajib dijaga rahasia.' },
          ],
          slideIndex: 3,
        },
        block4_notationContract: {
          formulaOrCode: 'C = Enc(M, K_pub)   |   M = Dec(C, K_priv)',
          minimalFormalization: 'Dua fungsi berbeda dengan dua kunci berbeda menjamin jalur satu arah.',
          termsDeconstruction: [
            { symbol: 'M', physicalMeaning: 'Pesan asli sebelum dimasukkan ke kotak' },
            { symbol: 'K_pub', physicalMeaning: 'Gembok klik yang dibagikan terbuka ke semua orang' },
            { symbol: 'K_priv', physicalMeaning: 'Anak kunci pribadi yang hanya dimiliki penerima' },
          ],
          workedExampleSummary: 'Saat browser membuka situs HTTPS, server mengirim K_pub agar browser bisa mengamankan kunci sesi tanpa pernah mengirim K_priv lewat internet.',
          slideIndex: 4,
        },
        block5_stressTest: {
          probeType: 'prediction_what_if',
          prompt: 'Penyadap menyalin Public Key milik Budi dan mencegat pesan terenkripsi C yang dikirim ke Budi. Apa yang terjadi?',
          options: [
            { optionId: 'a', text: 'Penyadap tetap tidak dapat membaca pesan asli karena Public Key hanya bisa mengunci.', isCorrect: true, causalRationale: 'Tepat: sesuai aturan satu arah, proses Dec(C, K_priv) tetap membutuhkan Private Key milik Budi.' },
            { optionId: 'b', text: 'Penyadap langsung membuka pesan C menggunakan Public Key yang sama.', isCorrect: false, diagnosticAxis: 'conceptGap', causalRationale: 'Ini masih memakai pola kunci simetris di mana kunci pengunci sama dengan pembuka.' },
            { optionId: 'c', text: 'Pesan C otomatis berubah rusak saat Public Key disalin orang lain.', isCorrect: false, diagnosticAxis: 'reasoningBug', causalRationale: 'Menyalin Public Key tidak memengaruhi keutuhan ciphertext yang sudah terbentuk.' },
          ],
          hintLadder: {
            level0Reflective: 'Ingat hasil percobaan Penyadap pada kotak transparan di langkah sebelumnya.',
            level1Directional: 'Bedakan mana alat yang mengunci dan mana alat yang membuka.',
            level2Constraint: 'Lihat kembali rumus Dec(C, K_priv): kunci mana yang dibutuhkan untuk membuka?',
            level3WorkedExample: 'Karena penyadap hanya punya K_pub (gembok) dan tidak punya K_priv (anak kunci), ia tidak bisa menjalankan Dec.',
          },
          groundTruth: 'Penyadap tidak dapat membaca pesan asli tanpa Private Key.',
          slideIndex: 5,
        },
      },
      slideNotes: [
        { id: 's1-anomali', index: 0, title: 'Satu Kunci Saja Tidak Cukup', purpose: 'Menunjukkan mengapa kunci tunggal gagal di jalur terbuka.', talk: ['Jangan langsung menyebut RSA atau matematika.', 'Fokus pada dilema mengirim kunci lewat kurir yang bisa mengintip.'] },
        { id: 's2-anchor', index: 1, title: 'Kotak Transparan & Gembok Klik', purpose: 'Membangun jangkar pengalaman langsung sebelum istilah teknis.', talk: ['Biarkan peserta mencoba klik gembok dan melihat kegagalan penyadap.'] },
        { id: 's3-bridge', index: 2, title: 'Pemetaan ke Kunci Publik & Privat', purpose: 'Menarik garis analogi sekaligus menyebut batas analoginya.', talk: ['Tegaskan batas analogi agar tidak dikira ada gembok fisik di komputer.'] },
        { id: 's4-contract', index: 3, title: 'Notasi Sebagai Kontrak', purpose: 'Memperkenalkan simbol hanya setelah mekanismenya terasa masuk akal.', talk: ['Tunjukkan bahwa rumus hanyalah singkatan dari percobaan kotak tadi.'] },
      ],
      glossary: [
        { term: 'Plaintext (M)', definition: 'Pesan asli yang masih dapat dibaca manusia.', highSchoolAnchor: 'Tulisan biasa di atas kertas sebelum dilipat.', tier: 3 },
        { term: 'Ciphertext (C)', definition: 'Pesan yang sudah diacak sehingga tidak terbaca tanpa kunci pembuka.', highSchoolAnchor: 'Surat yang sudah terkunci di dalam kotak besi.', tier: 3 },
        { term: 'Fungsi Satu Arah', definition: 'Operasi yang sangat mudah dilakukan maju tetapi sangat sulit dibalik tanpa informasi rahasia.', highSchoolAnchor: 'Mencampur dua cat jauh lebih mudah daripada memisahkannya lagi.', tier: 2 },
      ],
    },
  },
  {
    slug: 'interferensi-gelombang-riak-air',
    title: 'Interferensi Gelombang: Dari Riak Air Gelas ke Superposisi',
    summary: 'Rasakan sendiri bagaimana dua sumber gelombang bisa saling menguatkan atau justru saling meniadakan.',
    readingTimeMinutes: 5,
    slides: [
      { id: 'w1-anomali', kicker: 'Langkah 1 · Masalah Nyata', title: 'Dua Sumber Tidak Selalu Lebih Terang', lead: 'Pada bola biliar, energi selalu bertambah. Pada gelombang, dua sumber bisa menghasilkan titik tenang/gelap.', bullets: ['Intuisi partikel gagal menjelaskan pita gelap', 'Kuncinya ada pada puncak dan lembah yang bertanda'], theme: 'dark' },
      { id: 'w2-anchor', kicker: 'Langkah 2 · Fase Anchoring', title: 'Ketuk Dua Titik di Permukaan Air', lead: 'Amati titik pertemuan dua lingkaran riak: ada garis yang meninggi, ada titik yang justru datar.', bullets: ['Puncak + Puncak = makin tinggi (konstruktif)', 'Puncak + Lembah = saling meniadakan (destruktif)'], theme: 'accent' },
      { id: 'w3-bridge', kicker: 'Langkah 3 · Fase Bridging', title: 'Dari Air ke Gelombang Cahaya & Kuantum', lead: 'Pola yang sama mengatur bunyi, cahaya, dan amplitudo gelombang subatomik.', bullets: ['Superposisi menjumlahkan tanda (+ / -), bukan nilai mutlak', 'Batas analogi: cahaya & gelombang kuantum tidak butuh medium air'], theme: 'light' },
    ],
    payload: {
      schemaVersion: 'uila-v2',
      estimatedMinutes: 5,
      learningObjective: 'Memprediksi hasil pertemuan dua gelombang (konstruktif vs destruktif) berdasarkan penjumlahan amplitudo bertanda.',
      uila: {
        groundingDecision: {
          mode: 'experiential_anchor_bridge',
          priorKnowledgeAssumed: 'none',
          setupCostSeconds: 15,
          rationale: 'Mengetuk dua titik permukaan air secara interaktif memberi pola visual instan tanpa perlu laboratorium fisika.',
        },
        block1_anomaly: {
          groundState: 'Dalam keseharian, menyalakan dua lampu bersamaan selalu kita anggap membuat ruangan makin terang.',
          oldWay: 'Menjumlahkan intensitas dua sumber secara langsung seperti menumpuk dua ember air.',
          breakdownPoint: 'Pada eksperimen celah ganda, menyalakan sumber kedua justru bisa memunculkan garis gelap di titik yang tadinya terang.',
          slideIndex: 0,
        },
        block2_grounding: {
          anchoringLab: {
            labId: 'water-ripple-lab',
            title: 'Coba Ketuk 2 Titik di Permukaan Air',
            instructionPrompt: 'Ketuk dua lokasi berbeda pada bidang air di bawah untuk melihat pertemuan pola riak.',
            ahaObservation: 'Saat garis utuh (puncak) bertemu garis putus (lembah), keduanya saling meniadakan.',
            timeToAhaSeconds: 15,
            tier: 'native_primitive',
            nativeKind: 'wave_field_tapper',
            nativeConfig: {
              kind: 'wave_field_tapper',
              surfaceLabel: 'Permukaan Air Gelas',
              minTapsForAha: 2,
              constructiveLabel: 'Puncak bertemu puncak (menguatkan)',
              destructiveLabel: 'Puncak bertemu lembah (meniadakan)',
            },
          },
          bridgingChain: [
            {
              stepTitle: 'Dari Riak Gelas ke Superposisi Gelombang',
              bridgeScenario: 'Ketinggian permukaan air (+ di atas datar, - di bawah datar) berpadanan langsung dengan nilai amplitudo fase gelombang.',
              invariantPreserved: 'Penjumlahan aljabar bertanda di setiap titik pertemuan.',
              structuralMapping: [
                { anchorElement: 'Puncak + Puncak air', targetConcept: 'Interferensi Konstruktif', whyItMatches: 'Fase seirama menghasilkan amplitudo gabungan lebih besar.' },
                { anchorElement: 'Puncak + Lembah jadi datar', targetConcept: 'Interferensi Destruktif', whyItMatches: 'Fase berlawanan saling menghapus di titik pertemuan.' },
              ],
            },
          ],
          analogyBreakpoint: {
            whereItBreaks: 'Riak air adalah gerakan molekul cairan fisik yang butuh medium air.',
            realMechanismInstead: 'Cahaya merambat sebagai medan elektromagnetik di ruang hampa, dan gelombang kuantum menggambarkan amplitudo probabilitas, bukan cairan.',
          },
          slideIndex: 1,
        },
        block3_coreMechanics: {
          invariantProperty: 'Superposisi menjumlahkan amplitudo bertanda (fase), sehingga dua gelombang bisa bernilai nol di titik tertentu.',
          variableComponents: ['Amplitudo', 'Beda Fase', 'Titik Pertemuan'],
          contrastingCases: [
            { beginnerMisconception: 'Dua sumber energi selalu menambah kekuatan di semua titik.', physicalReality: 'Jika beda fasenya berlawanan 180 derajat, keduanya saling meniadakan sementara di titik tersebut.' },
          ],
          slideIndex: 2,
        },
        block4_notationContract: {
          formulaOrCode: 'A_total = A_1 + A_2',
          minimalFormalization: 'Nilai A bisa positif (puncak) atau negatif (lembah).',
          termsDeconstruction: [
            { symbol: 'A_1, A_2', physicalMeaning: 'Tinggi bertanda (+ / -) dari gelombang 1 dan gelombang 2 di titik yang sama' },
            { symbol: 'A_total', physicalMeaning: 'Hasil gabungan sesaat di titik pertemuan' },
          ],
          workedExampleSummary: 'Headphone peredam bising (ANC) mengukur gelombang suara bising (+3) lalu memancarkan gelombang lawan (-3) agar telinga menerima (+3) + (-3) = 0.',
          slideIndex: 2,
        },
        block5_stressTest: {
          probeType: 'prediction_what_if',
          prompt: 'Headphone peredam bising mendeteksi puncak suara mesin bernilai +4. Gelombang lawan seperti apa yang harus dipancarkan agar terdengar sunyi (0)?',
          options: [
            { optionId: 'a', text: 'Gelombang dengan amplitudo berlawanan (-4) di titik dan waktu yang sama.', isCorrect: true, causalRationale: 'Sesuai superposisi bertanda: (+4) + (-4) = 0 (interferensi destruktif).' },
            { optionId: 'b', text: 'Gelombang positif (+4) yang sama persis agar suara mesin terdorong keluar.', isCorrect: false, diagnosticAxis: 'conceptGap', causalRationale: 'Puncak bertemu puncak (+4 + 4 = +8) justru membuat suara bising makin keras dua kali lipat.' },
            { optionId: 'c', text: 'Gelombang bernilai 0 (diam total) agar tidak menambah suara.', isCorrect: false, diagnosticAxis: 'reasoningBug', causalRationale: '(+4) + 0 tetap menghasilkan +4, sehingga kebisingan tidak hilang.' },
          ],
          hintLadder: {
            level0Reflective: 'Ingat apa yang membuat permukaan air menjadi datar saat dua riak bertemu.',
            level1Directional: 'Supaya hasil penjumlahan menjadi 0, tanda gelombangnya harus berlawanan.',
            level2Constraint: 'Selesaikan (+4) + X = 0.',
            level3WorkedExample: 'X = -4, artinya headphone memancarkan lembah dengan besar sama persis untuk meniadakan puncak bising.',
          },
          groundTruth: 'Amplitudo berlawanan (-4) menghasilkan interferensi destruktif bernilai 0.',
        },
      },
      glossary: [
        { term: 'Fase', definition: 'Posisi siklus gelombang saat ini (apakah sedang di puncak atau di lembah).', highSchoolAnchor: 'Posisi ayunan: sedang di titik tertinggi depan atau titik tertinggi belakang.' },
      ],
    },
  },
  {
    slug: 'konsensus-terdistribusi-thought-experiment',
    title: 'Konsensus Terdistribusi: Batas Skala & Eksperimen Pikiran',
    summary: 'Pelajari mengapa sistem terdistribusi memakai eksperimen pikiran (Jenderal Bizantium) saat simulasi fisik mencapai batas skala.',
    readingTimeMinutes: 5,
    slides: [],
    payload: {
      schemaVersion: 'uila-v2',
      estimatedMinutes: 5,
      learningObjective: 'Menentukan jumlah minimum node agar sistem terdistribusi tetap mencapai kesepakatan meski ada f node berkhianat.',
      uila: {
        groundingDecision: {
          mode: 'thought_experiment',
          priorKnowledgeAssumed: 'partial',
          setupCostSeconds: 30,
          rationale: 'Jutaan node terdistribusi dengan kegagalan jaringan melampaui simulasi fisik meja; eksperimen pikiran Jenderal Bizantium lebih efektif.',
        },
        block1_anomaly: {
          groundState: 'Banyak server di seluruh dunia harus menyepakati satu catatan transaksi yang sama tanpa satu bos pusat.',
          oldWay: 'Cukup voting mayoritas sederhana (> 50% setuju).',
          breakdownPoint: 'Jika ada server rusak atau berkhianat yang mengirim pesan berbeda ke tiap server lain, voting mayoritas 3 node (1 pengkhianat) langsung pecah buntu.',
        },
        block2_grounding: {
          thoughtExperimentSteps: [
            'Bayangkan 3 jenderal mengepung satu kota: Jenderal A (komandan), B, dan C. Mereka hanya bisa berkomunikasi lewat kurir.',
            'Jika ada 1 pengkhianat (misal C berbohong ke B bahwa A menyuruh mundur, padahal A menyuruh serang), maka B menerima 1 pesan Serang dan 1 pesan Mundur.',
            'B tidak punya cara membedakan apakah A atau C yang berkhianat! Kesepakatan gagal total saat jumlah node hanya 3 untuk 1 pengkhianat.',
            'Sekarang naikkan menjadi 4 jenderal (N = 4, f = 1): minimal 3 jenderal jujur selalu menang suara mayoritas atas kebohongan 1 pengkhianat.',
          ],
          analogyBreakpoint: {
            whereItBreaks: 'Jenderal di dunia nyata bisa saling curiga secara psikologis atau negosiasi politik.',
            realMechanismInstead: 'Protokol BFT di server memakai tanda tangan kriptografis dan putaran pesan deterministik (pre-prepare, prepare, commit) dengan batas matematis ketat N >= 3f + 1.',
          },
        },
        block3_coreMechanics: {
          invariantProperty: 'Untuk bertahan dari f node berkhianat tanpa jaringan sinkron sempurna, sistem wajib memiliki minimal N >= 3f + 1 node.',
          variableComponents: ['Total Node (N)', 'Node Berkhianat/Rusak Maksimal (f)', 'Kuorum Aman (2f + 1)'],
          contrastingCases: [
            { beginnerMisconception: 'Asal lebih dari separuh server jujur (N = 2f + 1), sistem pasti aman dari kebohongan.', physicalReality: '2f + 1 hanya cukup untuk server mati (crash). Untuk server yang berbohong aktif (Byzantine), syarat minimumnya adalah 3f + 1.' },
          ],
        },
        block4_notationContract: {
          formulaOrCode: 'N_min = 3f + 1',
          minimalFormalization: 'Jika ada f pengkhianat dan f node lain sedang lambat/terputus, masih tersisa f + 1 node jujur yang aktif untuk mengalahkan f pengkhianat.',
          termsDeconstruction: [
            { symbol: 'N_min', physicalMeaning: 'Jumlah minimum total server dalam klaster konsensus' },
            { symbol: 'f', physicalMeaning: 'Jumlah maksimal server yang boleh berkhianat atau rusak serentak' },
          ],
          workedExampleSummary: 'Ingin klaster tetap aman meski 2 node berkhianat (f = 2)? Maka N_min = 3(2) + 1 = 7 node.',
        },
        block5_stressTest: {
          probeType: 'boundary_limit',
          prompt: 'Tim infrastruktur ingin jaringan tetap aman jika maksimal 2 node berkhianat bersamaan (f = 2). Berapa jumlah minimum total node yang wajib disiapkan?',
          options: [
            { optionId: 'a', text: '7 node (mengikuti batas N >= 3f + 1).', isCorrect: true, causalRationale: 'Tepat: 3(2) + 1 = 7 node menjamin kuorum node jujur tetap unggul atas 2 pengkhianat.' },
            { optionId: 'b', text: '5 node (cukup mayoritas 2f + 1).', isCorrect: false, diagnosticAxis: 'conceptGap', causalRationale: '5 node hanya cukup untuk crash fault, tetapi belum aman terhadap 2 node Byzantine yang mengirim pesan bertentangan.' },
            { optionId: 'c', text: '6 node (kelipatan 3f tanpa tambahan +1).', isCorrect: false, diagnosticAxis: 'notationBreakdown', causalRationale: 'Tanpa +1 pemecah seri, 6 node masih bisa terbelah seimbang saat 2 node berbohong.' },
          ],
          hintLadder: {
            level0Reflective: 'Ingat batas pada eksperimen 3 jenderal vs 4 jenderal untuk f = 1.',
            level1Directional: 'Bedakan syarat server mati biasa (2f + 1) dengan syarat pengkhianat aktif (3f + 1).',
            level2Constraint: 'Substitusikan f = 2 ke dalam N_min = 3f + 1.',
            level3WorkedExample: 'N_min = 3 x 2 + 1 = 7 node.',
          },
          groundTruth: '7 node (3 x 2 + 1).',
        },
      },
      glossary: [
        { term: 'Byzantine Fault', definition: 'Kegagalan di mana suatu node tidak sekadar mati, tetapi mengirim informasi palsu atau saling bertentangan ke node lain.', highSchoolAnchor: 'Rekan satu tim yang sengaja memberi tahu jadwal berbeda ke dua kelompok lain.' },
      ],
    },
  },
];
