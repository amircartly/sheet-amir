/**
 * =========================================================================
 * منظومة بطاقات مصرفية (AMIR أمير) - محرك Google Apps Script الكامل
 * =========================================================================
 * وظائف الكود:
 * 1. واجهة ويب كاملة تعمل على الكمبيوتر والهاتف وتطبيق ويب مستقل (Web App).
 * 2. تهيئة تلقائية لكافة شيتات المنظومة (البطاقات، المستخدمين، الخزائن، الحركات).
 * 3. إدارة المستخدمين والصلاحيات (استقبال، خزينة، مالي وخارج، مدير عام).
 * 4. إدارة التكاليف: قيمة الإيداع + سعر شراء البطاقة = إجمالي التكلفة الحقيقية.
 * 5. تسجيل قيود وحركات الخزينة وسجل التدقيق (Audit Log) تلقائياً لكل حركة.
 * 6. تقارير وكشوفات المراحل قابلة للطباعة والتصدير كـ PDF.
 */

// 1. إنشاء القائمة في شريط الأدوات عند فتح الشيت
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('💎 منظومة بطاقات AMIR')
    .addItem('✨ فتح واجهة الإدخال والبحث والتقارير', 'openFormDialog')
    .addSeparator()
    .addItem('🚀 تهيئة كافة أوراق المنظومة (البطاقات + المستخدمين + الخزائن)', 'setupAllSystemSheets')
    .addItem('🛠️ تهيئة ورقة البطاقات فقط (18 عمود)', 'setupSheetColumns')
    .addToUi();
}

// 2. فتح نافذة الإدخال المنبثقة داخل الشيت
function openFormDialog() {
  var html = HtmlService.createHtmlOutputFromFile('Index')
    .setWidth(1120)
    .setHeight(780)
    .setTitle('منظومة بطاقات AMIR - إدارة البيانات والتقارير');
  SpreadsheetApp.getUi().showModalDialog(html, 'واجهة إدارة البطاقات المصرفية والتقارير');
}

