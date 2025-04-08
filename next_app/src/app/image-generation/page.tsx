"use client";

import { useState } from "react";
import {
  useImageGeneration,
  ImageHistoryItem,
} from "./hooks/useImageGeneration";
import {
  FiZap,
  FiImage,
  FiClock,
  FiCamera,
  FiMoon,
  FiSun,
  FiDownload,
  FiHeart,
  FiArrowRight,
  FiX,
  FiChevronDown,
  FiSettings,
  FiLayout,
  FiCpu,
  FiMaximize,
  FiStar,
  FiTrello,
  FiCopy,
} from "react-icons/fi";

// Prompt templates for inspiration with emojis for visual appeal
const promptTemplates = [
  { text: "A cyberpunk cityscape at sunset with neon lights", icon: "🌆" },
  {
    text: "A floating crystal metropolis surrounded by bioluminescent forests that glow under a turquoise moon",
    icon: "🌃",
  },
  {
    text: "An ancient library intertwined with living vines, where each book’s pages emit a gentle, magical light",
    icon: "📚",
  },
  {
    text: "A waterfall pouring from the sky into a mirrored lake, with gravity-defying rocks and endless reflections",
    icon: "🏞️",
  },
  {
    text: "A neon desert oasis where towering sandstone cliffs are carved into geometric fractal patterns",
    icon: "🏜️",
  },
];

// Model options
const modelOptions = [
  {
    id: "imagen-3.0-fast-generate-001",
    label: "Base",
    description: "Faster generation with good quality",
  },
  {
    id: "imagen-3.0-generate-002",
    label: "Advanced",
    description: "Higher quality with more detailed results",
  },
];

// Aspect ratio options
const aspectRatioOptions = [
  { id: "1:1", label: "Square (1:1)", icon: "□" },
  { id: "3:4", label: "Portrait (3:4)", icon: "▯" },
  { id: "4:3", label: "Landscape (4:3)", icon: "▭" },
  { id: "16:9", label: "Widescreen (16:9)", icon: "▬" },
];

