import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import type { LibraryResponse, LibrarySection } from '../lib/types';
import { Badge } from '../components/ui/Badge';
import { MathRenderer } from '../components/ui/MathRenderer';
import type { LibraryModuleItem } from '../components/three/LibraryWorld';
import LibraryWorld from '../components/three/LibraryWorld';
import fallbackLibraryData from '../data/fallbackLibrary.json';

const fallbackLibrary = fallbackLibraryData as unknown as LibraryResponse;

const MOBILE_VOLUME_THEMES = [
  {
    cover: 'from-[#154431] via-[#0F3325] to-[#081F16]',
    spine: 'from-[#0A2218] via-[#174A35] to-[#0C291E]',
    titleColor: 'text-[#FFF6DE]',
    metaColor: 'text-[#E8CA7A]',
    borderColor: 'border-[#E8CA7A]/45',
    formula: 'y = mx + b',
  },
  {
    cover: 'from-[#F0E9D8] via-[#E5DBC4] to-[#CFC2A6]',
    spine: 'from-[#BFB295] via-[#DFD5BE] to-[#AE9F80]',
    titleColor: 'text-[#13241B]',
    metaColor: 'text-[#7C5D24]',
    borderColor: 'border-[#B89348]/65',
    formula: '2x + 4 = 10',
  },
  {
    cover: 'from-[#18304F] via-[#11243D] to-[#0A1626]',
    spine: 'from-[#091524] via-[#1A3557] to-[#0E1D31]',
    titleColor: 'text-[#FFF7E4]',
    metaColor: 'text-[#8CC5E8]',
    borderColor: 'border-[#8CC5E8]/40',
    formula: 'y ≤ mx + b',
  },
  {
    cover: 'from-[#5C1B20] via-[#461317] to-[#2C0A0D]',
    spine: 'from-[#28080B] via-[#5E1D22] to-[#3A1013]',
    titleColor: 'text-[#FFF5DF]',
    metaColor: 'text-[#ECCE84]',
    borderColor: 'border-[#ECCE84]/45',
    formula: 'f(x) = ax²',
  },
  {
    cover: 'from-[#ECE4D2] via-[#E1D6BE] to-[#C9BC9F]',
    spine: 'from-[#B8AB8D] via-[#DCD0B6] to-[#A69778]',
    titleColor: 'text-[#15241C]',
    metaColor: 'text-[#7A5B22]',
    borderColor: 'border-[#B28D42]/65',
    formula: 'aᵐ · aⁿ = aᵐ⁺ⁿ',
  },
  {
    cover: 'from-[#144230] via-[#0E3123] to-[#071D15]',
    spine: 'from-[#071B13] via-[#184B36] to-[#0B271C]',
    titleColor: 'text-[#FFF6DE]',
    metaColor: 'text-[#82D9AE]',
    borderColor: 'border-[#E8CA7A]/45',
    formula: '(x − 2)(x − 3)',
  },
];

