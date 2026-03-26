import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { deliveryService } from '../lib/supabase'
import { deliveryCache } from '../lib/cache'
import type { DeliveryInput } from '../types'

// Excelのカラム名 → DeliveryInputフィールドの自動マッピング候補
const COLUMN_ALIASES: Record<keyof Omit<DeliveryInput, 'lat' | 'lng'>, string[]> = {
  name:       ['納品先名', '店舗名', '会社名', '名前', 'name', 'Name'],
  prefecture: ['都道府県', 'prefecture', 'Prefecture', '県'],
  product:    ['商品名', '商品', 'product', 'Product', 'サイズ'],
  address:    ['住所', 'address', 'Address'],
  website:    ['ウェブサイト', 'URL', 'url', 'website', 'Website', 'HP'],
}

type FieldKey = keyof Omit<DeliveryInput, 'lat' | 'lng'>
type ColumnMap = Record<FieldKey, string>

interface ParsedRow {
  [key: string]: string
}

interface ImportModalProps {
  onClose: () => void
  onImported: () => void
}

export function ImportModal({ onClose, onImported }: ImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'map' | 'confirm' | 'importing' | 'done'>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [colMap, setColMap] = useState<ColumnMap>({ name: '', prefecture: '', product: '', address: '', website: '' })
  const [progress, setProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── Excel ファイルを読み込む ──────────────────────
  const handleFile = (file: File) => {
    setErrorMsg(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json: ParsedRow[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        if (json.length === 0) { setErrorMsg('シートにデータがありません'); return }

        const cols = Object.keys(json[0])
        setHeaders(cols)
        setRows(json)

        // 自動マッピング
        const auto: ColumnMap = { name: '', prefecture: '', product: '', address: '', website: '' }
        for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [FieldKey, string[]][]) {
          const match = cols.find(c => aliases.some(a => c.trim().toLowerCase() === a.toLowerCase()))
          if (match) auto[field] = match
        }
        setColMap(auto)
        setStep('map')
      } catch {
        setErrorMsg('ファイルの読み込みに失敗しました')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ── インポート実行 ────────────────────────────────
  const handleImport = async () => {
    setStep('importing')
    setProgress(0)
    let count = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const name = String(row[colMap.name] ?? '').trim()
      const prefecture = String(row[colMap.prefecture] ?? '').trim()
      const product = String(row[colMap.product] ?? '').trim()
      const address = String(row[colMap.address] ?? '').trim()
      const website = String(row[colMap.website] ?? '').trim()

      if (!name || !prefecture || !product || !address) continue // 必須欠落スキップ

      try {
        const input: DeliveryInput = { name, prefecture, product, address, website, lat: 35.6762, lng: 139.6503 }
        const delivery = await deliveryService.create(input)
        deliveryCache.upsertOne(delivery)
        count++
      } catch { /* 1件失敗しても続行 */ }

      setProgress(Math.round(((i + 1) / rows.length) * 100))
    }

    setImportedCount(count)
    setStep('done')
  }

  const requiredFilled = colMap.name && colMap.prefecture && colMap.product && colMap.address

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
      onClick={step !== 'importing' ? onClose : undefined}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg pb-safe animate-slide-up"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-[17px] font-bold text-[#1e3a8a]">
            {step === 'upload' && 'Excelからインポート'}
            {step === 'map' && 'カラムの対応設定'}
            {step === 'confirm' && 'インポート確認'}
            {step === 'importing' && 'インポート中...'}
            {step === 'done' && 'インポート完了'}
          </h2>
          {step !== 'importing' && (
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
              ✕
            </button>
          )}
        </div>

        <div className="px-5 py-4">

          {/* ── STEP1: ファイル選択 ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                .xlsx / .xls ファイルを選択してください。<br />
                1行目はヘッダー行として扱われます。
              </p>
              {errorMsg && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">⚠️ {errorMsg}</p>}
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-12 border-2 border-dashed border-sky-300 rounded-2xl flex flex-col items-center gap-3 bg-sky-50 active:bg-sky-100 transition-colors">
                <span className="text-4xl">📊</span>
                <span className="text-sm font-semibold text-sky-600">ファイルを選択</span>
                <span className="text-xs text-gray-400">.xlsx / .xls</span>
              </button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
            </div>
          )}

          {/* ── STEP2: カラムマッピング ── */}
          {step === 'map' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">{rows.length}行のデータを検出。各項目に対応するExcelの列を選択してください。</p>

              {([ ['name', '納品先名 *'], ['prefecture', '都道府県 *'], ['product', '商品名 *'], ['address', '住所 *'], ['website', 'ウェブサイト'] ] as [FieldKey, string][]).map(([field, label]) => (
                <div key={field}>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
                  <select
                    value={colMap[field]}
                    onChange={e => setColMap(m => ({ ...m, [field]: e.target.value }))}
                    className="w-full mt-1 px-3 py-3 bg-[#f5f5f7] rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 appearance-none"
                  >
                    <option value="">（スキップ）</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}

              {/* プレビュー（最初の3行） */}
              {colMap.name && (
                <div className="mt-2">
                  <p className="text-[11px] font-semibold text-gray-400 mb-2">プレビュー（先頭3件）</p>
                  <div className="space-y-1.5">
                    {rows.slice(0, 3).map((row, i) => (
                      <div key={i} className="bg-[#f5f5f7] rounded-xl px-3 py-2 text-xs text-gray-700">
                        <span className="font-semibold">{String(row[colMap.name] ?? '')}</span>
                        {colMap.prefecture && <span className="text-gray-400 ml-2">{String(row[colMap.prefecture] ?? '')}</span>}
                        {colMap.product && <span className="text-gray-400 ml-2">{String(row[colMap.product] ?? '')}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('confirm')}
                disabled={!requiredFilled}
                className="w-full py-4 rounded-2xl font-bold text-white bg-[#1e3a8a] disabled:opacity-40 mt-2"
              >
                次へ
              </button>
            </div>
          )}

          {/* ── STEP3: 確認 ── */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <div className="bg-sky-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">インポート対象</span>
                  <span className="font-bold text-[#1e3a8a]">{rows.length} 件</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ファイルの列</span>
                  <span className="font-bold text-[#1e3a8a]">{headers.length} 列</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">必須項目（納品先名・都道府県・商品名・住所）が<br />空の行はスキップされます</p>
              <div className="flex gap-3">
                <button onClick={() => setStep('map')}
                  className="flex-1 py-3 bg-gray-100 rounded-xl font-semibold text-gray-600 text-sm">
                  戻る
                </button>
                <button onClick={handleImport}
                  className="flex-1 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold text-sm">
                  インポート開始
                </button>
              </div>
            </div>
          )}

          {/* ── STEP4: インポート中 ── */}
          {step === 'importing' && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-16 h-16 border-4 border-sky-100 border-t-[#1e3a8a] rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-700">インポート中... {progress}%</p>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-[#1e3a8a] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* ── STEP5: 完了 ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">✅</div>
              <p className="text-[17px] font-bold text-gray-800">{importedCount} 件をインポートしました</p>
              <p className="text-xs text-gray-400">一覧に反映されています</p>
              <button
                onClick={() => { onImported(); onClose() }}
                className="w-full py-4 rounded-2xl font-bold text-white bg-[#1e3a8a] mt-2"
              >
                閉じる
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
