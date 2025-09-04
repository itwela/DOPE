'use client'

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface EmployeeProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmployeeProfile {
  _id: Id<"employeeProfiles">;
  employeeId: string;
  name: string;
  position?: string;
  reportsTo?: string;
  gender?: string;
  assessmentDate: string;
  all34: string[];
  leadDomain: string;
  themeDomains: {
    Executing: string[];
    Influencing: string[];
    RelationshipBuilding: string[];
    StrategyThinking: string[];
  };
  howToCoach: string;
  bestCollabWith: string;
  watchouts: string;
  communicationTips: string;
  motivators: string[];
  demotivators: string[];
  evidenceQuotes: Array<{
    quote: string;
    section: string;
  }>;
  sourceDocUrl: string;
  sourceProvenance: string;
  createdAt: number;
  updatedAt: number;
}

type ModalMode = 'list' | 'add' | 'view' | 'edit';

export default function EmployeeProfilesModal({ isOpen, onClose }: EmployeeProfilesModalProps) {
  const [mode, setMode] = useState<ModalMode>('list');
  const [selectedProfile, setSelectedProfile] = useState<EmployeeProfile | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Edit mode state
  const [editFormData, setEditFormData] = useState<{
    name: string;
    position: string;
    reportsTo: string;
    gender: string;
    assessmentDate: string;
    leadDomain: string;
    howToCoach: string;
    bestCollabWith: string;
    watchouts: string;
    communicationTips: string;
    motivators: string[];
    demotivators: string[];
  }>({
    name: "",
    position: "",
    reportsTo: "",
    gender: "",
    assessmentDate: "",
    leadDomain: "",
    howToCoach: "",
    bestCollabWith: "",
    watchouts: "",
    communicationTips: "",
    motivators: [],
    demotivators: [],
  });

  // Queries and mutations
  const profiles = useQuery(api.employeeProfiles.getAllEmployeeProfiles);
  const createProfile = useMutation(api.employeeProfiles.createEmployeeProfile);
  const updateProfile = useMutation(api.employeeProfiles.updateEmployeeProfile);
  const deleteProfile = useMutation(api.employeeProfiles.deleteEmployeeProfile);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMode('list');
      setSelectedProfile(null);
      setJsonInput("");
      setSearchQuery("");
      setError("");
      setEditFormData({
        name: "",
        position: "",
        reportsTo: "",
        gender: "",
        assessmentDate: "",
        leadDomain: "",
        howToCoach: "",
        bestCollabWith: "",
        watchouts: "",
        communicationTips: "",
        motivators: [],
        demotivators: [],
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    setMode('list');
    setSelectedProfile(null);
    setJsonInput("");
    setSearchQuery("");
    setError("");
    setEditFormData({
      name: "",
      position: "",
      reportsTo: "",
      gender: "",
      assessmentDate: "",
      leadDomain: "",
      howToCoach: "",
      bestCollabWith: "",
      watchouts: "",
      communicationTips: "",
      motivators: [],
      demotivators: [],
    });
    onClose();
  };

  const handleBackToList = () => {
    setMode('list');
    setSelectedProfile(null);
    setJsonInput("");
    setError("");
    setEditFormData({
      name: "",
      position: "",
      reportsTo: "",
      gender: "",
      assessmentDate: "",
      leadDomain: "",
      howToCoach: "",
      bestCollabWith: "",
      watchouts: "",
      communicationTips: "",
      motivators: [],
      demotivators: [],
    });
  };

  const handleCreateProfile = async () => {
    if (!jsonInput.trim()) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      await createProfile({ profileData: jsonInput });
      handleBackToList();
      setJsonInput("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfile = async (profileId: Id<"employeeProfiles">) => {
    try {
      await deleteProfile({ profileId });
      if (selectedProfile?._id === profileId) {
        handleBackToList();
      }
    } catch (error) {
      console.error("Failed to delete profile:", error);
    }
  };

  const handleSelectProfile = (profile: EmployeeProfile) => {
    setSelectedProfile(profile);
    setMode('view');
  };

  const handleEditProfile = (profile: EmployeeProfile) => {
    setSelectedProfile(profile);
    setEditFormData({
      name: profile.name,
      position: profile.position || "",
      reportsTo: profile.reportsTo || "",
      gender: profile.gender || "",
      assessmentDate: profile.assessmentDate,
      leadDomain: profile.leadDomain,
      howToCoach: profile.howToCoach,
      bestCollabWith: profile.bestCollabWith,
      watchouts: profile.watchouts,
      communicationTips: profile.communicationTips,
      motivators: [...profile.motivators],
      demotivators: [...profile.demotivators],
    });
    setMode('edit');
  };

  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // Create the JSON data structure expected by the backend
      const profileData = {
        employee_id: selectedProfile.employeeId,
        name: editFormData.name,
        position: editFormData.position,
        reports_to: editFormData.reportsTo,
        gender: editFormData.gender,
        assessment_date: editFormData.assessmentDate,
        all34: selectedProfile.all34,
        lead_domain: editFormData.leadDomain,
        theme_domains: selectedProfile.themeDomains,
        how_to_coach: editFormData.howToCoach,
        best_collab_with: editFormData.bestCollabWith,
        watchouts: editFormData.watchouts,
        communication_tips: editFormData.communicationTips,
        motivators: editFormData.motivators,
        demotivators: editFormData.demotivators,
        evidence_quotes: selectedProfile.evidenceQuotes,
        source_doc_url: selectedProfile.sourceDocUrl,
        source_provenance: selectedProfile.sourceProvenance,
      };

      await updateProfile({ 
        profileId: selectedProfile._id, 
        profileData: JSON.stringify(profileData) 
      });
      handleBackToList();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFormChange = (field: keyof typeof editFormData, value: string | string[]) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMotivator = () => {
    setEditFormData(prev => ({
      ...prev,
      motivators: [...prev.motivators, ""]
    }));
  };

  const handleRemoveMotivator = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      motivators: prev.motivators.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateMotivator = (index: number, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      motivators: prev.motivators.map((item, i) => i === index ? value : item)
    }));
  };

  const handleAddDemotivator = () => {
    setEditFormData(prev => ({
      ...prev,
      demotivators: [...prev.demotivators, ""]
    }));
  };

  const handleRemoveDemotivator = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      demotivators: prev.demotivators.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateDemotivator = (index: number, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      demotivators: prev.demotivators.map((item, i) => i === index ? value : item)
    }));
  };

  if (!isOpen) return null;

  const allProfiles = profiles || [];
  const filteredProfiles = allProfiles.filter(profile =>
    !searchQuery || 
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {mode !== 'list' && (
          <button
            onClick={handleBackToList}
            className="text-gray-400 hover:text-gray-600 transition-colors mr-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'list' ? 'Employee Profiles' : 
             mode === 'add' ? 'Add Employee Profile' :
             mode === 'view' ? selectedProfile?.name || 'View Profile' :
             mode === 'edit' ? `Edit ${selectedProfile?.name || 'Profile'}` : 'Employee Profiles'}
          </h2>
          <p className="text-sm text-gray-600">CliftonStrengths Assessment Data</p>
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
  );

  const renderListMode = () => (
    <>
      {/* Search and Add Controls */}
      <div className="mb-6">
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <button
          onClick={() => setMode('add')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee Profile
        </button>
      </div>

      {/* Profile List */}
      {filteredProfiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Profiles Found</h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchQuery ? "No profiles match your search" : "Start building your employee profile database"}
          </p>
          <button
            onClick={() => setMode('add')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Add First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredProfiles.map((profile) => (
            <div
              key={profile._id}
              onClick={() => handleSelectProfile(profile)}
              className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-gray-900 truncate mb-1">
                      {profile.name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">
                      ID: {profile.employeeId} • Lead Domain: {profile.leadDomain}
                      {profile.position && ` • ${profile.position}`}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {profile.all34.slice(0, 3).map((strength, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {strength}
                        </span>
                      ))}
                      {profile.all34.length > 3 && (
                        <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          +{profile.all34.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        Assessment: {new Date(profile.assessmentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProfile(profile._id);
                  }}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors ml-2"
                  title="Delete profile"
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

  const renderAddMode = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">JSON Format</h4>
        <p className="text-xs text-blue-700">
          Paste your CliftonStrengths profile JSON data below. Make sure it includes required fields like employee_id and name.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile JSON Data
        </label>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='Paste your employee profile JSON here...'
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          onClick={handleBackToList}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateProfile}
          disabled={!jsonInput.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Create Profile
        </button>
      </div>
    </div>
  );

  const renderViewMode = () => {
    if (!selectedProfile) return null;

    return (
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {selectedProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
              <span>ID: {selectedProfile.employeeId}</span>
              <span>Lead Domain: {selectedProfile.leadDomain}</span>
              <span>Assessment: {new Date(selectedProfile.assessmentDate).toLocaleDateString()}</span>
              {selectedProfile.position && <span>Position: {selectedProfile.position}</span>}
              {selectedProfile.reportsTo && <span>Reports To: {selectedProfile.reportsTo}</span>}
              {selectedProfile.gender && <span>Gender: {selectedProfile.gender}</span>}
            </div>
          </div>
        </div>

        {/* Top 10 Strengths */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Top 10 Strengths</h4>
          <div className="flex flex-wrap gap-2">
            {selectedProfile.all34.map((strength, index) => (
              <span key={index} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                #{index + 1} {strength}
              </span>
            ))}
          </div>
        </div>

        {/* Coaching & Communication */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">How to Coach</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 text-sm">{selectedProfile.howToCoach}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Communication Tips</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 text-sm">{selectedProfile.communicationTips}</p>
            </div>
          </div>
        </div>

        {/* Collaboration & Watchouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Best Collaboration</h4>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-800 text-sm">{selectedProfile.bestCollabWith}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Watchouts</h4>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">{selectedProfile.watchouts}</p>
            </div>
          </div>
        </div>

        {/* Motivators & Demotivators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Motivators</h4>
            <ul className="space-y-2">
              {selectedProfile.motivators.map((motivator, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">{motivator}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Demotivators</h4>
            <ul className="space-y-2">
              {selectedProfile.demotivators.map((demotivator, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm text-gray-700">{demotivator}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Evidence Quotes */}
        {selectedProfile.evidenceQuotes.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Evidence Quotes</h4>
            <div className="space-y-3">
              {selectedProfile.evidenceQuotes.map((quote, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <blockquote className="text-gray-700 text-sm italic">&quot;{quote.quote}&quot;</blockquote>
                  <cite className="text-xs text-gray-500 mt-1">— {quote.section}</cite>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Source Information</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Provenance:</strong> {selectedProfile.sourceProvenance}</p>
            <p><strong>Document:</strong> {selectedProfile.sourceDocUrl}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button 
              onClick={() => handleEditProfile(selectedProfile)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Edit Profile
            </button>
            <button 
              onClick={() => handleDeleteProfile(selectedProfile._id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Delete Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditMode = () => {
    if (!selectedProfile) return null;

    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Edit Profile Metadata</h4>
          <p className="text-xs text-blue-700">
            {`Update the employee's basic information and assessment details below.`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => handleEditFormChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position/Job Title
              </label>
              <input
                type="text"
                value={editFormData.position}
                onChange={(e) => handleEditFormChange('position', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reports To
              </label>
              <input
                type="text"
                value={editFormData.reportsTo}
                onChange={(e) => handleEditFormChange('reportsTo', e.target.value)}
                placeholder="e.g., John Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <input
                type="text"
                value={editFormData.gender}
                onChange={(e) => handleEditFormChange('gender', e.target.value)}
                placeholder="e.g., Female, Male, Non-binary"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Assessment Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Date
              </label>
              <input
                type="date"
                value={editFormData.assessmentDate}
                onChange={(e) => handleEditFormChange('assessmentDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead Domain
              </label>
              <select
                value={editFormData.leadDomain}
                onChange={(e) => handleEditFormChange('leadDomain', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a domain</option>
                <option value="Executing">Executing</option>
                <option value="Influencing">Influencing</option>
                <option value="Relationship Building">Relationship Building</option>
                <option value="Strategic Thinking">Strategic Thinking</option>
              </select>
            </div>
          </div>
        </div>

        {/* Coaching & Communication */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How to Coach
            </label>
            <textarea
              value={editFormData.howToCoach}
              onChange={(e) => handleEditFormChange('howToCoach', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Best Collaboration Style
            </label>
            <textarea
              value={editFormData.bestCollabWith}
              onChange={(e) => handleEditFormChange('bestCollabWith', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Watchouts
            </label>
            <textarea
              value={editFormData.watchouts}
              onChange={(e) => handleEditFormChange('watchouts', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication Tips
            </label>
            <textarea
              value={editFormData.communicationTips}
              onChange={(e) => handleEditFormChange('communicationTips', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Motivators */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Motivators
            </label>
            <button
              onClick={handleAddMotivator}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Motivator
            </button>
          </div>
          <div className="space-y-2">
            {editFormData.motivators.map((motivator, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={motivator}
                  onChange={(e) => handleUpdateMotivator(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter motivator..."
                />
                <button
                  onClick={() => handleRemoveMotivator(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Demotivators */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Demotivators
            </label>
            <button
              onClick={handleAddDemotivator}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Demotivator
            </button>
          </div>
          <div className="space-y-2">
            {editFormData.demotivators.map((demotivator, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={demotivator}
                  onChange={(e) => handleUpdateDemotivator(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter demotivator..."
                />
                <button
                  onClick={() => handleRemoveDemotivator(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleBackToList}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateProfile}
            disabled={!editFormData.name.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Update Profile
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-20 flex items-center overflow-hidden justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-scroll">
        <div className="p-6 border-b border-gray-200">
          {renderHeader()}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'list' && renderListMode()}
          {mode === 'add' && renderAddMode()}
          {mode === 'view' && renderViewMode()}
          {mode === 'edit' && renderEditMode()}
        </div>
      </div>
    </div>
  );
}
