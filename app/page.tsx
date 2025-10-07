"use client"
import { useState, useEffect, useCallback } from "react"

import { useQuickAuth, useMiniKit, useComposeCast } from "@coinbase/onchainkit/minikit"
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from "@coinbase/onchainkit/wallet"
import { Address, Avatar, Name, Identity } from "@coinbase/onchainkit/identity"
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

type PastaType = "rigatoni" | "spaghetti" | "fusilli" | null
type SauceType = "carbonara" | "gricia" | "cacio-e-pepe" | "amatriciana" | null
type GameState = "welcome" | "select-pasta" | "select-sauce" | "preview" | "minting" | "minted"

const pastaEmojis = {
  rigatoni: "🍝",
  spaghetti: "🍝",
  fusilli: "🍝",
}

const pastaNames = {
  rigatoni: "Rigatoni",
  spaghetti: "Spaghetti",
  fusilli: "Fusilli",
}

const sauceNames = {
  carbonara: "Carbonara",
  gricia: "Gricia",
  "cacio-e-pepe": "Cacio e Pepe",
  amatriciana: "Amatriciana",
}

const sauceColors = {
  carbonara: "#f4e4c1",
  gricia: "#d4a574",
  "cacio-e-pepe": "#f5f5dc",
  amatriciana: "#d32f2f",
}

