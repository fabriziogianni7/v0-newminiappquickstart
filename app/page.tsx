"use client"
import { useState, useEffect, useCallback } from "react"

import { useQuickAuth, useMiniKit } from "@coinbase/onchainkit/minikit"
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
}

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit()
  const [gameState, setGameState] = useState<"waiting" | "playing" | "finished">("waiting")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [flies, setFlies] = useState<Fly[]>([])
  const [nextFlyId, setNextFlyId] = useState(1)

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
    if (gameState === "playing") {
      const removeTimer = setTimeout(() => {
        setFlies((prev) => prev.slice(1)) // Remove oldest fly
      }, 5000) // Flies live for 5 seconds max
      return () => clearTimeout(removeTimer)
    }
  }, [flies.length, gameState])

  const handleFlyClick = useCallback((flyId: number) => {
    setFlies((prev) => prev.filter((fly) => fly.id !== flyId))
    setScore((prev) => prev + 10)
  }, [])

  const startGame = () => {
    setGameState("playing")
    setScore(0)
    setTimeLeft(60)
    setFlies([])
    setNextFlyId(1)
  }

  const resetGame = () => {
    setGameState("waiting")
    setScore(0)
    setTimeLeft(60)
    setFlies([])
    setNextFlyId(1)
  }

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} type="button">
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
                  onClick={() => handleFlyClick(fly.id)}
                >
                  🪰
                </button>
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
            <button onClick={resetGame} className={styles.joinButton}>
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
