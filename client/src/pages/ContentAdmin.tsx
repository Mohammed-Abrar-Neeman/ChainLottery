import React, { useEffect, useState, useRef } from "react";
import ReactJson from 'react-json-view';
import { useAppKitAccount } from '@reown/appkit/react';
import { useLotteryContract } from '@/hooks/useLotteryContract';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock, RefreshCw } from 'lucide-react';

const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
? 'http://localhost:3001'
: 'http://167.172.76.74:3001';
  

type ConfigType = {
  [key: string]: any;
};

const TABS = [
  { key: "config", label: "Config" },
  { key: "images", label: "Images" },
];

// Top-level error boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 p-8">A render error occurred: {String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}

const ContentAdmin: React.FC = () => {
  // --- State and hooks at the top ---
  const { address, isConnected } = useAppKitAccount();
  const { checkIsAdmin } = useLotteryContract();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("config");
  const [config, setConfig] = useState<ConfigType | null>(null);
  const [configText, setConfigText] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingImages, setLoadingImages] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [deleting, setDeleting] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // --- Admin check logic ---
  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      const isUserAdmin = await checkIsAdmin();
      setIsAdmin(isUserAdmin);
    } catch (error) {
      setIsAdmin(false);
      console.error('Error in admin check:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [isConnected, address]);

  // --- Config fetch logic ---
  const fetchConfig = () => {
    setLoadingConfig(true);
    fetch(`${API_URL}/api/config`)
      .then((res) => {
        if (!res.ok) throw new Error('Config fetch failed');
        return res.json();
      })
      .then((data) => {
        setConfig(data);
        setConfigText(JSON.stringify(data, null, 2));
        setError("");
      })
      .catch((e) => {
        setConfig(null);
        setConfigText("");
        setError("Failed to load config: " + e.message);
        console.error('Config fetch error:', e);
      })
      .finally(() => setLoadingConfig(false));
  };

  useEffect(() => {
    if (isAdmin) fetchConfig();
    // eslint-disable-next-line
  }, [isAdmin]);

  // --- Images fetch logic ---
  const fetchImages = () => {
    setLoadingImages(true);
    fetch(`${API_URL}/api/images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch((e) => {
        setImages([]);
        console.error('Images fetch error:', e);
      })
      .finally(() => setLoadingImages(false));
  };

  useEffect(() => {
    if (isAdmin) fetchImages();
  }, [isAdmin]);

  // --- Save config ---
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

  // --- Image upload logic ---
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropRef.current) dropRef.current.classList.remove("ring-2");
    if (e.dataTransfer.files) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropRef.current) dropRef.current.classList.add("ring-2");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropRef.current) dropRef.current.classList.remove("ring-2");
  };

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    setUploadStatus("");
    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        failCount++;
        continue;
      }
      const formData = new FormData();
      formData.append("image", file);
      try {
        const res = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json();
          setUploadStatus((prev) => prev + ` ${file.name}: ${err.error || 'Failed.'}`);
          failCount++;
          continue;
        }
        successCount++;
      } catch {
        failCount++;
      }
    }
    setUploading(false);
    if (successCount > 0) {
      setUploadStatus(`${successCount} image(s) uploaded successfully.`);
      fetchImages();
    }
    if (failCount > 0) {
      setUploadStatus((prev) => prev + ` ${failCount} file(s) failed.`);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Delete image logic ---
  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
    setDeleting(filename);
    setUploadStatus("");
    try {
      const res = await fetch(`${API_URL}/api/images/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        setUploadStatus(`Failed to delete: ${err.error || 'Unknown error'}`);
      } else {
        setUploadStatus("Image deleted successfully.");
        fetchImages();
      }
    } catch {
      setUploadStatus("Failed to delete image.");
    }
    setDeleting("");
  };

  // --- Render logic with logs and error boundary ---
  if (isLoading) {
    console.log('Render: Loading spinner');
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="animate-spin h-8 w-8 text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }
  if (!isConnected) {
    console.log('Render: Wallet not connected');
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to access the admin content panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (!isAdmin) {
    console.log('Render: Not admin');
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. Only the contract admin can access this panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (!config && !loadingConfig) {
    console.log('Render: Config not loaded');
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Config Not Loaded</AlertTitle>
          <AlertDescription>
            Failed to load config from the server. Please check your API_URL and backend server.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
            <div className="bg-muted rounded-lg p-4 border border-border max-h-[400px] overflow-y-auto">
              {(() => {
                try {
                  return (
                    <ReactJson
                      src={config ? config : {}}
                      name={null}
                      theme="monokai"
                      style={{ fontSize: 14 }}
                      displayDataTypes={false}
                      displayObjectSize={false}
                      enableClipboard={false}
                      onEdit={e => setConfigText(JSON.stringify(e.updated_src, null, 2))}
                      onAdd={e => setConfigText(JSON.stringify(e.updated_src, null, 2))}
                      onDelete={e => setConfigText(JSON.stringify(e.updated_src, null, 2))}
                    />
                  );
                } catch (err) {
                  return <div className="text-red-500">Error rendering config JSON.</div>;
                }
              })()}
            </div>
          </section>
        )}

        {activeTab === "images" && (
          <section>
            <h2 className="text-xl font-semibold mb-2 text-muted-foreground">Images</h2>
            {/* Upload Area */}
            <div className="mb-6">
              <div
                ref={dropRef}
                className={`flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted p-8 mb-2 transition ring-primary/50 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <div className="text-4xl mb-2">📁</div>
                <div className="font-semibold mb-1">Drag & drop images here or click to select</div>
                <div className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (Max 10MB each)</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                  disabled={uploading}
                />
              </div>
              {uploading && <div className="text-primary text-sm mb-2">Uploading...</div>}
              {uploadStatus && <div className="text-green-600 text-sm mb-2">{uploadStatus}</div>}
            </div>
            {loadingImages ? (
              <div className="text-muted-foreground">Loading images...</div>
            ) : images.length === 0 ? (
              <div className="text-muted-foreground">No images found.</div>
            ) : (
              <div className="flex flex-col gap-4 w-full overflow-x-auto max-h-[400px] overflow-y-auto">
                {images.map((img) => (
                  <div key={img} className="flex items-center gap-4 bg-muted rounded-lg border border-border p-3 w-full min-w-[320px] max-w-full">
                    <img
                      src={`${API_URL}/images/${img}`}
                      alt={img}
                      className="w-24 h-16 object-cover rounded border border-border bg-background"
                      onError={(e) => ((e.currentTarget.style.display = "none"))}
                    />
                    <span className="flex-1 text-xs text-muted-foreground break-all">{img}</span>
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition disabled:opacity-60"
                      onClick={() => handleDelete(img)}
                      disabled={deleting === img}
                      type="button"
                    >
                      {deleting === img ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ContentAdmin;