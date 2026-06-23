/**
 * End-to-End ERP Simulation and Database Consistency Audit
 * 
 * Verifies the database integrity at every step:
 * Create Supplier → Purchase Stock → Adjust Inventory → Create Sale → Generate Invoice → Update Dashboard → Generate Report
 * 
 * Cleanly resets the database and filesystem at the end.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { jsPDF } = require('jspdf');

// 1. Read environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const dotenvContent = fs.readFileSync(envPath, 'utf8');
  dotenvContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
}

const DB_HOST = env.DB_HOST || 'localhost';
const DB_USER = env.DB_USER || 'postgres';
const DB_PASSWORD = env.DB_PASSWORD || '';
const DB_NAME = env.DB_NAME || 'revathi_store';
const DB_PORT = parseInt(env.DB_PORT || '5433');
const dbUrl = env.DATABASE_URL || `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

function getDbClient() {
  return new Client({ connectionString: dbUrl });
}

// Visual helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function logStep(stepNum, name) {
  console.log(`\n${colors.blue}=== STEP ${stepNum}: ${name} ===${colors.reset}`);
}

function logCheck(msg, success = true) {
  if (success) {
    console.log(`  ${colors.green}✓ ${msg}${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ ${msg}${colors.reset}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    logCheck(message, false);
    throw new Error(`Database consistency violation: ${message}`);
  }
  logCheck(message, true);
}

async function runSimulation() {
  console.log(`${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.cyan}             STARTING END-TO-END ERP SIMULATION AUDIT           ${colors.reset}`);
  console.log(`${colors.cyan}================================================================${colors.reset}`);
  console.log(`Connecting to: ${dbUrl.replace(/:([^:@]+)@/, ':****@')}`);

  const client = getDbClient();
  try {
    await client.connect();
    logCheck('Connected to PostgreSQL successfully.');
  } catch (err) {
    logCheck('Failed to connect to database.', false);
    console.error(err);
    process.exit(1);
  }

  // Trackers for cleanup
  let supplierId = null;
  let productId = null;
  let purchaseId = null;
  let customerId = null;
  let saleId = null;
  let invoiceId = null;
  let createdPdfPath = null;
  let testInvoiceNumber = null;

  try {
    // ==========================================
    // STEP 1: CREATE SUPPLIER
    // ==========================================
    logStep(1, 'Create Supplier');
    
    const supplierPayload = {
      company_name: 'E2E Apex Oil Distributors',
      agency_name: 'Apex Wholesale Agency',
      address: '404 Simulation Plaza, West Coimbatore, TN',
      phone: '9876543210'
    };

    const supplierRes = await client.query(
      `INSERT INTO suppliers (company_name, agency_name, address, phone)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [supplierPayload.company_name, supplierPayload.agency_name, supplierPayload.address, supplierPayload.phone]
    );
    
    assert(supplierRes.rowCount === 1, 'Supplier row inserted');
    const supplier = supplierRes.rows[0];
    supplierId = supplier.id;
    logCheck(`Supplier created with ID: ${supplierId}`);

    // Log to audit logs
    const supplierAuditRes = await client.query(
      'INSERT INTO audit_logs (action, entity_type, entity_id, performed_by) VALUES ($1, $2, $3, $4) RETURNING *',
      ['Create Supplier', 'suppliers', supplierId, 'admin']
    );
    assert(supplierAuditRes.rowCount === 1, 'Supplier audit log entry created');

    // VERIFY DATABASE CONSISTENCY FOR SUPPLIER
    const verifySupplier = await client.query('SELECT * FROM suppliers WHERE id = $1', [supplierId]);
    assert(verifySupplier.rowCount === 1, 'Supplier exists in suppliers table');
    assert(verifySupplier.rows[0].company_name === supplierPayload.company_name, 'Supplier company name matches');
    assert(verifySupplier.rows[0].phone === supplierPayload.phone, 'Supplier phone matches');

    // Aggregate query to verify outstanding balance is 0 for a new supplier
    const balanceRes = await client.query(`
      SELECT 
        (SELECT COALESCE(SUM(total_amount), 0) FROM purchases WHERE supplier_id = $1 AND deleted_at IS NULL) as total_purchases,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM supplier_payments WHERE supplier_id = $1) as total_payments
    `, [supplierId]);
    const outstanding = parseFloat(balanceRes.rows[0].total_purchases) - parseFloat(balanceRes.rows[0].total_payments);
    assert(outstanding === 0, `Outstanding balance for new supplier is exactly 0.00 (Got: ${outstanding})`);


    // ==========================================
    // STEP 2: PURCHASE STOCK
    // ==========================================
    logStep(2, 'Purchase Stock');

    // 2.1 First create a dedicated product for E2E testing
    const productPayload = {
      name: 'E2E Test Special Sesame Oil',
      description: 'Sesame oil dedicated for E2E database consistency simulation',
      type: 'sesame', // valid enum type
      slug: `e2e-test-special-sesame-${Date.now()}`,
      sku: 'E2E-SES-SIM-1',
      available: true,
      stock: 0,
      reserved: 0,
      incoming: 0,
      low_stock_threshold: 5,
      stock_status: 'out_of_stock',
      unit: 'L'
    };

    const productRes = await client.query(
      `INSERT INTO products (name, description, type, slug, sku, available, stock, reserved, incoming, low_stock_threshold, stock_status, unit, supplier_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        productPayload.name,
        productPayload.description,
        productPayload.type,
        productPayload.slug,
        productPayload.sku,
        productPayload.available,
        productPayload.stock,
        productPayload.reserved,
        productPayload.incoming,
        productPayload.low_stock_threshold,
        productPayload.stock_status,
        productPayload.unit,
        supplierId
      ]
    );

    assert(productRes.rowCount === 1, 'Product row inserted');
    const product = productRes.rows[0];
    productId = product.id;
    logCheck(`Test product created with ID: ${productId}, Initial Stock: 0`);

    // 2.2 Record a purchase transaction (Purchase 20 bottles @ Rs. 180 each, Total = Rs. 3600)
    const purchaseQty = 20;
    const purchaseRate = 180.00;
    const purchaseTotal = purchaseQty * purchaseRate;

    await client.query('BEGIN');

    // Insert purchase record
    const purchaseRes = await client.query(
      `INSERT INTO purchases (supplier_id, purchase_date, total_amount)
       VALUES ($1, now(), $2) RETURNING *`,
      [supplierId, purchaseTotal]
    );
    const purchase = purchaseRes.rows[0];
    purchaseId = purchase.id;
    logCheck(`Purchase record created with ID: ${purchaseId}, Total Amount: Rs. ${purchaseTotal}`);

    // Insert purchase items
    const purchaseItemRes = await client.query(
      `INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_rate)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [purchaseId, productId, purchaseQty, purchaseRate]
    );
    assert(purchaseItemRes.rowCount === 1, 'Purchase item row inserted');

    // Update product stock and cost price
    const prodUpdateRes = await client.query(
      `UPDATE products 
       SET stock = stock + $1,
           cost_price = $2,
           last_cost = $2,
           stock_status = CASE 
               WHEN (stock + $1) - reserved <= 0 THEN 'out_of_stock'
               WHEN (stock + $1) - reserved <= low_stock_threshold THEN 'low'
               ELSE 'in_stock'
           END,
           stock_updated_at = now()
       WHERE id = $3 RETURNING *`,
      [purchaseQty, purchaseRate, productId]
    );
    assert(prodUpdateRes.rowCount === 1, 'Product stock and cost price updated in products table');

    // Create stock ledger entry
    const stockLedgerRes = await client.query(
      `INSERT INTO stock_ledger (product_id, transaction_type, quantity, reference_type, reference_id)
       VALUES ($1, 'purchase', $2, 'purchase', $3) RETURNING *`,
      [productId, purchaseQty, purchaseId]
    );
    assert(stockLedgerRes.rowCount === 1, 'Stock ledger entry recorded for purchase');

    // Update supplier ledger
    // Get last balance (should be 0 since it is a new supplier)
    const lastLedgerRes = await client.query(
      `SELECT balance_after FROM supplier_ledger 
       WHERE supplier_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at DESC, id DESC LIMIT 1`,
      [supplierId]
    );
    const prevBalance = lastLedgerRes.rows.length > 0 ? parseFloat(lastLedgerRes.rows[0].balance_after) : 0.0;
    const newBalance = prevBalance + purchaseTotal;

    const supplierLedgerRes = await client.query(
      `INSERT INTO supplier_ledger (supplier_id, transaction_type, amount, reference_id, balance_after)
       VALUES ($1, 'purchase', $2, $3, $4) RETURNING *`,
      [supplierId, purchaseTotal, purchaseId, newBalance]
    );
    assert(supplierLedgerRes.rowCount === 1, 'Supplier ledger entry recorded for purchase');

    await client.query('COMMIT');
    logCheck('Purchase transaction committed successfully.');

    // Log to audit logs
    await client.query(
      'INSERT INTO audit_logs (action, entity_type, entity_id, performed_by) VALUES ($1, $2, $3, $4)',
      ['Log Purchase', 'purchases', purchaseId, 'admin']
    );

    // VERIFY DATABASE CONSISTENCY FOR PURCHASE
    // Consistency Check A: Product stock matches purchased quantity
    const dbProdCheck = await client.query('SELECT stock, cost_price, stock_status FROM products WHERE id = $1', [productId]);
    assert(dbProdCheck.rows[0].stock === purchaseQty, `Product stock equals purchase quantity (${dbProdCheck.rows[0].stock} = ${purchaseQty})`);
    assert(parseFloat(dbProdCheck.rows[0].cost_price) === purchaseRate, `Product cost price matches purchase rate (${parseFloat(dbProdCheck.rows[0].cost_price)} = ${purchaseRate})`);
    assert(dbProdCheck.rows[0].stock_status === 'in_stock', `Product stock status updated to 'in_stock' (Got: ${dbProdCheck.rows[0].stock_status})`);

    // Consistency Check B: Stock ledger records match
    const dbStockLedgerCheck = await client.query('SELECT * FROM stock_ledger WHERE product_id = $1', [productId]);
    assert(dbStockLedgerCheck.rowCount === 1, 'Exactly one stock ledger entry for product');
    assert(dbStockLedgerCheck.rows[0].transaction_type === 'purchase', "Stock ledger type is 'purchase'");
    assert(dbStockLedgerCheck.rows[0].quantity === purchaseQty, `Stock ledger quantity is positive ${purchaseQty}`);

    // Consistency Check C: Supplier ledger outstanding balance matches purchase total
    const dbSupplierLedgerCheck = await client.query('SELECT * FROM supplier_ledger WHERE supplier_id = $1 AND reference_id = $2', [supplierId, purchaseId]);
    assert(dbSupplierLedgerCheck.rowCount === 1, 'Supplier ledger entry exists for the purchase');
    assert(parseFloat(dbSupplierLedgerCheck.rows[0].balance_after) === purchaseTotal, `Supplier ledger balance after matches purchase total (${parseFloat(dbSupplierLedgerCheck.rows[0].balance_after)} = ${purchaseTotal})`);


    // ==========================================
    // STEP 3: ADJUST INVENTORY
    // ==========================================
    logStep(3, 'Adjust Inventory');

    // Perform manual inventory adjustment: Subtract 2 items due to leakage/damage
    const adjustChange = -2;
    const adjustReason = '2 bottles leaked during storage shelf placement';
    const oldStock = purchaseQty;
    const expectedStockAfterAdjust = oldStock + adjustChange; // 20 - 2 = 18

    await client.query('BEGIN');

    // Fetch product with row-level lock
    const prodLockRes = await client.query(
      'SELECT id, stock, reserved, incoming, low_stock_threshold FROM products WHERE id = $1 FOR UPDATE',
      [productId]
    );
    const prodLock = prodLockRes.rows[0];
    const beforeState = { stock: prodLock.stock, reserved: prodLock.reserved, incoming: prodLock.incoming };
    const afterState = { stock: prodLock.stock + adjustChange, reserved: prodLock.reserved, incoming: prodLock.incoming };

    // Update product stock and status
    const available = afterState.stock - afterState.reserved;
    const lowThreshold = prodLock.low_stock_threshold;
    const nextStatus = available <= 0 ? 'out_of_stock' : (available <= lowThreshold ? 'low' : 'in_stock');
    const updateTime = new Date();

    const adjustProdRes = await client.query(
      `UPDATE products 
       SET stock = $1,
           stock_status = $2,
           stock_updated_at = $3
       WHERE id = $4 RETURNING *`,
      [afterState.stock, nextStatus, updateTime, productId]
    );
    assert(adjustProdRes.rowCount === 1, 'Product stock updated in database');

    // Insert into inventory_audit
    const invAuditRes = await client.query(
      `INSERT INTO inventory_audit (product_id, type, change, reason, "user", "before", "after", at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [productId, 'stock', adjustChange, adjustReason, 'admin', JSON.stringify(beforeState), JSON.stringify(afterState), updateTime]
    );
    assert(invAuditRes.rowCount === 1, 'Inventory audit log entry recorded');

    // Insert into centralized audit_logs
    await client.query(
      'INSERT INTO audit_logs (action, entity_type, entity_id, performed_by) VALUES ($1, $2, $3, $4)',
      [`Adjust Stock (stock: ${adjustChange})`, 'products', productId, 'admin']
    );

    // Also record stock adjustment in stock_ledger to track full history
    await client.query(
      `INSERT INTO stock_ledger (product_id, transaction_type, quantity, reference_type, reference_id)
       VALUES ($1, 'adjustment', $2, 'manual', $3)`,
      [productId, adjustChange, invAuditRes.rows[0].id]
    );

    await client.query('COMMIT');
    logCheck('Inventory adjustment committed successfully.');

    // VERIFY DATABASE CONSISTENCY FOR INVENTORY ADJUSTMENT
    // Consistency Check A: Stock is exactly 18
    const dbProdCheck2 = await client.query('SELECT stock FROM products WHERE id = $1', [productId]);
    assert(dbProdCheck2.rows[0].stock === expectedStockAfterAdjust, `Product stock equals expected post-adjustment stock (${dbProdCheck2.rows[0].stock} = ${expectedStockAfterAdjust})`);

    // Consistency Check B: Inventory audit records are intact and JSON states are valid
    const dbInvAuditCheck = await client.query('SELECT * FROM inventory_audit WHERE product_id = $1 ORDER BY id DESC LIMIT 1', [productId]);
    assert(dbInvAuditCheck.rowCount === 1, 'Inventory audit log exists');
    assert(dbInvAuditCheck.rows[0].change === adjustChange, `Inventory audit change matches (${dbInvAuditCheck.rows[0].change} = ${adjustChange})`);
    assert(dbInvAuditCheck.rows[0].before.stock === oldStock, `Before-stock in JSON matches (${dbInvAuditCheck.rows[0].before.stock} = ${oldStock})`);
    assert(dbInvAuditCheck.rows[0].after.stock === expectedStockAfterAdjust, `After-stock in JSON matches (${dbInvAuditCheck.rows[0].after.stock} = ${expectedStockAfterAdjust})`);


    // ==========================================
    // STEP 4: CREATE SALE
    // ==========================================
    logStep(4, 'Create Sale');

    const customerPayload = {
      name: 'E2E Simulation Customer',
      mobile: '9876500001',
      address: '101 Database Consistency Ave, Coimbatore, TN',
      gst_number: '33AAAAA1111A1Z1'
    };

    // 4.1 Check if customer exists or create new
    const custCheck = await client.query('SELECT id FROM customers WHERE mobile = $1', [customerPayload.mobile]);
    if (custCheck.rows.length > 0) {
      customerId = custCheck.rows[0].id;
      logCheck(`Existing customer found with ID: ${customerId}`);
    } else {
      const custInsert = await client.query(
        `INSERT INTO customers (name, mobile, address, gst_number)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [customerPayload.name, customerPayload.mobile, customerPayload.address, customerPayload.gst_number]
      );
      customerId = custInsert.rows[0].id;
      logCheck(`New customer created with ID: ${customerId}`);
    }

    // 4.2 Record the sale transaction (Sell 5 bottles @ Rs. 240 each, Total = Rs. 1200)
    const saleQty = 5;
    const sellingPrice = 240.00;
    const saleTotal = saleQty * sellingPrice;

    await client.query('BEGIN');

    // Generate sequential Invoice Number
    const countRes = await client.query('SELECT COUNT(*) FROM sales');
    const invoiceNumber = `INV-SIM-${(parseInt(countRes.rows[0].count) + 1).toString().padStart(5, '0')}`;
    testInvoiceNumber = invoiceNumber;

    // Create Sale record
    const saleRes = await client.query(
      `INSERT INTO sales (customer_id, invoice_number, total_amount, payment_type)
       VALUES ($1, $2, $3, 'cash') RETURNING *`,
      [customerId, invoiceNumber, saleTotal]
    );
    const sale = saleRes.rows[0];
    saleId = sale.id;
    logCheck(`Sale record created with ID: ${saleId}, Invoice Number: ${invoiceNumber}, Total Amount: Rs. ${saleTotal}`);

    // Fetch product details for validation and cost price lookup
    const prodFetchRes = await client.query('SELECT stock, cost_price, name FROM products WHERE id = $1 FOR UPDATE', [productId]);
    const prodDetails = prodFetchRes.rows[0];
    assert(prodDetails.stock >= saleQty, `Sufficient stock exists for sale (Stock: ${prodDetails.stock}, Sale Qty: ${saleQty})`);

    // Insert sale item
    const saleItemRes = await client.query(
      `INSERT INTO sale_items (sale_id, product_id, quantity, selling_price, cost_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [saleId, productId, saleQty, sellingPrice, parseFloat(prodDetails.cost_price)]
    );
    assert(saleItemRes.rowCount === 1, 'Sale item row inserted');

    // Reduce stock in products table
    const prodStockReduceRes = await client.query(
      `UPDATE products 
       SET stock = stock - $1,
           stock_status = CASE 
               WHEN (stock - $1) - reserved <= 0 THEN 'out_of_stock'
               WHEN (stock - $1) - reserved <= low_stock_threshold THEN 'low'
               ELSE 'in_stock'
           END,
           stock_updated_at = now()
       WHERE id = $2 RETURNING *`,
      [saleQty, productId]
    );
    assert(prodStockReduceRes.rowCount === 1, 'Product stock reduced in database');

    // Create stock ledger entry (negative quantity for sale)
    const saleStockLedgerRes = await client.query(
      `INSERT INTO stock_ledger (product_id, transaction_type, quantity, reference_type, reference_id)
       VALUES ($1, 'sale', $2, 'sale', $3) RETURNING *`,
      [productId, -saleQty, saleId]
    );
    assert(saleStockLedgerRes.rowCount === 1, 'Stock ledger entry recorded for sale');

    // Create Invoice record (empty pdf_url initially)
    const invoiceRes = await client.query(
      `INSERT INTO invoices (sale_id, invoice_number)
       VALUES ($1, $2) RETURNING *`,
      [saleId, invoiceNumber]
    );
    assert(invoiceRes.rowCount === 1, 'Invoice record initialized in database');
    invoiceId = invoiceRes.rows[0].id;

    await client.query('COMMIT');
    logCheck('Sale and invoice initialization transaction committed successfully.');

    // Log audit log
    await client.query(
      'INSERT INTO audit_logs (action, entity_type, entity_id, performed_by) VALUES ($1, $2, $3, $4)',
      ['Create Invoice Sale', 'sales', saleId, 'admin']
    );

    // VERIFY DATABASE CONSISTENCY FOR SALE
    // Consistency Check A: Product stock is reduced correctly (18 - 5 = 13)
    const dbProdCheck3 = await client.query('SELECT stock FROM products WHERE id = $1', [productId]);
    assert(dbProdCheck3.rows[0].stock === (expectedStockAfterAdjust - saleQty), `Product stock is correctly reduced to ${expectedStockAfterAdjust - saleQty} (Got: ${dbProdCheck3.rows[0].stock})`);

    // Consistency Check B: Sale and invoice details are consistent
    const dbSaleCheck = await client.query('SELECT * FROM sales WHERE id = $1', [saleId]);
    assert(dbSaleCheck.rows[0].invoice_number === invoiceNumber, 'Sale invoice number matches generated number');
    
    const dbInvoiceCheck = await client.query('SELECT * FROM invoices WHERE sale_id = $1', [saleId]);
    assert(dbInvoiceCheck.rowCount === 1, 'Invoice linked to sale exists');
    assert(dbInvoiceCheck.rows[0].invoice_number === invoiceNumber, 'Invoice record number matches sale invoice number');


    // ==========================================
    // STEP 5: GENERATE INVOICE PDF
    // ==========================================
    logStep(5, 'Generate Invoice PDF');

    // 5.1 Use jspdf to build the PDF document
    logCheck('Generating PDF invoice layout...');
    const doc = new jsPDF();
    doc.setFont("Helvetica");
    doc.setFontSize(22);
    doc.text("REVATHI STORE - ERP INVOICE", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoiceNumber}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Payment Mode: CASH`, 14, 40);

    doc.text("Bill To:", 14, 55);
    doc.text(`Customer Name: ${customerPayload.name}`, 14, 60);
    doc.text(`Mobile: ${customerPayload.mobile}`, 14, 65);
    doc.text(`GST: ${customerPayload.gst_number}`, 14, 70);

    // Item Table header
    doc.text("Items Summary", 14, 85);
    doc.line(14, 87, 196, 87);
    doc.text("Product Name", 14, 93);
    doc.text("Qty", 120, 93);
    doc.text("Rate (Rs)", 140, 93);
    doc.text("Amount (Rs)", 170, 93);
    doc.line(14, 96, 196, 96);

    // Item row
    doc.text(productPayload.name, 14, 102);
    doc.text(saleQty.toString(), 120, 102);
    doc.text(sellingPrice.toFixed(2), 140, 102);
    doc.text(saleTotal.toFixed(2), 170, 102);
    doc.line(14, 106, 196, 106);

    // Total
    doc.setFont(undefined, 'bold');
    doc.text("GRAND TOTAL:", 130, 115);
    doc.text(`Rs. ${saleTotal.toFixed(2)}`, 170, 115);

    // Output PDF path
    const invoicesDir = path.join(__dirname, '../public/invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    const safeFilename = `${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
    const pdfFilePath = path.join(invoicesDir, safeFilename);
    const pdfUrl = `/invoices/${safeFilename}`;

    // Write file to disk
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(pdfFilePath, pdfBuffer);
    createdPdfPath = pdfFilePath;
    logCheck(`PDF Invoice successfully written to: ${pdfFilePath}`);

    // 5.2 Update pdf_url in the invoices table
    const invoiceUpdateRes = await client.query(
      'UPDATE invoices SET pdf_url = $1 WHERE id = $2 RETURNING *',
      [pdfUrl, invoiceId]
    );
    assert(invoiceUpdateRes.rowCount === 1, 'pdf_url column updated in invoices table');
    logCheck(`Invoice record updated with PDF link: ${pdfUrl}`);

    // VERIFY FILE PERSISTENCE & DB CONSISTENCY
    // Check file exists and size is non-zero
    assert(fs.existsSync(pdfFilePath), 'Invoice PDF file exists on physical disk');
    const stats = fs.statSync(pdfFilePath);
    assert(stats.size > 0, `Invoice PDF is not empty (Size: ${stats.size} bytes)`);

    // Verify invoice record in db has matching path
    const dbInvoiceVerify = await client.query('SELECT pdf_url FROM invoices WHERE id = $1', [invoiceId]);
    assert(dbInvoiceVerify.rows[0].pdf_url === pdfUrl, 'DB invoice record contains correct PDF link');


    // ==========================================
    // STEP 6: UPDATE DASHBOARD
    // ==========================================
    logStep(6, 'Update Dashboard Metrics');

    // Run the exact dashboard query formulas to fetch metrics and check if our simulation data is reflected
    logCheck('Fetching aggregated dashboard metrics from database...');
    
    // 6.1 Today's sales
    const todayRes = await client.query(`
      SELECT COALESCE(SUM(total_amount), 0)::NUMERIC as today_sales,
             COUNT(*)::INTEGER as today_bills
      FROM sales
      WHERE created_at::date = CURRENT_DATE AND deleted_at IS NULL
    `);
    const todaySales = parseFloat(todayRes.rows[0].today_sales);
    const todayBills = todayRes.rows[0].today_bills;
    logCheck(`Dashboard Metric - Today's Sales: Rs. ${todaySales} (Bills Count: ${todayBills})`);
    assert(todaySales >= saleTotal, `Today's sales includes our transaction amount of Rs. ${saleTotal}`);
    assert(todayBills >= 1, "Today's bills count includes our E2E sale");

    // 6.2 Today's profit
    const todayProfitRes = await client.query(`
      SELECT COALESCE(SUM((si.selling_price - si.cost_price) * si.quantity), 0)::NUMERIC as today_profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at::date = CURRENT_DATE AND s.deleted_at IS NULL
    `);
    const todayProfit = parseFloat(todayProfitRes.rows[0].today_profit);
    const expectedSaleProfit = (sellingPrice - purchaseRate) * saleQty; // (240 - 180) * 5 = 300
    logCheck(`Dashboard Metric - Today's Profit: Rs. ${todayProfit}`);
    assert(todayProfit >= expectedSaleProfit, `Today's profit includes our E2E sale profit of Rs. ${expectedSaleProfit} (Got: Rs. ${todayProfit})`);

    // 6.3 Stock value
    const stockValRes = await client.query(`
      SELECT COALESCE(SUM(stock * cost_price), 0)::NUMERIC as stock_value
      FROM products
      WHERE deleted_at IS NULL
    `);
    const currentStockValue = parseFloat(stockValRes.rows[0].stock_value);
    const expectedProductStockValue = (expectedStockAfterAdjust - saleQty) * purchaseRate; // 13 * 180 = 2340
    logCheck(`Dashboard Metric - Current Stock Value: Rs. ${currentStockValue}`);
    assert(currentStockValue >= expectedProductStockValue, `Total inventory value includes our product stock value of Rs. ${expectedProductStockValue}`);

    // 6.4 Recent bills
    const recentBillsRes = await client.query(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.deleted_at IS NULL
      ORDER BY s.created_at DESC
      LIMIT 5
    `);
    const recentInvoiceNumbers = recentBillsRes.rows.map(r => r.invoice_number);
    logCheck(`Dashboard Metric - Recent Bills: ${recentInvoiceNumbers.join(', ')}`);
    assert(recentInvoiceNumbers.includes(invoiceNumber), `Recent bills list contains our new E2E invoice: ${invoiceNumber}`);

    // 6.5 Stock movement trend
    const stockMoveRes = await client.query(`
      SELECT sl.*, p.name as product_name
      FROM stock_ledger sl
      JOIN products p ON sl.product_id = p.id
      WHERE sl.product_id = $1
      ORDER BY sl.created_at DESC
    `, [productId]);
    
    assert(stockMoveRes.rowCount >= 3, 'Ledger recorded purchase, adjustment, and sale for E2E product');
    const movementTypes = stockMoveRes.rows.map(r => `${r.transaction_type} (${r.quantity})`);
    logCheck(`Product Stock Ledger Entries: ${movementTypes.join(' ← ')}`);
    assert(stockMoveRes.rows[0].transaction_type === 'sale' && stockMoveRes.rows[0].quantity === -saleQty, 'Latest movement matches our sale');
    assert(stockMoveRes.rows[1].transaction_type === 'adjustment' && stockMoveRes.rows[1].quantity === adjustChange, 'Second latest movement matches adjustment');
    assert(stockMoveRes.rows[2].transaction_type === 'purchase' && stockMoveRes.rows[2].quantity === purchaseQty, 'Third latest movement matches purchase');


    // ==========================================
    // STEP 7: GENERATE REPORT
    // ==========================================
    logStep(7, 'Generate Report Data');

    const reportParams = [new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]];

    // 7.1 Daily Report - Sales
    logCheck('Generating Daily Sales Report details...');
    const salesReportRes = await client.query(`
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      JOIN customers c ON s.customer_id = c.id 
      WHERE s.created_at::date >= $1 AND s.created_at::date <= $2 AND s.deleted_at IS NULL
      ORDER BY s.created_at DESC
    `, reportParams);
    const saleInReport = salesReportRes.rows.find(r => r.id === saleId);
    assert(!!saleInReport, 'E2E Sale is successfully listed in Daily Sales Report');
    assert(parseFloat(saleInReport.total_amount) === saleTotal, 'Report shows correct sales revenue');

    // 7.2 Daily Profit Report
    logCheck('Generating Profit and Revenue breakdown report...');
    const profitReportRes = await client.query(`
      SELECT s.invoice_number, s.created_at::date as date, 
             SUM((si.selling_price - si.cost_price) * si.quantity)::NUMERIC as profit,
             SUM(si.selling_price * si.quantity)::NUMERIC as revenue
      FROM sale_items si 
      JOIN sales s ON si.sale_id = s.id 
      WHERE s.created_at::date >= $1 AND s.created_at::date <= $2 AND s.deleted_at IS NULL
      GROUP BY s.id, s.invoice_number, s.created_at::date
    `, reportParams);
    const profitInReport = profitReportRes.rows.find(r => r.invoice_number === invoiceNumber);
    assert(!!profitInReport, 'Invoice item profit is computed and listed in Daily Profits Report');
    assert(parseFloat(profitInReport.revenue) === saleTotal, 'Revenue matches item sales total');
    assert(parseFloat(profitInReport.profit) === expectedSaleProfit, `Calculated profit matches item margins: Rs. ${expectedSaleProfit}`);

    // 7.3 Supplier Ledger and Outstanding Balances report
    logCheck('Generating Supplier Outstanding Balances Report...');
    const supplierReportRes = await client.query(`
      SELECT s.id, s.company_name,
             COALESCE(p.total, 0)::NUMERIC as total_purchases,
             COALESCE(pm.total, 0)::NUMERIC as total_payments,
             (COALESCE(p.total, 0) - COALESCE(pm.total, 0))::NUMERIC as outstanding_balance
      FROM suppliers s
      LEFT JOIN (
        SELECT supplier_id, SUM(total_amount) as total 
        FROM purchases 
        WHERE deleted_at IS NULL 
        GROUP BY supplier_id
      ) p ON s.id = p.supplier_id
      LEFT JOIN (
        SELECT supplier_id, SUM(amount_paid) as total 
        FROM supplier_payments 
        GROUP BY supplier_id
      ) pm ON s.id = pm.supplier_id
      WHERE s.id = $1
    `, [supplierId]);
    
    assert(supplierReportRes.rowCount === 1, 'Supplier is listed in outstanding balances report');
    const supplierRow = supplierReportRes.rows[0];
    logCheck(`Supplier: "${supplierRow.company_name}", Total Purchases: Rs. ${supplierRow.total_purchases}, Balance: Rs. ${supplierRow.outstanding_balance}`);
    assert(parseFloat(supplierRow.total_purchases) === purchaseTotal, 'Supplier purchases total is correct in report');
    assert(parseFloat(supplierRow.outstanding_balance) === purchaseTotal, 'Outstanding balance is correct in report');

    console.log(`\n${colors.green}================================================================${colors.reset}`);
    console.log(`${colors.green}          ALL END-TO-END ERP SIMULATION CHECKS PASSED           ${colors.reset}`);
    console.log(`${colors.green}================================================================${colors.reset}`);

  } catch (error) {
    console.log(`\n${colors.red}================================================================${colors.reset}`);
    console.log(`${colors.red}                SIMULATION RUN FAILED WITH ERROR                ${colors.reset}`);
    console.log(`${colors.red}================================================================${colors.reset}`);
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    // ==========================================
    // CLEANUP AND RECOVERY SECTION
    // ==========================================
    console.log(`\n${colors.yellow}=== CLEANING UP TEST RECORDS ===${colors.reset}`);

    // Remove generated PDF file
    if (createdPdfPath && fs.existsSync(createdPdfPath)) {
      try {
        fs.unlinkSync(createdPdfPath);
        logCheck(`Deleted local E2E PDF invoice file: ${createdPdfPath}`);
      } catch (err) {
        console.error(`Failed to delete PDF file: ${err.message}`);
      }
    }

    try {
      await client.query('BEGIN');

      // Delete from invoices
      if (invoiceId) {
        await client.query('DELETE FROM invoices WHERE id = $1', [invoiceId]);
        logCheck('Deleted test invoice record.');
      }

      // Delete from sale_items
      if (saleId) {
        await client.query('DELETE FROM sale_items WHERE sale_id = $1', [saleId]);
        await client.query('DELETE FROM sales WHERE id = $1', [saleId]);
        logCheck('Deleted test sale items and sale records.');
      }

      // Delete test customer
      if (customerId) {
        // Only delete if it's our simulated customer to prevent deleting other test users
        await client.query("DELETE FROM customers WHERE name = 'E2E Simulation Customer'");
        logCheck('Deleted test customer record.');
      }

      // Delete stock ledger entries
      if (productId) {
        await client.query('DELETE FROM stock_ledger WHERE product_id = $1', [productId]);
        await client.query('DELETE FROM inventory_audit WHERE product_id = $1', [productId]);
        logCheck('Deleted stock ledger and inventory audit logs for test product.');
      }

      // Delete supplier ledger
      if (supplierId) {
        await client.query('DELETE FROM supplier_ledger WHERE supplier_id = $1', [supplierId]);
        logCheck('Deleted supplier ledger records.');
      }

      // Delete purchase items and purchases
      if (purchaseId) {
        await client.query('DELETE FROM purchase_items WHERE purchase_id = $1', [purchaseId]);
        await client.query('DELETE FROM purchases WHERE id = $1', [purchaseId]);
        logCheck('Deleted purchase items and purchase records.');
      }

      // Delete test product
      if (productId) {
        await client.query('DELETE FROM products WHERE id = $1', [productId]);
        logCheck('Deleted test product.');
      }

      // Delete test supplier
      if (supplierId) {
        await client.query('DELETE FROM suppliers WHERE id = $1', [supplierId]);
        logCheck('Deleted test supplier.');
      }

      // Delete audit log entries created during this run
      await client.query(`
        DELETE FROM audit_logs 
        WHERE (entity_type = 'suppliers' AND entity_id = $1)
           OR (entity_type = 'purchases' AND entity_id = $2)
           OR (entity_type = 'products' AND entity_id = $3)
           OR (entity_type = 'sales' AND entity_id = $4)
      `, [supplierId, purchaseId, productId, saleId]);
      logCheck('Deleted centralized audit logs associated with this test run.');

      await client.query('COMMIT');
      logCheck('Database cleanup transaction completed successfully.');
    } catch (cleanupErr) {
      await client.query('ROLLBACK');
      console.error('Failed to clean up database records:', cleanupErr.message);
    }

    await client.end();
    console.log('Database connection closed.');
  }
}

runSimulation();
