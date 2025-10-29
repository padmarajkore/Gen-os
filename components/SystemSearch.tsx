import React, { useState, useCallback } from 'react';
import { enhancedDbService } from '../services/enhancedDatabaseService';

interface SystemSearchProps {
  onCreateApp: (prompt: string) => void;
}

const SystemSearch: React.FC<SystemSearchProps> = ({ onCreateApp }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await enhancedDbService.searchAllData(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const createAppFromResult = (type: string, data: any) => {
    let prompt = '';
    switch (type) {
      case 'email':
        prompt = `Show email from ${data.from} with subject "${data.subject}"`;
        break;
      case 'note':
        prompt = `Show note titled "${data.title}"`;
        break;
      case 'contact':
        prompt = `Show contact details for ${data.firstName} ${data.lastName}`;
        break;
      case 'file':
        prompt = `Show file "${data.name}" with preview`;
        break;
      default:
        prompt = `Show details for ${type}`;
    }
    onCreateApp(prompt);
  };

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-4 mb-4">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search across all your data..."
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white font-medium"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchResults && (
        <div className="space-y-4">
          {searchResults.apps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Apps ({searchResults.apps.length})</h3>
              <div className="space-y-1">
                {searchResults.apps.slice(0, 3).map((app: any) => (
                  <div
                    key={app.appId}
                    className="p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700"
                    onClick={() => onCreateApp(`Open ${app.appName}`)}
                  >
                    <div className="text-sm font-medium">{app.appName}</div>
                    <div className="text-xs text-gray-400">Used {app.usageCount} times</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.emails.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Emails ({searchResults.emails.length})</h3>
              <div className="space-y-1">
                {searchResults.emails.slice(0, 3).map((email: any) => (
                  <div
                    key={email.id}
                    className="p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700"
                    onClick={() => createAppFromResult('email', email)}
                  >
                    <div className="text-sm font-medium">{email.subject}</div>
                    <div className="text-xs text-gray-400">From: {email.from}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.notes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Notes ({searchResults.notes.length})</h3>
              <div className="space-y-1">
                {searchResults.notes.slice(0, 3).map((note: any) => (
                  <div
                    key={note.id}
                    className="p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700"
                    onClick={() => createAppFromResult('note', note)}
                  >
                    <div className="text-sm font-medium">{note.title}</div>
                    <div className="text-xs text-gray-400">{note.content.substring(0, 50)}...</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.contacts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Contacts ({searchResults.contacts.length})</h3>
              <div className="space-y-1">
                {searchResults.contacts.slice(0, 3).map((contact: any) => (
                  <div
                    key={contact.id}
                    className="p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700"
                    onClick={() => createAppFromResult('contact', contact)}
                  >
                    <div className="text-sm font-medium">{contact.firstName} {contact.lastName}</div>
                    <div className="text-xs text-gray-400">{contact.email || contact.phone}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Files ({searchResults.files.length})</h3>
              <div className="space-y-1">
                {searchResults.files.slice(0, 3).map((file: any) => (
                  <div
                    key={file.id}
                    className="p-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700"
                    onClick={() => createAppFromResult('file', file)}
                  >
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-gray-400">{file.type} • {(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.values(searchResults).every((arr: any) => arr.length === 0) && (
            <div className="text-center text-gray-400 py-4">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemSearch;
