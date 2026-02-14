import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import GaugeComponent from 'react-gauge-component';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const App = () => {
  // --- STATE MANAGEMENT ---
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [sentimentValue, setSentimentValue] = useState<number>(50);
  const [status, setStatus] = useState("SYSTEM_IDLE");
  const [tweetFeed, setTweetFeed] = useState<string[]>(["[SYSTEM] Ready to mount CSV Dataset...", "[WAITING] awaiting user trigger"]);
  const [liveGraphData, setLiveGraphData] = useState([50, 50, 50, 50, 50, 50]);
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: "", desc: "", type: "info" });

  // --- CHAOTIC SENTIMENT ENGINE ---
  const calculateVibe = (text: string) => {
    const lower = text.toLowerCase();
    
    // 1. Base Score starts completely random (10 to 90)
    let score = Math.floor(Math.random() * 80) + 10; 

    // 2. Keyword Boosters (Make it even more extreme)
    const bullWords = ['buy', 'moon', 'high', 'up', 'profit', 'green', 'bitcoin', 'crypto', 'good'];
    const bearWords = ['sell', 'dump', 'down', 'crash', 'red', 'loss', 'scam', 'bad', 'drop'];

    bullWords.forEach(word => {
        if (lower.includes(word)) score += 20; // Big jump up
    });

    bearWords.forEach(word => {
        if (lower.includes(word)) score -= 20; // Big jump down
    });

    // 3. Clamp results so they stay on screen (0 to 100)
    return Math.min(Math.max(score, 0), 100);
  };

  // --- INTERACTION HANDLERS ---
  const simulateConnect = () => {
    setStatus("ESTABLISHING_UPLINK...");
    setTimeout(() => {
      setWalletAddress("0x71C...3A9");
      setStatus("UPLINK_SECURE");
      triggerAlert("WALLET CONNECTED", "SEPOLIA TESTNET // ID: 11155111", "success");
    }, 800);
  };

  const simulateMint = () => {
    setMinting(true);
    setStatus("SIGNING_TRANSACTION...");
    setTimeout(() => {
      setMinting(false);
      setStatus("TX_CONFIRMED");
      const fakeHash = "0x" + Math.random().toString(16).substr(2, 8) + "..." + Math.random().toString(16).substr(2, 4);
      triggerAlert("VIBESCORE MINTED", `BLOCK: 5829102 // HASH: ${fakeHash}`, "success");
    }, 3000);
  };

  const triggerAlert = (title: string, desc: string, type: "info" | "success") => {
    setAlertConfig({ title, desc, type });
    setShowAlert(true);
    
    // This makes it stay for 4 seconds
    setTimeout(() => setShowAlert(false), 4000);
  };

  // --- CORE LOGIC ---
  const triggerDataSync = async () => {
    setLoading(true);
    setStatus("READING_LOCAL_CSV");

    try {
      const response = await fetch('/dataset.csv');
      const text = await response.text();

      if(text.trim().startsWith("<!")) throw new Error("File not found (HTML returned)");

      const lines = text.split('\n').filter(line => line.trim() !== '');
      const dataRows = lines.slice(1); 

      // Pick 15 random rows for a longer animation
      const shuffled = dataRows.sort(() => 0.5 - Math.random()).slice(0, 15);

      const parsedBatch = shuffled.map(line => {
        const parts = line.split(',');
        const longestPart = parts.reduce((a, b) => a.length > b.length ? a : b, "");
        const cleanText = longestPart.replace(/['"]+/g, '').trim();
        
        return {
          text: cleanText,
          score: calculateVibe(cleanText)
        };
      });

      console.log("Analyzed Data:", parsedBatch); 

      let i = 0;
      setStatus("PROCESSING_DATASET");
      
      const interval = setInterval(() => {
        if (i < parsedBatch.length) {
          const item = parsedBatch[i];
          
          setTweetFeed(prev => [`[ANALYZED] ${item.text.substring(0, 40)}...`, ...prev.slice(0, 5)]);
          
          // Update the main Sentiment Value (controls the Gauge)
          setSentimentValue(item.score); 

          // Update Graph
          setLiveGraphData(prev => {
             const newData = [...prev.slice(1)];
             newData.push(item.score);
             return newData;
          });
          
          i++;
        } else {
          clearInterval(interval);
          setLoading(false);
          setStatus("ANALYSIS_COMPLETE");
        }
      }, 300); // Fast updates (300ms)

    } catch (err) {
      console.error(err);
      triggerAlert("READ ERROR", "Check Console (F12)", "info");
      setLoading(false);
      setStatus("IO_ERROR");
    }
  };

  const getVerdict = () => {
    if (sentimentValue >= 60) return { label: "STRONG BUY", color: "#22c55e", desc: "EXTREME BULLISH PRESSURE DETECTED." };
    if (sentimentValue <= 40) return { label: "STRONG SELL", color: "#ef4444", desc: "EXTREME BEARISH PRESSURE DETECTED." };
    return { label: "VOLATILE", color: "#eab308", desc: "High volatility. Indecisive market." };
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
      tension: 0, // STRAIGHT LINES
      pointRadius: 5,
      borderWidth: 2,
    }]
  };

  return (
    <div className="flex min-h-screen bg-[#02040a] text-slate-300 font-mono selection:bg-indigo-500/30 overflow-hidden">
      
      {showAlert && (
        <div className="fixed top-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-300">
          <div className={`border-l-4 p-5 rounded-r-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md border border-white/5 flex items-center gap-4 ${alertConfig.type === 'success' ? 'bg-emerald-900/20 border-emerald-500' : 'bg-[#0f172a] border-indigo-500'}`}>
             <div className={`w-10 h-10 rounded flex items-center justify-center ${alertConfig.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                <span className="font-black animate-pulse">{alertConfig.type === 'success' ? '✓' : '!'}</span>
             </div>
             <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">{alertConfig.title}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{alertConfig.desc}</p>
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
              onClick={() => triggerAlert(`${item.toUpperCase()} LOCKED`, "THIS MODULE IS UNDER BUILDING", "info")}
              className={`p-3 rounded-lg text-[10px] font-black transition-all cursor-pointer uppercase tracking-tighter ${idx === 0 ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'hover:bg-slate-800/50 text-slate-500'}`}
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-4 lg:p-8 space-y-6 overflow-y-auto">
        <header className="flex justify-between items-center bg-[#0d1117] border border-slate-800 p-4 rounded-xl shadow-sm">
           <div className="flex gap-10">
              <div>
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">System Status</p>
                <p className={`text-[10px] font-black ${loading || minting ? 'text-amber-400' : 'text-emerald-400'}`}>{status}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Active Pair</p>
                <p className="text-[10px] font-black text-white">X-CORE / SEPT</p>
              </div>
           </div>
           <button onClick={simulateConnect} className="text-[9px] font-black px-5 py-2.5 border border-slate-700 rounded bg-slate-900/50 hover:border-emerald-500 hover:text-emerald-400 transition-all uppercase tracking-widest">
             {walletAddress ? `CONNECTED: ${walletAddress}` : "CONNECT WALLET"}
           </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-[#0d1117] border border-slate-800 p-8 rounded-2xl h-[480px] flex flex-col relative shadow-inner">
               <div className="mb-8">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Sentiment Velocity</h3>
                  <p className="text-[10px] text-slate-500 font-bold tracking-tight">ANALYZING CSV DATA PACKETS VS. LIQUIDITY FLOWS</p>
               </div>
               <div className="flex-grow">
                  <Line 
                    data={chartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      animation: { duration: 0 }, 
                      scales: { 
                        y: { 
                          display: true, 
                          min: 0,   
                          max: 100, 
                          grid: { color: '#161b22' }, 
                          ticks: { stepSize: 25, color: '#484f58', font: { size: 9, family: 'monospace' } } 
                        },
                        x: { display: false }
                      },
                      plugins: { legend: { display: false } }
                    }} 
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               <div className="lg:col-span-8 bg-[#0d1117] border border-slate-800 p-6 rounded-2xl">
                  <p className="text-[8px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-4">Live Dataset Feed</p>
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
                   onClick={triggerDataSync}
                   disabled={loading || minting}
                   className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl font-black transition-all text-lg lg:text-xl uppercase italic tracking-tighter shadow-xl shadow-indigo-900/30 flex items-center justify-center p-4 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
                 >
                   {loading ? "SCANNING..." : "RUN ANALYSIS"}
                 </button>
               </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="bg-[#0d1117] border border-slate-800 p-8 rounded-2xl flex flex-col items-center shadow-lg">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">Aggregated Vibe</p>
               <GaugeComponent
                value={sentimentValue}
                type="semicircle"
                arc={{ width: 0.1, padding: 0.02, subArcs: [{ limit: 40, color: '#ef4444' }, { limit: 60, color: '#eab308' }, { limit: 100, color: '#22c55e' }] }}
                pointer={{ type: "needle", color: '#444c56', width: 8, animate: true }}
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
                 <p className="text-[9px] text-slate-500 mb-8 font-bold leading-tight">MINT CURRENT CSV ANALYSIS AS AN ON-CHAIN VIBESCORE RECORD.</p>
                 <button 
                   onClick={simulateMint}
                   disabled={loading || !walletAddress || minting}
                   className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-tighter transition-all shadow-lg ${minting ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white text-black hover:bg-indigo-50 active:scale-95 disabled:opacity-20'}`}
                 >
                   {minting ? "CONFIRMING TX..." : "MINT VIBESCORE"}
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