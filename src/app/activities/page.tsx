"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search, Calendar, MapPin, Mountain, Bike, Flag, Activity as ActivityIcon, Edit2 } from "lucide-react";
import { format, isAfter, startOfToday } from "date-fns";

export default function ActivitiesList() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ActivitiesContent />
    </Suspense>
  );
}

function ActivitiesContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "All";
  const initialGym = searchParams.get("gym") || "";
  const initialStart = searchParams.get("startDate") || "";
  const initialEnd = searchParams.get("endDate") || "";

  const [activities, setActivities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialGym); // 如果有馆名，放入搜索框
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch("/api/activities?limit=2000"); 
        const data = await res.json();
        setActivities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const filteredActivities = activities.filter(act => {
    const matchesSearch = (act.notes?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (act.gymName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (act.type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === "All" || act.type === typeFilter;
    
    const actDate = new Date(act.date);
    const matchesStartDate = !startDate || actDate >= new Date(startDate);
    const matchesEndDate = !endDate || actDate <= new Date(endDate + "T23:59:59");

    return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:h-20 py-4 md:py-0 items-center justify-between gap-4">
            <div className="flex items-center w-full md:w-auto">
              <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">全部运动记录</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* 类型筛选 */}
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-gray-100 border-none rounded-xl px-4 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="All">所有项目</option>
                <option value="Climbing">攀岩</option>
                <option value="Running">跑步</option>
                <option value="Cycling">骑行</option>
                <option value="Other">其他</option>
              </select>

              {/* 日期筛选 */}
              <div className="flex items-center bg-gray-100 rounded-xl px-2">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none p-2 text-xs font-medium text-gray-700 outline-none focus:ring-0"
                />
                <span className="text-gray-400 text-xs px-1">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none p-2 text-xs font-medium text-gray-700 outline-none focus:ring-0"
                />
              </div>

              {/* 关键词搜索 */}
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="搜索备注..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-48"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">日期</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">项目</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">详情</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">备注 / 心得</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm font-medium">{format(new Date(act.date), "yyyy/MM/dd")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <TypeIcon type={act.type} />
                        <span className={`text-sm font-bold ${getTypeColor(act.type)}`}>
                          {act.type === 'Climbing' ? (act.gymName || '攀岩') : act.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {act.distance && (
                        <span className="text-sm font-bold text-blue-600">{act.distance} <small>KM</small></span>
                      )}
                      {act.cost && (
                        <span className="text-sm font-bold text-yellow-600">¥{act.cost}</span>
                      )}
                      {!act.distance && !act.cost && <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 line-clamp-1 max-w-xs sm:max-w-md group-hover:line-clamp-none transition-all duration-300">
                        {act.notes || <span className="text-gray-300 italic">无备注</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/edit/${act.id}`} className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold text-xs p-2 bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={12} />
                        <span>修改</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredActivities.length === 0 && (
            <div className="py-20 text-center text-gray-400">
              <ActivityIcon className="mx-auto mb-3 opacity-20" size={48} />
              <p>未找到相关记录</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'Climbing': return <Mountain size={16} className="text-orange-500" />;
    case 'Running': return <Flag size={16} className="text-blue-500" />;
    case 'Cycling': return <Bike size={16} className="text-green-500" />;
    default: return <ActivityIcon size={16} className="text-gray-400" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'Climbing': return "text-orange-700";
    case 'Running': return "text-blue-700";
    case 'Cycling': return "text-green-700";
    default: return "text-gray-700";
  }
}
