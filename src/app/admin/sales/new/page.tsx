"use client";

import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';

interface SaleItemInput {
  product_id: string;
  size: string;
  quantity: number;
  selling_price: number; // calculated base price per size
  pricePerLiter: number;
}

export default function NewSalePage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sale Form States
  const [customerId, setCustomerId] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGst, setCustomerGst] = useState('');
  const [paymentType, setPaymentType] = useState('upi');

  const [items, setItems] = useState<SaleItemInput[]>([
    { product_id: '', size: '1L', quantity: 1, selling_price: 0, pricePerLiter: 0 }
  ]);

  // Invoice success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdInvoiceNum, setCreatedInvoiceNum] = useState('');
  const [createdInvoiceAmt, setCreatedInvoiceAmt] = useState(0);
  const [createdCustomerName, setCreatedCustomerName] = useState('');
  const [createdCustomerMobile, setCreatedCustomerMobile] = useState('');
  const [createdPdfUrl, setCreatedPdfUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, prodRes] = await Promise.all([
          fetch('/api/admin/customers'),
          fetch('/api/admin/products')
        ]);
        const custJson = await custRes.json();
        const prodJson = await prodRes.json();

        if (custJson.success) setCustomers(custJson.data);
        if (prodJson.success) setProducts(prodJson.data);
      } catch (e) {
        console.error('Failed to load customers and products:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getPriceMultiplier = (size: string) => {
    if (size.includes('100ml')) return 0.15;
    if (size.includes('250ml')) return 0.28;
    if (size.includes('500ml')) return 0.55;
    if (size.includes('5L')) return 4.8;
    if (size.includes('15L')) return 14;
    return 1.0; // 1L default
  };

  const handleAddItemRow = () => {
    setItems([...items, { product_id: '', size: '1L', quantity: 1, selling_price: 0, pricePerLiter: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof SaleItemInput, value: any) => {
    const updated = [...items];
    if (field === 'product_id') {
      updated[index].product_id = value;
      const prod = products.find(p => p.id.toString() === value);
      if (prod) {
        updated[index].pricePerLiter = parseFloat(prod.price || 0);
        // Set default size
        const defaultSize = prod.sizes && prod.sizes.length ? prod.sizes[0] : '1L';
        updated[index].size = defaultSize;
        updated[index].selling_price = Math.round(updated[index].pricePerLiter * getPriceMultiplier(defaultSize));
      }
    } else if (field === 'size') {
      updated[index].size = value;
      updated[index].selling_price = Math.round(updated[index].pricePerLiter * getPriceMultiplier(value));
    } else if (field === 'quantity') {
      updated[index].quantity = parseInt(value, 10) || 0;
    }
    setItems(updated);
  };

  // Auto Calculations
  const grandTotal = items.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0);
  const gstAmount = parseFloat(((grandTotal * 5) / 105).toFixed(2)); // 5% GST inclusive
  const subtotal = parseFloat((grandTotal - gstAmount).toFixed(2));

  // Check if stock is sufficient for all rows
  const isStockValid = () => {
    for (const item of items) {
      if (!item.product_id) continue;
      const prod = products.find(p => p.id.toString() === item.product_id);
      if (!prod) return false;
      const stock = prod.stock || 0;
      if (stock < item.quantity) {
        return false;
      }
    }
    return true;
  };

  // Generate and Upload PDF Invoice
  const generatePDF = async (invoiceNumber: string, customer: any, saleItems: any[]) => {
    const doc = new jsPDF();
    const storeDetails = {
      name: "Revathi Store",
      address: "20, Kannimar Kovil Street, Vadugapatti, Theni",
      state: "Tamil Nadu, Pincode: 625603",
      phone: "Mobile: +91 7904523194"
    };

    // Store Info Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Primary Blue
    doc.text(storeDetails.name, 20, 20);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(storeDetails.address, 20, 26);
    doc.text(storeDetails.state, 20, 31);
    doc.text(storeDetails.phone, 20, 36);

    // Invoice Meta (Top Right)
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(50);
    doc.text("TAX INVOICE", 140, 20);
    
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.text(`Invoice No: ${invoiceNumber}`, 140, 26);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 31);
    doc.text(`Payment: ${paymentType.toUpperCase()}`, 140, 36);

    doc.line(20, 42, 190, 42); // Header Divider

    // Customer Details
    doc.setFont("Helvetica", "bold");
    doc.text("Billed To:", 20, 50);
    doc.setFont("Helvetica", "normal");
    doc.text(`Name: ${customer.name}`, 20, 56);
    doc.text(`Phone: ${customer.mobile}`, 20, 61);
    if (customer.address) doc.text(`Address: ${customer.address}`, 20, 66);
    if (customer.gst_number) doc.text(`GSTIN: ${customer.gst_number}`, 20, 71);

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 80, 170, 8, "F");
    doc.setFont("Helvetica", "bold");
    doc.text("S.No", 22, 85);
    doc.text("Product Item", 35, 85);
    doc.text("Size", 95, 85);
    doc.text("Rate", 115, 85);
    doc.text("Qty", 140, 85);
    doc.text("Total (INR)", 165, 85);

    doc.setFont("Helvetica", "normal");
    let y = 94;
    saleItems.forEach((item, index) => {
      const prod = products.find(p => p.id.toString() === item.product_id);
      const name = prod ? prod.name : "Product";
      doc.text(String(index + 1), 22, y);
      doc.text(name, 35, y);
      doc.text(item.size, 95, y);
      doc.text(`Rs.${item.selling_price}`, 115, y);
      doc.text(String(item.quantity), 140, y);
      doc.text(`Rs.${(item.quantity * item.selling_price).toFixed(2)}`, 165, y);
      y += 8;
    });

    doc.line(20, y - 2, 190, y - 2);

    // Totals Box
    y += 4;
    doc.setFont("Helvetica", "normal");
    doc.text("Subtotal (Exclusive GST):", 110, y);
    doc.text(`Rs.${subtotal.toFixed(2)}`, 165, y);

    y += 6;
    doc.text("GST Included (5%):", 110, y);
    doc.text(`Rs.${gstAmount.toFixed(2)}`, 165, y);

    y += 8;
    doc.setFont("Helvetica", "bold");
    doc.text("GRAND TOTAL:", 110, y);
    doc.text(`Rs.${grandTotal.toFixed(2)}`, 165, y);

    // Footer Devotion Note
    y += 20;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Thank you for your purchase from Revathi Store. Retain invoice for returns/support.", 20, y);

    // Upload PDF to Server
    const blob = doc.output('blob');
    const file = new File([blob], `${invoiceNumber}.pdf`, { type: 'application/pdf' });
    const fd = new FormData();
    fd.append('file', file);
    fd.append('invoice_number', invoiceNumber);

    try {
      const uploadRes = await fetch('/api/admin/invoices/upload', {
        method: 'POST',
        body: fd
      });
      const uploadJson = await uploadRes.json();
      if (uploadJson.success) {
        setCreatedPdfUrl(uploadJson.pdfUrl);
      }
    } catch (e) {
      console.error('Invoice upload failed:', e);
    }
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.some(item => !item.product_id || item.quantity <= 0)) {
      alert('Please fill out all product rows with positive quantities.');
      return;
    }

    if (!isStockValid()) {
      alert('Cannot log sale. One or more items exceed current available warehouse stock levels.');
      return;
    }

    setSubmitting(true);

    const payload = {
      customer_id: isNewCustomer ? null : customerId,
      customer_name: isNewCustomer ? customerName : null,
      customer_mobile: isNewCustomer ? customerMobile : null,
      customer_address: isNewCustomer ? customerAddress : null,
      customer_gst: isNewCustomer ? customerGst : null,
      total_amount: grandTotal,
      payment_type: paymentType,
      items: items.map(item => ({
        product_id: parseInt(item.product_id, 10),
        quantity: item.quantity,
        selling_price: item.selling_price
      }))
    };

    try {
      const res = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        // Trigger client-side PDF generation
        const invNum = json.data.invoice_number;
        const custObj = json.data.customer;
        
        await generatePDF(invNum, custObj, items);

        setCreatedInvoiceNum(invNum);
        setCreatedInvoiceAmt(grandTotal);
        setCreatedCustomerName(custObj.name);
        setCreatedCustomerMobile(custObj.mobile);

        // Show Invoice Sharing Modal
        setShowSuccessModal(true);

        // Reset Form
        setCustomerId('');
        setIsNewCustomer(false);
        setCustomerName('');
        setCustomerMobile('');
        setCustomerAddress('');
        setCustomerGst('');
        setItems([{ product_id: '', size: '1L', quantity: 1, selling_price: 0, pricePerLiter: 0 }]);
        
        // Refresh product stock local cache
        const prodRes = await fetch('/api/admin/products');
        const prodJson = await prodRes.json();
        if (prodJson.success) setProducts(prodJson.data);
      } else {
        alert(json.message || 'Failed to record sale');
      }
    } catch (e) {
      alert('Error recording sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppShare = async () => {
    // Log share action
    await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_number: createdInvoiceNum })
    });

    const docLink = `${window.location.origin}${createdPdfUrl}`;
    const textMsg = `Hello ${createdCustomerName}

Invoice Number: ${createdInvoiceNum}
Amount: Rs.${createdInvoiceAmt.toFixed(2)}

Thank you for purchasing from Revathi Store.

Invoice PDF Link: ${docLink}`;

    const formattedMobile = createdCustomerMobile.replace(/\D/g, '');
    const mobileWithCountry = formattedMobile.startsWith('91') ? formattedMobile : `91${formattedMobile}`;
    const waUrl = `https://api.whatsapp.com/send?phone=${mobileWithCountry}&text=${encodeURIComponent(textMsg)}`;
    
    window.open(waUrl, '_blank');
    setShowSuccessModal(false);
  };

  return (
    <main className="p-6 md:p-10 bg-neutral-50 min-h-[calc(100vh-80px)] space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-800">Billing Counter</h1>
        <p className="text-sm text-neutral-500 mt-1">Generate customer tax receipts, calculate inclusive GST, and check item warehouse volumes.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <form onSubmit={handleSaveSale} className="xl:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-neutral-800 border-b pb-3">Billed Customer Details</h3>
            
            {/* Customer Selector Options */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 font-bold text-sm text-neutral-700">
                <input
                  type="radio"
                  checked={!isNewCustomer}
                  onChange={() => setIsNewCustomer(false)}
                  className="h-4 w-4 text-primary"
                />
                Existing Directory Customer
              </label>
              <label className="flex items-center gap-2 font-bold text-sm text-neutral-700">
                <input
                  type="radio"
                  checked={isNewCustomer}
                  onChange={() => setIsNewCustomer(true)}
                  className="h-4 w-4 text-primary"
                />
                + Register New Walk-in
              </label>
            </div>

            {!isNewCustomer ? (
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Choose Customer *</label>
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  required={!isNewCustomer}
                  className="w-full border p-2.5 rounded-xl text-sm bg-white"
                >
                  <option value="">-- Select Customer Profile --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Customer Name *</label>
                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="e.g. Rajesh Kumar" className="w-full border p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mobile / Phone *</label>
                  <input type="text" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} required placeholder="e.g. 9876543210" className="w-full border p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">GSTIN Number</label>
                  <input type="text" value={customerGst} onChange={e => setCustomerGst(e.target.value)} placeholder="e.g. 33AAAAA1111A1Z1" className="w-full border p-2.5 rounded-xl text-sm uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Billing Address</label>
                  <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="City / Street Details" className="w-full border p-2.5 rounded-xl text-sm" />
                </div>
              </div>
            )}

            <h3 className="text-lg font-bold text-neutral-800 border-b pb-3 pt-4">Billed Products List</h3>

            {/* Products Rows */}
            <div className="space-y-4">
              {items.map((item, index) => {
                const selectedProd = products.find(p => p.id.toString() === item.product_id);
                const stock = selectedProd ? selectedProd.stock || 0 : 0;
                const lowStock = stock < item.quantity;
                return (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-neutral-50 p-4 rounded-xl border border-neutral-100 relative group">
                    <div className="flex-1">
                      <select
                        value={item.product_id}
                        onChange={e => handleItemChange(index, 'product_id', e.target.value)}
                        required
                        className="w-full border p-2 rounded-lg text-sm bg-white"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock || 0}L)</option>
                        ))}
                      </select>
                      {item.product_id && (
                        <p className={`text-xs mt-1 font-bold ${lowStock ? 'text-red-500' : 'text-neutral-500'}`}>
                          Available Stock: {stock}L {lowStock ? ' (Insufficient Stock!)' : ''}
                        </p>
                      )}
                    </div>
                    <div className="w-full md:w-32">
                      <select
                        value={item.size}
                        onChange={e => handleItemChange(index, 'size', e.target.value)}
                        disabled={!item.product_id}
                        className="w-full border p-2 rounded-lg text-sm bg-white disabled:opacity-40"
                      >
                        {selectedProd?.sizes?.map((size: string) => (
                          <option key={size} value={size}>{size}</option>
                        )) || <option value="1L">1L</option>}
                      </select>
                    </div>
                    <div className="w-full md:w-28">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                        disabled={!item.product_id}
                        required
                        className="w-full border p-2 rounded-lg text-sm disabled:opacity-40"
                      />
                    </div>
                    <div className="w-full md:w-28 text-right font-black text-neutral-800 text-sm py-2">
                      ₹{(item.quantity * item.selling_price).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={items.length === 1}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-4 py-2 border border-dashed border-primary text-primary font-bold text-xs rounded-xl hover:bg-primary/5 transition-colors"
              >
                + Add Row
              </button>
            </div>
          </div>

          <div className="border-t pt-4 mt-6 flex justify-between items-center">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Payment Method *</label>
              <select
                value={paymentType}
                onChange={e => setPaymentType(e.target.value)}
                className="border p-2.5 rounded-xl text-sm bg-white w-48 font-bold"
              >
                <option value="upi">UPI (GPay/PhonePe)</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting || !isStockValid()}
              className={`px-6 py-3 font-bold rounded-xl shadow-md text-sm text-white transition-all flex items-center gap-2 ${
                isStockValid() && !submitting 
                  ? 'bg-primary hover:bg-primary/95 shadow-primary/20 cursor-pointer' 
                  : 'bg-neutral-300 cursor-not-allowed shadow-none'
              }`}
            >
              {submitting ? 'Generating Invoice…' : 'Generate & Print Invoice'}
            </button>
          </div>
        </form>

        {/* Invoice Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between h-fit space-y-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-800 border-b pb-3">Bill Valuation</h3>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Subtotal (Exclusive GST):</span>
                <span className="font-semibold text-neutral-800">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Inclusive GST (5%):</span>
                <span className="font-semibold text-neutral-800">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-neutral-800 font-extrabold">
                <span>GRAND TOTAL:</span>
                <span className="text-xl text-primary font-black">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-2 text-xs text-neutral-500 leading-relaxed font-inter">
            <h4 className="font-bold text-neutral-700">Billing Policy Notes</h4>
            <p>1. Invoices are generated with GST inclusive rates by default.</p>
            <p>2. Stock verification prevents negative stock logs on save.</p>
            <p>3. On printing, PDF gets saved to server records, and click-to-chat sharing activates.</p>
          </div>
        </div>
      </div>

      {/* Invoice Success sharing Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border animate-in fade-in zoom-in duration-200 text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-800">Sale Logged Successfully</h3>
              <p className="text-xs text-neutral-400 mt-1">Invoice: <strong>{createdInvoiceNum}</strong> &middot; Amount: <strong>₹{createdInvoiceAmt}</strong></p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleWhatsAppShare}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-green-100"
              >
                Share Invoice on WhatsApp
              </button>
              <a
                href={createdPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 border text-neutral-700 font-bold rounded-xl text-sm hover:bg-neutral-50 block"
              >
                Open / Print PDF Invoice
              </a>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 text-xs text-neutral-400 hover:underline"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
