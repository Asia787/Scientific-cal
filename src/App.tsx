import React, { useState, useEffect, useRef } from 'react';
import { create, all } from 'mathjs';
import { GoogleGenAI } from "@google/genai";
import { 
  Calculator, 
  Sparkles, 
  History, 
  Trash2, 
  ChevronRight, 
  Info, 
  X, 
  RotateCcw,
  Equal,
  Divide,
  Minus,
  Plus,
  Percent,
  Delete,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';

const math = create(all);

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export default function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isScientific, setIsScientific] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiResponse]);

  const handleNumber = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    setExpression(expression + display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleScientific = (func: string) => {
    if (display === 'Error') return;
    try {
      let result;
      const val = parseFloat(display);
      switch (func) {
        case 'sin': result = math.sin(math.unit(val, 'deg')); break;
        case 'cos': result = math.cos(math.unit(val, 'deg')); break;
        case 'tan': result = math.tan(math.unit(val, 'deg')); break;
        case 'log': result = math.log10(val); break;
        case 'ln': result = math.log(val); break;
        case 'sqrt': result = math.sqrt(val); break;
        case 'pow2': result = math.pow(val, 2); break;
        case 'pow3': result = math.pow(val, 3); break;
        case 'inv': result = 1 / val; break;
        case 'abs': result = math.abs(val); break;
        case 'pi': result = math.pi; break;
        case 'e': result = math.e; break;
        default: return;
      }
      const formattedResult = Number(result.toFixed(8)).toString();
      setDisplay(formattedResult);
    } catch (e) {
      setDisplay('Error');
    }
  };

  const calculate = () => {
    try {
      const fullExpression = expression + display;
      const result = math.evaluate(fullExpression);
      const formattedResult = Number(result.toFixed(8)).toString();
      
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        expression: fullExpression,
        result: formattedResult,
        timestamp: Date.now(),
      };
      
      setHistory([newHistoryItem, ...history].slice(0, 20));
      setDisplay(formattedResult);
      setExpression('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
    setAiResponse(null);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const askAi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiInput.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const prompt = `You are a scientific calculator assistant. 
      The user asked: "${aiInput}". 
      1. If it's a math problem, solve it step-by-step. 
      2. Explain the concepts involved briefly. 
      3. Provide the final numerical result clearly.
      Use markdown for formatting.`;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setAiResponse(result.text || "No response received.");
      setAiInput('');
    } catch (error) {
      setAiResponse("Sorry, I couldn't process that request. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const Button = ({ 
    children, 
    onClick, 
    className, 
    variant = 'default' 
  }: { 
    children: React.ReactNode; 
    onClick: () => void; 
    className?: string;
    variant?: 'default' | 'operator' | 'scientific' | 'action' | 'number';
  }) => {
    const variants = {
      default: 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200',
      number: 'bg-white hover:bg-gray-50 text-gray-900 font-medium border-gray-200',
      operator: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100 font-semibold',
      scientific: 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-100 text-sm',
      action: 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-100 font-semibold',
    };

    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "h-14 rounded-2xl border transition-all flex items-center justify-center text-lg shadow-sm",
          variants[variant],
          className
        )}
      >
        {children}
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Calculator */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <header className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Calculator size={22} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">AI Calculator</h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsScientific(!isScientific)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  isScientific ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                )}
              >
                Scientific
              </button>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <History size={20} />
              </button>
            </div>
          </header>

          {/* Display Area */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-end justify-end min-h-[180px] relative overflow-hidden">
            <div className="absolute top-4 left-6 text-indigo-600/20">
              <Calculator size={48} />
            </div>
            <div className="text-slate-400 text-lg font-medium mb-2 h-8 overflow-hidden text-right w-full">
              {expression}
            </div>
            <div className="text-5xl font-bold text-slate-800 tracking-tight break-all text-right w-full">
              {display}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-3">
            {/* Scientific Row */}
            {isScientific && (
              <>
                <Button variant="scientific" onClick={() => handleScientific('sin')}>sin</Button>
                <Button variant="scientific" onClick={() => handleScientific('cos')}>cos</Button>
                <Button variant="scientific" onClick={() => handleScientific('tan')}>tan</Button>
                <Button variant="scientific" onClick={() => handleScientific('sqrt')}>√</Button>
                <Button variant="scientific" onClick={() => handleScientific('log')}>log</Button>
                <Button variant="scientific" onClick={() => handleScientific('ln')}>ln</Button>
                <Button variant="scientific" onClick={() => handleScientific('pow2')}>x²</Button>
                <Button variant="scientific" onClick={() => handleScientific('inv')}>1/x</Button>
              </>
            )}

            {/* Main Row 1 */}
            <Button variant="action" onClick={clear}>AC</Button>
            <Button variant="action" onClick={backspace}><Delete size={20} /></Button>
            <Button variant="operator" onClick={() => handleOperator('%')}><Percent size={20} /></Button>
            <Button variant="operator" onClick={() => handleOperator('/')}><Divide size={20} /></Button>

            {/* Main Row 2 */}
            <Button variant="number" onClick={() => handleNumber('7')}>7</Button>
            <Button variant="number" onClick={() => handleNumber('8')}>8</Button>
            <Button variant="number" onClick={() => handleNumber('9')}>9</Button>
            <Button variant="operator" onClick={() => handleOperator('*')}>×</Button>

            {/* Main Row 3 */}
            <Button variant="number" onClick={() => handleNumber('4')}>4</Button>
            <Button variant="number" onClick={() => handleNumber('5')}>5</Button>
            <Button variant="number" onClick={() => handleNumber('6')}>6</Button>
            <Button variant="operator" onClick={() => handleOperator('-')}><Minus size={20} /></Button>

            {/* Main Row 4 */}
            <Button variant="number" onClick={() => handleNumber('1')}>1</Button>
            <Button variant="number" onClick={() => handleNumber('2')}>2</Button>
            <Button variant="number" onClick={() => handleNumber('3')}>3</Button>
            <Button variant="operator" onClick={() => handleOperator('+')}><Plus size={20} /></Button>

            {/* Main Row 5 */}
            <Button variant="number" onClick={() => handleNumber('0')} className="col-span-2">0</Button>
            <Button variant="number" onClick={() => handleNumber('.')}>.</Button>
            <Button 
              onClick={calculate} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 font-bold shadow-lg shadow-indigo-200"
            >
              <Equal size={24} />
            </Button>
          </div>
        </div>

        {/* Right Column: AI & History */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* AI Assistant Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full min-h-[500px]">
            <div className="p-6 border-bottom border-slate-50 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                <Sparkles size={18} />
              </div>
              <h2 className="font-bold text-slate-800">AI Math Assistant</h2>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto max-h-[400px]" ref={scrollRef}>
              {!aiResponse && !isAiLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={32} />
                  </div>
                  <p className="text-sm">Ask me to solve complex problems, explain formulas, or perform natural language calculations.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['"Solve x^2 + 5x + 6 = 0"', '"What is the derivative of sin(x)?"', '"Calculate 15% tip on $85"'].map((suggestion, i) => (
                      <button 
                        key={i}
                        onClick={() => setAiInput(suggestion.replace(/"/g, ''))}
                        className="text-xs bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-full border border-slate-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isAiLoading && (
                <div className="flex flex-col gap-4">
                  <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
                </div>
              )}

              {aiResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-slate prose-sm max-w-none"
                >
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                    {aiResponse.split('\n').map((line, i) => (
                      <p key={i} className="mb-2 last:mb-0 leading-relaxed">{line}</p>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-6 border-t border-slate-50">
              <form onSubmit={askAi} className="relative">
                <input 
                  type="text" 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask AI anything..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
                <button 
                  type="submit"
                  disabled={isAiLoading || !aiInput.trim()}
                  className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </form>
            </div>
          </div>

          {/* History Section (Overlay or Side) */}
          <AnimatePresence>
            {showHistory && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <History size={18} className="text-slate-400" />
                    History
                  </h3>
                  <button 
                    onClick={() => setHistory([])}
                    className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Clear
                  </button>
                </div>
                <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-2">
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No history yet</p>
                  ) : (
                    history.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group"
                        onClick={() => {
                          setDisplay(item.result);
                          setExpression(item.expression + ' = ');
                        }}
                      >
                        <div className="text-xs text-slate-400 mb-1 truncate">{item.expression}</div>
                        <div className="text-sm font-bold text-slate-700 flex items-center justify-between">
                          {item.result}
                          <RotateCcw size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="mt-12 text-slate-400 text-xs flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Info size={12} />
          <span>Powered by Gemini & Math.js</span>
        </div>
        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
        <span>© 2026 AI Scientific Calculator</span>
      </footer>
    </div>
  );
}
