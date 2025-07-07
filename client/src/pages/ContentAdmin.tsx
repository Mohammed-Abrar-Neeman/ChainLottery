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
  const [images, setImages] = useState<string[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingImages, setLoadingImages] = useState(true);

  // Load config
  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => setConfig(null))
      .finally(() => setLoadingConfig(false));
  }, []);

  // Load images
  useEffect(() => {
    fetch(`${API_URL}/api/images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch(() => setImages([]))
      .finally(() => setLoadingImages(false));
  }, []);

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
          <div className="bg-muted rounded-lg p-4 border border-border overflow-x-auto max-h-[400px] overflow-y-auto">
            <pre className="text-sm text-foreground">
              {loadingConfig
                ? "Loading..."
                : config
                ? JSON.stringify(config, null, 2)
                : "Failed to load config."}
            </pre>
          </div>
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