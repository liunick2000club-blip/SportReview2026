"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileDown, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: "Import successful!", count: data.count });
        setFile(null); // Clear selection
      } else {
        setResult({ success: false, message: data.error || "Upload failed." });
      }
    } catch (error) {
      setResult({ success: false, message: "A network error occurred." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white border-b border-gray-200 h-16 sticky top-0 z-10 shadow-sm flex items-center">
        <div className="max-w-3xl mx-auto w-full px-4 flex items-center">
          <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Import Activities</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">1. Download Template</h2>
            <p className="text-sm text-gray-600">
              Download our standard CSV template to ensure your data is formatted correctly before uploading.
            </p>
            <a 
              href="/import_template.csv" 
              download
              className="inline-flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-800 transition"
            >
              <FileDown size={18} />
              <span>Download Template.csv</span>
            </a>
          </div>

          <div className="border-t border-gray-100 pt-8 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">2. Upload Data</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select your filled CSV file. Make sure the headers match the template exactly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 transition-all cursor-pointer"
              />
              
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Upload size={18} />
                )}
                <span>{uploading ? "Importing..." : "Import"}</span>
              </button>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-xl flex items-start space-x-3 ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {result.success ? <CheckCircle2 size={20} className="mt-0.5" /> : <AlertCircle size={20} className="mt-0.5" />}
              <div>
                <p className="font-medium">{result.message}</p>
                {result.success && result.count !== undefined && (
                  <p className="text-sm mt-1 opacity-90">Successfully imported {result.count} records.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