export default function Home() {
  const { setMiniAppReady, isMiniAppReady, context } = useMiniKit()
  const { composeCast } = useComposeCast()
  const [gameState, setGameState] = useState<GameState>("welcome")
  const [selectedPasta, setSelectedPasta] = useState<PastaType>(null)
  const [selectedSauce, setSelectedSauce] = useState<SauceType>(null)
  const [isMinting, setIsMinting] = useState(false)
  const [mintTxHash, setMintTxHash] = useState<string | null>(null)

  // Initialize the miniapp
  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady()
    }
  }, [setMiniAppReady, isMiniAppReady])

  const {
    data: authData,
    isLoading: isAuthLoading,
    error: authError,
  } = useQuickAuth<AuthResponse>("/api/auth", { method: "GET" })

  const handlePastaSelect = (pasta: PastaType) => {
    setSelectedPasta(pasta)
    setGameState("select-sauce")
  }

  const handleSauceSelect = (sauce: SauceType) => {
    setSelectedSauce(sauce)
    setGameState("preview")
  }

  const handleMintNFT = async () => {
    setIsMinting(true)
    setGameState("minting")

    // Simulate NFT minting process
    // In a real implementation, you would call a smart contract here
    try {
      // Simulate blockchain transaction delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Generate a mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`
      setMintTxHash(mockTxHash)
      setGameState("minted")
    } catch (error) {
      console.error("Minting failed:", error)
      setGameState("preview")
    } finally {
      setIsMinting(false)
    }
  }

  const handleShare = useCallback(() => {
    const shareText = `Just created my perfect pasta dish! 🍝\n${pastaNames[selectedPasta!]} with ${sauceNames[selectedSauce!]} sauce and minted it as an NFT! 🎨\n\nCreate yours in Pasta Maker!`

    composeCast({
      text: shareText,
    })
  }, [selectedPasta, selectedSauce, composeCast])

  const resetGame = () => {
    setGameState("welcome")
    setSelectedPasta(null)
    setSelectedSauce(null)
    setMintTxHash(null)
  }

  return (
    <div className={styles.container}>
      <div className={styles.walletContainer}>
        <Wallet>
          <ConnectWallet className={styles.connectButton}>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      <button className={styles.closeButton} type="button" onClick={resetGame}>
        ✕
      </button>

      <div className={styles.content}>
        {gameState === "welcome" && (
          <div className={styles.waitlistForm}>
            <h1 className={styles.title}>PASTA MAKER</h1>
            <div className={styles.pastaHero}>🍝</div>
            <p className={styles.subtitle}>
              Hey {context?.user?.displayName || "there"}, ready to create your perfect pasta?
              <br />
              Choose your pasta and sauce, then mint it as an NFT!
            </p>
            <button onClick={() => setGameState("select-pasta")} className={styles.joinButton}>
              START CREATING
            </button>
          </div>
        )}

        {gameState === "select-pasta" && (
          <div className={styles.selectionScreen}>
            <h2 className={styles.selectionTitle}>Choose Your Pasta</h2>
            <div className={styles.optionsGrid}>
              <button className={styles.optionCard} onClick={() => handlePastaSelect("rigatoni")}>
                <div className={styles.optionEmoji}>🍝</div>
                <div className={styles.optionName}>Rigatoni</div>
                <div className={styles.optionDescription}>Tube-shaped pasta perfect for thick sauces</div>
              </button>
              <button className={styles.optionCard} onClick={() => handlePastaSelect("spaghetti")}>
                <div className={styles.optionEmoji}>🍝</div>
                <div className={styles.optionName}>Spaghetti</div>
                <div className={styles.optionDescription}>Classic long thin pasta</div>
              </button>
              <button className={styles.optionCard} onClick={() => handlePastaSelect("fusilli")}>
                <div className={styles.optionEmoji}>🍝</div>
                <div className={styles.optionName}>Fusilli</div>
                <div className={styles.optionDescription}>Spiral pasta that holds sauce beautifully</div>
              </button>
            </div>
          </div>
        )}

        {gameState === "select-sauce" && (
          <div className={styles.selectionScreen}>
            <h2 className={styles.selectionTitle}>Choose Your Sauce</h2>
            <div className={styles.selectedInfo}>Selected: {pastaNames[selectedPasta!]} 🍝</div>
            <div className={styles.optionsGrid}>
              <button className={styles.optionCard} onClick={() => handleSauceSelect("carbonara")}>
                <div className={styles.sauceCircle} style={{ background: sauceColors.carbonara }}></div>
                <div className={styles.optionName}>Carbonara</div>
                <div className={styles.optionDescription}>Eggs, pecorino, guanciale, black pepper</div>
              </button>
              <button className={styles.optionCard} onClick={() => handleSauceSelect("gricia")}>
                <div className={styles.sauceCircle} style={{ background: sauceColors.gricia }}></div>
                <div className={styles.optionName}>Gricia</div>
                <div className={styles.optionDescription}>Pecorino, guanciale, black pepper</div>
              </button>
              <button className={styles.optionCard} onClick={() => handleSauceSelect("cacio-e-pepe")}>
                <div className={styles.sauceCircle} style={{ background: sauceColors["cacio-e-pepe"] }}></div>
                <div className={styles.optionName}>Cacio e Pepe</div>
                <div className={styles.optionDescription}>Pecorino romano and black pepper</div>
              </button>
              <button className={styles.optionCard} onClick={() => handleSauceSelect("amatriciana")}>
                <div className={styles.sauceCircle} style={{ background: sauceColors.amatriciana }}></div>
                <div className={styles.optionName}>Amatriciana</div>
                <div className={styles.optionDescription}>Tomato, guanciale, pecorino</div>
              </button>
            </div>
            <button className={styles.backButton} onClick={() => setGameState("select-pasta")}>
              ← Back to Pasta
            </button>
          </div>
        )}

        {gameState === "preview" && (
          <div className={styles.previewScreen}>
            <h2 className={styles.selectionTitle}>Your Perfect Pasta</h2>
            <div className={styles.pastaPreview}>
              <div
                className={styles.pastaPlate}
                style={{
                  background: `radial-gradient(circle, ${sauceColors[selectedSauce!]} 0%, ${sauceColors[selectedSauce!]}dd 100%)`,
                }}
              >
                <div className={styles.pastaEmoji}>🍝</div>
              </div>
              <div className={styles.pastaDetails}>
                <div className={styles.pastaDetailItem}>
                  <span className={styles.detailLabel}>Pasta:</span>
                  <span className={styles.detailValue}>{pastaNames[selectedPasta!]}</span>
                </div>
                <div className={styles.pastaDetailItem}>
                  <span className={styles.detailLabel}>Sauce:</span>
                  <span className={styles.detailValue}>{sauceNames[selectedSauce!]}</span>
                </div>
              </div>
            </div>
            <button onClick={handleMintNFT} className={styles.mintButton} disabled={isMinting}>
              {isMinting ? "MINTING..." : "MINT AS NFT"}
            </button>
            <button className={styles.backButton} onClick={() => setGameState("select-sauce")}>
              ← Change Sauce
            </button>
          </div>
        )}

        {gameState === "minting" && (
          <div className={styles.waitlistForm}>
            <h2 className={styles.selectionTitle}>Minting Your Pasta NFT</h2>
            <div className={styles.mintingAnimation}>
              <div className={styles.spinner}></div>
              <div className={styles.pastaEmoji}>🍝</div>
            </div>
            <p className={styles.subtitle}>
              Creating your unique pasta NFT on Base...
              <br />
              This will just take a moment!
            </p>
          </div>
        )}

        {gameState === "minted" && (
          <div className={styles.waitlistForm}>
            <h1 className={styles.title}>SUCCESS!</h1>
            <div className={styles.pastaHero}>🎉</div>
            <div className={styles.mintedInfo}>
              <div className={styles.mintedPasta}>
                <div
                  className={styles.pastaPlate}
                  style={{
                    background: `radial-gradient(circle, ${sauceColors[selectedSauce!]} 0%, ${sauceColors[selectedSauce!]}dd 100%)`,
                  }}
                >
                  <div className={styles.pastaEmoji}>🍝</div>
                </div>
              </div>
              <div className={styles.mintedDetails}>
                <p className={styles.mintedText}>
                  Your {pastaNames[selectedPasta!]} with {sauceNames[selectedSauce!]} has been minted!
                </p>
                {mintTxHash && (
                  <div className={styles.txHash}>
                    <span className={styles.txLabel}>Transaction:</span>
                    <span className={styles.txValue}>
                      {mintTxHash.substring(0, 10)}...{mintTxHash.substring(mintTxHash.length - 8)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleShare} className={styles.shareButton}>
              Share on Farcaster
            </button>
            <button onClick={resetGame} className={styles.joinButton}>
              CREATE ANOTHER
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
