import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import GaugeComponent from 'react-gauge-component';
import { tokenizeText, getProviderOrSigner } from './contractInteraction';
import { ethers } from 'ethers';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const App = () => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sentimentValue, setSentimentValue] = useState<number>(50);
  const [status, setStatus] = useState("Awaiting X-Stream Sync...");
  const [tweetFeed, setTweetFeed] = useState<string[]>(["System Standby...", "X-API Ready..."]);
  
  // State for the jittery stock line animation
  const [liveGraphData, setLiveGraphData] = useState([40, 42, 38, 45, 43, 50]);

  const mockTweets = [
    "@crypto_whale: $BTC looking extremely bullish on the 4H chart! 🚀",
    "@MarketWatcher: Seeing heavy sell pressure on $ETH near resistance.",
    "@StockGuru: Tech stocks are rebounding after the morning dip. $AAPL",
    "@SentimentBot: Unusual volume detected in $SOL mentions. Monitoring...",
    "@FinNews: Consumer sentiment data is out. Markets reacting negatively.",
    "@AlphaTraders: Just loaded up on more $LINK. Long term play. 💎",
    "@DeFi_Daily: TVL in ecosystem is dropping. Bearish signal for now.",
    "@Web3Whiz: AI-based tokens are the main narrative this week. $RNDR"
  ];

  // Logic to Connect Real MetaMask Wallet
  const handleConnect = async () => {
    try {
      setStatus("Connecting to MetaMask...");
      const signer = await getProviderOrSigner(true); 
      const address = await (signer as ethers.Signer).getAddress();
      setWalletAddress(address);
      setStatus("Wallet Connected");
    } catch (err: any) {
      console.error("Connection failed:", err);
      setStatus("Connection Failed");
      alert("Could not connect to MetaMask. Make sure it is unlocked.");
    }
  };

  // Volatility Animation during loading
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLiveGraphData(prev => {
          const newData = [...prev.slice(1)];
          newData.push(Math.floor(Math.random() * (90 - 10 + 1)) + 10);
          return newData;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const triggerTwitterSync = () => {
    setLoading(true);
    setStatus("Scraping Background Tweets...");
    setTweetFeed(["Connecting to X-Firehose..."]);
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < mockTweets.length) {
        setTweetFeed(prev => [mockTweets[i], ...prev.slice(0, 4)]);
        i++;
      } else {
        clearInterval(interval);
        const finalScore = Math.floor(Math.random() * (98 - 12 + 1)) + 12;
        setSentimentValue(finalScore);
        setLiveGraphData([40, 45, 35, 50, 48, finalScore]); 
        setLoading(false);
        setStatus("Batch Analysis Complete");
      }
    }, 800);
  };

  const getVerdict = () => {
    if (sentimentValue >= 70) return { label: "BUY", color: "#22c55e" };
    if (sentimentValue <= 30) return { label: "SELL", color: "#ef4444" };
    return { label: "NEUTRAL", color: "#eab308" };
  };

  const verdict = getVerdict();

  const chartData = {
    labels: ['', '', '', '', '', 'LIVE'],
    datasets: [{
      label: 'Volatility Index',
      data: liveGraphData,
      borderColor: loading ? '#f59e0b' : '#6366f1',
      backgroundColor: loading ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: loading ? 0 : 5,
    }]
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 md:p-8">
      {/* SentiMint Navbar */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-8 bg-[#0f172a] border border-slate-800 p-5 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-black text-xl italic">S</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">SentiMint</h1>
        </div>
        <button 
          onClick={handleConnect} 
          className="px-6 py-2 bg-slate-900 hover:bg-slate-800 rounded-full text-xs font-bold border border-slate-700 transition-all active:scale-95"
        >
          {walletAddress ? `Wallet: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
        </button>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Speed Dial & Tweet Scraper */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Aggregated Sentiment</h3>
            <GaugeComponent
              value={sentimentValue}
              type="semicircle"
              arc={{
                width: 0.15, padding: 0.005, cornerRadius: 1,
                subArcs: [
                  { limit: 30, color: '#ef4444' },
                  { limit: 70, color: '#eab308' },
                  { limit: 100, color: '#22c55e' },
                ]
              }}
              pointer={{ type: "needle", color: '#94a3b8', elastic: true }}
              labels={{ valueLabel: { style: { fontSize: "40px", fill: "#fff", fontWeight: "800" } } }}
            />
            <div className="text-center mt-4">
              <span className="text-3xl font-black italic tracking-tighter" style={{ color: verdict.color }}>
                {verdict.label}
              </span>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live X-Stream Feed</h3>
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></div>
            </div>
            <div className="space-y-3 h-52 overflow-hidden font-mono text-[10px]">
              {tweetFeed.map((tweet, idx) => (
                <div key={idx} className="p-2 border-b border-white/5 opacity-80 animate-in fade-in slide-in-from-bottom-1">
                   <span className="text-indigo-400 font-bold mr-1">[$]</span> {tweet}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Graph & Minting */}
        <div className="lg:col-span-8 bg-[#0f172a] border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-2xl font-bold italic">Twitter Sentiment Velocity</h2>
              <p className="text-sm text-slate-500 font-mono">Real-time inference via Go-Backend Engine</p>
            </div>
            <button 
              onClick={triggerTwitterSync}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? "SYNCING DATA..." : "SYNC LIVE FEED"}
            </button>
          </div>
          
          <div className="flex-grow min-h-[350px]">
            <Line 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                animation: { duration: loading ? 0 : 1000 },
                scales: { 
                  y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#475569' } },
                  x: { grid: { display: false }, ticks: { display: false } }
                },
                plugins: { legend: { display: false } }
              }} 
            />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-800 pt-8">
            <div className="flex flex-col justify-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Backend Status</p>
              <p className="text-sm font-mono text-indigo-400">{status}</p>
            </div>
            <button 
              onClick={() => tokenizeText(sentimentValue)}
              disabled={loading || !walletAddress || sentimentValue === 50}
              className="bg-white text-black font-black rounded-2xl py-3 hover:bg-slate-200 transition-all uppercase text-sm tracking-tighter disabled:opacity-30"
            >
              Mint VibeScore to Chain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;