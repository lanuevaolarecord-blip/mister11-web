import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, Download, CheckCircle, AlertTriangle, X, ArrowRight, ArrowLeft, Trash2, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { logGrowthEvent } from '../../utils/growthAnalytics';
import { showToast } from '../../utils/toast';
import './CsvPlayerImportModal.css';

const CANONICAL_POSITIONS = ['POR', 'DEF', 'LTD', 'LTI', 'MCD', 'MC', 'MCO', 'EXT', 'DEL'];

const POSITION_NORMALIZATION_MAP = {
  // POR
  'POR': 'POR', 'GK': 'POR', 'PORTERO': 'POR', 'GOALKEEPER': 'POR', 'ARQUERO': 'POR', 'GUARDAMETA': 'POR',
  // DEF
  'DEF': 'DEF', 'CENTRAL': 'DEF', 'DEFENSA': 'DEF', 'CB': 'DEF', 'DEFENDER': 'DEF', 'DF': 'DEF',
  // LTD
  'LTD': 'LTD', 'LATERAL DERECHO': 'LTD', 'RB': 'LTD', 'RIGHT BACK': 'LTD', 'CARRILERO DERECHO': 'LTD',
  // LTI
  'LTI': 'LTI', 'LATERAL IZQUIERDO': 'LTI', 'LB': 'LTI', 'LEFT BACK': 'LTI', 'CARRILERO IZQUIERDO': 'LTI',
  // MCD
  'MCD': 'MCD', 'PIVOTE': 'MCD', 'CDM': 'MCD', 'MEDIOCENTRO DEFENSIVO': 'MCD', 'DEFENSIVE MIDFIELDER': 'MCD',
  // MC
  'MC': 'MC', 'CENTROCAMPISTA': 'MC', 'CM': 'MC', 'MEDIO': 'MC', 'VOLANTE': 'MC', 'MIDFIELDER': 'MC', 'MEDIOCENTRO': 'MC',
  // MCO
  'MCO': 'MCO', 'MEDIAPUNTA': 'MCO', 'CAM': 'MCO', 'ENGANCHE': 'MCO', 'ATTACKING MIDFIELDER': 'MCO', 'VOLANTE OFENSIVO': 'MCO',
  // EXT
  'EXT': 'EXT', 'EXTREMO': 'EXT', 'W': 'EXT', 'WING': 'EXT', 'WINGER': 'EXT', 'EXTREMO DERECHO': 'EXT', 'EXTREMO IZQUIERDO': 'EXT', 'RW': 'EXT', 'LW': 'EXT',
  // DEL
  'DEL': 'DEL', 'DELANTERO': 'DEL', 'ST': 'DEL', 'FORWARD': 'DEL', 'PUNTA': 'DEL', 'CF': 'DEL', 'STRIKER': 'DEL', 'CENTRODELANTERO': 'DEL'
};

export const normalizePosition = (raw) => {
  if (!raw) return '';
  const clean = String(raw).trim().toUpperCase();
  return POSITION_NORMALIZATION_MAP[clean] || '';
};

