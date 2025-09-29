"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import type React from "react"

import { useQuickAuth, useMiniKit, useComposeCast } from "@coinbase/onchainkit/minikit"
import styles from "./page.module.css"

interface AuthResponse {
  success: boolean
  user?: {
    fid: number
    issuedAt?: number
    expiresAt?: number
  }
  message?: string
}

interface Fly {
  id: number
  x: number
  y: number
  size: number
  speed: number
  vx: number // velocity x
  vy: number // velocity y
  direction: number // movement direction
}

interface BloodSplatter {
  id: number
  x: number
  y: number
}

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit()
  const { composeCast } = useComposeCast()
  const [gameState, setGameState] = useState<"waiting" | "playing" | "finished">("waiting")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [flies, setFlies] = useState<Fly[]>([])
  const [nextFlyId, setNextFlyId] = useState(1)
  const [bloodSplatters, setBloodSplatters] = useState<BloodSplatter[]>([])
  const [nextBloodId, setNextBloodId] = useState(1)

  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
    }

    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      initAudio()
      document.removeEventListener("touchstart", handleFirstInteraction)
      document.removeEventListener("click", handleFirstInteraction)
    }

    document.addEventListener("touchstart", handleFirstInteraction)
    document.addEventListener("click", handleFirstInteraction)

    return () => {
      document.removeEventListener("touchstart", handleFirstInteraction)
      document.removeEventListener("click", handleFirstInteraction)
    }
  }, [])

  const playSquishSound = useCallback(() => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Create a "squish" sound effect
    oscillator.frequency.setValueAtTime(200, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  }, [])

  const triggerVibration = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50) // Short vibration
    }
  }, [])

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady()
    }
  }, [setFrameReady, isFrameReady])

  const {
    data: authData,
    isLoading: isAuthLoading,
    error: authError,
  } = useQuickAuth<AuthResponse>("/api/auth", { method: "GET" })

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState === "playing" && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && gameState === "playing") {
      setGameState("finished")
    }
    return () => clearTimeout(timer)
  }, [gameState, timeLeft])

  useEffect(() => {
    let spawnTimer: NodeJS.Timeout
    if (gameState === "playing") {
      spawnTimer = setInterval(
        () => {
          const newFly: Fly = {
            id: nextFlyId,
            x: Math.random() * 80 + 10, // 10-90% to avoid edges
            y: Math.random() * 70 + 15, // 15-85% to avoid header/footer
            size: Math.random() * 20 + 15, // 15-35px
            speed: Math.random() * 3 + 2, // 2-5 seconds lifespan
            vx: (Math.random() - 0.5) * 2, // Random horizontal velocity
            vy: (Math.random() - 0.5) * 2, // Random vertical velocity
            direction: Math.random() * 360, // Random initial direction
          }
          setFlies((prev) => [...prev, newFly])
          setNextFlyId((prev) => prev + 1)
        },
        Math.random() * 800 + 400,
      ) // Spawn every 400-1200ms
    }
    return () => clearInterval(spawnTimer)
  }, [gameState, nextFlyId])

  useEffect(() => {
    let animationFrame: number

    if (gameState === "playing") {
      const animateFlies = () => {
        setFlies((prevFlies) =>
          prevFlies.map((fly) => {
            let newX = fly.x + fly.vx * 0.5
            let newY = fly.y + fly.vy * 0.5
            let newVx = fly.vx
            let newVy = fly.vy

            // Bounce off edges
            if (newX <= 5 || newX >= 95) {
              newVx = -newVx
              newX = Math.max(5, Math.min(95, newX))
            }
            if (newY <= 10 || newY >= 85) {
              newVy = -newVy
              newY = Math.max(10, Math.min(85, newY))
            }

            // Add some randomness to movement
            newVx += (Math.random() - 0.5) * 0.1
            newVy += (Math.random() - 0.5) * 0.1

            // Limit velocity
            const maxVelocity = 1.5
            newVx = Math.max(-maxVelocity, Math.min(maxVelocity, newVx))
            newVy = Math.max(-maxVelocity, Math.min(maxVelocity, newVy))

            return {
              ...fly,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy,
            }
          }),
        )
        animationFrame = requestAnimationFrame(animateFlies)
      }

      animationFrame = requestAnimationFrame(animateFlies)
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [gameState])

  useEffect(() => {
    if (gameState === "playing") {
      const removeTimer = setTimeout(() => {
        setFlies((prev) => prev.slice(1)) // Remove oldest fly
      }, 5000) // Flies live for 5 seconds max
      return () => clearTimeout(removeTimer)
    }
  }, [flies.length, gameState])

  const handleFlyClick = useCallback(
    (flyId: number, event: React.MouseEvent) => {
      const fly = flies.find((f) => f.id === flyId)
      if (!fly) return

      // Create blood splatter at fly position
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      const gameArea = document.querySelector(`.${styles.gameArea}`)
      if (gameArea) {
        const gameRect = gameArea.getBoundingClientRect()
        const relativeX = ((rect.left + rect.width / 2 - gameRect.left) / gameRect.width) * 100
        const relativeY = ((rect.top + rect.height / 2 - gameRect.top) / gameRect.height) * 100

        const newBloodSplatter: BloodSplatter = {
          id: nextBloodId,
          x: relativeX,
          y: relativeY,
        }

        setBloodSplatters((prev) => [...prev, newBloodSplatter])
        setNextBloodId((prev) => prev + 1)

        // Remove blood splatter after 3 seconds
        setTimeout(() => {
          setBloodSplatters((prev) => prev.filter((splatter) => splatter.id !== newBloodSplatter.id))
        }, 3000)
      }

      // Remove fly, add score, play sound, and vibrate
      setFlies((prev) => prev.filter((fly) => fly.id !== flyId))
      setScore((prev) => prev + 10)
      playSquishSound()
      triggerVibration()
    },
    [flies, nextBloodId, playSquishSound, triggerVibration],
  )

  const startGame = () => {
    setGameState("playing")
    setScore(0)
    setTimeLeft(60)
    setFlies([])
    setNextFlyId(1)
    setBloodSplatters([])
    setNextBloodId(1)
  }

  const resetGame = () => {
    setGameState("waiting")
    setScore(0)
    setTimeLeft(60)
    setFlies([])
    setNextFlyId(1)
    setBloodSplatters([])
    setNextBloodId(1)
  }

  const handleShare = useCallback(() => {
    const fliesSmashed = score / 10
    const shareText = `Just smashed ${fliesSmashed} flies in 60 seconds! 🪰💥 Final score: ${score} points in Fly Smasher! Can you beat my score?`

    composeCast({
      text: shareText,
    })
  }, [score, composeCast])

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} type="button" onClick={resetGame}>
        ✕
      </button>

      <div className={styles.content}>
        {gameState === "waiting" && (
          <div className={styles.waitlistForm}>
            <h1 className={styles.title}>FLY SMASHER</h1>
            <p className={styles.subtitle}>
              Hey {context?.user?.displayName || "there"}, ready to test your reflexes?
              <br />
              Tap the flies as fast as you can in 60 seconds!
            </p>
            <button onClick={startGame} className={styles.joinButton}>
              START GAME
            </button>
          </div>
        )}

        {gameState === "playing" && (
          <>
            <div className={styles.gameHUD}>
              <div className={styles.score}>Score: {score}</div>
              <div className={styles.timer}>Time: {timeLeft}s</div>
            </div>
            <div className={styles.gameArea}>
              {flies.map((fly) => (
                <button
                  key={fly.id}
                  className={styles.fly}
                  style={{
                    left: `${fly.x}%`,
                    top: `${fly.y}%`,
                    width: `${fly.size}px`,
                    height: `${fly.size}px`,
                  }}
                  onClick={(e) => handleFlyClick(fly.id, e)}
                >
                  🪰
                </button>
              ))}
              {bloodSplatters.map((splatter) => (
                <div
                  key={splatter.id}
                  className={styles.bloodSplatter}
                  style={{
                    left: `${splatter.x}%`,
                    top: `${splatter.y}%`,
                  }}
                >
                  💥
                </div>
              ))}
            </div>
          </>
        )}

        {gameState === "finished" && (
          <div className={styles.waitlistForm}>
            <h1 className={styles.title}>GAME OVER!</h1>
            <div className={styles.finalScore}>Final Score: {score} points</div>
            <p className={styles.subtitle}>
              Great job {context?.user?.displayName || "there"}!
              <br />
              You smashed {score / 10} flies in 60 seconds!
            </p>
            <button onClick={handleShare} className={styles.shareButton}>
              Share on Farcaster
            </button>
            <button onClick={resetGame} className={styles.joinButton}>
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
