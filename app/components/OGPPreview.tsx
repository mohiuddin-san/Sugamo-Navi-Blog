import { useState, useEffect } from 'react';

const OGPPreview = ({ url }: { url: string }) => {
  const [ogData, setOgData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOGPData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // বিকল্প CORS প্রক্সি সার্ভার
        const proxyServers = [
          `https://corsproxy.io/?${encodeURIComponent(url)}`,
          `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
          `https://thingproxy.freeboard.io/fetch/${url}`
        ];

        let success = false;
        
        // প্রতিটি প্রক্সি সার্ভার চেষ্টা করুন
        for (const proxyUrl of proxyServers) {
          try {
            console.log("Trying proxy:", proxyUrl);
            const response = await fetch(proxyUrl, {
              headers: {
                'X-Requested-With': 'XMLHttpRequest'
              }
            });
            
            if (response.ok) {
              const html = await response.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              
              const getMeta = (property: string) => 
                doc.querySelector(`meta[property="og:${property}"]`)?.getAttribute('content') || 
                doc.querySelector(`meta[name="${property}"]`)?.getAttribute('content');

              setOgData({
                title: getMeta('title') || doc.title || url,
                description: getMeta('description') || '',
                image: getMeta('image') || '',
                siteName: getMeta('site_name') || new URL(url).hostname
              });
              
              success = true;
              break;
            }
          } catch (err) {
            console.log(`Proxy ${proxyUrl} failed`, err);
          }
        }

        if (!success) {
          throw new Error("All proxies failed");
        }

      } catch (error) {
        console.error("OGP fetch error:", error);
        setError("Failed to load preview");
        // ফ্যালব্যাক ডেটা সেট করুন
        setOgData({
          title: new URL(url).hostname,
          description: '',
          image: '',
          siteName: new URL(url).hostname
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOGPData();
  }, [url]);

  if (loading) return <div className="ogp-loading">Loading preview...</div>;
  if (error) return <a href={url} target="_blank" rel="noopener">{url}</a>;

  return (
    <div className="ogp-card">
      <a href={url} target="_blank" rel="noopener noreferrer">
        {ogData?.image && (
          <div className="ogp-image-container">
            <img 
              src={ogData.image} 
              alt={ogData.title}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="ogp-content">
          <h3>{ogData?.title || url}</h3>
          {ogData?.description && <p>{ogData.description}</p>}
          <div className="ogp-url">
            <span>{ogData?.siteName || new URL(url).hostname}</span>
          </div>
        </div>
      </a>
    </div>
  );
};

export default OGPPreview;