export const normalizeDate = (raw) => {
  if (!raw) return '';
  if (typeof raw === 'number') {
    // Excel serial date
    const date = new Date(Math.round((raw - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  const s = String(raw).trim();
  // Match YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Match DD/MM/YYYY or DD-MM-YYYY
  const parts = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (parts) {
    const day = parts[1].padStart(2, '0');
    const month = parts[2].padStart(2, '0');
    const year = parts[3];
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1950 && parsed.getFullYear() <= new Date().getFullYear()) {
    return parsed.toISOString().split('T')[0];
  }
  return '';
};

export default function CsvPlayerImportModal({
  isOpen,
  onClose,
  existingPlayers = [],
  maxPlayersAllowed = 23,
  onImportSuccess,
  userId
}) {
  const { t, isEn } = useTranslation();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Preview
  const [fileData, setFileData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [unsupportedError, setUnsupportedError] = useState('');

  // Mapping state: field -> selectedHeader
  const [columnMapping, setColumnMapping] = useState({
    name: '',
    number: '',
    position: '',
    birthDate: '',
    email: ''
  });

  // Validated rows for Step 3
  const [previewRows, setPreviewRows] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateContent = isEn
      ? "Name,Number,Position,Date of Birth,Email\nCharles Smith,1,GK,2008-03-15,charles@example.com\nAlex Jones,4,DEF,2007-08-22,alex@example.com\nMark Taylor,8,CM,2008-01-10,mark@example.com\nLuke Brown,9,ST,2007-11-05,luke@example.com\n"
      : "Nombre,Dorsal,Posición,Fecha Nacimiento,Email\nCarlos Pérez,1,POR,2008-03-15,carlos@ejemplo.com\nAlejandro Ruiz,4,DEF,2007-08-22,alejandro@ejemplo.com\nMarcos Silva,8,MC,2008-01-10,marcos@ejemplo.com\nLucas Gómez,9,DEL,2007-11-05,lucas@ejemplo.com\n";

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', isEn ? 'template_squad_en.csv' : 'plantilla_jugadores_es.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseUploadedFile = (file) => {
    setUnsupportedError('');
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (!json || json.length === 0) {
            setUnsupportedError(t('csv.errorEmptyFile'));
            return;
          }
          const parsedHeaders = json[0].map(h => String(h || '').trim()).filter(Boolean);
          const parsedRows = json.slice(1).filter(r => r && r.some(cell => cell !== undefined && cell !== ''));
          setupMapping(parsedHeaders, parsedRows);
        } catch (err) {
          console.error('[CSV Import] XLSX parse error:', err);
          setUnsupportedError(t('csv.errorParsing'));
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            setUnsupportedError(t('csv.errorEmptyFile'));
            return;
          }
          const parsedHeaders = results.meta.fields || Object.keys(results.data[0] || {});
          setupMapping(parsedHeaders, results.data);
        },
        error: (err) => {
          console.error('[CSV Import] Papa parse error:', err);
          setUnsupportedError(t('csv.errorParsing'));
        }
      });
    } else {
      setUnsupportedError(t('csv.errorUnsupportedFormat'));
    }
  };

  const setupMapping = (foundHeaders, rows) => {
    setHeaders(foundHeaders);
    setRawRows(rows);

    const autoMapping = {
      name: '',
      number: '',
      position: '',
      birthDate: '',
      email: ''
    };

    foundHeaders.forEach(h => {
      const lower = h.toLowerCase().trim();
      if (!autoMapping.name && /nombre|jugador|name|player/i.test(lower)) {
        autoMapping.name = h;
      } else if (!autoMapping.number && /dorsal|numero|número|#|number|num/i.test(lower)) {
        autoMapping.number = h;
      } else if (!autoMapping.position && /posicion|posición|pos|position|demarcacion|demarcación/i.test(lower)) {
        autoMapping.position = h;
      } else if (!autoMapping.birthDate && /nacimiento|birth|dob|fecha|edad/i.test(lower)) {
        autoMapping.birthDate = h;
      } else if (!autoMapping.email && /email|correo|mail/i.test(lower)) {
        autoMapping.email = h;
      }
    });

    setColumnMapping(autoMapping);
    setStep(2);
  };

  const handleProcessPreview = () => {
    const existingNumbers = new Set(
      existingPlayers.map(p => String(p.number || p.dorsal || '').trim())
    );

    const seenNumbersInFile = new Set();
    const currentTotal = existingPlayers.length;

    const validated = rawRows.map((row, idx) => {
      const getValue = (fieldKey) => {
        const headerName = columnMapping[fieldKey];
        if (!headerName) return '';
        if (Array.isArray(row)) {
          const colIndex = headers.indexOf(headerName);
          return colIndex >= 0 ? row[colIndex] : '';
        }
        return row[headerName] !== undefined ? row[headerName] : '';
      };

      const rawName = String(getValue('name') || '').trim();
      const rawNumber = String(getValue('number') || '').trim();
      const rawPos = String(getValue('position') || '').trim();
      const rawBirth = getValue('birthDate');
      const rawEmail = String(getValue('email') || '').trim();

      const normalizedPos = normalizePosition(rawPos);
      const parsedNumber = parseInt(rawNumber, 10);
      const normalizedBirthDate = normalizeDate(rawBirth);

      const errors = [];

      // Validar Nombre
      if (!rawName) {
        errors.push(t('csv.errorMissingName'));
      }

      // Validar Dorsal
      if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 99) {
        errors.push(t('csv.errorInvalidNumber'));
      } else {
        const numStr = String(parsedNumber);
        if (existingNumbers.has(numStr)) {
          errors.push(t('csv.errorDuplicateNumberTeam'));
        }
        if (seenNumbersInFile.has(numStr)) {
          errors.push(t('csv.errorDuplicateNumberFile'));
        }
        seenNumbersInFile.add(numStr);
      }

      // Validar Posición
      if (!normalizedPos) {
        errors.push(t('csv.errorInvalidPosition'));
      }

      // Validar Plan Limit
      if (currentTotal + idx >= maxPlayersAllowed) {
        errors.push(t('csv.errorPlanLimitExceeded'));
      }

      return {
        id: `preview-${idx}`,
        originalIndex: idx,
        name: rawName,
        number: isNaN(parsedNumber) ? rawNumber : parsedNumber,
        position: normalizedPos || rawPos,
        birthDate: normalizedBirthDate,
        email: rawEmail,
        errors,
        isValid: errors.length === 0
      };
    });

    setPreviewRows(validated);
    setStep(3);
  };

  const handleDeletePreviewRow = (id) => {
    setPreviewRows(prev => prev.filter(r => r.id !== id));
  };

  const handleConfirmImport = async () => {
    const validRows = previewRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    try {
      if (onImportSuccess) {
        await onImportSuccess(validRows);
      }

      if (userId) {
        await logGrowthEvent(userId, 'csv_import_completed', {
          count: validRows.length
        });
      }

      showToast(t('csv.importSuccessToast'), 'success');
      onClose();
    } catch (err) {
      console.error('[CSV Import] Error saving players:', err);
      showToast(t('csv.importErrorToast'), 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = previewRows.filter(r => r.isValid).length;
  const invalidCount = previewRows.filter(r => !r.isValid).length;

  return (
    <div className="csv-modal-overlay" onClick={onClose}>
      <div className="csv-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="csv-modal-header">
          <div className="csv-modal-title-wrap">
            <FileSpreadsheet className="csv-modal-icon" size={24} />
            <h2 className="csv-modal-title">{t('csv.modalTitle')}</h2>
          </div>
          <button type="button" className="csv-modal-close-btn" onClick={onClose} aria-label={t('btn.close')}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="csv-stepper">
          <div className={`csv-step-indicator ${step >= 1 ? 'active' : ''}`}>
            <span className="csv-step-num">1</span>
            <span className="csv-step-label">{t('csv.stepUpload')}</span>
          </div>
          <div className="csv-step-line" />
          <div className={`csv-step-indicator ${step >= 2 ? 'active' : ''}`}>
            <span className="csv-step-num">2</span>
            <span className="csv-step-label">{t('csv.stepMapping')}</span>
          </div>
          <div className="csv-step-line" />
          <div className={`csv-step-indicator ${step >= 3 ? 'active' : ''}`}>
            <span className="csv-step-num">3</span>
            <span className="csv-step-label">{t('csv.stepPreview')}</span>
          </div>
        </div>

        {/* Body */}
        <div className="csv-modal-body">
          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="csv-step-content">
              <div
                className="csv-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    parseUploadedFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <Upload size={40} className="csv-dropzone-icon" />
                <h3 className="csv-dropzone-title">{t('csv.dropzoneTitle')}</h3>
                <p className="csv-dropzone-desc">{t('csv.dropzoneDesc')}</p>
                <button type="button" className="csv-select-file-btn">
                  {t('csv.browseFile')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.xlsx,.xls,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      parseUploadedFile(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {unsupportedError && (
                <div className="csv-unsupported-note">
                  <AlertTriangle size={18} />
                  <span>{unsupportedError}</span>
                </div>
              )}

              <div className="csv-template-download-box">
                <div>
                  <div className="csv-template-title">{t('csv.templateTitle')}</div>
                  <div className="csv-template-subtitle">{t('csv.templateSubtitle')}</div>
                </div>
                <button
                  type="button"
                  className="csv-template-btn"
                  onClick={handleDownloadTemplate}
                >
                  <Download size={16} />
                  <span>{t('csv.downloadTemplate')}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Mapping */}
          {step === 2 && (
            <div className="csv-step-content">
              <p className="csv-mapping-intro">{t('csv.mappingIntro')}</p>
              
              <div className="csv-mapping-grid">
                {/* Name */}
                <div className="csv-mapping-row">
                  <div className="csv-field-info">
                    <span className="csv-field-name">{t('csv.fieldPlayerName')} *</span>
                    <span className="csv-field-req">{t('csv.fieldRequired')}</span>
                  </div>
                  <select
                    className="csv-mapping-select"
                    value={columnMapping.name}
                    onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                  >
                    <option value="">{t('csv.selectColumn')}</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Number */}
                <div className="csv-mapping-row">
                  <div className="csv-field-info">
                    <span className="csv-field-name">{t('csv.fieldDorsal')} *</span>
                    <span className="csv-field-req">{t('csv.fieldRequired')}</span>
                  </div>
                  <select
                    className="csv-mapping-select"
                    value={columnMapping.number}
                    onChange={(e) => setColumnMapping({ ...columnMapping, number: e.target.value })}
                  >
                    <option value="">{t('csv.selectColumn')}</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Position */}
                <div className="csv-mapping-row">
                  <div className="csv-field-info">
                    <span className="csv-field-name">{t('csv.fieldPosition')} *</span>
                    <span className="csv-field-req">{t('csv.fieldRequired')}</span>
                  </div>
                  <select
                    className="csv-mapping-select"
                    value={columnMapping.position}
                    onChange={(e) => setColumnMapping({ ...columnMapping, position: e.target.value })}
                  >
                    <option value="">{t('csv.selectColumn')}</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* BirthDate */}
                <div className="csv-mapping-row">
                  <div className="csv-field-info">
                    <span className="csv-field-name">{t('csv.fieldBirthDate')}</span>
                    <span className="csv-field-opt">{t('csv.fieldOptional')}</span>
                  </div>
                  <select
                    className="csv-mapping-select"
                    value={columnMapping.birthDate}
                    onChange={(e) => setColumnMapping({ ...columnMapping, birthDate: e.target.value })}
                  >
                    <option value="">{t('csv.selectColumn')}</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div className="csv-mapping-row">
                  <div className="csv-field-info">
                    <span className="csv-field-name">{t('csv.fieldEmail')}</span>
                    <span className="csv-field-opt">{t('csv.fieldOptional')}</span>
                  </div>
                  <select
                    className="csv-mapping-select"
                    value={columnMapping.email}
                    onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                  >
                    <option value="">{t('csv.selectColumn')}</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 3 && (
            <div className="csv-step-content">
              <div className="csv-preview-summary-bar">
                <div className="csv-summary-pill valid">
                  <CheckCircle size={16} />
                  <span>{validCount} {t('csv.summaryReady')}</span>
                </div>
                {invalidCount > 0 && (
                  <div className="csv-summary-pill invalid">
                    <AlertTriangle size={16} />
                    <span>{invalidCount} {t('csv.summaryErrors')}</span>
                  </div>
                )}
              </div>

              <div className="csv-preview-table-wrap">
                <table className="csv-preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('csv.fieldDorsal')}</th>
                      <th>{t('csv.fieldPlayerName')}</th>
                      <th>{t('csv.fieldPosition')}</th>
                      <th>{t('csv.fieldBirthDate')}</th>
                      <th>{t('csv.status')}</th>
                      <th>{t('btn.delete')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={row.id} className={row.isValid ? 'row-valid' : 'row-invalid'}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{row.number}</strong>
                        </td>
                        <td>{row.name}</td>
                        <td>
                          <span className="csv-pos-badge">{row.position}</span>
                        </td>
                        <td>{row.birthDate || '-'}</td>
                        <td>
                          {row.isValid ? (
                            <span className="csv-status-tag valid">
                              <CheckCircle size={14} />
                              <span>{t('csv.tagValid')}</span>
                            </span>
                          ) : (
                            <span className="csv-status-tag invalid" title={row.errors.join(' | ')}>
                              <AlertTriangle size={14} />
                              <span>{row.errors[0]}</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="csv-row-del-btn"
                            onClick={() => handleDeletePreviewRow(row.id)}
                            title={t('btn.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="csv-modal-footer">
          {step === 1 && (
            <button type="button" className="csv-btn-secondary" onClick={onClose}>
              {t('btn.cancel')}
            </button>
          )}

          {step === 2 && (
            <>
              <button type="button" className="csv-btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} />
                <span>{t('btn.back')}</span>
              </button>
              <button
                type="button"
                className="csv-btn-primary"
                disabled={!columnMapping.name || !columnMapping.number || !columnMapping.position}
                onClick={handleProcessPreview}
              >
                <span>{t('csv.continueToPreview')}</span>
                <ArrowRight size={16} />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button type="button" className="csv-btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={16} />
                <span>{t('btn.back')}</span>
              </button>
              <button
                type="button"
                className="csv-btn-primary"
                disabled={validCount === 0 || isImporting}
                onClick={handleConfirmImport}
              >
                <CheckCircle size={16} />
                <span>
                  {isImporting ? t('common.loading') : `${t('csv.confirmImport')} (${validCount})`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
