import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../App';
import { GlobeIcon, CheckIcon } from './Icons';

function LanguageSelector({ className = '' }) {
  const { language, setLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const currentLangName = languages.find(l => l.code === language)?.nativeName || 'English';

  return (
    <div className={`language-selector-container ${className}`} ref={dropdownRef}>
      <button
        className="lang-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
      >
        <GlobeIcon size={20} />
        <span className="current-lang-name">{currentLangName}</span>
      </button>

      {isOpen && (
        <div className="lang-dropdown glass-card">
          <div className="lang-grid">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`lang-option ${language === lang.code ? 'active' : ''}`}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
              >
                <span className="lang-native">{lang.nativeName}</span>
                <span className="lang-english">{lang.name}</span>
                {language === lang.code && <CheckIcon size={16} className="check-icon" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
                .language-selector-container {
                    position: relative;
                    z-index: 1000;
                }

                .lang-toggle-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: var(--bg-glass);
                    border: 1px solid var(--border-glass);
                    padding: 0.5rem 1rem;
                    border-radius: 50px;
                    color: var(--text-primary);
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    backdrop-filter: blur(10px);
                }

                .lang-toggle-btn:hover {
                    background: var(--bg-glass-hover);
                    transform: translateY(-1px);
                    border-color: var(--accent-primary);
                }

                .lang-dropdown {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    width: 300px;
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 1rem;
                    animation: slideDown 0.2s ease-out;
                    border: 1px solid var(--border-glass-strong);
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .lang-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                }

                .lang-option {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 0.75rem;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    transition: all 0.2s;
                    position: relative;
                }

                .lang-option:hover {
                    background: var(--bg-glass-hover);
                    color: var(--text-primary);
                }

                .lang-option.active {
                    background: rgba(99, 102, 241, 0.1);
                    border-color: var(--accent-primary);
                    color: var(--accent-primary);
                }

                .lang-native {
                    font-size: 1rem;
                    font-weight: 600;
                    margin-bottom: 0.1rem;
                }

                .lang-english {
                    font-size: 0.75rem;
                    opacity: 0.8;
                }

                .check-icon {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    color: var(--accent-primary);
                }

                @media (max-width: 480px) {
                    .lang-dropdown {
                        position: fixed;
                        top: auto;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        width: 100%;
                        border-radius: 24px 24px 0 0;
                    }
                }
            `}</style>
    </div>
  );
}

export default LanguageSelector;
