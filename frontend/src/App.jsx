import React, { useState, useEffect } from "react";
import { Code2, Sparkles, Download, Zap, Github, Linkedin, Mail } from "lucide-react";

// Environment variables (use Vite's import.meta.env for Vite projects)
const KESTRA_URL = import.meta.env.VITE_KESTRA_URL || "http://localhost:8080";
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'main';
const KESTRA_USERNAME = import.meta.env.VITE_KESTRA_USERNAME;
const KESTRA_PASSWORD = import.meta.env.VITE_KESTRA_PASSWORD;
const WEBHOOK_NAMESPACE = import.meta.env.VITE_WEBHOOK_NAMESPACE || 'company.team';
const WEBHOOK_FLOW = import.meta.env.VITE_WEBHOOK_FLOW || 'ai_project_builder_gemini';
const WEBHOOK_KEY = import.meta.env.VITE_WEBHOOK_KEY || 'umer';

// Create auth header
const AUTH_HEADER = KESTRA_USERNAME && KESTRA_PASSWORD 
  ? 'Basic ' + btoa(`${KESTRA_USERNAME}:${KESTRA_PASSWORD}`)
  : '';

function App() {
  const [assignment, setAssignment] = useState("");
  const [loading, setLoading] = useState(false);
  const [executionId, setExecutionId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);

  // Check if environment variables are configured
  useEffect(() => {
    if (!KESTRA_USERNAME || !KESTRA_PASSWORD) {
      setError("Missing environment variables. Please configure VITE_KESTRA_USERNAME and VITE_KESTRA_PASSWORD in your .env file.");
    }
  }, []);

  async function triggerWorkflow() {
    const res = await fetch(
      `${KESTRA_URL}/api/v1/${TENANT_ID}/executions/webhook/${WEBHOOK_NAMESPACE}/${WEBHOOK_FLOW}/${WEBHOOK_KEY}`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': AUTH_HEADER
        },
        body: JSON.stringify({ assignment_text: assignment })
      }
    );
    
    if (!res.ok) throw new Error(`Failed to trigger workflow: ${res.statusText}`);
    const data = await res.json();
    return data.id;
  }

  async function checkExecutionAndDownload(execId) {
    try {
      const res = await fetch(`${KESTRA_URL}/api/v1/${TENANT_ID}/executions/${execId}`, {
        headers: {
          'Authorization': AUTH_HEADER 
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to check status: ${res.statusText}`);
      }
      
      const data = await res.json();
      const state = data.state.current;
      
      if (state === "SUCCESS") {
        const outputs = data.outputs || {};
        const downloadOutput = outputs.download;
        
        if (downloadOutput) {
          const downloadUrl = `${KESTRA_URL}/api/v1/${TENANT_ID}/executions/${execId}/file?path=${encodeURIComponent(downloadOutput)}`;
          return { state, downloadUrl };
        }
      }
      
      return { state };
    } catch (err) {
      console.error("Check execution error:", err);
      return { state: 'FAILED', error: err.message };
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!assignment.trim()) {
      setError("Please enter assignment text");
      return;
    }
    
    if (!AUTH_HEADER) {
      setError("Authentication not configured. Check your .env file.");
      return;
    }
    
    setLoading(true);
    setError("");
    setExecutionId("");
    setStatus("Triggering workflow...");
    setPolling(true);
    
    try {
      const execId = await triggerWorkflow();
      setExecutionId(execId);
      setStatus("Workflow started! Generating project...");
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setPolling(false);
    }
  }

  useEffect(() => {
    if (!polling || !executionId) return;

    const interval = setInterval(async () => {
      const result = await checkExecutionAndDownload(executionId);
      
      if (result.error) {
        setError(result.error);
        setPolling(false);
        setLoading(false);
        clearInterval(interval);
        return;
      }
      
      if (result.state === "SUCCESS" && result.downloadUrl) {
        setStatus("✅ Project generated! Starting download...");
        
        setTimeout(() => {
          handleAuthenticatedDownload(result.downloadUrl);
        }, 500);
        
        setPolling(false);
        setLoading(false);
        clearInterval(interval);
      } else if (result.state === "FAILED" || result.state === "KILLED") {
        setError(`Workflow ${result.state.toLowerCase()}. Check Kestra logs.`);
        setPolling(false);
        setLoading(false);
        clearInterval(interval);
      } else if (result.state) {
        setStatus(`Status: ${result.state}...`);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, executionId]);
  
  const handleAuthenticatedDownload = async (downloadUrl) => {
    try {
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': AUTH_HEADER
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file securely');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cpp_project.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus("✅ Download complete! Check your downloads folder.");
    } catch (err) {
      console.error("Download error:", err);
      setError("Could not securely download file. Check browser console.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      {/* Animated background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Code2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              C++ Project Generator
            </h1>
          </div>
          <p className="text-center text-blue-200 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto">
            Perfect for beginners! Don't know how to start a C++ project or how files relate? Get a complete, well-structured project with clear explanations in seconds.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Features Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
              <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Beginner Friendly</h3>
              <p className="text-blue-200 text-xs sm:text-sm mt-1">Clear file structure & relationships</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
              <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Learn by Doing</h3>
              <p className="text-blue-200 text-xs sm:text-sm mt-1">Well-commented code examples</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
              <Download className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Complete Setup</h3>
              <p className="text-blue-200 text-xs sm:text-sm mt-1">Makefile, headers, everything included</p>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/20">
            <div className="space-y-6">
              <div>
                <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-3">
                  📝 Assignment Description
                </label>
                <textarea
                  value={assignment}
                  onChange={(e) => setAssignment(e.target.value)}
                  placeholder="Example: Create a student management system using C++ with classes for Student and Course, file I/O for persistence, proper error handling, and a menu-driven interface"
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl 
                    focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                    transition-all duration-200 font-mono text-xs sm:text-sm resize-none"
                  disabled={loading}
                />
                <p className="mt-2 text-xs sm:text-sm text-slate-500">
                  💡 Tip: Be specific about requirements, classes, features, and file handling
                </p>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={loading || !assignment.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 
                  text-white py-4 px-6 rounded-xl font-bold text-base sm:text-lg
                  hover:from-blue-700 hover:to-blue-800 
                  disabled:from-slate-400 disabled:to-slate-500 
                  disabled:cursor-not-allowed
                  transform hover:scale-[1.02] active:scale-[0.98]
                  transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span className="hidden sm:inline">{status || "Processing..."}</span>
                    <span className="sm:hidden">Processing...</span>
                  </span>
                ) : (
                  "🚀 Generate Project"
                )}
              </button>
            </div>

            {/* Status Messages */}
            {loading && !error && (
              <div className="mt-6 p-4 sm:p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-blue-900 font-semibold text-sm sm:text-base">{status}</p>
                    <p className="text-blue-700 text-xs sm:text-sm mt-1">
                      This usually takes 30-40 seconds. Your download will start automatically when ready.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && status.includes("✅") && (
              <div className="mt-6 p-4 sm:p-6 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl sm:text-3xl">🎉</span>
                  <div className="flex-1">
                    <p className="text-green-900 font-bold text-base sm:text-lg">Success!</p>
                    <p className="text-green-800 mt-1 text-sm sm:text-base">{status}</p>
                    {executionId && (
                      <p className="text-xs sm:text-sm mt-2 text-green-600">
                        View execution logs in the <a href={`${KESTRA_URL}/ui/${TENANT_ID}/executions/${WEBHOOK_NAMESPACE}/${WEBHOOK_FLOW}/${executionId}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Kestra UI</a>.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 text-red-800 rounded-xl" role="alert">
                <strong className="font-bold text-sm sm:text-base">⚠️ Error: </strong>
                <span className="block sm:inline text-sm sm:text-base mt-1 sm:mt-0">{error}</span>
              </div>
            )}
          </div>

          {/* How It Works Section */}
          <div className="mt-8 sm:mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">
              🔧 How It Helps You Learn
            </h2>
            <p className="text-center text-blue-200 text-sm mb-6">Orchestrated seamlessly by Kestra workflow automation</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="bg-blue-500 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg sm:text-xl">1</div>
                <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Describe What You Need</h3>
                <p className="text-blue-200 text-xs sm:text-sm">Tell us your assignment requirements</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-500 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg sm:text-xl">2</div>
                <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Kestra Orchestrates</h3>
                <p className="text-blue-200 text-xs sm:text-sm">Manages workflow & triggers Gemini AI</p>
              </div>
              <div className="text-center">
                <div className="bg-pink-500 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg sm:text-xl">3</div>
                <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Files Generated</h3>
                <p className="text-blue-200 text-xs sm:text-sm">See how .h, .cpp, and main files work together</p>
              </div>
              <div className="text-center">
                <div className="bg-green-500 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-3 font-bold text-lg sm:text-xl">4</div>
                <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Download & Learn</h3>
                <p className="text-blue-200 text-xs sm:text-sm">Kestra packages & delivers your project</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900/50 backdrop-blur-sm border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About Section */}
            <div>
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                About This Project
              </h3>
              <p className="text-blue-200 text-sm leading-relaxed mb-3">
                Built to help beginners who struggle with starting C++ projects. If you don't know how to structure files, what goes where, or how different files relate to each other - this tool generates a complete, well-organized project with clear file relationships and proper structure to help you learn and get started quickly.
              </p>
              <p className="text-blue-300 text-sm leading-relaxed">
                <strong className="text-white">Powered by Kestra:</strong> Kestra orchestrates the entire workflow - from receiving your request, triggering AI generation with Gemini, managing file creation, and delivering your project. This automation ensures reliable, fast, and consistent project generation every time.
              </p>
            </div>

            {/* Features Section */}
            <div>
              <h3 className="text-white font-bold text-lg mb-3">🎓 Perfect For Beginners</h3>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Learn proper project structure & organization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Understand file relationships (.h, .cpp, main)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>See best practices in action with comments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Get Makefile & build instructions included</span>
                </li>
              </ul>
            </div>

            {/* Tech Stack Section */}
            <div>
              <h3 className="text-white font-bold text-lg mb-3">🛠️ Powered By</h3>
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold text-xs mt-0.5">⚡</span>
                  <div>
                    <p className="text-white font-semibold text-sm">Kestra Workflows</p>
                    <p className="text-blue-200 text-xs">Orchestrates the entire pipeline: webhook → AI → file creation → delivery</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pink-400 font-bold text-xs mt-0.5">🤖</span>
                  <div>
                    <p className="text-white font-semibold text-sm">Google Gemini AI</p>
                    <p className="text-blue-200 text-xs">Generates intelligent, structured C++ code</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold border border-blue-400/30">React</span>
                <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-semibold border border-green-400/30">Tailwind</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-blue-300 text-sm text-center sm:text-left">
              © 2025 C++ Project Generator. Built with ❤️ for Beginners.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/Umer-Jahangir" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/umer-jahangir-76638a336/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:umerjahangir.cs@gmail.com" className="text-blue-300 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default App;