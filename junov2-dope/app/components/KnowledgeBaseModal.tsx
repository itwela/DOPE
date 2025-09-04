'use client'

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import EmployeeProfilesModal from "./EmployeeProfilesModal";
import { formatTranscriptForKb_Gemini } from "../actions";
import { KnowledgeBaseModalProps, KnowledgeBaseEntry, ModalMode } from "./componetInterfaces";

export default function KnowledgeBaseModal({ agent, isOpen, onClose }: KnowledgeBaseModalProps) {
  const [mode, setMode] = useState<ModalMode>('list');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeBaseEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [transcriptContent, setTranscriptContent] = useState("");
  const [transcriptObjectForKb, setTranscriptObjectForKb] = useState<null | Record<string, unknown>>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  // Employee Profiles Modal state
  const [isEmployeeProfilesModalOpen, setIsEmployeeProfilesModalOpen] = useState(false);

  // Queries and mutations
  const knowledgeBaseEntries = useQuery(
    api.knowledgeBase.getKnowledgeBaseEntries,
    agent ? { agentId: agent._id } : "skip"
  );

  const createTextEntry = useAction(api.knowledgeBase.createTextEntry);
  const uploadFile = useAction(api.knowledgeBase.uploadFileAndCreateEntry);
  const deleteEntry = useMutation(api.knowledgeBase.deleteKnowledgeBaseEntry);
  const onlyInsertIntoKb = useMutation(api.knowledgeBase.addToKnowledgeBaseNoRag);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMode('list');
      setSelectedEntry(null);
      setSearchQuery("");
      setTextTitle("");
      setTextContent("");
      setTranscriptContent("");
      setTranscriptObjectForKb(null);
      setIsFormatting(false);
      setFormatError(null);
    }
  }, [isOpen]);

  const handleFormatTranscript = async () => {
    if (!transcriptContent.trim() || isFormatting) return;
    setFormatError(null);
    setIsFormatting(true);
    try {
      const formattedTranscript = await formatTranscriptForKb_Gemini(transcriptContent);
      const formattedTranscriptObject = JSON.parse(formattedTranscript as string);
      setTranscriptObjectForKb(formattedTranscriptObject);
    } catch (err) {
      console.error("Failed to format transcript:", err);
      setFormatError("Failed to format transcript. Please try again.");
    } finally {
      setIsFormatting(false);
    }
  }

  const handleClose = () => {
    setMode('list');
    setSelectedEntry(null);
    setSearchQuery("");
    setTextTitle("");
    setTextContent("");
    setTranscriptContent("");
    setTranscriptObjectForKb(null);
    setIsFormatting(false);
    setFormatError(null);
    onClose();
    console.log('tt debug', textTitle)
  };

  const handleBackToList = () => {
    setMode('list');
    setSelectedEntry(null);
    setTextTitle("");
    setTextContent("");
    setTranscriptContent("");
    setTranscriptObjectForKb(null);
    setIsFormatting(false);
    setFormatError(null);
  };

  const handleCreateTextEntry = async () => {
    if (!agent || !textContent.trim()) return;

    try {
      await createTextEntry({
        agentId: agent._id,
        title: `${agent.name.slice(0, 4)}_${new Date().getTime()}_txt`,
        content: textContent.trim(),
      });

      handleBackToList();
    } catch (error) {
      console.error("Failed to create text entry:", error);
    }
  };

  const handleCreateTranscriptEntry = async () => {
    if (!agent || !transcriptContent.trim()) return;

    try {

      await onlyInsertIntoKb({
        agentId: agent._id,
        title: `${transcriptObjectForKb?.title}_${new Date().getTime()}`,
        text: transcriptContent.trim(),
        metadata: {
          use: "interview",
          ...transcriptObjectForKb,
        },
      });

      // pause this for now
      // await createTextEntry({
      //   agentId: agent._id,
      //   title: `${agent.name.slice(0, 4)}_${new Date().getTime()}_txt`,
      //   content: transcriptContent.trim(),
      //   metadata: {
      //     transcriptId: `DOPE_MARKETING_${new Date().getTime()}_ts`,
      //     textLength: transcriptContent.trim().length,
      //     type: "transcript",
      //     ...transcriptObjectForKb,
      //   }
      // });

      handleBackToList();
    } catch (error) {
      console.error("Failed to create transcript entry:", error);
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !agent) return;

    setIsUploading(true);
    try {
      await uploadFile({
        agentId: agent._id,
        title: file.name,
        file: await file.arrayBuffer(),
        fileName: file.name,
        fileType: file.type,
      });

      handleBackToList();
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = "";
    }
  };

  const handleDeleteEntry = async (entryId: Id<"knowledgeBaseEntries">) => {
    try {
      await deleteEntry({ entryId });
      if (selectedEntry?._id === entryId) {
        handleBackToList();
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  const handleSelectEntry = (entry: KnowledgeBaseEntry) => {
    setSelectedEntry(entry);
    setMode('view');
  };

  if (!isOpen || !agent) return null;

  const entries = knowledgeBaseEntries || [];
  const filteredEntries = entries.filter((entry: KnowledgeBaseEntry) =>
    !searchQuery ||
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: "file" | "text" | "transcript-for-interview") => {
    if (type === "file") {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (type === "transcript-for-interview") {
      return (
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 01-14 0v-2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v2m-4 0h8" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      );
    }
  };

  const lightIcon = (
    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );

  const backIcon = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );

  const uploadIcon = (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const textIcon = (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );

  const transcriptIcon = (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 01-14 0v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19v2m-4 0h8" />
    </svg>
  );

  const renderHeader = () => (
    <>

      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-start gap-3">

            {mode !== 'list' && (

              <button
                onClick={handleBackToList}
                className="text-gray-400 hover:text-gray-600 transition-colors mr-2"
              >
                {backIcon}
              </button>
            )}

            <div className="w-8 h-8 bg-graye-100 rounded-full flex items-center justify-center">
              {lightIcon}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {mode === 'list' ? 'Knowledge Base' :
                  mode === 'add-text' ? 'Add Text Entry' :
                    mode === 'add-transcript' ? 'Add Transcript' :
                      mode === 'view' ? selectedEntry?.title || 'View Entry' : 'Knowledge Base'}
              </h2>
              <p className="text-sm text-gray-600">{agent.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <p className="text-sm text-gray-600">{`You have 2 ways to add knowledge to your agent, either by uploading a file or by adding the knowledge directly via text!`}</p>
        </div>
      </div>

    </>
  );

  const renderListMode = () => (
    <>
      {/* Search and Add Controls */}
      <div className="mb-6">
        {/* <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div> */}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('add-text')}
            className="flex cursor-pointer items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-lg transition-colors text-sm font-medium"
          >
            {textIcon}
            Add Text
          </button>

          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer">
            {uploadIcon}
            Upload File
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
              accept=".txt,.md,.pdf,.doc,.docx,.json,.csv"
            />
          </label>

          <button
            onClick={() => { setTranscriptObjectForKb(null); setTranscriptContent(""); setIsFormatting(false); setFormatError(null); setMode('add-transcript'); }}
            className="flex cursor-pointer items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-lg transition-colors text-sm font-medium"
          >
            {transcriptIcon}
            Add Transcript
          </button>

          {/* REVIEW ARCHIVED FOR NOW, THIS ADDS EMPLOYEE PROFILES TO THE KNOWLEDGE BASE */}
          {/* <button
            onClick={() => setIsEmployeeProfilesModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-lg transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Employee
          </button> */}
        </div>
      </div>

      {/* Entry List */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Knowledge Found</h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchQuery ? "No entries match your search" : "Start building your agent's knowledge base"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredEntries.map((entry: KnowledgeBaseEntry) => (
            <div
              key={entry._id}
              onClick={() => handleSelectEntry(entry)}
              className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(entry.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-gray-900 truncate mb-1">
                      {entry.title}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {entry.preview}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                        {entry.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEntry(entry._id);
                  }}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors ml-2"
                  title="Delete entry"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderAddTextMode = () => (
    <div className="space-y-6">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Enter the content for this knowledge entry..."
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={handleBackToList}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateTextEntry}
          disabled={!textContent.trim()}
          className="px-4 py-2 bg-accent cursor-pointer text-white hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Create Entry
        </button>
      </div>
    </div>
  );


  const renderAddTranscriptMode = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transcript
          </label>
          <textarea
            value={transcriptContent}
            onChange={(e) => setTranscriptContent(e.target.value)}
            placeholder="Paste the transcript here..."
            rows={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="relative border border-gray-200 rounded-lg min-h-[320px] flex items-center justify-center bg-gray-50 p-4">
          {transcriptObjectForKb === null ? (
            isFormatting ? (
              <div className="flex flex-col items-center gap-3 text-gray-600">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-accent rounded-full animate-spin" />
                <div className="text-sm">Formatting transcript...</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleFormatTranscript}
                  disabled={!transcriptContent.trim()}
                  className="px-4 py-2 cursor-pointer bg-accent text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Format transcript
                </button>
                {formatError && (
                  <div className="text-xs text-red-600 mt-1">{formatError}</div>
                )}
              </div>
            )
          ) : (
            <div className="w-full h-full overflow-auto">
              <h4 className="font-medium text-gray-900 mb-3">Formatted Object</h4>
              <pre className="text-xs text-gray-800 bg-white rounded-lg p-4 border border-gray-200 whitespace-pre-wrap break-words">
                {JSON.stringify(transcriptObjectForKb, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        
        <button
          onClick={handleBackToList}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={() => handleCreateTranscriptEntry()}
          className="px-4 cursor-pointer py-2 bg-accent text-white hover:bg-green-700 rounded-lg transition-colors"
        >
          Add To Knowledge Base - No RAG
        </button>

      </div>
    </div>
  );

  const renderViewMode = () => {
    if (!selectedEntry) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          {getTypeIcon(selectedEntry.type)}
          <div className="flex-1">
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {selectedEntry.type === "file" ? "File" : "Text"}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(selectedEntry.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {selectedEntry.type === "text" && selectedEntry.content && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Content</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedEntry.content}
              </p>
            </div>
          </div>
        )}

        {selectedEntry.type === "file" && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">File Information</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <dl className="grid grid-cols-1 gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <dt className="text-sm font-medium text-gray-600 sm:w-1/3">
                    Filename:
                  </dt>
                  <dd className="text-sm text-gray-900 sm:w-2/3">
                    {selectedEntry.fileName}
                  </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <dt className="text-sm font-medium text-gray-600 sm:w-1/3">
                    File Type:
                  </dt>
                  <dd className="text-sm text-gray-900 sm:w-2/3">
                    {selectedEntry.fileType}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Metadata</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <dl className="grid grid-cols-1 gap-3">
                {Object.entries(selectedEntry.metadata).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center">
                    <dt className="text-sm font-medium text-gray-600 sm:w-1/3 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </dt>
                    <dd className="text-sm text-gray-900 sm:w-2/3">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={() => handleDeleteEntry(selectedEntry._id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Delete Entry
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 bg-opacity-20 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-scroll">
          <div className="p-6 border-b border-gray-200">
            {renderHeader()}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {mode === 'list' && renderListMode()}
            {mode === 'add-text' && renderAddTextMode()}
            {mode === 'add-transcript' && renderAddTranscriptMode()}
            {mode === 'view' && renderViewMode()}
          </div>
        </div>

        {/* Upload Loading Overlay */}
        {isUploading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">Uploading file...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait while we process your file</p>
            </div>
          </div>
        )}
      </div>

      {/* Employee Profiles Modal */}
      <EmployeeProfilesModal
        isOpen={isEmployeeProfilesModalOpen}
        onClose={() => setIsEmployeeProfilesModalOpen(false)}
      />
    </>
  );
}
