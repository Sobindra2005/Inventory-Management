import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
            <span className="flex w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            OCR Engine Active
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Document Extraction</span>
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Upload your receipts, bills, and invoices. Our AI instantly extracts the underlying text using PaddleOCR.
          </p>
        </div>
        
        <FileUpload />
      </div>
    </main>
  );
}
