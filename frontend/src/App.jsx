import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './index.css';
import { lookupMazii } from './services/dictionaryService';
import { saveCard } from './services/srsService';
import { searchImmersionKit } from './services/immersionService';

const API_BASE = 'http://localhost:8081/api/v1';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [animeResults, setAnimeResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [context, setContext] = useState({ prev: [], next: [] });
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const [lookUpData, setLookUpData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const currentLineRef = useRef(null);
  const animeScrollRef = useRef(null);

  useEffect(() => {
    if (currentVideo && currentLineRef.current) {
      currentLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [context, currentVideo]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      const [transcripts, anime] = await Promise.all([
        axios.get(`${API_BASE}/search`, { params: { q: query } }),
        searchImmersionKit(query)
      ]);
      setResults(transcripts.data);
      setAnimeResults(anime);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const playAt = async (item) => {
    const time = Math.floor(item.startTime);
    setIsVideoLoading(true);
    setCurrentVideo({
      videoId: item.videoId,
      startTime: time,
      text: item.textRaw,
      key: Date.now()
    });

    try {
      const resp = await axios.get(`${API_BASE}/search/context`, {
        params: { videoId: item.videoId, startTime: item.startTime, limit: 4 }
      });
      setContext(resp.data);
    } catch (err) {
      setContext({ prev: [], next: [] });
    }
  };

  const handleSelection = async (e) => {
    const selection = window.getSelection().toString().trim();
    if (selection && selection.length < 20) {
      const data = await lookupMazii(selection);
      if (data) {
        setLookUpData(data);
        setPopupPos({ x: e.pageX, y: e.pageY });
        setShowPopup(true);
      }
    }
  };

  const scrollAnime = (dir) => {
    if (animeScrollRef.current) {
      const scrollAmount = dir === 'left' ? -400 : 400;
      animeScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const playAudio = (url) => {
    new Audio(url).play();
  };

  return (
    <div className="container" onClick={() => setShowPopup(false)}>
      <header style={{ marginBottom: '60px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-20px', left: '-20px', fontSize: '60px', opacity: 0.05, fontStyle: 'italic', fontWeight: 900, pointerEvents: 'none', color: '#be1e2d' }}>BITE SIZE</div>
        <h1 style={{ textAlign: 'center', fontSize: '56px', color: 'var(--mrf-ink)', margin: 0 }}>
          <span>🇯🇵 JAPANESE DICTIONARY</span>
        </h1>
        <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 900, letterSpacing: '0.4em', color: 'var(--mrf-gold)', transform: 'translateY(-10px)' }}>IMMERSION MINING STATION</p>
      </header>

      <form className="search-container" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          placeholder="Nhập câu thoại hoặc từ vựng để khai thác..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="search-button">
          {loading ? 'BUSY...' : 'EXTRACT'}
        </button>
      </form>

      {currentVideo && (
        <div className="player-section-wrapper" onMouseUp={handleSelection}>
          <div style={{ display: 'flex', gap: '30px' }} className="player-section">
            <div style={{ flex: 1.6 }} className="video-container">
              <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
                <iframe
                  key={currentVideo.key}
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&start=${Math.max(0, currentVideo.startTime - 3)}&end=${Math.floor(currentVideo.startTime + 10)}&cc_load_policy=1&hl=ja`}
                  frameBorder="0" allowFullScreen
                  onLoad={() => setIsVideoLoading(false)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                ></iframe>
              </div>
            </div>

            <div style={{ flex: 1, maxHeight: '450px', display: 'flex', flexDirection: 'column' }} className="transcript-sidebar">
              <div className="sidebar-label">TRANSCRIPT EXCERPT</div>
              <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {context.prev.map((line, idx) => (
                  <div key={`p-${idx}`} style={{ color: '#888', fontSize: '15px', marginBottom: '14px', cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => playAt(line)} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>{line.textRaw}</div>
                ))}
                <div ref={currentLineRef} style={{ fontSize: '19px', fontWeight: '900', color: '#fff', background: 'rgba(190, 30, 45, 0.2)', padding: '15px', borderLeft: '5px solid var(--mrf-crimson)', margin: '15px 0' }}>
                  {currentVideo.text}
                </div>
                {context.next.map((line, idx) => (
                  <div key={`n-${idx}`} style={{ color: '#888', fontSize: '15px', marginBottom: '14px', cursor: 'pointer' }} onClick={() => playAt(line)} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#888'}>{line.textRaw}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dictionary Popup Brutalist */}
      {showPopup && lookUpData && (
        <div className="dict-popup" style={{
          position: 'absolute', top: popupPos.y + 15, left: Math.min(popupPos.x, window.innerWidth - 350),
          width: '320px', padding: '20px', zIndex: 1000
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--mrf-ink)', paddingBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'var(--font-headline)' }}>{lookUpData.word}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--mrf-crimson)', textTransform: 'uppercase' }}>
                {lookUpData.reading} {lookUpData.hanviet && <span style={{ background: 'var(--mrf-gold)', color: '#000', padding: '0 5px' }}>{lookUpData.hanviet}</span>}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '15px', fontSize: '16px', lineHeight: '1.5', fontWeight: '500' }}>{lookUpData.meaning}</div>
        </div>
      )}

      {/* Anime Carousel */}
      {animeResults.length > 0 && (
        <div className="anime-carousel-wrapper">
          <h2 style={{ fontSize: '24px', color: 'var(--mrf-ink)' }}>📺 Anime Context Mining</h2>
          <button className="carousel-nav left" onClick={() => scrollAnime('left')}>❮</button>
          <button className="carousel-nav right" onClick={() => scrollAnime('right')}>❯</button>
          <div className="anime-scroll" ref={animeScrollRef}>
            {animeResults.map((ex) => (
              <div key={ex.id} className="anime-card">
                <div className="anime-img-container">
                  <img
                    src={ex.image} alt="anime"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.2) contrast(1.1)' }}
                    onError={(e) => e.target.src = 'https://via.placeholder.com/300x160?text=SIGHTING+LOST'}
                  />
                  <button className="anime-play-btn" onClick={() => playAudio(ex.sound)}>▶</button>
                </div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: 'var(--mrf-ink)', marginBottom: '8px', lineHeight: '1.4' }}>{ex.sentence}</div>
                <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', borderTop: '1px solid #ddd', paddingTop: '8px' }}>{ex.translation}</div>
                <div style={{ fontSize: '10px', color: 'var(--mrf-crimson)', fontWeight: 900, marginTop: '8px', textAlign: 'right' }}>SOURCE: {ex.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Results */}
      <div style={{ paddingBottom: '100px' }}>
        <h2 style={{ fontSize: '24px' }}>🎙️ Podcast Archives</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
          {results.map((item, index) => (
            <div key={index} className="result-card" onClick={() => playAt(item)}>
              <img src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`} style={{ width: '140px', height: '80px', objectFit: 'cover', border: '2px solid var(--mrf-ink)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '15px', fontWeight: '900', color: 'var(--mrf-ink)' }}>{item.textRaw}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--mrf-crimson)' }}>{item.videoTitle.substring(0, 30)}...</div>
                  <button className="srs-btn" onClick={(e) => { e.stopPropagation(); saveCard({ id: `${item.videoId}-${item.startTime}`, word: query, text: item.textRaw, videoId: item.videoId, startTime: item.startTime }); alert('MANIFESTED IN SRS!'); }}>⭐</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