// 3. دعم تشغيل المنظومة كرابط ويب مباشر على الهواتف والأجهزة (Web App URL)
function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';

  // إذا كان الطلب API لجلب البيانات بصيغة JSON
  if (action === 'getCards') {
    return ContentService.createTextOutput(JSON.stringify(getAllCards()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === 'getUsers') {
    return ContentService.createTextOutput(JSON.stringify(getSystemUsers()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === 'getTreasury') {
    return ContentService.createTextOutput(JSON.stringify(getTreasuryBalances()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // الوضع الافتراضي: عرض صفحة الواجهة متوافقة تماماً مع شاشات الهواتف
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('منظومة بطاقات AMIR')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 4. تهيئة كافة أوراق المنظومة الأربعة (قاعدة البيانات الموحدة)
function setupAllSystemSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // أ. تهيئة ورقة بيانات_ماستر (18 عمود)
  setupSheetColumns();

  // ب. تهيئة ورقة المستخدمين
  setupUsersSheet(ss);

  // ج. تهيئة ورقة أرصدة_الخزائن
  setupTreasurySheet(ss);

  // د. تهيئة ورقة حركة_الخزائن (سجل العمليات Audit Log)
  setupMovementsSheet(ss);

  SpreadsheetApp.getUi().alert('✅ تم بنجاح تهيئة كافة أوراق المنظومة الأربعة وتجهيز المستخدمين والخزائن وسجل الحركات!');
}

// تهيئة ورقة البطاقات الأساسية (بيانات_ماستر)
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
    'سعر البطاقة (د.ل)',
    'إجمالي التكلفة (د.ل)',
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
  
  for (var col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
  }
}

// تهيئة ورقة المستخدمين والصلاحيات
function setupUsersSheet(ss) {
  var sheet = ss.getSheetByName('المستخدمين') || ss.insertSheet('المستخدمين');
  
  var headers = [
    'اسم الموظف',
    'رمز الدخول (PIN)',
    'الدور الوظيفي',
    'المراحل المسموحة',
    'الحالة'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#1e293b');
  headerRange.setFontColor('#38bdf8');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);

  // إضافة المستخدمين الافتراضيين إذا كانت الورقة جديدة
  if (sheet.getLastRow() <= 1) {
    var defaultUsers = [
      ['موظف الاستقبال', '1111', 'موظف استقبال', 'المرحلة 1 و 2 (إدخال وحجز فقط)', 'نشط'],
      ['مسؤول الإيداع والخزينة', '2222', 'مسؤول إيداع وخزينة', 'المرحلة 3 (تأكيد التوريد وخصم المصارف)', 'نشط'],
      ['المسؤول المالي ومكتب الخارج', '3333', 'مسؤول مالي ومكتب الخارج', 'المراحل 4 إلى 7 (شحن، سحب خارجي، تصفية وبيع دولار)', 'نشط'],
      ['المدير العام (أمير)', '9999', 'مدير عام', 'كافة المراحل 1-7 + الخزائن والأرباح والتقارير', 'نشط']
    ];
    sheet.getRange(2, 1, defaultUsers.length, headers.length).setValues(defaultUsers);
  }

  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

// تهيئة ورقة أرصدة الخزائن والمصارف
function setupTreasurySheet(ss) {
  var sheet = ss.getSheetByName('أرصدة_الخزائن') || ss.insertSheet('أرصدة_الخزائن');
  
  var headers = [
    'الحساب / الخزينة',
    'العملة',
    'الرصيد الافتتاحي',
    'إجمالي الإيداعات / الأرباح',
    'إجمالي السحوبات والتكاليف',
    'الرصيد الحالي المتوفر',
    'ملاحظات'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#064e3b');
  headerRange.setFontColor('#a7f3d0');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);

  // الحسابات الافتراضية
  if (sheet.getLastRow() <= 1) {
    var defaultAccounts = [
      ['خزينة الكاش بالدينار', 'د.ل', 120000, 0, 0, '=C2+D2-E2', 'السيولة النقدية بمقر المكتب'],
      ['حساب مصرف التجارة والتنمية', 'د.ل', 85000, 0, 0, '=C3+D3-E3', 'حساب التوريدات المصرفية'],
      ['حساب مصرف الوحدة', 'د.ل', 60000, 0, 0, '=C4+D4-E4', 'حساب التوريدات المصرفية'],
      ['حساب المصرف التجاري الوطني', 'د.ل', 50000, 0, 0, '=C5+D5-E5', 'حساب التوريدات المصرفية'],
      ['حساب مصرف الأمان', 'د.ل', 40000, 0, 0, '=C6+D6-E6', 'حساب التوريدات المصرفية'],
      ['حساب مصرف المتوسط', 'د.ل', 30000, 0, 0, '=C7+D7-E7', 'حساب التوريدات المصرفية'],
      ['حساب مصرف الجمهورية', 'د.ل', 75000, 0, 0, '=C8+D8-E8', 'حساب التوريدات المصرفية'],
      ['حساب المصرف الإسلامي الليبي', 'د.ل', 35000, 0, 0, '=C9+D9-E9', 'حساب التوريدات المصرفية'],
      ['حساب مصرف شمال أفريقيا', 'د.ل', 25000, 0, 0, '=C10+D10-E10', 'حساب التوريدات المصرفية'],
      ['حساب مصرف اليقين', 'د.ل', 20000, 0, 0, '=C11+D11-E11', 'حساب التوريدات المصرفية'],
      ['خزينة الدولار النقدي (الخارج)', '$', 0, 0, 0, '=C12+D12-E12', 'رصيد الدولار المستلم قبل البيع']
    ];
    sheet.getRange(2, 1, defaultAccounts.length, headers.length).setValues(defaultAccounts);
  }

  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

// تهيئة ورقة حركة الخزائن وسجل العمليات (Audit Log)
function setupMovementsSheet(ss) {
  var sheet = ss.getSheetByName('حركة_الخزائن') || ss.insertSheet('حركة_الخزائن');
  
  var headers = [
    'رقم القيد',
    'التاريخ والوقت',
    'كود البطاقة',
    'اسم الزبون',
    'نوع العملية',
    'الخزينة / المصرف',
    'المبلغ',
    'العملة',
    'اسم الموظف المسؤول',
    'ملاحظات وبيان العملية'
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setBackground('#701a75');
  headerRange.setFontColor('#fbcfe8');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);

  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

// 5. تسجيل حركة مالية تلقائياً في ورقة حركة_الخزائن
function recordMovement(cardCode, clientName, movementType, accountName, amount, currency, employeeName, notes) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('حركة_الخزائن') || ss.insertSheet('حركة_الخزائن');
    var lastRow = sheet.getLastRow();
    var refNo = 'TX-' + (1000 + lastRow);
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

    var row = [
      refNo,
      nowStr,
      cardCode || '-',
      clientName || '-',
      movementType,
      accountName,
      parseFloat(amount) || 0,
      currency || 'د.ل',
      employeeName || 'النظام',
      notes || ''
    ];

    sheet.appendRow(row);
    return { success: true, refNo: refNo };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// 6. التحقق من تسجيل دخول الموظف عبر رمز PIN
function verifyEmployeePin(pin) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('المستخدمين');
  if (!sheet) return { success: false, message: 'ورقة المستخدمين غير مهيأة بعد' };

  var data = sheet.getDataRange().getValues();
  var pinClean = pin ? pin.toString().trim() : '';

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var userPin = row[1] ? row[1].toString().trim() : '';
    var status = row[4] ? row[4].toString().trim() : 'نشط';

    if (userPin === pinClean) {
      if (status !== 'نشط') {
        return { success: false, message: 'هذا الحساب معطل، يرجى مراجعة الإدارة' };
      }
      return {
        success: true,
        user: {
          name: row[0],
          role: row[2],
          allowedStages: row[3]
        }
      };
    }
  }

  return { success: false, message: 'رمز الدخول غير صحيح' };
}

// 7. دالة تنظيف وتوحيد النصوص العربية للبحث المرن
function cleanText(txt) {
  if (!txt) return '';
  return txt.toString().trim().toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[\s\-_/\\,.]/g, '');
}

// 8. تنسيق التاريخ بصيغة yyyy-MM-dd
function formatDateValue(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return val.toString();
}

// 9. جلب كافة البطاقات للربط السحابي
function getAllCards() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('بيانات_ماستر') || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var cards = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[1]) continue;
    var hasCostCols = (row.length >= 18);

    cards.push({
      id: row[0] ? row[0].toString() : '',
      clientName: row[1] ? row[1].toString() : '',
      nationalId: row[2] ? row[2].toString() : '',
      cblPhone: row[3] ? row[3].toString() : '',
      bank: row[4] ? row[4].toString() : '',
      accountNumber: row[5] ? row[5].toString() : '',
      iban: row[6] ? row[6].toString() : '',
      depositAmount: hasCostCols ? (parseFloat(row[7]) || 0) : (parseFloat(row[7]) || 0),
      cardPrice: hasCostCols ? (parseFloat(row[8]) || 0) : 0,
      totalCost: hasCostCols ? (parseFloat(row[9]) || 0) : 0,
      depositDate: hasCostCols ? formatDateValue(row[10]) : formatDateValue(row[8]),
      bookingDate: hasCostCols ? formatDateValue(row[11]) : formatDateValue(row[9]),
      cardNumber: hasCostCols ? (row[12] ? row[12].toString() : '') : (row[10] ? row[10].toString() : ''),
      pinLocal: hasCostCols ? (row[13] ? row[13].toString() : '') : '',
      pinDollar: hasCostCols ? (row[14] ? row[14].toString() : '') : '',
      expiryDate: hasCostCols ? (row[15] ? row[15].toString() : '09/29') : '09/29',
      status: hasCostCols ? (row[16] ? row[16].toString() : '1. إدخال البيانات') : '1. إدخال البيانات',
      notes: hasCostCols ? (row[17] ? row[17].toString() : '') : ''
    });
  }

  return cards;
}

// 10. البحث الذكي الموحد (بالاسم، الرقم الوطني، رقم الهاتف، أو كود البطاقة)
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
    var rowCardNum = row.length > 12 ? cleanText(row[12]) : (row.length > 10 ? cleanText(row[10]) : '');

    if (rowCode.indexOf(qClean) !== -1 ||
        rowName.indexOf(qClean) !== -1 ||
        rowNatId.indexOf(qClean) !== -1 ||
        rowPhone.indexOf(qClean) !== -1 ||
        (rowCardNum && rowCardNum.indexOf(qClean) !== -1)) {
      
      var hasCostCols = (row.length >= 18);
      var depAmt = hasCostCols ? (row[7] || '19800') : (row[7] || '19800');
      var cardPrice = hasCostCols ? (row[8] || '2500') : '2500';
      var totalCost = hasCostCols ? (row[9] || '') : '';
      var depDate = hasCostCols ? formatDateValue(row[10]) : formatDateValue(row[8]);
      var bookDate = hasCostCols ? formatDateValue(row[11]) : formatDateValue(row[9]);
      var cardNum = hasCostCols ? (row[12] ? row[12].toString() : '') : (row[10] ? row[10].toString() : '');
      var pinLocal = hasCostCols ? (row[13] ? row[13].toString() : '') : (row[11] ? row[11].toString() : '');
      var pinDollar = hasCostCols ? (row[14] ? row[14].toString() : '') : (row[12] ? row[12].toString() : '');
      var expiry = hasCostCols ? (row[15] ? row[15].toString() : '09/29') : (row[13] ? row[13].toString() : '09/29');
      var status = hasCostCols ? (row[16] ? row[16].toString() : '1. إدخال البيانات') : (row[14] ? row[14].toString() : '1. إدخال البيانات');
      var notes = hasCostCols ? (row[17] ? row[17].toString() : '') : (row[15] ? row[15].toString() : '');

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
        depositAmt: depAmt.toString(),
        cardPrice: cardPrice.toString(),
        totalCost: totalCost.toString(),
        depositDate: depDate,
        bookingDate: bookDate,
        cardNum: cardNum,
        pinLocal: pinLocal,
        pinDollar: pinDollar,
        expiry: expiry,
        status: status,
        notes: notes
      };
    }
  }

  return { found: false };
}