export default function ImageGenerationPage() {
  const [prompt, setPrompt] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(
    "imagen-3.0-fast-generate-001"
  );
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [animateSubmit, setAnimateSubmit] = useState<boolean>(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"create" | "gallery">("create");
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const {
    generateImage,
    isLoading,
    error,
    imageUrl,
    textResponse,
    imageHistory,
  } = useImageGeneration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setAnimateSubmit(true);
    setTimeout(() => setAnimateSubmit(false), 700);

    generateImage({
      prompt,
      model_name: selectedModel,
      aspect_ratio: aspectRatio,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      e.target instanceof HTMLTextAreaElement
    ) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTemplateClick = (template: string) => {
    setPrompt(template);
    const textareaElement = document.getElementById(
      "prompt"
    ) as HTMLTextAreaElement;
    if (textareaElement) {
      textareaElement.focus();
    }
  };

  const handleCopyPrompt = (item: ImageHistoryItem) => {
    navigator.clipboard.writeText(item.prompt);
    setCopiedPromptId(item.id);
    setTimeout(() => setCopiedPromptId(null), 1500);
  };

  const getSelectedModelLabel = () => {
    const model = modelOptions.find((m) => m.id === selectedModel);
    return model ? model.label : "Select Model";
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            AI Image Studio
          </h1>
          <p className="text-gray-600 text-base max-w-2xl mx-auto">
            Bring your imagination to life. Describe your vision, and let our AI
            generate stunning, unique visuals.
          </p>
        </header>

        <nav className="flex justify-center mb-8">
          <div className="inline-flex">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 border border-gray-300 rounded-l-md text-sm font-medium transition-colors ${
                activeTab === "create"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-white text-gray-600"
              }`}
            >
              <FiZap className="inline mr-1" /> Create
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`px-4 py-2 border-t border-b border-r border-gray-300 rounded-r-md text-sm font-medium transition-colors ${
                activeTab === "gallery"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-white text-gray-600"
              }`}
            >
              <FiTrello className="inline mr-1" /> Gallery{" "}
              {imageHistory.length > 0 && `(${imageHistory.length})`}
            </button>
          </div>
        </nav>

        {activeTab === "create" && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-3">
                    <FiStar className="text-lg" />
                  </span>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Design Canvas
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Describe what you want to create and our AI will generate a
                  unique image for you
                </p>
              </div>

              <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <FiCpu className="mr-2 text-indigo-500" /> AI Engine
                </label>
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                    className="flex items-center w-full bg-white text-sm h-12 px-4 border border-gray-300 rounded-lg justify-between text-gray-700 hover:border-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                    disabled={isLoading}
                    aria-haspopup="listbox"
                    aria-expanded={modelDropdownOpen}
                  >
                    <span className="flex items-center">
                      <FiSettings className="mr-2 text-indigo-500" />
                      {getSelectedModelLabel()}
                    </span>
                    <FiChevronDown
                      className={`ml-2 w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        modelDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {modelDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-md border border-gray-200 shadow-lg overflow-hidden py-1 text-sm">
                      <div className="max-h-60 overflow-auto">
                        {modelOptions.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              setSelectedModel(model.id);
                              setModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-center ${
                              selectedModel === model.id
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-700"
                            }`}
                          >
                            <div>
                              <span className="font-medium">{model.label}</span>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {model.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="prompt"
                    className="block text-sm font-medium mb-2 text-gray-700"
                  >
                    Describe your vision
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="A magical floating island with waterfalls and rainbow bridges..."
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring focus:ring-gray-300 focus:border-gray-300 min-h-[120px] text-gray-700 bg-white transition-all placeholder:text-gray-400"
                    disabled={isLoading}
                    aria-label="Image prompt input"
                    tabIndex={0}
                  />
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                    <FiImage className="mr-2" /> Need inspiration?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {promptTemplates.map((template, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => handleTemplateClick(template.text)}
                        className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-all border border-gray-200 flex items-center text-gray-700"
                        disabled={isLoading}
                        aria-label={`Use template: ${template.text}`}
                        tabIndex={0}
                      >
                        <span className="mr-1">{template.icon}</span>
                        {template.text.length > 20
                          ? template.text.substring(0, 20) + "..."
                          : template.text}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FiLayout className="mr-2" /> Canvas dimensions:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {aspectRatioOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setAspectRatio(option.id)}
                        className={`px-3 py-2 rounded-lg text-sm flex items-center border transition-all ${
                          aspectRatio === option.id
                            ? "bg-indigo-100 border-indigo-300 text-indigo-800 font-medium"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                        disabled={isLoading}
                      >
                        <span className="mr-1.5 text-lg">{option.icon}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 shadow"
                  } ${animateSubmit && "animate-pulse"}`}
                  disabled={isLoading || !prompt.trim()}
                  aria-label="Generate image"
                  tabIndex={0}
                >
                  <span className="flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating your masterpiece...
                      </>
                    ) : (
                      <>
                        <FiCamera className="mr-2" /> Generate Image
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>

            {error && (
              <div
                className="bg-red-50 border border-red-200 rounded-lg p-5 mb-8 max-w-3xl mx-auto flex items-start"
                role="alert"
              >
                <FiX className="text-red-500 text-xl mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {(imageUrl || textResponse) && (
              <div className="bg-white rounded-lg shadow p-6 mb-10 max-w-3xl mx-auto">
                <div className="flex items-center mb-6">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-3">
                    <FiMaximize className="text-lg" />
                  </span>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Your AI Creation
                  </h2>
                </div>

                {textResponse && (
                  <div className="mb-8">
                    <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                      <FiSun className="mr-2" /> AI's Interpretation:
                    </h3>
                    <p className="bg-gray-50 p-5 rounded-xl text-gray-700 border border-gray-200">
                      {textResponse}
                    </p>
                  </div>
                )}

                {imageUrl && (
                  <div className="space-y-5">
                    <div className="bg-gray-100 p-5 rounded-xl flex justify-center border border-gray-200">
                      <img
                        src={imageUrl}
                        alt={prompt || "AI generated image"}
                        className="max-h-[500px] object-contain rounded-lg shadow-sm transition-all"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <a
                        href={imageUrl}
                        download="ai-artwork.png"
                        className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-all"
                        aria-label="Download image"
                      >
                        <FiDownload className="mr-2" /> Download
                      </a>
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-all"
                        aria-label="View full image"
                      >
                        <FiArrowRight className="mr-2" /> View Full Size
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="bg-white rounded-lg shadow p-6 max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-3">
                <FiTrello className="text-lg" />
              </span>
              <h2 className="text-xl font-semibold text-gray-800">
                Your Creation Archive
              </h2>
            </div>

            {imageHistory.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FiImage className="mx-auto text-4xl mb-4 opacity-30" />
                <p>You haven't created any images yet.</p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="mt-4 px-4 py-2 text-sm text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50"
                >
                  Start creating
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {imageHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200 group"
                  >
                    <div className="h-52 overflow-hidden bg-gray-900 relative flex items-center justify-center">
                      <img
                        src={item.url}
                        alt={item.prompt}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                        <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs">
                          {aspectRatioOptions.find(
                            (a) => a.id === item.aspect_ratio
                          )?.label || item.aspect_ratio}
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white/20 hover:bg-white/40 backdrop-blur-sm p-2 rounded-full transition-colors"
                          aria-label="View full image"
                        >
                          <FiArrowRight className="text-white" />
                        </a>
                      </div>
                    </div>
                    <div className="p-4 flex-grow flex flex-col">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <p className="text-xs text-gray-500 flex items-center flex-shrink-0">
                          <FiClock className="mr-1 text-gray-400" />
                          {new Date(item.timestamp).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyPrompt(item)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1 relative"
                            aria-label="Copy prompt"
                          >
                            <FiCopy size={14} />
                            {copiedPromptId === item.id && (
                              <span className="absolute -top-6 right-0 text-xs bg-black text-white px-1.5 py-0.5 rounded">
                                Copied!
                              </span>
                            )}
                          </button>
                          <button className="text-gray-400 hover:text-red-500 transition-colors p-1">
                            <FiHeart size={14} />
                          </button>
                        </div>
                      </div>
                      <p
                        className="text-sm text-gray-800 font-medium line-clamp-2 mb-2 flex-grow cursor-default"
                        title={item.prompt}
                      >
                        {item.prompt}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-auto pt-2">
                        {item.model_name && (
                          <span className="inline-block px-2 py-1 bg-indigo-100 rounded-full text-xs font-medium text-indigo-700">
                            {item.model_name.includes("fast")
                              ? "Fast"
                              : "Advanced"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
