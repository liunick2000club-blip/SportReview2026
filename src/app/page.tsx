"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity as ActivityIcon, 
  Bike, 
  Calendar, 
  Coins, 
  Flag, 
  LayoutDashboard, 
  MapPin, 
  Mountain, 
  Plus, 
  TrendingUp,
  BarChart3,
  X,
  ChevronRight,
  Info,
  RefreshCw,
  LogOut
} from "lucide-react";
// ... (rest of imports remain same)
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { format, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f43f5e"];

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  async function fetchData() {
    try {
      const sumRes = await fetch("/api/summary");
      if (sumRes.status === 401) {
        router.push("/login");
        return;
      }
      const sumData = await sumRes.json();
      setSummary(sumData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

// ... (rest of functions remain same, skipping to render part for navbar)
  const handleSyncStrava = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/activities/sync", { method: "POST" });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        fetchData(); // 刷新数据
      }
    } catch (err) {
      console.error("Sync failed:", err);
      alert("同步失败，请检查网络或授权。");
    } finally {
      setSyncing(false);
    }
  };

  const handleGymClick = (data: any) => {
    if (data && data.name) {
      router.push(`/activities?type=Climbing&gym=${encodeURIComponent(data.name)}`);
    }
  };

  const handleRunningTrendClick = (data: any) => {
    const monthLabel = data?.activeLabel;
    if (monthLabel) {
      const monthInt = parseInt(monthLabel.replace('月', ''));
      const year = 2026;
      const startDate = format(startOfMonth(new Date(year, monthInt - 1)), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date(year, monthInt - 1)), "yyyy-MM-dd");
      router.push(`/activities?type=Running&startDate=${startDate}&endDate=${endDate}`);
    }
  };

  const handleCyclingTrendClick = (data: any) => {
    const monthLabel = data?.activeLabel;
    if (monthLabel) {
      const monthInt = parseInt(monthLabel.replace('月', ''));
      const year = 2026;
      const startDate = format(startOfMonth(new Date(year, monthInt - 1)), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date(year, monthInt - 1)), "yyyy-MM-dd");
      router.push(`/activities?type=Cycling&startDate=${startDate}&endDate=${endDate}`);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 格式化趋势数据，补全 1-12 月
  const runningTrendData = Array.from({length: 12}, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0');
    const existing = summary?.distances?.runningMonthly?.find((d: any) => d.month === m);
    return {
      month: m,
      displayMonth: `${i + 1}月`,
      distance: existing ? parseFloat(existing.totalDistance.toFixed(1)) : 0
    };
  });

  const cyclingTrendData = Array.from({length: 12}, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0');
    const existing = summary?.distances?.cyclingMonthly?.find((d: any) => d.month === m);
    return {
      month: m,
      displayMonth: `${i + 1}月`,
      distance: existing ? parseFloat(existing.totalDistance.toFixed(1)) : 0
    };
  });

  // 消费构成归并逻辑
  const groupedClimbingCostsMap: Record<string, { name: string; totalCost: number }> = {};
  const wanpanKey = "顽攀 (滨江/文体)";
  const amortizedCost = summary?.summary?.amortizedCost || 0;

  // 1. 初始化顽攀项并放入年卡摊销额
  groupedClimbingCostsMap[wanpanKey] = { name: wanpanKey, totalCost: amortizedCost };

  // 2. 归并原始场馆数据
  (summary?.climbing || []).forEach((gym: any) => {
    let displayName = gym.name;
    if (displayName.includes("滨江") || displayName.includes("文体")) {
      displayName = wanpanKey;
    }
    
    if (!groupedClimbingCostsMap[displayName]) {
      groupedClimbingCostsMap[displayName] = { name: displayName, totalCost: 0 };
    }
    groupedClimbingCostsMap[displayName].totalCost += gym.totalCost;
  });

  const totalSportsCost = summary?.summary?.totalSportsCost || 0;

  const sortedClimbingCosts = Object.values(groupedClimbingCostsMap)
    .filter(g => g.totalCost > 0)
    .sort((a, b) => b.totalCost - a.totalCost);

  const totalExtraCost = summary?.summary?.extraCost || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <LayoutDashboard size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">SportReview 2026</h1>
            </Link>
            <div className="flex items-center space-x-3">
              {session?.user && (
                <div className="hidden sm:flex items-center mr-4 pr-4 border-r border-gray-200">
                  <span className="text-sm font-medium text-gray-600 mr-3">{session.user.name || session.user.email}</span>
                  <button onClick={() => signOut()} className="text-gray-400 hover:text-red-500 transition" title="退出登录">
                    <LogOut size={18} />
                  </button>
                </div>
              )}
              <button 
                onClick={handleSyncStrava}
                disabled={syncing}
                className="flex items-center space-x-1 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 transition shadow-sm font-medium text-sm disabled:opacity-50"
              >
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                <span>{syncing ? "同步中..." : "同步 Strava"}</span>
              </button>
              <Link href="/new" className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition shadow-md font-medium text-sm">
                <Plus size={18} />
                <span>记录运动</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link href="/activities?type=Climbing" className="block">
            <StatCard title="总攀岩" value={(summary?.summary?.totalActivities || 0) - (summary?.summary?.otherCount || 0)} icon={<Mountain size={20} className="text-orange-600" />} unit="次" bgColor="bg-orange-50" />
          </Link>
          <Link href="/activities?type=Running" className="block">
            <StatCard title="累计跑步" value={summary?.distances?.running?.toFixed(1) || "0.0"} icon={<Flag size={20} className="text-blue-600" />} unit="km" bgColor="bg-blue-50" />
          </Link>
          <Link href="/activities?type=Cycling" className="block">
            <StatCard title="累计骑行" value={summary?.distances?.cycling?.toFixed(1) || "0.0"} icon={<Bike size={20} className="text-green-600" />} unit="km" bgColor="bg-green-50" />
          </Link>
          <div className="block" onClick={() => setShowCostModal(true)}>
            <StatCard 
              title="运动总花费" 
              value={summary?.summary?.totalSportsCost?.toFixed(0) || "0"} 
              icon={<Coins size={20} className="text-yellow-600" />} 
              unit="元" 
              bgColor="bg-yellow-50"
              clickable
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-blue-600" size={22} />
              <h2 className="text-xl font-black text-gray-800 tracking-tight">年度数据概览</h2>
            </div>
            <Link href="/activities" className="text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest">查看明细</Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* 1. 攀岩馆分布 */}
            <div className="space-y-4">
              <h3 className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">攀岩馆分布</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary?.climbing}
                      dataKey="count"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={5}
                      onClick={handleGymClick}
                      style={{ cursor: 'pointer' }}
                    >
                      {summary?.climbing?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. 跑步里程 */}
            <div className="space-y-4">
              <h3 className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">月跑步里程 (km)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={runningTrendData} onClick={handleRunningTrendClick} style={{ cursor: 'pointer' }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                    />
                    <Bar dataKey="distance" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. 骑行里程 */}
            <div className="space-y-4">
              <h3 className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">月骑行里程 (km)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cyclingTrendData} onClick={handleCyclingTrendClick} style={{ cursor: 'pointer' }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
                    />
                    <Bar dataKey="distance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 消费明细 Modal */}
      {showCostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">消费明细</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Cost Breakdown · 2026</p>
              </div>
              <button 
                onClick={() => setShowCostModal(false)}
                className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* 总览部分 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">年卡摊销</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-blue-600">¥{Math.round(amortizedCost)}</span>
                  </div>
                </div>
                <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100/50">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-1">额外单次</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-orange-600">¥{Math.round(totalExtraCost)}</span>
                  </div>
                </div>
              </div>

              {/* 列表部分 */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">支出构成</h3>
                <div className="space-y-5">
                  {sortedClimbingCosts.map((gym: any, index: number) => (
                    <div key={gym.name} className="group">
                      <div className="flex justify-between items-end mb-2 px-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 flex items-center justify-center rounded-lg bg-gray-100 text-[10px] font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {index + 1}
                          </span>
                          <span className="text-sm font-bold text-gray-700">{gym.name}</span>
                        </div>
                        <span className="text-sm font-black text-gray-900">¥{Math.round(gym.totalCost)}</span>
                      </div>
                      <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-1000 ease-out rounded-full"
                          style={{ width: `${(gym.totalCost / totalSportsCost) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100">
              <div className="flex items-start space-x-3 text-gray-400">
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wider">
                  年卡支出已归并入“顽攀”项中计算。年费 3288 元/年，按已过天数摊销。单次消费包含所有非年卡场馆及活动支出。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-20 border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-300">
            <ActivityIcon size={16} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">SportReview · 2026 Archive</span>
          </div>
          <div className="mt-6 flex justify-center space-x-8">
             <Link href="/api/cron/reminder" target="_blank" className="text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">触发测试推送</Link>
             <Link href="/activities" className="text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">数据管理</Link>
             <Link href="/import" className="text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">数据导入</Link>
             <Link href="/settings" className="text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">个人设置</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, unit, icon, bgColor, clickable }: any) {
  return (
    <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 transition-all hover:-translate-y-1 ${clickable ? 'cursor-pointer hover:shadow-lg hover:border-yellow-200' : 'hover:shadow-md'}`}>
      <div className={`${bgColor} w-10 h-10 flex items-center justify-center rounded-2xl mb-4`}>
        {icon}
      </div>
      <div>
        <div className="flex items-center space-x-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
          {clickable && <ChevronRight size={12} className="text-gray-300" />}
        </div>
        <div className="flex items-baseline space-x-1 mt-1">
          <span className="text-3xl font-black text-gray-900">{value || 0}</span>
          <span className="text-xs font-bold text-gray-400 uppercase">{unit}</span>
        </div>
      </div>
    </div>
  );
}
