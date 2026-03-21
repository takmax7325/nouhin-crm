import { useState, useRef, useEffect } from 'react'
import type { ImageModel } from '../types'

interface ImageCarouselProps {
  images: ImageModel[]
  height?: string
}

export function ImageCarousel({ images, height = 'h-64' }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0)
  const startXRef = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startXRef.current === null) return
    const diff = startXRef.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && current < images.length - 1) setCurrent(c => c + 1)
      if (diff < 0 && current > 0) setCurrent(c => c - 1)
    }
    startXRef.current = null
  }

  if (images.length === 0) {
    return (
      <div className={`${height} bg-gradient-to-br from-brand-50 to-teal-50 flex flex-col items-center justify-center`}>
        <span className="text-5xl opacity-30">📦</span>
        <span className="text-sm text-gray-400 mt-2">画像なし</span>
      </div>
    )
  }

  return (
    <div
      className={`relative ${height} overflow-hidden`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Images */}
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map(img => (
          <div key={img.id} className="w-full h-full flex-shrink-0">
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`
                rounded-full transition-all duration-200
                ${i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}
              `}
            />
          ))}
        </div>
      )}

      {/* Nav arrows on tablet/desktop */}
      {images.length > 1 && (
        <>
          {current > 0 && (
            <button
              onClick={() => setCurrent(c => c - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full text-white flex items-center justify-center hidden md:flex"
            >
              ‹
            </button>
          )}
          {current < images.length - 1 && (
            <button
              onClick={() => setCurrent(c => c + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full text-white flex items-center justify-center hidden md:flex"
            >
              ›
            </button>
          )}
        </>
      )}
    </div>
  )
}
