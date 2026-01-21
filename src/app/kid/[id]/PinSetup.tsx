"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Shield } from "lucide-react"

export function PinSetup({ }: { kidId: string }) {
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [step, setStep] = useState<"prompt" | "enter" | "confirm">("prompt")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSetPin = async () => {
    if (pin !== confirmPin) {
      setError("PINs don't match! Try again.")
      setConfirmPin("")
      setStep("enter")
      return
    }

    setIsLoading(true)
    const res = await fetch("/api/kids/auth", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      setError("Failed to set PIN. Try again.")
    }
    setIsLoading(false)
  }

  if (step === "prompt") {
    return (
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="flex items-center gap-4 py-4">
          <Shield className="w-8 h-8 text-amber-600 flex-shrink-0" />
          <div className="flex-grow">
            <h3 className="font-medium">Protect your account!</h3>
            <p className="text-sm text-muted-foreground">
              Set a secret PIN so only you can access your tasks and rewards.
            </p>
          </div>
          <Button onClick={() => setStep("enter")} size="sm">
            Set PIN
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 border-purple-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {step === "enter" ? "Create Your Secret PIN" : "Confirm Your PIN"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {step === "enter"
              ? "Choose a 4-digit PIN that you can remember."
              : "Enter your PIN again to confirm."}
          </p>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={step === "enter" ? pin : confirmPin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "")
              if (step === "enter") {
                setPin(val)
                if (val.length === 4) {
                  setTimeout(() => setStep("confirm"), 300)
                }
              } else {
                setConfirmPin(val)
              }
            }}
            placeholder="Enter 4 digits"
            className="text-center text-2xl tracking-widest max-w-[200px] mx-auto"
            autoFocus
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {step === "confirm" && confirmPin.length === 4 && (
            <div className="flex justify-center">
              <Button onClick={handleSetPin} disabled={isLoading}>
                {isLoading ? "Setting..." : "Confirm PIN"}
              </Button>
            </div>
          )}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("prompt")
                setPin("")
                setConfirmPin("")
                setError("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
