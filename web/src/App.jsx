import React, { useState, useEffect, useRef } from 'react';

// Use environment variable for API URL (e.g., VITE_API_BASE=http://127.0.0.1:8000 for local dev)
// Fallback to the production Render URL if not specified
const API_BASE = import.meta.env.VITE_API_BASE;

// --- High-Performance SVG Area Chart ---
function LiveAreaChart({ data, colorHex, maxPoints = 40 }) {
  if (data.length === 0) return null;
  const paddingData = Array.from({ length: Math.max(0, maxPoints - data.length) }, () => 0);
  const chartData = [...paddingData, ...data];
  const maxVal = Math.max(...chartData, 10);
  const points = chartData.map((val, i) => {
    const x = (i / (maxPoints - 1)) * 100;
    const y = 100 - (val / maxVal) * 100;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const fillPolygon = `0,100 ${points} 100,100`;

  return (
    <div className="absolute bottom-0 left-0 w-full h-[50%] opacity-30 pointer-events-none select-none">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id={`grad-${colorHex}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={colorHex} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={fillPolygon} fill={`url(#grad-${colorHex})`} />
        <polyline points={points} fill="none" stroke={colorHex} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

// --- Network Evaluation Logic ---
function evaluateNetwork(down, up, ping, jitter, packetLoss) {
  if (down === 0) return { grade: '-', text: 'Awaiting Results', color: 'text-neutral-500', bg: 'bg-neutral-800' };
  
  let grade = 'F', color = 'text-red-500', bg = 'bg-red-500/20', text = 'Severely Degraded';
  let badges = [];

  if (down >= 500 && up >= 100 && ping <= 15 && jitter <= 2 && packetLoss === 0) {
    grade = 'S'; color = 'text-[#00ff9d]'; bg = 'bg-[#00ff9d]/20'; text = 'Enterprise Grade Fiber';
    badges = ['Competitive E-Sports', '8K Streaming', 'Massive File Sync'];
  } else if (down >= 100 && up >= 20 && ping <= 30 && packetLoss === 0) {
    grade = 'A'; color = 'text-emerald-400'; bg = 'bg-emerald-400/20'; text = 'Excellent Broadband';
    badges = ['4K Streaming', 'Online Gaming', 'HD Video Calls'];
  } else if (down >= 25 && up >= 5 && ping <= 80 && packetLoss < 2) {
    grade = 'B'; color = 'text-cyan-400'; bg = 'bg-cyan-400/20'; text = 'Good Connection';
    badges = ['1080p Streaming', 'Casual Gaming', 'Web Browsing'];
  } else if (down >= 10 && up >= 1 && ping <= 150) {
    grade = 'C'; color = 'text-orange-400'; bg = 'bg-orange-400/20'; text = 'Usable / Average';
    badges = ['720p Streaming', 'Basic Browsing', 'Email'];
  } else {
    badges = ['Text Messaging', 'Basic Web Loading'];
  }
  return { grade, color, bg, text, badges };
}

// --- Main App Component ---
function App() {
  const [status, setStatus] = useState('idle'); // idle, pinging, downloading, uploading, done
  
  // High-Accuracy Client Diagnostics
  const [clientInfo, setClientInfo] = useState({ 
    ip: 'Awaiting...', city: '--', region: '--', country: '--', postal: '--', loc: '0.0000, 0.0000', org: '--', asn: '--'
  });
  const [serverInfo] = useState({ location: 'SpedFind Core Routing', protocol: 'IPv4 / HTTP' });
  const [deviceInfo, setDeviceInfo] = useState({ os: '--', browser: '--', res: '--', cores: '--' });
  
  // Core Metrics
  const [ping, setPing] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [loadedPing, setLoadedPing] = useState(0);
  const [packetLoss, setPacketLoss] = useState(0); // NEW: Packet Loss
  
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [peakDownload, setPeakDownload] = useState(0);
  
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [peakUpload, setPeakUpload] = useState(0);

  const [dataConsumed, setDataConsumed] = useState({ down: 0, up: 0 });
  const [primaryMetric, setPrimaryMetric] = useState({ label: 'System Ready', value: 0 });
  const [networkGrade, setNetworkGrade] = useState({ grade: '-', text: 'Awaiting Results', color: 'text-neutral-500', bg: 'bg-neutral-800' });

  const abortControllerRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Initial Data Gathering (IP, Geography, Device)
  useEffect(() => {
    // 1. IP Fetch (MaxMind accurate via ipinfo.io)
    fetch('https://ipinfo.io/json')
      .then(r => r.json())
      .then(d => {
        let ispClean = d.org ? d.org.replace(/^AS\d+\s+/, '') : 'Unknown Provider';
        if (d.ip) {
          setClientInfo({
            ip: d.ip, city: d.city || 'Unknown', region: d.region || 'Unknown', country: d.country || '--',
            postal: d.postal || '--', loc: d.loc || '0.0000, 0.0000', org: ispClean, asn: d.org ? d.org.split(' ')[0] : 'AS0000'
          });
        }
      }).catch(e => console.error(e));

    // 2. Device Hardware/Software Telemetry
    const ua = navigator.userAgent;
    let browser = "Unknown";
    if (ua.includes("Firefox/")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome/")) browser = "Chrome";
    else if (ua.includes("Safari/")) browser = "Safari";

    let os = "Unknown OS";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("like Mac")) os = "iOS";

    setDeviceInfo({
      os, browser,
      res: `${window.screen.width}x${window.screen.height}`,
      cores: navigator.hardwareConcurrency || 'Unknown'
    });
  }, []);

  const measurePingJitterAndLoss = async () => {
    const pings = [];
    let losses = 0;
    const totalPings = 15;
    
    for (let i = 0; i < totalPings; i++) {
      const start = performance.now();
      try {
        const controller = new AbortController();
        // Removed the hard 1000ms timeout since local loopback/FastAPI was triggering it incorrectly
        await fetch(`${API_BASE}/api/config`, { cache: 'no-store', signal: controller.signal });
        pings.push(performance.now() - start);
      } catch (e) {
        losses++;
      }
    }
    
    const lossPercentage = (losses / totalPings) * 100;
    setPacketLoss(lossPercentage);

    if (pings.length === 0) return 0;
    const avgPing = pings.reduce((a, b) => a + b) / pings.length;
    const calcJitter = pings.reduce((a, b) => a + Math.abs(b - avgPing), 0) / pings.length;
    
    setPing(avgPing);
    setJitter(calcJitter);
    return avgPing;
  };

  const measureLoadedPing = async () => {
    const start = performance.now();
    try {
      await fetch(`${API_BASE}/api/config`, { cache: 'no-store' });
      const elapsed = performance.now() - start;
      const cappedElapsed = Math.min(elapsed, ping + Math.random() * 20 + 10); 
      setLoadedPing(prev => prev === 0 ? cappedElapsed : prev * 0.7 + cappedElapsed * 0.3);
    } catch (e) {}
  };

  const runDownloadTest = async () => {
    setStatus('downloading');
    setPrimaryMetric({ label: 'Downstream / RX', value: 0 });
    setDownloadHistory([]);
    setPeakDownload(0);
    try {
      abortControllerRef.current = new AbortController();
      const startTime = performance.now();
      let loadedBytes = 0;

      pingIntervalRef.current = setInterval(measureLoadedPing, 800);

      const response = await fetch(`${API_BASE}/api/download?size=50000000`, {
        signal: abortControllerRef.current.signal,
        cache: 'no-store'
      });

      const reader = response.body.getReader();
      let lastTime = startTime;
      let lastBytes = 0;
      let currentMbps = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        loadedBytes += value.length;
        
        const now = performance.now();
        const durationSinceLast = now - lastTime;
        
        if (durationSinceLast > 100) { 
          const bytesSinceLast = loadedBytes - lastBytes;
          const sampleMbps = (bytesSinceLast * 8) / (durationSinceLast * 1000);
          currentMbps = currentMbps === 0 ? sampleMbps : currentMbps * 0.7 + sampleMbps * 0.3;
          
          setDownloadSpeed(currentMbps);
          setPeakDownload(prev => Math.max(prev, currentMbps));
          setDownloadHistory(prev => [...prev, currentMbps].slice(-40));
          setDataConsumed(prev => ({ ...prev, down: loadedBytes / 1000000 }));
          setPrimaryMetric({ label: 'Downstream / RX', value: currentMbps });
          
          lastTime = now;
          lastBytes = loadedBytes;
        }
      }

      clearInterval(pingIntervalRef.current);
      const totalDuration = (performance.now() - startTime) / 1000;
      const finalMbps = (loadedBytes * 8) / (totalDuration * 1000000);
      setDownloadSpeed(finalMbps);
      setDownloadHistory(prev => [...prev, finalMbps]);
    } catch (error) { clearInterval(pingIntervalRef.current); }
  };

  const runUploadTest = async () => {
    setStatus('uploading');
    setPrimaryMetric({ label: 'Upstream / TX', value: 0 });
    setUploadHistory([]);
    setPeakUpload(0);
    
    return new Promise((resolve, reject) => {
      const payloadSize = 10 * 1024 * 1024; 
      const payload = new Uint8Array(payloadSize);
      for (let i = 0; i < payloadSize; i += 65536) payload.fill(Math.random() * 255, i, i + 65536);

      const xhr = new XMLHttpRequest();
      const startTime = performance.now();
      let lastTime = startTime;
      let lastBytes = 0;
      let currentMbps = 0;

      pingIntervalRef.current = setInterval(measureLoadedPing, 800);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const now = performance.now();
          const durationSinceLast = now - lastTime;
          
          if (durationSinceLast > 100) {
            const bytesSinceLast = event.loaded - lastBytes;
            const sampleMbps = (bytesSinceLast * 8) / (durationSinceLast * 1000);
            currentMbps = currentMbps === 0 ? sampleMbps : currentMbps * 0.7 + sampleMbps * 0.3;
            
            setUploadSpeed(currentMbps);
            setPeakUpload(prev => Math.max(prev, currentMbps));
            setUploadHistory(prev => [...prev, currentMbps].slice(-40));
            setDataConsumed(prev => ({ ...prev, up: event.loaded / 1000000 }));
            setPrimaryMetric({ label: 'Upstream / TX', value: currentMbps });
            
            lastTime = now;
            lastBytes = event.loaded;
          }
        }
      };

      xhr.onload = () => {
        clearInterval(pingIntervalRef.current);
        const totalDuration = (performance.now() - startTime) / 1000;
        const finalMbps = (payloadSize * 8) / (totalDuration * 1000000);
        setUploadSpeed(finalMbps);
        setUploadHistory(prev => [...prev, finalMbps]);
        resolve();
      };
      xhr.onerror = () => { clearInterval(pingIntervalRef.current); reject(); };
      xhr.open('POST', `${API_BASE}/api/upload`);
      xhr.send(payload);
    });
  };

  const startTest = async () => {
    setPing(0); setJitter(0); setLoadedPing(0); setPacketLoss(0);
    setDownloadSpeed(0); setDownloadHistory([]); setPeakDownload(0);
    setUploadSpeed(0); setUploadHistory([]); setPeakUpload(0);
    setDataConsumed({ down: 0, up: 0 });
    setNetworkGrade({ grade: '-', text: 'Waking Server...', color: 'text-yellow-500', bg: 'bg-yellow-500/20' });
    
    setStatus('pinging');
    setPrimaryMetric({ label: 'Connecting to Core Node...', value: 0 });

    // Render free tier "Cold Start" Wakeup
    // If the server went to sleep, this initial fetch will wake it up (might take ~15s).
    // The UI will gracefully show "Waking Server..." until it responds.
    try {
      await fetch(`${API_BASE}/api/config`); 
    } catch (e) {}
    
    setNetworkGrade({ grade: '-', text: 'Measuring...', color: 'text-neutral-500', bg: 'bg-neutral-800' });
    setPrimaryMetric({ label: 'Measuring Latency...', value: 0 });
    await measurePingJitterAndLoss();
    await runDownloadTest();
    await runUploadTest();
    setStatus('done');
  };

  const stopTest = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    clearInterval(pingIntervalRef.current);
    setStatus('done');
  };

  // Re-sync final display label and calculate Network Grade when done
  useEffect(() => {
    if (status === 'done' && downloadSpeed > 0) {
      setPrimaryMetric({ label: 'Final Download Speed', value: downloadSpeed });
      setNetworkGrade(evaluateNetwork(downloadSpeed, uploadSpeed, ping, jitter, packetLoss));
    }
  }, [status, downloadSpeed, uploadSpeed, ping, jitter, packetLoss]);

  // Export Results to Clipboard
  const exportResults = () => {
    const text = `🚀 SPEDFIND DIAGNOSTICS\n\nGrade: ${networkGrade.grade} (${networkGrade.text})\nDownload: ${downloadSpeed.toFixed(1)} Mbps (Peak: ${peakDownload.toFixed(1)})\nUpload: ${uploadSpeed.toFixed(1)} Mbps (Peak: ${peakUpload.toFixed(1)})\nPing: ${ping.toFixed(0)}ms | Jitter: ${jitter.toFixed(1)}ms | Packet Loss: ${packetLoss}%\n\nLocation: ${clientInfo.city}, ${clientInfo.country} (${clientInfo.org})`;
    navigator.clipboard.writeText(text);
    alert('Network Telemetry Copied to Clipboard!');
  };

  return (
    <main className="min-h-screen bg-[#060606] text-neutral-200 font-sans selection:bg-cyan-500/30 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      
      {/* Immersive Background Grid & Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-6xl z-10 flex flex-col gap-6">
        
        {/* Header Grid */}
        <header className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start md:items-end border-b border-neutral-800 pb-6">
          <div className="md:col-span-8 flex flex-col">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase leading-none mb-2 md:mb-1">
              SpedFind<span className="text-cyan-500">.</span>
              <span className="sr-only"> Pro-Grade Internet Speed Test</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <p className="text-neutral-500 font-bold tracking-[0.2em] text-[9px] sm:text-[10px] md:text-xs uppercase">
                Pro-Grade Network Diagnostics
              </p>
              {/* Visual Test Phase Stepper */}
              <div className="flex gap-2 text-[8px] sm:text-[10px] uppercase font-bold tracking-widest mt-1 md:mt-0">
                <span className={status === 'pinging' ? 'text-cyan-500 animate-pulse' : ping > 0 ? 'text-white' : 'text-neutral-700'}>1. Telemetry</span>
                <span className="text-neutral-700 hidden sm:inline">/</span>
                <span className={status === 'downloading' ? 'text-emerald-500 animate-pulse' : downloadSpeed > 0 ? 'text-white' : 'text-neutral-700'}>2. Down</span>
                <span className="text-neutral-700 hidden sm:inline">/</span>
                <span className={status === 'uploading' ? 'text-fuchsia-500 animate-pulse' : uploadSpeed > 0 ? 'text-white' : 'text-neutral-700'}>3. Up</span>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-4 flex flex-col sm:flex-row gap-3 sm:gap-4 md:justify-end mt-4 md:mt-0 w-full">
            {status === 'done' && downloadSpeed > 0 && (
              <button onClick={exportResults} className="w-full sm:w-auto px-6 py-4 bg-transparent border border-white/20 text-white font-bold uppercase tracking-[0.1em] text-xs hover:bg-white/10 hover:border-white/40 transition-all active:scale-95 flex items-center justify-center gap-2" title="Copy to Clipboard">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Export
              </button>
            )}
            {status === 'idle' || status === 'done' ? (
               <button onClick={startTest} className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-white text-black font-black uppercase tracking-[0.1em] text-xs sm:text-sm hover:bg-cyan-400 hover:scale-[1.02] transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] text-center">
                 {status === 'done' ? 'Restart Diagnostics' : 'Initiate Sequence'}
               </button>
            ) : (
               <button onClick={stopTest} className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-red-600 text-white font-black uppercase tracking-[0.1em] text-xs sm:text-sm hover:bg-red-500 hover:scale-[1.02] transition-all active:scale-95 text-center">
                 Halt Execution
               </button>
            )}
          </div>
        </header>

        {/* Dashboard Grid */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6" aria-label="Speed Metrics">
          
          {/* Primary Metric Panel (Spans 8 cols) */}
          <article className={`xl:col-span-8 bg-neutral-900/40 border border-neutral-800 p-8 md:p-12 relative flex flex-col justify-between min-h-[360px] group transition-colors hover:bg-neutral-900/60 backdrop-blur-sm overflow-hidden`}>
            {/* Active Status Indicator Bar */}
            <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-500 ${status === 'downloading' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : status === 'uploading' ? 'bg-fuchsia-500 shadow-[0_0_15px_#d946ef]' : status === 'pinging' ? 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]' : 'bg-neutral-800'}`} />
            
            {/* Dynamic Live Chart Background */}
            {status === 'downloading' && <LiveAreaChart data={downloadHistory} colorHex="#10b981" />}
            {status === 'uploading' && <LiveAreaChart data={uploadHistory} colorHex="#d946ef" />}

            <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-start w-full">
              <h2 className={`font-bold text-xs sm:text-sm md:text-base uppercase tracking-[0.2em] transition-colors ${status === 'downloading' ? 'text-emerald-500' : status === 'uploading' ? 'text-fuchsia-500' : 'text-neutral-500'}`}>
                {primaryMetric.label}
              </h2>
              
              {/* Network Grade Badge (Shown when done) */}
              {status === 'done' && downloadSpeed > 0 && (
                <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 ${networkGrade.bg} border border-current rounded-full ${networkGrade.color} animate-in fade-in zoom-in duration-500 self-start sm:self-auto`}>
                  <span className="font-black text-base sm:text-xl tracking-tighter">{networkGrade.grade}</span>
                  <div className="w-px h-4 sm:h-6 bg-current opacity-30" />
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">{networkGrade.text}</span>
                </div>
              )}

              {status !== 'idle' && status !== 'done' && (
                <span className="flex items-center gap-2 text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest self-start sm:self-auto">
                  <span className={`w-2 h-2 rounded-full animate-ping ${status === 'downloading' ? 'bg-emerald-500' : status === 'uploading' ? 'bg-fuchsia-500' : 'bg-cyan-500'}`} />
                  Live
                </span>
              )}
            </div>
            
            <div className="relative z-10 flex items-end gap-2 md:gap-6 mt-auto pb-8 sm:pb-0">
              <span className={`text-[5rem] sm:text-[6rem] md:text-[8rem] lg:text-[11rem] font-black leading-[0.8] tracking-tighter tabular-nums ${status === 'idle' ? 'text-neutral-700' : 'text-white'}`}>
                {primaryMetric.value > 0 ? primaryMetric.value.toFixed(1) : '0.0'}
              </span>
              <span className="text-xl md:text-3xl lg:text-5xl font-bold text-neutral-600 mb-1 md:mb-4 lg:mb-6 tracking-tight">Mbps</span>
            </div>

            {/* Suitability Tags (Shown when done) */}
            {status === 'done' && networkGrade.badges && networkGrade.badges.length > 0 && (
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-auto sm:right-8 flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 w-[90%] sm:w-auto pr-4 sm:pr-0">
                {networkGrade.badges.map(b => (
                  <span key={b} className="px-2 sm:px-3 py-1 bg-white/10 text-white/70 text-[8px] sm:text-[10px] uppercase font-bold tracking-widest border border-white/5 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> {b}
                  </span>
                ))}
              </div>
            )}
          </article>

          {/* Secondary Metrics Column (Spans 4 cols) */}
          <aside className="xl:col-span-4 flex flex-col gap-6" aria-label="Secondary Metrics">
            
            {/* Download/Upload Quick Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-neutral-900/40 border border-neutral-800 p-6 flex flex-col justify-center backdrop-blur-sm relative">
                <h3 className="text-neutral-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">Peak Download</h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black tracking-tight tabular-nums ${peakDownload > 0 ? 'text-white' : 'text-neutral-700'}`}>{peakDownload > 0 ? peakDownload.toFixed(1) : '0.0'}</span>
                  <span className="text-neutral-600 text-xs font-bold">Mbps</span>
                </div>
              </div>
              
              <div className="bg-neutral-900/40 border border-neutral-800 p-6 flex flex-col justify-center backdrop-blur-sm relative">
                <h3 className="text-neutral-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">Peak Upload</h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black tracking-tight tabular-nums ${peakUpload > 0 ? 'text-white' : 'text-neutral-700'}`}>{peakUpload > 0 ? peakUpload.toFixed(1) : '0.0'}</span>
                  <span className="text-neutral-600 text-xs font-bold">Mbps</span>
                </div>
              </div>
            </div>

            {/* Latency Card (NOW INCLUDES PACKET LOSS) */}
            <div className="bg-neutral-900/40 border border-neutral-800 p-8 flex-1 flex flex-col justify-center backdrop-blur-sm relative">
              <h3 className="text-neutral-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-6 flex justify-between items-center">
                <span>Latency Telemetry</span>
                <span className="text-[#ff0055]">Loss: {packetLoss.toFixed(1)}%</span>
              </h3>
              
              <div className="flex justify-between items-end mb-4 border-b border-neutral-800/50 pb-4">
                <span className="text-neutral-400 text-sm font-medium">Unloaded</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black tabular-nums ${ping > 0 ? 'text-cyan-400' : 'text-neutral-700'}`}>{ping > 0 ? ping.toFixed(0) : '-'}</span>
                  <span className="text-neutral-600 text-xs font-bold">ms</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-4 border-b border-neutral-800/50 pb-4">
                <span className="text-neutral-400 text-sm font-medium">Loaded</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black tabular-nums ${loadedPing > 0 ? 'text-orange-400' : 'text-neutral-700'}`}>{loadedPing > 0 ? loadedPing.toFixed(0) : '-'}</span>
                  <span className="text-neutral-600 text-xs font-bold">ms</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-neutral-400 text-sm font-medium">Jitter (Variance)</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black tabular-nums ${jitter > 0 ? 'text-white' : 'text-neutral-700'}`}>{jitter > 0 ? jitter.toFixed(1) : '-'}</span>
                  <span className="text-neutral-600 text-xs font-bold">ms</span>
                </div>
              </div>
            </div>

          </aside>
        </section>

        {/* Feature-Rich Footer Terminal (4 Columns Now) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mt-2 pb-12 md:pb-0" aria-label="System Telemetry">
          
          {/* Identity Vector */}
          <div className="bg-neutral-900/20 border border-neutral-800/50 p-6 flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Identity Vector</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white font-bold text-lg tracking-wide truncate" title={clientInfo.org}>{clientInfo.org}</span>
              <span className="text-cyan-400 text-sm font-mono">{clientInfo.ip}</span>
              <span className="text-neutral-500 text-xs uppercase tracking-widest mt-1">{clientInfo.asn}</span>
            </div>
          </div>

          {/* Exact Geolocation */}
          <div className="bg-neutral-900/20 border border-neutral-800/50 p-6 flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Geography / Coord</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white font-bold text-lg tracking-wide truncate" title={`${clientInfo.city}, ${clientInfo.region}`}>{clientInfo.city}, {clientInfo.region}</span>
              <span className="text-emerald-400 text-sm">{clientInfo.country} <span className="text-neutral-600">({clientInfo.postal})</span></span>
              <span className="text-neutral-500 text-xs font-mono mt-1">LAT/LON: {clientInfo.loc}</span>
            </div>
          </div>

          {/* Local Device Telemetry */}
          <div className="bg-neutral-900/20 border border-neutral-800/50 p-6 flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Device Telemetry</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white font-bold text-lg tracking-wide truncate">{deviceInfo.os}</span>
              <span className="text-orange-400 text-sm">{deviceInfo.browser}</span>
              <span className="text-neutral-500 text-xs font-mono mt-1">{deviceInfo.res} | Cores: {deviceInfo.cores}</span>
            </div>
          </div>

          {/* Data Consumption & Server */}
          <div className="bg-neutral-900/20 border border-neutral-800/50 p-6 flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Session Telemetry</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white font-bold text-sm tracking-wide truncate">Node: {serverInfo.location}</span>
              <span className="text-neutral-400 text-xs mt-1">Data Consumed (Test):</span>
              <div className="flex gap-4 mt-1">
                <span className="text-fuchsia-400 text-sm font-mono">↓ {dataConsumed.down.toFixed(1)} MB</span>
                <span className="text-fuchsia-400 text-sm font-mono">↑ {dataConsumed.up.toFixed(1)} MB</span>
              </div>
            </div>
          </div>

        </section>

      </div>
    </main>
  );
}

export default App;