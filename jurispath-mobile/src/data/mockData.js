/**
 * JurisPath Mock Data
 * Realistic Turkish legal data for citizens experiencing legal issues.
 */

export const recentActivity = [
  { id: '1', type: 'research', title: 'Borçlar Kanunu Md. 344 — Kira Artış Sınırı', time: '2 saat önce', icon: 'search' },
  { id: '2', type: 'ai', title: 'İşten çıkarma ihbar süresi hesaplama', time: '4 saat önce', icon: 'cpu' },
  { id: '3', type: 'document', title: 'Kira Sözleşmesi — Evim.pdf', time: 'Dün', icon: 'file-text' },
  { id: '4', type: 'note', title: 'Tüketici Hakem Heyeti başvuru notları', time: 'Dün', icon: 'edit-3' },
  { id: '5', type: 'decision', title: 'Yargıtay Emsal Kararı — Ayıplı Mal İadesi', time: '2 gün önce', icon: 'book-open' },
];

export const pinnedCases = [
  { id: '1', title: 'Ev Sahibi Kira Artış Uyuşmazlığı', category: 'Kira Hukuku', status: 'active', date: '2026-07-01', tasksCount: 4, docsCount: 3, progress: '3/6 Adım' },
  { id: '2', type: 'job', title: 'İşten Çıkarılma & Tazminat Süreci', category: 'İş Hukuku', status: 'active', date: '2026-06-25', tasksCount: 3, docsCount: 5, progress: '1/5 Adım' },
  { id: '3', title: 'Kusurlu Elektronik Ürün İadesi', category: 'Tüketici Hukuku', status: 'pending', date: '2026-06-20', tasksCount: 2, docsCount: 2, progress: '2/4 Adım' },
];

export const upcomingDeadlines = [
  { id: '1', title: 'Tüketici Hakem Heyetine Başvuru', date: '10 Tem 2026', caseTitle: 'Kusurlu Elektronik Ürün İadesi', priority: 'high' },
  { id: '2', title: 'Arabuluculuk Görüşmesine Katılım', date: '14 Tem 2026', caseTitle: 'İşten Çıkarılma & Tazminat Süreci', priority: 'medium' },
  { id: '3', title: 'Ev Sahibine Cevap Süresi', date: '20 Tem 2026', caseTitle: 'Ev Sahibi Kira Artış Uyuşmazlığı', priority: 'low' },
];

export const laws = [
  { id: '1', number: '6098', title: 'Türk Borçlar Kanunu', category: 'Kira & Sözleşmeler', articleCount: 649, date: '2011' },
  { id: '2', number: '6502', title: 'Tüketicinin Korunması Hakkında Kanun', category: 'Alışveriş & İadeler', articleCount: 87, date: '2013' },
  { id: '3', number: '4857', title: 'İş Kanunu', category: 'İşçi Hakları & Tazminat', articleCount: 122, date: '2003' },
  { id: '4', number: '4721', title: 'Türk Medeni Kanunu', category: 'Aile & Miras', articleCount: 1030, date: '2001' },
  { id: '5', number: '5237', title: 'Türk Ceza Kanunu', category: 'Suç & Hakaret', articleCount: 345, date: '2004' },
];

export const courtDecisions = [
  {
    id: '1',
    court: 'Yargıtay 3. Hukuk Dairesi',
    caseNo: '2024/892 E.',
    decisionNo: '2024/2341 K.',
    date: '22.02.2024',
    subject: 'Kira bedelinin yasal sınırın (TÜFE) üzerinde artırılamayacağı',
    summary: 'Konut kiralarında kira artış oranının yasal sınırları (TÜFE) aşamayacağına, fazla ödenen tutarların geri talep edilebileceğine karar verilmiştir.',
    category: 'Kira Hukuku',
    relatedLaws: ['6098 / Md. 344'],
  },
  {
    id: '2',
    court: 'Yargıtay 13. Hukuk Dairesi',
    caseNo: '2023/5678 E.',
    decisionNo: '2024/1122 K.',
    date: '10.01.2024',
    subject: 'İnternet alışverişlerinde 14 günlük koşulsuz cayma hakkı',
    summary: 'Alıcının internetten satın aldığı ürünü hiçbir gerekçe göstermeksizin ve kargo ücreti ödemeksizin 14 gün içinde iade etme hakkına sahip olduğu onaylanmıştır.',
    category: 'Tüketici Hukuku',
    relatedLaws: ['6502 / Md. 48'],
  },
  {
    id: '3',
    court: 'Yargıtay 9. Hukuk Dairesi',
    caseNo: '2024/1247 E.',
    decisionNo: '2024/3891 K.',
    date: '15.03.2024',
    subject: 'Bildirim süresi verilmeden yapılan fesihte ihbar tazminatı',
    summary: 'İşverenin iş akdini aniden sonlandırması durumunda, çalışanın kıdemine göre belirlenen ihbar tazminatını peşin olarak ödemesi gerektiğine hükmedilmiştir.',
    category: 'İş Hukuku',
    relatedLaws: ['4857 / Md. 17'],
  },
];

export const collections = [
  { id: '1', title: 'Kira Rehberlerim', itemCount: 4, icon: 'home', color: '#1e3a5f' },
  { id: '2', title: 'İşçi Hakları Rehberleri', itemCount: 6, icon: 'briefcase', color: '#0f8170' },
  { id: '3', title: 'Tüketici Başvurularım', itemCount: 3, icon: 'shopping-bag', color: '#d97706' },
];

export const notes = [
  { id: '1', title: 'Ev sahibi ihtar süreci', preview: 'Ev sahibinin kira dönemi bitmeden 15 gün önce yazılı bildirim yapması gerekir...', date: '5 Tem 2026', linkedTo: 'Borçlar Kanunu' },
  { id: '2', title: 'Cayma hakkı nasıl kullanılır?', preview: 'E-posta veya e-devlet üzerinden satıcıya cayma bildirimini iletmek şarttır...', date: '3 Tem 2026', linkedTo: 'Tüketici Kanunu' },
];

export const documents = [
  { id: '1', title: 'Kira Sözleşmesi — Evim.pdf', type: 'PDF', size: '2.4 MB', date: '5 Tem 2026', status: 'analyzed', riskScore: 3 },
  { id: '2', title: 'İşe Giriş Bildirgesi.docx', type: 'DOCX', size: '890 KB', date: '3 Tem 2026', status: 'pending', riskScore: null },
  { id: '3', title: 'Fatura ve İade Makbuzu.pdf', type: 'PDF', size: '156 KB', date: '1 Tem 2026', status: 'analyzed', riskScore: 1 },
];

export const aiConversations = [
  { id: '1', title: 'Ev sahibi kirayı %60 artırmak istiyor', preview: 'Yasal sınır olan TÜFE 12 aylık ortalaması...', date: '5 Tem 2026', messageCount: 8 },
  { id: '2', title: 'İnternetten alınan bilgisayarın iadesi', preview: 'Kusurlu ürünün 14 günlük iade süreci...', date: '3 Tem 2026', messageCount: 5 },
  { id: '3', title: 'Haber vermeden işten çıkarıldım', preview: 'İhbar ve kıdem tazminatı hesaplama adımları...', date: '28 Haz 2026', messageCount: 12 },
];

export const searchSuggestions = [
  'Ev sahibi evden çıkarmak istiyor ne yapmalıyım?',
  'Kira artış oranı yasal sınırı nedir?',
  'İşten çıkarıldım haklarım nelerdir?',
  'İnternetten aldığım ürün bozuk çıktı nasıl iade ederim?',
  'Tüketici Hakem Heyetine nasıl başvurulur?',
];
