import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:3001";

type ConfigType = {
  [key: string]: any;
};

const TABS = [
  { key: "config", label: "Config" },
  { key: "images", label: "Images" },
];

const ContentAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState("config");
  const [config, setConfig] = useState<ConfigType | null>(null);
  const [configText, setConfigText] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingImages, setLoadingImages] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Load config
  const fetchConfig = () => {
    setLoadingConfig(true);
    fetch(`${API_URL}/api/config`)
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setConfigText(JSON.stringify(data, null, 2));
        setError("");
      })
      .catch(() => {
        setConfig(null);
        setConfigText("");
        setError("Failed to load config.");
      })
      .finally(() => setLoadingConfig(false));
  };

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line
  }, []);

  // Load images
  useEffect(() => {
    fetch(`${API_URL}/api/images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch(() => setImages([]))
      .finally(() => setLoadingImages(false));
  }, []);

  // Save config
  const saveConfig = async () => {
    setStatus("");
    setError("");
    let parsed;
    try {
      parsed = JSON.parse(configText);
    } catch (e) {
      setError("Invalid JSON format.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed, null, 2),
      });
      if (!res.ok) throw new Error("Failed to save config");
      setStatus("Config saved successfully.");
      setConfig(parsed);
    } catch (e) {
      setError("Failed to save config.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-background rounded-xl shadow-lg border border-border">
      <h1 className="text-3xl font-bold mb-6 text-primary">Admin Panel</h1>
      {/* Tabs */}
      <div className="flex border-b border-border mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-6 py-2 -mb-px font-semibold transition-colors border-b-2 focus:outline-none ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            }`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "config" && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-2 text-muted-foreground">Config</h2>
          <div className="flex gap-2 mb-2">
            <button
              className="px-4 py-1 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition"
              onClick={saveConfig}
              disabled={loadingConfig}
              type="button"
            >
              Save
            </button>
            <button
              className="px-4 py-1 rounded bg-muted text-foreground border border-border font-semibold hover:bg-muted/80 transition"
              onClick={fetchConfig}
              disabled={loadingConfig}
              type="button"
            >
              Reload
            </button>
          </div>
          {status && <div className="mb-2 text-green-600 text-sm">{status}</div>}
          {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
          <textarea
            className="w-full font-mono text-sm text-foreground bg-muted rounded-lg p-4 border border-border max-h-[400px] min-h-[200px] overflow-y-auto resize-vertical"
            value={configText}
            onChange={e => setConfigText(e.target.value)}
            disabled={loadingConfig}
            spellCheck={false}
          />
        </section>
      )}

      {activeTab === "images" && (
        <section>
          <h2 className="text-xl font-semibold mb-2 text-muted-foreground">Images</h2>
          {loadingImages ? (
            <div className="text-muted-foreground">Loading images...</div>
          ) : images.length === 0 ? (
            <div className="text-muted-foreground">No images found.</div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {images.map((img) => (
                <div key={img} className="flex flex-col items-center">
                  <img
                    src={`${API_URL}/images/${img}`}
                    alt={img}
                    className="w-48 h-32 object-cover rounded-lg border border-border bg-muted"
                    onError={(e) => ((e.currentTarget.style.display = "none"))}
                  />
                  <span className="mt-2 text-xs text-muted-foreground break-all">{img}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ContentAdmin;