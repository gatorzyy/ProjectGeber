"use client"

import { AVATAR_COLORS } from "@/lib/types"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  size?: "sm" | "md"
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
}

export function ColorPicker({ value, onChange, size = "md" }: ColorPickerProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {AVATAR_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`${sizeClasses[size]} rounded-full border-2 transition-all ${
            value === color ? "border-black scale-110" : "border-transparent hover:scale-105"
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  )
}
