import { useEffect, useState } from 'react';

import { transport } from '../transport/index.js';
import { Button } from './ui/Button.js';
import { Modal } from './ui/Modal.js';

interface OpenRouterKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function OpenRouterKeyModal({ isOpen, onClose, onSaved }: OpenRouterKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey('');
      setShowKey(false);
    }
  }, [isOpen]);

  const canSave = apiKey.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="OpenRouter 키" zIndex={60} className="w-128">
      <div className="px-10 pb-8 flex flex-col gap-6">
        <p className="text-sm text-text-muted leading-snug">
          입력한 키는 이 PC의 Pixel Agents 설정 폴더에 저장되고, OpenRouter 드라이버가
          환경변수 대신 읽습니다.
        </p>
        <label className="flex flex-col gap-2 text-sm text-text">
          API Key
          <input
            autoFocus
            value={apiKey}
            type={showKey ? 'text' : 'password'}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-or-v1-..."
            className="bg-bg border-2 border-border text-text px-4 py-3 outline-none shadow-pixel"
          />
        </label>
        <label className="flex items-center gap-3 text-xs text-text-muted">
          <input
            type="checkbox"
            checked={showKey}
            onChange={() => setShowKey((value) => !value)}
          />
          키 표시
        </label>
        <div className="flex justify-end gap-4">
          <Button variant="ghost" onClick={onClose}>
            나중에
          </Button>
          <Button
            variant="accent"
            disabled={!canSave}
            onClick={() => {
              transport.send({ type: 'setOpenRouterApiKey', apiKey: apiKey.trim() });
              onSaved?.();
              onClose();
            }}
          >
            저장
          </Button>
        </div>
      </div>
    </Modal>
  );
}
