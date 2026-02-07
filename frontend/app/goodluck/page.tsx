"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/hooks/useAuth";
import { useTransaction } from "@/hooks/useTransaction";
import { goodluck } from "@/lib/api";
import {
  createGoodLuckPurchaseTransaction,
  GOODLUCK_PRICE,
  formatSOL,
} from "@/lib/solana-transactions";
import { toast } from "@/lib/toast";
import LoginPrompt from "@/components/LoginPrompt";
import { GiHorseshoe } from "react-icons/gi";

const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || "";

export default function GoodLuckPage() {
  const { user, refetch: refreshUser } = useAuth();
  const { publicKey, connected } = useWallet();
  const { sendSolTransaction, loading: isLoading } = useTransaction();
  const [quantity, setQuantity] = useState(1);

  const totalPrice = quantity * GOODLUCK_PRICE;
  const goodluckCount = user?.goodluck_count || 0;

  const handleBuyGoodLuck = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    if (quantity < 1 || quantity > 100) {
      toast.error("Quantity must be between 1 and 100");
      return;
    }

    try {
      const transaction = await createGoodLuckPurchaseTransaction(
        publicKey,
        TREASURY_WALLET,
        quantity
      );

      const signature = await sendSolTransaction(transaction);

      if (!signature) {
        throw new Error("Transaction failed");
      }

      const response = await goodluck.buy({
        transaction_signature: signature,
        quantity,
      });

      toast.success(response.message);
      await refreshUser();
      setQuantity(1);
    } catch (error: any) {
      const errorMessage =
        error?.message || "Failed to purchase GoodLuck charms";
      toast.error(errorMessage);
      console.error("GoodLuck purchase error:", error);
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold mb-16 text-glow flex justify-center items-center gap-8">
            <span className="relative">
              <span className="relative z-10">GoodLuck Charms</span>
              <span className="absolute -top-1/3 -right-12 -rotate-45 z-0 opacity-35">
                <GiHorseshoe className="w-24 h-24 text-neon-green" />
              </span>
            </span>
          </h1>
          <p className="hidden text-xl text-gray-300">
            Decrease bad luck and ensure consistent performance
          </p>
        </div>

        <div className="glass rounded-2xl p-8 mb-8 shadow-neon animate-slide-in">
          {connected && (
            <div className="mb-8 text-center">
              <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                Your Balance
              </p>
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600/20 to-green-600/20 border-2 border-emerald-500/50 px-8 py-4 rounded-xl">
                <span className="text-5xl flex items-center gap-8">
                  <GiHorseshoe className="w-16 h-16 text-neon-green" />
                </span>
                <span className="text-4xl font-bold text-emerald-400">
                  {goodluckCount}
                </span>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 border border-emerald-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
              <span>🎯</span> What is GoodLuck?
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              GoodLuck charms help you avoid bad luck in races by decreasing
              negative speed variations. All horses experience small random
              speed changes during races - GoodLuck ensures yours are only
              neutral or positive.
            </p>

            <div className="space-y-4">
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  <span>📊</span> Race Randomization Explained
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  Every horse in every race gets a small random speed modifier
                  applied to their final race time:
                </p>

                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 min-w-fit flex items-center gap-2">
                      <GiHorseshoe className="w-6 h-6 text-neon-green" />{" "}
                      Without:
                    </span>
                    <span>
                      Speed varies between <strong>-5% and +5%</strong> randomly
                      (can be faster OR slower than <strong>"base"</strong>{" "}
                      speed)
                    </span>
                  </li>
                  <p className="text-gray-400 text-sm !mt-0 mb-4">
                    For example, if a horse's base running time is 30 seconds
                    (calculated with all its stats), it will run between (28,5 -
                    32,5) seconds. RNG is applied to the base running time
                    (-5%/+5%).
                  </p>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 min-w-fit flex items-center gap-2">
                      <GiHorseshoe className="w-6 h-6 text-neon-green" /> With:
                    </span>
                    <span>
                      Speed varies between <strong>-7% and +2%</strong>{" "}
                      (increases chance of running faster, decreases chance of
                      running slower) a bit.
                    </span>
                  </li>
                  <p className="text-gray-400 text-sm !mt-0 mb-4">
                    For example, if a horse's base running time is 30 seconds
                    (calculated with all its stats), it will run between (27,9 -
                    30,6) seconds. RNG is applied to the base running time
                    (-7%/+2%).
                  </p>
                </ul>
                <p className="text-gray-400 text-xs mt-3 italic">
                  * GoodLuck doesn't make your horse faster - it just gives a
                  small buff to randomization.
                </p>
              </div>

              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  <span>🎮</span> How to Use
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                  <li>Purchase GoodLuck charms (0.005 SOL per charm)</li>
                  <li>Join a race with your horse</li>
                  <li>Activate GoodLuck before the race starts</li>
                  <li>Watch your horse race with only positive buffs!</li>
                </ol>
              </div>

              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                  <span>⚠️</span> Important Rules
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>Only 1 GoodLuck charm can be used per race</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>
                      Must be activated before the race starts (waiting status)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>GoodLuck is consumed when the race begins</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {!connected ? (
            <LoginPrompt
              title="Connect Wallet to Purchase GoodLuck"
              message={`Get an edge in races • ${GOODLUCK_PRICE} SOL per charm • Better RNG distribution`}
              buttonText="Connect Wallet to Purchase"
              icon={
                <span className="text-8xl mx-auto mb-4 block">
                  <GiHorseshoe className="w-6 h-6 text-neon-green" />
                </span>
              }
              className="max-w-2xl mx-auto"
            />
          ) : (
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6 text-purple-400 flex items-center gap-2">
                <span>💰</span> Purchase GoodLuck
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quantity (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(
                          1,
                          Math.min(100, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                    className="w-full bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Price
                  </label>
                  <div className="bg-black/50 border border-purple-500/50 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-400">
                      {formatSOL(totalPrice)}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({GOODLUCK_PRICE} SOL each)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setQuantity(1)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-sm"
                  disabled={isLoading}
                >
                  1x
                </button>
                <button
                  onClick={() => setQuantity(5)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-sm"
                  disabled={isLoading}
                >
                  5x
                </button>
                <button
                  onClick={() => setQuantity(10)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-sm"
                  disabled={isLoading}
                >
                  10x
                </button>
                <button
                  onClick={() => setQuantity(25)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-sm"
                  disabled={isLoading}
                >
                  25x
                </button>
                <button
                  onClick={() => setQuantity(50)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all text-sm"
                  disabled={isLoading}
                >
                  50x
                </button>
              </div>

              <button
                onClick={handleBuyGoodLuck}
                disabled={isLoading || !publicKey}
                className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-neon-green hover:shadow-neon-lg hover:scale-105 disabled:scale-100 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">
                      <GiHorseshoe className="w-10 h-10 text-neon-green" />
                    </span>
                    <span>
                      Buy {quantity} GoodLuck Charm{quantity > 1 ? "s" : ""}
                    </span>
                    <span className="text-sm opacity-90">
                      ({formatSOL(totalPrice)})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-6 text-center animate-slide-in">
          <p className="text-gray-400 text-sm mb-3">
            <span className="text-emerald-400 font-semibold">
              Fair Play Note:
            </span>{" "}
            GoodLuck doesn't give you an unfair advantage - it simply protects
            against random bad luck. All horses still compete based on their
            actual stats (weight, determination, energy, age, etc).
          </p>
          <p className="text-gray-500 text-xs">
            Think of it as insurance against unlucky dice rolls, not as a
            performance booster.
          </p>
        </div>
      </div>
    </div>
  );
}