// 11. حفظ أو تعديل المعاملة
function saveCardData(card, employeeName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('بيانات_ماستر') || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  var targetRow = -1;
  var code = card.code ? card.code.toString().trim() : '';
  var isNew = false;

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
    isNew = true;
  }

  var deposit = parseFloat(card.depositAmt) || 0;
  var cardPrice = parseFloat(card.cardPrice) || 0;
  var totalCost = deposit + cardPrice;

  var row = [
    code,
    card.name ? card.name.toString().trim() : '',
    card.nationalId ? card.nationalId.toString().trim() : '',
    card.cblPhone ? card.cblPhone.toString().trim() : '',
    card.bank || 'مصرف التجارة والتنمية',
    card.accountNumber ? card.accountNumber.toString().trim() : '',
    card.iban ? card.iban.toString().trim() : '',
    deposit,
    cardPrice,
    totalCost,
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
  
  // تسجيل حركة في الـ Audit Log
  if (isNew) {
    recordMovement(code, card.name, 'تسجيل معاملة جديدة', card.bank, deposit, 'د.ل', employeeName || 'موظف الاستقبال', 'تم إدخال الزبون مبدئياً');
  }

  return {
    success: true,
    code: code,
    row: targetRow,
    deposit: deposit,
    cardPrice: cardPrice,
    totalCost: totalCost
  };
}

