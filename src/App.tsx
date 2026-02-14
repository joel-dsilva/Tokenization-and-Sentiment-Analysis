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
  const [status, setStatus] = useState("SYSTEM_IDLE");
  const [tweetFeed, setTweetFeed] = useState<string[]>(["[LOG] Ready for X-Firehose Sync", "[LOG] Latency: 14ms"]);
  const [liveGraphData, setLiveGraphData] = useState([40, 42, 38, 45, 43, 50]);
  
  // NEW: State for the professional alert
  const [showAlert, setShowAlert] = useState(false);
  const [selectedModule, setSelectedModule] = useState("");

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

  const handleSidebarClick = (moduleName: string) => {
    if (moduleName === "Dashboard") return; // Allow dashboard
    setSelectedModule(moduleName.toUpperCase());
    setShowAlert(true);
    // Auto-hide after 3 seconds
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleConnect = async () => {
    try {
      setStatus("AUTH_REQUEST");
      const signer = await getProviderOrSigner(true); 
      const address = await (signer as ethers.Signer).getAddress();
      setWalletAddress(address);
      setStatus("AUTH_SUCCESS");
    } catch (err: any) {
      setStatus("AUTH_ERROR");
    }
  };

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLiveGraphData(prev => {
          const newData = [...prev.slice(1)];
          newData.push(Math.floor(Math.random() * (90 - 10 + 1)) + 10);
          return newData;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const triggerTwitterSync = () => {
    setLoading(true);
    setStatus("VECTOR_ANALYSIS");
    let i = 0;
    const interval = setInterval(() => {
      if (i < mockTweets.length) {
        setTweetFeed(prev => [`[INCOMING] ${mockTweets[i]}`, ...prev.slice(0, 5)]);
        i++;
      } else {
        clearInterval(interval);
        const finalScore = Math.floor(Math.random() * (98 - 12 + 1)) + 12;
        setSentimentValue(finalScore);
        setLiveGraphData([40, 45, 35, 50, 48, finalScore]); 
        setLoading(false);
        setStatus("ANALYSIS_COMPLETE");
      }
    }, 600);
  };

  const getVerdict = () => {
    if (sentimentValue >= 70) return { label: "STRONG BUY", color: "#22c55e", desc: "Bullish divergence detected across 42 sources." };
    if (sentimentValue <= 30) return { label: "STRONG SELL", color: "#ef4444", desc: "Bearish pressure mounting. Exit advised." };
    return { label: "HOLD / NEUTRAL", color: "#eab308", desc: "Market consolidating. No clear direction." };
  };

  const verdict = getVerdict();

  const chartData = {
    labels: ['', '', '', '', '', 'LIVE'],
    datasets: [{
      label: 'Confidence',
      data: liveGraphData,
      borderColor: loading ? '#f59e0b' : '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.05)',
      fill: true,
      tension: 0.2,
      pointRadius: 2,
      borderWidth: 2,
    }]
  };

  return (
    <div className="flex min-h-screen bg-[#02040a] text-slate-300 font-mono selection:bg-indigo-500/30 overflow-hidden">
      
      {/* PROFESSIONAL DEV ALERT OVERLAY */}
      {showAlert && (
        <div className="fixed top-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-300">
          <div className="bg-[#0f172a] border-l-4 border-indigo-500 p-5 rounded-r-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md border border-white/5 flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-500/20 rounded flex items-center justify-center">
                <span className="text-indigo-400 font-black animate-pulse">!</span>
             </div>
             <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">{selectedModule} LOCKED</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">MODULE CURRENTLY UNDER DEPLOYMENT (V2.1)</p>
             </div>
             <button onClick={() => setShowAlert(false)} className="ml-4 text-slate-600 hover:text-white transition-colors text-xs font-black">X</button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-20 lg:w-64 bg-[#0a0d14] border-r border-slate-800 hidden md:flex flex-col py-8 px-4">
        <div className="flex items-center gap-3 px-2 mb-12">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-black text-white italic">S</div>
          <span className="hidden lg:block text-lg font-black tracking-tighter text-white uppercase">SentiMint</span>
        </div>
        <nav className="flex-grow space-y-2">
          {['Dashboard', 'X-Scanner', 'Portfolio', 'History', 'API Settings'].map((item, idx) => (
            <div 
              key={item} 
              onClick={() => handleSidebarClick(item)}
              className={`p-3 rounded-lg text-[10px] font-black transition-all cursor-pointer uppercase tracking-tighter ${idx === 0 ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'hover:bg-slate-800/50 text-slate-500'}`}
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-4 lg:p-8 space-y-6 overflow-y-auto">
        
        {/* HEADER BAR */}
        <header className="flex justify-between items-center bg-[#0d1117] border border-slate-800 p-4 rounded-xl shadow-sm">
           <div className="flex gap-10">
              <div>
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">System Status</p>
                <p className={`text-[10px] font-black ${loading ? 'text-amber-400' : 'text-emerald-400'}`}>{status}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Active Pair</p>
                <p className="text-[10px] font-black text-white">X-CORE / SEPT</p>
              </div>
           </div>
           <button onClick={handleConnect} className="text-[9px] font-black px-5 py-2.5 border border-slate-700 rounded bg-slate-900/50 hover:border-indigo-500 transition-all uppercase tracking-widest">
             {walletAddress ? `CONNECTED: ${walletAddress.slice(0,6)}...` : "CONNECT WALLET"}
           </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CHART AREA */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-[#0d1117] border border-slate-800 p-8 rounded-2xl h-[480px] flex flex-col relative shadow-inner">
               <div className="mb-8">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Sentiment Velocity</h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-tight">ANALYZING SOCIAL DATA PACKETS VS. LIQUIDITY FLOWS</p>
               </div>
               <div className="flex-grow">
                  <Line 
                    data={chartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: { 
                        y: { display: true, grid: { color: '#161b22' }, ticks: { color: '#484f58', font: { size: 9, family: 'monospace' } } },
                        x: { display: false }
                      },
                      plugins: { legend: { display: false } }
                    }} 
                  />
               </div>
            </div>

            {/* LOGS AND SYNC BUTTON */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               <div className="lg:col-span-8 bg-[#0d1117] border border-slate-800 p-6 rounded-2xl">
                  <p className="text-[8px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-4">Neural Data Log</p>
                  <div className="space-y-2 h-28 overflow-hidden font-mono text-[10px]">
                    {tweetFeed.map((t, i) => (
                      <div key={i} className="flex gap-2 text-slate-400 border-b border-white/5 pb-1">
                        <span className="text-slate-600 opacity-50">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
                        <span className="truncate">{t}</span>
                      </div>
                    ))}
                  </div>
               </div>
               
               <div className="lg:col-span-4 flex">
                 <button 
                   onClick={triggerTwitterSync}
                   disabled={loading}
                   className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl font-black transition-all text-lg lg:text-xl uppercase italic tracking-tighter shadow-xl shadow-indigo-900/30 flex items-center justify-center p-4 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
                 >
                   {loading ? "SCANNING..." : "SYNC DATA"}
                 </button>
               </div>
            </div>
          </section>

          {/* EXECUTION SIDEBAR */}
          <section className="space-y-6">
            <div className="bg-[#0d1117] border border-slate-800 p-8 rounded-2xl flex flex-col items-center shadow-lg">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Aggregated Vibe</p>
               <GaugeComponent
                value={sentimentValue}
                type="semicircle"
                arc={{ width: 0.1, padding: 0.02, subArcs: [{ limit: 30, color: '#ef4444' }, { limit: 70, color: '#eab308' }, { limit: 100, color: '#22c55e' }] }}
                pointer={{ type: "needle", color: '#444c56', width: 8 }}
                labels={{ valueLabel: { style: { fontSize: "36px", fill: "#fff", fontWeight: "900", fontFamily: 'monospace' } } }}
               />
               <div className="text-center mt-8">
                 <div className="text-2xl font-black italic tracking-tighter mb-2" style={{ color: verdict.color }}>{verdict.label}</div>
                 <p className="text-[10px] text-slate-500 leading-relaxed font-bold tracking-tight uppercase px-2">{verdict.desc}</p>
               </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/20 to-transparent border border-indigo-500/20 p-8 rounded-2xl relative overflow-hidden">
               <div className="relative z-10">
                 <h4 className="text-[10px] font-black text-white uppercase mb-4 tracking-[0.2em]">Settlement Engine</h4>
                 <p className="text-[9px] text-slate-500 mb-8 font-bold leading-tight">MINT CURRENT NEURAL ANALYSIS AS AN ON-CHAIN VIBESCORE RECORD.</p>
                 <button 
                   onClick={() => tokenizeText(sentimentValue)}
                   disabled={loading || !walletAddress}
                   className="w-full bg-white text-black py-4 rounded-xl font-black text-sm uppercase tracking-tighter hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-20 shadow-lg"
                 >
                   MINT VIBESCORE
                 </button>
               </div>
               <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default App;