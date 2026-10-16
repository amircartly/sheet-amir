/**
 * =========================================================================
 * منظومة بطاقات مصرفية (AMIR أمير) - محرك Google Apps Script الكامل
 * =========================================================================
 * وظائف الكود:
 * 1. إضافة قائمة مخصصة في Google Sheets لفتح واجهة الإدخال وتهيئة الشيت.
 * 2. البحث الذكي المرن (تجاهل الهمزات، الفراغات، الحروف المشابهة).
 * 3. حفظ المعاملات وتحديثها تلقائياً مع توليد كود فريد (CRD-xxx).
 * 4. إنشاء تقارير وكشوفات المراحل قابلة للطباعة والتصدير كـ PDF.
 * 5. حماية من تكرار الإيداع وتتبع الحسابات والآيبان للمصارف الـ 9.
 */

// 1. إنشاء القائمة في شريط الأدوات عند فتح الشيت
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('💎 منظومة بطاقات AMIR')
    .addItem('✨ فتح واجهة الإدخال والبحث والتقارير', 'openFormDialog')
    .addSeparator()
    .addItem('🛠️ تهيئة وترتيب أعمدة الشيت تلقائياً', 'setupSheetColumns')
    .addToUi();
}

// 2. فتح نافذة الإدخال المنبثقة
function openFormDialog() {
  var html = HtmlService.createHtmlOutputFromFile('Index')
    .setWidth(1050)
    .setHeight(720)
    .setTitle('منظومة بطاقات AMIR - إدارة البيانات والتقارير');
  SpreadsheetApp.getUi().showModalDialog(html, 'واجهة إدارة البطاقات المصرفية والتقارير');
}

// 3. تهيئة أعمدة الشيت تلقائياً بالتنسيق المعتمد الـ 16
function setupSheetColumns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('بيانات_ماستر') || ss.insertSheet('بيانات_ماستر', 0);
  
  var headers = [
    'كود البطاقة',
    'اسم الزبون الرباعي',
    'الرقم الوطني',
    'هاتف المركزي (المربوط)',
    'المصرف',
    'رقم حساب الزبون',
    'رقم الآيبان للزبون (IBAN)',
    'قيمة الإيداع (د.ل)',
    'تاريخ الإيداع',
    'تاريخ الحجز بالمنظومة',
    'رقم البطاقة',
    'PIN المحلي',
    'السري دولار (الدولي)',
    'تاريخ الصلاحية',
    'المرحلة الحالية للبطاقة',
    'ملاحظات وبيان المعاملة'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#0f172a');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);
  
  // تنسيق عرض الأعمدة التلقائي
  for (var col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
  }

  SpreadsheetApp.getUi().alert('تم تهيئة أعمدة الشيت الـ 16 بنجاح مع تثبيت الصف الأول والاتجاه من اليمين لليسار.');
}

// 4. دالة تنظيف وتوحيد النصوص العربية للبحث المرن
function cleanText(txt) {
  if (!txt) return '';
  return txt.toString().trim().toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[\s\-_/\\,.]/g, '');
}

// 5. تنسيق التاريخ بصيغة yyyy-MM-dd
function formatDateValue(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return val.toString();
}