// 12. جلب كشف تقرير المرحلة للطباعة والتصدير
function getStageReport(stage) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('بيانات_ماستر') || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  var list = [];
  var totalDeposit = 0;
  var totalCardPrice = 0;
  var totalCostSum = 0;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var hasCostCols = (row.length >= 18);
    var rowStatus = hasCostCols ? (row[16] ? row[16].toString().trim() : '') : (row[14] ? row[14].toString().trim() : '');

    if (stage === 'الكل' || rowStatus === stage || (stage === '1. إدخال البيانات' && rowStatus === 'إدخال البيانات')) {
      var dep = parseFloat(row[7]) || 0;
      var price = hasCostCols ? (parseFloat(row[8]) || 0) : 0;
      var cost = hasCostCols ? (parseFloat(row[9]) || (dep + price)) : dep;

      totalDeposit += dep;
      totalCardPrice += price;
      totalCostSum += cost;

      list.push({
        code: row[0] ? row[0].toString() : '',
        name: row[1] ? row[1].toString() : '',
        nationalId: row[2] ? row[2].toString() : '',
        cblPhone: row[3] ? row[3].toString() : '',
        bank: row[4] ? row[4].toString() : '',
        accountNumber: row[5] ? row[5].toString() : '-',
        iban: row[6] ? row[6].toString() : '-',
        depositAmt: dep,
        cardPrice: price,
        totalCost: cost,
        bookingDate: hasCostCols ? formatDateValue(row[11]) : formatDateValue(row[9]),
        status: rowStatus
      });
    }
  }

  return {
    stage: stage,
    cards: list,
    totalCards: list.length,
    totalDeposit: totalDeposit,
    totalCardPrice: totalCardPrice,
    totalCostSum: totalCostSum,
    date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
  };
}
