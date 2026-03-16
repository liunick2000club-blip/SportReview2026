"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    stravaClientId: "",
    stravaClientSecret: "",
    stravaRefreshToken: "",
    dingtalkWebhook: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setFormData({
            stravaClientId: data.stravaClientId || "",
            stravaClientSecret: data.stravaClientSecret || "",
            stravaRefreshToken: data.stravaRefreshToken || "",
            dingtalkWebhook: data.dingtalkWebhook || "",
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage("Settings saved successfully.");
      } else {
        setMessage("Failed to save settings.");
      }
    } catch (err) {
      setMessage("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white border-b border-gray-200 h-16 sticky top-0 z-10 shadow-sm flex items-center">
        <div className="max-w-3xl mx-auto w-full px-4 flex items-center">
          <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <SettingsIcon size={20} className="mr-2 text-blue-600" />
            User Settings
          </h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4 border-b border-gray-100 pb-6">
              <h2 className="text-lg font-bold text-gray-800">Strava Integration</h2>
              <p className="text-sm text-gray-500">Configure your personal Strava API keys to enable automatic sync.</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Client ID</label>
                <input
                  type="text"
                  value={formData.stravaClientId}
                  onChange={e => setFormData({...formData, stravaClientId: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Client Secret</label>
                <input
                  type="password"
                  value={formData.stravaClientSecret}
                  onChange={e => setFormData({...formData, stravaClientSecret: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Refresh Token</label>
                <input
                  type="password"
                  value={formData.stravaRefreshToken}
                  onChange={e => setFormData({...formData, stravaRefreshToken: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">DingTalk Notifications</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                <input
                  type="text"
                  value={formData.dingtalkWebhook}
                  onChange={e => setFormData({...formData, dingtalkWebhook: e.target.value})}
                  placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-md text-sm font-medium ${message.includes("success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : <><Save size={18} className="mr-2" /> Save Settings</>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
