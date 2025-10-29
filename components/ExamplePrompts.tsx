import React from 'react';

interface ExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const ExamplePrompts: React.FC<ExamplePromptsProps> = ({ onSelectPrompt }) => {
  const promptCategories = [
    {
      title: "📧 Communication",
      prompts: [
        "Create an email composer with rich text editing",
        "Show my inbox with unread messages",
        "Create a contact manager with search",
        "Build a chat interface for messaging"
      ]
    },
    {
      title: "📅 Productivity",
      prompts: [
        "Create a calendar with today's events",
        "Build a to-do list with priorities",
        "Create a note-taking app with tags",
        "Show my schedule for this week"
      ]
    },
    {
      title: "📷 Media & Hardware",
      prompts: [
        "Open camera to take photos",
        "Create an audio recorder",
        "Build a file manager with upload",
        "Show my current location on a map"
      ]
    },
    {
      title: "📊 Data & Analytics",
      prompts: [
        "Create a dashboard with system stats",
        "Build a data visualization tool",
        "Show usage analytics for my apps",
        "Create a search interface for all data"
      ]
    },
    {
      title: "🎮 Creative & Fun",
      prompts: [
        "Create a drawing app with tools",
        "Build a music player interface",
        "Create a weather widget",
        "Build a simple calculator"
      ]
    },
    {
      title: "⚙️ System & Settings",
      prompts: [
        "Show system information",
        "Create a settings panel",
        "Build a notification center",
        "Create a theme customizer"
      ]
    }
  ];

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-white mb-4">✨ Try These Examples</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promptCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300 border-b border-gray-600 pb-1">
              {category.title}
            </h3>
            <div className="space-y-1">
              {category.prompts.map((prompt, promptIndex) => (
                <button
                  key={promptIndex}
                  onClick={() => onSelectPrompt(prompt)}
                  className="w-full text-left p-2 text-sm text-gray-200 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">💡 Pro Tips</h3>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>• Be specific about what you want (e.g., "Create a todo list with drag-and-drop")</li>
          <li>• Mention data sources (e.g., "Show my contacts from the database")</li>
          <li>• Request hardware features (e.g., "Use camera to scan documents")</li>
          <li>• Ask for integrations (e.g., "Save this note to my notes collection")</li>
        </ul>
      </div>
    </div>
  );
};

export default ExamplePrompts;
