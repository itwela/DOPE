'use client'

import { useState, useEffect } from "react";
import { Agent } from "../providers/AgentProvider";

interface EditAgentModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAgent: Partial<Agent>) => void;
}

export default function EditAgentModal({ agent, isOpen, onClose, onSave }: EditAgentModalProps) {
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    description: agent?.description || "",
    instructions: agent?.instructions || "",
    model: agent?.model || "",
    temperature: agent?.temperature || 0.7,
  });

  // Update form data when agent changes
  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions,
        model: agent.model,
        temperature: agent.temperature,
      });
    }
  }, [agent]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleClose = () => {
    // Reset form data to original agent values
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions,
        model: agent.model,
        temperature: 0.7,
      });
    }
    onClose();
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Agent</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Agent Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Agent Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-2 focus:border-transparent"
              placeholder="Enter agent name"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-2 focus:border-transparent"
              rows={3}
              placeholder="Describe what this agent does"
            />
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-2 focus:border-transparent"
              rows={4}
              placeholder="Enter detailed instructions for the agent's behavior"
            />
          </div>


        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
