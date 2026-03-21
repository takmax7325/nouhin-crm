interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = '名前・都道府県・商品で検索' }: SearchBarProps) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-gray-400 pointer-events-none">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-9 pr-4 py-3
          bg-white/70 backdrop-blur-md
          border border-white/40
          rounded-xl shadow-sm
          text-sm text-gray-800 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
          transition-all duration-200
        "
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
}

// ── Filter Chips ──────────────────────────────────
interface FilterBarProps {
  prefectures: string[]
  products: string[]
  selectedPrefecture: string | null
  selectedProduct: string | null
  onPrefecture: (v: string | null) => void
  onProduct: (v: string | null) => void
}

export function FilterBar({
  prefectures, products,
  selectedPrefecture, selectedProduct,
  onPrefecture, onProduct,
}: FilterBarProps) {
  if (prefectures.length === 0 && products.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* All */}
      <Chip
        label="すべて"
        active={!selectedPrefecture && !selectedProduct}
        onClick={() => { onPrefecture(null); onProduct(null) }}
      />

      {prefectures.length > 0 && <div className="w-px bg-gray-200 flex-shrink-0 my-1" />}

      {prefectures.map(p => (
        <Chip
          key={p}
          label={p}
          active={selectedPrefecture === p}
          onClick={() => { onPrefecture(selectedPrefecture === p ? null : p); onProduct(null) }}
        />
      ))}

      {products.length > 0 && <div className="w-px bg-gray-200 flex-shrink-0 my-1" />}

      {products.map(p => (
        <Chip
          key={p}
          label={p}
          active={selectedProduct === p}
          onClick={() => { onProduct(selectedProduct === p ? null : p); onPrefecture(null) }}
        />
      ))}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold
        transition-all duration-200 active:scale-95
        ${active
          ? 'bg-brand-500 text-white shadow-sm shadow-brand-300'
          : 'bg-white/60 text-gray-600 border border-gray-200'
        }
      `}
    >
      {label}
    </button>
  )
}
