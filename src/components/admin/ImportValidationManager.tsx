import React, { useState } from 'react';
import { 
  RateRecord, 
  ImportValidationReport 
} from '../../types/catalogue';
import { 
  validateImportRecords, 
  executeDatabaseImport 
} from '../../services/catalogueService';
import { 
  FileSpreadsheet, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  ArrowRight,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import { Button, Badge } from '../ui/DesignSystem';

export const ImportValidationManager: React.FC = () => {
  // Process steps:
  // SOURCE -> EXTRACT -> STRUCTURE -> VALIDATE -> DUPLICATE CHECK -> PREVIEW -> APPROVE -> IMPORT -> VERIFY
  const [currentStep, setCurrentStep] = useState<
    'SOURCE' | 'STRUCTURE_VALIDATE' | 'PREVIEW' | 'VERIFY'
  >('SOURCE');

  const [rawText, setRawText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [report, setReport] = useState<ImportValidationReport | null>(null);
  const [importedCount, setImportedCount] = useState<number>(0);

  // Sample CSV / JSON template helper
  const handleLoadSampleData = () => {
    const sample = JSON.stringify([
      {
        test_id: "BLD-T030",
        test_name: "Serum Electrolytes (Na, K, Cl)",
        category: "Biochemistry",
        method: "Ion Selective Electrode (ISE)",
        sample: "Serum (2 ml)",
        sample_instructions: "No hemolysis. Fasting not mandatory.",
        clinical_information: "Evaluates electrolyte and fluid balance, acid-base status, and cardiac rhythm regulation.",
        reporting_time: "Same Day",
        general_price: 350,
        corporate_price: 300,
        is_active: true
      },
      {
        test_id: "BLD-T031",
        test_name: "Serum Creatinine",
        category: "Biochemistry",
        method: "Modified Jaffe Kinetic",
        sample: "Serum (2 ml)",
        sample_instructions: "Avoid excessive meat intake before test.",
        clinical_information: "Key indicator of glomerular filtration rate (GFR) and kidney excretory function.",
        reporting_time: "3 - 5 Hours",
        general_price: 150,
        corporate_price: 120,
        is_active: true
      },
      {
        test_id: "BLD-T032",
        test_name: "Urine Culture & Antibiotic Sensitivity",
        category: "Clinical Pathology",
        method: "Semi-quantitative loop streak & Kirby-Bauer",
        sample: "Sterile Mid-Stream Urine (10 ml)",
        sample_instructions: "Collect in sterile container prior to initiating antibiotic therapy.",
        clinical_information: "Isolates and identifies bacterial pathogens causing UTI and tests drug susceptibility.",
        reporting_time: "48 - 72 Hours",
        general_price: 600,
        corporate_price: 500,
        is_active: true
      },
      {
        test_id: "BLD-T033",
        test_name: "Serum Amylase",
        category: "[REVIEW REQUIRED]",
        method: "Enzymatic Colorimetric",
        sample: "Serum (2 ml)",
        sample_instructions: "No fasting required.",
        clinical_information: "Diagnoses acute pancreatitis and pancreatic inflammation.",
        reporting_time: "Same Day",
        general_price: null,
        corporate_price: 400,
        is_active: true
      }
    ], null, 2);
    setRawText(sample);
  };

  // Run EXTRACT -> STRUCTURE -> VALIDATE -> DUPLICATE CHECK
  const handleValidateSource = () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);

    try {
      let parsed: any[];

      // Support JSON format or CSV parsing
      if (rawText.trim().startsWith('[') || rawText.trim().startsWith('{')) {
        const obj = JSON.parse(rawText);
        parsed = Array.isArray(obj) ? obj : [obj];
      } else {
        // Simple CSV parser
        const lines = rawText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        parsed = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const entry: any = {};
          headers.forEach((h, idx) => {
            entry[h] = values[idx] !== undefined ? values[idx] : null;
          });
          return entry;
        });
      }

      const validationReport = validateImportRecords(parsed);
      setReport(validationReport);
      setCurrentStep('PREVIEW');
    } catch (e: any) {
      alert(`Parsing error: ${e.message}. Please verify JSON or CSV format.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // APPROVE & IMPORT
  const handleApproveAndImport = async () => {
    if (!report || report.recordsToImport.length === 0) return;
    setIsProcessing(true);

    try {
      const count = await executeDatabaseImport(report.recordsToImport);
      setImportedCount(count);
      setCurrentStep('VERIFY');
    } catch (e: any) {
      alert(`Database import failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Controlled Import Pipeline
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Test & Rate List Import Engine
            </h2>
            <p className="text-xs text-slate-500">
              Pipeline: SOURCE ➔ EXTRACT ➔ STRUCTURE ➔ VALIDATE ➔ DUPLICATE CHECK ➔ PREVIEW ➔ APPROVE ➔ IMPORT ➔ VERIFY
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSampleData}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              Load Sample Source Data
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: SOURCE ENTRY */}
      {currentStep === 'SOURCE' && (
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            Paste B.L. Diagnostic Center Rate List Source (JSON / CSV)
          </label>
          <textarea
            rows={10}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw rate list array here or click 'Load Sample Source Data' above..."
            className="w-full p-3.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] bg-slate-50"
          />

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-500">
              Non-destructive parser. Never silences pricing or nomenclature conflicts.
            </span>
            <Button
              variant="primary"
              size="md"
              disabled={!rawText.trim() || isProcessing}
              onClick={handleValidateSource}
            >
              {isProcessing ? 'Validating...' : 'Extract & Validate Source'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: PREVIEW & AUDIT REPORT */}
      {currentStep === 'PREVIEW' && report && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium">Total Records</span>
              <span className="text-xl font-black text-slate-900">{report.totalRecords}</span>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
              <span className="text-emerald-700 block font-medium">Valid for Import</span>
              <span className="text-xl font-black text-emerald-800">{report.validRecords}</span>
            </div>
            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
              <span className="text-amber-700 block font-medium">Duplicate Names</span>
              <span className="text-xl font-black text-amber-800">{report.duplicateNames.length}</span>
            </div>
            <div className="bg-red-50 p-3.5 rounded-xl border border-red-200">
              <span className="text-red-700 block font-medium">Price/Naming Issues</span>
              <span className="text-xl font-black text-red-800">
                {report.missingPrices.length + report.conflictingValues.length}
              </span>
            </div>
          </div>

          {/* Validation Audit Details (Explicit Conflict Reporting) */}
          <div className="space-y-3">
            {report.duplicateNames.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  Duplicate Test Names Detected ({report.duplicateNames.length})
                </div>
                <ul className="list-disc pl-5 space-y-0.5 pt-1">
                  {report.duplicateNames.map((d, i) => (
                    <li key={i}>
                      &ldquo;{d.name}&rdquo; appears {d.occurrences} times in source file.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.missingPrices.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  Missing Source Rates Marked as [CONTENT REQUIRED] ({report.missingPrices.length})
                </div>
                <p className="text-[11px] text-amber-800">
                  Tests: {report.missingPrices.map(p => `${p.test_name} (${p.test_id})`).join(', ')}
                </p>
              </div>
            )}

            {report.conflictingValues.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-xl space-y-1 text-xs text-red-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-red-700" />
                  Conflicting Values Detected ({report.conflictingValues.length})
                </div>
                <ul className="list-disc pl-5 space-y-0.5 pt-1">
                  {report.conflictingValues.map((c, i) => (
                    <li key={i}>
                      <strong>{c.test_name}:</strong> {c.conflict}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Records Table Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Structured Records Preview ({report.recordsToImport.length})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Test Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Sample</th>
                    <th className="p-3">General Rate</th>
                    <th className="p-3">Corp Rate</th>
                    <th className="p-3">Review Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.recordsToImport.map(r => (
                    <tr key={r.test_id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{r.test_id}</td>
                      <td className="p-3 font-medium text-slate-900">{r.test_name}</td>
                      <td className="p-3">{r.category}</td>
                      <td className="p-3 text-slate-500">{r.sample || '-'}</td>
                      <td className="p-3 font-bold text-[#0F294A]">
                        {r.general_price !== null ? `₹${r.general_price}` : '[CONTENT REQUIRED]'}
                      </td>
                      <td className="p-3 text-slate-500">
                        {r.corporate_price !== null ? `₹${r.corporate_price}` : '-'}
                      </td>
                      <td className="p-3">
                        {r.needs_review ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                            REVIEW REQ
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep('SOURCE')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Back to Source Editor
            </button>

            <Button
              variant="secondary"
              size="md"
              disabled={isProcessing}
              onClick={handleApproveAndImport}
            >
              {isProcessing ? 'Writing to Database...' : `Approve & Import (${report.validRecords} Records)`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: VERIFY CONFIRMATION */}
      {currentStep === 'VERIFY' && (
        <div className="text-center py-10 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Database Import & Verification Complete
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Successfully committed <strong className="text-slate-900">{importedCount}</strong> test records into the live database. Changes are immediately reflected in the public /tests catalogue.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRawText('');
              setReport(null);
              setCurrentStep('SOURCE');
            }}
          >
            Import Another Batch
          </Button>
        </div>
      )}
    </div>
  );
};