export const Library: React.FC = () => {
  const [data, setData] = useState<LibraryResponse>(fallbackLibrary);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('All');
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [resetSignal, setResetSignal] = useState<number>(0);
  const [scrollVeil, setScrollVeil] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Wire Ctrl+K / Cmd+K shortcut to focus the archive search input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Passive scroll listener ONLY to ease a gentle readability atmospheric tint behind scrolled panels
  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const progress = Math.min(1, Math.max(0, window.scrollY / 520));
        setScrollVeil(progress);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Background fetch for live updates without ever blocking 3D rendering
  useEffect(() => {
    let mounted = true;
    api
      .library()
      .then((res) => {
        if (mounted && res && res.modules) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          // If backend is offline or delayed, fallback library keeps the 3D scene & 23 sections fully functional
          console.info('[EduPath Library] Using verified curriculum data:', err.message);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const moduleEntries = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.modules);
  }, [data]);

  const libraryModules = useMemo<LibraryModuleItem[]>(
    () =>
      moduleEntries.map(([name, sections]) => ({
        name,
        sectionCount: sections.length,
      })),
    [moduleEntries]
  );

  const filteredSections = useMemo(() => {
    if (!data) return [];
    const all: LibrarySection[] = [];
    Object.entries(data.modules).forEach(([modName, sections]) => {
      if (selectedModule === 'All' || selectedModule === modName) {
        all.push(...sections);
      }
    });

    if (!search.trim()) return all;

    const q = search.toLowerCase();
    return all.filter(
      (sec) =>
        sec.heading.toLowerCase().includes(q) ||
        sec.module.toLowerCase().includes(q) ||
        sec.content.toLowerCase().includes(q)
    );
  }, [data, selectedModule, search]);

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const handleSelectVolume = (modName: string) => {
    const next = selectedModule === modName ? 'All' : modName;
    setSelectedModule(next);
  };

  const handleResetView = () => {
    setResetSignal((n) => n + 1);
    setSelectedModule('All');
  };

  return (
    <div className="relative w-full min-h-screen -mt-28 sm:-mt-32 lg:-mt-36">
      {/* ════════════════════════════════════════════════════════════
       *  CONTINUOUS FULL-ROUTE FIXED 3D ENCHANTED LIBRARY ENVIRONMENT
       *  Stays alive across the entire scrollable Library page (No Card Box, No Boundary)
       * ════════════════════════════════════════════════════════════ */}
      {isDesktop && moduleEntries.length > 0 && (
        <div className="hidden md:block fixed inset-0 z-0 w-screen h-screen bg-[#040F0A]">
          <LibraryWorld
            modules={libraryModules}
            activeModule={selectedModule}
            onModuleClick={handleSelectVolume}
            resetSignal={resetSignal}
          />

          {/* Soft upper vaulted readability veil (no hard line or box) */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[44%]"
            style={{
              background:
                'radial-gradient(ellipse 58% 82% at 50% 28%, rgba(4, 15, 10, 0.72) 0%, rgba(4, 15, 10, 0.3) 58%, rgba(4, 15, 10, 0) 100%)',
            }}
          />

          {/* Continuous atmospheric darkening veil as the reader scrolls into study sections */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-200"
            style={{
              background:
                'radial-gradient(ellipse 95% 85% at 50% 45%, rgba(4, 16, 11, 0.36) 0%, rgba(3, 12, 8, 0.62) 100%)',
              opacity: scrollVeil * 0.85,
            }}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
       *  SCROLLABLE HTML OVERLAY LAYER (Transparent Window Over 3D Books)
       *  pointer-events-none on open wrappers lets mouse hover & click 3D books seamlessly
       * ════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 pointer-events-none w-full flex flex-col">
        {/* 1. Floating Archive Header & Search Bar in Upper Vault Space */}
        <header className="w-full max-w-4xl mx-auto px-4 sm:px-8 pt-28 sm:pt-32 lg:pt-32 pb-6 md:pb-0 text-center space-y-4">
          <div className="space-y-2">
            <span className="inline-block text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-[#E8C97A] drop-shadow-[0_2px_10px_rgba(0,0,0,0.88)]">
              The EduPath Archives
            </span>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#FFFDF7] drop-shadow-[0_6px_28px_rgba(0,0,0,0.92)]">
              Knowledge Library
            </h1>
            <p className="text-xs sm:text-sm md:text-[15px] text-[#EBE7DB] max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.88)]">
              Explore OpenStax Algebra 1 —{' '}
              <strong className="text-[#F5E3B3]">23 knowledge sections across 6 modules</strong>{' '}
              with definitions, worked examples, and direct textbook links.
            </p>
          </div>

          {/* Centered Translucent Archive Search Bar with Ctrl+K Shortcut */}
          <div className="pointer-events-auto relative max-w-xl mx-auto pt-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 mt-0.5 text-[#E8C97A]/85 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, sections, or concepts..."
              aria-label="Search knowledge library topics, sections, or concepts"
              className="w-full rounded-full border border-[#E8C97A]/35 bg-[#061810]/74 backdrop-blur-2xl pl-11 pr-24 py-3 text-sm text-[#FFFDF7] placeholder:text-[#B8B4A7] focus:border-[#F5E3B3]/80 focus:outline-none focus:ring-2 focus:ring-[#E8C97A]/25 transition-all shadow-[0_14px_40px_rgba(0,0,0,0.68)]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 mt-0.5 text-[#C6C3B7] hover:text-[#FFFDF7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="pointer-events-none hidden sm:flex items-center gap-1 absolute right-3.5 top-1/2 -translate-y-1/2 mt-0.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/8 border border-white/15 text-[10px] font-mono text-[#D6D2C5]">
                  Ctrl
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/8 border border-white/15 text-[10px] font-mono text-[#D6D2C5]">
                  K
                </kbd>
              </div>
            )}
          </div>
        </header>

        {/* 2. Open Sightline Window Over the Six Interactive 3D Mathematics Books (Desktop) */}
        {moduleEntries.length > 0 && (
          <div className="hidden md:flex flex-col justify-end w-full h-[50vh] min-h-[370px] max-h-[500px] px-6 pb-5 pointer-events-none">
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#05140D]/72 backdrop-blur-xl border border-[#E8C97A]/25 text-[11px] text-[#E6E2D6] shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8C97A]" />
                <span>
                  {selectedModule === 'All'
                    ? 'Move cursor for subtle side views · Click any 3D textbook · Scroll down to study'
                    : `Selected: ${selectedModule}`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleResetView}
                className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#05140D]/76 hover:bg-[#0D281B]/92 backdrop-blur-xl border border-[#E8C97A]/35 hover:border-[#F5E3B3] text-[11px] font-medium text-[#F5E3B3] transition-all cursor-pointer shadow-lg"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset View</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Translucent Floating Curriculum Selector & Knowledge Sections Over Live 3D Archive */}
        <div className="pointer-events-auto w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-14 space-y-10">
          {moduleEntries.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#05140D]/68 backdrop-blur-xl border border-[#E8C97A]/22">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#E8C97A]">
                    Six OpenStax Volumes
                  </span>
                  <span className="text-xs text-[#C6C3B7]">· 23 curriculum sections</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedModule('All')}
                  aria-pressed={selectedModule === 'All'}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-xl transition-all cursor-pointer ${
                    selectedModule === 'All'
                      ? 'bg-[#E8C97A] border-[#FFFDF7] text-[#05120B] shadow-[0_0_20px_rgba(232,201,122,0.35)]'
                      : 'bg-[#061810]/72 border-[#E8C97A]/30 text-[#E6E2D6] hover:border-[#F5E3B3]/70'
                  }`}
                >
                  All 6 Volumes
                </button>
              </div>

              {/* Desktop Translucent Six-Volume Selector Grid */}
              <div
                className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-3"
                role="group"
                aria-label="Knowledge Library Volumes"
              >
                {moduleEntries.map(([modName, sections], idx) => {
                  const isSelected = selectedModule === modName;
                  return (
                    <button
                      key={modName}
                      type="button"
                      onClick={() => handleSelectVolume(modName)}
                      aria-pressed={isSelected}
                      className={`text-left px-4 py-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 backdrop-blur-xl shadow-[0_14px_34px_-14px_rgba(0,0,0,0.75)] ${
                        isSelected
                          ? 'bg-[#123B29]/82 border-[#F5E3B3]/80 text-[#FFFDF7] shadow-[0_0_24px_rgba(232,201,122,0.28)]'
                          : 'bg-[#061710]/62 border-[#E8C97A]/18 text-[#E3DFD3] hover:border-[#E8C97A]/55 hover:bg-[#0B2419]/76 hover:text-[#FFFDF7]'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#E8C97A] block">
                          Vol. 0{idx + 1}
                        </span>
                        <span className="text-xs sm:text-[13px] font-medium block truncate mt-0.5">
                          {modName}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full shrink-0 ${
                          isSelected
                            ? 'bg-[#E8C97A]/28 text-[#FFF4D2]'
                            : 'bg-black/30 text-[#C6C3B7]'
                        }`}
                      >
                        {sections.length} sec
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Responsive Textbook Cards Fallback */}
              <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {moduleEntries.map(([modName, sections], idx) => {
                  const theme = MOBILE_VOLUME_THEMES[idx % MOBILE_VOLUME_THEMES.length];
                  const isSelected = selectedModule === modName;

                  return (
                    <button
                      key={modName}
                      type="button"
                      onClick={() => handleSelectVolume(modName)}
                      className={`group relative text-left rounded-r-xl rounded-l-sm p-5 min-h-[160px] bg-gradient-to-br ${theme.cover} border ${theme.borderColor} transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden shadow-[0_16px_36px_-12px_rgba(0,0,0,0.8)] ${
                        isSelected ? 'ring-2 ring-[#F8EAC4]' : ''
                      }`}
                    >
                      <span
                        className={`absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r ${theme.spine} border-r border-[#E8C97A]/25 pointer-events-none`}
                      />
                      <div className="pl-4 pr-1 relative z-10 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-mono font-semibold uppercase tracking-widest ${theme.metaColor}`}>
                            Vol. 0{idx + 1}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/20 ${theme.titleColor}`}>
                            {sections.length} {sections.length === 1 ? 'section' : 'sections'}
                          </span>
                        </div>
                        <h3 className={`font-editorial text-lg font-semibold leading-snug ${theme.titleColor}`}>
                          {modName}
                        </h3>
                      </div>
                      <div className="pl-4 pr-1 pt-3 flex items-end justify-between relative z-10">
                        <span className={`font-mono text-xs opacity-85 ${theme.metaColor}`}>
                          {theme.formula}
                        </span>
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${theme.metaColor}`}>
                          {isSelected ? 'Selected' : 'Explore →'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {error && (
            <div className="p-5 rounded-2xl bg-[#E07A5F]/20 border border-[#EB9A85]/45 text-sm text-[#EB9A85] backdrop-blur-xl">
              {error}
            </div>
          )}

          {/* 4. Translucent OpenStax Knowledge Sections Floating Within the Archive */}
          <section id="library-sections-list" className="space-y-4 pb-8 scroll-mt-36">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-[#05150E]/68 backdrop-blur-xl border border-[#E8C97A]/20 shadow-lg">
                <div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#FFFDF7]">
                    {selectedModule === 'All' ? 'All Knowledge Sections' : selectedModule}
                  </h2>
                  <p className="text-xs text-[#D6D2C5] mt-0.5">
                    Showing {filteredSections.length} OpenStax{' '}
                    {filteredSections.length === 1 ? 'section' : 'sections'}
                    {search.trim() ? ` matching "${search.trim()}"` : ''}
                  </p>
                </div>
                {selectedModule !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setSelectedModule('All')}
                    className="text-xs font-medium text-[#E8C97A] hover:text-[#FFFDF7] cursor-pointer px-3 py-1.5 rounded-full bg-white/5 border border-[#E8C97A]/25"
                  >
                    Reset filter
                  </button>
                )}
              </div>

              {filteredSections.length === 0 ? (
                <div className="p-12 rounded-3xl text-center text-[#D6D2C5] bg-[#061710]/70 backdrop-blur-xl border border-[#E8C97A]/20">
                  <BookOpen className="w-8 h-8 mx-auto text-[#E8C97A] mb-3" />
                  <p className="font-editorial text-xl text-[#FFFDF7]">No matching sections found</p>
                  <p className="text-xs mt-1">
                    Try adjusting your search keywords or selecting another volume.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSections.map((sec) => {
                    const isOpen = expandedSection === sec.index;
                    return (
                      <div
                        key={sec.index}
                        className={`rounded-2xl border transition-all duration-300 overflow-hidden backdrop-blur-xl shadow-[0_16px_40px_-14px_rgba(0,0,0,0.72)] ${
                          isOpen
                            ? 'bg-[#081F15]/82 border-[#E8C97A]/50'
                            : 'bg-[#061710]/64 border-[#E8C97A]/16 hover:border-[#E8C97A]/40 hover:bg-[#0A2217]/74'
                        }`}
                      >
                        <div
                          onClick={() => toggleSection(sec.index)}
                          className="p-5 sm:p-6 cursor-pointer flex items-center justify-between gap-4 select-none"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="sage" size="sm">
                                {sec.module}
                              </Badge>
                              <span className="text-[11px] font-mono text-[#E8C97A]">
                                Section #{sec.index + 1}
                              </span>
                            </div>
                            <h3 className="font-editorial font-semibold text-lg sm:text-xl text-[#FFFDF7] truncate">
                              {sec.heading}
                            </h3>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {sec.openstax_url && (
                              <a
                                href={sec.openstax_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#F5E3B3] hover:text-[#FFFDF7] font-semibold"
                              >
                                <span>OpenStax</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-[#E8C97A]/28 text-[#F5E3B3] flex items-center justify-center">
                              {isOpen ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="px-6 sm:px-7 pb-7 pt-4 border-t border-[#E8C97A]/18 bg-[#04110B]/72">
                            <div className="text-sm sm:text-base text-[#EAE6DA] leading-relaxed">
                              <MathRenderer content={sec.content} />
                            </div>

                            {sec.openstax_url && (
                              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                                <a
                                  href={sec.openstax_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#F5E3B3] hover:text-[#FFFDF7]"
                                >
                                  <span>Read complete chapter in OpenStax Algebra 1</span>
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
        </div>
      </div>
    </div>
  );
};
