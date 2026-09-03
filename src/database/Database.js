// src/database/Database.js
import SQLite from 'react-native-sqlite-2';

// ডেটাবেস খুলুন
const database = SQLite.openDatabase(
  {
    name: 'calculator.db',
    location: 'default',
  },
  () => {
    console.log('✅ Database opened successfully');
  },
  error => {
    console.log('❌ Database error:', error);
  }
);

// টেবিল তৈরি করুন
export const createTables = () => {
  database.transaction(tx => {
    // Products টেবিল
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );`,
      [],
      () => console.log('✅ Products table created'),
      error => console.log('❌ Error creating products:', error)
    );

    // Units টেবিল
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL
      );`,
      [],
      () => console.log('✅ Units table created'),
      error => console.log('❌ Error creating units:', error)
    );

    // Categories টেবিল
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );`,
      [],
      () => console.log('✅ Categories table created'),
      error => console.log('❌ Error creating categories:', error)
    );

    // History টেবিল
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        title TEXT,
        productId TEXT,
        productName TEXT,
        unitId TEXT,
        unitSymbol TEXT,
        sellingPrice REAL,
        totalCost REAL,
        profitAmount REAL,
        profitPercent REAL,
        resultUnitSymbol TEXT,
        conversionRate REAL,
        convertedProfit REAL,
        date TEXT,
        costItems TEXT
      );`,
      [],
      () => console.log('✅ History table created'),
      error => console.log('❌ Error creating history:', error)
    );
  });
};

// ---------- PRODUCTS ----------
export const getProducts = () => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM products ORDER BY name ASC',
        [],
        (tx, results) => {
          const rows = [];
          for (let i = 0; i < results.rows.length; i++) {
            rows.push(results.rows.item(i));
          }
          resolve(rows);
        },
        error => reject(error)
      );
    });
  });
};

export const addProduct = (id, name) => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'INSERT INTO products (id, name) VALUES (?, ?)',
        [id, name],
        (tx, results) => resolve(results),
        error => reject(error)
      );
    });
  });
};

export const deleteProduct = (id) => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'DELETE FROM products WHERE id = ?',
        [id],
        (tx, results) => resolve(results),
        error => reject(error)
      );
    });
  });
};

// ---------- UNITS ----------
export const getUnits = () => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM units ORDER BY label ASC',
        [],
        (tx, results) => {
          const rows = [];
          for (let i = 0; i < results.rows.length; i++) {
            rows.push(results.rows.item(i));
          }
          resolve(rows);
        },
        error => reject(error)
      );
    });
  });
};

export const addUnit = (id, label, symbol, type) => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'INSERT INTO units (id, label, symbol, type) VALUES (?, ?, ?, ?)',
        [id, label, symbol, type],
        (tx, results) => resolve(results),
        error => reject(error)
      );
    });
  });
};

export const deleteUnit = (id) => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'DELETE FROM units WHERE id = ?',
        [id],
        (tx, results) => resolve(results),
        error => reject(error)
      );
    });
  });
};

// ---------- CATEGORIES ----------
export const getCategories = () => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM categories ORDER BY name ASC',
        [],
        (tx, results) => {
          const rows = [];
          for (let i = 0; i < results.rows.length; i++) {
            rows.push(results.rows.item(i));
          }
          resolve(rows);
        },
        error => reject(error)
      );
    });
  });
};

export const addCategory = (id, name) => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'INSERT INTO categories (id, name) VALUES (?, ?)',
        [id, name],
        (tx, results) => resolve(results),
        error => reject(error)
      );
    });
  });
};

export const deleteCategory = (id) => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'DELETE FROM categories WHERE id = ?',
        [id],
        (tx, results) => resolve(results),
        error => reject(error)
      );
    });
  });
};

// ---------- HISTORY ----------
export const getHistory = () => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM history ORDER BY date DESC',
        [],
        (tx, results) => {
          const rows = [];
          for (let i = 0; i < results.rows.length; i++) {
            const item = results.rows.item(i);
            // costItems JSON string থেকে পার্স করুন
            try {
              item.costItems = JSON.parse(item.costItems || '[]');
            } catch {
              item.costItems = [];
            }
            rows.push(item);
          }
          resolve(rows);
        },
        error => reject(error)
      );
    });
  });
};

export const addHistory = (entry) => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        `INSERT INTO history (
          id, title, productId, productName, unitId, unitSymbol,
          sellingPrice, totalCost, profitAmount, profitPercent,
          resultUnitSymbol, conversionRate, convertedProfit, date, costItems
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.title || '',
          entry.productId || '',
          entry.productName || '',
          entry.unitId || '',
          entry.unitSymbol || '',
          entry.sellingPrice || 0,
          entry.totalCost || 0,
          entry.profitAmount || 0,
          entry.profitPercent || 0,
          entry.resultUnitSymbol || '',
          entry.conversionRate || 1,
          entry.convertedProfit || 0,
          entry.date || new Date().toLocaleDateString(),
          JSON.stringify(entry.costItems || [])
        ],
        (tx, results) => resolve(results),
        error => reject(error)
      );
    });
  });
};

export const deleteHistory = (id) => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'DELETE FROM history WHERE id = ?',
        [id],
        (tx, results) => resolve(results),
        error => reject(error)
      );
    });
  });
};

export const clearHistory = () => {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        'DELETE FROM history',
        [],
        (tx, results) => resolve(results),
        error => reject(error)
      );
    });
  });
};

// ---------- INITIAL DATA ----------
export const initializeDefaultData = async () => {
  try {
    // Products
    const products = await getProducts();
    if (products.length === 0) {
      await addProduct('p1', 'iPhone 15 Pro');
      await addProduct('p2', 'Samsung S24');
      console.log('✅ Default products added');
    }

    // Units
    const units = await getUnits();
    if (units.length === 0) {
      await addUnit('u1', 'US Dollar', '$', 'currency');
      await addUnit('u2', 'Bangladeshi Taka', '৳', 'currency');
      await addUnit('u3', 'Euro', '€', 'currency');
      await addUnit('u4', 'Percentage', '%', 'percentage');
      console.log('✅ Default units added');
    }

    // Categories
    const categories = await getCategories();
    if (categories.length === 0) {
      await addCategory('c1', 'Purchase Price');
      await addCategory('c2', 'Transport');
      await addCategory('c3', 'Tax / VAT');
      await addCategory('c4', 'Packaging');
      await addCategory('c5', 'Labour');
      console.log('✅ Default categories added');
    }
  } catch (error) {
    console.log('❌ Error initializing data:', error);
  }
};