import * as React from 'react';

interface SettingsData {
  path: string;
  autoApproveReads: boolean;
  autoApproveTerminal: boolean;
  defaultModel: string;
}

interface SettingsPanelProps {
  settings: SettingsData;
  onSave: (settings: SettingsData) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onSave, onClose }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = React.useState<SettingsData>({ ...settings });

  const handleChange = (key: keyof SettingsData, value: string | boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>MiMo Settings</h3>
        <button className="settings-close" onClick={onClose}>✕</button>
      </div>

      <div className="settings-body">
        <div className="settings-group">
          <label className="settings-label">Binary Path</label>
          <p className="settings-hint">Leave empty for auto-detect</p>
          <input
            type="text"
            className="settings-input"
            value={localSettings.path}
            onChange={e => handleChange('path', e.target.value)}
            placeholder="e.g. /usr/local/bin/mimo"
          />
        </div>

        <div className="settings-group">
          <label className="settings-label">Default Model</label>
          <p className="settings-hint">Leave empty for MiMo Auto (free)</p>
          <select
            className="settings-select"
            value={localSettings.defaultModel}
            onChange={e => handleChange('defaultModel', e.target.value)}
          >
            <option value="">MiMo Auto (Free)</option>
            <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
            <option value="anthropic/claude-opus-4">Claude Opus 4</option>
            <option value="openai/gpt-4.1">GPT-4.1</option>
            <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="deepseek/deepseek-r1">DeepSeek R1</option>
          </select>
        </div>

        <div className="settings-group">
          <label className="settings-label">
            <input
              type="checkbox"
              checked={localSettings.autoApproveReads}
              onChange={e => handleChange('autoApproveReads', e.target.checked)}
            />
            Auto-approve file reads
          </label>
          <p className="settings-hint">Skip approval for file read operations</p>
        </div>

        <div className="settings-group">
          <label className="settings-label">
            <input
              type="checkbox"
              checked={localSettings.autoApproveTerminal}
              onChange={e => handleChange('autoApproveTerminal', e.target.checked)}
            />
            Auto-approve terminal commands
          </label>
          <p className="settings-hint">Skip approval for terminal commands (use with caution)</p>
        </div>
      </div>

      <div className="settings-footer">
        <button className="settings-btn cancel" onClick={onClose}>Cancel</button>
        <button className="settings-btn save" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}
