import React from 'react';
import { SUPPORTED_LANGUAGES } from '../utils/translations';

function LanguageSelector({ onSelect, currentLanguage }) {
    return (
        <div className="language-modal-overlay">
            <div className="language-modal">
                <div className="language-modal-header">
                    <h2>🌐 Select Your Language</h2>
                    <h3>अपनी भाषा चुनें</h3>
                </div>

                <div className="language-grid">
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            className={`language-option ${currentLanguage === lang.code ? 'selected' : ''}`}
                            onClick={() => onSelect(lang.code)}
                        >
                            <span className="native-name">{lang.nativeName}</span>
                            <span className="english-name">{lang.name}</span>
                        </button>
                    ))}
                </div>

                <p className="language-tip">
                    💡 Tip: Hindi (Roman) is recommended - easy to read on mobile!
                </p>
            </div>

            <style>{`
        .language-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .language-modal {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .language-modal-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .language-modal-header h2 {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
          color: #1e293b;
        }
        
        .language-modal-header h3 {
          font-size: 1.25rem;
          color: #64748b;
          font-weight: normal;
        }
        
        .language-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        
        .language-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .language-option:hover {
          border-color: #059669;
          background: #ecfdf5;
        }
        
        .language-option.selected {
          border-color: #059669;
          background: #059669;
          color: white;
        }
        
        .language-option .native-name {
          font-size: 1.125rem;
          font-weight: 600;
        }
        
        .language-option .english-name {
          font-size: 0.75rem;
          opacity: 0.7;
          margin-top: 0.25rem;
        }
        
        .language-tip {
          text-align: center;
          margin-top: 1rem;
          padding: 0.75rem;
          background: #fef9c3;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #854d0e;
        }
        
        @media (max-width: 400px) {
          .language-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}

export default LanguageSelector;
