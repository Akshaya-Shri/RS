"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function AdminSettingsPage() {
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [qrUrl, setQrUrl] = useState('/images/qr-payment.png');

  const handleUploadNewQR = async () => {
    if (!formFile) {
       alert("Please select a valid QR code image (PNG, JPG) first.");
       return;
    }

    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', formFile);
    fd.append('isQR', 'true'); // tells API to save as qr-payment.png

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        // Cache bypass trick to show the new image instantly
        setQrUrl(`${json.url}?t=${new Date().getTime()}`);
        setFormFile(null);
        alert("Payment QR Code Updated Successfully!");
      } else {
        alert("Upload failed.");
      }
    } catch (e) {
      alert("Error occurred during upload.");
    }
    setIsUploading(false);
  };

  return (
    <div className="p-6 md:p-10 flex-1 w-full bg-white sm:bg-transparent">
      <h1 className="text-2xl font-bold text-foreground mb-8">Payment & Settings Settings</h1>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 max-w-2xl">
         <h2 className="text-xl font-bold mb-2">Checkout QR Code</h2>
         <p className="text-neutral-500 text-sm mb-8">
            Upload your business GPay, PhonePe, or Paytm QR code here. This automatically displays to customers on the &apos;Scan & Pay&apos; checkout screen.
         </p>

         <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Current QR Display */}
            <div className="w-48 h-48 border-2 border-dashed border-neutral-200 rounded-2xl flex items-center justify-center bg-neutral-50 relative overflow-hidden shrink-0">
               <Image src={qrUrl} alt="Current Payment QR" fill className="object-cover p-2" unoptimized />
            </div>

            {/* Upload Area */}
            <div className="flex-1 space-y-4">
               <div>
                 <label className="block text-sm font-bold text-neutral-600 mb-2">Upload New QR Image</label>
                 <div className="relative border-2 border-primary/20 rounded-xl p-4 text-center hover:bg-primary/5 transition-colors cursor-pointer bg-neutral-50">
                    <input type="file" accept="image/*" onChange={e => setFormFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {formFile ? (
                       <span className="text-primary font-bold">{formFile.name}</span>
                    ) : (
                       <span className="text-neutral-500 font-inter text-sm">Click here or drag a file to select</span>
                    )}
                 </div>
               </div>

               <button 
                  onClick={handleUploadNewQR}
                  disabled={!formFile || isUploading}
                  className="w-full py-3 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {isUploading ? "Uploading & Replacing..." : "Save New Payment QR"}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
