"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mountain, Bike, Flag, Activity as ActivityIcon, Save } from "lucide-react";

export default function NewActivity() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewActivityContent />
    </Suspense>
  );
}

function NewActivityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const [loading, setLoading] = useState(false);
  const [topGyms, setTopGyms] = useState<string[]>([]);
  const [isCustomGym, setIsCustomGym] = useState(false);
  const [formData, setFormData] = useState({
    date: initialDate,
    type: "Climbing",
    gymName: "",
    cost: "",
    distance: "",
    notes: "",
  });

  const templates: Record<string, string> = {
    Climbing: "【场馆/线路】完成了哪些线（颜色/等级）？\n【体感状态】热身情况、手指/手皮感受、心态如何？\n【技术细节】难点动作执行情况（动态/静力/协调性）、有哪些失误？\n【下一步】需要针对性训练什么（耐力/指力/想象力/连线）？",
    Running: "【路线/环境】今日路线、天气、路况如何？\n【体感呼吸】呼吸是否均匀、肌肉是否有酸痛？\n【心率配速】是否达到预期目标、后半程体力如何？\n【改进建议】下次需要注意的地方？",
    Cycling: "【路线/环境】今日路线、天气、地形如何？\n【体感呼吸】心率控制、腿部力量反馈？\n【设备/补给】车辆状态、补给是否及时？",
    Other: "【项目进度】今日核心训练项目、重量/组数？\n【力量反馈】是否有力、动作是否标准？\n【身体状况】是否有伤病隐患、疲劳程度？",
  };

  const applyTemplate = (type: string, force = false) => {
    if (force || !formData.notes || formData.notes.trim() === "") {
      setFormData(prev => ({ ...prev, notes: templates[type] || "" }));
    }
  };

  // 初始加载时应用默认模板
  useEffect(() => {
    if (!formData.notes) {
      applyTemplate(formData.type);
    }
  }, []);

  useEffect(() => {
    fetch("/api/summary").then(res => res.json()).then(data => {
      if (data.summary?.topGyms) {
        setTopGyms(data.summary.topGyms);
      }
    });
  }, []);

  const handleTypeChange = (newType: string) => {
    setFormData(prev => {
      const updated = { ...prev, type: newType };
      // 如果备注为空或者是其他类型的模板，则切换模板
      const isOtherTemplate = Object.values(templates).some(t => t === prev.notes);
      if (!prev.notes || isOtherTemplate) {
        updated.notes = templates[newType] || "";
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 字段清理：根据类型清除不相关的字段
    const submissionData = { ...formData };
    if (submissionData.type !== 'Climbing') {
      submissionData.gymName = "";
    }
    if (submissionData.type !== 'Running' && submissionData.type !== 'Cycling') {
      submissionData.distance = "";
    }

    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert("保存失败，请重试。");
      }
    } catch (err) {
      console.error(err);
      alert("网络错误。");
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { id: "Climbing", label: "攀岩", icon: <Mountain size={18} /> },
    { id: "Running", label: "跑步", icon: <Flag size={18} /> },
    { id: "Cycling", label: "骑行", icon: <Bike size={18} /> },
    { id: "Other", label: "其他", icon: <ActivityIcon size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white border-b border-gray-200 h-16 sticky top-0 z-10 shadow-sm flex items-center">
        <div className="max-w-3xl mx-auto w-full px-4 flex items-center">
          <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">记录今日运动</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 日期 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">运动日期</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* 类型选择 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">运动类型</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {types.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeChange(type.id)}
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

            {/* 费用与距离 (并行显示) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">消费金额 (元)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* 动态字段：攀岩馆 */}
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

              {/* 动态字段：距离 */}
              {(formData.type === "Running" || formData.type === "Cycling") && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">运动距离 (公里)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* 心得备注 */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-bold text-gray-700">训练心得 / 备注</label>
                <button
                  type="button"
                  onClick={() => applyTemplate(formData.type, true)}
                  className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg"
                >
                  重置模板
                </button>
              </div>
              <textarea
                rows={6}
                placeholder="记下今日的训练感受或进步之处..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={20} />
                  <span>保存记录</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
