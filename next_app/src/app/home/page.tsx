"use client";
import React from "react";
import Link from "next/link";
import {
  FiMessageSquare,
  FiImage,
  FiSearch,
  FiUploadCloud,
  FiArrowRight,
  FiCode,
  FiGithub,
  FiExternalLink,
} from "react-icons/fi";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <header className="pt-16 pb-20 px-4 sm:px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 inline-block">
          AI-Powered Portfolio Project
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Showcasing intelligent document retrieval and image generation
          capabilities
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/chat"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center shadow-md hover:shadow-lg"
          >
            <FiMessageSquare className="mr-2" /> Try the RAG Chat
          </Link>
          <Link
            href="/image-generation"
            className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors font-medium flex items-center justify-center shadow-sm hover:shadow-md"
          >
            <FiImage className="mr-2" /> Generate Images
          </Link>
        </div>
      </header>

      {/* Main Features Section */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Powerful AI Features
        </h2>

        <div className="grid md:grid-cols-2 gap-12">
          {/* RAG Chat Feature */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg border border-gray-100">
            <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center p-6">
              <FiMessageSquare className="text-white text-6xl" />
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Document-Enhanced Chat
              </h3>
              <p className="text-gray-600 mb-6">
                Interact with an AI assistant that leverages your uploaded
                documents to provide accurate, contextual responses based on
                your specific content.
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-3">
                    <FiUploadCloud className="h-3 w-3" />
                  </div>
                  <p className="text-gray-600">
                    Upload your documents to create a knowledge base
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-3">
                    <FiSearch className="h-3 w-3" />
                  </div>
                  <p className="text-gray-600">
                    Advanced retrieval finds the most relevant information
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-3">
                    <FiMessageSquare className="h-3 w-3" />
                  </div>
                  <p className="text-gray-600">
                    Natural conversation with context-aware responses
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  href="/chat"
                  className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                >
                  Try RAG Chat <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>

          {/* Image Generation Feature */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg border border-gray-100">
            <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center p-6">
              <FiImage className="text-white text-6xl" />
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                AI Image Generation
              </h3>
              <p className="text-gray-600 mb-6">
                Transform your ideas into stunning visuals with our AI image
                generation tool. Simply describe what you want to see and let AI
                bring it to life.
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 mr-3">
                    <FiImage className="h-3 w-3" />
                  </div>
                  <p className="text-gray-600">
                    Multiple style options and aspect ratios
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 mr-3">
                    <FiCode className="h-3 w-3" />
                  </div>
                  <p className="text-gray-600">
                    Powered by state-of-the-art image generation models
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 mr-3">
                    <FiExternalLink className="h-3 w-3" />
                  </div>
                  <p className="text-gray-600">
                    Save and export your generated images
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  href="/image-generation"
                  className="inline-flex items-center text-purple-600 font-medium hover:text-purple-800 transition-colors"
                >
                  Generate Images <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          How It Works
        </h2>

        <div className="space-y-12">
          {/* RAG Explanation */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 font-bold">
                1
              </span>
              Retrieval Augmented Generation (RAG)
            </h3>
            <p className="text-gray-600 mb-4 pl-11">
              RAG combines the power of large language models with information
              retrieval systems to provide accurate, up-to-date responses based
              on your specific documents.
            </p>
            <div className="pl-11 grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium text-gray-800 mb-2">
                  Document Processing
                </h4>
                <p className="text-sm text-gray-600">
                  Your documents are processed, chunked, and embedded for
                  semantic search
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium text-gray-800 mb-2">
                  Context Retrieval
                </h4>
                <p className="text-sm text-gray-600">
                  When you ask a question, the system finds the most relevant
                  information
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium text-gray-800 mb-2">
                  Enhanced Response
                </h4>
                <p className="text-sm text-gray-600">
                  The AI generates answers based on both its knowledge and your
                  documents
                </p>
              </div>
            </div>
          </div>

          {/* Image Generation Explanation */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 font-bold">
                2
              </span>
              AI Image Generation
            </h3>
            <p className="text-gray-600 mb-4 pl-11">
              Using advanced diffusion models, the system translates your text
              descriptions into visual content, allowing you to create unique
              images for any purpose.
            </p>
            <div className="pl-11 grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium text-gray-800 mb-2">
                  Prompt Engineering
                </h4>
                <p className="text-sm text-gray-600">
                  Describe what you want to see with detailed text prompts
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium text-gray-800 mb-2">
                  Image Synthesis
                </h4>
                <p className="text-sm text-gray-600">
                  AI models convert your text into pixel-perfect visual
                  representations
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium text-gray-800 mb-2">
                  Customization
                </h4>
                <p className="text-sm text-gray-600">
                  Adjust parameters and settings to refine your generated images
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Built With Modern Technology
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="font-medium text-gray-800">Next.js</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="font-medium text-gray-800">TypeScript</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="font-medium text-gray-800">TailwindCSS</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="font-medium text-gray-800">AI Services</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto text-center mb-16">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          Ready to Explore?
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Discover the power of AI-enhanced document chat and image generation
          in this portfolio project.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/chat"
            className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center shadow-md hover:shadow-lg"
          >
            <FiMessageSquare className="mr-2" /> Start Chatting
          </Link>
          <Link
            href="/image-generation"
            className="px-8 py-4 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors font-medium flex items-center justify-center shadow-sm hover:shadow-md"
          >
            <FiImage className="mr-2" /> Create Images
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 mb-4 md:mb-0">
            Portfolio Project — Built with Next.js & AI
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiGithub size={20} />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiExternalLink size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
