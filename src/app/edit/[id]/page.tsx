"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mountain, Bike, Flag, Activity as ActivityIcon, Save, Trash2, AlertCircle } from "lucide-react";

// 定义页面 Props 类型
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditActivity({ params }: PageProps) {
  const router = useRouter();
  // 使用 React.use() 解包异步 params
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topGyms, setTopGyms] = useState<string[]>([]);
  const [isCustomGym, setIsCustomGym] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    type: "Climbing",
    gymName: "",
    cost: "",
    distance: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/summary").then(res => res.json()).then(data => {
      if (data.summary?.topGyms) {
        setTopGyms(data.summary.topGyms);
      }
    });
  }, []);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch(`/api/activities/${id}`);
        if (!res.ok) {
          throw new Error(`无法获取记录 (状态码: ${res.status})`);
        }
        const data = await res.json();
        
        // 解析日期为 yyyy-mm-dd 格式以匹配 input type="date"
        const recordDate = new Date(data.date);
        const dateStr = recordDate.toISOString().split("T")[0];

        setFormData({
          date: dateStr,
          type: data.type,
          gymName: data.gymName || "",
          cost: data.cost?.toString() || "",
          distance: data.distance?.toString() || "",
          notes: data.notes || "",
        });

        // 如果现有场馆名不在 topGyms 列表中，且不是空的，则自动开启手动输入模式
        // 注意：这里需要配合 topGyms 加载的时机，或者简单的逻辑判断
        if (data.gymName && !["滨江", "文体", "岩时"].includes(data.gymName)) {
           setIsCustomGym(true);
        }
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "数据加载失败");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchActivity();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        const errData = await response.json();
        alert(`保存失败: ${errData.error || '未知错误'}`);
      }
    } catch (err) {
      console.error("Submit Error:", err);
      alert("网络错误，请检查网络连接。");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这条记录吗？此操作不可撤销。")) return;
    
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      alert("删除失败。");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">正在努力加载原记录...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md w-full">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">出错了</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const types = [
    { id: "Climbing", label: "攀岩", icon: <Mountain size={18} /> },
    { id: "Running", label: "跑步", icon: <Flag size={18} /> },
    { id: "Cycling", label: "骑行", icon: <Bike size={18} /> },
    { id: "Other", label: "其他", icon: <ActivityIcon size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white border-b border-gray-200 h-16 sticky top-0 z-10 flex items-center shadow-sm">
        <div className="max-w-3xl mx-auto w-full px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">修改运动记录</h1>
          </div>
          <button onClick={handleDelete} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
            <Trash2 size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">运动日期</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">运动类型</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {types.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id })}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 transition-all font-medium ${
                      formData.type === type.id
                        ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm"
                        : "border-gray-100 hover:border-gray-300 text-gray-500"
                    }`}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">消费金额 (元)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>

              {formData.type === "Climbing" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">攀岩馆名称</label>
                  {!isCustomGym ? (
                    <select
                      value={formData.gymName}
                      onChange={(e) => {
                        if (e.target.value === "OTHER") {
                          setIsCustomGym(true);
                          setFormData({ ...formData, gymName: "" });
                        } else {
                          setFormData({ ...formData, gymName: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all font-medium"
                    >
                      <option value="">请选择场馆</option>
                      {topGyms.map(gym => (
                        <option key={gym} value={gym}>{gym}</option>
                      ))}
                      <option value="OTHER" className="text-blue-600 font-bold">其他 (手动输入)...</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        autoFocus
                        placeholder="请输入场馆名称"
                        value={formData.gymName}
                        onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsCustomGym(false)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg"
                      >
                        返回选择
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(formData.type === "Running" || formData.type === "Cycling") && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">运动距离 (公里)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0.0"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">训练心得 / 备注</label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="记录今日的训练感受..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : (
                <><Save size={20} /><span>更新记录</span></>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
