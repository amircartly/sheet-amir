import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool | null {
  const databaseUrl = process.env.DATABASE_URL;
  const dbHost = process.env.DB_HOST || "localhost";
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS;
  const dbName = process.env.DB_NAME;

  if (pool) {
    return pool;
  }

  try {
    if (databaseUrl) {
      pool = mysql.createPool({
        uri: databaseUrl,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
      return pool;
    } else if (dbUser && dbName) {
      pool = mysql.createPool({
        host: dbHost,
        port: parseInt(process.env.DB_PORT || "3306", 10),
        user: dbUser,
        password: dbPassword,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
      return pool;
    }
  } catch (err) {
    console.error("Failed to initialize MySQL pool:", err);
  }

  return null;
}

export async function initDatabaseTables() {
  const p = getDbPool();
  if (!p) return false;

  // 1. Create Cards Table
  await p.query(`
    CREATE TABLE IF NOT EXISTS cards (
      id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      national_id VARCHAR(32) DEFAULT '',
      cbl_phone VARCHAR(32) DEFAULT '',
      bank VARCHAR(128) DEFAULT '',
      account_number VARCHAR(64) DEFAULT '',
      iban VARCHAR(64) DEFAULT '',
      deposit_amt DECIMAL(15, 2) DEFAULT 0.00,
      card_price DECIMAL(15, 2) DEFAULT 0.00,
      total_cost DECIMAL(15, 2) DEFAULT 0.00,
      deposit_date VARCHAR(32) DEFAULT '',
      booking_date VARCHAR(32) DEFAULT '',
      card_num VARCHAR(32) DEFAULT '',
      pin_local VARCHAR(32) DEFAULT '',
      pin_dollar VARCHAR(32) DEFAULT '',
      expiry VARCHAR(16) DEFAULT '09/29',
      status VARCHAR(64) DEFAULT '1. إدخال البيانات',
      notes TEXT,
      ref_slip_no VARCHAR(64) DEFAULT '',
      withdraw_location VARCHAR(128) DEFAULT '',
      usd_amount DECIMAL(15, 2) DEFAULT 0.00,
      rate DECIMAL(15, 4) DEFAULT 0.0000,
      net_profit_lyd DECIMAL(15, 2) DEFAULT 0.00,
      destination_vault VARCHAR(128) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_national_id (national_id),
      INDEX idx_cbl_phone (cbl_phone),
      INDEX idx_card_num (card_num),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Create Vaults Table
  await p.query(`
    CREATE TABLE IF NOT EXISTS vaults (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      type VARCHAR(64) NOT NULL,
      currency VARCHAR(16) NOT NULL,
      balance DECIMAL(15, 2) DEFAULT 0.00,
      total_income DECIMAL(15, 2) DEFAULT 0.00,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Create Movements / Audit Log Table
  await p.query(`
    CREATE TABLE IF NOT EXISTS movements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action_type VARCHAR(64) NOT NULL,
      details TEXT,
      amount DECIMAL(15, 2) DEFAULT 0.00,
      currency VARCHAR(16) DEFAULT 'د.ل',
      performed_by VARCHAR(64) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Seed default vaults if empty
  const [rows]: any = await p.query(`SELECT COUNT(*) as cnt FROM vaults`);
  if (rows && rows[0] && rows[0].cnt === 0) {
    const defaultVaults = [
      ["cash_lyd", "خزينة الكاش بالدينار", "خزينة نقدية (درج المكتب)", "د.ل", 0, 0],
      ["bank_1", "حساب مصرف التجارة والتنمية", "حساب مصرفي", "د.ل", 0, 0],
      ["bank_2", "حساب مصرف الوحدة", "حساب مصرفي", "د.ل", 0, 0],
      ["bank_3", "حساب المصرف التجاري الوطني", "حساب مصرفي", "د.ل", 0, 0],
      ["bank_4", "حساب مصرف الأمان", "حساب مصرفي", "د.ل", 0, 0],
      ["bank_5", "حساب مصرف المتوسط", "حساب مصرفي", "د.ل", 0, 0],
      ["bank_6", "حساب مصرف الجمهورية", "حساب مصرفي", "د.ل", 0, 0],
      ["bank_7", "حساب المصرف الإسلامي الليبي", "حساب مصرفي", "د.ل", 0, 0],
      ["bank_8", "حساب مصرف شمال أفريقيا", "حساب مصرفي", "د.ل", 0, 0],
      ["bank_9", "حساب مصرف اليقين", "حساب مصرفي", "د.ل", 0, 0],
      ["cash_usd", "خزينة الدولار ($ Cash)", "خزينة عملة صعبة", "$", 0, 0],
    ];

    for (const v of defaultVaults) {
      await p.query(
        `INSERT INTO vaults (id, name, type, currency, balance, total_income) VALUES (?, ?, ?, ?, ?, ?)`,
        v
      );
    }
  }

  return true;
}