// 6. البحث الذكي الموحد (بالاسم، الرقم الوطني، رقم الهاتف، أو كود البطاقة)
function searchCardData(query) {
  if (!query || query.toString().trim() === '') return { found: false };
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('بيانات_ماستر') || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var qClean = cleanText(query);

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowCode = cleanText(row[0]);
    var rowName = cleanText(row[1]);
    var rowNatId = cleanText(row[2]);
    var rowPhone = cleanText(row[3]);
    var rowCardNum = cleanText(row[10]);

    if (rowCode.indexOf(qClean) !== -1 ||
        rowName.indexOf(qClean) !== -1 ||
        rowNatId.indexOf(qClean) !== -1 ||
        rowPhone.indexOf(qClean) !== -1 ||
        (rowCardNum && rowCardNum.indexOf(qClean) !== -1)) {
      return {
        found: true,
        rowIndex: i + 1,
        code: row[0] ? row[0].toString() : '',
        name: row[1] ? row[1].toString() : '',
        nationalId: row[2] ? row[2].toString() : '',
        cblPhone: row[3] ? row[3].toString() : '',
        bank: row[4] ? row[4].toString() : '',
        accountNumber: row[5] ? row[5].toString() : '',
        iban: row[6] ? row[6].toString() : '',
        depositAmt: row[7] ? row[7].toString() : '19800',
        depositDate: formatDateValue(row[8]),
        bookingDate: formatDateValue(row[9]),
        cardNum: row[10] ? row[10].toString() : '',
        pinLocal: row[11] ? row[11].toString() : '',
        pinDollar: row[12] ? row[12].toString() : '',
        expiry: row[13] ? row[13].toString() : '09/29',
        status: row[14] ? row[14].toString() : '1. إدخال البيانات',
        notes: row[15] ? row[15].toString() : ''
      };
    }
  }

  return { found: false };
}

// 7. حفظ أو تعديل المعاملة
function saveCardData(card) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('بيانات_ماستر') || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  var targetRow = -1;
  var code = card.code ? card.code.toString().trim() : '';

  // التحقق إذا كان تعديلاً على بطاقة موجودة
  if (code !== '') {
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === code) {
        targetRow = i + 1;
        break;
      }
    }
  }

  // إضافة بطاقة جديدة إذا لم تكن موجودة
  if (targetRow === -1) {
    var lastRow = sheet.getLastRow();
    targetRow = lastRow + 1;
    code = 'CRD-' + (100 + lastRow);
  }

  var row = [
    code,
    card.name ? card.name.toString().trim() : '',
    card.nationalId ? card.nationalId.toString().trim() : '',
    card.cblPhone ? card.cblPhone.toString().trim() : '',
    card.bank || 'مصرف التجارة والتنمية',
    card.accountNumber ? card.accountNumber.toString().trim() : '',
    card.iban ? card.iban.toString().trim() : '',
    parseFloat(card.depositAmt) || 0,
    card.depositDate || '',
    card.bookingDate || '',
    card.cardNum ? card.cardNum.toString().trim() : '',
    card.pinLocal ? card.pinLocal.toString().trim() : '',
    card.pinDollar ? card.pinDollar.toString().trim() : '',
    card.expiry ? card.expiry.toString().trim() : '09/29',
    card.status || '1. إدخال البيانات',
    card.notes ? card.notes.toString().trim() : ''
  ];

  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  
  return {
    success: true,
    code: code,
    row: targetRow
  };
}

// 8. جلب كشف تقرير المرحلة للطباعة والتصدير
function getStageReport(stage) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('بيانات_ماستر') || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var list = [];
  var totalDeposit = 0;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowStatus = row[14] ? row[14].toString().trim() : '';

    if (stage === 'الكل' || rowStatus === stage || (stage === '1. إدخال البيانات' && rowStatus === 'إدخال البيانات')) {
      var dep = parseFloat(row[7]) || 0;
      totalDeposit += dep;
      list.push({
        code: row[0] ? row[0].toString() : '',
        name: row[1] ? row[1].toString() : '',
        nationalId: row[2] ? row[2].toString() : '',
        cblPhone: row[3] ? row[3].toString() : '',
        bank: row[4] ? row[4].toString() : '',
        accountNumber: row[5] ? row[5].toString() : '-',
        iban: row[6] ? row[6].toString() : '-',
        depositAmt: dep,
        bookingDate: formatDateValue(row[9]),
        status: rowStatus
      });
    }
  }

  return {
    stage: stage,
    cards: list,
    totalCards: list.length,
    totalDeposit: totalDeposit,
    date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
  };
}
